// doof-backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import UserModel from '../models/userModel.js';
import db from '../db/index.js';
import { ListModel } from '../models/listModel.js';

export const requireAuth = async (req, res, next) => {
  // Check for development bypass headers
  const bypassAuth = req.headers['x-bypass-auth'] === 'true';
  const isPlacesApiRequest = req.headers['x-places-api-request'] === 'true';
  
  // Allow bypass in development mode or for Places API requests with the right headers
  if (process.env.NODE_ENV === 'development' && (bypassAuth || isPlacesApiRequest)) {
    console.log('[Auth Middleware] Bypassing authentication for development or Places API request');
    // Set a default user for development
    req.user = {
      id: 1, // Default to admin user
      username: 'dev_user',
      email: 'dev@example.com',
      account_type: 'superuser' // Grant superuser access in dev mode
    };
    return next();
  }
  
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token is missing.' });
  }

  try {
    if (!config.jwtSecret) {
        console.error('[requireAuth] JWT_SECRET is not configured!');
        return res.status(500).json({ success: false, message: 'Internal server error: JWT secret not configured.' });
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await UserModel.findUserById(decoded.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token: User not found.' });
    }
    req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        account_type: user.account_type || 'user'
    };
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to authenticate token.'});
  }
};

export const requireSuperuser = (req, res, next) => {
  if (!req.user || req.user.account_type !== 'superuser') {
    return res.status(403).json({ success: false, message: 'Access denied: Superuser privileges required.' });
  }
  next();
};

export const requireContributor = (req, res, next) => {
    if (!req.user || (req.user.account_type !== 'contributor' && req.user.account_type !== 'superuser')) {
        return res.status(403).json({ success: false, message: 'Access denied: Contributor or Superuser privileges required.' });
    }
    next();
};

export const verifyListAccess = async (req, res, next) => {
  const listId = parseInt(req.params.id, 10);
  const userId = req.user ? req.user.id : null;

  if (isNaN(listId)) {
    return res.status(400).json({ success: false, message: 'Invalid List ID format.' });
  }
  try {
    const list = await ListModel.findListByIdRaw(listId);
    if (!list) {
      return res.status(404).json({ success: false, message: 'List not found.' });
    }
    if (list.is_public) {
      req.list = list;
      return next();
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to access this private list.' });
    }
    if (list.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this private list.' });
    }
    req.list = list;
    next();
  } catch (error) {
    console.error(`Error in verifyListAccess middleware for list ${listId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error verifying list access.' });
  }
};

export const verifyListOwnership = async (req, res, next) => {
  const listIdParam = req.params.id || req.params.listId || req.body.list_id || req.query.list_id;
  const listId = parseInt(listIdParam, 10);
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (isNaN(listId)) {
    return res.status(400).json({ success: false, message: 'Invalid or missing List ID.' });
  }
  try {
    const list = await ListModel.findListByIdRaw(listId);
    if (!list) {
      return res.status(404).json({ success: false, message: 'List not found.' });
    }
    if (list.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this list.' });
    }
    req.list = list;
    next();
  } catch (error) {
    console.error(`Error in verifyListOwnership middleware for list ${listId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error verifying list ownership.' });
  }
};

export const generateToken = (user) => {
  if (!config.jwtSecret) {
    console.error('FATAL ERROR in generateToken: JWT_SECRET is not defined!');
    throw new Error('JWT secret is not configured.');
  }
  const payload = {
    user: {
      id: user.id,
      email: user.email,
      account_type: user.account_type || 'user'
    }
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiration });
};

export const generateRefreshToken = async (userId) => {
    const { randomUUID } = await import('node:crypto');
    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(config.refreshTokenExpirationDays || '7', 10));

    try {
        // This query now works correctly if user_id has a UNIQUE constraint
        await db.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at',
            [userId, refreshToken, expiresAt]
        );
        return refreshToken;
    } catch (error) {
        console.error("Error saving refresh token:", error);
        throw new Error("Failed to generate refresh token.");
    }
};

export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return next();
    }

    try {
        if (!config.jwtSecret) {
            console.warn('[optionalAuth] JWT_SECRET is not configured. Proceeding without authentication.');
            return next();
        }
        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await UserModel.findUserById(decoded.user.id);

        if (user) {
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                account_type: user.account_type || 'user'
            };
        }
    } catch (error) {
        console.warn('[Optional Auth Middleware] Token present but invalid:', error.message);
    }
    next();
};
