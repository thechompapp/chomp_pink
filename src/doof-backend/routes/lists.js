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
  authMiddleware, // Apply authentication middleware
  validateGetListsQuery,
  handleValidationErrors,
  // *** CORRECTED SYNTAX: Added => before the function body ***
  async (req, res, next) => {
    // *** Comment moved or removed for clarity ***
    console.log('[LISTS GET /] Handler entered. Query:', req.query);
    const { createdByUser, followedByUser } = req.query;
    const userId = req.user?.id;

    if (!userId) {
        console.error('[LISTS GET /] Error: User ID not found after auth middleware.');
        return res.status(401).json({ error: 'Authentication failed or user ID missing.' });
    }

    try {
      let queryText = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          (l.user_id = $1) as created_by_user,
          l.creator_handle, l.created_at, l.updated_at,
          COALESCE(lc.count, 0)::integer as item_count,
          EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1) as is_following
        FROM Lists l
        LEFT JOIN (
          SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id
        ) lc ON l.id = lc.list_id
      `;
      const queryParams = [userId];
      const conditions = [];

      if (createdByUser === 'true') {
        conditions.push(`l.user_id = $1`);
      } else if (followedByUser === 'true') {
         conditions.push(`EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1)`);
      } else {
          conditions.push(
             `(l.is_public = TRUE OR l.user_id = $1 OR EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1))`
           );
      }

      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }
      queryText += ` ORDER BY l.created_at DESC`;

      console.log('[LISTS GET /] Executing query:', queryText.substring(0, 300) + '...');
      console.log('[LISTS GET /] Query values:', queryParams);
      const result = await db.query(queryText, queryParams);
      console.log(`[LISTS GET /] Query successful, found ${result.rows.length} lists for user ${userId}.`);

      const lists = (result.rows || []).map((list) => ({
        ...list,
        city: list.city_name,
        is_following: list.is_following ?? false,
        is_public: list.is_public ?? true,
        created_by_user: list.created_by_user ?? false,
        tags: Array.isArray(list.tags) ? list.tags : [],
        item_count: list.item_count || 0,
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
  authMiddleware,
  validateListIdParam,
  handleValidationErrors,
  // *** CORRECTED SYNTAX: Added => ***
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id;
    console.log(`[LISTS GET /:id] Handler entered for ID: ${id}, UserID: ${userId}`);

    if (!userId) {
       return res.status(401).json({ error: 'Authentication required.' });
    }

    try {
      const listQuery = `
        SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          (l.user_id = $2) AS created_by_user,
          u.username AS creator_handle,
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

      if (!list.is_public && list.user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this private list.' });
      }

      const itemsQuery = `
        SELECT
          li.id as list_item_id, li.item_type, li.item_id, li.added_at,
          CASE
            WHEN li.item_type = 'dish' THEN d.name
            WHEN li.item_type = 'restaurant' THEN r.name
          END as name,
          CASE
            WHEN li.item_type = 'dish' THEN (SELECT r_sub.name FROM Restaurants r_sub WHERE r_sub.id = d.restaurant_id)
            ELSE NULL
          END as restaurant_name,
           CASE
             WHEN li.item_type = 'restaurant' THEN r.city_name
             WHEN li.item_type = 'dish' THEN (SELECT r_sub.city_name FROM Restaurants r_sub WHERE r_sub.id = d.restaurant_id)
           END as city,
           CASE
             WHEN li.item_type = 'restaurant' THEN r.neighborhood_name
             WHEN li.item_type = 'dish' THEN (SELECT r_sub.neighborhood_name FROM Restaurants r_sub WHERE r_sub.id = d.restaurant_id)
           END as neighborhood
        FROM ListItems li
        LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
        LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC
      `;
      const itemsResult = await db.query(itemsQuery, [id]);

      const response = {
        ...list,
        city: list.city_name,
        is_following: list.is_following ?? false,
        is_public: list.is_public ?? true,
        created_by_user: list.created_by_user ?? false,
        tags: Array.isArray(list.tags) ? list.tags : [],
        items: itemsResult.rows.map((item) => ({
          list_item_id: item.list_item_id,
          item_type: item.item_type,
          item_id: item.item_id,
          name: item.name,
          restaurant_name: item.restaurant_name,
          added_at: item.added_at,
          city: item.city,
          neighborhood: item.neighborhood,
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
  // *** CORRECTED SYNTAX: Added => ***
  async (req, res, next) => {
    console.log('[LISTS POST /] Handler entered.');
    const { name, description, city_name, tags, is_public } = req.body;
    const userId = req.user?.id;
     if (!userId) return res.status(401).json({ error: 'Authentication required.' });
     let creatorHandle = `@user_${userId}`;
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
      const publicFlag = is_public !== undefined ? is_public : true;
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

      const response = {
        ...newList,
        city: newList.city_name,
        is_following: false,
        is_public: newList.is_public ?? true,
        created_by_user: true,
        item_count: 0,
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
  // *** CORRECTED SYNTAX: Added => ***
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id;
     if (!userId) return res.status(401).json({ error: 'Authentication required.' });
    console.log(`[LISTS POST /:id/follow] Handler entered for ID: ${id}, UserID: ${userId}`);
    let client;
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1`, [id]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found' };
      }
       if (listCheck.rows[0].user_id === userId) {
            throw { status: 400, message: 'You cannot follow your own list.' };
       }

      const followQuery = `SELECT list_id FROM listfollows WHERE list_id = $1 AND user_id = $2`;
      const followResult = await client.query(followQuery, [id, userId]);
      const isCurrentlyFollowing = followResult.rows.length > 0;
      let newSavedCount, newFollowingState;

      if (isCurrentlyFollowing) {
        await client.query(`DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2`, [id, userId]);
        const updateCountResult = await client.query( `UPDATE Lists SET saved_count = GREATEST(0, saved_count - 1) WHERE id = $1 RETURNING saved_count`, [id] );
        newSavedCount = updateCountResult.rows[0]?.saved_count ?? 0;
        newFollowingState = false;
        console.log(`[LISTS POST /:id/follow] User ${userId} unfollowed list ${id}. New saved_count: ${newSavedCount}`);
      } else {
        await client.query( `INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`, [id, userId] );
        const updateCountResult = await client.query( `UPDATE Lists SET saved_count = saved_count + 1 WHERE id = $1 RETURNING saved_count`, [id] );
        newSavedCount = updateCountResult.rows[0]?.saved_count ?? 0;
        newFollowingState = true;
        console.log(`[LISTS POST /:id/follow] User ${userId} followed list ${id}. New saved_count: ${newSavedCount}`);
      }

       const updatedListQuery = `
         SELECT
           l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
           (l.user_id = $2) AS created_by_user,
           u.username AS creator_handle,
           l.created_at, l.updated_at,
           COALESCE(lc.count, 0)::integer as item_count,
           $3::boolean as is_following
         FROM Lists l
         LEFT JOIN Users u ON l.user_id = u.id
         LEFT JOIN (SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id) lc ON l.id = lc.list_id
         WHERE l.id = $1
       `;
      const updatedListResult = await client.query(updatedListQuery, [id, userId, newFollowingState]);
      const updatedList = updatedListResult.rows[0];
      if (!updatedList) throw new Error('Failed to retrieve updated list details after follow toggle.');

      await client.query('COMMIT');
      await client.release();

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
      if (client) {
        try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
        if (client.release) await client.release(); // Ensure release happens
      }
      console.error(`[LISTS POST /:id/follow] Error toggling follow for list ${id}:`, err);
       if (err.status) {
            return res.status(err.status).json({ error: err.message });
       }
       next(err);
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
  // *** CORRECTED SYNTAX: Added => ***
  async (req, res, next) => {
    const { id } = req.params;
    const { is_public } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });
    console.log(`[LISTS PUT /:id/visibility] Updating visibility for list ${id} to ${is_public} by user ${userId}`);
    try {
      const updateQuery = `
        UPDATE Lists
        SET is_public = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `;
      const result = await db.query(updateQuery, [is_public, id, userId]);

      if (result.rows.length === 0) {
        const checkExists = await db.query(`SELECT user_id FROM Lists WHERE id = $1`, [id]);
        if (checkExists.rows.length === 0) {
          return res.status(404).json({ error: 'List not found.' });
        } else {
          return res.status(403).json({ error: 'Forbidden: You do not own this list.' });
        }
      }
      console.log(`[LISTS PUT /:id/visibility] Visibility updated for list ${id}.`);

      const updatedList = result.rows[0];
      const listItemsCountResult = await db.query( `SELECT COUNT(*) as count FROM ListItems WHERE list_id = $1`, [id] );
      const followCheck = await db.query( `SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2`, [id, userId] );

      const response = {
        ...updatedList,
        city: updatedList.city_name,
        is_following: followCheck.rows.length > 0,
        is_public: updatedList.is_public ?? true,
        created_by_user: updatedList.user_id === userId,
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
  // *** CORRECTED SYNTAX: Added => ***
  async (req, res, next) => {
    const { id: listId } = req.params;
    const { item_id, item_type } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });
    console.log(`[LISTS POST /:id/items] Adding item ${item_type}:${item_id} to list ${listId} by user ${userId}`);
    let client;
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
        throw { status: 403, message: 'Forbidden: You can only add items to your own lists.' };
      }

      const itemTable = item_type === 'dish' ? 'Dishes' : 'Restaurants';
      const itemCheck = await client.query(`SELECT id FROM ${itemTable} WHERE id = $1`, [item_id]);
      if (itemCheck.rows.length === 0) {
        throw { status: 404, message: `Item (${item_type}) with ID ${item_id} not found.` };
      }

      const insertQuery = `
        INSERT INTO ListItems (list_id, item_type, item_id, added_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (list_id, item_type, item_id) DO NOTHING
        RETURNING id, item_type, item_id, added_at
      `;
      const result = await client.query(insertQuery, [listId, item_type, item_id]);

      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);
      await client.query('COMMIT');
      await client.release();

      if (result.rows.length > 0) {
        console.log(`[LISTS POST /:id/items] Item added to list ${listId}. New List Item:`, result.rows[0]);
        res.status(201).json({ ...result.rows[0], message: 'Item added to list.' });
      } else {
        console.log(`[LISTS POST /:id/items] Item ${item_type}:${item_id} already exists in list ${listId}.`);
        res.status(200).json({ message: 'Item already exists in the list.' });
      }
    } catch (err) {
      if (client) {
         try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
        if (client.release) await client.release();
      }
      console.error(`[LISTS POST /:id/items] Error adding item to list ${listId}:`, err);
       if (err.status) {
            return res.status(err.status).json({ error: err.message });
       }
       next(err);
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
  // *** CORRECTED SYNTAX: Added => ***
  async (req, res, next) => {
    const { id: listId, listItemId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });
    console.log(`[LISTS DELETE /:id/items/:listItemId] Removing list item ${listItemId} from list ${listId} by user ${userId}`);
    let client;
    try {
      client = await db.getClient();
      await client.query('BEGIN');

      const listCheck = await client.query(`SELECT user_id FROM Lists WHERE id = $1`, [listId]);
      if (listCheck.rows.length === 0) {
        throw { status: 404, message: 'List not found.' };
      }
      if (listCheck.rows[0].user_id !== userId) {
        throw { status: 403, message: 'Forbidden: You can only remove items from your own lists.' };
      }

      const deleteQuery = `DELETE FROM ListItems WHERE id = $1 AND list_id = $2 RETURNING id`;
      const result = await client.query(deleteQuery, [listItemId, listId]);
      if (result.rows.length === 0) {
        throw { status: 404, message: `List item ID ${listItemId} not found in list ${listId}.` };
      }

      await client.query('UPDATE Lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [listId]);
      await client.query('COMMIT');
      await client.release();

      console.log(`[LISTS DELETE /:id/items/:listItemId] List item ${listItemId} removed successfully from list ${listId}.`);
      res.status(204).send();
    } catch (err) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
        if (client.release) await client.release();
      }
      console.error(`[LISTS DELETE /:id/items/:listItemId] Error removing item from list ${listId}:`, err);
       if (err.status) {
            return res.status(err.status).json({ error: err.message });
       }
       next(err);
    }
  }
);


module.exports = router;