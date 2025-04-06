// src/doof-backend/routes/dishes.js
import express from 'express';
import { param, body, validationResult } from 'express-validator';
// Corrected imports:
import db from '../db/index.js';

const router = express.Router();

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Dishes Router Validation Error]", req.path, errors.array());
    // Ensure JSON error response
    return res.status(400).json({ error: errors.array()[0].msg || 'Validation failed' }); // Simplified error
  }
  next();
};

// Validation for ID parameter
const validateIdParam = [
  param('id').isInt({ gt: 0 }).withMessage('Invalid Dish ID format in URL.'),
];

// === List Dishes for Autosuggest ===
router.get("/", async (req, res, next) => {
    const { name } = req.query;
    const currentDb = req.app?.get('db') || db;
    try {
      let query = `SELECT id, name FROM Dishes`;
      const params = [];
      if (name) {
        // Use ILIKE for case-insensitive search
        query += ` WHERE name ILIKE $1`;
        params.push(`%${name}%`); // Add wildcards for partial matching
      }
      // Order and limit results for suggestions
      query += ` ORDER BY name ASC LIMIT 20`;

      const result = await currentDb.query(query, params);
      res.json(result.rows || []); // Ensure array response
    } catch (err) {
      console.error("/api/dishes (GET List) error:", err);
      next(err); // Forward error
    }
});


// === Dish Detail ===
router.get(
  "/:id",
  validateIdParam,
  handleValidationErrors,
  async (req, res, next) => {
    const { id } = req.params;
    const currentDb = req.app?.get('db') || db;
    console.log(`[DISHES GET /:id] Request for ID: ${id}`);

    try {
      // Query to fetch dish details, restaurant info, and dish tags
      const dishQuery = `
        SELECT
          d.id, d.name, d.adds, d.created_at, d.restaurant_id,
          r.name AS restaurant_name,
          r.city_name,
          r.neighborhood_name,
          -- Aggregate dish tags safely, default to empty array
          COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
        FROM Dishes d
        LEFT JOIN Restaurants r ON d.restaurant_id = r.id -- Join to get restaurant info
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id -- Join to get tag associations
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id -- Join to get tag names
        WHERE d.id = $1
        GROUP BY d.id, r.id -- Group by dish and restaurant to aggregate tags
      `;

      console.log(`[DISHES GET /:id] Executing query for ID: ${id}`);
      const dishResult = await currentDb.query(dishQuery, [id]);

      if (dishResult.rows.length === 0) {
        console.log(`[DISHES GET /:id] Dish not found for ID: ${id}`);
        return res.status(404).json({ error: "Dish not found" });
      }
      const dishData = dishResult.rows[0];
      console.log(`[DISHES GET /:id] Successfully fetched dish: ${dishData.name}`);

      // Format the response for frontend consistency
      const responseData = {
          id: dishData.id,
          name: dishData.name,
          adds: dishData.adds || 0,
          created_at: dishData.created_at,
          restaurant_id: dishData.restaurant_id,
          restaurant_name: dishData.restaurant_name,
          city: dishData.city_name, // Map city_name to city
          neighborhood: dishData.neighborhood_name, // Map neighborhood_name to neighborhood
          tags: Array.isArray(dishData.tags) ? dishData.tags : [] // Ensure tags is array
      };

      res.json(responseData); // Send formatted JSON response

    } catch (err) {
      console.error(`/api/dishes/${id} (GET Detail) error:`, err);
      next(err); // Forward error to central handler
    }
  }
);


// === Submit Dish (Endpoint disabled) ===
router.post("/", async (req, res) => {
  res.status(405).json({ error: "Direct dish creation not allowed via this endpoint. Please use the submissions process." });
});

// Corrected export
export default router;