/* src/doof-backend/routes/trending.js */
import express from 'express';
import { getTrendingRestaurants, getTrendingDishes, getTrendingLists } from '../models/trending.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';

const router = express.Router();

router.get('/restaurants', async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    try {
        const restaurants = await getTrendingRestaurants(limit);
        res.json({ data: restaurants }); // Wrap in { data: ... }
    } catch (err) {
        console.error('[TRENDING GET /restaurants] Error:', err);
        next(err);
    }
});

router.get('/dishes', async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    try {
        const dishes = await getTrendingDishes(limit);
        res.json({ data: dishes }); // Wrap in { data: ... }
    } catch (err) {
        console.error('[TRENDING GET /dishes] Error:', err);
        next(err);
    }
});

router.get('/lists', optionalAuthMiddleware, async (req, res, next) => {
    const userId = req.user?.id;
    const limit = parseInt(req.query.limit) || 10;
    console.log(`[TRENDING GET /lists] User ID: ${userId || 'Guest'}`);

    try {
        const lists = await getTrendingLists(userId, limit);
        console.log(`[TRENDING GET /lists] Returning ${lists.length} lists.`);
        res.json({ data: lists }); // Wrap in { data: ... }
    } catch (err) {
        console.error('[TRENDING GET /lists] Error:', err.message, 'Code:', err.code, 'Position:', err.position);
        next(err);
    }
});

export default router;