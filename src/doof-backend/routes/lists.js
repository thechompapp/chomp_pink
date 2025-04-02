// src/doof-backend/routes/lists.js (Refactored for ListItems table)
const express = require('express');
const db = require('../db');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// --- Validation Middleware ---
const validateListPOST = [ /* ... keep as is ... */ ];
// Validation for adding item - now just needs item_type and item_id
const validateItemPOST = [
     body('item_type').isIn(['dish', 'restaurant']).withMessage('Invalid item_type (must be "dish" or "restaurant").'),
     body('item_id').isInt({ gt: 0 }).withMessage('Invalid item_id (must be a positive integer).'),
];
// Validation for ID parameters
const validateListIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('Invalid List ID format in URL.'),
];
const validateListItemIdParam = [
    param('listItemId').isInt({ gt: 0 }).withMessage('Invalid List Item ID format in URL.'),
];
// Handle validation errors
const handleValidationErrors = (req, res, next) => { /* ... keep as is ... */ };


// === List Management ===

// GET all user-relevant lists (Calculates item_count)
router.get("/", async (req, res) => {
  try {
    // Calculate item_count using a subquery
    const result = await db.query(`
        SELECT
            l.id, l.name, l.description, l.saved_count, l.city_name, l.tags,
            l.is_public, l.created_by_user, l.creator_handle, l.is_following, l.created_at,
            COALESCE(lc.count, 0)::integer as item_count -- Calculate count and cast to integer
        FROM Lists l
        LEFT JOIN (SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id) lc
          ON l.id = lc.list_id
        ORDER BY l.created_at DESC
    `);
    const lists = (result.rows || []).map(list => ({
        ...list,
        city: list.city_name, // Map city_name to city for frontend compatibility
        is_following: list.is_following ?? false
    }));
    res.json(lists);
  } catch (err) {
    console.error("--- ERROR Fetching /api/lists (All) ---", err);
    res.status(500).json({ error: "Error loading lists" });
  }
});

// GET specific list details (Fetches list items separately)
router.get(
    "/:id",
    validateListIdParam,
    handleValidationErrors,
    async (req, res) => {
      const { id } = req.params;
      try {
        // 1. Fetch List Details (without items/item_count)
        const listResult = await db.query(
            `SELECT id, name, description, saved_count, city_name, tags, is_public, created_by_user, creator_handle, is_following, created_at, updated_at
             FROM Lists WHERE id = $1`,
             [id]
        );
        if (listResult.rows.length === 0) {
          return res.status(404).json({ error: "List not found" });
        }
        const list = listResult.rows[0];

        // 2. Fetch Associated List Items (joining to get details)
        const itemsQuery = `
            SELECT
                li.id AS list_item_id, -- The ID of the entry in ListItems table
                li.item_type,
                li.item_id,
                li.added_at,
                CASE
                    WHEN li.item_type = 'dish' THEN d.name
                    WHEN li.item_type = 'restaurant' THEN r.name
                END AS name,
                CASE
                    WHEN li.item_type = 'dish' THEN r_dish.name
                    ELSE NULL
                END AS restaurant_name, -- Only for dishes
                CASE
                    WHEN li.item_type = 'dish' THEN r_dish.id
                    ELSE NULL
                END AS restaurant_id, -- Only for dishes
                 CASE
                    WHEN li.item_type = 'restaurant' THEN r.neighborhood_name
                    WHEN li.item_type = 'dish' THEN r_dish.neighborhood_name
                END AS neighborhood, -- Get neighborhood based on type
                CASE
                    WHEN li.item_type = 'restaurant' THEN r.city_name
                    WHEN li.item_type = 'dish' THEN r_dish.city_name
                END AS city, -- Get city based on type
                COALESCE(
                     (SELECT array_agg(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = d.id),
                     (SELECT array_agg(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = r.id),
                     '{}'
                 ) AS tags -- Fetch tags based on item type (might be slow)
            FROM ListItems li
            LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
            LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
            LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id -- Join restaurant again for dish details
            WHERE li.list_id = $1
            ORDER BY li.added_at DESC; -- Or order by position if added
        `;
        const itemsResult = await db.query(itemsQuery, [id]);

        // 3. Combine and Send Response
        res.json({
            ...list,
            city: list.city_name, // Map city_name
            is_following: list.is_following ?? false,
            items: itemsResult.rows || [], // Add the fetched items
            item_count: itemsResult.rows.length // Count fetched items
        });

      } catch (err) {
        const listId = req.params.id || 'UNKNOWN';
        console.error(`--- ERROR Fetching /api/lists/${listId} (Detail) ---`, err);
        res.status(500).json({ error: "Error loading list details" });
      }
    }
);

