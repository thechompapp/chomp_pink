// Filename: /root/doof-backend/routes/users.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
import * as userController from '../controllers/userController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { requireAuth } from '../middleware/auth.js';
// Import validator if used
// import { validateIdentifierParam, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// GET /api/users/profile/:identifier - Protected route
router.get(
    '/profile/:identifier',
    requireAuth, // Require authentication for this endpoint
    userController.getUserProfile
);

// PUT /api/users/:id/password - Update user's password
router.put(
  '/:id/password',
  requireAuth,
  userController.updateUserPassword
);

export default router;