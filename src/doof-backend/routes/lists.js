// src/doof-backend/routes/lists.js
const express = require('express');
const db = require('../db'); // Ensure db/index.js is correctly set up
const { param, query, body, validationResult } = require('express-validator');

const router = express.Router();

// --- Validation Middleware ---

// Validate :id URL parameter
const validateListIdParam = [
  param('id').isInt({ min: 1 }).withMessage('List ID must be a positive integer in URL'),
];

// Validate :listItemId URL parameter
const validateListItemIdParam = [
    param('listItemId').isInt({ min: 1 }).withMessage('List item ID must be a positive integer in URL'),
];

// Validate GET / query parameters
const validateGetListsQuery = [
  query('createdByUser').optional().isBoolean().toBoolean().withMessage('createdByUser must be a boolean (true/false)'),
  query('followedByUser').optional().isBoolean().toBoolean().withMessage('followedByUser must be a boolean (true/false)'),
  // Add other query param validations if needed (e.g., city, tags)
];

// Validate POST / (Create List) request body
const validateCreateListPOST = [
  body('name').trim().notEmpty().withMessage('List name is required').isLength({ max: 255 }).withMessage('List name cannot exceed 255 characters'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('City name cannot exceed 100 characters'),
  body('tags').optional({ nullable: true }).isArray().withMessage('Tags must be an array'),
  body('tags.*').optional().isString().trim().isLength({ max: 50 }).withMessage('Each tag cannot exceed 50 characters'),
  body('is_public').optional({ checkFalsy: true }).isBoolean().withMessage('is_public must be a boolean (true/false)'),
];

// Validate POST /:id/items (Add Item) request body
const validateAddItemPOST = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer.'),
    body('item_type').isIn(['dish', 'restaurant']).withMessage('Item type must be either "dish" or "restaurant".'),
];

// Validate PUT /:id/visibility request body
const validateVisibilityPUT = [
    body('is_public').isBoolean().withMessage('is_public must be a boolean (true/false)')
];

// Centralized validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Lists Validation Error]", req.path, errors.array());
    // Return only the first error message for clarity
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};


// --- Route Handlers ---

// GET /api/lists (Get lists based on filters)
router.get("/", validateGetListsQuery, handleValidationErrors, async (req, res) => {
  console.log("[LISTS GET /] Handler entered. Query:", req.query);
  const { createdByUser, followedByUser } = req.query; // Booleans after validation/sanitization

  // Simulate getting user ID from auth middleware later
  const userId = 1; // Placeholder - Replace with actual user ID from session/token
  // For now, allow proceeding without strict auth check for testing
  // if (!userId) return res.status(401).json({ error: "Authentication required." });

  try {
    // Base query joins Lists with ListItems count and checks follow status for the user
    let queryText = `
      SELECT
        l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
        l.created_by_user, l.creator_handle, l.created_at, l.updated_at,
        COALESCE(lc.count, 0)::integer as item_count,
        EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1) as is_following -- Use lowercase table name
      FROM Lists l
      LEFT JOIN (
        SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id
      ) lc ON l.id = lc.list_id
    `;
    const queryParams = [userId];
    const conditions = [];

    // Apply filters based on validated query params
    if (createdByUser === true) {
      conditions.push(`l.created_by_user = true`); // Using boolean flag
    }

    if (followedByUser === true) {
      // Ensure the list is followed by the user
      conditions.push(`EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1)`); // Use lowercase table name
    }

    // Default visibility filter (adjust as needed):
    // Show public lists OR lists created by the user OR lists followed by the user
    // Check if specific filters ARE NOT applied before adding default broad filter
    if (createdByUser !== true && followedByUser !== true) {
         conditions.push(`(l.is_public = TRUE OR l.created_by_user = TRUE OR EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1))`) // Use lowercase table name
    }


    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }
    queryText += ` ORDER BY l.created_at DESC`; // Or sort by name, update time, etc.

    console.log("[LISTS GET /] Executing query:", queryText.substring(0, 300) + "..."); // Log truncated query
    console.log("[LISTS GET /] Query values:", queryParams);

    const result = await db.query(queryText, queryParams);
    console.log(`[LISTS GET /] Query successful, found ${result.rows.length} lists.`);

    // Map results for frontend consistency
    const lists = (result.rows || []).map(list => ({
        ...list,
        id: list.id, // Ensure ID is present
        city: list.city_name, // Map db column to frontend prop
        // Ensure boolean fields have defaults
        is_following: list.is_following ?? false,
        is_public: list.is_public ?? true,
        created_by_user: list.created_by_user ?? false,
        tags: Array.isArray(list.tags) ? list.tags : [], // Ensure tags is always an array
        item_count: list.item_count || 0, // Ensure item_count is a number
    })).filter(list => typeof list.id !== 'undefined' && list.id !== null); // Filter out any potential invalid entries

    // *** DEBUG LOG: Inspect the final data being sent ***
    console.log('[LISTS GET /] Data being sent to frontend:', JSON.stringify(lists, null, 2));
    // *** END DEBUG LOG ***

    res.json(lists);
  } catch (err) {
    console.error("[LISTS GET /] Error fetching lists:", err);
    // Provide more specific error detail if available
    res.status(500).json({ error: "Failed to retrieve lists", details: err.message || 'Unknown database error' });
  }
});

