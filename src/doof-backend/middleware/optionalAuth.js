/* src/doof-backend/middleware/optionalAuth.js */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Enhanced middleware to optionally attach user info if authenticated
const optionalAuthMiddleware = (req, res, next) => {
    // Check if JWT_SECRET is configured
    if (!JWT_SECRET) {
        console.error("[Optional Auth Middleware] FATAL ERROR: JWT_SECRET is not configured!");
        // Allow request to proceed but log the server configuration error
        return next();
    }

    // Get token from header
    const authHeader = req.header('Authorization');
    console.log("[Optional Auth Middleware] Auth header:", authHeader ? "Present" : "Missing");
    
    // Extract token from Bearer format
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    console.log("[Optional Auth Middleware] Token extracted:", token ? "Present" : "Missing");

    // If no token, proceed without attaching user
    if (!token) {
        console.log("[Optional Auth Middleware] No token provided, proceeding without user.");
        return next();
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("[Optional Auth Middleware] Token verified:", !!decoded);

        // Attach user payload to request object if valid
        if (decoded.user && typeof decoded.user.id !== 'undefined') {
            req.user = decoded.user; // Assuming payload is { user: { id: ... } }
            console.log("[Optional Auth Middleware] User attached, ID:", req.user.id);
            
            // Set Cache-Control header to prevent caching of authenticated responses
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else {
            console.warn("[Optional Auth Middleware] Token decoded but user ID is missing or invalid:", decoded);
        }
        next(); // Proceed to the next handler
    } catch (err) {
        // If token is invalid (expired, malformed), just proceed without user
        console.warn("[Optional Auth Middleware] Invalid token detected, proceeding without user:", err.message);
        next();
    }
};

module.exports = optionalAuthMiddleware;