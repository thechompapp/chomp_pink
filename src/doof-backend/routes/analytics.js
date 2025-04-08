/* src/doof-backend/routes/analytics.js */
import express from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
// Import model functions
import * as AnalyticsModel from '../models/analyticsModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js'; // Assuming this exists

const router = express.Router();

// --- Middleware & Validation (Keep as is) ---
const handleValidationErrors = (req, res, next) => { /* ... */ };
const validateAggregateTrendsQuery = [ /* ... */ ];
// Apply Common Middleware
router.use(authMiddleware);
router.use(requireSuperuser);

// --- Routes ---

router.get('/summary', async (req, res, next) => {
    try {
        const summary = await AnalyticsModel.getSiteSummary(); // Use Model
        res.json({ data: summary }); // Standard response
    } catch (err) { next(err); }
});

router.get('/submissions', async (req, res, next) => {
     try {
        const stats = await AnalyticsModel.getSubmissionStats(); // Use Model
        res.json({ data: stats }); // Standard response
    } catch (err) { next(err); }
});

router.get('/content-distribution', async (req, res, next) => {
     try {
        const distribution = await AnalyticsModel.getContentDistribution(); // Use Model
        res.json({ data: distribution }); // Standard response
    } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
     // Optionally add period validation if desired
     const period = req.query.period || '30d';
     try {
        const metrics = await AnalyticsModel.getUserMetrics(period); // Use Model
        res.json({ data: metrics }); // Standard response
    } catch (err) { next(err); }
});

router.get('/engagements', async (req, res, next) => {
     try {
        const details = await AnalyticsModel.getEngagementDetails(); // Use Model
        res.json({ data: details }); // Standard response
    } catch (err) { next(err); }
});

// GET /api/analytics/aggregate-trends
router.get(
    '/aggregate-trends',
    validateAggregateTrendsQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const { itemType, period = '30d' } = req.query;
        try {
            const trends = await AnalyticsModel.getAggregateTrends(itemType, period); // Use Model
            res.status(200).json({ data: trends }); // Standard response

        } catch (err) {
            console.error(`[Analytics GET /aggregate-trends] Error fetching aggregate trends for ${itemType}:`, err);
             // Keep specific error handling if needed
             if (err.code === '42P01') return res.status(500).json({ error: 'Database schema error: Engagements table missing.' });
            next(err);
        }
    }
);

export default router;