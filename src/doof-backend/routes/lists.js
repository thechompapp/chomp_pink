// src/doof-backend/routes/lists.js
// IMPLEMENTED the GET / handler

const express = require('express');
const db = require('../db'); // Assuming db/index.js is correctly configured
const { param, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware (Keep as is)
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

// *** IMPLEMENTED GET /api/lists ***
// Fetches all lists, potentially for the "My Lists" page.
// TODO: Add user authentication check here later to fetch lists for a specific user.
router.get("/", async (req, res) => {
    console.log("[LISTS GET /] Handler entered.");
    try {
        // Query to get all lists and their item counts
        // Similar to trending lists query but without is_public filter or limit initially
        // Add user_id filter later when auth is implemented
        const query = `
            SELECT
                l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
                l.created_by_user, l.creator_handle, l.is_following, l.created_at, l.updated_at,
                COALESCE(lc.count, 0)::integer as item_count
            FROM Lists l
            LEFT JOIN (
                SELECT list_id, COUNT(*) as count
                FROM ListItems
                GROUP BY list_id
            ) lc ON l.id = lc.list_id
            ORDER BY l.created_at DESC; -- Or order as needed (e.g., by name)
        `;
        console.log("[LISTS GET /] Executing query...");
        const result = await db.query(query);
        console.log(`[LISTS GET /] Query successful, found ${result.rows.length} lists.`);

        // Map city_name to city for frontend consistency if needed elsewhere
        const lists = (result.rows || []).map(list => ({
            ...list,
            city: list.city_name,
            // Ensure boolean fields are treated as booleans
            is_following: list.is_following ?? false,
            is_public: list.is_public ?? true,
            created_by_user: list.created_by_user ?? false,
        }));

        res.json(lists); // Send the list data back

    } catch (err) {
        console.error("[LISTS GET /] Error fetching lists:", err);
        res.status(500).json({ error: "Failed to retrieve lists", details: err.message });
    }
});
// *** END IMPLEMENTED GET /api/lists ***


// GET specific list details (/:id) - Keep the existing implementation from your file
router.get( "/:id", validateListIdParam, handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    console.log(`[LISTS GET /:id] Route handler entered for ID: ${id}`);
    let client;
    try {
      // Using explicit client potentially with timeouts as potentially implemented before
      client = await db.getClient(); // Assumes getClient exists in your db module
      console.log(`[LISTS GET /:id] Acquired DB client for ID: ${id}`);

      // Fetch list details
      const listQuery = `
          SELECT id, name, description, saved_count, city_name, tags, is_public,
                 created_by_user, creator_handle, is_following, created_at, updated_at
          FROM Lists WHERE id = $1`;
      const listResult = await client.query({ text: listQuery, values: [id]}); // Consider adding timeout here too if needed

      if (listResult.rows.length === 0) {
          await client.release();
          return res.status(404).json({ error: "List not found" });
      }
      const list = listResult.rows[0];

      // Fetch associated list items
      const itemsQuery = `
          SELECT li.id AS list_item_id, li.item_type, li.item_id, li.added_at,
                 COALESCE(d.name, r.name) AS name,
                 CASE WHEN li.item_type = 'dish' THEN r_dish.name END AS restaurant_name,
                 CASE WHEN li.item_type = 'dish' THEN r_dish.id END AS restaurant_id,
                 COALESCE(r.neighborhood_name, r_dish.neighborhood_name) AS neighborhood,
                 COALESCE(r.city_name, r_dish.city_name) AS city,
                 CASE /* Complex tag aggregation logic from your previous version */
                   WHEN li.item_type = 'dish' THEN (SELECT array_agg(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = d.id)
                   WHEN li.item_type = 'restaurant' THEN (SELECT array_agg(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = r.id)
                   ELSE '{}'
                 END AS tags
          FROM ListItems li
          LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
          LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
          LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
          WHERE li.list_id = $1 ORDER BY li.added_at DESC`;
       const itemsResult = await client.query({ text: itemsQuery, values: [id]}); // Consider timeout

       await client.release(); // Release client!

       const response = {
           ...list,
           city: list.city_name,
           is_following: list.is_following ?? false,
           items: itemsResult.rows || [],
           item_count: itemsResult.rows.length,
       };
       res.json(response);

    } catch (err) {
        if (client) await client.release(); // Ensure client is released on error
        console.error(`[LISTS GET /:id] Error fetching details for ID ${id}:`, err);
        res.status(500).json({ error: "Error loading list details", details: err.message });
    }
});

// Keep other placeholder routes (POST, DELETE, PUT) as they were in your file
router.post("/", async (req, res) => { /* ... placeholder ... */ });
router.post("/:id/items", async (req, res) => { /* ... placeholder ... */ });
router.delete("/:id/items/:listItemId", async (req, res) => { /* ... placeholder ... */ });
router.post("/:id/follow", async (req, res) => { /* ... placeholder ... */ });
router.delete("/:id/follow", async (req, res) => { /* ... placeholder ... */ });
router.put("/:id/visibility", async (req, res) => { /* ... placeholder ... */ });


module.exports = router;