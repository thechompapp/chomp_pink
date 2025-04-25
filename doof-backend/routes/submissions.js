// Filename: /root/doof-backend/routes/submissions.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
/* FIXED: Changed validatePaginationQuery to validatePagination */
/* FIXED: Removed validatePagination() call, used array directly */
import express from 'express';
import * as submissionController from '../controllers/submissionController.js'; // Use namespace import
import { requireAuth } from '../middleware/auth.js';
import { validateSubmission, handleValidationErrors, validatePagination } from '../middleware/validators.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', validatePagination, handleValidationErrors, submissionController.getUserSubmissions);
router.post('/', validateSubmission, handleValidationErrors, submissionController.createSubmission);

export default router;