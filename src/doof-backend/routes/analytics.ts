/* src/doof-backend/routes/analytics.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
import * as AnalyticsModel from '../models/analyticsModel.js'; // Added .js
import authMiddleware from '../middleware/auth.js'; // Added .js
import requireSuperuser from '../middleware/requireSuperuser.js'; // Added .js
import type { AuthenticatedRequest } from '../middleware/auth.js'; // Import type

const router = express.Router();

// Validation Error Handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Analytics Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Validation for Aggregate Trends Query
const validateAggregateTrendsQuery: ValidationChain[] = [
    queryValidator('itemType').isIn(['restaurant', 'dish', 'list']).withMessage('Invalid itemType specified (must be restaurant, dish, or list)'),
    queryValidator('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period specified (must be 7d, 30d, 90d, or 1y)')
];

// Apply auth and superuser check to all analytics routes
router.use(authMiddleware);
router.use(requireSuperuser);

// GET /api/analytics/summary
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const summary = await AnalyticsModel.getSiteSummary();
        res.json({ data: summary });
    } catch (err) {
         console.error('[Analytics GET /summary] Error:', err);
         next(err);
    }
});

// GET /api/analytics/submissions
router.get('/submissions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await AnalyticsModel.getSubmissionStats();
        res.json({ data: stats });
    } catch (err) {
         console.error('[Analytics GET /submissions] Error:', err);
         next(err);
    }
});

// GET /api/analytics/content-distribution
router.get('/content-distribution', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const distribution = await AnalyticsModel.getContentDistribution();
        res.json({ data: distribution });
    } catch (err) {
         console.error('[Analytics GET /content-distribution] Error:', err);
         next(err);
    }
});

// GET /api/analytics/users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    // Default to '30d' if period is missing or invalid (validation might be added later if needed)
    const period = (req.query.period as string) || '30d';
    try {
        const metrics = await AnalyticsModel.getUserMetrics(period);
        res.json({ data: metrics });
    } catch (err) {
         console.error('[Analytics GET /users] Error:', err);
         next(err);
    }
});

// GET /api/analytics/engagements
router.get('/engagements', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const details = await AnalyticsModel.getEngagementDetails();
        res.json({ data: details });
    } catch (err) {
         console.error('[Analytics GET /engagements] Error:', err);
         next(err);
    }
});

// GET /api/analytics/aggregate-trends
router.get(
    '/aggregate-trends',
    validateAggregateTrendsQuery, // Apply validation
    handleValidationErrors, // Handle errors from validation
    async (req: Request, res: Response, next: NextFunction) => {
        // Types are validated by express-validator
        const itemType = req.query.itemType as 'restaurant' | 'dish' | 'list';
        const period = (req.query.period as string) || '30d'; // Default period
        try {
            const trends = await AnalyticsModel.getAggregateTrends(itemType, period);
            // Send data wrapped in 'data' property for consistency
            res.status(200).json({ data: trends });
        } catch (err: unknown) {
            console.error(`[Analytics GET /aggregate-trends] Error fetching aggregate trends for ${itemType}, period ${period}:`, err);
            // Check for specific DB errors if needed, e.g., table missing
            if (err instanceof Error && (err as any).code === '42P01') { // PostgreSQL table does not exist code
                return res.status(500).json({ error: 'Database schema error encountered while fetching trends.' });
            }
            next(err); // Pass other errors to the global handler
        }
    }
);

// GET /api/analytics/events (Example, might not be used currently)
router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
     const limit = parseInt(String(req.query.limit || '100'), 10);
     try {
         const events = await AnalyticsModel.getRecentEvents(limit);
         res.json({ data: events });
     } catch (err) {
         console.error('[Analytics GET /events] Error:', err);
         next(err);
     }
 });

 // GET /api/analytics/popular (Example, might not be used currently)
 router.get('/popular', async (req: Request, res: Response, next: NextFunction) => {
     const type = (req.query.type as string) || 'all';
     const period = (req.query.period as string) || '30d';
     const limit = parseInt(String(req.query.limit || '10'), 10);
     try {
         const popularItems = await AnalyticsModel.getPopularItems(type, period, limit);
         res.json({ data: popularItems });
     } catch (err) {
         console.error('[Analytics GET /popular] Error:', err);
         next(err);
     }
 });


export default router;