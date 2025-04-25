// Filename: /root/doof-backend/routes/dishes.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
/* FIXED: Changed validatePaginationQuery to validatePagination */
/* FIXED: Removed validatePagination() call, used array directly */
import express from 'express';
import * as dishController from '../controllers/dishController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { validateIdParam, handleValidationErrors, validatePagination } from '../middleware/validators.js';

const router = express.Router();

router.get('/', validatePagination, handleValidationErrors, optionalAuthMiddleware, dishController.getAllDishes);
router.get('/:id', validateIdParam('id'), handleValidationErrors, optionalAuthMiddleware, dishController.getDishById);
// TODO: Add POST, PUT, DELETE routes

export default router;