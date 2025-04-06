// src/doof-backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db'); // Assuming db/index.js is set up

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1);
}

// Validation Middleware
const validateRegister = [
    body('username', 'Username is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];
const validateLogin = [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists()
];
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Log validation errors for debugging
        console.warn("[Auth Validation Error]", req.path, errors.array());
        // Return only the first error message for a cleaner response
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// --- Registration Route ---
router.post('/register', validateRegister, handleValidationErrors, async (req, res, next) => { // Added next
    const { username, email, password } = req.body;

    try {
        const userCheck = await db.query('SELECT id FROM Users WHERE email = $1 OR username = $2', [email, username]);

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email or username already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const insertQuery = 'INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at';
        const newUserResult = await db.query(insertQuery, [username, email, passwordHash]);
        const newUser = newUserResult.rows[0];

        const payload = { user: { id: newUser.id } };
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '8h' }, // Example: 8 hours
            (err, token) => {
                if (err) {
                    // Let centralized handler catch JWT errors
                    throw err;
                }
                res.status(201).json({
                    token,
                    user: { id: newUser.id, username: newUser.username, email: newUser.email, createdAt: newUser.created_at }
                 });
            }
        );

    } catch (err) {
        console.error('[AUTH /register] Server error:', err);
        // Pass error to centralized handler instead of sending response directly
        next(err);
    }
});

// --- Login Route ---
router.post('/login', validateLogin, handleValidationErrors, async (req, res, next) => { // Added next
    const { email, password } = req.body;

    try {
        const userResult = await db.query('SELECT id, username, email, password_hash, created_at FROM Users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '8h' }, // Match registration expiration
            (err, token) => {
                if (err) {
                    throw err; // Let centralized handler catch JWT errors
                }
                res.json({
                     token,
                     user: { id: user.id, username: user.username, email: user.email, createdAt: user.created_at }
                 });
            }
        );

    } catch (err) {
        console.error('[Auth /login] Caught error:', err); // Keep basic error logging
        // Pass error to centralized handler
        next(err);
    }
});

module.exports = router;