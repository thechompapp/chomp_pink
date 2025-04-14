/* src/doof-backend/routes/trending.js */
/* REMOVED: All TypeScript syntax */
import express from 'express';
// Corrected imports - Add .js extension back
import { getTrendingRestaurants, getTrendingDishes, getTrendingLists } from '../models/trending.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
// REMOVED: import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/restaurants', async (req, res, next) => { // REMOVED: Type hints
    const limit = parseInt(String(req.query.limit), 10) || 10;
    try {
        const restaurants = await getTrendingRestaurants(limit);
        res.json({ data: restaurants });
    } catch (err) {
        console.error('[TRENDING GET /restaurants] Error:', err);
        next(err);
    }
});

router.get('/dishes', async (req, res, next) => { // REMOVED: Type hints
    const limit = parseInt(String(req.query.limit), 10) || 10;
    try {
        const dishes = await getTrendingDishes(limit);
        res.json({ data: dishes });
    } catch (err) {
        console.error('[TRENDING GET /dishes] Error:', err);
        next(err);
    }
});

router.get('/lists', optionalAuthMiddleware, async (req, res, next) => { // REMOVED: Type hints (AuthenticatedRequest)
    const userId = req.user?.id;
    const limit = parseInt(String(req.query.limit), 10) || 10;
    console.log(`[TRENDING GET /lists] User ID: ${userId || 'Guest'}`);

    try {
        const lists = await getTrendingLists(userId, limit);
        console.log(`[TRENDING GET /lists] Returning ${lists.length} lists.`);
        res.json({ data: lists });
    } catch (err) {
        // Check if error has properties before accessing them
        const message = err?.message || 'Unknown error';
        const code = err?.code || 'N/A';
        const position = err?.position || 'N/A';
        console.error('[TRENDING GET /lists] Error:', message, 'Code:', code, 'Position:', position);
        next(err);
    }
});

export default router;