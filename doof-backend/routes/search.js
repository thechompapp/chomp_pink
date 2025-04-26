// Filename: /root/doof-backend/routes/search.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
/* UPDATED: Added specific validator for performSearch */
import express from 'express';
import * as searchController from '../controllers/searchController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
// Import the specific validator from the controller file
import { validatePerformSearch } from '../controllers/searchController.js';

const router = express.Router();

// Apply optionalAuth, then the specific search validator, then the controller
router.get(
    '/',
    optionalAuthMiddleware,
    validatePerformSearch, // Apply the new validator array
    searchController.performSearch
);

export default router;