// GET specific list details (/:id)
router.get( "/:id", validateListIdParam, handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const userId = 1; // Placeholder - Replace with actual user ID
    console.log(`[LISTS GET /:id] Handler entered for ID: ${id}, UserID: ${userId}`);
    let client;
    try {
        client = await db.getClient();
        // Fetch List details, including the is_following status for the specific user
        const listQuery = `
            SELECT
                l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
                l.created_by_user, l.creator_handle, l.created_at, l.updated_at,
                EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $2) as is_following -- Use lowercase table name
            FROM Lists l WHERE l.id = $1`;
        const listResult = await client.query({ text: listQuery, values: [id, userId] }); // Pass userId

        if (listResult.rows.length === 0) {
            await client.release();
            return res.status(404).json({ error: "List not found" });
        }
        const list = listResult.rows[0];

        // Fetch List Items with details (using pre-aggregated tags for performance)
        const itemsQuery = `
           SELECT
               li.id AS list_item_id, li.item_type, li.item_id, li.added_at,
               COALESCE(d.name, r.name) AS name,
               CASE WHEN li.item_type = 'dish' THEN r_dish.name END AS restaurant_name,
               CASE WHEN li.item_type = 'dish' THEN r_dish.id END AS restaurant_id,
               COALESCE(r.neighborhood_name, r_dish.neighborhood_name) AS neighborhood,
               COALESCE(r.city_name, r_dish.city_name) AS city,
               COALESCE(dt.tags, rt.tags, '{}') AS tags
           FROM ListItems li
           LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
           LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
           LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
           LEFT JOIN (SELECT dh.dish_id, array_agg(h.name) as tags FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id GROUP BY dh.dish_id) dt ON li.item_type = 'dish' AND li.item_id = dt.dish_id
           LEFT JOIN (SELECT rh.restaurant_id, array_agg(h.name) as tags FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id GROUP BY rh.restaurant_id) rt ON li.item_type = 'restaurant' AND li.item_id = rt.restaurant_id
           WHERE li.list_id = $1
           ORDER BY li.added_at DESC`;
        const itemsResult = await client.query({ text: itemsQuery, values: [id] });

        await client.release();

        // Combine results and ensure correct formatting
        const response = {
            ...list,
            city: list.city_name,
            is_following: list.is_following ?? false,
            is_public: list.is_public ?? true,
            created_by_user: list.created_by_user ?? false,
            tags: Array.isArray(list.tags) ? list.tags : [],
            items: (itemsResult.rows || []).map(item => ({
                 ...item,
                 tags: Array.isArray(item.tags) ? item.tags : []
            })).filter(item => typeof item.list_item_id !== 'undefined' && item.list_item_id !== null), // Filter invalid items
            item_count: itemsResult.rows.length,
        };
        res.json(response);
    } catch (err) {
        if (client) { try { await client.release(); } catch (rlErr) { console.error('Error releasing client', rlErr); } }
        console.error(`[LISTS GET /:id] Error fetching details for ID ${id}:`, err);
        res.status(500).json({ error: "Error loading list details", details: err.message });
    }
});

