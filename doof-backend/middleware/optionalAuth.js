/* src/doof-backend/middleware/optionalAuth.js */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const optionalAuthMiddleware = (req, res, next) => {
  if (!JWT_SECRET) {
     console.warn("[Optional Auth Middleware] JWT_SECRET is not configured. Cannot verify token.");
     return next();
  }

  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded && typeof decoded === 'object' && decoded.user &&
        typeof decoded.user.id === 'number' &&
        typeof decoded.user.username === 'string' &&
        typeof decoded.user.account_type === 'string')
    {
      req.user = {
          id: decoded.user.id,
          username: decoded.user.username,
          account_type: decoded.user.account_type
      };
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      console.warn("[Optional Auth Middleware] Token decoded but user payload structure is invalid:", decoded);
    }
    next();

  } catch (err) {
    console.warn("[Optional Auth Middleware] Invalid token detected, proceeding without user:", err.message);
    next();
  }
};

export default optionalAuthMiddleware;