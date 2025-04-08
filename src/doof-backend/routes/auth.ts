// src/doof-backend/middleware/auth.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
export interface AuthenticatedRequest extends Request { // Export if needed elsewhere
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
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ msg: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded.user || typeof decoded.user.id !== 'number' || typeof decoded.user.username !== 'string' || typeof decoded.user.account_type !== 'string') {
      console.error("[Auth Middleware] Token decoded but user payload is missing or invalid:", decoded);
      throw new Error('Invalid token payload');
    }

    req.user = { // Assign validated structure
        id: decoded.user.id,
        username: decoded.user.username,
        account_type: decoded.user.account_type
    };
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