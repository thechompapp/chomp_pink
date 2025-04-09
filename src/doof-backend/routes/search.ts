import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
// FIX: Changed .ts to .js
import * as SearchModel from '../models/searchModel.js';

const router = express.Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Search Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg }); // Removed return
        return; // Explicit return
    }
    next();
};

const validateSearchQuery: ValidationChain[] = [
    queryValidator('q').optional().isString().trim().withMessage('Query must be a string'), // Added trim
    queryValidator('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt(), // Added max limit
    queryValidator('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt(),
    queryValidator('type').optional().isIn(['all', 'restaurants', 'dishes', 'lists']).withMessage('Invalid type')
];

router.get('/', validateSearchQuery, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    // Use validated and typed query parameters
    const q = req.query.q as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10; // Default limit
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0; // Default offset
    const type = (req.query.type as string) || 'all'; // Default type

    // Return early if query is missing or empty after trimming
    if (!q) {
        return res.json({ data: { restaurants: [], dishes: [], lists: [] } });
    }

    try {
        // The model searchAll should ideally handle the 'type' parameter filtering
        // If not, filtering might need to happen here based on 'type'
        if (type !== 'all') {
            // If model doesn't support type filtering, log a warning or implement filtering here
            console.warn(`[Search] Type-specific search ('${type}') might not be fully implemented in model, performing 'all'.`);
        }
        // Pass validated parameters to the model function
        const results = await SearchModel.searchAll(q, limit, offset); // Assuming model handles type internally or returns all

        // Structure the response payload consistently
        // Ensure results object and its properties exist before accessing
        const responsePayload = {
            restaurants: results?.restaurants || [],
            // Map dishes to include restaurant name if needed by frontend
            dishes: (results?.dishes || []).map((dish: any) => ({
                ...dish,
                // Use a consistent property name, e.g., restaurant_name if available from model
                restaurant: dish.restaurant_name || null
            })),
            lists: results?.lists || [],
        };
        res.json({ data: responsePayload });
    } catch (error) {
        console.error('[Search] Error executing search:', error);
        next(error); // Pass error to global handler
    }
});

export default router;