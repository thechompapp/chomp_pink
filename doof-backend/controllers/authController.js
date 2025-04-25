// Filename: /root/doof-backend/controllers/authController.js
/* REFACTORED: Convert to ES Modules */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js'; // Uses ESM default export
import config from '../config/config.js'; // Uses ESM default export
import { validationResult } from 'express-validator';
import { formatUser } from '../utils/formatters.js'; // Named export now exists

// Placeholder for token utils logic if not in separate file
const generateAccessToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        account_type: user.account_type,
    };
     if (!config || !config.JWT_SECRET) { throw new Error("Server configuration error: JWT secret missing."); }
    return jwt.sign({ user: payload }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
};

const generateRefreshToken = (user) => {
     if (!config || !config.REFRESH_TOKEN_SECRET) { throw new Error("Server configuration error: Refresh token secret missing."); }
    return jwt.sign({ id: user.id }, config.REFRESH_TOKEN_SECRET, { expiresIn: config.REFRESH_TOKEN_EXPIRATION });
};

const verifyRefreshToken = (token) => {
     if (!config || !config.REFRESH_TOKEN_SECRET) { throw new Error("Server configuration error: Refresh token secret missing."); }
    return jwt.verify(token, config.REFRESH_TOKEN_SECRET); // Throws standard jwt errors
};
// --- End Placeholder ---

// Controller function for user registration
export const register = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) });
    }
    const { username, email, password } = req.body;
    try {
        // UserModel functions now use named exports based on model refactor
        const existingUser = await UserModel.findUserByUsername(username) || await UserModel.findUserByEmail(email); // Check both
        if (existingUser) {
             let conflictField = (existingUser.username.toLowerCase() === username.toLowerCase()) ? 'Username' : 'Email';
            return res.status(409).json({ success: false, message: `${conflictField} already exists.` });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await UserModel.createUser(username, email, hashedPassword); // Use createUser
        const formattedUser = formatUser(newUser); // Format for response
        const accessToken = generateAccessToken(formattedUser);
        const refreshToken = generateRefreshToken(formattedUser);
        // TODO: Store refresh token securely
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.status(201).json({ success: true, message: 'User registered successfully.', data: { user: formattedUser, token: accessToken } });
    } catch (error) { next(error); }
};

// Controller function for user login
export const login = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) });
    }
    const { loginIdentifier, password } = req.body; // Changed to loginIdentifier from previous CJS version
    try {
        // UserModel functions now use named exports
        // Find by email first, then username? Or adjust model.findByUsernameOrEmail
        const user = await UserModel.findUserByEmail(loginIdentifier) || await UserModel.findUserByUsername(loginIdentifier);
        if (!user || !user.password_hash) { // Ensure password hash exists
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user.password_hash); // Use bcrypt.compare
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        const formattedUser = formatUser(user); // Format non-sensitive data
        const accessToken = generateAccessToken(formattedUser);
        const refreshToken = generateRefreshToken(formattedUser);
        // TODO: Store refresh token securely
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 });
        res.json({ success: true, message: 'Login successful.', data: { user: formattedUser, token: accessToken } });
    } catch (error) { next(error); }
};

// Controller function to check authentication status
export const getStatus = async (req, res, next) => {
    // requireAuth middleware attaches req.user
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required but user not found.' });
    }
    try {
        // Use the user data from the token (already verified by requireAuth)
        const formattedUser = formatUser(req.user);
        res.json({ success: true, message: 'User is authenticated.', data: { user: formattedUser } });
    } catch (error) { next(error); }
};

// Controller function to refresh token
export const refreshToken = async (req, res, next) => {
     const incomingRefreshToken = req.cookies?.refreshToken;
     if (!incomingRefreshToken) { return res.status(401).json({ success: false, message: 'Refresh token not provided.' }); }
     try {
         const decoded = verifyRefreshToken(incomingRefreshToken);
         // Optional: Check if token is revoked/invalid in DB
         const user = await UserModel.findUserById(decoded.id); // Use findUserById
         if (!user) { return res.status(403).json({ success: false, message: 'Invalid refresh token (user not found).' }); }
         const formattedUser = formatUser(user);
         const newAccessToken = generateAccessToken(formattedUser);
         res.json({ success: true, token: newAccessToken, user: formattedUser });
     } catch (error) {
         if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
             return res.status(403).json({ success: false, message: `Invalid or expired refresh token (${error.name}).` });
         }
         next(error);
     }
};

// Controller function for logout
export const logout = async (req, res, next) => {
    // const refreshToken = req.cookies?.refreshToken; // Get token if needed for DB invalidation
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    // Optional: Invalidate token in DB here
    res.status(200).json({ success: true, message: 'Logout successful.' });
};

// Controller function to update account type (Admin)
export const updateAccountType = async (req, res, next) => {
     // Validation handled by middleware
     const { userId } = req.params;
     const { account_type } = req.body;
     const numericUserId = parseInt(userId, 10);
     try {
         const updatedUser = await UserModel.updateUserAccountType(numericUserId, account_type); // Use updateUserAccountType
         if (!updatedUser) { return res.status(404).json({ success: false, message: 'User not found.' }); }
         res.json({ success: true, message: 'Account type updated successfully.', data: formatUser(updatedUser) });
     } catch (error) { next(error); }
 };

// Export as an object for default import in route
const authController = {
    register,
    login,
    getStatus,
    refreshToken,
    logout,
    updateAccountType
};
export default authController;