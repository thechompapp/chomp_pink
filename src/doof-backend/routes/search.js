const express = require('express');
const db = require('../db');
const { query, validationResult } = require('express-validator');

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn("[Search Validation Error]", req.path, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

router.get('/', [
    query('q').trim().notEmpty().withMessage('Search query is required'),
    query('type').optional().isIn(['dishes', 'restaurants', 'lists', 'all']).withMessage('Invalid type'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
], handleValidationErrors, async (req, res, next) => {
    const { q: searchQuery, type = 'all', limit = 10, offset = 0 } = req.query;

    try {
        const results = { dishes: [], restaurants: [], lists: [] };

        if (type === 'all' || type === 'dishes') {
            const dishQuery = `
                SELECT d.id, d.name, d.adds, r.name AS restaurant_name, r.city_name, r.neighborhood_name,
                       COALESCE(ARRAY_AGG(h.name) FILTER (WHERE h.name IS NOT NULL), ARRAY[]::TEXT[]) AS tags
                FROM Dishes d
                LEFT JOIN Restaurants r ON d.restaurant_id = r.id
                LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
                LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
                WHERE d.name ILIKE $1
                GROUP BY d.id, r.id
                ORDER BY d.adds DESC
                LIMIT $2 OFFSET $3
            `;
            const dishResult = await db.query(dishQuery, [`%${searchQuery}%`, limit, offset]);
            results.dishes = dishResult.rows;
        }

        if (type === 'all' || type === 'restaurants') {
            const restaurantQuery = `
                SELECT r.id, r.name, r.city_name, r.neighborhood_name, r.adds,
                       COALESCE(ARRAY_AGG(h.name) FILTER (WHERE h.name IS NOT NULL), ARRAY[]::TEXT[]) AS tags
                FROM Restaurants r
                LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
                LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
                WHERE r.name ILIKE $1
                GROUP BY r.id
                ORDER BY r.adds DESC
                LIMIT $2 OFFSET $3
            `;
            const restaurantResult = await db.query(restaurantQuery, [`%${searchQuery}%`, limit, offset]);
            results.restaurants = restaurantResult.rows;
        }

        if (type === 'all' || type === 'lists') {
            const listQuery = `
                SELECT l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
                       l.creator_handle, l.created_at, l.updated_at,
                       COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER AS item_count
                FROM Lists l
                WHERE l.name ILIKE $1 AND l.is_public = TRUE
                ORDER BY l.saved_count DESC
                LIMIT $2 OFFSET $3
            `;
            const listResult = await db.query(listQuery, [`%${searchQuery}%`, limit, offset]);
            results.lists = listResult.rows.map(list => ({
                ...list,
                is_following: false, // Adjust if user auth is added
                created_by_user: false, // Adjust if user auth is added
            }));
        }

        res.json(results);
    } catch (err) {
        console.error('[Search GET /] Error:', err);
        next(err);
    }
});

module.exports = router;