// Filename: /root/doof-backend/routes/restaurants.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use named imports for controller */
/* FIXED: Changed validatePaginationQuery to validatePagination */
/* FIXED: Removed validatePagination() call, used array directly */
import express from 'express';
import { getAllRestaurants, getRestaurantById } from '../controllers/restaurantController.js'; // Use named imports
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { validateIdParam, handleValidationErrors, validatePagination } from '../middleware/validators.js';

const router = express.Router();

router.get('/', validatePagination, handleValidationErrors, optionalAuthMiddleware, getAllRestaurants);
router.get('/:id', validateIdParam('id'), handleValidationErrors, optionalAuthMiddleware, getRestaurantById);

export default router;