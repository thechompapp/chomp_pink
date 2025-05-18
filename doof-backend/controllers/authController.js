// File: doof-backend/controllers/authController.js

const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const { validationResult } = require('express-validator');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { generateAuthToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger'); // For any specific logging not covered by sendError

// User registration
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Concatenate error messages for a clearer response detail
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return sendError(res, 'Validation failed.', 400, 'VALIDATION_ERROR', { message: errorMessages, errors: errors.array() });
  }

  const { username, email, password, role } = req.body;

  try {
    let user = await UserModel.findByEmail(email);
    if (user) {
      return sendError(res, 'User already exists with this email.', 409, 'USER_ALREADY_EXISTS');
    }

    if (username) { // check if username is provided
        let userByUsername = await UserModel.findByUsername(username);
        if (userByUsername) {
          return sendError(res, 'User already exists with this username.', 409, 'USERNAME_ALREADY_EXISTS');
        }
    }


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      role: role || 'user', // Default role to 'user' if not provided
    };

    const createdUser = await UserModel.create(newUser);
    
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

  } catch (error) {
    // The 'originalError' in sendError will be logged by the responseHandler's logger
    sendError(res, 'Error registering user.', 500, 'REGISTRATION_FAILED', error);
  }
};

// User login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return sendError(res, 'Validation failed.', 400, 'VALIDATION_ERROR', { message: errorMessages, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return sendError(res, 'Invalid credentials: User not found.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials: Password incorrect.', 401, 'INVALID_CREDENTIALS');
    }
    
    // Ensure user contains id and role for token generation
    if (typeof user.id === 'undefined' || typeof user.role === 'undefined') {
        logger.error('User login successful but id/role missing in user object from DB', user);
        return sendError(res, 'Login failed due to an internal issue retrieving user details.', 500, 'LOGIN_INTERNAL_ERROR');
    }

    const token = generateAuthToken(user);

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

// User logout (currently a simple success response as per original logic)
// If token blocklisting or server-side session clearing were implemented,
// this would be the place for that logic.
exports.logout = (req, res) => {
  // Original logic: // res.clearCookie('token'); // Example if using cookies
  // Currently, token is client-side managed. Server acknowledges logout.
  try {
    // Perform any server-side logout actions if necessary in the future
    // For now, just acknowledge.
    sendSuccess(res, {}, 'Logout successful. Please clear your token on the client-side.');
  } catch (error) {
    sendError(res, 'Error during logout.', 500, 'LOGOUT_FAILED', error);
  }
};

// Get current user profile (example of a protected route)
exports.getMe = async (req, res) => {
  try {
    // req.user is attached by authMiddleware
    if (!req.user || !req.user.id) {
      return sendError(res, 'User not authenticated or user ID missing.', 401, 'NOT_AUTHENTICATED');
    }
    
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found.', 404, 'USER_NOT_FOUND');
    }

    // Send back a safe subset of user information
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
    sendSuccess(res, userProfile, 'User profile fetched successfully.');

  } catch (error) {
    sendError(res, 'Error fetching user profile.', 500, 'PROFILE_FETCH_FAILED', error);
  }
};