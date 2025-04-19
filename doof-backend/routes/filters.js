/* src/doof-backend/routes/filters.js */
import express from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
import * as FilterModel from '../models/filterModel.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Filters Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

const validateNeighborhoodsQuery = [
    queryValidator('cityId')
        .exists({ checkFalsy: true }).withMessage('cityId query parameter is required')
        .isInt({ gt: 0 }).withMessage('cityId must be a positive integer')
        .toInt(),
];

router.get('/cities', async (req, res, next) => {
    try {
        const cities = await FilterModel.getCities();
        res.json({ data: cities });
    } catch (error) {
        console.error('[Filters GET /cities] Error fetching cities:', error);
        next(error);
    }
});

router.get('/cuisines', async (req, res, next) => {
    try {
        const cuisines = await FilterModel.getCuisines();
        res.json({ data: cuisines });
    } catch (error) {
        console.error('[Filters GET /cuisines] Error fetching cuisines:', error);
        next(error);
    }
});

router.get(
    '/neighborhoods',
    validateNeighborhoodsQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const cityId = req.query.cityId; // Already validated and converted
        try {
            const neighborhoods = await FilterModel.getNeighborhoodsByCity(cityId);
            res.json({ data: neighborhoods });
        } catch (error) {
            console.error(`[Filters GET /neighborhoods] Error fetching neighborhoods for cityId ${cityId}:`, error);
            next(error);
        }
    }
);

export default router;