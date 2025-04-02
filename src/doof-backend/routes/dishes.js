// src/doof-backend/routes/dishes.js
const express = require('express');
const db = require('../db');
const { param, body, validationResult } = require('express-validator');

const router = express.Router();

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Validation Error]", req.path, errors.array());
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
  try {
    // Future optimization: Add pagination or filter by is_common if needed
    const result = await db.query(
      `SELECT id, name FROM Dishes ORDER BY name ASC`
    );
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
    try {
      const dishQuery = `
        SELECT d.id, d.name, d.description, d.adds, d.price, d.created_at, d.is_common,
               r.id AS restaurant_id, r.name AS restaurant_name, r.city, r.neighborhood,
               COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
        FROM Dishes d
        LEFT JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.id = $1
        GROUP BY d.id, r.id
      `;
      const dishResult = await db.query(dishQuery, [id]);
      if (dishResult.rows.length === 0) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.json(dishResult.rows[0]);
    } catch (err) {
      console.error(`/api/dishes/${id} (GET Detail) error:`, err);
      res.status(500).json({ error: "Error loading dish details" });
    }
  }
);

// === Voting ===
router.post(
  "/:id/votes",
  validateIdParam,
  validateVoteBody,
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    const { vote_type } = req.body;
    const userId = null;

    try {
      const insertQuery = `
        INSERT INTO DishVotes (dish_id, vote_type, user_id)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      await db.query(insertQuery, [id, vote_type, userId]);

      if (vote_type === 'up') {
        await db.query("UPDATE Dishes SET adds = adds + 1 WHERE id = $1", [id]);
        console.log(`Incremented 'adds' for dish ${id}`);
      }

      res.status(201).json({ message: "Vote recorded successfully" });
    } catch (err) {
      if (err.code === '23503') {
        return res.status(404).json({ error: "Dish not found" });
      }
      if (err.code === '23505') {
        return res.status(409).json({ error: "Vote already exists for this item by this user." });
      }
      console.error(`Vote save error for dish ${id}:`, err);
      res.status(500).json({ error: "Failed to record vote due to server error" });
    }
  }
);

// GET Votes for a dish
router.get(
  "/:id/votes",
  validateIdParam,
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query(
        `SELECT
          COUNT(*) FILTER (WHERE vote_type = 'up') AS upvotes,
          COUNT(*) FILTER (WHERE vote_type = 'neutral') AS neutrals,
          COUNT(*) FILTER (WHERE vote_type = 'down') AS downvotes
        FROM DishVotes
        WHERE dish_id = $1`,
        [id]
      );
      res.json(result.rows[0] || { upvotes: "0", neutrals: "0", downvotes: "0" });
    } catch (err) {
      console.error(`Vote fetch error for dish ${id}:`, err);
      res.status(500).json({ error: "Failed to fetch votes" });
    }
  }
);

// === Submit Dish (Disabled - Use Submissions Route) ===
router.post("/", async (req, res) => {
  res.status(405).json({ error: "Direct dish creation not allowed via this endpoint. Please use the submissions process." });
});

module.exports = router;