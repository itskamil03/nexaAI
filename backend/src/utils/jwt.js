const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Signs a JWT token containing user identification claims.
 * @param {object} user - User document or payload object
 * @returns {string} Signed JWT token string
 */
const generateToken = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    referralCode: user.referralCode,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verifies a JWT token.
 * @param {string} token
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

module.exports = {
  generateToken,
  verifyToken,
};
