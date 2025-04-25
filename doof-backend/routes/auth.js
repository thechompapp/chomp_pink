// Filename: /root/doof-backend/routes/auth.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
// *** Use namespace import for controller methods ***
import * as authController from '../controllers/authController.js';
import { validateRegistration, validateLogin, handleValidationErrors, validateIdParam } from '../middleware/validators.js';
import { requireAuth } from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegistration, handleValidationErrors, authController.register); // Access via namespace

// POST /api/auth/login
router.post('/login', validateLogin, handleValidationErrors, authController.login); // Access via namespace

// GET /api/auth/status
router.get('/status', requireAuth, authController.getStatus); // Access via namespace

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken); // Access via namespace

// POST /api/auth/logout
router.post('/logout', authController.logout); // Access via namespace

// PUT /api/auth/update-account-type/:userId
router.put(
    '/update-account-type/:userId',
    requireAuth,
    requireSuperuser,
    validateIdParam('userId'),
    handleValidationErrors,
    authController.updateAccountType // Access via namespace
);

export default router;