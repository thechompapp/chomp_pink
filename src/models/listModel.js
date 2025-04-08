/* src/doof-backend/models/listModel.js */
import db from '../db/index.js';
import { queryClient } from '@/queryClient'; // Assuming accessible for potential server-side cache invalidation if needed

// --- Helper Functions ---
const formatListForResponse = (list) => {
    if (!list) return null;
    return {
        ...list,
        id: parseInt(list.id, 10), // Ensure ID is number
        user_id: list.user_id ? parseInt(list.user_id, 10) : null,
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: list.is_public ?? true,
        is_following: !!list.is_following, // Ensure boolean
        created_by_user: !!list.created_by_user, // Ensure boolean
        item_count: list.item_count != null ? parseInt(list.item_count, 10) : 0,
        saved_count: list.saved_count != null ? parseInt(list.saved_count, 10) : 0,
        type: list.list_type || 'mixed', // Use list_type from DB
    };
};

const formatListItemForResponse = (item) => {
    if (!item) return null;
    return {
        ...item,
        list_item_id: parseInt(item.list_item_id, 10), // Ensure IDs are numbers
        id: parseInt(item.item_id, 10),
        item_id: parseInt(item.item_id, 10), // Keep item_id as well if needed elsewhere
        tags: Array.isArray(item.tags) ? item.tags : [],
    };
};

// --- Core Model Functions ---

export const findListsByUser = async (userId, { createdByUser, followedByUser }) => {
    console.log(`[ListModel] Finding lists for user ${userId}, created: ${createdByUser}, followed: ${followedByUser}`);
    let queryText = `
        SELECT
            l.*,
            COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
            CASE WHEN $1::INTEGER IS NOT NULL THEN EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1::INTEGER) ELSE FALSE END as is_following,
            CASE WHEN $1::INTEGER IS NOT NULL THEN (l.user_id = $1::INTEGER) ELSE FALSE END as created_by_user
        FROM Lists l
    `;
    const params = [userId];
    let conditionIndex = 2;
    let conditions = [];

    if (createdByUser) {
        conditions.push(`l.user_id = $${conditionIndex++}`);
        params.push(userId);
    } else if (followedByUser) {
        queryText += ` JOIN listfollows lf ON l.id = lf.list_id `;
        conditions.push(`lf.user_id = $${conditionIndex++}`);
        params.push(userId);
    } else {
        // Default to created if no specific filter is true
        conditions.push(`l.user_id = $${conditionIndex++}`);
        params.push(userId);
    }

    if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY l.updated_at DESC, l.created_at DESC';

    console.log("[ListModel] Executing query:", queryText, params);
    const result = await db.query(queryText, params);
    return (result.rows || []).map(formatListForResponse);
};

export const findListById = async (listId) => {
    console.log(`[ListModel] Finding list by ID: ${listId}`);
    const query = `
        SELECT l.*, u.username as creator_handle
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        WHERE l.id = $1
    `;
    const result = await db.query(query, [listId]);
    return result.rows[0]; // Return raw list data or undefined
};

export const findListItemsByListId = async (listId) => {
    console.log(`[ListModel] Finding items for list ID: ${listId}`);
    const query = `
        SELECT
            li.id as list_item_id, li.item_id, li.item_type, li.added_at,
            CASE
                WHEN li.item_type = 'restaurant' THEN r.name
                WHEN li.item_type = 'dish' THEN d.name
            END as name,
            CASE
                 WHEN li.item_type = 'dish' THEN r_dish.name
            END as restaurant_name,
            CASE
                WHEN li.item_type = 'restaurant' THEN r.city_name
                WHEN li.item_type = 'dish' THEN r_dish.city_name
            END as city,
            CASE
                WHEN li.item_type = 'restaurant' THEN r.neighborhood_name
                WHEN li.item_type = 'dish' THEN r_dish.neighborhood_name
            END as neighborhood,
            COALESCE(
                 CASE
                     WHEN li.item_type = 'restaurant' THEN (SELECT ARRAY_AGG(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = li.item_id)
                     WHEN li.item_type = 'dish' THEN (SELECT ARRAY_AGG(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = li.item_id)
                 END,
                 ARRAY[]::TEXT[]
             ) as tags
        FROM ListItems li
        LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
        LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC;
    `;
    const result = await db.query(query, [listId]);
    return (result.rows || []).map(formatListItemForResponse);
};

export const createList = async (listData, userId, userHandle) => {
    console.log(`[ListModel] Creating list for user ${userId} (${userHandle})`, listData);
    const { name, description, is_public = true, list_type = 'mixed', tags = [], city_name = null } = listData;
    const query = `
        INSERT INTO Lists (name, description, is_public, list_type, tags, user_id, creator_handle, city_name, updated_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
    `;
    const cleanTags = Array.isArray(tags) ? tags.map(String) : [];
    const result = await db.query(query, [name, description, is_public, list_type, cleanTags, userId, userHandle, city_name]);
    return formatListForResponse(result.rows[0]);
};

