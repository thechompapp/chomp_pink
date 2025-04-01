// src/doof-backend/routes/submissions.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// === Submissions (for Admin Approval) ===

// POST new submission
router.post("/", async (req, res) => {
    const { type, name, location, tags, place_id, city, neighborhood, user_id } = req.body;
    if (!type || !name) return res.status(400).json({ error: "Submission type and name are required" });
    if (!['dish', 'restaurant'].includes(type)) return res.status(400).json({ error: "Invalid submission type" });
    try {
        const result = await db.query(
            `INSERT INTO Submissions (type, name, location, tags, place_id, city, neighborhood, user_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
            [type, name, location, tags, place_id, city, neighborhood, user_id /* Placeholder */]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating submission:", err);
        res.status(500).json({ error: "Failed to create submission" });
    }
});

// GET pending submissions (for admin dashboard)
// NOTE: This conflicts with the admin.js route below if both are mounted on /api/admin
// Decide where this should live - perhaps /api/submissions?
router.get("/pending", async (req, res) => {
  try {
    const result = await db.query(
        `SELECT * FROM Submissions WHERE status = 'pending' ORDER BY created_at ASC`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/submissions (GET Pending) error:", err);
    res.status(500).json({ error: "Error loading pending submissions" });
  }
});

// POST approve submission
router.post("/:id/approve", async (req, res) => {
  const { id } = req.params;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const submissionResult = await client.query("SELECT * FROM Submissions WHERE id = $1 AND status = 'pending'", [id]);
    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Pending submission not found" });
    }
    const sub = submissionResult.rows[0];
    let approvedItemData = {};

    if (sub.type === 'restaurant') {
      const existingRest = await client.query("SELECT id FROM Restaurants WHERE name = $1 AND city = $2 AND (neighborhood = $3 OR ($3 IS NULL AND neighborhood IS NULL))", [sub.name, sub.city, sub.neighborhood]);
      if (existingRest.rows.length > 0) {
           console.log(`Restaurant "${sub.name}" already exists, marking submission as approved.`);
           approvedItemData = { id: existingRest.rows[0].id, ...sub };
      } else {
          const restResult = await client.query(`INSERT INTO Restaurants (name, neighborhood, city, tags, adds) VALUES ($1, $2, $3, $4, 1) RETURNING *`, [sub.name, sub.neighborhood, sub.city, sub.tags]);
          approvedItemData = restResult.rows[0];
      }
    } else if (sub.type === 'dish') {
      const restQueryResult = await client.query("SELECT id FROM Restaurants WHERE name = $1 LIMIT 1", [sub.location]);
      let restaurantId = null;
      if (restQueryResult.rows.length > 0) {
          restaurantId = restQueryResult.rows[0].id;
      } else {
           await client.query('ROLLBACK');
           return res.status(400).json({ error: `Restaurant "${sub.location}" not found for dish submission.` });
      }
       const existingDish = await client.query("SELECT id FROM Dishes WHERE name = $1 AND restaurant_id = $2", [sub.name, restaurantId]);
        if (existingDish.rows.length > 0) {
             console.log(`Dish "${sub.name}" at restaurant ID ${restaurantId} already exists.`);
             approvedItemData = { id: existingDish.rows[0].id, ...sub, restaurant_id: restaurantId };
        } else {
            const dishResult = await client.query(`INSERT INTO Dishes (name, restaurant_id, tags, adds) VALUES ($1, $2, $3, 1) RETURNING *`, [sub.name, restaurantId, sub.tags]);
            approvedItemData = dishResult.rows[0];
            if (sub.tags && sub.tags.length > 0) {
                for (const tagName of sub.tags) {
                    let tagIdRes = await client.query("SELECT id FROM Hashtags WHERE name = $1", [tagName]);
                    let tagId;
                    if (tagIdRes.rows.length === 0) {
                        // Potentially problematic if tag doesn't exist - should it be created?
                         console.warn(`Tag "${tagName}" not found in Hashtags table during submission approval.`);
                         // Option: Create the tag
                         // tagIdRes = await client.query("INSERT INTO Hashtags (name) VALUES ($1) RETURNING id", [tagName]);
                         // tagId = tagIdRes.rows[0].id;
                         // Option: Skip this tag
                         continue;
                    } else {
                       tagId = tagIdRes.rows[0].id;
                    }
                    await client.query("INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [approvedItemData.id, tagId]);
                }
            }
        }
    }
    await client.query("UPDATE Submissions SET status = 'approved' WHERE id = $1", [id]);
    await client.query('COMMIT');
    res.json(approvedItemData);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Approve submission ${id} error:`, err);
    res.status(500).json({ error: "Approval failed due to server error" });
  } finally {
    client.release();
  }
});


// POST reject submission
router.post("/:id/reject", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("UPDATE Submissions SET status = 'rejected' WHERE id = $1 AND status = 'pending'", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pending submission not found" });
    }
    res.json({ message: "Submission rejected successfully" });
  } catch (err) {
    console.error(`Reject submission ${id} error:`, err);
    res.status(500).json({ error: "Rejection failed due to server error" });
  }
});


module.exports = router;