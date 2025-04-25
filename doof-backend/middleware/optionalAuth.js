// Filename: /root/doof-backend/middleware/optionalAuth.js
/* Updated: Ensure ESM export syntax and config import */
import jwt from 'jsonwebtoken';
import config from '../config/config.js'; // Import config correctly

const optionalAuthMiddleware = (req, res, next) => {
  // Use config.JWT_SECRET safely
  const secret = config?.JWT_SECRET;
  if (!secret) {
     console.warn("[Optional Auth Middleware] JWT_SECRET is not configured. Cannot verify token.");
     return next(); // Proceed without user info if secret is missing
  }

  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(); // No token provided, proceed without user
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Validate the decoded payload structure more robustly
    if (decoded && typeof decoded === 'object' && decoded.user &&
        typeof decoded.user.id === 'number' &&
        typeof decoded.user.username === 'string' &&
        typeof decoded.user.account_type === 'string')
    {
      // Attach only necessary, validated fields
      req.user = {
          id: decoded.user.id,
          username: decoded.user.username,
          account_type: decoded.user.account_type
      };
      // Optional: Log successful optional auth
      // console.log(`[Optional Auth] User ID ${req.user.id} authenticated.`);

      // Set cache headers only if user is attached? Might be better elsewhere.
      // res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      // res.setHeader('Pragma', 'no-cache');
      // res.setHeader('Expires', '0');
    } else {
      console.warn("[Optional Auth Middleware] Token decoded but user payload structure is invalid:", decoded);
      // Do not attach partial/invalid user object
    }
    next(); // Proceed regardless of valid user payload in optional auth

  } catch (err) {
    // Token exists but is invalid (expired, wrong signature, etc.)
    // Do not attach user, just proceed
    console.warn("[Optional Auth Middleware] Invalid token detected, proceeding without user:", err.message);
    next();
  }
};

export default optionalAuthMiddleware; // Use export default