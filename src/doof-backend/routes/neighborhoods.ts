// src/doof-backend/routes/neighborhoods.ts
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
import * as neighborhoodModel from '../models/neighborhoodModel.js'; // Use .js extension
import type { Neighborhood } from '../models/neighborhoodModel.js';

const router = express.Router();

// Middleware for handling validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Neighborhoods Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg });
        return;
    }
    next();
};

// Validation for the zipcode query parameter
const validateZipcodeQuery: ValidationChain[] = [
    queryValidator('zipcode')
        .trim()
        .notEmpty().withMessage('Zipcode query parameter is required.')
        .matches(/^\d{5}$/).withMessage('Zipcode must be a 5-digit number.'),
];

/**
 * GET /api/neighborhoods/by-zipcode
 * Finds a neighborhood based on a provided 5-digit zipcode.
 */
router.get(
    '/by-zipcode',
    validateZipcodeQuery,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const zipcode = req.query.zipcode as string; // Already validated

        try {
            const neighborhood = await neighborhoodModel.findNeighborhoodByZipcode(zipcode);

            if (!neighborhood) {
                // It's okay to not find a neighborhood, return success with null data
                return res.status(200).json({ data: null });
            }

            // Return the found neighborhood data
            res.status(200).json({ data: neighborhood });

        } catch (error) {
            console.error(`[GET /api/neighborhoods/by-zipcode] Error finding neighborhood for zipcode ${zipcode}:`, error);
            // Pass error to the global error handler
            next(error);
        }
    }
);

export default router;