/* src/doof-backend/routes/trending.ts */
import express, { Request, Response, NextFunction } from 'express';
import { getTrendingRestaurants, getTrendingDishes, getTrendingLists } from '../models/trending.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';

const router = express.Router();

interface AuthenticatedRequest extends Request {
    user?: { id: number };
}

router.get('/restaurants', async (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt(String(req.query.limit), 10) || 10;
    try {
        const restaurants = await getTrendingRestaurants(limit);
        res.json({ data: restaurants });
    } catch (err) {
        console.error('[TRENDING GET /restaurants] Error:', err);
        next(err);
    }
});

router.get('/dishes', async (req: Request, res: Response, next: NextFunction) => {
    const limit = parseInt(String(req.query.limit), 10) || 10;
    try {
        const dishes = await getTrendingDishes(limit);
        res.json({ data: dishes });
    } catch (err) {
        console.error('[TRENDING GET /dishes] Error:', err);
        next(err);
    }
});

router.get('/lists', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const limit = parseInt(String(req.query.limit), 10) || 10;
    console.log(`[TRENDING GET /lists] User ID: ${userId || 'Guest'}`);

    try {
        const lists = await getTrendingLists(userId, limit);
        console.log(`[TRENDING GET /lists] Returning ${lists.length} lists.`);
        res.json({ data: lists });
    } catch (err) {
        console.error('[TRENDING GET /lists] Error:', (err as Error).message, 'Code:', (err as any).code, 'Position:', (err as any).position);
        next(err);
    }
});

export default router;