export const updateList = async (listId, listData) => {
    console.log(`[ListModel] Updating list ID: ${listId}`, listData);
    const { name, description, is_public, list_type, tags, city_name } = listData;
    // Build query dynamically based on provided fields
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description); }
    if (is_public !== undefined) { fields.push(`is_public = $${paramIndex++}`); values.push(is_public); }
    if (list_type !== undefined) { fields.push(`list_type = $${paramIndex++}`); values.push(list_type); }
    if (tags !== undefined) { fields.push(`tags = $${paramIndex++}`); values.push(Array.isArray(tags) ? tags.map(String) : []); }
    if (city_name !== undefined) { fields.push(`city_name = $${paramIndex++}`); values.push(city_name); }

    if (fields.length === 0) {
        console.warn(`[ListModel Update] No fields provided for update on list ${listId}`);
        // Optionally fetch and return current data, or throw error
        const currentList = await findListById(listId);
        return formatListForResponse(currentList);
    }

    fields.push(`updated_at = NOW()`); // Always update timestamp

    const query = `
        UPDATE Lists
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *;
    `;
    values.push(listId);

    const result = await db.query(query, values);
    return formatListForResponse(result.rows[0]);
};

export const addItemToList = async (listId, itemId, itemType) => {
    console.log(`[ListModel] Adding item ${itemType}:${itemId} to list ${listId}`);
    const checkQuery = 'SELECT id FROM listitems WHERE list_id = $1 AND item_type = $2 AND item_id = $3';
    const checkResult = await db.query(checkQuery, [listId, itemType, itemId]);
    if (checkResult.rows.length > 0) {
        const error = new Error("Item already exists in list.");
        error.status = 409; // Conflict
        throw error;
    }
    const query = `
        INSERT INTO ListItems (list_id, item_id, item_type, added_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
    `;
    const result = await db.query(query, [listId, itemId, itemType]);
    // Update list updated_at timestamp
    await db.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [listId]);
    return result.rows[0];
};

export const removeItemFromList = async (listId, listItemId) => {
    console.log(`[ListModel] Removing list item ID: ${listItemId} from list ${listId}`);
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const deleteQuery = 'DELETE FROM ListItems WHERE id = $1 AND list_id = $2 RETURNING id';
        const deleteResult = await client.query(deleteQuery, [listItemId, listId]);
        if (deleteResult.rowCount > 0) {
            await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [listId]);
        }
        await client.query('COMMIT');
        return deleteResult.rowCount > 0; // Return true if deleted
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[ListModel removeItemFromList] Error:', err);
        throw err; // Re-throw original error
    } finally {
        client.release();
    }
};

export const isFollowing = async (listId, userId) => {
    console.log(`[ListModel] Checking follow status for list ${listId}, user ${userId}`);
    const query = 'SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2';
    const result = await db.query(query, [listId, userId]);
    return result.rows.length > 0;
};

export const followList = async (listId, userId) => {
    console.log(`[ListModel] User ${userId} following list ${listId}`);
    const query = 'INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, NOW()) ON CONFLICT (list_id, user_id) DO NOTHING';
    await db.query(query, [listId, userId]);
    return true;
};

export const unfollowList = async (listId, userId) => {
    console.log(`[ListModel] User ${userId} unfollowing list ${listId}`);
    const query = 'DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2';
    const result = await db.query(query, [listId, userId]);
    return result.rowCount > 0;
};

export const updateListSavedCount = async (listId, change) => {
    console.log(`[ListModel] Updating saved_count for list ${listId} by ${change}`);
    if (change !== 1 && change !== -1) {
        console.warn(`[ListModel] Invalid saved_count change value: ${change}`);
        return 0;
    }
    const query = `
        UPDATE lists
        SET saved_count = GREATEST(0, saved_count + $1)
        WHERE id = $2
        RETURNING saved_count;
    `;
    const result = await db.query(query, [change, listId]);
    if (result.rows.length === 0) {
        console.warn(`[ListModel] List not found when updating saved_count: ${listId}`);
        return 0;
    }
    return result.rows[0].saved_count;
};

export const updateListVisibility = async (listId, isPublic) => {
    console.log(`[ListModel] Updating visibility for list ID: ${listId} to ${isPublic}`);
    const query = 'UPDATE Lists SET is_public = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    const result = await db.query(query, [isPublic, listId]);
    return formatListForResponse(result.rows[0]);
};

export const checkListTypeCompatibility = async (listId, itemTypeToAdd) => {
    console.log(`[ListModel] Checking compatibility for list ${listId} with item type ${itemTypeToAdd}`);
    if (!listId || !itemTypeToAdd) return true;

    const list = await findListById(listId);
    if (!list) return false;

    const listType = list.list_type || 'mixed';

    if (listType === 'mixed') return true;
    if (listType === 'restaurant' && itemTypeToAdd === 'restaurant') return true;
    if (listType === 'dish' && itemTypeToAdd === 'dish') return true;

    console.log(`[ListModel] Incompatibility: List type ${listType}, Item type ${itemTypeToAdd}`);
    return false;
};

export const deleteList = async (listId) => {
    console.log(`[ListModel] Deleting list ID: ${listId}`);
    // Cascading deletes should handle ListItems and ListFollows due to schema setup
    const query = 'DELETE FROM Lists WHERE id = $1 RETURNING id';
    const result = await db.query(query, [listId]);
    return result.rowCount > 0;
};