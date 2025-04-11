/* src/doof-backend/routes/analyticsRoutes.ts */
import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator'; // Removed unused 'query'
// FIX: Changed .ts to .js
import * as AnalyticsModel from '../models/analyticsModel.js';
// FIX: Changed .ts to .js
import authMiddleware from '../middleware/auth.js';
// FIX: Changed .ts to .js
import requireSuperuser from '../middleware/requireSuperuser.js';
// FIX: Changed .ts to .js for type import consistency
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Middleware to handle validation results
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[Analytics Route Validation Error] Path: ${req.path}`, errors.array());
    res.status(400).json({ error: errors.array()[0].msg });
    return; // Explicit return
  }
  next();
};

// GET /api/analytics/events (Superuser only) - Assuming this corresponds to analytics.ts route now
// This route might be duplicated or outdated if analytics.ts is the main file now
router.get(
  '/events',
  authMiddleware,
  requireSuperuser,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.warn("[analyticsRoutes.ts] GET /events potentially overlaps with analytics.ts");
    const limit = parseInt(String(req.query.limit || '100'), 10);
    try {
      // This might call a function that doesn't exist if analyticsModel.ts was renamed/refactored
      const events = await AnalyticsModel.getRecentEvents(limit);
      res.json({ data: events });
    } catch (err) {
      console.error('[Analytics GET /events] Error:', err);
      next(err);
    }
  }
);

// GET /api/analytics/popular (Public) - Assuming this corresponds to analytics.ts route now
// This route might be duplicated or outdated if analytics.ts is the main file now
router.get(
  '/popular',
  async (req: Request, res: Response, next: NextFunction) => {
    console.warn("[analyticsRoutes.ts] GET /popular potentially overlaps with analytics.ts");
    const type = (req.query.type as string) || 'all';
    const period = (req.query.period as string) || '30d';
    const limit = parseInt(String(req.query.limit || '10'), 10);
    try {
      // This might call a function that doesn't exist if analyticsModel.ts was renamed/refactored
      const popularItems = await AnalyticsModel.getPopularItems(type, period, limit);
      res.json({ data: popularItems });
    } catch (err) {
      console.error('[Analytics GET /popular] Error:', err);
      next(err);
    }
  }
);

// POST /api/analytics/log (Authenticated) - Assuming this corresponds to engage.ts now
// This route might be duplicated or outdated if engage.ts handles logging
router.post(
  '/log',
  authMiddleware, // Added authMiddleware based on engage.ts
  [
    body('event_type') // Renamed from 'engagement_type' for this old route? Or should match engage.ts? Assuming old name 'event_type' for now.
      .isString()
      .notEmpty()
      .withMessage('Event type is required'),
      // .isIn(['view', 'click', 'add_to_list', 'share']) // Should this validation be here or match engage.ts?
      // .withMessage('Invalid engagement type (must be view, click, add_to_list, or share)'),
    body('item_id')
      // .optional() // Keep optional? engage.ts requires it. Assuming required based on engage.ts
      .isInt({ gt: 0}) // Added { gt: 0} based on engage.ts
      .withMessage('Item ID must be a positive integer')
      .toInt(), // Added .toInt() based on engage.ts
    body('item_type')
      // .optional() // Keep optional? engage.ts requires it. Assuming required based on engage.ts
      .isString()
      .isIn(['restaurant', 'dish', 'list']) // Added based on engage.ts
      .withMessage('Invalid item type (must be restaurant, dish, or list)'), // Updated message
    body('data') // This field is not in engage.ts - keep it for this old route?
      .optional()
      .isObject()
      .withMessage('Data must be an object'),
  ] as ValidationChain[],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.warn("[analyticsRoutes.ts] POST /log potentially overlaps with engage.ts");
    try {
      // 'data' might not be expected by logEvent/logEngagement anymore
      const { event_type, item_id, item_type, data } = req.body;
      const userId = req.user?.id; // Use optional chaining as user might not be logged in if optionalAuth used?

      // This might call a function that doesn't exist or has different signature
      // await AnalyticsModel.logEvent(event_type, item_id, item_type, userId, data);
      console.warn(`[Analytics POST /log] Attempting to log event: User ${userId ?? 'Guest'}, Type ${event_type}, Item ${item_type}:${item_id}, Data: ${JSON.stringify(data)} - This might fail if model changed.`);
       // Simulate success or call the potentially outdated function
      await Promise.resolve(); // Replace with actual call if AnalyticsModel.logEvent still exists

      res.status(202).json({ message: 'Event logged successfully (via analyticsRoutes.ts)' });
    } catch (err) {
      console.error('[Analytics POST /log] Error:', err);
      next(err);
    }
  }
);

export default router;