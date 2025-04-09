/* src/doof-backend/routes/submissions.ts */ // Changed comment to reflect TS file
import express, { Request, Response, NextFunction } from 'express'; // Added types
import { param, query as queryValidator, body, validationResult, ValidationChain } from 'express-validator'; // Added ValidationChain
// Import model functions
import * as SubmissionModel from '../models/submissionModel.js'; // Keep .js
import authMiddleware from '../middleware/auth.js'; // Keep .js
import type { AuthenticatedRequest } from '../middleware/auth.js'; // Keep .js

const router = express.Router();

// --- Middleware & Validation Chains (Keep as is) ---
// FIX: Add types to parameters
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Submissions Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return; // Explicit return
    }
    next();
};

// Original file had these commented out - Add dummy definitions with types if needed, or remove if unused
// const validateSubmissionId: ValidationChain[] = [ /* ... */ ]; // FIX: Added type
// FIX: Added type
const validateCreateSubmission: ValidationChain[] = [
    body('name').trim().notEmpty().withMessage('Submission name required'),
    // Add other necessary validation rules for creation here...
    // Example:
    body('type').isIn(['restaurant', 'dish']).withMessage('Invalid submission type'),
    body('details').optional().isObject().withMessage('Details must be an object'),
];
// FIX: Added type
const validateGetSubmissionsQuery: ValidationChain[] = [
    queryValidator('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
];


// GET /api/submissions
router.get(
  '/',
  authMiddleware, // Requires authentication
  validateGetSubmissionsQuery, // Type ValidationChain[] applied
  handleValidationErrors,
  // FIX: Add types to parameters
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Assuming only superusers or specific users should see submissions?
    // Add requireSuperuser middleware if needed, or logic based on req.user
    // Example: Check if user is superuser
    // if (req.user?.account_type !== 'superuser') {
    //    return res.status(403).json({ error: 'Access denied.' });
    // }

    const status = (req.query.status as string) || 'pending'; // Added type assertion
    try {
      const submissions = await SubmissionModel.findSubmissionsByStatus(status); // Use Model
      res.json({ data: submissions }); // Standard response
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
  validateCreateSubmission, // Type ValidationChain[] applied
  handleValidationErrors,
  // FIX: Add types to parameters
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const submissionData = req.body; // Use validated body
    const userId = req.user!.id; // Non-null assertion because of authMiddleware
    try {
      const newSubmission = await SubmissionModel.createSubmission(submissionData, userId); // Use Model
      if (!newSubmission) {
          // Handle potential creation failures (e.g., validation within model)
          console.warn(`[Submissions POST /] Submission creation failed for user ${userId}. Data: ${JSON.stringify(submissionData)}`);
          // Return a more specific error if possible, otherwise a general one
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