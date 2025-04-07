// src/doof-backend/routes/lists.js
import express from 'express';
import { check, validationResult, param } from 'express-validator'; // Added param
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';

const router = express.Router();

// Middleware for handling validation results
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("[Lists Route Validation Error]", req.path, errors.array());
      return res.status(400).json({ error: errors.array()[0].msg }); // Return only the first error message
    }
    next();
};

// --- GET /api/lists ---
// Fetch lists (e.g., created or followed by user)
router.get('/', authMiddleware, async (req, res, next) => {
    const { createdByUser, followedByUser } = req.query;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        // Added list_type to the SELECT statement
        let query = `
            SELECT l.id, l.name, l.description, l.list_type, l.saved_count, l.city_name, l.tags, l.is_public,
                   l.user_id, l.creator_handle, l.created_at, l.updated_at,
                   COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
                   EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1) as is_following,
                   (l.user_id = $1) as created_by_user
            FROM lists l
        `;
        const conditions = [];
        const params = [userId];

        if (createdByUser === 'true') {
            conditions.push('l.user_id = $1');
        }
        if (followedByUser === 'true') {
            conditions.push('EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1)');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        // Add ordering, e.g., by update time
        query += ' ORDER BY l.updated_at DESC';

        const result = await currentDb.query(query, params);
        const lists = result.rows.map(list => ({
            id: list.id,
            name: list.name,
            description: list.description,
            type: list.list_type || 'mixed', // Use list_type, default to mixed
            saved_count: list.saved_count || 0,
            item_count: list.item_count || 0,
            city: list.city_name,
            tags: Array.isArray(list.tags) ? list.tags : [],
            is_public: list.is_public,
            is_following: list.is_following,
            created_by_user: list.created_by_user,
            user_id: list.user_id,
            creator_handle: list.creator_handle,
        }));

        res.json(lists);
    } catch (err) {
        console.error('[LISTS GET /] Error:', err);
        next(err);
    }
});

