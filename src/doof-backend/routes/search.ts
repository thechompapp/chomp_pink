/* src/doof-backend/routes/search.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
// Corrected imports - Add .js extension back
import * as SearchModel from '../models/searchModel.js';

const router = express.Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Search Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

const validateSearchQuery: ValidationChain[] = [
    queryValidator('q').optional().isString().trim().withMessage('Query must be a string'),
    queryValidator('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50').toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt(),
    queryValidator('type').optional().isIn(['all', 'restaurant', 'dish', 'list']).withMessage('Invalid type')
];

router.get('/', validateSearchQuery, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    const q = req.query.q as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const type = (req.query.type as string) || 'all';

    if (!q) {
        return res.json({ data: { restaurants: [], dishes: [], lists: [] } });
    }

    try {
        const results = await SearchModel.searchAll(q, limit, offset);

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
                    // Added explicit type 'any' for dish in map, or define a more specific intermediate type if needed
                    dishes: results.dishes.map((dish: any) => ({
                        ...dish,
                        restaurant: dish.restaurant_name || null // Use null instead of undefined for JSON consistency
                    })),
                    lists: results.lists,
                };
        }

        res.json({ data: responsePayload });
    } catch (error) {
        console.error('[Search] Error executing search:', error);
        next(error);
    }
});

export default router;