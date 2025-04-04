// src/doof-backend/routes/lists.js
const express = require('express');
const db = require('../db');
const { param, query, body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth'); // Default export

const router = express.Router();

// --- Validation Middleware ---
const validateListIdParam = [
  param('id').isInt({ min: 1 }).withMessage('List ID must be a positive integer'),
];

const validateListItemIdParam = [
  param('listItemId').isInt({ min: 1 }).withMessage('List Item ID must be a positive integer'),
];

const validateGetListsQuery = [
  query('createdByUser')
    .optional()
    .isBoolean()
    .withMessage('createdByUser must be a boolean'),
  query('followedByUser')
    .optional()
    .isBoolean()
    .withMessage('followedByUser must be a boolean'),
];

const validateCreateListPOST = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('List name is required')
    .isLength({ max: 100 })
    .withMessage('List name must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('city_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name must be less than 100 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters'),
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
];

const validateAddItemPOST = [
  body('item_id')
    .isInt({ min: 1 })
    .withMessage('Item ID must be a positive integer'),
  body('item_type')
    .isIn(['dish', 'restaurant'])
    .withMessage('Item type must be "dish" or "restaurant"'),
];

const validateVisibilityPUT = [
  body('is_public')
    .isBoolean()
    .withMessage('is_public must be a boolean'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg || 'Validation failed', errors: errors.array() });
  }
  next();
};
// --- END Validation ---


// --- Route Handlers ---

