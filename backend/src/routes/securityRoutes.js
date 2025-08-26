const express = require('express');
const { 
  getSecurityInfo,
  enable2FA,
  disable2FA,
  generateBackupCodes,
  getActiveSessions,
  terminateSession,
  terminateAllSessions,
  deleteAccount
} = require('../controllers/securityController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Security info and 2FA management
router.get('/security-info', authenticate, getSecurityInfo);
router.post('/enable-2fa', authenticate, enable2FA);
router.post('/disable-2fa', authenticate, disable2FA);
router.post('/generate-backup-codes', authenticate, generateBackupCodes);

// Session management
router.get('/active-sessions', authenticate, getActiveSessions);
router.delete('/sessions/:sessionId', authenticate, terminateSession);
router.delete('/sessions', authenticate, terminateAllSessions);

// Danger zone
router.delete('/delete-account', authenticate, deleteAccount);

module.exports = router;
