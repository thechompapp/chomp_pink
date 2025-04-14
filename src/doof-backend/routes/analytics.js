/* src/doof-backend/routes/analytics.js */
import express from 'express';
import { query as queryValidator, body, validationResult } from 'express-validator';
import * as AnalyticsModel from '../models/analyticsModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Import optional auth if used by public routes

const router = express.Router();
const publicAnalyticsRouter = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Analytics Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

const validateAggregateTrendsQuery = [
    queryValidator('itemType').isIn(['restaurant', 'dish', 'list']).withMessage('Invalid itemType specified (must be restaurant, dish, or list)'),
    queryValidator('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period specified (must be 7d, 30d, 90d, or 1y)')
];

const validatePopularQuery = [
    queryValidator('type').optional().isIn(['all', 'restaurant', 'dish', 'list']).withMessage('Invalid type (must be all, restaurant, dish, or list)'), // Corrected type value
    queryValidator('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period specified (must be 7d, 30d, 90d, or 1y)'),
    queryValidator('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt()
];

const validateLogBody = [
    body('event_type').isString().notEmpty().withMessage('Event type is required'),
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(),
    body('item_type').isString().isIn(['restaurant', 'dish', 'list']).withMessage('Invalid item type (must be restaurant, dish, or list)')
];

// --- Superuser Only Routes ---
router.use(authMiddleware, requireSuperuser);

router.get('/summary', async (req, res, next) => {
    try {
        const summary = await AnalyticsModel.getSiteSummary();
        res.json({ data: summary });
    } catch (err) {
        console.error('[Analytics GET /summary] Error:', err);
        next(err);
    }
});

router.get('/submissions', async (req, res, next) => {
    try {
        const stats = await AnalyticsModel.getSubmissionStats();
        res.json({ data: stats });
    } catch (err) {
        console.error('[Analytics GET /submissions] Error:', err);
        next(err);
    }
});

router.get('/content-distribution', async (req, res, next) => {
    try {
        const distribution = await AnalyticsModel.getContentDistribution();
        res.json({ data: distribution });
    } catch (err) {
        console.error('[Analytics GET /content-distribution] Error:', err);
        next(err);
    }
});

router.get('/users', async (req, res, next) => {
    const period = req.query.period || '30d';
    try {
        const metrics = await AnalyticsModel.getUserMetrics(String(period)); // Ensure string
        res.json({ data: metrics });
    } catch (err) {
        console.error('[Analytics GET /users] Error:', err);
        next(err);
    }
});

router.get('/engagements', async (req, res, next) => {
    try {
        const details = await AnalyticsModel.getEngagementDetails();
        res.json({ data: details });
    } catch (err) {
        console.error('[Analytics GET /engagements] Error:', err);
        next(err);
    }
});

router.get(
    '/aggregate-trends',
    validateAggregateTrendsQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const itemType = req.query.itemType;
        const period = req.query.period || '30d';
        try {
            const trends = await AnalyticsModel.getAggregateTrends(String(itemType), String(period)); // Ensure string
            res.status(200).json({ data: trends });
        } catch (err) {
            console.error(`[Analytics GET /aggregate-trends] Error fetching trends for ${itemType}, period ${period}:`, err);
            if (err instanceof Error && err.code === '42P01') {
                res.status(500).json({ error: 'Database schema error encountered while fetching trends.' });
                return;
            }
            next(err);
        }
    }
);

router.get('/events', async (req, res, next) => {
    const limit = Number(req.query.limit || 100);
    try {
        const events = await AnalyticsModel.getRecentEvents(limit);
        res.json({ data: events });
    } catch (err) {
        console.error('[Analytics GET /events] Error:', err);
        next(err);
    }
});

// --- Public/Auth Required Routes (Mounted Separately in server.js) ---
publicAnalyticsRouter.get(
    '/popular',
    validatePopularQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const type = req.query.type || 'all';
        const period = req.query.period || '30d';
        const limit = Number(req.query.limit || 10);
        try {
            const popularItems = await AnalyticsModel.getPopularItems(String(type), String(period), limit); // Ensure string
            res.json({ data: popularItems });
        } catch (err) {
            console.error('[Analytics GET /popular] Error:', err);
            next(err);
        }
    }
);

// Note: This '/log' route might be redundant if '/api/engage' handles all logging.
// Consider removing if engagement logging is sufficient.
publicAnalyticsRouter.post(
    '/log',
    optionalAuthMiddleware, // Use optional auth if guests can log events
    validateLogBody,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const { event_type, item_id, item_type } = req.body;
            const userId = req.user?.id; // User might not be present
            console.log(`[Analytics POST /log] Logging event: User ${userId ?? 'Guest'}, Type ${event_type}, Item ${item_type}:${item_id}`);
            // Using logEvent from analyticsModel (ensure it exists and handles data correctly)
            await AnalyticsModel.logEvent(event_type, item_id, item_type, userId);
            res.status(202).json({ message: 'Event logged successfully' });
        } catch (err) {
            console.error('[Analytics POST /log] Error:', err);
            next(err);
        }
    }
);

export default router;
export { publicAnalyticsRouter };