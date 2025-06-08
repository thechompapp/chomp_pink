// Filename: /root/doof-backend/routes/analytics.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
// *** Use namespace import for controller methods ***
import * as analyticsController from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

router.use(requireAuth, requireSuperuser);

// GET /api/analytics/summary
router.get('/summary', analyticsController.getAnalyticsSummary);

// GET /api/analytics/engagement
router.get('/engagement', analyticsController.getEngagementAnalytics);

// GET /api/analytics/search
router.get('/search', analyticsController.getSearchAnalytics);

// GET /api/analytics/aggregate-trends - NEW: Missing endpoint for trending page
router.get('/aggregate-trends', analyticsController.getAggregateTrends);

// Additional endpoints needed by frontend
router.get('/submissions', analyticsController.getAnalyticsSummary);
router.get('/content-distribution', analyticsController.getAnalyticsSummary);
router.get('/users', analyticsController.getAnalyticsSummary);

export default router;