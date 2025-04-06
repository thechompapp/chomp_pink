// src/doof-backend/routes/auth.js
import express from 'express';
import { body, validationResult } from 'express-validator';
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
  body('username', 'Username is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
];

const validateLogin = [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists(),
];

const validateUpdateAccountType = [
  body('account_type').isIn(['user', 'contributor', 'superuser']).withMessage('Invalid account type'),
];

// handleValidationErrors function remains the same...
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Auth Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Route handlers (/register, /login, /update-account-type) remain the same...
router.post('/register', validateRegister, handleValidationErrors, async (req, res, next) => {
  const { username, email, password } = req.body;
  // Use req.app.get('db') if you passed db via app.set in server.js
  // const db = req.app.get('db'); // Example if using app.set('db', ...)
  try {
    const userCheck = await db.query('SELECT id FROM Users WHERE email = $1 OR username = $2', [email, username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO Users (username, email, password_hash, account_type)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, username, email, created_at, account_type
    `;
    const newUserResult = await db.query(insertQuery, [username, email, passwordHash]);
    const newUser = newUserResult.rows[0];

    const payload = { user: { id: newUser.id } };
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
        account_type: newUser.account_type,
      },
    });
  } catch (err) {
    console.error('[AUTH /register] Server error:', err);
    next(err);
  }
});

router.post('/login', validateLogin, handleValidationErrors, async (req, res, next) => {
  const { email, password } = req.body;
  // Use req.app.get('db') if you passed db via app.set in server.js
  // const db = req.app.get('db'); // Example if using app.set('db', ...)
  try {
    const userResult = await db.query(
      'SELECT id, username, email, password_hash, created_at, account_type FROM Users WHERE email = $1',
      [email]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const payload = { user: { id: user.id } };
    const token = await new Promise((resolve, reject) => {
      jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
        if (err) reject(err);
        else resolve(token);
      });
    });

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

router.put(
  '/update-account-type/:userId',
  authMiddleware,
  validateUpdateAccountType,
  handleValidationErrors,
  async (req, res, next) => {
    const { userId } = req.params;
    const { account_type } = req.body;
    const currentUser = req.user;
    // Use req.app.get('db') if you passed db via app.set in server.js
    // const db = req.app.get('db'); // Example if using app.set('db', ...)
    try {
      const userCheck = await db.query('SELECT account_type FROM Users WHERE id = $1', [currentUser.id]);
      if (userCheck.rows.length === 0 || userCheck.rows[0].account_type !== 'superuser') {
        return res.status(403).json({ error: 'Only superusers can update account types.' });
      }

      const targetUserCheck = await db.query('SELECT id FROM Users WHERE id = $1', [userId]);
      if (targetUserCheck.rows.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const updateQuery = `
        UPDATE Users
        SET account_type = $1
        WHERE id = $2
        RETURNING id, username, email, account_type
      `;
      const result = await db.query(updateQuery, [account_type, userId]);
      const updatedUser = result.rows[0];

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        account_type: updatedUser.account_type,
      });
    } catch (err) {
      console.error('[AUTH /update-account-type] Error:', err);
      next(err);
    }
  }
);


export default router; // Keep using export default