// POST /api/lists (Create New List) - Corrected (No user_id)
router.post( "/", validateCreateListPOST, handleValidationErrors, async (req, res) => {
    console.log("[LISTS POST /] Handler entered.");
    const { name, description, city_name, tags, is_public } = req.body;
    const creatorHandle = `@user_placeholder`; // Placeholder - Update with real auth later
    try {
        const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];
        const publicFlag = is_public !== undefined ? is_public : true;
        // Corrected INSERT statement (removed user_id)
        const query = `
            INSERT INTO Lists (name, description, city_name, tags, is_public, created_by_user, creator_handle, saved_count, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, TRUE, $6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, name, description, saved_count, city_name, tags, is_public, created_by_user, creator_handle, created_at, updated_at
        `;
        // Corrected values array (removed placeholder for user_id)
        const values = [ name, description, city_name, cleanTags, publicFlag, creatorHandle ];
        console.log("[LISTS POST /] Executing query:", query.substring(0, 200) + "...");
        console.log("[LISTS POST /] Query values:", values);
        const result = await db.query(query, values);

        if (result.rows.length === 0) throw new Error("DB insertion error (no rows returned).");
        const newList = result.rows[0];
        console.log("[LISTS POST /] List created successfully:", newList);

        // Format response ensuring defaults
        const response = {
            ...newList, city: newList.city_name, is_following: false,
            is_public: newList.is_public ?? true, created_by_user: newList.created_by_user ?? true,
            item_count: 0, tags: Array.isArray(newList.tags) ? newList.tags : [],
        };
        res.status(201).json(response);

    } catch (err) {
        console.error("[LISTS POST /] Error creating list:", err);
        if (err.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: `List creation failed: ${err.detail || 'Duplicate entry.'}` });
        }
        res.status(500).json({ error: "Failed to create list", details: err.message });
    }
});

// POST /api/lists/:id/follow (Toggle Follow)
router.post( "/:id/follow", validateListIdParam, handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const userId = 1; // Placeholder - Replace with actual user ID
    console.log(`[LISTS POST /:id/follow] Handler entered for ID: ${id}, UserID: ${userId}`);
    let client;
    try {
        client = await db.getClient();
        await client.query('BEGIN');
        const listCheck = await client.query(`SELECT 1 FROM Lists WHERE id = $1`, [id]);
        if (listCheck.rows.length === 0) { throw { status: 404, message: "List not found" }; }

        // Use lowercase table name
        const followQuery = `SELECT list_id FROM listfollows WHERE list_id = $1 AND user_id = $2`;
        const followResult = await client.query(followQuery, [id, userId]);
        const isCurrentlyFollowing = followResult.rows.length > 0;
        let newSavedCount, newFollowingState;

        if (isCurrentlyFollowing) {
            // Use lowercase table name
            await client.query(`DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2`, [id, userId]);
            const updateCountResult = await client.query(`UPDATE Lists SET saved_count = GREATEST(0, saved_count - 1), updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING saved_count`, [id]);
            newSavedCount = updateCountResult.rows[0]?.saved_count ?? 0; newFollowingState = false;
            console.log(`[LISTS POST /:id/follow] User ${userId} unfollowed list ${id}. New saved_count: ${newSavedCount}`);
        } else {
            // Use lowercase table name
            await client.query(`INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`, [id, userId]);
            const updateCountResult = await client.query(`UPDATE Lists SET saved_count = saved_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING saved_count`, [id]);
            newSavedCount = updateCountResult.rows[0]?.saved_count ?? 0; newFollowingState = true;
            console.log(`[LISTS POST /:id/follow] User ${userId} followed list ${id}. New saved_count: ${newSavedCount}`);
        }

        // Use lowercase table name in EXISTS check
        const updatedListQuery = ` SELECT l.*, COALESCE(lc.count, 0)::integer as item_count, $2::boolean as is_following FROM Lists l LEFT JOIN (SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id) lc ON l.id = lc.list_id WHERE l.id = $1`;
        const updatedListResult = await client.query(updatedListQuery, [id, newFollowingState]); // Only need listId and newFollowingState
        const updatedList = updatedListResult.rows[0];
        if (!updatedList) throw new Error("Failed to retrieve updated list details after follow toggle.");

        await client.query('COMMIT');
        await client.release();

        // Format response ensuring defaults
        const response = { ...updatedList, city: updatedList.city_name, is_following: updatedList.is_following, is_public: updatedList.is_public ?? true, created_by_user: updatedList.created_by_user ?? false, saved_count: newSavedCount, tags: Array.isArray(updatedList.tags) ? updatedList.tags : [], };
        res.json(response);
    } catch (err) {
        // Rollback and release client on error
        if (client) { try { await client.query('ROLLBACK'); } catch (rbErr) { console.error("Rollback error:", rbErr) } try { await client.release(); } catch (rlErr) { console.error("Client release error:", rlErr) } }
        console.error(`[LISTS POST /:id/follow] Error for ID ${id}, User ${userId}:`, err);
        const statusCode = err.status || 500;
        res.status(statusCode).json({ error: err.message || "Error toggling follow state" });
    }
});

