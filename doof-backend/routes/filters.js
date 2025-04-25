// Filename: /root/doof-backend/routes/filters.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
import * as filterController from '../controllers/filterController.js'; // Use namespace import
import optionalAuthMiddleware from '../middleware/optionalAuth.js';

const router = express.Router();

router.get('/:type', optionalAuthMiddleware, filterController.getFilterOptions);

export default router;