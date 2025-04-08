// src/doof-backend/middleware/optionalAuth.ts
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
interface OptionalAuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        account_type: string;
    }
}

const JWT_SECRET = process.env.JWT_SECRET;

const optionalAuthMiddleware = (req: OptionalAuthRequest, res: Response, next: NextFunction): void => {
  if (!JWT_SECRET) {
    return next(); // Proceed without auth if secret is missing
  }

  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(); // Proceed without user
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (decoded.user && typeof decoded.user.id === 'number' && typeof decoded.user.username === 'string' && typeof decoded.user.account_type === 'string') {
      req.user = { // Assign validated structure
          id: decoded.user.id,
          username: decoded.user.username,
          account_type: decoded.user.account_type
      };
      // Set cache headers if needed for authenticated optional requests
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      console.warn("[Optional Auth Middleware] Token decoded but user payload is missing or invalid:", decoded);
    }
    next();
  } catch (err: any) {
    console.warn("[Optional Auth Middleware] Invalid token detected, proceeding without user:", err.message);
    next();
  }
};

export default optionalAuthMiddleware;