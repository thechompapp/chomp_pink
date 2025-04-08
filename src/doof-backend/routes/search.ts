/* src/doof-backend/routes/search.js */
import express from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
// Import model function
import * as SearchModel from '../models/searchModel.js';

const router = express.Router();

// --- Middleware & Validation (Keep as is) ---
const handleValidationErrors = (req, res, next) => { /* ... */ };
const validateSearchQuery = [ /* ... */ ];

// GET /api/search
router.get( '/', validateSearchQuery, handleValidationErrors, async (req, res, next) => {
    const { q, limit = 10, offset = 0, type = 'all' } = req.query;
    if (!q) return res.json({ data: { restaurants: [], dishes: [], lists: [] }}); // Return standard empty structure

    try {
        // Call model function - currently only supports 'all' type search
        // TODO: Enhance model/route if type-specific search is needed
        if (type !== 'all') {
            console.warn(`[Search] Type-specific search ('${type}') not fully implemented in model yet, performing 'all'.`);
        }
        const results = await SearchModel.searchAll(q, limit, offset); // Use Model

        // Format results (dishes already mapped in model example)
        const responsePayload = {
            restaurants: results.restaurants || [],
            dishes: (results.dishes || []).map(dish => ({ ...dish, restaurant: dish.restaurant_name })), // Ensure mapping
            lists: results.lists || [],
        };
        res.json({ data: responsePayload }); // Standard response

    } catch (error) {
        console.error('[Search] Error:', error);
        next(error);
    }
});

export default router;