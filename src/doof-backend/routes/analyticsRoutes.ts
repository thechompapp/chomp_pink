import express from 'express';
import { body, query, validationResult } from 'express-validator';
import * as AnalyticsModel from '../models/analyticsModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

// Middleware for validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[Analytics Route Validation Error] Path: ${req.path}`, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// GET /api/analytics/events - Get recent analytics events
router.get('/events', authMiddleware, requireSuperuser, async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 100;
  try {
    const events = await AnalyticsModel.getRecentEvents(limit);
    res.json({ data: events });
  } catch (err) {
    console.error('[Analytics GET /events] Error:', err);
    next(err);
  }
});

// GET /api/analytics/popular - Get popular items
router.get('/popular', async (req, res, next) => {
  const { type = 'all', period = '30d', limit = 10 } = req.query;
  try {
    const popularItems = await AnalyticsModel.getPopularItems(type, period, limit);
    res.json({ data: popularItems });
  } catch (err) {
    console.error('[Analytics GET /popular] Error:', err);
    next(err);
  }
});

// POST /api/analytics/log - Log analytics event (public endpoint)
router.post('/log', [
  body('event_type').isString().notEmpty().withMessage('Event type is required'),
  body('item_id').optional().isInt().withMessage('Item ID must be an integer'),
  body('item_type').optional().isString().withMessage('Item type must be a string'),
  body('data').optional().isObject().withMessage('Data must be an object'),
], handleValidationErrors, async (req, res, next) => {
  try {
    const { event_type, item_id, item_type, data } = req.body;
    const userId = req.user?.id; // Optional auth - may be undefined
    
    await AnalyticsModel.logEvent(event_type, item_id, item_type, userId, data);
    res.status(202).json({ message: 'Event logged successfully' });
  } catch (err) {
    console.error('[Analytics POST /log] Error:', err);
    next(err);
  }
});

export default router;
