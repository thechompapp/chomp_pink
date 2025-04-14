/* src/doof-backend/routes/analyticsRoutes.js */
/* This file seems potentially redundant given analytics.js. Review if needed. */
import express from 'express';
import { body, validationResult } from 'express-validator';
import * as AnalyticsModel from '../models/analyticsModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Import optional auth

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Analytics Route (Old) Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

// GET /api/analytics/events (Superuser only) - Might overlap
router.get('/events', authMiddleware, requireSuperuser, async (req, res, next) => {
    console.warn("[analyticsRoutes.js] GET /events potentially overlaps with analytics.js");
    const limit = parseInt(String(req.query.limit || '100'), 10);
    try {
        const events = await AnalyticsModel.getRecentEvents(limit);
        res.json({ data: events });
    } catch (err) {
        console.error('[Analytics (Old) GET /events] Error:', err);
        next(err);
    }
});

// GET /api/analytics/popular (Public) - Might overlap
router.get('/popular', async (req, res, next) => {
    console.warn("[analyticsRoutes.js] GET /popular potentially overlaps with analytics.js");
    const type = req.query.type || 'all';
    const period = req.query.period || '30d';
    const limit = parseInt(String(req.query.limit || '10'), 10);
    try {
        const popularItems = await AnalyticsModel.getPopularItems(String(type), String(period), limit); // Ensure string
        res.json({ data: popularItems });
    } catch (err) {
        console.error('[Analytics (Old) GET /popular] Error:', err);
        next(err);
    }
});

// POST /api/analytics/log (Authenticated) - Might overlap with engage.js
router.post('/log',
    optionalAuthMiddleware, // Use optional auth
    [
        body('event_type').isString().notEmpty().withMessage('Event type is required'),
        body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be positive').toInt(),
        body('item_type').isString().isIn(['restaurant', 'dish', 'list']).withMessage('Invalid item type'),
        body('data').optional().isObject().withMessage('Data must be an object'),
    ],
    handleValidationErrors,
    async (req, res, next) => {
        console.warn("[analyticsRoutes.js] POST /log potentially overlaps with engage.js");
        try {
            const { event_type, item_id, item_type, data } = req.body;
            const userId = req.user?.id;
            console.warn(`[Analytics (Old) POST /log] Logging event: User ${userId ?? 'Guest'}, Type ${event_type}, Item ${item_type}:${item_id} - This might fail if model changed.`);
            // Assuming logEvent exists and handles the call
            await AnalyticsModel.logEvent(event_type, item_id, item_type, userId, data || null);
            res.status(202).json({ message: 'Event logged successfully (via analyticsRoutes.js)' });
        } catch (err) {
            console.error('[Analytics (Old) POST /log] Error:', err);
            next(err);
        }
    }
);

export default router;