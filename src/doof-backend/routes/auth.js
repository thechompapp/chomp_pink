/* src/doof-backend/routes/auth.js */
import express from 'express';
import { body, validationResult, param } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Import user model functions
import * as UserModel from '../models/userModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("\n\nFATAL ERROR: JWT_SECRET environment variable is not set!\nAuth will not function.\n\n");
    // Optionally exit: process.exit(1);
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1d'; // Default to 1 day expiry

// --- Helper to format user data for responses ---
const formatUserForResponse = (user) => {
    if (!user) return null;
    // Exclude password hash
    const { password_hash, ...userData } = user;
    return {
        ...userData,
        account_type: userData.account_type || 'user' // Ensure default
    };
};

// --- Middleware & Validation Chains ---
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[Auth Route Validation Error] Path: ${req.path}`, errors.array());
    // Return only the first error message for simplicity
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Validation for Registration
const validateRegister = [
  body('username', 'Username is required').trim().notEmpty().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  // Optional: Add password confirmation check if needed on backend
  // body('confirmPassword').custom((value, { req }) => { ... })
];

// Validation for Login
const validateLogin = [
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password is required').exists(),
];

// Validation for Account Type Update
const validateAccountTypeUpdate = [
    param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer'),
    body('account_type').isIn(['user', 'contributor', 'superuser']).withMessage('Invalid account type specified')
];

// --- Routes ---

// POST /api/auth/register
router.post('/register', validateRegister, handleValidationErrors, async (req, res, next) => {
  const { username, email, password } = req.body;
  console.log(`[Auth Register] Attempting registration for email: ${email}, username: ${username}`);
  try {
    // Check if user exists using model
    const existingEmail = await UserModel.findUserByEmail(email);
    if (existingEmail) {
      console.warn(`[Auth Register] Failed: Email ${email} already exists.`);
      return res.status(400).json({ error: 'User with this email already exists.' });
    }
    const existingUsername = await UserModel.findUserByUsername(username);
     if (existingUsername) {
      console.warn(`[Auth Register] Failed: Username ${username} already exists.`);
      return res.status(400).json({ error: 'User with this username already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10); // Use appropriate salt rounds

    // Create user using model
    const newUser = await UserModel.createUser(username, email, passwordHash);
    console.log(`[Auth Register] User created successfully: ID ${newUser.id}`);

    // Generate JWT
    const payload = {
      user: {
        id: newUser.id,
        username: newUser.username,
        account_type: newUser.account_type,
      },
    };

    // Ensure JWT_SECRET exists before signing
     if (!JWT_SECRET) throw new Error('JWT Secret not configured.');

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    console.log(`[Auth Register] JWT generated for user ID ${newUser.id}`);

    // Format and send response
    res.status(201).json({
        data: {
            token,
            user: formatUserForResponse(newUser)
        }
    });
  } catch (err) {
      console.error("[Auth Register] Error:", err);
      next(err); // Pass to global error handler
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, handleValidationErrors, async (req, res, next) => {
  const { email, password } = req.body;
   console.log(`[Auth Login] Attempting login for email: ${email}`);
  try {
    // Find user by email using model
    const user = await UserModel.findUserByEmail(email);
    if (!user) {
        console.warn(`[Auth Login] Failed: User not found for email: ${email}`);
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        console.warn(`[Auth Login] Failed: Password mismatch for email: ${email}`);
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
     console.log(`[Auth Login] Login successful for user ID ${user.id}`);

    // Generate JWT
    const payload = {
       user: {
         id: user.id,
         username: user.username,
         account_type: user.account_type,
       },
     };

     if (!JWT_SECRET) throw new Error('JWT Secret not configured.');

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
     console.log(`[Auth Login] JWT generated for user ID ${user.id}`);

    // Format and send response
    res.json({
        data: {
            token,
            user: formatUserForResponse(user)
        }
    });
  } catch (err) {
      console.error("[Auth Login] Error:", err);
      next(err);
  }
});

// PUT /api/auth/update-account-type/:userId
router.put(
  '/update-account-type/:userId',
  authMiddleware, // Requires valid token
  requireSuperuser, // Requires superuser privileges
  validateAccountTypeUpdate, // Validate params and body
  handleValidationErrors,
  async (req, res, next) => {
    const { userId } = req.params;
    const { account_type } = req.body; // Validated account_type
    const requestingUserId = req.user.id;

     console.log(`[Auth Update Type] Superuser ${requestingUserId} attempting to set user ${userId} to type: ${account_type}`);

     if (String(requestingUserId) === String(userId)) {
          console.warn(`[Auth Update Type] Failed: Superuser ${requestingUserId} cannot change their own account type.`);
          return res.status(403).json({ error: 'Superusers cannot change their own account type via this route.' });
     }

    try {
        // Check if target user exists using model
        const targetUser = await UserModel.findUserById(userId);
        if (!targetUser) {
             console.warn(`[Auth Update Type] Failed: Target user ${userId} not found.`);
             return res.status(404).json({ error: 'Target user not found.' });
        }

        // Update user using model
        const updatedUser = await UserModel.updateUserAccountType(userId, account_type);
         if (!updatedUser) {
              // Should not happen if user exists, but handle defensively
              throw new Error(`Update failed for user ${userId}, no user returned after update.`);
         }
         console.log(`[Auth Update Type] Successfully updated user ${userId} to type: ${account_type}`);

        res.json({
            data: formatUserForResponse(updatedUser) // Format the updated user for response
        });
    } catch (err) {
         console.error(`[Auth Update Type] Error updating user ${userId}:`, err);
         next(err);
    }
  }
);

export default router;