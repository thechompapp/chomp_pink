// Filename: /root/doof-backend/routes/neighborhoods.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use named imports for controller */
import express from 'express';
import { getAllNeighborhoods, getNeighborhoodsByZipcode, getBoroughsByCity, getNeighborhoodsByParent } from '../controllers/neighborhoodController.js'; // Use named imports
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { validateIdParam, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

router.get(
    '/',
    optionalAuthMiddleware,
    getAllNeighborhoods
);

// Neighborhood lookup routes
router.get('/zip/:zipcode', getNeighborhoodsByZipcode);
router.get('/boroughs/city/:city_id', getBoroughsByCity);
router.get('/neighborhoods/:parent_id', getNeighborhoodsByParent);

export default router; 