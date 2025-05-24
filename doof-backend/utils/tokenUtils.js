// File: doof-backend/utils/tokenUtils.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js'; // Use centralized config

/**
 * Generates a JWT token for a user.
 * @param {object} user - The user object, must contain id and role.
 * @returns {string} The generated JWT.
 */
export const generateAuthToken = (user) => {
  console.log('Generating token for user:', JSON.stringify(user, null, 2));
  
  if (!user) {
    console.error('No user object provided to generateAuthToken');
    throw new Error('User object is required to generate a token.');
  }
  
  if (typeof user.id === 'undefined') {
    console.error('User object missing id:', user);
    throw new Error('User ID is required to generate a token.');
  }
  
  if (typeof user.role === 'undefined') {
    console.log('No role found for user, defaulting to "user"');
    user.role = 'user'; // Default role if not specified
  }
  
  const payload = {
    id: user.id,
    role: user.role,
    // You can add more non-sensitive data to the payload if needed
  };
  
  console.log('JWT Payload:', JSON.stringify(payload, null, 2));
  console.log('JWT Secret:', config.jwtSecret ? '*** (secret exists)' : 'MISSING JWT SECRET');
  
  try {
    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiration, // Fixed: use jwtExpiration instead of jwtExpiresIn
    });
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

// Default export for backward compatibility
export default {
  generateAuthToken,
};