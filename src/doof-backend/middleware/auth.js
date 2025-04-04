// src/doof-backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    if (!JWT_SECRET) {
        console.error("[Auth Middleware] FATAL ERROR: JWT_SECRET is not configured!");
        return res.status(500).json({ msg: 'Server configuration error.' });
    }

    // Get token from header
    const authHeader = req.header('Authorization');
    // *** ADD LOG: Log received header ***
    console.log(`[Auth Middleware] Request Path: ${req.method} ${req.originalUrl}`);
    console.log(`[Auth Middleware] Received Authorization Header: ${authHeader ? `Present (Type: ${authHeader.split(' ')[0]})` : 'Missing'}`);
    // *** END LOG ***
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        console.log("[Auth Middleware] Access denied: No token provided.");
        // Decide if 401 is appropriate or if route should handle missing auth
        // For '/api/lists' specifically, authentication is required to filter by user
        return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        // *** ADD LOG: Log decoded payload ***
        console.log("[Auth Middleware] Token verified successfully. Decoded payload:", decoded);
        // *** END LOG ***

        // Add user payload to request object
        req.user = decoded.user; // Assuming payload is { user: { id: ... } }
        // *** ADD LOG: Log attached req.user ***
        console.log(`[Auth Middleware] Attaching req.user object:`, req.user);
        // *** END LOG ***

        if (!req.user || typeof req.user.id === 'undefined') {
             console.error("[Auth Middleware] Token decoded but user ID is missing or invalid in payload:", decoded);
             throw new Error('Invalid token payload');
        }

        next(); // Proceed to the next handler
    } catch (err) {
        console.warn("[Auth Middleware] Token verification failed:", err.message);
        // Differentiate between expired and other errors if needed
        if (err.name === 'TokenExpiredError') {
             res.status(401).json({ msg: 'Access denied. Token has expired.' });
        } else {
             res.status(401).json({ msg: 'Access denied. Token is not valid.' });
        }
    }
};

module.exports = authMiddleware;