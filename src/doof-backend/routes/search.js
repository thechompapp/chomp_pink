/* src/doof-backend/routes/search.js */
import express from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
import * as SearchModel from '../models/searchModel.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Search Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

const validateSearchQuery = [
    queryValidator('q').optional().isString().trim().withMessage('Query must be a string'),
    queryValidator('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt(),
    queryValidator('type').optional().isIn(['all', 'restaurant', 'dish', 'list']).withMessage('Invalid type')
];

router.get('/', validateSearchQuery, handleValidationErrors, async (req, res, next) => {
    const q = req.query.q;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const type = req.query.type || 'all';

    if (!q) {
        // Return success with empty data structure
        return res.json({ success: true, data: { restaurants: [], dishes: [], lists: [] } });
    }

    try {
        const results = await SearchModel.searchAll(String(q), limit, offset); // Ensure q is string

        let responsePayload;
        switch (type) {
            case 'restaurants':
                responsePayload = { restaurants: results.restaurants, dishes: [], lists: [] };
                break;
            case 'dishes':
                responsePayload = { restaurants: [], dishes: results.dishes, lists: [] };
                break;
            case 'lists':
                responsePayload = { restaurants: [], dishes: [], lists: results.lists };
                break;
            case 'all':
            default:
                responsePayload = {
                    restaurants: results.restaurants,
                    dishes: results.dishes.map((dish) => ({
                        ...dish,
                        restaurant: dish.restaurant_name || null // Use null for consistency
                    })),
                    lists: results.lists,
                };
        }

        res.json({ success: true, data: responsePayload }); // Wrap in { success: true, data: ... }
    } catch (error) {
        console.error('[Search] Error executing search:', error);
        next(error);
    }
});

export default router;