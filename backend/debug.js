const securityController = require('./src/controllers/securityController');
console.log('Security Controller exports:', Object.keys(securityController));
console.log('getSecurityInfo:', typeof securityController.getSecurityInfo);
console.log('enable2FA:', typeof securityController.enable2FA);
console.log('disable2FA:', typeof securityController.disable2FA);
console.log('generateBackupCodes:', typeof securityController.generateBackupCodes);
console.log('getActiveSessions:', typeof securityController.getActiveSessions);
console.log('terminateSession:', typeof securityController.terminateSession);
console.log('terminateAllSessions:', typeof securityController.terminateAllSessions);
