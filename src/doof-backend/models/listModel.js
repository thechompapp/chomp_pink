/* src/doof-backend/models/listModel.js */
import db from '../db/index.js';

// Exported formatter function with improved null checks
export const formatListForResponse = (listRow) => {
    if (!listRow || listRow.id == null || typeof listRow.name !== 'string') {
        // console.warn('[ListModel Format Error] Invalid or incomplete list data received:', listRow);
        return null; // Return null if essential data is missing
    }
    try {
        const listType = listRow.list_type || listRow.type; // Use list_type preferentially
        // Ensure listType is one of the allowed values ('restaurant', 'dish')
        // The DB constraint should handle this, but double-check here.
        if (listType !== 'restaurant' && listType !== 'dish') {
             console.warn(`[ListModel Format Error] Invalid list_type '${listType}' read from DB for list ID ${listRow.id}. Returning null.`);
             return null; // Treat as error if type is invalid
        }

        const tagsArray = Array.isArray(listRow.tags)
            ? listRow.tags.filter((tag) => typeof tag === 'string' && tag !== null)
            : [];

        return {
            id: parseInt(String(listRow.id), 10),
            user_id: listRow.user_id ? parseInt(String(listRow.user_id), 10) : null,
            name: listRow.name, // Name is checked above
            description: listRow.description ?? null,
            tags: tagsArray,
            is_public: listRow.is_public ?? true,
            is_following: !!listRow.is_following, // Coerce to boolean
            created_by_user: !!listRow.created_by_user, // Coerce to boolean
            item_count: listRow.item_count != null ? parseInt(String(listRow.item_count), 10) : 0,
            saved_count: listRow.saved_count != null ? parseInt(String(listRow.saved_count), 10) : 0,
            type: listType, // Use derived type
            list_type: listType, // Keep both for compatibility if needed
            creator_handle: listRow.creator_handle ?? null,
            created_at: typeof listRow.created_at === 'string' ? listRow.created_at : listRow.created_at?.toISOString(),
            updated_at: typeof listRow.updated_at === 'string' ? listRow.updated_at : listRow.updated_at?.toISOString(),
            city_name: listRow.city_name ?? null,
            city: listRow.city_name ?? null, // Alias
        };
    } catch (e) {
        console.error(`[ListModel Format Error] Failed to format list row ID ${listRow.id}:`, listRow, e);
        return null; // Return null if formatting fails
    }
};

const formatListItemForResponse = (itemRow) => {
    if (!itemRow || itemRow.list_item_id == null || itemRow.item_id == null || !itemRow.item_type) {
        // console.warn('[ListModel Format Error] Invalid or incomplete list item data received:', itemRow);
        return null;
    }
    try {
        // Basic validation for item_type
        if (itemRow.item_type !== 'restaurant' && itemRow.item_type !== 'dish') {
            console.warn('[formatListItem] Invalid item_type found:', itemRow.item_type);
            return null;
        }

        const tagsArray = Array.isArray(itemRow.tags)
            ? itemRow.tags.filter((tag) => typeof tag === 'string' && tag !== null)
            : [];
        return {
            list_item_id: parseInt(String(itemRow.list_item_id), 10),
            id: parseInt(String(itemRow.item_id), 10), // Use item_id as primary ID for consistency
            item_id: parseInt(String(itemRow.item_id), 10), // Keep original field if needed
            item_type: itemRow.item_type, // Already validated
            added_at: typeof itemRow.added_at === 'string' ? itemRow.added_at : itemRow.added_at?.toISOString(),
            name: itemRow.name || `Item ${itemRow.item_id}`, // Default name
            restaurant_name: itemRow.restaurant_name ?? null,
            city: itemRow.city ?? null,
            neighborhood: itemRow.neighborhood ?? null,
            tags: tagsArray,
        };
    } catch (e) {
        console.error(`[ListModel Format Error] Failed to format list item row ID ${itemRow.list_item_id}:`, itemRow, e);
        return null;
    }
};

