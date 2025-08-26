const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) {
    console.log('Authorization header tidak ditemukan');
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7, authHeader.length) : null;
  if (!token) {
    console.log('Token Bearer tidak ditemukan');
    return res.status(401).json({ message: 'Token tidak valid' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token valid, payload:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ message: 'Token tidak valid', error: err.message });
  }
};

module.exports = { authenticate };
