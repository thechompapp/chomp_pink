// Filename: /root/doof-backend/middleware/auth.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Corrected import path for config.js */
/* ADDED: verifyListOwnership middleware */
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import UserModel from '../models/userModel.js';
import { ListModel } from '../models/listModel.js'; // Import ListModel (ensure it uses named export or adjust import)

// --- Generate Token ---
export const generateToken = (user) => {
    // ... (existing code) ...
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        account_type: user.account_type || 'user'
    };
     if (!config || !config.JWT_SECRET) {
         console.error("FATAL: JWT_SECRET not found in config for token generation!");
         throw new Error("Server configuration error: JWT secret missing.");
     }
    return jwt.sign({ user: payload }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRATION,
    });
};

// --- Require Authentication Middleware ---
export const requireAuth = async (req, res, next) => {
    // ... (existing code) ...
    const authHeader = req.headers.authorization;
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
        if (!decoded || !decoded.user || !decoded.user.id) {
             console.warn('[requireAuth] Invalid token payload structure:', decoded);
             return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token payload.' });
        }
         req.user = decoded.user; // Attach user info from token payload
        next();
    } catch (error) {
        console.error('[requireAuth] Authentication error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token expired.' });
        }
         if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token.' });
        }
        next(error); // Pass other errors
    }
};

// --- NEW: Verify List Ownership Middleware ---
/**
 * Middleware to verify if the authenticated user owns the list specified by ':id' param.
 * Attaches the fetched list object (raw) to req.list if ownership is verified.
 * Requires requireAuth to run first.
 */
export const verifyListOwnership = async (req, res, next) => {
    const listIdParam = req.params.id || req.params.listId; // Handle different param names if needed
    const userId = req.user?.id; // Assumes requireAuth ran first

    if (!userId) {
        // Should not happen if requireAuth is used, but good defense
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    if (!listIdParam) {
        console.warn('[verifyListOwnership] Missing list ID parameter in route.');
        return res.status(400).json({ success: false, message: "Missing list ID in request path." });
    }

    const listId = parseInt(listIdParam, 10);
    if (isNaN(listId) || listId <= 0) {
        return res.status(400).json({ success: false, message: "Invalid list ID format." });
    }

    try {
        // Fetch the raw list data including the user_id
        const listRaw = await ListModel.findListByIdRaw(listId);

        if (!listRaw) {
            return res.status(404).json({ success: false, message: `List not found.` }); // Use 404
        }

        // Check ownership
        if (listRaw.user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Permission denied. You do not own this list.' });
        }

        // Attach the fetched list data to the request object for the controller to use
        req.list = listRaw; // Attach the raw list data
        next(); // Proceed to the next middleware/controller

    } catch (error) {
        console.error(`[verifyListOwnership] Error verifying ownership for list ${listId}, user ${userId}:`, error);
        // Pass error to the global error handler or handle directly
        res.status(500).json({ success: false, message: 'Error verifying list ownership.' });
        // next(error); // Alternative
    }
};

// Note: requireSuperuser should be in its own file
// Note: optionalAuth should be in its own file