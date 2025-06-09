// Filename: /root/doof-backend/routes/neighborhoods.js
/* REFACTORED: Convert to ES Modules */
/* UPDATED: Added Maps feature endpoints */
import express from 'express';
import { 
  getAllNeighborhoods, 
  getNeighborhoodById,
  getNeighborhoodRestaurants,
  searchNeighborhoods,
  getNeighborhoodsByZipcode, 
  getBoroughsByCity, 
  getNeighborhoodsByParent 
} from '../controllers/neighborhoodController.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { validateIdParam, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

// Middleware to disable caching for this specific route
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};

// Main neighborhoods endpoint
router.get(
    '/',
    noCache, // Disable caching
    optionalAuthMiddleware,
    getAllNeighborhoods
);

// Search neighborhoods
router.get('/search', searchNeighborhoods);

// Get specific neighborhood details
router.get(
  '/:id',
  validateIdParam,
  handleValidationErrors,
  getNeighborhoodById
);

// Get restaurants in a neighborhood
router.get(
  '/:id/restaurants',
  validateIdParam,
  handleValidationErrors,
  getNeighborhoodRestaurants
);

// Legacy neighborhood lookup routes (keeping for compatibility)
router.get('/zip/:zipcode', getNeighborhoodsByZipcode);
router.get('/by-zipcode/:zipcode', getNeighborhoodsByZipcode);
router.get('/boroughs/city/:city_id', getBoroughsByCity);
router.get('/neighborhoods/:parent_id', getNeighborhoodsByParent);

export default router; 