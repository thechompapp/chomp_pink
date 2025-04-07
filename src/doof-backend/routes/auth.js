// src/doof-backend/routes/auth.js
import express from 'express';
import { body, validationResult, param } from 'express-validator'; // Added param
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Corrected imports using relative paths
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// JWT_SECRET logic remains the same...
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
  process.exit(1);
}

// Validation arrays remain the same...
const validateRegister = [
  body('username', 'Username is required').not().isEmpty().trim(), // Added trim
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
];

const validateLogin = [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists(),
];

const validateUpdateAccountType = [
  param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer'), // Added userId validation
  body('account_type').isIn(['user', 'contributor', 'superuser']).withMessage('Invalid account type'),
];

// handleValidationErrors function remains the same...
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Auth Validation Error]", req.path, errors.array());
    // Return only the first error message for simplicity
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// --- POST /api/auth/register --- (No changes needed here)
router.post('/register', validateRegister, handleValidationErrors, async (req, res, next) => {
  const { username, email, password } = req.body;
  const currentDb = req.app?.get('db') || db;

  try {
    const userCheck = await currentDb.query(
        'SELECT id FROM Users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)',
        [email, username]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO Users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at, account_type
    `;
    const newUserResult = await currentDb.query(insertQuery, [username, email, passwordHash]);
    const newUser = newUserResult.rows[0];

    const payload = {
        user: {
            id: newUser.id,
            username: newUser.username,
            account_type: newUser.account_type
        }
    };
    const token = await new Promise((resolve, reject) => {
      jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
        if (err) reject(err);
        else resolve(token);
      });
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.created_at,
        account_type: newUser.account_type || 'user',
      },
    });
  } catch (err) {
    console.error('[AUTH /register] Server error:', err);
    next(err);
  }
});

// --- POST /api/auth/login --- (Added Debug Logging)
router.post('/login', validateLogin, handleValidationErrors, async (req, res, next) => {
  const { email, password } = req.body;
  const currentDb = req.app?.get('db') || db;
  console.log(`[AUTH /login] Attempting login for email: ${email}`); // Log entry

  try {
    const userResult = await currentDb.query(
      'SELECT id, username, email, password_hash, created_at, account_type FROM Users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.warn(`[AUTH /login] User not found for email: ${email}`); // Log user not found
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const user = userResult.rows[0];
    console.log(`[AUTH /login] User found: ID ${user.id}, Email: ${user.email}`); // Log user found

    // --- TEMPORARY DEBUG LOGGING ---
    console.log(`[AUTH /login DEBUG] Comparing provided password with hash from DB: "${user.password_hash}"`);
    let isMatch = false;
    try {
         isMatch = await bcrypt.compare(password, user.password_hash);
         console.log(`[AUTH /login DEBUG] bcrypt.compare result: ${isMatch}`); // Log comparison result
    } catch(compareError) {
         console.error(`[AUTH /login DEBUG] bcrypt.compare threw an error:`, compareError);
         // Handle compare error specifically, maybe return 500?
         return res.status(500).json({ error: 'Password comparison failed.' });
    }
    // --- END DEBUG LOGGING ---

    if (!isMatch) {
      console.warn(`[AUTH /login] Password mismatch for user ID ${user.id}`); // Log mismatch
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Password matched, proceed with JWT generation
    console.log(`[AUTH /login] Password matched for user ID ${user.id}. Generating token...`);
    const payload = {
        user: {
            id: user.id,
            username: user.username,
            account_type: user.account_type || 'user'
        }
     };
    const token = await new Promise((resolve, reject) => {
      jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
        if (err) reject(err);
        else resolve(token);
      });
    });

    console.log(`[AUTH /login] Login successful for user ID ${user.id}.`);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        account_type: user.account_type || 'user',
      },
    });
  } catch (err) {
    console.error('[AUTH /login] Caught error:', err);
    next(err);
  }
});

// --- PUT /api/auth/update-account-type/:userId --- (No changes needed here)
router.put(
  '/update-account-type/:userId',
  authMiddleware,
  validateUpdateAccountType,
  handleValidationErrors,
  async (req, res, next) => {
    const { userId } = req.params;
    const { account_type } = req.body;
    const currentUser = req.user;
    const currentDb = req.app?.get('db') || db;

    try {
      const adminCheck = await currentDb.query('SELECT account_type FROM Users WHERE id = $1', [currentUser.id]);
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].account_type !== 'superuser') {
        return res.status(403).json({ error: 'Forbidden: Only superusers can update account types.' });
      }

      const targetUserCheck = await currentDb.query('SELECT id FROM Users WHERE id = $1', [userId]);
      if (targetUserCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Target user not found.' });
      }

      const updateQuery = `
        UPDATE Users
        SET account_type = $1
        WHERE id = $2
        RETURNING id, username, email, account_type
      `;
      const result = await currentDb.query(updateQuery, [account_type, userId]);
      const updatedUser = result.rows[0];

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        account_type: updatedUser.account_type,
      });
    } catch (err) {
      console.error(`[AUTH /update-account-type/${userId}] Error:`, err);
      next(err);
    }
  }
);


export default router;