// --- POST /api/lists ---
// Create a new list
router.post('/', authMiddleware, [
    check('name').trim().notEmpty().withMessage('List name is required'),
    check('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
    check('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'), // Validate list_type
], handleValidationErrors, // Use combined handler
async (req, res, next) => {
    const { name, description, city_name, tags, is_public = true, list_type = 'mixed' } = req.body; // Use list_type from body, default mixed
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        // Get user handle first
        const userHandleRes = await currentDb.query('SELECT username FROM users WHERE id = $1', [userId]);
        if (userHandleRes.rows.length === 0) {
             return res.status(404).json({ error: 'User not found' });
        }
        const userHandle = userHandleRes.rows[0].username;

        const query = `
            INSERT INTO lists (name, description, city_name, tags, is_public, user_id, creator_handle, list_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        // Ensure tags is an array
        const cleanTags = Array.isArray(tags) ? tags : [];
        const result = await currentDb.query(query, [name, description || null, city_name || null, cleanTags, is_public, userId, userHandle, list_type]);
        const newList = result.rows[0];
        res.status(201).json({
            id: newList.id,
            name: newList.name,
            description: newList.description,
            type: newList.list_type || 'mixed', // Return list_type
            city: newList.city_name,
            tags: Array.isArray(newList.tags) ? newList.tags : [],
            is_public: newList.is_public,
            user_id: newList.user_id,
            creator_handle: newList.creator_handle,
            item_count: 0, // New list has 0 items initially
            saved_count: 0, // New list has 0 saves initially
        });
    } catch (err) {
        console.error('[LISTS POST /] Error:', err);
        next(err);
    }
});

// --- GET /api/lists/:id ---
// Fetch a single list with its items, including item details
router.get('/:id', [ // Use validation array
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer')
], handleValidationErrors, // Use combined handler
optionalAuthMiddleware, // Use optional auth to allow public view
async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user?.id; // User ID might be undefined if optional auth fails/no token
    const currentDb = req.app?.get('db') || db;

    try {
        const listQuery = `
            SELECT l.*,
                   COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
                   CASE WHEN $2::INTEGER IS NOT NULL THEN
                       EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $2::INTEGER)
                   ELSE FALSE
                   END as is_following,
                    CASE WHEN $2::INTEGER IS NOT NULL THEN
                       (l.user_id = $2::INTEGER)
                   ELSE FALSE
                   END as created_by_user
            FROM lists l
            WHERE l.id = $1
        `;
        const listResult = await currentDb.query(listQuery, [listId, userId]); // Pass userId (or null)
        if (listResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        const list = listResult.rows[0];

        // If list is private and user is not the owner, deny access
        if (!list.is_public && list.user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to view this private list.' });
        }

        // Fetch items with names and additional details by joining with restaurants and dishes
        const itemsQuery = `
            SELECT
                li.id as list_item_id, -- Alias li.id to avoid conflict with item's id
                li.item_id, li.item_type, li.added_at,
                CASE
                    WHEN li.item_type = 'restaurant' THEN r.name
                    WHEN li.item_type = 'dish' THEN d.name
                    ELSE NULL
                END AS name,
                CASE
                    WHEN li.item_type = 'dish' THEN dr.name
                    ELSE NULL
                END AS restaurant_name,
                CASE
                    WHEN li.item_type = 'restaurant' THEN r.city_name
                    WHEN li.item_type = 'dish' THEN dr.city_name
                    ELSE NULL
                END AS city,
                CASE
                    WHEN li.item_type = 'restaurant' THEN r.neighborhood_name
                    WHEN li.item_type = 'dish' THEN dr.neighborhood_name
                    ELSE NULL
                END AS neighborhood,
                -- Include tags for each item
                CASE
                    WHEN li.item_type = 'restaurant' THEN COALESCE((SELECT ARRAY_AGG(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = r.id), ARRAY[]::TEXT[])
                    WHEN li.item_type = 'dish' THEN COALESCE((SELECT ARRAY_AGG(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = d.id), ARRAY[]::TEXT[])
                    ELSE ARRAY[]::TEXT[]
                END as tags
            FROM listitems li
            LEFT JOIN restaurants r ON li.item_id = r.id AND li.item_type = 'restaurant'
            LEFT JOIN dishes d ON li.item_id = d.id AND li.item_type = 'dish'
            LEFT JOIN restaurants dr ON d.restaurant_id = dr.id AND li.item_type = 'dish'
            WHERE li.list_id = $1
            ORDER BY li.added_at DESC
        `;
        const itemsResult = await currentDb.query(itemsQuery, [listId]);
        // Map items ensuring tags is always an array and list_item_id is correct
        const items = (itemsResult.rows || []).map(item => ({
            ...item,
            id: item.item_id, // Ensure primary id is the item's id
            tags: Array.isArray(item.tags) ? item.tags : []
        }));

        res.json({
            id: list.id,
            name: list.name,
            description: list.description,
            type: list.list_type || 'mixed', // Include list_type
            saved_count: list.saved_count || 0,
            item_count: list.item_count,
            city: list.city_name, // Map city_name for consistency
            tags: Array.isArray(list.tags) ? list.tags : [],
            is_public: list.is_public,
            is_following: list.is_following,
            created_by_user: list.created_by_user,
            user_id: list.user_id,
            creator_handle: list.creator_handle,
            items: items,
        });
    } catch (err) {
        console.error(`[LISTS GET /:id ${listId}] Error:`, err);
        next(err);
    }
});


// --- PUT /api/lists/:id ---
// Update list details (name, description, is_public, list_type, tags)
router.put('/:id', authMiddleware, [
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer'),
    check('name').optional().trim().notEmpty().withMessage('Name cannot be empty if provided'),
    check('description').optional({ nullable: true }).isString().withMessage('Description must be a string'),
    check('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
    check('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'),
    check('tags').optional({ nullable: true }).isArray().withMessage('Tags must be an array'),
    check('tags.*').optional().isString().trim().notEmpty().withMessage('Tags must be non-empty strings'),
], handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const { name, description, is_public, list_type, tags } = req.body;
    const currentDb = req.app?.get('db') || db;

    try {
        // Check ownership
        const checkQuery = 'SELECT user_id, list_type FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        const currentList = checkResult.rows[0];
        if (currentList.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this list' });
        }

        // Prevent changing type if list already has items incompatible with the new type
        if (list_type && list_type !== 'mixed' && list_type !== currentList.list_type) {
            const incompatibleItemsCheck = await currentDb.query(
                'SELECT 1 FROM listitems WHERE list_id = $1 AND item_type != $2 LIMIT 1',
                [listId, list_type] // If new type is 'dish', check for 'restaurant' items, etc.
            );
            if (incompatibleItemsCheck.rows.length > 0) {
                return res.status(400).json({ error: `Cannot change type to '${list_type}' because the list contains incompatible items.` });
            }
        }

        // Build update query dynamically
        const updates = [];
        const params = [listId];
        let paramIndex = 2;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(description); // Allow null description
        }
        if (is_public !== undefined) {
            updates.push(`is_public = $${paramIndex++}`);
            params.push(is_public);
        }
        if (list_type !== undefined) {
             updates.push(`list_type = $${paramIndex++}`);
             params.push(list_type);
         }
        if (tags !== undefined) {
             // Ensure tags is array, filter empty strings
             const cleanTags = (Array.isArray(tags) ? tags : []).map(t => String(t).trim()).filter(Boolean);
             updates.push(`tags = $${paramIndex++}`);
             params.push(cleanTags);
        }


        if (updates.length === 0) {
            // If no fields to update, maybe return current data? Or 304 Not Modified?
            // For simplicity, let's return current data with a specific message or status later if needed.
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        const query = `
            UPDATE lists
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await currentDb.query(query, params);
        const updatedList = result.rows[0];

        // Return comprehensive list details
        res.json({
            id: updatedList.id,
            name: updatedList.name,
            description: updatedList.description,
            type: updatedList.list_type || 'mixed',
            city: updatedList.city_name,
            tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
            is_public: updatedList.is_public,
            user_id: updatedList.user_id,
            creator_handle: updatedList.creator_handle,
            // Optionally re-fetch counts or return previous counts if acceptable
            item_count: currentList.item_count, // Assuming PUT doesn't change item count directly
            saved_count: updatedList.saved_count,
        });
    } catch (err) {
        console.error(`[LISTS PUT /:id ${listId}] Error:`, err);
        next(err);
    }
});

// --- POST /api/lists/:id/items ---
// Add an item to a list with type validation
router.post('/:id/items', authMiddleware, [
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer'),
    check('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer'),
    check('item_type').isIn(['restaurant', 'dish']).withMessage('Item type must be "restaurant" or "dish"'),
], handleValidationErrors, // Use combined handler
async (req, res, next) => {
    const listId = req.params.id;
    const { item_id, item_type } = req.body;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        // Check list existence and ownership, and get list_type
        const checkQuery = 'SELECT user_id, list_type FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        const listInfo = checkResult.rows[0];
        if (listInfo.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to modify this list' });
        }

        // *** Add List Type Validation ***
        if (listInfo.list_type !== 'mixed' && listInfo.list_type !== item_type) {
            return res.status(400).json({
                error: `Cannot add a ${item_type} to a list restricted to ${listInfo.list_type}s.`
            });
        }
        // *** End Validation ***

        // Proceed with insertion
        const query = `
            INSERT INTO listitems (list_id, item_id, item_type)
            VALUES ($1, $2, $3)
            ON CONFLICT (list_id, item_type, item_id) DO NOTHING -- Changed ON CONFLICT condition
            RETURNING *
        `;
        const result = await currentDb.query(query, [listId, item_id, item_type]);
        if (result.rows.length === 0) {
            // Check if it genuinely exists or if there was another issue
             const existsCheck = await currentDb.query(
                 'SELECT id FROM listitems WHERE list_id = $1 AND item_id = $2 AND item_type = $3',
                 [listId, item_id, item_type]
             );
             if (existsCheck.rows.length > 0) {
                 return res.status(409).json({ error: 'Item already exists in this list.' });
             } else {
                  // Should not happen with ON CONFLICT DO NOTHING, but include for safety
                 return res.status(500).json({ error: 'Failed to add item for an unknown reason.' });
             }
        }
        // Invalidate caches on success
        queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
        queryClient.invalidateQueries({ queryKey: ['userLists'] }); // General user lists might show counts

        res.status(201).json({ message: 'Item added successfully', item: result.rows[0] });
    } catch (err) {
        console.error(`[LISTS POST /:id ${listId}/items] Error:`, err);
        next(err);
    }
});

