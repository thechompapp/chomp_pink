// src/doof-backend/routes/dishes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// === Dish Detail ===
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dishQuery = `
      SELECT d.id, d.name, d.description, d.adds, d.created_at,
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
    console.error(`/api/dishes/${id} error:`, err);
    res.status(500).json({ error: "Error loading dish details" });
  }
});

// === Voting ===
router.post("/:id/votes", async (req, res) => {
  const { id } = req.params;
  const { vote_type } = req.body;
  if (!['up', 'neutral', 'down'].includes(vote_type)) {
    return res.status(400).json({ error: "Invalid vote type specified" });
  }
  try {
    await db.query(
      "INSERT INTO DishVotes (dish_id, vote_type) VALUES ($1, $2)",
      [id, vote_type]
    );
    let voteValue = 0;
    if (vote_type === 'up') voteValue = 1;
    if (voteValue !== 0) {
         await db.query("UPDATE Dishes SET adds = adds + $1 WHERE id = $2", [voteValue, id]);
    }
    res.status(201).json({ message: "Vote recorded successfully" });
  } catch (err) {
    if (err.code === '23503') { // FK violation
        return res.status(404).json({ error: "Dish not found" });
    }
     if (err.code === '23505') { // Unique constraint violation (user already voted?)
         // Handle appropriately - maybe allow changing vote?
         return res.status(409).json({ error: "Vote already exists for this item" });
     }
    console.error(`Vote save error for dish ${id}:`, err);
    res.status(500).json({ error: "Failed to record vote due to server error" });
  }
});

router.get("/:id/votes", async (req, res) => {
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
        res.json(result.rows[0] || { upvotes: 0, neutrals: 0, downvotes: 0 });
    } catch (err) {
        console.error(`Vote fetch error for dish ${id}:`, err);
        res.status(500).json({ error: "Failed to fetch votes" });
    }
});

// === Submit Dish (Example - Might belong in submissions.js or its own route) ===
// This assumes submission approval logic handles actual insertion
// If users can directly add dishes, this needs more logic (finding/creating restaurant, hashtags)
router.post("/", async (req, res) => {
  // This endpoint might be better handled by the submission/approval flow
  // For now, let's assume it's disabled or requires admin privileges
  res.status(403).json({ error: "Direct dish creation not allowed via this endpoint. Use submission." });

  /* // Original logic - needs significant enhancement for direct creation
  const { name, description, restaurant_id, hashtag_ids } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO Dishes (name, description, restaurant_id) VALUES ($1, $2, $3) RETURNING id",
      [name, description, restaurant_id]
    );
    const dishId = result.rows[0].id;
    for (const tagId of hashtag_ids) {
      await db.query("INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES ($1, $2)", [dishId, tagId]);
    }
    res.status(201).json({ id: dishId });
  } catch (err) {
    console.error("Submit dish error", err);
    res.status(500).json({ error: "Error submitting dish" });
  }
  */
});


module.exports = router;