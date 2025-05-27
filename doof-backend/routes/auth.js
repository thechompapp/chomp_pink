// doof-backend/routes/auth.js
import express from 'express';
import {
    login,
    register,
    logout,
    refreshTokenController, // Using the consistently named export
    getAuthStatus,
    getMe // Import the getMe controller
} from '../controllers/authController.js'; // All are named exports
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validators.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/status', optionalAuth, getAuthStatus);

// Protected routes (require authentication)
router.post('/logout', requireAuth, logout);
router.post('/refresh-token', requireAuth, refreshTokenController);
router.get('/me', requireAuth, getMe); // Add the /me endpoint

export default router; // Default export for the router
