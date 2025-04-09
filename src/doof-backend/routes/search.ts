import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
import * as SearchModel from '../models/searchModel.ts';

const router = express.Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Search Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

const validateSearchQuery: ValidationChain[] = [
    queryValidator('q').optional().isString().withMessage('Query must be a string'),
    queryValidator('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer').toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative').toInt(),
    queryValidator('type').optional().isIn(['all', 'restaurants', 'dishes', 'lists']).withMessage('Invalid type')
];

router.get('/', validateSearchQuery, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    const { q, limit = 10, offset = 0, type = 'all' } = req.query;
    if (!q) return res.json({ data: { restaurants: [], dishes: [], lists: [] } });

    try {
        if (type !== 'all') {
            console.warn(`[Search] Type-specific search ('${type}') not fully implemented in model yet, performing 'all'.`);
        }
        const results = await SearchModel.searchAll(q as string, Number(limit), Number(offset));

        const responsePayload = {
            restaurants: results.restaurants || [],
            dishes: (results.dishes || []).map((dish: any) => ({ ...dish, restaurant: dish.restaurant_name })),
            lists: results.lists || [],
        };
        res.json({ data: responsePayload });
    } catch (error) {
        console.error('[Search] Error:', error);
        next(error);
    }
});

export default router;