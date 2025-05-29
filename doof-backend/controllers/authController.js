// File: doof-backend/controllers/authController.js

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import TokenBlacklist from '../models/tokenBlacklistModel.js';
import { validationResult } from 'express-validator';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { generateAuthToken } from '../utils/tokenUtils.js';
import logger from '../utils/logger.js'; // For any specific logging not covered by sendError
import config from '../config/config.js'; // Import config for JWT secret

// User registration
export const register = async (req, res) => {
  // Check if this is a test request
  const isTestRequest = req.headers['x-test-mode'] === 'true';
  const isTestEnv = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
  
  // Log the registration attempt for debugging
  console.log(`Registration attempt ${isTestRequest || isTestEnv ? '(TEST MODE)' : ''}:`, {
    email: req.body.email,
    username: req.body.username,
    testMode: isTestRequest || isTestEnv
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Concatenate error messages for a clearer response detail
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return sendError(res, 'Validation failed.', 400, 'VALIDATION_ERROR', { message: errorMessages, errors: errors.array() });
  }

  const { username, email, password, role } = req.body;

// DEBUG: Log plain password received (remove after confirming hashing works)
console.log('[DEBUG] Plain password received:', password);

  try {
    let user = await UserModel.findUserByEmail(email);
    if (user) {
      return sendError(res, 'User already exists with this email.', 409, 'USER_ALREADY_EXISTS');
    }

    if (username) { // check if username is provided
        let userByUsername = await UserModel.findByUsername(username);
        if (userByUsername) {
          return sendError(res, 'User already exists with this username.', 409, 'USERNAME_ALREADY_EXISTS');
        }
    }

    const newUser = {
      username,
      email,
      password,
      role: role || 'user', // Default role to 'user' if not provided
    };

    // DEBUG: Log before hashing
    console.log('[DEBUG] About to hash password for:', email);
    const createdUser = await UserModel.create(newUser);
    // DEBUG: After user creation, check if hash was generated (do not log hash directly for security)
    if (createdUser) {
      console.log('[DEBUG] User created with ID:', createdUser.id, 'and email:', createdUser.email);
    } else {
      console.log('[DEBUG] User creation failed for email:', email);
    }
    
    // Ensure createdUser contains id and role for token generation
    if (!createdUser || typeof createdUser.id === 'undefined' || typeof createdUser.role === 'undefined') {
        logger.error('User creation succeeded but id/role missing in returned object', createdUser);
        return sendError(res, 'User registration failed due to an internal issue.', 500, 'REGISTRATION_INTERNAL_ERROR');
    }

    const token = generateAuthToken(createdUser);

    // Do not send back password or other sensitive fields not needed by client
    const userResponse = {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
    };

    sendSuccess(res, { token, user: userResponse }, 'User registered successfully.', 201);
console.log('[DEBUG] Registration process completed for:', email);

  } catch (error) {
    console.error('Registration error:', error);
    // The 'originalError' in sendError will be logged by the responseHandler's logger
    sendError(res, 'Error registering user.', 500, 'REGISTRATION_FAILED', error);
  }
};

// User login
export const login = async (req, res) => {
  // Check if this is a test request
  const isTestRequest = req.headers['x-test-mode'] === 'true';
  const isTestEnv = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
  
  // Log the login attempt for debugging
  console.log(`Login attempt ${isTestRequest || isTestEnv ? '(TEST MODE)' : ''}:`, {
    email: req.body.email,
    testMode: isTestRequest || isTestEnv
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return sendError(res, 'Validation failed.', 400, 'VALIDATION_ERROR', { message: errorMessages, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
      return sendError(res, 'Invalid credentials: User not found.', 401, 'INVALID_CREDENTIALS');
    }
    
    console.log('User found:', user.email, user.id);
    
    if (!user.password_hash) {
      console.error('No password hash found for user:', user.id);
      return sendError(res, 'Authentication error: No password set for this user.', 500, 'AUTH_ERROR');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials: Password incorrect.', 401, 'INVALID_CREDENTIALS');
    }
    
    if (typeof user.id === 'undefined') {
        logger.error('User login successful but id is missing in user object from DB', user);
        return sendError(res, 'Login failed: User ID is missing.', 500, 'LOGIN_INTERNAL_ERROR');
    }
    
    // Ensure user has a role, default to 'user' if not set
    if (typeof user.role === 'undefined') {
        console.log('No role found for user, defaulting to "user"');
        user.role = 'user';
    }
    
    let token;
    try {
        token = generateAuthToken(user);
        console.log('Token generated successfully');
    } catch (error) {
        logger.error('Error generating auth token:', error);
        return sendError(res, 'Failed to generate authentication token.', 500, 'TOKEN_GENERATION_ERROR');
    }

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      // Add other relevant, non-sensitive fields if needed
    };
    
    sendSuccess(res, { token, user: userResponse }, 'Login successful.');

  } catch (error) {
    sendError(res, 'Error logging in.', 500, 'LOGIN_FAILED', error);
  }
};

/**
 * User logout - Invalidates the current token by adding it to the blacklist
 */
export const logout = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
  
  if (!token) {
    return sendSuccess(res, {}, 'No token provided. User already logged out.');
  }

  try {
    // Verify the token to get expiration time
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Add token to blacklist until it expires
    if (decoded.exp) {
      const expiresAt = new Date(decoded.exp * 1000); // Convert to JS timestamp
      await TokenBlacklist.addToBlacklist(token, expiresAt);
      console.log(`Token blacklisted until ${expiresAt}`);
    } else {
      // If no expiration, blacklist for 1 hour as a fallback
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
      await TokenBlacklist.addToBlacklist(token, oneHourFromNow);
      console.log(`Token blacklisted for 1 hour`);
    }
    
    // Clear the token cookie if it exists
    if (req.cookies?.token) {
      res.clearCookie('token');
    }
    
    sendSuccess(res, {}, 'Logout successful. Your session has been terminated.');
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      // If the token is invalid or expired, we can still consider the logout successful
      // since the token is effectively invalidated
      return sendSuccess(res, {}, 'Logout successful. Your session has been terminated.');
    }
    console.error('Error during logout:', error);
    sendError(res, 'Error during logout.', 500, 'LOGOUT_FAILED', error);
  }
};

