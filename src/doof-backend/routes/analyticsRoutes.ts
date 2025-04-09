import express, { Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import * as AnalyticsModel from '../models/analyticsModel.ts';
import authMiddleware from '../middleware/auth.ts';
import requireSuperuser from '../middleware/requireSuperuser.ts';

const router = express.Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Analytics Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

router.get('/events', authMiddleware, requireSuperuser, async (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt(String(req.query.limit || '100'), 10);
    try {
        const events = await AnalyticsModel.getRecentEvents(limit);
        res.json({ data: events });
    } catch (err) {
        console.error('[Analytics GET /events] Error:', err);
        next(err);
    }
});

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

router.post('/log', [
    body('event_type').isString().notEmpty().withMessage('Event type is required'),
    body('item_id').optional().isInt().withMessage('Item ID must be an integer'),
    body('item_type').optional().isString().withMessage('Item type must be a string'),
    body('data').optional().isObject().withMessage('Data must be an object'),
], handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { event_type, item_id, item_type, data } = req.body;
        const userId = req.user?.id;

        await AnalyticsModel.logEvent(event_type, item_id, item_type, userId, data);
        res.status(202).json({ message: 'Event logged successfully' });
    } catch (err) {
        console.error('[Analytics POST /log] Error:', err);
        next(err);
    }
});

export default router;