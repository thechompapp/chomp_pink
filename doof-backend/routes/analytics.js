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
router.get('/summary', analyticsController.getAnalyticsSummary); // Access via namespace

// GET /api/analytics/engagement
router.get('/engagement', analyticsController.getEngagementAnalytics); // Access via namespace

// GET /api/analytics/search
router.get('/search', analyticsController.getSearchAnalytics);

// Additional endpoints needed by frontend
router.get('/submissions', analyticsController.getAnalyticsSummary); // Reuse summary for now
router.get('/content-distribution', analyticsController.getAnalyticsSummary); // Reuse summary for now  
router.get('/users', analyticsController.getAnalyticsSummary); // Reuse summary for now

export default router;