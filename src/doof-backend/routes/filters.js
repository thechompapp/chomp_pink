/* src/doof-backend/routes/filters.js */
import express from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
// Import model functions instead of db directly
import * as FilterModel from '../models/filterModel.js';

const router = express.Router();

// Middleware remains the same
const handleValidationErrors = (req, res, next) => { /* ... */ };

// Validation for neighborhoods query
const validateNeighborhoodsQuery = [
    queryValidator('cityId').isInt({ gt: 0 }).withMessage('cityId query parameter must be a positive integer').toInt(),
];

router.get('/cities', async (req, res, next) => {
  try {
    const cities = await FilterModel.getCities(); // Use Model
    res.json({ data: cities }); // Standard response
  } catch (error) {
    console.error('[Filters] Error fetching cities:', error);
    next(error);
  }
});

router.get('/cuisines', async (req, res, next) => {
  try {
    const cuisines = await FilterModel.getCuisines(); // Use Model
    res.json({ data: cuisines }); // Standard response
  } catch (error) {
    console.error('[Filters] Error fetching cuisines:', error);
    next(error);
  }
});

router.get(
    '/neighborhoods',
    validateNeighborhoodsQuery, // Apply validation
    handleValidationErrors,
    async (req, res, next) => {
        // Validation passed
        const { cityId } = req.query; // Use validated & coerced cityId
        try {
            const neighborhoods = await FilterModel.getNeighborhoodsByCity(cityId); // Use Model
            res.json({ data: neighborhoods }); // Standard response
        } catch (error) {
            console.error('[Filters] Error fetching neighborhoods:', error);
            next(error);
        }
    }
);

export default router;