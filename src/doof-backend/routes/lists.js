// src/doof-backend/routes/lists.js
const express = require('express');
const db = require('../db');
const { param, query, body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth'); // Default export

const router = express.Router();

// --- Validation Middleware ---
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
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description too long.'), // Example max length
    body('city_name').optional().trim().isLength({ max: 100 }),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
    body('tags.*').optional().isString().trim().toLowerCase().isLength({ max: 50 }), // Validate individual tags
    body('is_public').optional().isBoolean().toBoolean(),
];
const validateAddItemPOST = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer.'),
    body('item_type').isIn(['restaurant', 'dish']).withMessage('Invalid item type.'),
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

// GET /api/lists (Get lists based on filters for the authenticated user)
router.get(
  '/',
  authMiddleware, // Requires authentication
  validateGetListsQuery,
  handleValidationErrors,
  async (req, res, next) => {
    const { createdByUser, followedByUser } = req.query;
    const userId = req.user?.id; // Get user ID from authenticated request

    if (typeof userId !== 'number' || userId <= 0) {
        // Should be caught by authMiddleware, but good safeguard
        return next(new Error('Authentication failed or user ID missing/invalid.'));
    }

    try {
      let queryText = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          l.user_id, -- Select the owner's user_id explicitly
          (l.user_id = $1) as created_by_user,
          COALESCE(u.username, 'unknown') AS creator_handle, -- Use COALESCE for creator handle
          l.created_at, l.updated_at,
          COALESCE(lc.count, 0)::integer as item_count,
          EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1) as is_following
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        LEFT JOIN (
          SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id
        ) lc ON l.id = lc.list_id
      `;
      const queryParams = [userId];
      const conditions = [];

      if (createdByUser === true) { // Check boolean true
        conditions.push(`l.user_id = $1`);
      } else if (followedByUser === true) { // Check boolean true
         conditions.push(`EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1)`);
      } else {
          // Default: Show public lists OR lists created by user OR lists followed by user
          conditions.push(
             `(l.is_public = TRUE OR l.user_id = $1 OR EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1))`
           );
      }

      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }
      queryText += ` ORDER BY l.updated_at DESC, l.created_at DESC`;

      const result = await db.query(queryText, queryParams);

      // Map results for consistency, ensuring user_id is present
      const lists = (result.rows || []).map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        saved_count: list.saved_count || 0,
        item_count: list.item_count || 0,
        city: list.city_name, // Map to 'city' if frontend expects it
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: list.is_public ?? true,
        is_following: list.is_following ?? false,
        created_by_user: list.created_by_user ?? false,
        user_id: list.user_id, // Ensure owner user_id is included
        creator_handle: list.creator_handle, // Include creator handle
        // Add created_at, updated_at if needed by frontend
      })).filter((list) => typeof list.id !== 'undefined' && list.id !== null);

      res.json(lists);

    } catch (err) {
      console.error(`[LISTS GET /] Error fetching lists for user ${userId}:`, err);
      next(err);
    }
  }
);


// GET specific list details (/:id)
router.get(
  '/:id',
  authMiddleware, // Keep middleware, needed to check ownership/follow status
  validateListIdParam,
  handleValidationErrors,
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id; // User ID from token

    if (!userId) {
       return res.status(401).json({ error: 'Authentication required to view list details.' });
    }

    try {
      // Fetch list details including owner ID and creator handle
      const listQuery = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          l.user_id, -- Get the owner's user ID
          (l.user_id = $2) AS created_by_user,
          COALESCE(u.username, 'unknown') AS creator_handle, -- Use COALESCE
          l.created_at, l.updated_at,
          EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $2) as is_following
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        WHERE l.id = $1
      `;
      const listResult = await db.query(listQuery, [id, userId]);

      if (listResult.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }
      const list = listResult.rows[0];

      // Check access for private lists
      if (!list.is_public && list.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this private list.' });
      }

      // Fetch items
      const itemsQuery = `
        SELECT
          li.id as list_item_id, li.item_type, li.item_id, li.added_at,
          CASE
            WHEN li.item_type = 'dish' THEN d.name
            WHEN li.item_type = 'restaurant' THEN r.name
            ELSE 'Unknown Item'
          END as name,
          CASE
            WHEN li.item_type = 'dish' THEN COALESCE(r_dish.name, 'Unknown Restaurant')
            ELSE NULL
          END as restaurant_name,
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
           COALESCE(
                (CASE
                    WHEN li.item_type = 'dish' THEN (SELECT array_agg(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = li.item_id)
                    WHEN li.item_type = 'restaurant' THEN (SELECT array_agg(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = li.item_id)
                    ELSE NULL
                 END),
                '{}'::text[]
            ) as tags
        FROM ListItems li
        LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
        LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC
      `;
      const itemsResult = await db.query(itemsQuery, [id]);

      // Map response, ensure all required fields are present
      const response = {
        id: list.id,
        name: list.name,
        description: list.description,
        saved_count: list.saved_count || 0,
        city: list.city_name, // Map to city
        tags: Array.isArray(list.tags) ? list.tags : [], // LIST's tags
        is_public: list.is_public ?? true,
        user_id: list.user_id, // Owner ID
        created_by_user: list.created_by_user ?? false,
        creator_handle: list.creator_handle,
        is_following: list.is_following ?? false,
        created_at: list.created_at,
        updated_at: list.updated_at,
        items: itemsResult.rows.map((item) => ({
          list_item_id: item.list_item_id,
          item_type: item.item_type,
          id: item.item_id, // Actual dish or restaurant ID
          name: item.name,
          restaurant_name: item.restaurant_name,
          added_at: item.added_at,
          city: item.city,
          neighborhood: item.neighborhood,
          tags: Array.isArray(item.tags) ? item.tags : [], // ITEM's tags
        })),
        item_count: itemsResult.rows.length,
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
    const userId = req.user?.id;
     if (!userId) return res.status(401).json({ error: 'Authentication required.' });

     let creatorHandle = `user${userId}`; // Default handle
     try {
        const userRes = await db.query('SELECT username FROM Users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0) {
            creatorHandle = userRes.rows[0].username;
        }
     } catch (handleErr) {
        console.warn('[LISTS POST /] Could not fetch username for creator_handle:', handleErr.message);
     }

    try {
      const cleanTags = Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [];
      const publicFlag = typeof is_public === 'boolean' ? is_public : true;
      const query = `
        INSERT INTO Lists (name, description, city_name, tags, is_public, user_id, creator_handle, saved_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name, description, saved_count, city_name, tags, is_public, user_id, creator_handle, created_at, updated_at
      `;
      const values = [name, description || null, city_name || null, cleanTags, publicFlag, userId, creatorHandle];

      const result = await db.query(query, values);

      if (result.rows.length === 0) throw new Error('DB insertion error (no rows returned).');
      const newList = result.rows[0];

      // Map response for consistency
      const response = {
        id: newList.id,
        name: newList.name,
        description: newList.description,
        saved_count: newList.saved_count || 0,
        item_count: 0, // New list starts with 0 items
        city: newList.city_name,
        tags: Array.isArray(newList.tags) ? newList.tags : [],
        is_public: newList.is_public ?? true,
        is_following: false, // Creator doesn't "follow" their own list in the 'listfollows' table
        created_by_user: true,
        user_id: newList.user_id,
        creator_handle: newList.creator_handle,
      };
      res.status(201).json(response);
    } catch (err) {
      console.error('[LISTS POST /] Error creating list:', err);
      next(err);
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
    const { id: listId } = req.params; // Renamed for clarity
    const userId = req.user?.id;
     if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    let client;
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      // Check if list exists and prevent self-following
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found' };
      }
       if (listCheck.rows[0].user_id === userId) {
            // Although UI should prevent this, add backend check
            throw { status: 400, message: 'You cannot follow or unfollow your own list.' };
       }

      const followQuery = `SELECT list_id FROM listfollows WHERE list_id = $1 AND user_id = $2`;
      const followResult = await client.query(followQuery, [listId, userId]);
      const isCurrentlyFollowing = followResult.rows.length > 0;
      let newFollowingState;

      if (isCurrentlyFollowing) {
        // Unfollow: Delete the record and decrement saved_count
        await client.query(`DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2`, [listId, userId]);
        await client.query( `UPDATE Lists SET saved_count = GREATEST(0, saved_count - 1) WHERE id = $1`, [listId] );
        newFollowingState = false;
      } else {
        // Follow: Insert the record and increment saved_count
        await client.query( `INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`, [listId, userId] );
        await client.query( `UPDATE Lists SET saved_count = saved_count + 1 WHERE id = $1`, [listId] );
        newFollowingState = true;
      }

      // Fetch the updated list details to return
       const updatedListQuery = `
         SELECT
           l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
           l.user_id, -- Owner ID
           (l.user_id = $2) AS created_by_user,
           COALESCE(u.username, 'unknown') AS creator_handle,
           l.created_at, l.updated_at,
           COALESCE(lc.count, 0)::integer as item_count,
           $3::boolean as is_following -- Explicitly set the new follow state
         FROM Lists l
         LEFT JOIN Users u ON l.user_id = u.id
         LEFT JOIN (SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id) lc ON l.id = lc.list_id
         WHERE l.id = $1
       `;
      const updatedListResult = await client.query(updatedListQuery, [listId, userId, newFollowingState]);
      const updatedList = updatedListResult.rows[0];
      if (!updatedList) throw new Error('Failed to retrieve updated list details after follow toggle.');

      await client.query('COMMIT');

      // Map response for consistency
      const response = {
          id: updatedList.id,
          name: updatedList.name,
          description: updatedList.description,
          saved_count: updatedList.saved_count || 0,
          item_count: updatedList.item_count || 0,
          city: updatedList.city_name,
          tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
          is_public: updatedList.is_public ?? true,
          is_following: updatedList.is_following ?? false,
          created_by_user: updatedList.created_by_user ?? false,
          user_id: updatedList.user_id, // Owner ID
          creator_handle: updatedList.creator_handle,
      };
      res.json(response); // Return the updated list object
    } catch (err) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
      }
      console.error(`[LISTS POST /:id/follow] Error toggling follow for list ${listId}:`, err);
       if (err.status) { // Handle custom status/message errors
            return res.status(err.status).json({ error: err.message });
       }
       next(err); // Pass other errors to general handler
    } finally {
        if (client) {
            client.release();
        }
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
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    try {
      // Update and retrieve the list in one go
      const updateQuery = `
        UPDATE Lists
        SET is_public = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING id, name, description, saved_count, city_name, tags, is_public, user_id, creator_handle, created_at, updated_at
      `;
      const result = await db.query(updateQuery, [is_public, id, userId]);

      if (result.rows.length === 0) {
        // Check if the list exists but isn't owned by the user
        const checkExists = await db.query(`SELECT user_id FROM Lists WHERE id = $1`, [id]);
        if (checkExists.rows.length === 0) {
          return res.status(404).json({ error: 'List not found.' });
        } else {
          return res.status(403).json({ error: 'Forbidden: You do not own this list.' });
        }
      }

      const updatedList = result.rows[0];
      // Get item count and follow status separately
      const listItemsCountResult = await db.query( `SELECT COUNT(*) as count FROM ListItems WHERE list_id = $1`, [id] );
      const followCheck = await db.query( `SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2`, [id, userId] );

      // Map response for consistency
      const response = {
        id: updatedList.id,
        name: updatedList.name,
        description: updatedList.description,
        saved_count: updatedList.saved_count || 0,
        item_count: parseInt(listItemsCountResult.rows[0].count, 10) || 0,
        city: updatedList.city_name,
        tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
        is_public: updatedList.is_public ?? true,
        is_following: followCheck.rows.length > 0, // Include current follow status
        created_by_user: true, // Since only owner can update, this is true
        user_id: updatedList.user_id, // Owner ID
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
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    let client;
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      // Check list ownership
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
         throw { status: 403, message: 'Forbidden: You can only add items to your own lists.' };
      }

      // Check if item exists
      const itemTable = item_type === 'dish' ? 'Dishes' : 'Restaurants';
      const itemCheck = await client.query(`SELECT id FROM ${itemTable} WHERE id = $1`, [item_id]);
      if (itemCheck.rows.length === 0) {
        throw { status: 404, message: `Item (${item_type}) with ID ${item_id} not found.` };
      }

      // Insert item, ignoring conflicts
      const insertQuery = `
        INSERT INTO ListItems (list_id, item_type, item_id, added_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (list_id, item_type, item_id) DO NOTHING
        RETURNING id, item_type, item_id, added_at
      `;
      const result = await client.query(insertQuery, [listId, item_type, item_id]);

      // Update the list's updated_at timestamp
      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);

      await client.query('COMMIT');

      if (result.rows.length > 0) {
        res.status(201).json({ ...result.rows[0], message: 'Item added to list.' });
      } else {
        res.status(200).json({ message: 'Item already exists in the list.' });
      }
    } catch (err) {
      if (client) {
         try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
      }
      console.error(`[LISTS POST /:id/items] Error adding item to list ${listId}:`, err);
       if (err.status) { // Handle custom status/message errors
            return res.status(err.status).json({ error: err.message });
       }
       next(err); // Pass other errors to general handler
    } finally {
        if (client) {
            client.release();
        }
    }
  }
);

