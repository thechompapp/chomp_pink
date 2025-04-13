// src/doof-backend/routes/neighborhoods.ts
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, param, validationResult, ValidationChain } from 'express-validator'; // Added param
import * as neighborhoodModel from '../models/neighborhoodModel.js'; // Use .js extension
import type { Neighborhood } from '../models/neighborhoodModel.js'; // Use local type if not shared
import db from '../db/index.js';

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

// Validation for the zipcode path parameter
const validateZipcodeParam: ValidationChain[] = [
    param('zipcode')
        .trim()
        .notEmpty().withMessage('Zipcode parameter is required.')
        .matches(/^\d{5}$/).withMessage('Zipcode must be a 5-digit number.'),
];

// Validation rules for GET / (listing neighborhoods)
const validateGetListQuery: ValidationChain[] = [
    queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    queryValidator('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    queryValidator('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search term too long or invalid characters'),
    queryValidator('sort').optional().isString().matches(/^[a-zA-Z0-9_.]+_(asc|desc)$/i).withMessage('Invalid sort format (column_direction)'),
    queryValidator('cityId').optional().isInt({ gt: 0 }).withMessage('City ID must be a positive integer').toInt(),
];

/**
 * GET /api/neighborhoods/by-zipcode/:zipcode
 * Finds a neighborhood based on a provided 5-digit zipcode path parameter.
 */
router.get(
    '/by-zipcode/:zipcode',
    validateZipcodeParam,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const { zipcode } = req.params;

        try {
            const neighborhood = await neighborhoodModel.findNeighborhoodByZipcode(zipcode);

            if (!neighborhood) {
                // Neighborhood not found is a valid outcome, return 404 as per original intent in admin form
                return res.status(404).json({ message: `Neighborhood not found for zipcode ${zipcode}` });
            }

            // Return the found neighborhood data
            res.status(200).json(neighborhood);

        } catch (error) {
            console.error(`[GET /api/neighborhoods/by-zipcode] Error finding neighborhood for zipcode ${zipcode}:`, error);
            // Pass error to the global error handler
            next(error);
        }
    }
);

/**
 * GET /api/neighborhoods
 * Get all neighborhoods with optional filtering, sorting, pagination.
 */
router.get(
    '/',
    validateGetListQuery,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 20; // Default limit
        const search = req.query.search as string | undefined;
        const sortQuery = req.query.sort as string | undefined;
        const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
        const offset = (page - 1) * limit;

        let sortBy = 'neighborhoods.name'; // Default sort column
        let sortOrder: 'ASC' | 'DESC' = 'ASC'; // Default sort order

        if (sortQuery) {
            const parts = sortQuery.split('_');
            const dir = parts.pop()?.toLowerCase();
            const col = parts.join('_');
             // Use validation list from model or define here
            const allowedSortColumns = ['neighborhoods.id', 'neighborhoods.name', 'cities.name', 'neighborhoods.created_at', 'neighborhoods.updated_at'];
             if (col && allowedSortColumns.includes(col) && (dir === 'asc' || dir === 'desc')) {
                sortBy = col;
                sortOrder = dir.toUpperCase() as 'ASC' | 'DESC';
             } else {
                 console.warn(`[GET /api/neighborhoods] Invalid sort parameter ignored: ${sortQuery}`);
             }
        }

        try {
            const { neighborhoods, total } = await neighborhoodModel.getAllNeighborhoods(
                limit,
                offset,
                sortBy,
                sortOrder,
                search,
                cityId
            );

            res.status(200).json({
                data: neighborhoods,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('[GET /api/neighborhoods] Error fetching neighborhoods:', error);
            next(error);
        }
    }
);

export default router;