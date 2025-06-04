// doof-backend/middleware/auth.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import UserModel from '../models/userModel.js';
import TokenBlacklist from '../models/tokenBlacklistModel.js';
import db from '../db/index.js';
import { ListModel } from '../models/listModel.js';

export const requireAuth = async (req, res, next) => {
  // Check for development bypass headers
  const bypassAuth = req.headers['x-bypass-auth'] === 'true';
  const isPlacesApiRequest = req.path.includes('/api/places') || req.path.includes('/places');
  const isTestMode = req.headers['x-test-mode'] === 'true';
  const isAdminRoute = req.path.startsWith('/admin');
  const adminApiKey = req.headers['x-admin-api-key'];
  const configuredAdminKey = process.env.ADMIN_API_KEY;

  // Check if we're running in development or test mode
  const isDevMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const isTestEnv = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
  const isLocalhost = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
  
  // If admin API key is provided and matches our configured key, allow access
  if (adminApiKey && configuredAdminKey && adminApiKey === configuredAdminKey) {
    console.log(`[Auth Middleware] Access granted via admin API key for ${req.path}`);
    // Set a default admin user for development
    req.user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      account_type: 'superuser'
    };
    return next();
  }

  // Allow bypass in development/test mode with the right headers
  if ((isDevMode || isTestEnv) && isLocalhost && (bypassAuth || isPlacesApiRequest || isTestMode)) {
    console.log(`[Auth Middleware] Bypassing authentication for ${req.path} in ${isTestEnv ? 'test' : 'development'} mode on localhost`);
    // Set a default admin user for development/testing
    req.user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      account_type: 'superuser'
    };
    return next();
  }
  
  // Special handling for Places API requests
  if (isPlacesApiRequest) {
    console.log(`[Auth Middleware] Places API request detected for ${req.path}, checking authentication`);
    // If we have a token, proceed with normal auth
    // If not, we'll return a specific error for Places API to help debugging
    const tempAuthHeader = req.headers.authorization;
    if (!tempAuthHeader && (!req.cookies || !req.cookies.token)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required for Places API access.', 
        error: 'places_api_auth_required'
      });
    }
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
    
    console.log('[requireAuth] Verifying token...');
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log('[requireAuth] Token verified. Decoded:', JSON.stringify(decoded, null, 2));
    
    // Verify the token is not blacklisted
    console.log('[requireAuth] Checking if token is blacklisted...');
    const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(token);
    console.log(`[requireAuth] Token blacklist check result: ${isBlacklisted}`);
    
    if (isBlacklisted) {
      console.log('[requireAuth] Attempted access with blacklisted token');
      return res.status(401).json({ 
        success: false, 
        message: 'This token has been invalidated. Please log in again.',
        error: 'token_revoked'
      });
    }
    
    // Check if the token has the expected structure
    if (!decoded.user) {
      console.error('Token is missing user object:', decoded);
      return res.status(401).json({ success: false, message: 'Invalid token structure.' });
    }

    // Get user from database
    const user = await UserModel.findUserById(decoded.user.id);
    if (!user) {
      console.error('User not found in database for token:', decoded.user.id);
      return res.status(401).json({ success: false, message: 'Invalid token: User not found.' });
    }
    
    // Log the user data from the database
    console.log('User from database:', JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      account_type: user.account_type
    }, null, 2));
    
    // Set user data on request object with robust role/account_type mapping
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      // Ensure account_type is always set consistently with role
      account_type: user.role || user.account_type || 'user'
    };
    
    console.log('Request user object set to:', JSON.stringify(req.user, null, 2));
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
  // Handle development mode overrides
  const isSuperuserOverride = req.headers['x-superuser-override'] === 'true';
  const isDevMode = process.env.NODE_ENV === 'development';
  const isLocalhost = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
  
  // Special check for admin API key
  const adminApiKey = req.headers['x-admin-api-key'];
  const configuredAdminKey = process.env.ADMIN_API_KEY;
  const hasValidAdminKey = adminApiKey && configuredAdminKey && adminApiKey === configuredAdminKey;
  
  // If running in development mode and has override headers, permit access
  if ((isDevMode && isLocalhost && isSuperuserOverride) || hasValidAdminKey) {
    return next();
  }
  
  // Robust superuser check - check both role and account_type for compatibility
  const isUserPresent = req.user && req.user.id;
  const isSuperuserByRole = req.user && req.user.role === 'superuser';
  const isSuperuserByAccountType = req.user && req.user.account_type === 'superuser';
  const isSuperuser = isSuperuserByRole || isSuperuserByAccountType;
  
  console.log('[requireSuperuser] Authorization check:', {
    userPresent: isUserPresent,
    userId: req.user?.id,
    role: req.user?.role,
    account_type: req.user?.account_type,
    isSuperuserByRole,
    isSuperuserByAccountType,
    finalDecision: isSuperuser
  });
  
  if (!isUserPresent || !isSuperuser) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Superuser privileges required.',
      debug: isDevMode ? {
        userPresent: isUserPresent,
        role: req.user?.role,
        account_type: req.user?.account_type
      } : undefined
    });
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

export const verifyListModifyAccess = async (req, res, next) => {
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
    
    // Allow access if:
    // 1. User owns the list, OR
    // 2. List is public (allowing community contributions)
    const hasAccess = (list.user_id === userId) || list.is_public;
    
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: You can only add items to your own lists or public lists.' 
      });
    }
    
    req.list = list;
    next();
  } catch (error) {
    console.error(`Error in verifyListModifyAccess middleware for list ${listId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error verifying list access.' });
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
    // Development/test mode bypass check
    const isDevMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    const isTestEnv = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
    const isLocalhost = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
    const hasBypassHeader = req.headers['x-bypass-auth'] === 'true';
    const isTestMode = req.headers['x-test-mode'] === 'true';
  
    // Allow access in development/test mode with bypass headers
    if ((isDevMode || isTestEnv) && isLocalhost && (hasBypassHeader || isTestMode)) {
        console.log(`[OptionalAuth Middleware] ${isTestEnv ? 'Test' : 'Development'} mode bypass for ${req.path}`);
        // Set a mock superuser
        req.user = {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            account_type: 'superuser'
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
        return next();
    }

    try {
        if (!config.jwtSecret) {
            console.error('[optionalAuth] JWT_SECRET is not configured!');
            return next();
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        
        // Fetch user from database
        const user = await UserModel.findUserById(decoded.user.id);
        
        if (!user) {
            return next();
        }
        
        // Set user object on request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            account_type: user.account_type || 'user'
        };
        
        next();
    } catch (error) {
        // Don't fail on token errors in optional auth
        console.warn(`[optionalAuth] Token verification failed: ${error.message}`);
        next();
    }
};