// GET /api/lists (Get lists based on filters for the authenticated user)
router.get(
  '/',
  authMiddleware, // Apply authentication middleware FIRST
  validateGetListsQuery, // Then validate query params
  handleValidationErrors, // Then handle any validation errors
  async (req, res, next) => {
    // Middleware should have run and attached req.user if token was valid
    console.log('[LISTS GET /] Handler entered. Query:', req.query);
    const { createdByUser, followedByUser } = req.query;

    // *** ADD LOG: Check req.user and req.user.id ***
    console.log('[LISTS GET /] req.user object received:', req.user); // Log the whole user object from token
    const userId = req.user?.id;
    console.log(`[LISTS GET /] User ID extracted from req.user: ${userId} (Type: ${typeof userId})`);
    // *** END LOG ***

    // Ensure userId is valid before proceeding (middleware should catch missing/invalid token, but double-check)
    if (typeof userId !== 'number' || userId <= 0) {
        console.error('[LISTS GET /] Error: Invalid or missing User ID after auth middleware.');
        // It's better to let the error handler manage the response
        return next(new Error('Authentication failed or user ID missing/invalid.'));
    }

    try {
      // Base query selecting necessary fields and calculating item_count and is_following
      // *** This is the ORIGINAL complex query ***
      let queryText = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          (l.user_id = $1) as created_by_user,
          u.username AS creator_handle, -- Fetch username for creator_handle
          l.created_at, l.updated_at,
          COALESCE(lc.count, 0)::integer as item_count,
          EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1) as is_following
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id -- Join Users table to get creator_handle
        LEFT JOIN (
          SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id
        ) lc ON l.id = lc.list_id
      `;
      const queryParams = [userId]; // Parameter for user ID
      const conditions = [];

      // Apply filters based on query parameters
      if (createdByUser === 'true') {
        // Filter for lists created by the authenticated user
        conditions.push(`l.user_id = $1`);
      } else if (followedByUser === 'true') {
        // Filter for lists followed by the authenticated user
         conditions.push(`EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1)`);
      } else {
          // Default: Show public lists OR lists created by user OR lists followed by user
          conditions.push(
             `(l.is_public = TRUE OR l.user_id = $1 OR EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1))`
           );
      }

      // Append WHERE clause if conditions exist
      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }
      // Add ordering
      queryText += ` ORDER BY l.created_at DESC`;

      // *** ADD LOG: Log final SQL query and params ***
      console.log('[LISTS GET /] Final Executing SQL:', queryText);
      console.log('[LISTS GET /] Final SQL Params:', queryParams);
      // *** END LOG ***

      const result = await db.query(queryText, queryParams);
      console.log(`[LISTS GET /] DB Query successful, found ${result.rows.length} list rows for user ${userId}.`);

      // Map database rows to consistent frontend format
      const lists = (result.rows || []).map((list) => ({
        ...list,
        // Map backend 'city_name' to frontend 'city' if needed elsewhere
        city: list.city_name,
        // Ensure boolean fields have defaults if null from DB (though schema has defaults)
        is_following: list.is_following ?? false,
        is_public: list.is_public ?? true,
        created_by_user: list.created_by_user ?? false,
        // Ensure tags is always an array
        tags: Array.isArray(list.tags) ? list.tags : [],
        // Item count should be handled by the query's COALESCE
        item_count: list.item_count || 0,
      })).filter((list) => typeof list.id !== 'undefined' && list.id !== null); // Basic sanity check

      res.json(lists);

    } catch (err) {
      console.error(`[LISTS GET /] Error fetching lists for user ${userId}:`, err);
      next(err); // Pass error to the centralized error handler
    }
  }
);


// GET specific list details (/:id)
router.get(
  '/:id',
  authMiddleware, // Add middleware if private lists need auth to view details
  validateListIdParam,
  handleValidationErrors,
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id; // User ID from token (might be null if optional auth)
    console.log(`[LISTS GET /:id] Handler entered for ID: ${id}, UserID: ${userId}`);

    // Require authentication to view list details for simplicity now
    if (!userId) {
       return res.status(401).json({ error: 'Authentication required to view list details.' });
    }

    try {
      const listQuery = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          (l.user_id = $2) AS created_by_user, -- Check if viewer is creator
          u.username AS creator_handle,
          l.created_at, l.updated_at,
          -- Check if the current viewer (userId) is following THIS list
          EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $2) as is_following
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        WHERE l.id = $1
      `;
      // Pass userId (which is confirmed not null here)
      const listResult = await db.query(listQuery, [id, userId]);

      if (listResult.rows.length === 0) {
        return res.status(404).json({ error: 'List not found' });
      }
      const list = listResult.rows[0];

      // Check access for private lists
      if (!list.is_public && list.user_id !== userId) {
         console.warn(`[LISTS GET /:id] Access denied for user ${userId} to private list ${id}`);
        return res.status(403).json({ error: 'Forbidden: You do not have access to this private list.' });
      }

      // Fetch items (no auth needed for items themselves usually)
      const itemsQuery = `
        SELECT
          li.id as list_item_id, li.item_type, li.item_id, li.added_at,
          -- Get name based on item type
          CASE
            WHEN li.item_type = 'dish' THEN d.name
            WHEN li.item_type = 'restaurant' THEN r.name
            ELSE 'Unknown Item'
          END as name,
          -- Get restaurant name specifically for dishes
          CASE
            WHEN li.item_type = 'dish' THEN COALESCE(r_dish.name, 'Unknown Restaurant')
            ELSE NULL
          END as restaurant_name,
           -- Get location details based on item type
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
           -- Get tags (simplified: only showing restaurant tags for now)
           -- To get dish tags requires another join or subquery
           CASE
              WHEN li.item_type = 'restaurant' THEN COALESCE(r_tags.tags_array, '{}')
              -- Placeholder for dish tags - might need separate query or more complex join
              WHEN li.item_type = 'dish' THEN COALESCE(d_tags.tags_array, '{}')
              ELSE '{}'::text[]
            END as tags
        FROM ListItems li
        LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
        LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id -- Join for dish's restaurant info
        -- Subquery/Join to get restaurant tags
        LEFT JOIN (
             SELECT rh.restaurant_id, array_agg(h.name) as tags_array
             FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id
             GROUP BY rh.restaurant_id
        ) r_tags ON r_tags.restaurant_id = r.id
         -- Subquery/Join to get dish tags
         LEFT JOIN (
             SELECT dh.dish_id, array_agg(h.name) as tags_array
             FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id
             GROUP BY dh.dish_id
         ) d_tags ON d_tags.dish_id = d.id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC
      `;
      const itemsResult = await db.query(itemsQuery, [id]);

      // Map response
      const response = {
        ...list,
        // Map fields for consistency
        city: list.city_name,
        is_following: list.is_following ?? false,
        is_public: list.is_public ?? true,
        created_by_user: list.created_by_user ?? false,
        tags: Array.isArray(list.tags) ? list.tags : [],
        items: itemsResult.rows.map((item) => ({
          list_item_id: item.list_item_id,
          item_type: item.item_type,
          id: item.item_id, // Map item_id to id for card components
          name: item.name,
          restaurant_name: item.restaurant_name,
          added_at: item.added_at,
          city: item.city,
          neighborhood: item.neighborhood,
          tags: Array.isArray(item.tags) ? item.tags : [],
        })),
        item_count: itemsResult.rows.length, // Calculate item count based on fetched items
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
    console.log('[LISTS POST /] Handler entered.');
    const { name, description, city_name, tags, is_public } = req.body;
    const userId = req.user?.id;
     if (!userId) return res.status(401).json({ error: 'Authentication required.' });
     // Fetch username to use as creator_handle
     let creatorHandle = `@user_${userId}`; // Fallback handle
     try {
        const userRes = await db.query('SELECT username FROM Users WHERE id = $1', [userId]);
        if (userRes.rows.length > 0) {
            creatorHandle = userRes.rows[0].username;
        }
     } catch (handleErr) {
        console.warn('[LISTS POST /] Could not fetch username for creator_handle:', handleErr.message);
     }

    try {
      const cleanTags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
      // Default is_public to true if not provided or invalid
      const publicFlag = typeof is_public === 'boolean' ? is_public : true;
      const query = `
        INSERT INTO Lists (name, description, city_name, tags, is_public, user_id, creator_handle, saved_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, name, description, saved_count, city_name, tags, is_public, user_id, creator_handle, created_at, updated_at
      `;
      const values = [name, description || null, city_name || null, cleanTags, publicFlag, userId, creatorHandle];

      console.log('[LISTS POST /] Executing query:', query.substring(0, 200) + '...');
      console.log('[LISTS POST /] Query values:', values);
      const result = await db.query(query, values);

      if (result.rows.length === 0) throw new Error('DB insertion error (no rows returned).');
      const newList = result.rows[0];
      console.log('[LISTS POST /] List created successfully by user:', userId, newList);

      // Return the newly created list in a format consistent with GET requests
      const response = {
        ...newList,
        city: newList.city_name, // Map city_name if needed
        is_following: false, // Newly created list isn't followed
        is_public: newList.is_public ?? true,
        created_by_user: true, // Creator is always true here
        item_count: 0, // Starts with 0 items
        tags: Array.isArray(newList.tags) ? newList.tags : [],
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
    const { id } = req.params; // List ID to follow/unfollow
    const userId = req.user?.id; // User performing the action
     if (!userId) return res.status(401).json({ error: 'Authentication required.' });
    console.log(`[LISTS POST /:id/follow] Handler entered for List ID: ${id}, UserID: ${userId}`);
    let client; // For transaction
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      // Check if the list exists and if the user is trying to follow their own list
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [id]); // Lock row
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found' };
      }
       if (listCheck.rows[0].user_id === userId) {
            // Prevent following own list
            throw { status: 400, message: 'You cannot follow your own list.' };
       }

      // Check current follow status
      const followQuery = `SELECT list_id FROM listfollows WHERE list_id = $1 AND user_id = $2`;
      const followResult = await client.query(followQuery, [id, userId]);
      const isCurrentlyFollowing = followResult.rows.length > 0;
      let newSavedCount, newFollowingState;

      // Perform follow/unfollow and update saved_count
      if (isCurrentlyFollowing) {
        // Unfollow: Delete from listfollows and decrement saved_count
        await client.query(`DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2`, [id, userId]);
        const updateCountResult = await client.query( `UPDATE Lists SET saved_count = GREATEST(0, saved_count - 1) WHERE id = $1 RETURNING saved_count`, [id] );
        newSavedCount = updateCountResult.rows[0]?.saved_count ?? 0;
        newFollowingState = false;
        console.log(`[LISTS POST /:id/follow] User ${userId} unfollowed list ${id}. New saved_count: ${newSavedCount}`);
      } else {
        // Follow: Insert into listfollows and increment saved_count
        await client.query( `INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`, [id, userId] );
        const updateCountResult = await client.query( `UPDATE Lists SET saved_count = saved_count + 1 WHERE id = $1 RETURNING saved_count`, [id] );
        newSavedCount = updateCountResult.rows[0]?.saved_count ?? 0;
        newFollowingState = true;
        console.log(`[LISTS POST /:id/follow] User ${userId} followed list ${id}. New saved_count: ${newSavedCount}`);
      }

      // Retrieve the updated list details to return in response
       const updatedListQuery = `
         SELECT
           l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
           (l.user_id = $2) AS created_by_user,
           u.username AS creator_handle,
           l.created_at, l.updated_at,
           COALESCE(lc.count, 0)::integer as item_count,
           $3::boolean as is_following -- Pass the calculated newFollowingState
         FROM Lists l
         LEFT JOIN Users u ON l.user_id = u.id
         LEFT JOIN (SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id) lc ON l.id = lc.list_id
         WHERE l.id = $1
       `;
      const updatedListResult = await client.query(updatedListQuery, [id, userId, newFollowingState]);
      const updatedList = updatedListResult.rows[0];
      if (!updatedList) throw new Error('Failed to retrieve updated list details after follow toggle.');

      // Commit transaction
      await client.query('COMMIT');
      console.log(`[LISTS POST /:id/follow] Transaction committed for list ${id}, user ${userId}.`);

      // Format and send response
      const response = {
        ...updatedList,
        city: updatedList.city_name,
        is_following: updatedList.is_following ?? false,
        is_public: updatedList.is_public ?? true,
        created_by_user: updatedList.created_by_user ?? false,
        tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
        item_count: updatedList.item_count || 0,
      };
      res.json(response);
    } catch (err) {
      // Rollback transaction on error
      if (client) {
        try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
      }
      console.error(`[LISTS POST /:id/follow] Error toggling follow for list ${id}:`, err);
       // Handle specific known errors (like 404, 400)
       if (err.status) {
            return res.status(err.status).json({ error: err.message });
       }
       // Pass other errors to general handler
       next(err);
    } finally {
        // ALWAYS release client
        if (client) {
            client.release();
            console.log(`[LISTS POST /:id/follow] Database client released for list ${id}, user ${userId}.`);
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
    console.log(`[LISTS PUT /:id/visibility] Updating visibility for list ${id} to ${is_public} by user ${userId}`);
    try {
      // Update the list and return the updated row
      const updateQuery = `
        UPDATE Lists
        SET is_public = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3 -- Ensure user owns the list
        RETURNING *
      `;
      const result = await db.query(updateQuery, [is_public, id, userId]);

      // Check if the update was successful (row returned?)
      if (result.rows.length === 0) {
        // Check if list exists at all
        const checkExists = await db.query(`SELECT user_id FROM Lists WHERE id = $1`, [id]);
        if (checkExists.rows.length === 0) {
          return res.status(404).json({ error: 'List not found.' });
        } else {
          // List exists but user doesn't own it
          return res.status(403).json({ error: 'Forbidden: You do not own this list.' });
        }
      }
      console.log(`[LISTS PUT /:id/visibility] Visibility updated for list ${id}.`);

      // Fetch additional details needed for consistent response format
      const updatedList = result.rows[0];
      const listItemsCountResult = await db.query( `SELECT COUNT(*) as count FROM ListItems WHERE list_id = $1`, [id] );
      // We don't necessarily need follow status here, but include for consistency if needed by UI?
      // const followCheck = await db.query( `SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2`, [id, userId] );

      // Format and send response
      const response = {
        ...updatedList,
        city: updatedList.city_name,
        is_following: false, // Visibility change doesn't affect follow status itself
        is_public: updatedList.is_public ?? true,
        created_by_user: true, // We confirmed user ownership above
        item_count: parseInt(listItemsCountResult.rows[0].count, 10) || 0,
        tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
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
    console.log(`[LISTS POST /:id/items] Adding item ${item_type}:${item_id} to list ${listId} by user ${userId}`);
    let client; // For transaction
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      // Check if list exists and user owns it
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [listId]); // Lock row
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
        // Allow adding to lists they follow? Current logic only allows adding to own lists.
        // For now, restrict to owner:
         throw { status: 403, message: 'Forbidden: You can only add items to your own lists.' };
      }

      // Check if item exists
      const itemTable = item_type === 'dish' ? 'Dishes' : 'Restaurants';
      const itemCheck = await client.query(`SELECT id FROM ${itemTable} WHERE id = $1`, [item_id]);
      if (itemCheck.rows.length === 0) {
        throw { status: 404, message: `Item (${item_type}) with ID ${item_id} not found.` };
      }

      // Insert into ListItems, ignore if already exists
      const insertQuery = `
        INSERT INTO ListItems (list_id, item_type, item_id, added_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (list_id, item_type, item_id) DO NOTHING -- Important: prevent duplicates
        RETURNING id, item_type, item_id, added_at
      `;
      const result = await client.query(insertQuery, [listId, item_type, item_id]);

      // Update the list's updated_at timestamp
      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);

      await client.query('COMMIT');
      console.log(`[LISTS POST /:id/items] Transaction committed for list ${listId}.`);

      if (result.rows.length > 0) {
        // If RETURNING returned a row, it means insertion happened
        console.log(`[LISTS POST /:id/items] Item added to list ${listId}. New List Item:`, result.rows[0]);
        res.status(201).json({ ...result.rows[0], message: 'Item added to list.' });
      } else {
        // If no rows returned, it means conflict occurred (item already exists)
        console.log(`[LISTS POST /:id/items] Item ${item_type}:${item_id} already exists in list ${listId}.`);
        res.status(200).json({ message: 'Item already exists in the list.' });
      }
    } catch (err) {
      // Rollback transaction on error
      if (client) {
         try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
      }
      console.error(`[LISTS POST /:id/items] Error adding item to list ${listId}:`, err);
       // Handle specific known errors
       if (err.status) {
            return res.status(err.status).json({ error: err.message });
       }
       // Pass other errors to general handler
       next(err);
    } finally {
        // ALWAYS release client
        if (client) {
            client.release();
            console.log(`[LISTS POST /:id/items] Database client released for list ${listId}.`);
        }
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
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });
    console.log(`[LISTS DELETE /:id/items/:listItemId] Removing list item ${listItemId} from list ${listId} by user ${userId}`);
    let client; // For transaction
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      // Check if list exists and user owns it
      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1 FOR UPDATE`, [listId]); // Lock row
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
         // Restrict to owner:
         throw { status: 403, message: 'Forbidden: You can only remove items from your own lists.' };
      }

      // Delete the specific list item
      const deleteQuery = `DELETE FROM ListItems WHERE id = $1 AND list_id = $2 RETURNING id`;
      const result = await client.query(deleteQuery, [listItemId, listId]);
      if (result.rows.length === 0) {
        // Item didn't exist or didn't belong to this list
        throw { status: 404, message: `List item ID ${listItemId} not found in list ${listId}.` };
      }

      // Update the list's updated_at timestamp
      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);

      await client.query('COMMIT');
      console.log(`[LISTS DELETE /:id/items/:listItemId] Transaction committed for list ${listId}.`);
      console.log(`[LISTS DELETE /:id/items/:listItemId] List item ${listItemId} removed successfully from list ${listId}.`);

      res.status(204).send(); // Send No Content on successful deletion
    } catch (err) {
       // Rollback transaction on error
      if (client) {
        try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
      }
      console.error(`[LISTS DELETE /:id/items/:listItemId] Error removing item from list ${listId}:`, err);
       // Handle specific known errors
       if (err.status) {
            return res.status(err.status).json({ error: err.message });
       }
       // Pass other errors to general handler
       next(err);
    } finally {
       // ALWAYS release client
       if (client) {
           client.release();
            console.log(`[LISTS DELETE /:id/items/:listItemId] Database client released for list ${listId}.`);
       }
    }
  }
);


module.exports = router;