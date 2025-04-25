// Filename: /root/doof-backend/routes/neighborhoods.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
import * as neighborhoodController from '../controllers/neighborhoodController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
// Import validator if needed
// import { validateCityIdQuery, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

router.get(
    '/',
    optionalAuthMiddleware,
    // validateCityIdQuery, // Example validation
    // handleValidationErrors,
    neighborhoodController.getAllNeighborhoods // Access via namespace
);

// TODO: Add GET /api/neighborhoods/:id if needed

export default router;