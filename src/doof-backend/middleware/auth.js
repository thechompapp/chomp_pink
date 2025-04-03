// src/doof-backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// Load JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
    // Check if JWT_SECRET is loaded correctly
    if (!JWT_SECRET) {
        console.error("[Auth Middleware] JWT_SECRET is not configured!");
        return res.status(500).json({ msg: 'Server configuration error.' });
    }

    // Get token from header (format: "Bearer <token>")
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Check if no token
    if (!token) {
        console.log("[Auth Middleware] Access denied: No token provided.");
        // Allow access for specific safe methods like GET on public resources if needed,
        // otherwise deny access. For simplicity here, we deny if no token.
        return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Add user payload (containing user id) from token to request object
        req.user = decoded.user; // Assuming payload is { user: { id: ... } }
        console.log(`[Auth Middleware] Token verified for user ID: ${req.user?.id}`);

        if (!req.user || typeof req.user.id === 'undefined') {
             console.error("[Auth Middleware] Token decoded but user ID is missing in payload:", decoded);
             throw new Error('Invalid token payload');
        }

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.warn("[Auth Middleware] Token verification failed:", err.message);
        res.status(401).json({ msg: 'Access denied. Token is not valid.' });
    }
};

module.exports = authMiddleware;