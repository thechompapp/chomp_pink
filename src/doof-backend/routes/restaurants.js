// src/doof-backend/routes/restaurants.js (Added query validation)
const express = require('express');
const db = require('../db');
const { param, query, validationResult } = require('express-validator'); // Added query

const router = express.Router();

// Handle validation errors
const handleValidationErrors = (req, res, next) => { /* ... */ };

// Validation for ID parameter
const validateIdParam = [ /* ... */ ];

// Validation for list query parameters
const validateListQuery = [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer.'),
    // Add validation for other potential query params like 'search', 'tags', 'cityId' later
];

// === Restaurant Detail ===
router.get( "/:id", validateIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );


// GET /api/restaurants (Search/List Restaurants - Added query validation)
router.get(
    "/",
    validateListQuery, // Validate query parameters
    handleValidationErrors,
    async (req, res) => {
        // Use validated and sanitized values
        const limit = req.query.limit ? parseInt(req.query.limit) : 20; // Default limit
        const offset = req.query.offset ? parseInt(req.query.offset) : 0; // Default offset

        // TODO: Implement filtering based on validated query params (e.g., search, tags)

        try {
            const result = await db.query(
                 `SELECT r.id, r.name, r.neighborhood_name as neighborhood, r.city_name as city, r.adds,
                         COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
                  FROM Restaurants r
                  LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
                  LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
                  GROUP BY r.id
                  ORDER BY r.adds DESC, r.name ASC
                  LIMIT $1 OFFSET $2`,
                  [limit, offset]
             );
             // TODO: Get total count for pagination headers
             res.json(result.rows || []);
        } catch (err) {
             console.error("/api/restaurants (GET List) error:", err);
             res.status(500).json({ error: "Error fetching restaurants" });
        }
    }
);

module.exports = router;