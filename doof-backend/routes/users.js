// Filename: /root/doof-backend/routes/users.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
import * as userController from '../controllers/userController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
// Import validator if used
// import { validateIdentifierParam, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// GET /api/users/profile/:identifier
router.get(
    '/profile/:identifier',
    // validateIdentifierParam('identifier'), // Assuming validator exists
    // handleValidationErrors,
    optionalAuthMiddleware,
    userController.getUserProfile // Access via namespace
);

// TODO: Add other user routes

export default router;