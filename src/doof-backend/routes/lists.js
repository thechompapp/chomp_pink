// src/doof-backend/routes/lists.js
import express from 'express';
import { param, query, body, validationResult } from 'express-validator';
// Corrected imports:
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// --- Validation Middleware (remains the same) ---
const validateListIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('Invalid List ID format in URL.'),
];
const validateListItemIdParam = [
    param('listItemId').isInt({ gt: 0 }).withMessage('Invalid List Item ID format in URL.'),
];
const validateGetListsQuery = [
    query('createdByUser').optional().isBoolean().toBoolean(),
    query('followedByUser').optional().isBoolean().toBoolean(),
];
const validateCreateListPOST = [
    body('name').trim().notEmpty().withMessage('List name is required.').isLength({ max: 255 }).withMessage('List name too long.'),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Description too long.'), // checkFalsy allows empty string
    body('city_name').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
    body('tags.*').optional().isString().trim().toLowerCase().isLength({ min: 1, max: 50 }).withMessage('Tags must be between 1 and 50 characters.'),
    body('is_public').optional().isBoolean().toBoolean(),
];
const validateAddItemPOST = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer.'),
    body('item_type').isIn(['restaurant', 'dish']).withMessage('Invalid item type (must be "restaurant" or "dish").'),
];
const validateVisibilityPUT = [
    body('is_public').isBoolean().withMessage('is_public must be true or false.'),
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn("[Lists Validation Error]", req.path, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};
// --- END Validation ---

// --- Route Handlers ---

// GET /api/lists
router.get(
  '/',
  authMiddleware, // Requires user to be logged in
  validateGetListsQuery,
  handleValidationErrors,
  async (req, res, next) => {
    const { createdByUser, followedByUser } = req.query;
    const userId = req.user?.id;
    const currentDb = req.app?.get('db') || db;

    if (typeof userId !== 'number' || userId <= 0) {
        // This should technically be caught by authMiddleware, but double-check
        return res.status(401).json({ error: 'Authentication required.'});
    }

    try {
      // Base query
      let queryText = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          l.user_id,
          (l.user_id = $1) as created_by_user, -- Check if current user created it
          COALESCE(u.username, 'unknown') AS creator_handle,
          l.created_at, l.updated_at,
          COALESCE(lc.count, 0)::integer as item_count,
          -- Check if current user follows this list
          EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1) as is_following
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        LEFT JOIN ( -- Subquery to count items per list efficiently
          SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id
        ) lc ON l.id = lc.list_id
      `;
      const queryParams = [userId];
      const conditions = [];

      // Apply filters based on query parameters
      if (createdByUser === true) {
        conditions.push(`l.user_id = $1`);
      } else if (followedByUser === true) {
         conditions.push(`EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1)`);
      } else {
          // Default: Fetch lists user created OR follows OR public lists they don't own/follow
           conditions.push(
              `(l.is_public = TRUE OR l.user_id = $1 OR EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1))`
           );
      }

      // Add WHERE clause if conditions exist
      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }
      // Add ordering
      queryText += ` ORDER BY l.updated_at DESC, l.created_at DESC`;

      const result = await currentDb.query(queryText, queryParams);

      // Format results for consistency
      const lists = (result.rows || []).map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        saved_count: list.saved_count || 0,
        item_count: list.item_count || 0,
        city: list.city_name, // Rename for frontend consistency
        tags: Array.isArray(list.tags) ? list.tags : [], // Ensure array
        is_public: list.is_public ?? true, // Default to true
        is_following: list.is_following ?? false, // Default to false
        created_by_user: list.created_by_user ?? false, // Default to false
        user_id: list.user_id,
        creator_handle: list.creator_handle,
      })).filter((list) => typeof list.id !== 'undefined' && list.id !== null); // Filter invalid lists

      res.json(lists);
    } catch (err) {
      console.error(`[LISTS GET /] Error fetching lists for user ${userId}:`, err);
      next(err); // Pass error to central handler
    }
  }
);

// GET specific list details (/:id)
router.get(
  '/:id',
  authMiddleware, // Requires login to view details (even public ones for follow status)
  validateListIdParam,
  handleValidationErrors,
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id; // Get user ID from auth middleware
    const currentDb = req.app?.get('db') || db;

    // Although middleware checks, ensure userId is valid here for logic
    if (!userId) {
       return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
      // Fetch list metadata
      const listQuery = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          l.user_id, -- Need owner ID for access check
          (l.user_id = $2) AS created_by_user, -- Check ownership by requesting user
          COALESCE(u.username, 'unknown') AS creator_handle,
          l.created_at, l.updated_at,
          -- Check follow status for requesting user
          EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $2) as is_following
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        WHERE l.id = $1 -- Filter by list ID
      `;
      const listResult = await currentDb.query(listQuery, [id, userId]);

      if (listResult.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }
      const list = listResult.rows[0];

      // Authorization Check: Allow if public OR user is the owner
      if (!list.is_public && list.user_id !== userId) {
        // For private lists, we could potentially check if the user follows it,
        // but current design seems to restrict detail view to owner or public.
        return res.status(403).json({ error: 'Forbidden: You do not have access to this private list.' });
      }

      // Fetch list items
      const itemsQuery = `
        SELECT
          li.id as list_item_id, li.item_type, li.item_id, li.added_at,
          -- Get name based on item type
          CASE
            WHEN li.item_type = 'dish' THEN d.name
            WHEN li.item_type = 'restaurant' THEN r.name
            ELSE 'Unknown Item'
          END as name,
          -- Get restaurant name ONLY if it's a dish
          CASE
            WHEN li.item_type = 'dish' THEN COALESCE(r_dish.name, 'Unknown Restaurant')
            ELSE NULL
          END as restaurant_name,
          -- Get location info based on item type
           CASE
             WHEN li.item_type = 'restaurant' THEN r.city_name
             WHEN li.item_type = 'dish' THEN r_dish.city_name
             ELSE NULL
           END as city,
           CASE
             WHEN li.item_type = 'restaurant' THEN r.neighborhood_name
             WHEN li.item_type = 'dish' THEN r_dish.neighborhood_name
             ELSE NULL
           END as neighborhood,
           -- Get tags based on item type
           COALESCE(
                (CASE
                    WHEN li.item_type = 'dish' THEN (SELECT array_agg(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = li.item_id)
                    WHEN li.item_type = 'restaurant' THEN (SELECT array_agg(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = li.item_id)
                    ELSE NULL
                 END),
                '{}'::text[] -- Default to empty array if no tags
            ) as tags
        FROM ListItems li
        -- Join based on item type
        LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
        LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
        -- Join Restaurants again to get info for dishes
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC -- Order items by when they were added
      `;
      const itemsResult = await currentDb.query(itemsQuery, [id]);

      // Construct the response object
      const response = {
        id: list.id,
        name: list.name,
        description: list.description,
        saved_count: list.saved_count || 0,
        city: list.city_name, // Rename for frontend
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: list.is_public ?? true,
        user_id: list.user_id, // Include owner ID
        created_by_user: list.created_by_user ?? false,
        creator_handle: list.creator_handle,
        is_following: list.is_following ?? false,
        created_at: list.created_at,
        updated_at: list.updated_at,
        // Format items
        items: (itemsResult.rows || []).map((item) => ({
          list_item_id: item.list_item_id,
          item_type: item.item_type,
          id: item.item_id, // This is the restaurant or dish ID
          name: item.name,
          restaurant_name: item.restaurant_name, // Only present for dishes
          added_at: item.added_at,
          city: item.city,
          neighborhood: item.neighborhood,
          tags: Array.isArray(item.tags) ? item.tags : [],
        })),
        item_count: itemsResult.rows.length, // Use actual count of fetched items
      };
      res.json(response);
    } catch (err) {
      console.error(`[LISTS GET /:id] Error fetching list ${id}:`, err);
      next(err);
    }
  }
);