export const findListsByUser = async (userId, { createdByUser, followedByUser }) => {
    if (isNaN(userId) || userId <= 0) {
        console.warn(`[ListModel findListsByUser] Invalid userId: ${userId}`);
        return [];
    }
    // console.log(`[ListModel] Finding lists for user ${userId}, created: ${createdByUser}, followed: ${followedByUser}`); // Optional
    let queryText = `
        SELECT
            l.*,
            u.username as creator_handle,
            COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
            CASE WHEN $1::INTEGER IS NOT NULL THEN EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1::INTEGER) ELSE FALSE END as is_following,
            CASE WHEN $1::INTEGER IS NOT NULL THEN (l.user_id = $1::INTEGER) ELSE FALSE END as created_by_user
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
    `;
    const params = [userId];
    let conditionIndex = 2;
    let conditions = [];

    if (followedByUser === true) {
        queryText += ` JOIN listfollows lf_filter ON l.id = lf_filter.list_id `;
        conditions.push(`lf_filter.user_id = $${conditionIndex++}`);
        params.push(userId);
        if (createdByUser === false) {
            conditions.push(`l.user_id IS NULL OR l.user_id != $${conditionIndex++}`);
            params.push(userId);
        }
    } else if (createdByUser === true || createdByUser === undefined) {
        conditions.push(`l.user_id = $${conditionIndex++}`);
        params.push(userId);
    }

    // Filter out invalid types just in case (DB constraint should prevent this)
    conditions.push(`l.list_type IN ('restaurant', 'dish')`);

    if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY l.updated_at DESC, l.created_at DESC';

    // console.log("[ListModel findListsByUser] Executing query:", queryText.replace(/\s+/g, ' ').trim(), params); // Optional
    try {
        const result = await db.query(queryText, params);
        // console.log(`[ListModel findListsByUser] Query returned ${result.rowCount} rows.`); // Optional
        const formattedLists = (result.rows || []).map(formatListForResponse).filter((list) => list !== null);
        // console.log(`[ListModel findListsByUser] Formatted ${formattedLists.length} valid lists.`); // Optional
        return formattedLists;
    } catch (error) {
        console.error(`[ListModel findListsByUser] Error executing query for user ${userId}:`, error);
        throw new Error(`Database error fetching lists for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const findListById = async (listId) => {
    if (isNaN(listId) || listId <= 0) {
        console.warn(`[ListModel findListById] Invalid listId: ${listId}`);
        return undefined;
    }
    // console.log(`[ListModel] Finding list by ID: ${listId}`); // Optional
    const query = `
        SELECT l.*, u.username as creator_handle
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        WHERE l.id = $1 AND l.list_type IN ('restaurant', 'dish') -- Ensure valid type
    `;
    try {
        const result = await db.query(query, [listId]);
        return result.rows[0]; // Return raw row
    } catch (error) {
        console.error(`[ListModel findListById] Error fetching list ${listId}:`, error);
        throw error;
    }
};

export const findListItemsByListId = async (listId) => {
    if (isNaN(listId) || listId <= 0) {
        console.warn(`[ListModel findListItemsByListId] Invalid listId: ${listId}`);
        return [];
    }
    // console.log(`[ListModel] Finding items for list ID: ${listId}`); // Optional
    const query = `
        SELECT
            li.id as list_item_id, li.item_id, li.item_type, li.added_at,
            CASE
                WHEN li.item_type = 'restaurant' THEN r.name
                WHEN li.item_type = 'dish' THEN d.name
                ELSE NULL
            END as name,
            CASE
                WHEN li.item_type = 'dish' THEN r_dish.name
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
                CASE
                    WHEN li.item_type = 'restaurant' THEN (SELECT ARRAY_AGG(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = li.item_id)
                    WHEN li.item_type = 'dish' THEN (SELECT ARRAY_AGG(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = li.item_id)
                    ELSE NULL
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
    try {
        const result = await db.query(query, [listId]);
        return (result.rows || []).map(formatListItemForResponse).filter((item) => item !== null);
    } catch (error) {
        console.error(`[ListModel findListItemsByListId] Error fetching items for list ${listId}:`, error);
        throw error;
    }
};

export const createList = async (listData, userId, userHandle) => {
    // console.log(`[ListModel] Creating list for user ${userId} (${userHandle})`, listData); // Optional
    // Ensure 'type' from listData is used for list_type AND is valid
    const { name, description = null, is_public = true, list_type, tags = [], city_name = null } = listData; // Use list_type directly
    // Validate required 'list_type' field more strictly
    if (!list_type || (list_type !== 'restaurant' && list_type !== 'dish')) {
        throw new Error("List creation requires a valid 'list_type' ('restaurant' or 'dish').");
    }
    const query = `
        INSERT INTO Lists (name, description, is_public, list_type, tags, user_id, creator_handle, city_name, updated_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
    `;
    const cleanTags = Array.isArray(tags) ? tags.filter(Boolean).map(String) : [];
    const params = [name, description, is_public, list_type, cleanTags, userId, userHandle, city_name]; // Use validated list_type
    // console.log('[ListModel createList] Query:', query, 'Params:', params); // Optional
    try {
        const result = await db.query(query, params);
        if (!result.rows[0]) throw new Error("List creation failed, no row returned.");
        const formatted = formatListForResponse(result.rows[0]);
        if (!formatted) throw new Error("Failed to format created list response.");
        formatted.item_count = 0; // Newly created list has 0 items initially
        return formatted;
    } catch (error) {
        console.error(`[ListModel createList] Error for user ${userId}:`, error);
        throw error;
    }
};

export const updateList = async (listId, listData) => {
    if (isNaN(listId) || listId <= 0) {
        console.warn(`[ListModel Update] Invalid listId: ${listId}`);
        return null;
    }
    // console.log(`[ListModel] Updating list ID: ${listId}`, listData); // Optional
    const { name, description, is_public, list_type, tags, city_name } = listData; // Use list_type
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Check for type change compatibility before adding to fields
    if (list_type && ['restaurant', 'dish'].includes(list_type)) {
        const currentListCheck = await db.query('SELECT list_type FROM lists WHERE id = $1', [listId]);
        const currentType = currentListCheck.rows[0]?.list_type;

        if (currentType && currentType !== list_type) { // Only check if type actually changes
             const itemsCheck = await db.query('SELECT COUNT(*) FROM listitems WHERE list_id = $1', [listId]);
             if (parseInt(itemsCheck.rows[0]?.count || '0', 10) > 0) {
                 // Check if *any* existing item is *not* the new type
                 const incompatibleCheck = await db.query(
                     `SELECT COUNT(*) FROM listitems WHERE list_id = $1 AND item_type != $2`,
                     [listId, list_type]
                 );
                 if (parseInt(incompatibleCheck.rows[0]?.count || '0', 10) > 0) {
                    throw new Error(`Cannot change type to '${list_type}' because the list contains incompatible items. Remove items first.`);
                 }
             }
             // Only add type update if compatible
            fields.push(`list_type = $${paramIndex++}`);
            values.push(list_type);
        } else if (!currentType) {
            // List might not exist, handle defensively or rely on WHERE clause
            fields.push(`list_type = $${paramIndex++}`);
            values.push(list_type);
        }
    } else if (list_type) {
        // Throw error if an invalid type like 'mixed' is attempted
         throw new Error(`Invalid list_type provided for update: '${list_type}'. Must be 'restaurant' or 'dish'.`);
    }


    if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description ?? null); }
    if (is_public !== undefined) { fields.push(`is_public = $${paramIndex++}`); values.push(is_public); }
    if (tags !== undefined) {
        fields.push(`tags = $${paramIndex++}`);
        values.push(Array.isArray(tags) ? tags.filter(Boolean).map(String) : []);
    }
    if (city_name !== undefined) { fields.push(`city_name = $${paramIndex++}`); values.push(city_name ?? null); }

    if (fields.length === 0) {
        // console.warn(`[ListModel Update] No valid fields provided for update on list ${listId}`); // Optional
        const currentListRaw = await findListById(listId);
        return formatListForResponse(currentListRaw);
    }

    fields.push(`updated_at = NOW()`);

    const query = `
        UPDATE Lists
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *;
    `;
    values.push(listId);
    // console.log('[ListModel updateList] Query:', query, 'Params:', values); // Optional
    try {
        const result = await db.query(query, values);
        const updatedList = formatListForResponse(result.rows[0]);
        if (updatedList) {
            const countResult = await db.query('SELECT COUNT(*) FROM listitems WHERE list_id = $1', [listId]);
            updatedList.item_count = parseInt(countResult.rows[0]?.count || '0', 10);
        }
        return updatedList;
    } catch (error) {
        console.error(`[ListModel updateList] Error updating list ${listId}:`, error);
        throw error;
    }
};

export const addItemToList = async (listId, itemId, itemType) => {
    if (isNaN(listId) || listId <= 0 || isNaN(itemId) || itemId <= 0 || !['restaurant', 'dish'].includes(itemType)) {
        throw new Error('Invalid arguments for addItemToList.');
    }
    // console.log(`[ListModel] Adding item ${itemType}:${itemId} to list ${listId}`); // Optional
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const listCheck = await client.query('SELECT list_type FROM lists WHERE id = $1 FOR UPDATE', [listId]);
        if (listCheck.rowCount === 0) {
             throw new Error(`List with ID ${listId} not found.`);
        }
        const listType = listCheck.rows[0].list_type;
        // ** STRICT TYPE CHECK: Item type must match list type **
        if (listType !== itemType) {
             throw new Error(`Cannot add a ${itemType} to a list restricted to ${listType}s.`);
        }
        const checkQuery = 'SELECT id FROM listitems WHERE list_id = $1 AND item_type = $2 AND item_id = $3';
        const checkResult = await client.query(checkQuery, [listId, itemType, itemId]);
        if (checkResult.rows.length > 0) {
            const error = new Error("Item already exists in list.");
            error.status = 409;
            throw error;
        }
        const insertQuery = `
            INSERT INTO ListItems (list_id, item_id, item_type, added_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, list_id, item_id, item_type, added_at;
        `;
        const result = await client.query(insertQuery, [listId, itemId, itemType]);
        await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [listId]);
        await client.query('COMMIT');

        if (!result.rows[0]) throw new Error("Failed to add item, no row returned.");
        // Fetch the full item details after adding
        const addedListItemRaw = await client.query(`
             SELECT
                 li.id as list_item_id, li.item_id, li.item_type, li.added_at,
                 CASE WHEN li.item_type = 'restaurant' THEN r.name ELSE d.name END as name,
                 CASE WHEN li.item_type = 'dish' THEN r_dish.name ELSE NULL END as restaurant_name,
                 CASE WHEN li.item_type = 'restaurant' THEN r.city_name WHEN li.item_type = 'dish' THEN r_dish.city_name ELSE NULL END as city,
                 CASE WHEN li.item_type = 'restaurant' THEN r.neighborhood_name WHEN li.item_type = 'dish' THEN r_dish.neighborhood_name ELSE NULL END as neighborhood,
                 COALESCE(
                    CASE
                        WHEN li.item_type = 'restaurant' THEN (SELECT ARRAY_AGG(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = li.item_id)
                        WHEN li.item_type = 'dish' THEN (SELECT ARRAY_AGG(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = li.item_id)
                        ELSE NULL
                    END, ARRAY[]::TEXT[]) as tags
             FROM ListItems li
             LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
             LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
             LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
             WHERE li.id = $1
         `, [result.rows[0].id]);

        const formattedItem = formatListItemForResponse(addedListItemRaw.rows[0]);
        if (!formattedItem) throw new Error("Failed to format newly added list item");

        return {
            message: 'Item added successfully', // Include message
            item: formattedItem
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[ListModel addItemToList] Error adding item to list ${listId}:`, err);
        throw err;
    } finally {
        client.release();
    }
};

// This function might become redundant if addItemToList enforces type strictly
export const checkListTypeCompatibility = async (listId, itemType) => {
    console.log(`[ListModel] Checking compatibility for item type ${itemType} in list ${listId}`);
    const query = 'SELECT list_type FROM lists WHERE id = $1';
    try {
        const result = await db.query(query, [listId]);
        if (result.rowCount === 0) {
            throw new Error('List not found for compatibility check.');
        }
        const listType = result.rows[0].list_type;
        // Strict check: must match exactly
        return listType === itemType;
    } catch (error) {
        console.error(`[ListModel checkListTypeCompatibility] Error checking list ${listId}:`, error);
        throw error; // Re-throw error
    }
};

// --- Other functions (isFollowing, followList, unfollowList, etc.) remain the same ---
export const isFollowing = async (listId, userId) => {
    // console.log(`[ListModel] Checking if user ${userId} follows list ${listId}`); // Optional
    const query = 'SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2';
    try {
        const result = await db.query(query, [listId, userId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[ListModel isFollowing] Error checking follow status for list ${listId}, user ${userId}:`, error);
        throw error;
    }
};

