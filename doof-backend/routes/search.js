// Filename: /root/doof-backend/routes/search.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
import * as searchController from '../controllers/searchController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
// Import validators if needed
// import { validateSearchQuery, handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, /* validateSearchQuery, handleValidationErrors, */ searchController.performSearch);

export default router;