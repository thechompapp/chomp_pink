// src/doof-backend/routes/dishes.js
// FIXED: Corrected column names r.city->r.city_name, r.neighborhood->r.neighborhood_name
const express = require('express');
const db = require('../db');
const { param, body, validationResult } = require('express-validator');

const router = express.Router();

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Dishes Router Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Validation for ID parameter
const validateIdParam = [
  param('id').isInt({ gt: 0 }).withMessage('Invalid Dish ID format in URL.'),
];

// Validation for voting body
const validateVoteBody = [
  body('vote_type').isIn(['up', 'neutral', 'down']).withMessage('Invalid vote type specified (must be up, neutral, or down).'),
];

// === List Dishes for Autosuggest ===
router.get("/", async (req, res) => {
    const { name } = req.query; // Support filtering by name for suggestions
    try {
      let query = `SELECT id, name FROM Dishes`;
      const params = [];
      if (name) {
        query += ` WHERE name ILIKE $1`;
        params.push(`%${name}%`);
      }
      query += ` ORDER BY name ASC LIMIT 20`; // Add limit

      const result = await db.query(query, params);
      res.json(result.rows || []);
    } catch (err) {
      console.error("/api/dishes (GET List) error:", err);
      res.status(500).json({ error: "Error fetching dishes" });
    }
});

// === Dish Detail ===
router.get(
  "/:id",
  validateIdParam,
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    console.log(`[DISHES GET /:id] Route handler entered for ID: ${id}`); // Added entry log

    try {
      // --- FIXED QUERY: Use r.city_name and r.neighborhood_name ---
      const dishQuery = `
        SELECT d.id, d.name, d.description, d.adds, d.price, d.created_at, d.is_common,
               r.id AS restaurant_id, r.name AS restaurant_name,
               r.city_name, r.neighborhood_name, -- Corrected column names
               COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
        FROM Dishes d
        LEFT JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.id = $1
        GROUP BY d.id, r.id, r.city_name, r.neighborhood_name -- Added grouping for new columns
      `;
      // --- END FIXED QUERY ---

      console.log(`[DISHES GET /:id] Executing query for ID: ${id}`);
      const dishResult = await db.query(dishQuery, [id]);

      if (dishResult.rows.length === 0) {
        console.log(`[DISHES GET /:id] Dish not found for ID: ${id}`);
        return res.status(404).json({ error: "Dish not found" });
      }
      console.log(`[DISHES GET /:id] Successfully fetched dish: ${dishResult.rows[0].name}`);
      // Map columns for frontend consistency if needed (e.g., city_name to city)
      const dishData = {
          ...dishResult.rows[0],
          city: dishResult.rows[0].city_name,
          neighborhood: dishResult.rows[0].neighborhood_name
      };
      res.json(dishData);

    } catch (err) {
      console.error(`/api/dishes/${id} (GET Detail) error:`, err);
      // Check for specific errors like timeouts
       if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
           return res.status(504).json({ error: "Database timeout fetching dish details." });
       }
      res.status(500).json({ error: "Error loading dish details" });
    }
  }
);

// === Voting ===
router.post( "/:id/votes", validateIdParam, validateVoteBody, handleValidationErrors, async (req, res) => { /* ... original logic ... */ } );
router.get( "/:id/votes", validateIdParam, handleValidationErrors, async (req, res) => { /* ... original logic ... */ } );

// === Submit Dish (Disabled) ===
router.post("/", async (req, res) => {
  res.status(405).json({ error: "Direct dish creation not allowed via this endpoint. Please use the submissions process." });
});

module.exports = router;