// Get current user profile (example of a protected route)
export const getMe = async (req, res) => {
  try {
    console.log('getMe - Request user:', req.user); // Log the user object from the request
    
    // req.user is attached by authMiddleware
    if (!req.user || !req.user.id) {
      console.error('getMe - Missing or invalid user in request');
      return sendError(res, 'User not authenticated or user ID missing.', 401, 'NOT_AUTHENTICATED');
    }
    
    console.log(`getMe - Looking up user with ID: ${req.user.id}`);
    const user = await UserModel.findUserById(req.user.id);
    
    if (!user) {
      console.error(`getMe - User not found with ID: ${req.user.id}`);
      return sendError(res, 'User not found.', 404, 'USER_NOT_FOUND');
    }

    console.log('getMe - Found user:', { id: user.id, email: user.email });
    
    // Send back a safe subset of user information
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
    
    console.log('getMe - Sending response with user profile');
    sendSuccess(res, userProfile, 'User profile fetched successfully.');

  } catch (error) {
    console.error('getMe - Error:', error);
    console.error('Error stack:', error.stack);
    sendError(res, 'Error fetching user profile.', 500, 'PROFILE_FETCH_FAILED', error);
  }
};

// Get authentication status
// This endpoint will use the optionalAuth middleware to check if the user is authenticated
export const getAuthStatus = async (req, res) => {
  try {
    // Check if this is a test request
    const isTestRequest = req.headers['x-test-mode'] === 'true';
    const isTestEnv = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
    
    console.log(`Auth status check ${isTestRequest || isTestEnv ? '(TEST MODE)' : ''}:`, {
      authenticated: !!req.user,
      testMode: isTestRequest || isTestEnv
    });
    
    // If the user is authenticated, the middleware will attach req.user
    if (req.user) {
      // User is authenticated, send back user info
      const userProfile = {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role || req.user.account_type,
        isAuthenticated: true
      };
      
      sendSuccess(res, userProfile, 'User is authenticated.');
    } else {
      // User is not authenticated
      sendSuccess(res, { isAuthenticated: false }, 'User is not authenticated.');
    }
  } catch (error) {
    sendError(res, 'Error checking authentication status.', 500, 'AUTH_STATUS_CHECK_FAILED', error);
  }
};

// Add the refreshTokenController function that is imported in auth.js
export const refreshTokenController = async (req, res) => {
  try {
    // Implement refresh token logic here
    // This is a placeholder since the route exists but the function is missing
    sendSuccess(res, { message: 'Token refresh endpoint (implementation pending)' });
  } catch (error) {
    sendError(res, 'Error refreshing token.', 500, 'TOKEN_REFRESH_FAILED', error);
  }
};