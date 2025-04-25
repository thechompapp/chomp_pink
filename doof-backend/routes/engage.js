// Filename: /root/doof-backend/routes/engage.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
import * as engageController from '../controllers/engageController.js'; // Use namespace import
import { requireAuth } from '../middleware/auth.js';
// Import validator if used
// import { validateEngagement, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

router.post(
    '/',
    requireAuth,
    // validateEngagement,
    // handleValidationErrors,
    engageController.logEngagement // Access via namespace
);

export default router;