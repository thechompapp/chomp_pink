// src/doof-backend/middleware/auth.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        account_type: string;
    }
}

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!JWT_SECRET) {
    console.error("[Auth Middleware] FATAL ERROR: JWT_SECRET is not configured!");
    res.status(500).json({ msg: 'Server configuration error.' });
    return;
  }

  const authHeader = req.header('Authorization');
  console.log(`[Auth Middleware] Request Path: ${req.method} ${req.originalUrl}`);
  console.log(`[Auth Middleware] Received Authorization Header: ${authHeader ? `Present (Type: ${authHeader.split(' ')[0]})` : 'Missing'}`);
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    console.log("[Auth Middleware] Access denied: No token provided.");
    res.status(401).json({ msg: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log("[Auth Middleware] Token verified successfully. Decoded payload:", decoded);
    
    if (!decoded.user || typeof decoded.user.id === 'undefined') {
      console.error("[Auth Middleware] Token decoded but user ID is missing or invalid in payload:", decoded);
      throw new Error('Invalid token payload');
    }
    
    req.user = decoded.user;
    console.log(`[Auth Middleware] Attaching req.user object:`, req.user);

    next();
  } catch (err: any) {
    console.warn("[Auth Middleware] Token verification failed:", err.message);
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ msg: 'Access denied. Token has expired.' });
    } else {
      res.status(401).json({ msg: 'Access denied. Token is not valid.' });
    }
  }
};

export default authMiddleware;