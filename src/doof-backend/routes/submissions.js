/* src/doof-backend/routes/submissions.js */
import express from 'express';
import { param, query as queryValidator, body, validationResult } from 'express-validator';
// Import model functions
import * as SubmissionModel from '../models/submissionModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// --- Middleware & Validation Chains (Keep as is) ---
const handleValidationErrors = (req, res, next) => { /* ... */ };
const validateSubmissionId = [ /* ... */ ];
const validateCreateSubmission = [ /* ... */ ];
const validateGetSubmissionsQuery = [ /* ... */ ];


// GET /api/submissions
router.get(
  '/',
  authMiddleware,
  validateGetSubmissionsQuery,
  handleValidationErrors,
  async (req, res, next) => {
    const status = req.query.status || 'pending';
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
  authMiddleware,
  validateCreateSubmission,
  handleValidationErrors,
  async (req, res, next) => {
    const submissionData = req.body; // Use validated body
    const userId = req.user.id;
    try {
      const newSubmission = await SubmissionModel.createSubmission(submissionData, userId); // Use Model
      res.status(201).json({ data: newSubmission }); // Standard response
    } catch (err) {
      console.error('[Submissions POST /] Error:', err);
      next(err);
    }
  }
);

// Approve/Reject are handled by admin routes now

export default router;