// --- DELETE /api/lists/:id/items/:listItemId ---
// Remove an item from a list
router.delete('/:id/items/:listItemId', authMiddleware, [
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer'),
    param('listItemId').isInt({ gt: 0 }).withMessage('List Item ID must be a positive integer'),
], handleValidationErrors, // Use combined handler
async (req, res, next) => {
    const listId = req.params.id;
    const listItemId = req.params.listItemId;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        // Check ownership
        const checkQuery = 'SELECT user_id FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to modify this list' });
        }

        // Perform deletion
        const query = 'DELETE FROM listitems WHERE id = $1 AND list_id = $2';
        const result = await currentDb.query(query, [listItemId, listId]);
        if (result.rowCount === 0) {
            // Item might not exist on this specific list or was already deleted
            return res.status(404).json({ error: 'Item not found in this list or already removed.' });
        }
         // Invalidate caches on success
        queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
        queryClient.invalidateQueries({ queryKey: ['userLists'] }); // General user lists might show counts

        res.status(204).send(); // Success, no content
    } catch (err) {
        console.error(`[LISTS DELETE /:id ${listId}/items/:listItemId ${listItemId}] Error:`, err);
        next(err);
    }
});


// --- POST /api/lists/:id/follow ---
// Follow or unfollow a list
router.post('/:id/follow', authMiddleware, [
     param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer')
 ], handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        // Check if list exists and is public (or if user owns it - maybe allow following own list?)
        // For now, only allow following public lists user doesn't own.
        const checkQuery = 'SELECT user_id, is_public FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        const listInfo = checkResult.rows[0];
        if (listInfo.user_id === userId) {
             return res.status(400).json({ error: "You cannot follow your own list." });
        }
        if (!listInfo.is_public) {
             return res.status(403).json({ error: "Cannot follow a private list." });
        }


        // Check current follow status within a transaction
        await currentDb.query('BEGIN');
        const followCheck = 'SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2 FOR UPDATE'; // Lock row
        const followResult = await currentDb.query(followCheck, [listId, userId]);
        let isFollowing = followResult.rows.length > 0;
        let savedCountChange = 0;

        if (isFollowing) {
            await currentDb.query('DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2', [listId, userId]);
            isFollowing = false;
            savedCountChange = -1;
        } else {
            await currentDb.query('INSERT INTO listfollows (list_id, user_id) VALUES ($1, $2)', [listId, userId]);
            isFollowing = true;
            savedCountChange = 1;
        }

        // Update saved_count, ensuring it doesn't go below zero
        const updateCountQuery = `
            UPDATE lists SET saved_count = GREATEST(0, saved_count + $2)
            WHERE id = $1
            RETURNING saved_count
        `;
        const countResult = await currentDb.query(updateCountQuery, [listId, savedCountChange]);
        await currentDb.query('COMMIT'); // Commit transaction

        const finalSavedCount = countResult.rows[0]?.saved_count ?? 0;

        // Invalidate relevant caches
        queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
        queryClient.invalidateQueries({ queryKey: ['userLists', 'followed'] }); // Specifically followed lists
        queryClient.invalidateQueries({ queryKey: ['trendingListsPage'] }); // Trending lists might use saved_count

        // Return updated list status
        res.json({
            id: parseInt(listId, 10), // Ensure ID is number
            is_following: isFollowing,
            saved_count: finalSavedCount
            // Include other list fields if necessary for frontend update, or rely on query invalidation
        });
    } catch (err) {
        await currentDb.query('ROLLBACK').catch(rbErr => console.error("Follow/Unfollow Rollback Error:", rbErr)); // Rollback on error
        console.error(`[LISTS POST /:id ${listId}/follow] Error:`, err);
        next(err);
    }
});

// --- PUT /api/lists/:id/visibility ---
// Update list visibility
router.put('/:id/visibility', authMiddleware, [
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer'),
    check('is_public').isBoolean().withMessage('is_public must be a boolean'),
], handleValidationErrors, // Use combined handler
async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const { is_public } = req.body;
    const currentDb = req.app?.get('db') || db;

    try {
        // Check ownership
        const checkQuery = 'SELECT user_id FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to modify this list' });
        }

        // Update visibility
        const query = `
            UPDATE lists
            SET is_public = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await currentDb.query(query, [listId, is_public]);
        const updatedList = result.rows[0];

        // Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
        queryClient.invalidateQueries({ queryKey: ['userLists'] });

        // Return only necessary info or full updated list
        res.json({
            id: updatedList.id,
            is_public: updatedList.is_public,
            // Optionally include other fields if needed immediately by frontend
             name: updatedList.name,
             type: updatedList.list_type || 'mixed',
        });
    } catch (err) {
        console.error(`[LISTS PUT /:id ${listId}/visibility] Error:`, err);
        next(err);
    }
});


export default router;