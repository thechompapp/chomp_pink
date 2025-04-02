// src/doof-backend/routes/lists.js
// MODIFIED: Temporarily removed item_count calculation from GET / handler for testing
const express = require('express');
const db = require('../db');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// --- Validation Middleware & Handlers --- (Keep as is)
const validateListPOST = [ /* ... */ ];
const validateItemPOST = [ /* ... */ ];
const validateListIdParam = [ /* ... */ ];
const validateListItemIdParam = [ /* ... */ ];
const handleValidationErrors = (req, res, next) => { /* ... */ };


// === List Management ===

// GET all user-relevant lists (TEMPORARILY REMOVED item_count calculation)
router.get("/", async (req, res) => {
  console.log("[LISTS GET /] Route handler entered."); // Add entry log
  try {
    // --- SIMPLIFIED QUERY (No item_count) ---
    const result = await db.query(`
        SELECT
            l.id, l.name, l.description, l.saved_count, l.city_name, l.tags,
            l.is_public, l.created_by_user, l.creator_handle, l.is_following, l.created_at
        FROM Lists l
        ORDER BY l.created_at DESC
    `);
    // --- END SIMPLIFIED QUERY ---

    const lists = (result.rows || []).map(list => ({
        ...list,
        item_count: 0, // Return 0 temporarily since we didn't calculate it
        city: list.city_name,
        is_following: list.is_following ?? false
    }));
    console.log("[LISTS GET /] Successfully fetched lists (simplified). Count:", lists.length);
    res.json(lists);
  } catch (err) {
    console.error("--- ERROR Fetching /api/lists (All - Simplified) ---", err);
     if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
         return res.status(504).json({ error: "Database timeout fetching lists." });
     }
    res.status(500).json({ error: "Error loading lists" });
  }
});

// GET specific list details (Keeps item_count calculation for individual list)
router.get( "/:id", validateListIdParam, handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    console.log(`[LISTS GET /:id] Route handler entered for ID: ${id}`);
    try {
        // Fetch List Details (No item_count needed here)
        const listResult = await db.query(
            `SELECT id, name, description, saved_count, city_name, tags, is_public, created_by_user, creator_handle, is_following, created_at, updated_at
             FROM Lists WHERE id = $1`, [id] );
        if (listResult.rows.length === 0) { return res.status(404).json({ error: "List not found" }); }
        const list = listResult.rows[0];
        console.log(`[LISTS GET /:id] Found list: ${list.name}`);

        // Fetch Associated List Items (This query seems complex but might be okay for one list)
        const itemsQuery = `
             SELECT li.id AS list_item_id, li.item_type, li.item_id, li.added_at,
                    CASE WHEN li.item_type = 'dish' THEN d.name WHEN li.item_type = 'restaurant' THEN r.name END AS name,
                    CASE WHEN li.item_type = 'dish' THEN r_dish.name ELSE NULL END AS restaurant_name,
                    CASE WHEN li.item_type = 'dish' THEN r_dish.id ELSE NULL END AS restaurant_id,
                    CASE WHEN li.item_type = 'restaurant' THEN r.neighborhood_name WHEN li.item_type = 'dish' THEN r_dish.neighborhood_name END AS neighborhood,
                    CASE WHEN li.item_type = 'restaurant' THEN r.city_name WHEN li.item_type = 'dish' THEN r_dish.city_name END AS city,
                    COALESCE( (SELECT array_agg(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = d.id), (SELECT array_agg(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = r.id), '{}' ) AS tags
             FROM ListItems li
             LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
             LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
             LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
             WHERE li.list_id = $1 ORDER BY li.added_at DESC;
        `;
         console.log(`[LISTS GET /:id] Executing items query for List ID: ${id}`);
        const itemsResult = await db.query(itemsQuery, [id]);
        console.log(`[LISTS GET /:id] Found ${itemsResult.rows.length} items for List ID: ${id}`);

        res.json({
            ...list, city: list.city_name, is_following: list.is_following ?? false,
            items: itemsResult.rows || [], item_count: itemsResult.rows.length
        });

      } catch (err) {
        console.error(`--- ERROR Fetching /api/lists/${id} (Detail) ---`, err);
        if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
            return res.status(504).json({ error: "Database timeout fetching list details." });
        }
        res.status(500).json({ error: "Error loading list details" });
      }
});

// POST: Create a new list
router.post( "/", validateListPOST, handleValidationErrors, async (req, res) => { /* ... Corrected logic from response #37 ... */ } );

// Other routes remain the same...
router.post( "/:id/items", validateListIdParam, validateItemPOST, handleValidationErrors, async (req, res) => { /* ... */ } );
router.delete( "/:id/items/:listItemId", validateListIdParam, validateListItemIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );
router.post( "/:id/follow", validateListIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );
router.delete( "/:id/follow", validateListIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );
router.put( "/:id/visibility", validateListIdParam, [body('is_public').isBoolean().withMessage('is_public must be boolean')], handleValidationErrors, async (req, res) => { /* ... */ });


module.exports = router;