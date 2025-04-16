/* src/doof-backend/routes/submissions.js */
import express from 'express';
import { query as queryValidator, body, validationResult } from 'express-validator';
import * as SubmissionModel from '../models/submissionModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// --- Middleware & Validation Chains ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Submissions Route Validation Error] Path: ${req.path}`, errors.array());
        // Return only first error message for cleaner API response
        res.status(400).json({ success: false, error: errors.array({ onlyFirstError: true })[0].msg });
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
    // ** Ensure restaurant_id is validated as optional but numeric if provided **
    body('restaurant_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Restaurant ID must be a positive integer if provided').toInt(),
    // ** Updated restaurant_name validation **
    body('restaurant_name').optional({ nullable: true }).trim().isLength({ max: 255 })
        .if(body('type').equals('dish')) // Only apply next validation if type is 'dish'
        .custom((value, { req }) => {
             // Require restaurant ID for dish submissions now
             if (req.body.restaurant_id == null || isNaN(Number(req.body.restaurant_id))) {
                throw new Error('A valid numeric Restaurant ID (restaurant_id) is required for dish submissions.');
             }
             // Restaurant name is now optional for dishes if ID is provided
            return true;
        }),
];


const validateGetSubmissionsQuery = [
    queryValidator('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
];

// GET /api/submissions (Admin view, requires auth, maybe superuser in future)
router.get(
    '/',
    authMiddleware, // Requires login
    // Consider adding requireSuperuser here if only admins should see all submissions
    validateGetSubmissionsQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const status = req.query.status || 'pending';
        try {
            // This fetches potentially ALL submissions with a status, intended for admin
            const submissions = await SubmissionModel.findSubmissionsByStatus(String(status));
            res.json({ success: true, data: submissions });
        } catch (err) {
            console.error(`[Submissions GET /?status=${status}] Error:`, err);
            next(err);
        }
    }
);

// --- NEW ROUTE ---
// GET /api/submissions/my (Fetch submissions for the logged-in user)
router.get(
    '/my',
    authMiddleware, // Requires user to be logged in
    handleValidationErrors, // No specific query params to validate here yet
    async (req, res, next) => {
        const userId = req.user.id; // Get user ID from authenticated request
        try {
            const submissions = await SubmissionModel.findSubmissionsByUserId(userId);
            res.json({ success: true, data: submissions });
        } catch (err) {
            console.error(`[Submissions GET /my] Error fetching submissions for user ${userId}:`, err);
            next(err); // Pass error to global handler
        }
    }
);
// --- END NEW ROUTE ---

// POST /api/submissions (Create a new submission)
router.post(
    '/',
    authMiddleware, // Requires login
    validateCreateSubmission,
    handleValidationErrors,
    async (req, res, next) => {
        // Extract validated data, including restaurant_id
        // ** restaurant_id is now validated to be required for dishes **
        const { type, name, place_id, location, city, neighborhood, restaurant_id, restaurant_name, tags } = req.body;
        const userId = req.user.id;

        try {
            // Construct submission data payload for the model
            const submissionData = {
                type,
                name,
                tags: tags || null, // Pass tags or null
                // Restaurant specific fields
                place_id: type === 'restaurant' ? (place_id || null) : null,
                location: type === 'restaurant' ? (location || null) : null,
                city: type === 'restaurant' ? (city || null) : null,
                neighborhood: type === 'restaurant' ? (neighborhood || null) : null,
                // Dish specific fields (pass validated restaurant_id)
                restaurant_id: type === 'dish' ? restaurant_id : null, // ID is required now by validation
                restaurant_name: type === 'dish' ? (restaurant_name || null) : null, // Name is optional if ID provided
            };

            const newSubmission = await SubmissionModel.createSubmission(submissionData, userId);
            if (!newSubmission) {
                // Model likely handles conflicts, but catch other potential failures
                res.status(400).json({ success: false, error: "Submission creation failed. Please check your data." });
                return;
            }
            res.status(201).json({ success: true, data: newSubmission });
        } catch (err) {
            console.error(`[Submissions POST /] Error creating submission for user ${userId}:`, err);
            // Handle specific foreign key error for restaurant_id
            if (err.code === '23503' && err.constraint === 'fk_submission_restaurant') {
                return res.status(400).json({ success: false, error: `Invalid Restaurant ID (${restaurant_id}) provided for dish submission.` });
            }
            next(err);
        }
    }
);

// Approve/Reject are handled by /api/admin/submissions/:id/approve|reject routes now

export default router;