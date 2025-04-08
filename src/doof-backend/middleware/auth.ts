// src/doof-backend/middleware/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  if (!JWT_SECRET) {
    console.error("[Auth Middleware] FATAL ERROR: JWT_SECRET is not configured!");
    return res.status(500).json({ msg: 'Server configuration error.' });
  }

  const authHeader = req.header('Authorization');
  console.log(`[Auth Middleware] Request Path: ${req.method} ${req.originalUrl}`);
  console.log(`[Auth Middleware] Received Authorization Header: ${authHeader ? `Present (Type: ${authHeader.split(' ')[0]})` : 'Missing'}`);
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    console.log("[Auth Middleware] Access denied: No token provided.");
    return res.status(401).json({ msg: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[Auth Middleware] Token verified successfully. Decoded payload:", decoded);
    req.user = decoded.user;
    console.log(`[Auth Middleware] Attaching req.user object:`, req.user);

    if (!req.user || typeof req.user.id === 'undefined') {
      console.error("[Auth Middleware] Token decoded but user ID is missing or invalid in payload:", decoded);
      throw new Error('Invalid token payload');
    }

    next();
  } catch (err) {
    console.warn("[Auth Middleware] Token verification failed:", err.message);
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ msg: 'Access denied. Token has expired.' });
    } else {
      res.status(401).json({ msg: 'Access denied. Token is not valid.' });
    }
  }
};

export default authMiddleware;