// PUT /api/lists/:id/visibility (Update Visibility)
router.put( "/:id/visibility", validateListIdParam, validateVisibilityPUT, handleValidationErrors, async (req, res) => {
    const { id } = req.params;
    const { is_public } = req.body;
    const userId = 1; // Placeholder - Replace with actual user ID
    console.log(`[LISTS PUT /:id/visibility] Updating visibility for list ${id} to ${is_public} by user ${userId}`);
    try {
        // Check ownership using created_by_user flag for now
        const updateQuery = ` UPDATE Lists SET is_public = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND created_by_user = TRUE RETURNING *; `;
        const result = await db.query(updateQuery, [is_public, id]);
        if (result.rows.length === 0) {
             const checkExists = await db.query(`SELECT 1 FROM Lists WHERE id = $1`, [id]);
             if (checkExists.rows.length === 0) { return res.status(404).json({ error: 'List not found.' }); }
             else { return res.status(403).json({ error: 'Forbidden: You do not own this list.' }); }
        }
        console.log(`[LISTS PUT /:id/visibility] Visibility updated for list ${id}.`);
        // Format response consistently
        const updatedList = result.rows[0];
        const listItemsCountResult = await db.query(`SELECT COUNT(*) as count FROM ListItems WHERE list_id = $1`, [id]);
        const response = { ...updatedList, city: updatedList.city_name, is_following: updatedList.is_following ?? false, is_public: updatedList.is_public ?? true, created_by_user: updatedList.created_by_user ?? false, item_count: parseInt(listItemsCountResult.rows[0].count, 10), tags: Array.isArray(updatedList.tags) ? updatedList.tags : [], };
        res.status(200).json(response);
    } catch (err) {
        console.error(`[LISTS PUT /:id/visibility] Error updating visibility for list ${id}:`, err);
        res.status(500).json({ error: "Failed to update list visibility", details: err.message });
    }
});


