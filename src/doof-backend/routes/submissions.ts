/* src/doof-backend/routes/submissions.ts */
import express, { Request, Response, NextFunction } from 'express';
import { param, query as queryValidator, body, validationResult, ValidationChain } from 'express-validator';
// Corrected imports - Add .js extension back
import * as SubmissionModel from '../models/submissionModel.js';
import authMiddleware from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// --- Middleware & Validation Chains ---
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Submissions Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

// Validation for submission creation
const validateCreateSubmission: ValidationChain[] = [
    body('name').trim().notEmpty().withMessage('Submission name required').isLength({ max: 255 }),
    body('type').isIn(['restaurant', 'dish']).withMessage('Invalid submission type'),
    body('location').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('city').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('neighborhood').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('tags').optional({ nullable: true }).isArray().withMessage('Tags must be an array')
        .custom((tags: any[]) => tags.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('place_id').optional({ nullable: true }).trim().isLength({ max: 255 }),
    body('restaurant_name').optional({ nullable: true }).trim().isLength({ max: 255 })
        .if(body('type').equals('dish')) // Require restaurant_name if type is dish (and place_id might be missing)
        .custom((value, { req }) => {
            // Only enforce if place_id is also missing
            if (!req.body.place_id && !value) {
                throw new Error('Restaurant name is required for dish submissions without a Google Place ID.');
            }
            return true;
        }),
];

// Validation for GET submissions query
const validateGetSubmissionsQuery: ValidationChain[] = [
    queryValidator('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
];


// GET /api/submissions
router.get(
  '/',
  authMiddleware, // Requires authentication (primarily for admin view)
  validateGetSubmissionsQuery,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Add requireSuperuser middleware if only superusers can see submissions
    // Example: requireSuperuser(req, res, next);

    const status = (req.query.status as string) || 'pending';
    try {
      const submissions = await SubmissionModel.findSubmissionsByStatus(status);
      res.json({ data: submissions });
    } catch (err) {
      console.error(`[Submissions GET /?status=${status}] Error:`, err);
      next(err);
    }
  }
);

// POST /api/submissions
router.post(
  '/',
  authMiddleware, // Requires authentication
  validateCreateSubmission,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const submissionData = req.body; // Use validated body
    const userId = req.user!.id; // Non-null assertion because of authMiddleware
    try {
      const newSubmission = await SubmissionModel.createSubmission(submissionData, userId);
      if (!newSubmission) {
          console.warn(`[Submissions POST /] Submission creation failed for user ${userId}. Data: ${JSON.stringify(submissionData)}`);
          res.status(400).json({ error: "Submission creation failed. Invalid data?" });
          return;
      }
      res.status(201).json({ data: newSubmission }); // Standard response
    } catch (err) {
      console.error(`[Submissions POST /] Error creating submission for user ${userId}:`, err);
      next(err);
    }
  }
);

// Approve/Reject are handled by admin routes now

export default router;