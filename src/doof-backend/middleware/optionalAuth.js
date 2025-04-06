// src/doof-backend/middleware/optionalAuth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const optionalAuthMiddleware = (req, res, next) => {
  if (!JWT_SECRET) {
    console.error("[Optional Auth Middleware] FATAL ERROR: JWT_SECRET is not configured!");
    return next();
  }

  const authHeader = req.header('Authorization');
  console.log("[Optional Auth Middleware] Auth header:", authHeader ? "Present" : "Missing");
  
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  console.log("[Optional Auth Middleware] Token extracted:", token ? "Present" : "Missing");

  if (!token) {
    console.log("[Optional Auth Middleware] No token provided, proceeding without user.");
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("[Optional Auth Middleware] Token verified:", !!decoded);

    if (decoded.user && typeof decoded.user.id !== 'undefined') {
      req.user = decoded.user;
      console.log("[Optional Auth Middleware] User attached, ID:", req.user.id);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      console.warn("[Optional Auth Middleware] Token decoded but user ID is missing or invalid:", decoded);
    }
    next();
  } catch (err) {
    console.warn("[Optional Auth Middleware] Invalid token detected, proceeding without user:", err.message);
    next();
  }
};

export default optionalAuthMiddleware;