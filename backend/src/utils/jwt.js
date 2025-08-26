const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const roleName = user.role && user.role.name ? user.role.name : 'USER';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: roleName,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };