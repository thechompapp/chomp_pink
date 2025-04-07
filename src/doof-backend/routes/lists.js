import express from 'express';
import { check, validationResult } from 'express-validator';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';

const router = express.Router();

// GET /api/lists - Fetch lists (e.g., created or followed by user)
router.get('/', authMiddleware, async (req, res, next) => {
    const { createdByUser, followedByUser } = req.query;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        let query = `
            SELECT l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
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

        const result = await currentDb.query(query, params);
        const lists = result.rows.map(list => ({
            id: list.id,
            name: list.name,
            description: list.description,
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

// POST /api/lists - Create a new list
router.post('/', authMiddleware, [
    check('name').trim().notEmpty().withMessage('List name is required'),
    check('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, city_name, tags, is_public = true, type = 'mixed' } = req.body;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        const query = `
            INSERT INTO lists (name, description, city_name, tags, is_public, user_id, creator_handle, type)
            VALUES ($1, $2, $3, $4, $5, $6, (SELECT handle FROM users WHERE id = $6), $7)
            RETURNING *
        `;
        const result = await currentDb.query(query, [name, description, city_name, tags, is_public, userId, type]);
        const newList = result.rows[0];
        res.status(201).json({
            id: newList.id,
            name: newList.name,
            description: newList.description,
            city: newList.city_name,
            tags: Array.isArray(newList.tags) ? newList.tags : [],
            is_public: newList.is_public,
            user_id: newList.user_id,
            creator_handle: newList.creator_handle,
            type: newList.type,
        });
    } catch (err) {
        console.error('[LISTS POST /] Error:', err);
        next(err);
    }
});

// GET /api/lists/:id - Fetch a single list with its items, including item details
router.get('/:id', authMiddleware, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        const listQuery = `
            SELECT l.*,
                   COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
                   EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $2) as is_following,
                   (l.user_id = $2) as created_by_user
            FROM lists l
            WHERE l.id = $1
        `;
        const listResult = await currentDb.query(listQuery, [listId, userId]);
        if (listResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        const list = listResult.rows[0];

        // Fetch items with names and additional details by joining with restaurants and dishes
        const itemsQuery = `
            SELECT 
                li.id, li.item_id, li.item_type, li.added_at,
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
                END AS neighborhood
            FROM listitems li
            LEFT JOIN restaurants r ON li.item_id = r.id AND li.item_type = 'restaurant'
            LEFT JOIN dishes d ON li.item_id = d.id AND li.item_type = 'dish'
            LEFT JOIN restaurants dr ON d.restaurant_id = dr.id AND li.item_type = 'dish'
            WHERE li.list_id = $1
            ORDER BY li.added_at DESC
        `;
        const itemsResult = await currentDb.query(itemsQuery, [listId]);
        const items = itemsResult.rows;

        res.json({
            id: list.id,
            name: list.name,
            description: list.description,
            saved_count: list.saved_count || 0,
            item_count: list.item_count,
            city: list.city_name,
            tags: Array.isArray(list.tags) ? list.tags : [],
            is_public: list.is_public,
            is_following: list.is_following,
            created_by_user: list.created_by_user,
            user_id: list.user_id,
            creator_handle: list.creator_handle,
            items: items,
        });
    } catch (err) {
        console.error('[LISTS GET /:id] Error:', err);
        next(err);
    }
});

// PUT /api/lists/:id - Update a list
router.put('/:id', authMiddleware, [
    check('name').optional().trim().notEmpty().withMessage('Name cannot be empty if provided'),
    check('description').optional().trim().isString().withMessage('Description must be a string'),
    check('is_public').optional().isBoolean().withMessage('is_public must be a boolean'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const listId = req.params.id;
    const userId = req.user.id;
    const { name, description, is_public } = req.body;
    const currentDb = req.app?.get('db') || db;

    try {
        const checkQuery = 'SELECT user_id FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this list' });
        }

        const updates = [];
        const params = [listId];
        let paramIndex = 2;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex}`);
            params.push(name);
            paramIndex++;
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            params.push(description);
            paramIndex++;
        }
        if (is_public !== undefined) {
            updates.push(`is_public = $${paramIndex}`);
            params.push(is_public);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const query = `
            UPDATE lists
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await currentDb.query(query, params);
        const updatedList = result.rows[0];

        res.json({
            id: updatedList.id,
            name: updatedList.name,
            description: updatedList.description,
            city: updatedList.city_name,
            tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
            is_public: updatedList.is_public,
            user_id: updatedList.user_id,
            creator_handle: updatedList.creator_handle,
        });
    } catch (err) {
        console.error('[LISTS PUT /:id] Error:', err);
        next(err);
    }
});

// POST /api/lists/:id/items - Add an item to a list
router.post('/:id/items', authMiddleware, [
    check('item_id').isInt().withMessage('Item ID must be an integer'),
    check('item_type').isIn(['restaurant', 'dish']).withMessage('Item type must be "restaurant" or "dish"'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const listId = req.params.id;
    const { item_id, item_type } = req.body;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        const checkQuery = 'SELECT user_id FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to modify this list' });
        }

        const query = `
            INSERT INTO listitems (list_id, item_id, item_type)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING *
        `;
        const result = await currentDb.query(query, [listId, item_id, item_type]);
        if (result.rows.length === 0) {
            return res.status(409).json({ error: 'Item already exists in list' });
        }
        res.status(201).json({ message: 'Item added successfully', item: result.rows[0] });
    } catch (err) {
        console.error('[LISTS POST /:id/items] Error:', err);
        next(err);
    }
});

// DELETE /api/lists/:id/items/:listItemId - Remove an item from a list
router.delete('/:id/items/:listItemId', authMiddleware, async (req, res, next) => {
    const listId = req.params.id;
    const listItemId = req.params.listItemId;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        const checkQuery = 'SELECT user_id FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to modify this list' });
        }

        const query = 'DELETE FROM listitems WHERE id = $1 AND list_id = $2';
        const result = await currentDb.query(query, [listItemId, listId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found in list' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('[LISTS DELETE /:id/items/:listItemId] Error:', err);
        next(err);
    }
});

// POST /api/lists/:id/follow - Follow or unfollow a list
router.post('/:id/follow', authMiddleware, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const currentDb = req.app?.get('db') || db;

    try {
        const checkQuery = 'SELECT 1 FROM lists WHERE id = $1 AND is_public = TRUE';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Public list not found' });
        }

        const followCheck = 'SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2';
        const followResult = await currentDb.query(followCheck, [listId, userId]);
        let isFollowing = followResult.rows.length > 0;

        if (isFollowing) {
            await currentDb.query('DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2', [listId, userId]);
            await currentDb.query('UPDATE lists SET saved_count = saved_count - 1 WHERE id = $1', [listId]);
            isFollowing = false;
        } else {
            await currentDb.query('INSERT INTO listfollows (list_id, user_id) VALUES ($1, $2)', [listId, userId]);
            await currentDb.query('UPDATE lists SET saved_count = saved_count + 1 WHERE id = $1', [listId]);
            isFollowing = true;
        }

        const updatedListQuery = `
            SELECT l.*, 
                   COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = l.id), 0)::INTEGER as item_count
            FROM lists l WHERE l.id = $1
        `;
        const updatedList = (await currentDb.query(updatedListQuery, [listId])).rows[0];

        res.json({
            id: updatedList.id,
            name: updatedList.name,
            description: updatedList.description,
            saved_count: updatedList.saved_count || 0,
            item_count: updatedList.item_count,
            city: updatedList.city_name,
            tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
            is_public: updatedList.is_public,
            is_following: isFollowing,
            created_by_user: updatedList.user_id === userId,
            user_id: updatedList.user_id,
            creator_handle: updatedList.creator_handle,
        });
    } catch (err) {
        console.error('[LISTS POST /:id/follow] Error:', err);
        next(err);
    }
});

// PUT /api/lists/:id/visibility - Update list visibility
router.put('/:id/visibility', authMiddleware, [
    check('is_public').isBoolean().withMessage('is_public must be a boolean'),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const listId = req.params.id;
    const userId = req.user.id;
    const { is_public } = req.body;
    const currentDb = req.app?.get('db') || db;

    try {
        const checkQuery = 'SELECT user_id FROM lists WHERE id = $1';
        const checkResult = await currentDb.query(checkQuery, [listId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (checkResult.rows[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized to modify this list' });
        }

        const query = `
            UPDATE lists
            SET is_public = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await currentDb.query(query, [listId, is_public]);
        const updatedList = result.rows[0];

        res.json({
            id: updatedList.id,
            name: updatedList.name,
            description: updatedList.description,
            city: updatedList.city_name,
            tags: Array.isArray(updatedList.tags) ? updatedList.tags : [],
            is_public: updatedList.is_public,
            user_id: updatedList.user_id,
            creator_handle: updatedList.creator_handle,
        });
    } catch (err) {
        console.error('[LISTS PUT /:id/visibility] Error:', err);
        next(err);
    }
});

export default router;