// POST /api/lists (Create New List)
router.post(
  '/',
  authMiddleware,
  validateCreateListPOST,
  handleValidationErrors,
  async (req, res, next) => {
    const { name, description, city_name, tags, is_public } = req.body;
    const userId = req.user?.id; // Assumes authMiddleware adds user object
    const currentDb = req.app?.get('db') || db;

    if (!userId) {
        // Should be caught by authMiddleware
        return res.status(401).json({ error: 'Authentication required.' });
    }

    // Attempt to get the creator's handle (username)
    let creatorHandle = `user${userId}`; // Default handle
    try {
        const userRes = await currentDb.query('SELECT username FROM Users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0) {
            creatorHandle = userRes.rows[0].username;
        }
    } catch (handleErr) {
        console.warn('[LISTS POST /] Could not fetch username for creator_handle:', handleErr.message);
        // Proceed with default handle
    }

    try {
        // Sanitize tags: ensure array, trim, lowercase, filter empty
        const cleanTags = Array.isArray(tags)
          ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
          : [];
        // Default is_public to true if not provided or invalid
        const publicFlag = typeof is_public === 'boolean' ? is_public : true;

        const query = `
            INSERT INTO Lists (name, description, city_name, tags, is_public, user_id, creator_handle, saved_count, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, name, description, saved_count, city_name, tags, is_public, user_id, creator_handle, created_at, updated_at
        `;
        const values = [name, description || null, city_name || null, cleanTags, publicFlag, userId, creatorHandle];

        const result = await currentDb.query(query, values);

        if (result.rows.length === 0) {
            // This indicates a DB insertion failure without a PG error, which is unusual
            throw new Error('Database insertion failed: No list was returned.');
        }
        const newList = result.rows[0];

        // Format response consistent with GET /lists
        const response = {
            id: newList.id,
            name: newList.name,
            description: newList.description,
            saved_count: newList.saved_count || 0,
            item_count: 0, // New list has 0 items initially
            city: newList.city_name, // Rename for frontend
            tags: Array.isArray(newList.tags) ? newList.tags : [],
            is_public: newList.is_public ?? true,
            is_following: false, // User cannot follow their own newly created list
            created_by_user: true, // The creator owns this list
            user_id: newList.user_id,
            creator_handle: newList.creator_handle,
        };
        res.status(201).json(response);
    } catch (err) {
        console.error('[LISTS POST /] Error creating list:', err);
        // Check for unique constraint violation if needed (e.g., duplicate name for user?)
        next(err); // Pass to central error handler
    }
  }
);

