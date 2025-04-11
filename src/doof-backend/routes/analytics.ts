/* src/doof-backend/routes/analytics.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, body, validationResult, ValidationChain } from 'express-validator';
// Corrected imports - Add .js extension back
import * as AnalyticsModel from '../models/analyticsModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();
const publicAnalyticsRouter = express.Router(); // Separate router for non-superuser routes

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Analytics Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

const validateAggregateTrendsQuery: ValidationChain[] = [
    queryValidator('itemType').isIn(['restaurant', 'dish', 'list']).withMessage('Invalid itemType specified (must be restaurant, dish, or list)'),
    queryValidator('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period specified (must be 7d, 30d, 90d, or 1y)')
];

const validatePopularQuery: ValidationChain[] = [
    queryValidator('type').optional().isIn(['all', 'restaurants', 'dishes', 'lists']).withMessage('Invalid type (must be all, restaurants, dishes, or lists)'),
    queryValidator('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period specified (must be 7d, 30d, 90d, or 1y)'),
    queryValidator('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt()
];

const validateLogBody: ValidationChain[] = [
    body('event_type').isString().notEmpty().withMessage('Event type is required'),
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(),
    body('item_type').isString().isIn(['restaurant', 'dish', 'list']).withMessage('Invalid item type (must be restaurant, dish, or list)')
];

// --- Superuser Only Routes ---
router.use(authMiddleware, requireSuperuser);

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const summary = await AnalyticsModel.getSiteSummary();
        res.json({ data: summary });
    } catch (err) {
        console.error('[Analytics GET /summary] Error:', err);
        next(err);
    }
});

router.get('/submissions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await AnalyticsModel.getSubmissionStats();
        res.json({ data: stats });
    } catch (err) {
        console.error('[Analytics GET /submissions] Error:', err);
        next(err);
    }
});

router.get('/content-distribution', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const distribution = await AnalyticsModel.getContentDistribution();
        res.json({ data: distribution });
    } catch (err) {
        console.error('[Analytics GET /content-distribution] Error:', err);
        next(err);
    }
});

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    const period = (req.query.period as string) || '30d';
    try {
        const metrics = await AnalyticsModel.getUserMetrics(period);
        res.json({ data: metrics });
    } catch (err) {
        console.error('[Analytics GET /users] Error:', err);
        next(err);
    }
});

router.get('/engagements', async (req: Request, res: Response, next: NextFunction) => {
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
    async (req: Request, res: Response, next: NextFunction) => {
        const itemType = req.query.itemType as 'restaurant' | 'dish' | 'list';
        const period = (req.query.period as string) || '30d';
        try {
            const trends = await AnalyticsModel.getAggregateTrends(itemType, period);
            res.status(200).json({ data: trends });
        } catch (err: unknown) {
            console.error(`[Analytics GET /aggregate-trends] Error fetching trends for ${itemType}, period ${period}:`, err);
            if (err instanceof Error && (err as any).code === '42P01') {
                res.status(500).json({ error: 'Database schema error encountered while fetching trends.' });
                return;
            }
            next(err);
        }
    }
);

router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
    const limit = Number(req.query.limit || 100);
    try {
        const events = await AnalyticsModel.getRecentEvents(limit);
        res.json({ data: events });
    } catch (err) {
        console.error('[Analytics GET /events] Error:', err);
        next(err);
    }
});

// --- Public/Auth Required Routes (Mounted Separately in server.ts) ---

publicAnalyticsRouter.get(
    '/popular',
    validatePopularQuery,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const type = (req.query.type as string) || 'all';
        const period = (req.query.period as string) || '30d';
        const limit = Number(req.query.limit || 10);
        try {
            const popularItems = await AnalyticsModel.getPopularItems(type, period, limit);
            res.json({ data: popularItems });
        } catch (err) {
            console.error('[Analytics GET /popular] Error:', err);
            next(err);
        }
    }
);

// Note: This '/log' might conflict with '/api/engage' route depending on mounting order in server.ts.
// If '/api/engage' is the intended route for logging, this might be redundant or need adjustment.
publicAnalyticsRouter.post(
    '/log',
    authMiddleware, // Only auth required, not superuser
    validateLogBody,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const { event_type, item_id, item_type } = req.body;
            const userId = req.user?.id;
            console.log(`[Analytics POST /log] Logging event: User ${userId ?? 'Guest'}, Type ${event_type}, Item ${item_type}:${item_id}`);
            await AnalyticsModel.logEvent(event_type, item_id, item_type, userId);
            res.status(202).json({ message: 'Event logged successfully' });
        } catch (err) {
            console.error('[Analytics POST /log] Error:', err);
            next(err);
        }
    }
);

// Export the main router (superuser) as default, and public router as named
export default router;
export { publicAnalyticsRouter };