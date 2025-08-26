const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { register, login, verifyEmail, forgotPassword, resetPassword, uploadProfilePicture, editProfile, googleLogin, checkGoogleAccount, googleLoginDirect, verifyGoogleLogin2FA, getMe, changePassword, getNotificationPreferences, updateNotificationPreferences } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const fileUpload = require('../utils/fileUpload');
const router = express.Router();

const upload = fileUpload.upload;

// Middleware untuk memverifikasi token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Received Authorization header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token payload:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ message: 'Token tidak valid', error: err.message });
  }
};

// Rute
// Middleware untuk menangani error multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    // Jika error dari multer (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
    }
    if (err.message.includes('file gambar')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'Error saat mengunggah file: ' + err.message });
  }
  next();
};

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/upload-profile-picture', authenticate, upload.single('profilePicture'), handleMulterError, uploadProfilePicture);
router.put('/edit-profile', authenticate, editProfile);
router.post('/edit-profile', authenticate, editProfile); // Fallback untuk kompatibilitas
router.put('/change-password', authenticate, changePassword);
router.get('/check-google-account', verifyToken, checkGoogleAccount);
router.post('/google-login-direct', googleLoginDirect); // Hapus verifyToken
router.post('/verify-google-2fa', verifyGoogleLogin2FA); // New route for Google 2FA verification
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
    }
    if (!user) {
      console.log('Google OAuth failed, info:', info);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=google-auth-failed`);
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error logging in user:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=login-failed`);
      }
      return googleLogin(req, res);
    });
  })(req, res, next);
});
router.get('/me', verifyToken, getMe);

// Notification preferences routes
router.get('/notification-preferences', verifyToken, getNotificationPreferences);
router.put('/notification-preferences', verifyToken, updateNotificationPreferences);

module.exports = router;