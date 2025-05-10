// doof-backend/controllers/authController.js
import UserModel from '../models/userModel.js';
import { generateToken, generateRefreshToken as generateRefresh } from '../middleware/auth.js'; // generateToken is imported
import config from '../config/config.js'; // Used for cookie expiration, not directly for JWT secret here
import db from '../db/index.js';

export const register = async (req, res, next) => {
    const { username, email, password } = req.body;
    try {
        const existingUserByEmail = await UserModel.findUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }
        const newUser = await UserModel.createUser(username, email, password);
        if (!newUser) {
            return res.status(500).json({ success: false, message: 'User registration failed.' });
        }

        const token = generateToken(newUser); // This will throw if jwtSecret is missing in config
        const refreshTokenVal = await generateRefresh(newUser.id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: config.jwtCookieExpiration,
        });
         res.cookie('refreshToken', refreshTokenVal, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/api/auth/refresh-token',
            maxAge: config.refreshTokenCookieExpiration,
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                account_type: newUser.account_type
            },
        });
    } catch (error) {
        console.error('[AuthController Register] Error:', error);
        // Check if it's the specific JWT secret error from generateToken
        if (error.message === 'JWT secret is not configured.') {
            return res.status(500).json({ success: false, message: 'Internal server error: Authentication system not configured.' });
        }
        if (error.message.includes('already exists')) {
            return res.status(409).json({ success: false, message: error.message });
        }
        next(error);
    }
};

export const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials: User not found.' });
        }

        const isMatch = await UserModel.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials: Password incorrect.' });
        }

        const token = generateToken(user); // This will throw if jwtSecret is missing in config
        const refreshTokenVal = await generateRefresh(user.id);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: config.jwtCookieExpiration,
        });
         res.cookie('refreshToken', refreshTokenVal, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/api/auth/refresh-token',
            maxAge: config.refreshTokenCookieExpiration,
        });

        res.status(200).json({
            success: true,
            message: 'Logged in successfully.',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                account_type: user.account_type
            },
        });
    } catch (error) {
        console.error('[AuthController Login] Error:', error);
        if (error.message === 'JWT secret is not configured.') {
            return res.status(500).json({ success: false, message: 'Internal server error: Authentication system not configured.' });
        }
        next(error);
    }
};

export const logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0),
    });
    res.cookie('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/api/auth/refresh-token',
        expires: new Date(0),
    });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

export const refreshTokenController = async (req, res, next) => {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token not found.' });
    }

    try {
        const tokenRecordQuery = 'SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1';
        const { rows } = await db.query(tokenRecordQuery, [incomingRefreshToken]);

        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Invalid refresh token.' });
        }

        const tokenRecord = rows[0];
        if (new Date(tokenRecord.expires_at) < new Date()) {
            await db.query('DELETE FROM refresh_tokens WHERE token = $1', [incomingRefreshToken]);
            return res.status(403).json({ success: false, message: 'Refresh token expired.' });
        }

        const user = await UserModel.findUserById(tokenRecord.user_id);
        if (!user) {
            return res.status(403).json({ success: false, message: 'User associated with refresh token not found.' });
        }

        const newAccessToken = generateToken(user); // This will throw if jwtSecret is missing

        res.cookie('token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: config.jwtCookieExpiration,
        });

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully.',
        });
    } catch (error) {
        console.error('[AuthController RefreshToken] Error:', error);
        if (error.message === 'JWT secret is not configured.') {
            return res.status(500).json({ success: false, message: 'Internal server error: Authentication system not configured.' });
        }
        next(error);
    }
};

export const getAuthStatus = (req, res) => {
    if (req.user) {
        res.status(200).json({
            success: true,
            message: 'User is authenticated.',
            data: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                account_type: req.user.account_type
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'User is not authenticated.' });
    }
};