export const followList = async (listId, userId) => {
    // console.log(`[ListModel] User ${userId} following list ${listId}`); // Optional
    const query = 'INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, NOW()) ON CONFLICT (list_id, user_id) DO NOTHING';
    try {
        await db.query(query, [listId, userId]);
    } catch (error) {
        console.error(`[ListModel followList] Error following list ${listId} for user ${userId}:`, error);
        throw error;
    }
};

export const unfollowList = async (listId, userId) => {
    // console.log(`[ListModel] User ${userId} unfollowing list ${listId}`); // Optional
    const query = 'DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2';
    try {
        await db.query(query, [listId, userId]);
    } catch (error) {
        console.error(`[ListModel unfollowList] Error unfollowing list ${listId} for user ${userId}:`, error);
        throw error;
    }
};

export const updateListSavedCount = async (listId, adjustment) => {
    // console.log(`[ListModel] Updating saved_count for list ${listId} by ${adjustment}`); // Optional
    const query = `
        UPDATE lists
        SET saved_count = GREATEST(0, saved_count + $1)
        WHERE id = $2
        RETURNING saved_count;
    `;
    try {
        const result = await db.query(query, [adjustment, listId]);
        if (result.rowCount === 0) {
             const currentCountResult = await db.query('SELECT saved_count FROM lists WHERE id = $1', [listId]);
             if (currentCountResult.rowCount === 0) {
                 console.warn(`[ListModel updateListSavedCount] List ${listId} not found.`);
                 return 0;
             }
             return currentCountResult.rows[0].saved_count;
        }
        return result.rows[0].saved_count;
    } catch (error) {
        console.error(`[ListModel updateListSavedCount] Error updating count for list ${listId}:`, error);
        throw error;
    }
};