// POST /api/lists/:id/items (Add item to list)
router.post( "/:id/items", validateListIdParam, validateAddItemPOST, handleValidationErrors, async (req, res) => {
    const { id: listId } = req.params;
    const { item_id, item_type } = req.body;
    const userId = 1; // Placeholder user ID
    console.log(`[LISTS POST /:id/items] Adding item ${item_type}:${item_id} to list ${listId} by user ${userId}`);
    let client;
    try {
        client = await db.getClient();
        await client.query('BEGIN');
        // 1. Check list exists
        const listCheck = await client.query(`SELECT id FROM Lists WHERE id = $1`, [listId]);
        if (listCheck.rows.length === 0) { throw { status: 404, message: "List not found." }; }
        // 2. Check item exists
        const itemTable = item_type === 'dish' ? 'Dishes' : 'Restaurants';
        const itemCheck = await client.query(`SELECT id FROM ${itemTable} WHERE id = $1`, [item_id]);
        if(itemCheck.rows.length === 0) { throw { status: 404, message: `Item (${item_type}) with ID ${item_id} not found.` }; }
        // 3. Insert item
        const insertQuery = ` INSERT INTO ListItems (list_id, item_type, item_id, added_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) ON CONFLICT (list_id, item_type, item_id) DO NOTHING RETURNING id; `;
        const result = await client.query(insertQuery, [listId, item_type, item_id]);
        // 4. Update parent list timestamp
        await client.query("UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [listId]);
        await client.query('COMMIT');
        await client.release();

        if (result.rows.length > 0) {
            console.log(`[LISTS POST /:id/items] Item ${item_type}:${item_id} added successfully to list ${listId}. New ListItemID: ${result.rows[0].id}`);
            res.status(201).json({ list_item_id: result.rows[0].id, list_id: listId, item_id: item_id, item_type: item_type });
        } else {
             console.log(`[LISTS POST /:id/items] Item ${item_type}:${item_id} already exists in list ${listId}.`);
             res.status(200).json({ message: "Item already exists in this list." });
        }
    } catch (err) {
        if (client) { try { await client.query('ROLLBACK'); } catch (rbErr) {/* handle */} try { await client.release(); } catch (rlErr) { /* handle */} }
        console.error(`[LISTS POST /:id/items] Error adding item to list ${listId}:`, err);
        const statusCode = err.status || 500;
        res.status(statusCode).json({ error: err.message || "Failed to add item to list" });
    }
});

// DELETE /api/lists/:id/items/:listItemId (Remove item from list)
router.delete( "/:id/items/:listItemId", validateListIdParam, validateListItemIdParam, handleValidationErrors, async (req, res) => {
    const { id: listId, listItemId } = req.params;
    const userId = 1; // Placeholder
    console.log(`[LISTS DELETE /:id/items/:listItemId] Removing list item ${listItemId} from list ${listId} by user ${userId}`);
    let client;
    try {
        client = await db.getClient();
        await client.query('BEGIN');
        // Check ownership (using created_by_user flag)
        const listCheck = await client.query(`SELECT id FROM Lists WHERE id = $1 AND created_by_user = TRUE`, [listId]);
        if (listCheck.rows.length === 0) {
             const checkExists = await db.query(`SELECT 1 FROM Lists WHERE id = $1`, [listId]);
             if (checkExists.rows.length === 0) { throw { status: 404, message: 'List not found.' }; }
             else { throw { status: 403, message: 'Forbidden: You do not have permission to remove items.' }; }
        }
        // Delete the item
        const deleteQuery = `DELETE FROM ListItems WHERE id = $1 AND list_id = $2 RETURNING id;`;
        const result = await client.query(deleteQuery, [listItemId, listId]);
        if (result.rows.length === 0) {
            throw { status: 404, message: `List item ID ${listItemId} not found in list ${listId}.` };
        }
        // Update parent list timestamp
        await client.query("UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [listId]);
        await client.query('COMMIT');
        await client.release();
        console.log(`[LISTS DELETE /:id/items/:listItemId] List item ${listItemId} removed successfully from list ${listId}.`);
        res.status(204).send(); // No Content
    } catch (err) {
        if (client) { try { await client.query('ROLLBACK'); } catch (rbErr) {/* handle */} try { await client.release(); } catch (rlErr) { /* handle */} }
        console.error(`[LISTS DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
        const statusCode = err.status || 500;
        res.status(statusCode).json({ error: err.message || "Failed to remove item from list" });
    }
});


module.exports = router;