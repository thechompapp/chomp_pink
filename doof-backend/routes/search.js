/* main/doof-backend/routes/search.js */
// Patch: Ensure /find-restaurant-bulk explicitly returns { status: 'not_found' } when no matches.

import express from 'express';
import { query, body, validationResult } from 'express-validator';
import * as SearchModel from '../models/searchModel.js';
import * as RestaurantModel from '../models/restaurantModel.js'; // Needed for findRestaurantsApproximate
import authMiddleware from '../middleware/auth.js'; // Assuming auth might be needed later
import optionalAuth from '../middleware/optionalAuth.js'; // If needed for user-specific search boosts

const router = express.Router();

// Middleware for handling validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Search Route Validation Error] Path: ${req.path}`, errors.array());
        // Return only first error message for cleaner API response
        return res.status(400).json({ success: false, error: errors.array({ onlyFirstError: true })[0].msg });
    }
    next();
};

// Validation chain for general search GET /api/search
const validateSearchQuery = [
    query('q').optional().isString().trim().escape(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('type').optional().isIn(['all', 'restaurant', 'dish', 'list', 'user']),
    // Add other potential filters like city, neighborhood, cuisine etc. if needed
    query('cityId').optional().isInt({ gt: 0 }).toInt(),
    query('neighborhoodId').optional().isInt({ gt: 0 }).toInt(),
];

// Validation chain for POST /api/search/find-restaurant-bulk
const validateBulkRestaurantLookup = [
    body('restaurantName').trim().notEmpty().withMessage('Restaurant name is required').isLength({ max: 255 }),
    body('cityId')
        .optional({ checkFalsy: true }) // Allows null, undefined, '', 0, false to be skipped
        .isInt({ gt: 0 })
        .withMessage('City ID must be a positive integer if provided')
        .toInt(),
];


// GET /api/search - General search endpoint (Assumed implementation exists using SearchModel.performSearch)
router.get(
    '/',
    optionalAuth, // Use optional auth if personalization is implemented
    validateSearchQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const { q, limit, offset, type, cityId, neighborhoodId } = req.query;
        const userId = req.user?.id; // Get user ID if authenticated

        // Assuming SearchModel.performSearch exists and handles the logic
        // This part is not directly related to the reported error, keeping it concise
        try {
            // --- Placeholder for actual search logic ---
            // const results = await SearchModel.performSearch({ ... });
            // res.json({ success: true, data: results });
            // --- End Placeholder ---
             res.status(501).json({ success: false, error: 'General search endpoint not fully implemented in example.' }); // Placeholder response
        } catch (err) {
            console.error(`[Search GET /] Error performing search:`, err);
            next(err); // Pass to global error handler
        }
    }
);


// POST /api/search/find-restaurant-bulk - Specific lookup for Bulk Add tool
router.post(
    '/find-restaurant-bulk',
    authMiddleware, // Requires user (likely admin/superuser) to be logged in
    validateBulkRestaurantLookup,
    handleValidationErrors,
    async (req, res, next) => {
        // Extract validated data - cityId might be undefined/null now
        const { restaurantName, cityId } = req.body;

        try {
            // Call the model function, passing cityId (which could be null/undefined)
            const matches = await RestaurantModel.findRestaurantsApproximate(restaurantName, cityId);

            // --- UPDATED RESPONSE LOGIC ---
            if (!matches || matches.length === 0) {
                // **Explicitly return 'not_found' status**
                return res.json({ success: true, status: 'not_found', data: [] });
            } else if (matches.length === 1 && matches[0].score > RestaurantModel.SINGLE_MATCH_THRESHOLD) {
                // Single high-confidence match
                return res.json({ success: true, status: 'found', data: matches[0] });
            } else {
                // Multiple matches or single low-confidence match -> treat as suggestions
                return res.json({ success: true, status: 'suggestions', data: matches });
            }
            // --- END UPDATED RESPONSE LOGIC ---

        } catch (err) {
            console.error(`[Search POST /find-restaurant-bulk] Error finding restaurant "${restaurantName}" (CityID: ${cityId}):`, err);
            // Return a generic error structure for actual errors
             res.status(500).json({ success: false, status: 'error', message: err.message || 'Failed to perform restaurant lookup.' });
            // Or use next(err) if a global error handler sends JSON responses
            // next(err);
        }
    }
);


export default router;