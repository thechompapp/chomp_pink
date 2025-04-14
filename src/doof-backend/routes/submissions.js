/* src/doof-backend/routes/submissions.js */
import express from 'express';
import { query as queryValidator, body, validationResult } from 'express-validator';
import * as SubmissionModel from '../models/submissionModel.js';
import authMiddleware from '../middleware/auth.js';
// REMOVED: import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// --- Middleware & Validation Chains ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Submissions Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg });
        return;
    }
    next();
};

const validateCreateSubmission = [
    body('name').trim().notEmpty().withMessage('Submission name required').isLength({ max: 255 }),
    body('type').isIn(['restaurant', 'dish']).withMessage('Invalid submission type'),
    body('location').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('city').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('neighborhood').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('tags').optional({ nullable: true }).isArray().withMessage('Tags must be an array')
        .custom((tags) => tags.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('place_id').optional({ nullable: true }).trim().isLength({ max: 255 }),
    body('restaurant_name').optional({ nullable: true }).trim().isLength({ max: 255 })
        .if(body('type').equals('dish'))
        .custom((value, { req }) => {
            if (!req.body.place_id && !value) {
                throw new Error('Restaurant name is required for dish submissions without a Google Place ID.');
            }
            return true;
        }),
];

const validateGetSubmissionsQuery = [
    queryValidator('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
];

// GET /api/submissions - Requires auth (for user's submissions or admin view)
router.get(
  '/',
  authMiddleware,
  validateGetSubmissionsQuery,
  handleValidationErrors,
  async (req, res, next) => {
    // If only admins should see all submissions, add requireSuperuser middleware here
    // requireSuperuser(req, res, () => { /* proceed */ });
    // Or filter by req.user.id if regular users can see their own
    const status = req.query.status || 'pending'; // Default to pending if not specified
    try {
      // Adjust findSubmissionsByStatus if it needs filtering by user ID
      const submissions = await SubmissionModel.findSubmissionsByStatus(String(status)); // Ensure string
      res.json({ success: true, data: submissions }); // Wrap response
    } catch (err) {
      console.error(`[Submissions GET /?status=${status}] Error:`, err);
      next(err);
    }
  }
);

// POST /api/submissions - Requires auth
router.post(
  '/',
  authMiddleware,
  validateCreateSubmission,
  handleValidationErrors,
  async (req, res, next) => {
    const submissionData = req.body;
    const userId = req.user.id;
    try {
      const newSubmission = await SubmissionModel.createSubmission(submissionData, userId);
      if (!newSubmission) {
          // console.warn(`[Submissions POST /] Submission creation failed for user ${userId}. Data: ${JSON.stringify(submissionData)}`); // Optional
          res.status(400).json({ success: false, error: "Submission creation failed. Invalid data?" }); // Add success flag
          return;
      }
      res.status(201).json({ success: true, data: newSubmission }); // Wrap response
    } catch (err) {
      console.error(`[Submissions POST /] Error creating submission for user ${userId}:`, err);
      next(err);
    }
  }
);

// Approve/Reject are handled by /api/admin/submissions/:id/approve|reject routes

export default router;