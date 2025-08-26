const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../utils/password');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { 
  getUserSessions, 
  revokeUserSession, 
  revokeAllOtherSessions,
  parseUserAgent 
} = require('../utils/sessionManager');

const prisma = new PrismaClient();

// Get security information
const getSecurityInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Get active sessions count
    const activeSessions = await prisma.session.count({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    // Count backup codes
    let backupCodesCount = 0;
    if (user.twoFactorBackupCodes) {
      try {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes);
        backupCodesCount = backupCodes.length;
      } catch (e) {
        backupCodesCount = 0;
      }
    }

    const securityInfo = {
      hasPassword: !!user.password,
      isGoogleAccount: !!user.googleId,
      canSetPassword: !!user.googleId && !user.password,
      emailVerified: user.isVerified,
      accountCreated: user.createdAt,
      lastUpdated: user.updatedAt,
      twoFactorEnabled: user.twoFactorEnabled,
      backupCodesCount: backupCodesCount,
      activeSessions: activeSessions,
    };

    res.json(securityInfo);
  } catch (err) {
    console.error('Get security info error:', err);
    res.status(500).json({ message: 'Gagal mengambil informasi keamanan', error: err.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // For Google accounts that don't have password yet
    if (!user.password && user.googleId) {
      if (!currentPassword || currentPassword.trim() === '') {
        // This is setting a new password for Google account
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
        return res.json({ message: 'Password berhasil dibuat' });
      }
    }

    // For accounts with existing password
    if (user.password) {
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Password saat ini tidak valid' });
      }
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Gagal mengubah password', error: err.message });
  }
};

// Enable 2FA
const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA sudah aktif' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `MyApp (${user.email})`,
      issuer: 'MyApp',
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    // Store temporary secret (will be confirmed when user verifies)
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: JSON.stringify(backupCodes)
      }
    });

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes,
      manualEntryKey: secret.base32
    });
  } catch (err) {
    console.error('Enable 2FA error:', err);
    res.status(500).json({ message: 'Gagal mengaktifkan 2FA', error: err.message });
  }
};

// Verify and confirm 2FA setup
const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: 'Setup 2FA belum dimulai' });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 1
    });

    if (verified) {
      // Enable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true }
      });
      
      res.json({ message: 'Kode 2FA valid dan berhasil diaktifkan', verified: true });
    } else {
      // Check backup codes
      if (user.twoFactorBackupCodes) {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes);
        const codeIndex = backupCodes.indexOf(token.toUpperCase());
        
        if (codeIndex !== -1) {
          // Remove used backup code and enable 2FA
          backupCodes.splice(codeIndex, 1);
          await prisma.user.update({
            where: { id: userId },
            data: { 
              twoFactorEnabled: true,
              twoFactorBackupCodes: JSON.stringify(backupCodes)
            }
          });
          
          res.json({ message: 'Backup code valid dan 2FA berhasil diaktifkan', verified: true, usedBackupCode: true });
        } else {
          res.status(400).json({ message: 'Kode 2FA tidak valid', verified: false });
        }
      } else {
        res.status(400).json({ message: 'Kode 2FA tidak valid', verified: false });
      }
    }
  } catch (err) {
    console.error('Verify 2FA error:', err);
    res.status(500).json({ message: 'Gagal memverifikasi 2FA', error: err.message });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const { password, twoFactorCode } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA tidak aktif' });
    }

    // Verify password if user has one
    if (user.password) {
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Password tidak valid' });
      }
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 1
    });

    if (!verified) {
      // Check backup codes
      if (user.twoFactorBackupCodes) {
        const backupCodes = JSON.parse(user.twoFactorBackupCodes);
        const codeIndex = backupCodes.indexOf(twoFactorCode.toUpperCase());
        
        if (codeIndex === -1) {
          return res.status(400).json({ message: 'Kode 2FA tidak valid' });
        }

        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: JSON.stringify(backupCodes) }
        });
      } else {
        return res.status(400).json({ message: 'Kode 2FA tidak valid' });
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      }
    });

    res.json({ message: '2FA berhasil dinonaktifkan' });
  } catch (err) {
    console.error('Disable 2FA error:', err);
    res.status(500).json({ message: 'Gagal menonaktifkan 2FA', error: err.message });
  }
};

// Get backup codes
const getBackupCodes = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA tidak aktif' });
    }

    const backupCodes = user.twoFactorBackupCodes ? JSON.parse(user.twoFactorBackupCodes) : [];
    res.json({ backupCodes });
  } catch (err) {
    console.error('Get backup codes error:', err);
    res.status(500).json({ message: 'Gagal mengambil backup codes', error: err.message });
  }
};

// Get active sessions
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sessions = await getUserSessions(userId);
    
    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      deviceInfo: session.deviceInfo,
      deviceType: parseUserAgent(session.userAgent).deviceType,
      ipAddress: session.ipAddress,
      location: session.location,
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
      userAgent: session.userAgent,
      isCurrent: false // We'll determine this differently since we don't store JWT tokens in sessions
    }));

    // Sort by last activity (most recent first)
    formattedSessions.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    // Mark the most recent session as current (approximation)
    if (formattedSessions.length > 0) {
      formattedSessions[0].isCurrent = true;
    }

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({ message: 'Gagal mengambil sesi aktif' });
  }
};

// Revoke specific session
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID diperlukan' });
    }

    await revokeUserSession(sessionId, userId);
    res.json({ message: 'Sesi berhasil dicabut' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ message: 'Gagal mencabut sesi' });
  }
};

// Revoke all other sessions
const revokeAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // We don't have the current session token, so we'll revoke all sessions
    // The user will need to login again
    await revokeAllOtherSessions(userId, 'dummy-token');
    res.json({ message: 'Semua sesi lain berhasil dicabut' });
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    res.status(500).json({ message: 'Gagal mencabut semua sesi' });
  }
};

// Delete account permanently
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({ message: 'Password diperlukan untuk menghapus akun' });
    }

    // Get user data
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Verify password (skip for Google-only accounts without password)
    if (user.password) {
      const { comparePassword } = require('../utils/password');
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Password tidak valid' });
      }
    } else if (user.googleId && !user.password) {
      // For Google accounts without password, we'll allow deletion with any password input
      // This is because they don't have a local password to verify
      console.log('Deleting Google account without local password');
    } else {
      return res.status(400).json({ message: 'Tidak dapat memverifikasi identitas' });
    }

    // Start transaction to delete all related data
    await prisma.$transaction(async (tx) => {
      // Delete verification tokens
      await tx.verificationToken.deleteMany({
        where: { userId }
      });

      // Delete reset password tokens
      await tx.resetPasswordToken.deleteMany({
        where: { userId }
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    // Clean up uploaded files (profile picture, etc.)
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../../uploads', user.profilePicture.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Profile picture deleted:', filePath);
        }
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      // Don't fail the deletion if file cleanup fails
    }

    console.log(`Account deleted for user: ${user.email} (ID: ${userId})`);
    res.json({ 
      message: 'Akun berhasil dihapus secara permanen',
      deletedUser: {
        email: user.email,
        deletedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ 
      message: 'Gagal menghapus akun', 
      error: err.message 
    });
  }
};

module.exports = {
  getSecurityInfo,
  changePassword,
  enable2FA,
  verify2FA,
  disable2FA,
  getBackupCodes,
  generateBackupCodes: getBackupCodes, // alias
  getActiveSessions,
  terminateSession: revokeSession,
  terminateAllSessions: revokeAllSessions,
  deleteAccount
};
