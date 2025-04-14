/* src/doof-backend/middleware/auth.js */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  if (!JWT_SECRET) {
    console.error("[Auth Middleware] FATAL ERROR: JWT_SECRET is not configured!");
    return res.status(500).json({ msg: 'Server configuration error.' });
  }

  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ msg: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || typeof decoded !== 'object' || !decoded.user || typeof decoded.user.id === 'undefined') {
      console.error("[Auth Middleware] Token decoded but 'user' object or 'user.id' is missing/invalid:", decoded);
      throw new Error('Invalid token payload structure');
    }

    req.user = {
        id: decoded.user.id,
        username: decoded.user.username,
        account_type: decoded.user.account_type
    };

    next();

  } catch (err) {
    console.warn("[Auth Middleware] Token verification failed:", err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Access denied. Token has expired.' });
    } else if (err.message === 'Invalid token payload structure'){
         return res.status(401).json({ msg: 'Access denied. Invalid token format.' });
    } else {
      return res.status(401).json({ msg: 'Access denied. Token is not valid.' });
    }
  }
};

export default authMiddleware;