// DELETE /api/lists/:id/items/:listItemId (Remove item from list)
router.delete(
  '/:id/items/:listItemId',
  authMiddleware,
  validateListIdParam,
  validateListItemIdParam, // Use the specific validator for listItemId
  handleValidationErrors,
  async (req, res, next) => {
    const { id: listId, listItemId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    let client;
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      // Check list ownership first
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
         throw { status: 403, message: 'Forbidden: You can only remove items from your own lists.' };
      }

      // Delete the specific list item by its own ID (listItemId) within the correct list
      const deleteQuery = `DELETE FROM ListItems WHERE id = $1 AND list_id = $2 RETURNING id`;
      const result = await client.query(deleteQuery, [listItemId, listId]);

      if (result.rows.length === 0) {
        // If the item wasn't deleted, it means the listItemId didn't exist in that list
        throw { status: 404, message: `List item ID ${listItemId} not found in list ${listId}.` };
      }

      // Update the list's updated_at timestamp
      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);

      await client.query('COMMIT');

      res.status(204).send(); // Success, no content to return
    } catch (err) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
      }
      console.error(`[LISTS DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
       if (err.status) { // Handle custom status/message errors
            return res.status(err.status).json({ error: err.message });
       }
       next(err); // Pass other errors to general handler
    } finally {
       if (client) {
           client.release();
       }
    }
  }
);


module.exports = router;