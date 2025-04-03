// src/doof-backend/routes/dishes.js
const express = require('express');
const db = require('../db');
const { param, body, validationResult } = require('express-validator');

const router = express.Router();

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Dishes Router Validation Error]", req.path, errors.array());
    // Ensure JSON error response
    return res.status(400).json({ error: errors.array()[0].msg || 'Validation failed', errors: errors.array() });
  }
  next();
};

// Validation for ID parameter
const validateIdParam = [
  param('id').isInt({ gt: 0 }).withMessage('Invalid Dish ID format in URL.'),
];

// Validation for voting body (keep if voting exists)
// const validateVoteBody = [
//   body('vote_type').isIn(['up', 'neutral', 'down']).withMessage('Invalid vote type specified (must be up, neutral, or down).'),
// ];

// === List Dishes for Autosuggest ===
// (Keep existing GET / route logic)
router.get("/", async (req, res, next) => { // Added next
    const { name } = req.query;
    try {
      let query = `SELECT id, name FROM Dishes`;
      const params = [];
      if (name) {
        query += ` WHERE name ILIKE $1`;
        params.push(`%${name}%`);
      }
      query += ` ORDER BY name ASC LIMIT 20`;

      const result = await db.query(query, params);
      res.json(result.rows || []);
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
  async (req, res, next) => { // Added next
    const { id } = req.params;
    console.log(`[DISHES GET /:id] Route handler entered for ID: ${id}`);

    try {
      // *** CORRECTED QUERY: Removed d.description, d.price, d.is_common ***
      const dishQuery = `
        SELECT d.id, d.name, d.adds, d.created_at, d.restaurant_id, -- Removed description, price, is_common
               r.name AS restaurant_name,
               r.city_name, r.neighborhood_name,
               COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
        FROM Dishes d
        LEFT JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.id = $1
        GROUP BY d.id, r.id -- Group by necessary columns (r.id includes r.name, r.city_name etc.)
      `;
      // *** END CORRECTED QUERY ***

      console.log(`[DISHES GET /:id] Executing query for ID: ${id}`);
      const dishResult = await db.query(dishQuery, [id]);

      if (dishResult.rows.length === 0) {
        console.log(`[DISHES GET /:id] Dish not found for ID: ${id}`);
        return res.status(404).json({ error: "Dish not found" });
      }
      console.log(`[DISHES GET /:id] Successfully fetched dish: ${dishResult.rows[0].name}`);

      // Map columns for frontend consistency if needed
      const dishData = {
          ...dishResult.rows[0],
          city: dishResult.rows[0].city_name, // Keep mapping if needed
          neighborhood: dishResult.rows[0].neighborhood_name // Keep mapping if needed
      };
      // Remove columns that don't exist on the mapped object if necessary
      // delete dishData.city_name;
      // delete dishData.neighborhood_name;

      res.json(dishData); // Send JSON response

    } catch (err) {
      console.error(`/api/dishes/${id} (GET Detail) error:`, err);
      next(err); // Forward error
    }
  }
);

// === Voting (Keep if implemented) ===
// router.post( "/:id/votes", validateIdParam, validateVoteBody, handleValidationErrors, async (req, res) => { /* ... */ } );
// router.get( "/:id/votes", validateIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );

// === Submit Dish (Keep disabled) ===
router.post("/", async (req, res) => {
  res.status(405).json({ error: "Direct dish creation not allowed via this endpoint. Please use the submissions process." });
});

module.exports = router;