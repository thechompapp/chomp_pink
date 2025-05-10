// doof-backend/routes/auth.js
import express from 'express';
import {
    login,
    register,
    logout,
    refreshTokenController, // Using the consistently named export
    getAuthStatus
} from '../controllers/authController.js'; // All are named exports
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validateRegistration, validateLogin } from '../middleware/validators.js';

const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', requireAuth, logout);
router.post('/refresh-token', refreshTokenController);
router.get('/status', optionalAuth, getAuthStatus);

export default router; // Default export for the router
