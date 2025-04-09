/* src/doof-backend/routes/filters.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
import * as FilterModel from '../models/filterModel.js'; // Added .js

const router = express.Router();

// Middleware for handling validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Filters Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Validation chain for the neighborhoods endpoint query parameters
const validateNeighborhoodsQuery: ValidationChain[] = [
    // Ensure cityId is present, is an integer greater than 0, and convert it to int
    queryValidator('cityId')
        .exists({ checkFalsy: true }).withMessage('cityId query parameter is required')
        .isInt({ gt: 0 }).withMessage('cityId must be a positive integer')
        .toInt(),
];

// GET /api/filters/cities
router.get('/cities', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cities = await FilterModel.getCities();
        // Wrap response in 'data' object for consistency
        res.json({ data: cities });
    } catch (error) {
        console.error('[Filters GET /cities] Error fetching cities:', error);
        next(error); // Pass error to global handler
    }
});

// GET /api/filters/cuisines
router.get('/cuisines', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cuisines = await FilterModel.getCuisines();
        // Wrap response in 'data' object for consistency
        res.json({ data: cuisines });
    } catch (error) {
        console.error('[Filters GET /cuisines] Error fetching cuisines:', error);
        next(error); // Pass error to global handler
    }
});

// GET /api/filters/neighborhoods?cityId=<number>
router.get(
    '/neighborhoods',
    validateNeighborhoodsQuery, // Apply validation rules
    handleValidationErrors, // Handle validation errors
    async (req: Request, res: Response, next: NextFunction) => {
        // cityId is already validated and converted to integer
        const cityId = req.query.cityId as unknown as number;

        try {
            const neighborhoods = await FilterModel.getNeighborhoodsByCity(cityId);
            // Wrap response in 'data' object for consistency
            res.json({ data: neighborhoods });
        } catch (error) {
            console.error(`[Filters GET /neighborhoods] Error fetching neighborhoods for cityId ${cityId}:`, error);
            next(error); // Pass error to global handler
        }
    }
);

export default router;