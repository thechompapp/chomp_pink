// Filename: /root/doof-backend/routes/trending.js
/* REFACTORED: Convert to ES Modules */
import express from 'express';
import * as trendingController from '../controllers/trendingController.js';

const router = express.Router();

// Removed requireAuth to allow unauthenticated access
router.get('/:type', trendingController.getTrendingItems);

export default router;