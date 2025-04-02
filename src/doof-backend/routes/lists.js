// src/doof-backend/routes/lists.js
const express = require('express');
const db = require('../db');
const { param, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateListIdParam = [
  param('id').isInt({ min: 1 }).withMessage('List ID must be a positive integer'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Lists Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// GET specific list details
router.get(
  "/:id",
  validateListIdParam,
  handleValidationErrors,
  async (req, res) => {
    const { id } = req.params;
    console.log(`[LISTS GET /:id] Route handler entered for ID: ${id}`);
    let client;

    try {
      // Acquire database client with timeout
      const clientPromise = db.getClient();
      const clientTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database client acquisition timed out')), 5000); // 5-second timeout
      });
      client = await Promise.race([clientPromise, clientTimeout]);
      console.log(`[LISTS GET /:id] Acquired DB client for ID: ${id}`);

      // Fetch list details with timeout
      const listQuery = `
        SELECT id, name, description, saved_count, city_name, tags, is_public,
               created_by_user, creator_handle, is_following, created_at, updated_at
        FROM Lists
        WHERE id = $1
      `;
      console.log(`[LISTS GET /:id] Executing list query for ID: ${id}`);
      const listResultPromise = client.query(listQuery, [id]);
      const listTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('List query timed out')), 5000); // 5-second timeout
      });
      const listResult = await Promise.race([listResultPromise, listTimeout]);

      if (listResult.rows.length === 0) {
        console.log(`[LISTS GET /:id] List not found for ID: ${id}`);
        await client.release();
        return res.status(404).json({ error: "List not found" });
      }
      const list = listResult.rows[0];
      console.log(`[LISTS GET /:id] Found list: ${list.name}`);

      // Fetch associated list items with timeout
      const itemsQuery = `
        SELECT
          li.id AS list_item_id,
          li.item_type,
          li.item_id,
          li.added_at,
          COALESCE(d.name, r.name) AS name,
          CASE WHEN li.item_type = 'dish' THEN r.name END AS restaurant_name,
          CASE WHEN li.item_type = 'dish' THEN r.id END AS restaurant_id,
          COALESCE(r.neighborhood_name, r_dish.neighborhood_name) AS neighborhood,
          COALESCE(r.city_name, r_dish.city_name) AS city,
          CASE
            WHEN li.item_type = 'dish' THEN (
              SELECT array_agg(h.name) FILTER (WHERE h.name IS NOT NULL)
              FROM DishHashtags dh
              JOIN Hashtags h ON dh.hashtag_id = h.id
              WHERE dh.dish_id = d.id
            )
            WHEN li.item_type = 'restaurant' THEN (
              SELECT array_agg(h.name) FILTER (WHERE h.name IS NOT NULL)
              FROM RestaurantHashtags rh
              JOIN Hashtags h ON rh.hashtag_id = h.id
              WHERE rh.restaurant_id = r.id
            )
            ELSE '{}'
          END AS tags
        FROM ListItems li
        LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
        LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC
      `;
      console.log(`[LISTS GET /:id] Executing items query for List ID: ${id}`);
      const itemsResultPromise = client.query(itemsQuery, [id]);
      const itemsTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Items query timed out')), 5000); // 5-second timeout
      });
      const itemsResult = await Promise.race([itemsResultPromise, itemsTimeout]);
      console.log(`[LISTS GET /:id] Found ${itemsResult.rows.length} items for List ID: ${id}`);

      const response = {
        ...list,
        city: list.city_name,
        is_following: list.is_following ?? false,
        items: itemsResult.rows || [],
        item_count: itemsResult.rows.length,
      };
      console.log(`[LISTS GET /:id] Sending response for ID: ${id}`, response);
      res.json(response);
    } catch (err) {
      console.error(`[LISTS GET /:id] Error fetching details for ID ${id}:`, err);
      if (err.message.includes('timed out')) {
        return res.status(504).json({ error: "Database query timed out" });
      }
      if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
        return res.status(504).json({ error: "Database timeout fetching list details" });
      }
      res.status(500).json({ error: "Error loading list details", details: err.message });
    } finally {
      if (client) {
        try {
          await client.release();
          console.log(`[LISTS GET /:id] Released DB client for ID: ${id}`);
        } catch (releaseErr) {
          console.error(`[LISTS GET /:id] Error releasing DB client for ID: ${id}:`, releaseErr);
        }
      } else {
        console.log(`[LISTS GET /:id] No client to release for ID: ${id}`);
      }
    }
  }
);

// Placeholder for other routes (unchanged)
router.get("/", async (req, res) => { /* ... */ });
router.post("/", async (req, res) => { /* ... */ });
router.post("/:id/items", async (req, res) => { /* ... */ });
router.delete("/:id/items/:listItemId", async (req, res) => { /* ... */ });
router.post("/:id/follow", async (req, res) => { /* ... */ });
router.delete("/:id/follow", async (req, res) => { /* ... */ });
router.put("/:id/visibility", async (req, res) => { /* ... */ });

module.exports = router;