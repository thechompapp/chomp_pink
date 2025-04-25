// Filename: /root/doof-backend/routes/restaurants.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
/* FIXED: Changed validatePaginationQuery to validatePagination */
/* FIXED: Removed validatePagination() call, used array directly */
import express from 'express';
import * as restaurantController from '../controllers/restaurantController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { validateIdParam, handleValidationErrors, validatePagination } from '../middleware/validators.js';

const router = express.Router();

router.get('/', validatePagination, handleValidationErrors, optionalAuthMiddleware, restaurantController.getAllRestaurants);
router.get('/:id', validateIdParam('id'), handleValidationErrors, optionalAuthMiddleware, restaurantController.getRestaurantById);
// TODO: Add POST, PUT, DELETE routes

export default router;