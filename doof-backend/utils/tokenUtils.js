// File: doof-backend/utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Use centralized config

/**
 * Generates a JWT token for a user.
 * @param {object} user - The user object, must contain id and role.
 * @returns {string} The generated JWT.
 */
const generateAuthToken = (user) => {
  if (!user || typeof user.id === 'undefined' || typeof user.role === 'undefined') {
    throw new Error('User ID and Role are required to generate a token.');
  }
  const payload = {
    id: user.id,
    role: user.role,
    // You can add more non-sensitive data to the payload if needed
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

module.exports = {
  generateAuthToken,
};