// POST /api/lists/:id/follow (Toggle Follow)
router.post(
  '/:id/follow',
  authMiddleware,
  validateListIdParam,
  handleValidationErrors,
  async (req, res, next) => {
    const { id: listId } = req.params;
    const userId = req.user?.id;
    const currentDb = req.app?.get('db') || db;

    console.log(`[LISTS POST /${listId}/follow] User ${userId} attempting follow toggle.`);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Use a client for transaction
    const client = await currentDb.getClient();
    try {
      await client.query('BEGIN');

      // Lock the list row and check ownership
      const listCheck = await client.query(`SELECT user_id, saved_count FROM Lists WHERE id = $1 FOR UPDATE`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found' };
      }
      if (listCheck.rows[0].user_id === userId) {
        // Prevent following own list
        throw { status: 400, message: 'You cannot follow or unfollow your own list.' };
      }

      const currentSavedCount = listCheck.rows[0].saved_count;

      // Check current follow status
      const followQuery = `SELECT list_id FROM listfollows WHERE list_id = $1 AND user_id = $2`;
      const followResult = await client.query(followQuery, [listId, userId]);
      const isCurrentlyFollowing = followResult.rows.length > 0;
      let newFollowingState;

      console.log(`[LISTS POST /${listId}/follow] User ${userId} currently ${isCurrentlyFollowing ? 'IS' : 'is NOT'} following.`);

      // Perform follow/unfollow and update saved_count
      if (isCurrentlyFollowing) {
        await client.query(`DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2`, [listId, userId]);
        const newSavedCount = Math.max(0, currentSavedCount - 1); // Prevent negative counts
        await client.query(`UPDATE Lists SET saved_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newSavedCount, listId]);
        newFollowingState = false;
        console.log(`[LISTS POST /${listId}/follow] User ${userId} UNFOLLOWED list ${listId}`);
      } else {
        await client.query(
          `INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`,
          [listId, userId]
        );
        // Only increment if the insert actually happened (though ON CONFLICT handles duplicates)
        // A more robust way might re-query the count after potential insert/delete
        const newSavedCount = currentSavedCount + 1;
        await client.query(`UPDATE Lists SET saved_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newSavedCount, listId]);
        newFollowingState = true;
        console.log(`[LISTS POST /${listId}/follow] User ${userId} FOLLOWED list ${listId}`);
      }

      // Fetch the final state of the list to return
      const updatedListQuery = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          l.user_id,
          (l.user_id = $2) AS created_by_user,
          COALESCE(u.username, 'unknown') AS creator_handle,
          l.created_at, l.updated_at,
          COALESCE(lc.count, 0)::integer as item_count,
          -- Explicitly use the new state for the response
          $3::boolean as is_following
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        LEFT JOIN (SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id) lc ON l.id = lc.list_id
        WHERE l.id = $1
      `;
      const updatedListResult = await client.query(updatedListQuery, [listId, userId, newFollowingState]);
      const updatedList = updatedListResult.rows[0];
      if (!updatedList) throw new Error('Failed to retrieve updated list details after follow toggle.');

      await client.query('COMMIT');

      // Format response
      const response = {
        id: updatedList.id,
        name: updatedList.name,
        description: updatedList.description,
        saved_count: updatedList.saved_count || 0,
        item_count: updatedList.item_count || 0,
        city: updatedList.city_name,
        tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
        is_public: updatedList.is_public ?? true,
        is_following: updatedList.is_following, // Use the state determined during the transaction
        created_by_user: updatedList.created_by_user ?? false,
        user_id: updatedList.user_id,
        creator_handle: updatedList.creator_handle,
      };

      console.log(`[LISTS POST /${listId}/follow] OK - Returning follow status: ${response.is_following}`);
      res.json(response);

    } catch (err) {
      // Rollback on any error
      try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('[LISTS /:id/follow] Error rolling back transaction:', rbErr); }
      console.error(`[LISTS POST /:id/follow] Error toggling follow for list ${listId} by user ${userId}:`, err);
      // Pass specific status/message if available, otherwise pass to generic handler
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      next(err);
    } finally {
        // Release the client back to the pool
        client.release();
    }
  }
);

// PUT /api/lists/:id/visibility (Update Visibility)
router.put(
  '/:id/visibility',
  authMiddleware,
  validateListIdParam,
  validateVisibilityPUT,
  handleValidationErrors,
  async (req, res, next) => {
    const { id } = req.params;
    const { is_public } = req.body;
    const userId = req.user?.id;
    const currentDb = req.app?.get('db') || db;

    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    try {
      // Update visibility only if the user owns the list
      const updateQuery = `
        UPDATE Lists
        SET is_public = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3 -- Ensure ownership
        RETURNING id, name, description, saved_count, city_name, tags, is_public, user_id, creator_handle, created_at, updated_at
      `;
      const result = await currentDb.query(updateQuery, [is_public, id, userId]);

      if (result.rows.length === 0) {
        // Check if the list exists at all to differentiate 404 vs 403
        const checkExists = await currentDb.query(`SELECT user_id FROM Lists WHERE id = $1`, [id]);
        if (checkExists.rows.length === 0) {
          return res.status(404).json({ error: 'List not found.' });
        } else {
          // List exists but user doesn't own it
          return res.status(403).json({ error: 'Forbidden: You do not own this list.' });
        }
      }

      // Fetch auxiliary data (item count, follow status) for the response
      const updatedList = result.rows[0];
      const listItemsCountResult = await currentDb.query(`SELECT COUNT(*) as count FROM ListItems WHERE list_id = $1`, [id]);
      const followCheck = await currentDb.query(`SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2`, [id, userId]);

      // Format response
      const response = {
        id: updatedList.id,
        name: updatedList.name,
        description: updatedList.description,
        saved_count: updatedList.saved_count || 0,
        item_count: parseInt(listItemsCountResult.rows[0]?.count, 10) || 0,
        city: updatedList.city_name,
        tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
        is_public: updatedList.is_public ?? true,
        is_following: followCheck.rows.length > 0, // Should be false if owner, but check anyway
        created_by_user: true, // Since ownership was verified by WHERE clause
        user_id: updatedList.user_id,
        creator_handle: updatedList.creator_handle,
      };

      res.status(200).json(response);
    } catch (err) {
      console.error(`[LISTS PUT /:id/visibility] Error updating visibility for list ${id}:`, err);
      next(err);
    }
  }
);

// POST /api/lists/:id/items (Add item to list)
router.post(
  '/:id/items',
  authMiddleware,
  validateListIdParam,
  validateAddItemPOST,
  handleValidationErrors,
  async (req, res, next) => {
    const { id: listId } = req.params;
    const { item_id, item_type } = req.body;
    const userId = req.user?.id;
    const currentDb = req.app?.get('db') || db;

    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const client = await currentDb.getClient(); // Use client for transaction
    try {
      await client.query('BEGIN');

      // Verify list ownership using FOR UPDATE for locking
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
         // Only allow adding to own lists
         throw { status: 403, message: 'Forbidden: You can only add items to your own lists.' };
      }

      // Verify item exists
      const itemTable = item_type === 'dish' ? 'Dishes' : 'Restaurants';
      // Use parameterized query for table name - THIS IS NOT POSSIBLE directly.
      // Instead, validate item_type and use conditional logic or separate queries.
      // We already validated item_type, so this check is safe:
      const itemCheck = await client.query(`SELECT id FROM ${itemTable} WHERE id = $1`, [item_id]);
      if (itemCheck.rows.length === 0) {
        throw { status: 404, message: `Item (${item_type}) with ID ${item_id} not found.` };
      }

      // Attempt to insert the item into the list
      const insertQuery = `
        INSERT INTO ListItems (list_id, item_type, item_id, added_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (list_id, item_type, item_id) DO NOTHING -- Ignore duplicates
        RETURNING id, item_type, item_id, added_at
      `;
      const result = await client.query(insertQuery, [listId, item_type, item_id]);

      // Update the list's updated_at timestamp regardless of whether item was new
      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);

      await client.query('COMMIT');

      // Respond based on whether a row was inserted
      if (result.rows.length > 0) {
        res.status(201).json({ ...result.rows[0], message: 'Item added to list.' });
      } else {
        // If ON CONFLICT stopped the insert, the item was already there
        res.status(200).json({ message: 'Item already exists in the list.' });
      }
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('[LISTS /:id/items] Error rolling back transaction:', rbErr); }
      console.error(`[LISTS POST /:id/items] Error adding item to list ${listId}:`, err);
      if (err.status) { // Handle custom errors with status
        return res.status(err.status).json({ error: err.message });
      }
      next(err); // Pass other errors to central handler
    } finally {
         client.release(); // Always release client
    }
  }
);

// DELETE /api/lists/:id/items/:listItemId (Remove item from list)
router.delete(
  '/:id/items/:listItemId',
  authMiddleware,
  validateListIdParam,
  validateListItemIdParam,
  handleValidationErrors,
  async (req, res, next) => {
    const { id: listId, listItemId } = req.params;
    const userId = req.user?.id;
    const currentDb = req.app?.get('db') || db;

    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const client = await currentDb.getClient();
    try {
      await client.query('BEGIN');

      // Verify list ownership using FOR UPDATE
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
         // Only allow removing from own lists
         throw { status: 403, message: 'Forbidden: You can only remove items from your own lists.' };
      }

      // Attempt to delete the specific list item
      const deleteQuery = `DELETE FROM ListItems WHERE id = $1 AND list_id = $2 RETURNING id`;
      const result = await client.query(deleteQuery, [listItemId, listId]);

      if (result.rows.length === 0) {
        // Item wasn't found in this specific list (or listItemId was wrong)
        throw { status: 404, message: `List item ID ${listItemId} not found in list ${listId}.` };
      }

      // Update the list's updated_at timestamp
      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);

      await client.query('COMMIT');

      // Success, no content to return
      res.status(204).send();

    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('[LISTS DELETE /:id/items] Error rolling back transaction:', rbErr); }
      console.error(`[LISTS DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
      if (err.status) { // Handle custom errors with status
        return res.status(err.status).json({ error: err.message });
      }
      next(err); // Pass other errors to central handler
    } finally {
        client.release(); // Always release client
    }
  }
);

// Corrected export
export default router;