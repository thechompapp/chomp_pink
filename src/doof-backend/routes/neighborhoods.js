/* src/doof-backend/routes/neighborhoods.js */
import express from 'express';
import { query as queryValidator, param, validationResult } from 'express-validator';
import * as neighborhoodModel from '../models/neighborhoodModel.js'; // Use .js extension
// REMOVED: import type { Neighborhood } from '../models/neighborhoodModel.js'; // Use local type if not shared
import db from '../db/index.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Neighborhoods Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg });
        return;
    }
    next();
};

const validateZipcodeParam = [
    param('zipcode')
        .trim()
        .notEmpty().withMessage('Zipcode parameter is required.')
        .matches(/^\d{5}$/).withMessage('Zipcode must be a 5-digit number.'),
];

const validateGetListQuery = [
    queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    queryValidator('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    queryValidator('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search term too long or invalid characters'),
    queryValidator('sort').optional().isString().matches(/^[a-zA-Z0-9_.]+_(asc|desc)$/i).withMessage('Invalid sort format (column_direction)'),
    queryValidator('cityId').optional().isInt({ gt: 0 }).withMessage('City ID must be a positive integer').toInt(),
];

router.get(
    '/by-zipcode/:zipcode',
    validateZipcodeParam,
    handleValidationErrors,
    async (req, res, next) => {
        const { zipcode } = req.params;

        try {
            const neighborhood = await neighborhoodModel.findNeighborhoodByZipcode(zipcode);

            if (!neighborhood) {
                return res.status(404).json({ message: `Neighborhood not found for zipcode ${zipcode}` });
            }

            res.status(200).json(neighborhood); // Return data directly, not wrapped in { data: ... } based on usage

        } catch (error) {
            console.error(`[GET /api/neighborhoods/by-zipcode] Error finding neighborhood for zipcode ${zipcode}:`, error);
            next(error);
        }
    }
);

router.get(
    '/',
    validateGetListQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 20;
        const search = req.query.search;
        const sortQuery = req.query.sort;
        const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
        const offset = (page - 1) * limit;

        let sortBy = 'neighborhoods.name';
        let sortOrder = 'ASC';

        if (sortQuery) {
            const parts = String(sortQuery).split('_');
            const dir = parts.pop()?.toLowerCase();
            const col = parts.join('_');
            const allowedSortColumns = ['neighborhoods.id', 'neighborhoods.name', 'cities.name', 'neighborhoods.created_at', 'neighborhoods.updated_at'];
             if (col && allowedSortColumns.includes(col) && (dir === 'asc' || dir === 'desc')) {
                sortBy = col;
                sortOrder = dir.toUpperCase();
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

            res.status(200).json({ // Wrap in { data: ..., pagination: ... } for consistency
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