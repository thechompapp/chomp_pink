// src/doof-backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db'); // Assuming db/index.js is set up

const router = express.Router();

// Load JWT secret from environment variables (IMPORTANT: Set this in your .env file)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
    process.exit(1); // Exit if secret is not set
}

// Validation Middleware
const validateRegister = [
    body('username').trim().notEmpty().withMessage('Username is required.').isLength({ min: 3 }).withMessage('Username must be at least 3 characters.'),
    body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
];

const validateLogin = [
    body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- Registration Route ---
router.post('/register', validateRegister, handleValidationErrors, async (req, res) => {
    const { username, email, password } = req.body;
    console.log(`[AUTH /register] Attempting registration for email: ${email}`);

    try {
        // 1. Check if user already exists (by email or username)
        const userCheck = await db.query('SELECT id FROM Users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            console.warn(`[AUTH /register] Registration failed: Email or Username already exists for ${email}`);
            return res.status(400).json({ errors: [{ msg: 'User with this email or username already exists.' }] });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        console.log(`[AUTH /register] Password hashed for ${email}`);

        // 3. Insert new user into the database
        const insertQuery = 'INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at';
        const newUserResult = await db.query(insertQuery, [username, email, passwordHash]);
        const newUser = newUserResult.rows[0];
        console.log(`[AUTH /register] User registered successfully: ${newUser.email} (ID: ${newUser.id})`);

        // 4. Generate JWT Token
        const payload = { user: { id: newUser.id } }; // Include user ID in the token payload
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token expires in 1 hour (adjust as needed)
            (err, token) => {
                if (err) throw err;
                console.log(`[AUTH /register] JWT generated for user ID: ${newUser.id}`);
                // Send user info (without password hash) and token back
                res.status(201).json({
                    token,
                    user: { id: newUser.id, username: newUser.username, email: newUser.email, createdAt: newUser.created_at }
                 });
            }
        );

    } catch (err) {
        console.error('[AUTH /register] Server error:', err);
        res.status(500).json({ errors: [{ msg: 'Server error during registration.' }] });
    }
});

// --- Login Route ---
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH /login] Attempting login for email: ${email}`);

    try {
        // 1. Find user by email
        const userResult = await db.query('SELECT id, username, email, password_hash, created_at FROM Users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
             console.warn(`[AUTH /login] Login failed: User not found for ${email}`);
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials.' }] }); // Generic message
        }
        const user = userResult.rows[0];

        // 2. Compare submitted password with stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
             console.warn(`[AUTH /login] Login failed: Incorrect password for ${email}`);
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials.' }] }); // Generic message
        }
        console.log(`[AUTH /login] Password matched for ${email}`);

        // 3. Generate JWT Token
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Match registration expiration or adjust
            (err, token) => {
                if (err) throw err;
                console.log(`[AUTH /login] JWT generated for user ID: ${user.id}`);
                // Send user info (without password hash) and token back
                res.json({
                     token,
                     user: { id: user.id, username: user.username, email: user.email, createdAt: user.created_at }
                 });
            }
        );

    } catch (err) {
        console.error('[AUTH /login] Server error:', err);
        res.status(500).json({ errors: [{ msg: 'Server error during login.' }] });
    }
});

module.exports = router;