export const removeItemFromList = async (listId, listItemId) => {
    // console.log(`[ListModel] Removing list item ${listItemId} from list ${listId}`); // Optional
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const deleteQuery = 'DELETE FROM listitems WHERE id = $1 AND list_id = $2 RETURNING id';
        const deleteResult = await client.query(deleteQuery, [listItemId, listId]);
        const deleted = (deleteResult.rowCount ?? 0) > 0;

        if (deleted) {
            await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [listId]);
        } else {
            // console.warn(`[ListModel removeItemFromList] Item ${listItemId} not found in list ${listId} or already deleted.`); // Optional
        }

        await client.query('COMMIT');
        return deleted;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[ListModel removeItemFromList] Error removing item ${listItemId} from list ${listId}:`, error);
        throw error;
    } finally {
        client.release();
    }
};

export const updateListVisibility = async (listId, is_public) => {
    // console.log(`[ListModel] Updating visibility for list ${listId} to ${is_public}`); // Optional
    const query = `
        UPDATE lists
        SET is_public = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
    `;
    try {
        const result = await db.query(query, [is_public, listId]);
        const updatedList = formatListForResponse(result.rows[0]);
        if (updatedList) {
            const countResult = await db.query('SELECT COUNT(*) FROM listitems WHERE list_id = $1', [listId]);
            updatedList.item_count = parseInt(countResult.rows[0]?.count || '0', 10);
        }
        return updatedList;
    } catch (error) {
        console.error(`[ListModel updateListVisibility] Error updating visibility for list ${listId}:`, error);
        throw error;
    }
};

export const deleteList = async (listId) => {
    // console.log(`[ListModel] Deleting list ${listId}`); // Optional
    const query = 'DELETE FROM lists WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [listId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[ListModel deleteList] Error deleting list ${listId}:`, error);
        throw error;
    }
};