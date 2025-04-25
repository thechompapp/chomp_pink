// Filename: /root/doof-backend/middleware/auth.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Corrected import path for config.js */
import jwt from 'jsonwebtoken';
import config from '../config/config.js'; // *** CORRECTED PATH ***
import UserModel from '../models/userModel.js'; // Use import, add .js extension

// --- Generate Token (Keep using named export) ---
export const generateToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email, // Include email if needed in token (consider size/security)
        account_type: user.account_type || 'user' // Include account type
    };
    // Ensure config object and JWT_SECRET are loaded correctly
     if (!config || !config.JWT_SECRET) {
         console.error("FATAL: JWT_SECRET not found in config for token generation!");
         // Handle this critical error appropriately - maybe throw?
         throw new Error("Server configuration error: JWT secret missing.");
     }
    return jwt.sign({ user: payload }, config.JWT_SECRET, { // Embed user object under 'user' key
        expiresIn: config.JWT_EXPIRATION,
    });
};


// --- Authentication Middleware (Keep using named export) ---
export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Ensure config object and JWT_SECRET are loaded correctly
     if (!config || !config.JWT_SECRET) {
         console.error("FATAL: JWT_SECRET not found in config for token verification!");
         return res.status(500).json({ success: false, message: "Server configuration error."});
     }


    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Attach decoded user payload to the request object
        // Ensure the payload structure matches token generation (e.g., decoded.user)
        if (!decoded || !decoded.user || !decoded.user.id) {
             console.warn('[requireAuth] Invalid token payload structure:', decoded);
             return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token payload.' });
        }

        // Optional: Fetch fresh user data to ensure user still exists/is active
        // const user = await UserModel.findUserById(decoded.user.id);
        // if (!user) {
        //     return res.status(401).json({ success: false, message: 'Unauthorized: User not found.' });
        // }
        // // Attach potentially fresher user data (excluding password hash)
        // req.user = { id: user.id, username: user.username, email: user.email, account_type: user.account_type };

        // Or just attach the decoded payload if fetching fresh data isn't required on every request
         req.user = decoded.user; // Attach user info from token payload

        next(); // Proceed to the next middleware/route handler

    } catch (error) {
        console.error('[requireAuth] Authentication error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token expired.' });
        }
         if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token.' });
        }
        // Pass other errors to the global error handler
        next(error);
    }
};

// Note: requireSuperuser should be in its own file and was handled previously.
// Note: optionalAuth should be in its own file. If it was previously part of this file,
// ensure it's moved and exported correctly from its own file.