// POST: Create a new list (Keep as is - doesn't involve items)
router.post( "/", validateListPOST, handleValidationErrors, async (req, res) => { /* ... */ } );

// *** CHANGED: POST (was PUT) to add item to existing list (Inserts into ListItems) ***
router.post( // Method changed to POST
    "/:id/items",
    validateListIdParam, // Validate List ID in URL
    validateItemPOST, // Apply item validation for POST body
    handleValidationErrors, // Handle validation errors
    async (req, res) => {
        const { id: listId } = req.params; // Validated List ID
        const { item_type, item_id } = req.body; // Validated item details

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Check if list exists (optional, FK constraint handles it but good practice)
            const listCheck = await client.query("SELECT 1 FROM Lists WHERE id = $1 FOR UPDATE", [listId]);
            if (listCheck.rowCount === 0) {
                 await client.query('ROLLBACK');
                 return res.status(404).json({ error: "List not found" });
            }

            // 2. Check if item exists (Dish or Restaurant)
            const itemTable = item_type === 'dish' ? 'Dishes' : 'Restaurants';
            const itemCheck = await client.query(`SELECT 1 FROM ${itemTable} WHERE id = $1`, [item_id]);
            if (itemCheck.rowCount === 0) {
                 await client.query('ROLLBACK');
                 return res.status(404).json({ error: `${item_type} with ID ${item_id} not found.` });
            }

            // 3. Insert into ListItems
            // Use ON CONFLICT DO NOTHING to handle potential duplicate additions gracefully
            const insertResult = await client.query(
                `INSERT INTO ListItems (list_id, item_type, item_id)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (list_id, item_type, item_id) DO NOTHING
                 RETURNING *`, // Return the inserted row (or nothing if conflict)
                [listId, item_type, item_id]
            );

            // 4. Update Lists.updated_at (trigger should handle this)
            // await client.query("UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [listId]);

            await client.query('COMMIT');

            if (insertResult.rowCount > 0) {
                console.log(`Item (${item_type}, ${item_id}) added to list ${listId}`);
                 // Fetch the newly added item details to return? Or just success? Return new item link for simplicity.
                 res.status(201).json(insertResult.rows[0]);
            } else {
                // This means the item was already in the list due to ON CONFLICT
                console.log(`Item (${item_type}, ${item_id}) was already in list ${listId}`);
                 res.status(200).json({ message: "Item already exists in the list." }); // Use 200 OK
            }

        } catch (err) {
            await client.query('ROLLBACK');
            // Check for specific DB errors
             if (err.code === '23503') { // FK violation (list_id, item_id, or item_type invalid)
                 console.error(`/api/lists/${listId}/items (POST) FK error:`, err.detail);
                 return res.status(404).json({ error: "List or item not found." });
             }
            console.error(`/api/lists/${listId}/items (POST) error:`, err);
            res.status(500).json({ error: "Error adding item to list" });
        } finally {
            client.release();
        }
    }
);

// *** NEW: DELETE item from a list ***
router.delete(
    "/:id/items/:listItemId", // Use the ListItems primary key
    validateListIdParam, // Validate list ID
    validateListItemIdParam, // Validate list item ID
    handleValidationErrors,
    async (req, res) => {
        const { id: listId, listItemId } = req.params; // Validated IDs

        try {
            // Delete the specific entry from ListItems, ensuring it belongs to the correct list
            const deleteResult = await db.query(
                "DELETE FROM ListItems WHERE id = $1 AND list_id = $2",
                [listItemId, listId]
            );

            if (deleteResult.rowCount === 0) {
                // Check if the list item existed at all or belonged to a different list
                const check = await db.query("SELECT 1 FROM ListItems WHERE id = $1", [listItemId]);
                if (check.rowCount > 0) {
                     return res.status(403).json({ error: "List item does not belong to the specified list." });
                } else {
                     return res.status(404).json({ error: "List item not found." });
                }
            }

            // Optionally: Update Lists.updated_at (trigger should handle)

            console.log(`Item ${listItemId} removed from list ${listId}`);
            res.status(204).send(); // No Content on successful deletion

        } catch (err) {
            console.error(`/api/lists/${listId}/items/${listItemId} (DELETE) error:`, err);
            res.status(500).json({ error: "Error removing item from list" });
        }
    }
);


// POST: Follow a list (Keep as is)
router.post( "/:id/follow", validateListIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );

// DELETE: Unfollow a list (Keep as is)
router.delete( "/:id/follow", validateListIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );


module.exports = router;