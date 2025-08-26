const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Generate unique session token
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Parse user agent to get device info
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { deviceType: 'Unknown', deviceInfo: 'Unknown Device' };

  const ua = userAgent.toLowerCase();
  let deviceType = 'desktop';
  let deviceInfo = 'Unknown Device';

  // Detect device type
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

  // Extract browser and OS info
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';

  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios')) os = 'iOS';

  deviceInfo = `${os} - ${browser}`;

  return { deviceType, deviceInfo };
};

// Get approximate location from IP (placeholder - in production use IP geolocation service)
const getLocationFromIP = (ipAddress) => {
  // Placeholder - in production, use services like:
  // - IPStack
  // - MaxMind GeoIP
  // - IP2Location
  if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
    return 'Local Development';
  }
  return 'Unknown Location';
};

// Create new session
const createSession = async (userId, req) => {
  try {
    const sessionToken = generateSessionToken();
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const { deviceType, deviceInfo } = parseUserAgent(userAgent);
    const location = getLocationFromIP(ipAddress);

    // Set session expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await prisma.session.create({
      data: {
        userId,
        sessionToken,
        ipAddress,
        userAgent,
        deviceInfo,
        location,
        expiresAt,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Update session activity
const updateSessionActivity = async (sessionToken) => {
  try {
    await prisma.session.update({
      where: { sessionToken },
      data: { lastActivity: new Date() },
    });
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
};

// Get user's active sessions
const getUserSessions = async (userId) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });

    return sessions;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
};

// Revoke specific session
const revokeSession = async (sessionId, userId) => {
  try {
    await prisma.session.update({
      where: {
        id: sessionId,
        userId, // Ensure user can only revoke their own sessions
      },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    console.error('Error revoking session:', error);
    throw error;
  }
};

// Revoke all other sessions (except current)
const revokeAllOtherSessions = async (userId, currentSessionToken) => {
  try {
    await prisma.session.updateMany({
      where: {
        userId,
        sessionToken: {
          not: currentSessionToken,
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  } catch (error) {
    console.error('Error revoking all sessions:', error);
    throw error;
  }
};

// Clean up expired sessions
const cleanupExpiredSessions = async () => {
  try {
    await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false },
        ],
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
};

// Validate session token
const validateSession = async (sessionToken) => {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    // Update last activity
    await updateSessionActivity(sessionToken);

    return session;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
};

module.exports = {
  generateSessionToken,
  parseUserAgent,
  getLocationFromIP,
  createSession,
  updateSessionActivity,
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
  cleanupExpiredSessions,
  validateSession,
};
