const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/email');
const { convertToWebP } = require('../utils/fileUpload');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { createSession } = require('../utils/sessionManager');
const prisma = new PrismaClient();

const register = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email sudah terdaftar' });

    const hashedPassword = await hashPassword(password);
    
    const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!userRole) {
      return res.status(500).json({ message: 'Role USER tidak ditemukan. Silakan hubungi administrator.' });
    }

    const firstName = name ? name.split(' ')[0] : '';
    const lastName = name ? name.split(' ').slice(1).join(' ') : '';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        firstName,
        lastName,
        roleId: userRole.id,
      },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await prisma.verificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({ message: 'User berhasil dibuat. Silakan cek email untuk verifikasi.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password, twoFactorCode } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) return res.status(404).json({ message: 'Email tidak ditemukan' });

    if (!user.isVerified) return res.status(400).json({ message: 'Email belum diverifikasi' });

    if (!user.password) {
      return res.status(400).json({ message: 'Akun ini dibuat dengan Google. Silakan login menggunakan Google.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Kata sandi salah' });

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Return special response indicating 2FA is required
        return res.json({
          requiresTwoFactor: true,
          message: 'Masukkan kode 2FA untuk melanjutkan'
        });
      }

      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1
      });

      if (!verified) {
        // Check backup codes if TOTP fails
        if (user.twoFactorBackupCodes) {
          const backupCodes = JSON.parse(user.twoFactorBackupCodes);
          const codeIndex = backupCodes.indexOf(twoFactorCode.toUpperCase());
          
          if (codeIndex === -1) {
            return res.status(400).json({ message: 'Kode 2FA tidak valid' });
          }

          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) }
          });
        } else {
          return res.status(400).json({ message: 'Kode 2FA tidak valid' });
        }
      }
    }

    // Create session for successful login
    try {
      await createSession(user.id, req);
    } catch (sessionError) {
      console.error('Error creating session:', sessionError);
      // Continue with login even if session creation fails
    }

    const token = generateToken(user);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        jobTitle: user.jobTitle,
        company: user.company,
        bio: user.bio,
        location: user.location,
        website: user.website,
        role: user.role.name, 
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      return res.status(400).json({ message: 'Token verifikasi tidak valid' });
    }

    if (verificationToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token verifikasi telah kedaluwarsa' });
    }

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { isVerified: true },
    });

    await prisma.verificationToken.delete({
      where: { token },
    });

    res.json({ message: 'Email berhasil diverifikasi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ message: 'Email tidak ditemukan' });
    }

    if (!user.password && user.googleId) {
      return res.status(400).json({ 
        message: 'Akun ini dibuat dengan Google. Silakan login menggunakan Google atau set password terlebih dahulu.' 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    
    await prisma.resetPasswordToken.upsert({
      where: { userId: user.id },
      update: {
        token: resetToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
      create: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    });

    await sendResetPasswordEmail(user.email, resetToken);

    res.json({ message: 'Email reset password telah dikirim' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const resetToken = await prisma.resetPasswordToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return res.status(400).json({ message: 'Token reset password tidak valid' });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Token reset password telah kedaluwarsa' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.resetPasswordToken.delete({
      where: { token },
    });

    res.json({ message: 'Password berhasil direset' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    const userId = req.user.id;
    
    const webpFilename = await convertToWebP(req.file, 'profile');

    await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: `/uploads/profile/${webpFilename}` },
    });

    res.json({
      message: 'Foto profil berhasil diupload',
      profilePicture: `/uploads/profile/${webpFilename}`,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Gagal upload foto profil', error: err.message });
  }
};

const editProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      firstName, 
      lastName, 
      phone, 
      jobTitle, 
      company, 
      bio, 
      location, 
      website 
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        phone,
        jobTitle,
        company,
        bio,
        location,
        website,
      },
      include: { role: true },
    });

    res.json({
      message: 'Profil berhasil diperbarui',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        jobTitle: updatedUser.jobTitle,
        company: updatedUser.company,
        bio: updatedUser.bio,
        location: updatedUser.location,
        website: updatedUser.website,
        role: updatedUser.role.name,
        profilePicture: updatedUser.profilePicture,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (err) {
    console.error('Edit profile error:', err);
    res.status(500).json({ message: 'Gagal memperbarui profil', error: err.message });
  }
};

const googleLogin = async (req, res) => {
  if (req.user) {
    if (!req.user.googleId) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
    }

    if (!req.user.email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
    }

    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
      include: { role: true },
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      console.log('Google OAuth user has 2FA enabled, redirecting to login for 2FA verification');
      // Store user info in session for later verification
      req.session.pendingGoogleUser = {
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        jobTitle: user.jobTitle,
        company: user.company,
        bio: user.bio,
        location: user.location,
        website: user.website,
        profilePicture: user.profilePicture
      };
      
      // Redirect to login with a flag indicating 2FA is needed for Google user
      return res.redirect(`${process.env.FRONTEND_URL}/login?google2fa=required`);
    }

    const token = generateToken(user);
    const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?token=${token}&googleId=${user.googleId}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}&firstName=${encodeURIComponent(user.firstName || '')}&lastName=${encodeURIComponent(user.lastName || '')}&phone=${encodeURIComponent(user.phone || '')}&jobTitle=${encodeURIComponent(user.jobTitle || '')}&company=${encodeURIComponent(user.company || '')}&bio=${encodeURIComponent(user.bio || '')}&location=${encodeURIComponent(user.location || '')}&website=${encodeURIComponent(user.website || '')}&profilePicture=${encodeURIComponent(user.profilePicture || '')}`;
    res.redirect(redirectUrl);
  } else {
    const redirectUrl = `${process.env.FRONTEND_URL}/login?error=google-auth-failed`;
    res.redirect(redirectUrl);
  }
};

const checkGoogleAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(200).json({ hasGoogleAccount: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      return res.status(200).json({ hasGoogleAccount: false });
    }

    if (user.googleId) {
      return res.status(200).json({
        hasGoogleAccount: true,
        googleAccount: {
          email: user.email,
          name: user.name,
          googleId: user.googleId,
        },
      });
    }

    return res.status(200).json({ hasGoogleAccount: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const googleLoginDirect = async (req, res) => {
  try {
    const { googleId, twoFactorCode } = req.body;
    console.log('Google Login Direct called with:', { googleId, twoFactorCode });

    if (!googleId) {
      return res.status(400).json({ message: 'googleId tidak ditemukan' });
    }

    const user = await prisma.user.findUnique({
      where: { googleId: googleId },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    console.log('User found:', { email: user.email, twoFactorEnabled: user.twoFactorEnabled });

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      console.log('2FA is enabled for this user');
      if (!twoFactorCode) {
        console.log('No 2FA code provided, requesting 2FA');
        // Return special response indicating 2FA is required
        return res.json({
          requiresTwoFactor: true,
          message: 'Masukkan kode 2FA untuk melanjutkan'
        });
      }

      console.log('Verifying 2FA code:', twoFactorCode);
      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1
      });

      if (!verified) {
        console.log('TOTP verification failed, checking backup codes');
        // Check backup codes if TOTP fails
        if (user.twoFactorBackupCodes) {
          const backupCodes = JSON.parse(user.twoFactorBackupCodes);
          const codeIndex = backupCodes.indexOf(twoFactorCode.toUpperCase());
          
          if (codeIndex === -1) {
            console.log('Backup code verification also failed');
            return res.status(400).json({ message: 'Kode 2FA tidak valid' });
          }

          console.log('Backup code verified, removing used code');
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) }
          });
        } else {
          console.log('No backup codes available');
          return res.status(400).json({ message: 'Kode 2FA tidak valid' });
        }
      } else {
        console.log('2FA code verified successfully');
      }
    } else {
      console.log('2FA is not enabled for this user');
    }

    const token = generateToken(user);
    console.log('Login successful, generating token');
    res.json({
      message: 'Berhasil login dengan Google.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        jobTitle: user.jobTitle,
        company: user.company,
        bio: user.bio,
        location: user.location,
        website: user.website,
        role: user.role.name,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error('Google login direct error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat login dengan Google', error: err.message });
  }
};

const verifyGoogleLogin2FA = async (req, res) => {
  try {
    const { twoFactorCode } = req.body;
    
    if (!req.session.pendingGoogleUser) {
      return res.status(400).json({ message: 'Sesi Google login tidak ditemukan. Silakan login ulang.' });
    }

    const pendingUser = req.session.pendingGoogleUser;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { googleId: pendingUser.googleId },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: 'User tidak memiliki 2FA yang aktif' });
    }

    if (!twoFactorCode) {
      return res.status(400).json({ message: 'Kode 2FA diperlukan' });
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1
    });

    if (!verified) {
      // Check backup codes if TOTP fails
      if (user.twoFactorBackupCodes) {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes);
        const codeIndex = backupCodes.indexOf(twoFactorCode.toUpperCase());
        
        if (codeIndex === -1) {
          return res.status(400).json({ message: 'Kode 2FA tidak valid' });
        }

        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(backupCodes) }
        });
      } else {
        return res.status(400).json({ message: 'Kode 2FA tidak valid' });
      }
    }

    // Clear pending user from session
    delete req.session.pendingGoogleUser;

    const token = generateToken(user);
    res.json({
      message: 'Berhasil login dengan Google.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        jobTitle: user.jobTitle,
        company: user.company,
        bio: user.bio,
        location: user.location,
        website: user.website,
        role: user.role.name,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      jobTitle: user.jobTitle,
      company: user.company,
      bio: user.bio,
      location: user.location,
      website: user.website,
      role: user.role.name,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data user', error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    let message = '';

    // For Google accounts that don't have password yet
    if (!user.password && user.googleId) {
      if (!currentPassword || currentPassword.trim() === '') {
        // This is setting a new password for Google account
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
        message = 'Password berhasil dibuat untuk akun Google Anda';
        return res.json({ message });
      }
    }

    // For accounts with existing password
    if (user.password) {
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Password saat ini tidak valid' });
      }
      message = 'Password berhasil diubah';
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengubah password', error: err.message });
  }
};

const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get or create notification preferences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });

    // If preferences don't exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: { userId }
      });
    }

    res.json(preferences);
  } catch (err) {
    console.error('Error getting notification preferences:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil preferensi notifikasi', error: err.message });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      emailNotifications, 
      pushNotifications, 
      marketingEmails, 
      weeklyDigest,
      browserNotifications,
      productUpdates,
      systemMaintenance,
      newsletters,
      emailFrequency,
      digestFrequency
    } = req.body;

    // Security alerts cannot be disabled, so we don't update it
    const updateData = {};
    
    // Only update fields that are provided
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;
    if (weeklyDigest !== undefined) updateData.weeklyDigest = weeklyDigest;
    if (browserNotifications !== undefined) updateData.browserNotifications = browserNotifications;
    if (productUpdates !== undefined) updateData.productUpdates = productUpdates;
    if (systemMaintenance !== undefined) updateData.systemMaintenance = systemMaintenance;
    if (newsletters !== undefined) updateData.newsletters = newsletters;
    if (emailFrequency !== undefined) updateData.emailFrequency = emailFrequency;
    if (digestFrequency !== undefined) updateData.digestFrequency = digestFrequency;

    // Use upsert to create or update preferences
    const updatedPreferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData
      }
    });

    res.json(updatedPreferences);
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengupdate preferensi notifikasi', error: err.message });
  }
};

module.exports = { 
  register, 
  login, 
  verifyEmail, 
  forgotPassword, 
  resetPassword, 
  uploadProfilePicture, 
  editProfile, 
  googleLogin, 
  checkGoogleAccount, 
  googleLoginDirect, 
  verifyGoogleLogin2FA,
  getMe, 
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences
};
