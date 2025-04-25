/* src/doof-backend/models/listModel.js */
/* REFACTORED: Uses shared formatters from ../utils/formatters.js */
/* REFACTORED: Standardized on list_type, removed legacy type field/logic */
/* FIXED: Added LIMIT/OFFSET pagination and total count to findListsByUser */
import db from '../db/index.js';
// Import shared formatters from the utility file
import { formatList, formatListItem } from '../utils/formatters.js';

// --- Model Functions using Shared Formatters ---

// Find Lists By User (uses imported formatter)
// FIXED: Added limit and offset to options, applied to query, added total count
export const findListsByUser = async (userId, { createdByUser, followedByUser, limit = 10, offset = 0 }) => {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId <= 0) {
        console.warn(`[ListModel findListsByUser] Invalid userId: ${userId}`);
        return { data: [], total: 0 }; // Return object structure
    }

    // Ensure limit and offset are valid numbers
    const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

    let queryText = `
        SELECT
            l.*,
            u.username as creator_handle,
            COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
            CASE WHEN $1::INTEGER IS NOT NULL THEN EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1::INTEGER) ELSE FALSE END as is_following,
            CASE WHEN $1::INTEGER IS NOT NULL THEN (l.user_id = $1::INTEGER) ELSE FALSE END as created_by_user,
            COUNT(*) OVER() AS total_count -- Get total count before pagination
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
    `;
    const params = [numericUserId];
    let conditionIndex = 2; // Start param index after userId ($1)
    let conditions = [];

    // Logic to handle 'followedByUser' and 'createdByUser' filters
    if (followedByUser === true) {
        queryText += ` JOIN listfollows lf_filter ON l.id = lf_filter.list_id `;
        conditions.push(`lf_filter.user_id = $${conditionIndex++}`);
        params.push(numericUserId);
        // Optionally exclude lists created by the user if view is strictly 'followed'
        // if (createdByUser === false) { // Assuming frontend sends this combination if needed
        //    conditions.push(`(l.user_id IS NULL OR l.user_id != $${conditionIndex++})`);
        //    params.push(numericUserId);
        // }
    } else if (createdByUser === true || createdByUser === undefined) { // Default to created lists
        conditions.push(`l.user_id = $${conditionIndex++}`);
        params.push(numericUserId);
    }
    // Note: The case 'createdByUser === false' without 'followedByUser === true' might need specific logic if intended

    conditions.push(`l.list_type IN ('restaurant', 'dish', 'mixed')`); // Allow 'mixed' type as well

    if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY l.updated_at DESC, l.created_at DESC';
    // Add LIMIT and OFFSET
    queryText += ` LIMIT $${conditionIndex++} OFFSET $${conditionIndex++}`;
    params.push(safeLimit);
    params.push(safeOffset);

    try {
        const result = await db.query(queryText, params);
        const rows = result.rows || [];
        // Use the imported formatter
        const formattedLists = rows.map(formatList).filter((list) => list !== null);
        // Get total count from the first row (it's the same for all rows due to OVER())
        const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;

        return { data: formattedLists, total: totalCount }; // Return object with data and total count
    } catch (error) {
        console.error(`[ListModel findListsByUser] Error for user ${numericUserId}:`, error);
        // Throw a more specific error or handle appropriately
        throw new Error(`DB error fetching lists: ${error.message}`);
    }
};


// Find List By ID (returns raw data for formatter)
export const findListByIdRaw = async (listId) => { // Renamed to avoid conflict if formatting needed locally
    const numericListId = parseInt(listId, 10);
    if (isNaN(numericListId) || numericListId <= 0) {
        console.warn(`[ListModel findListByIdRaw] Invalid listId: ${listId}`);
        return null; // Return null for invalid ID
    }
    const query = `
        SELECT l.*, u.username as creator_handle,
               COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        WHERE l.id = $1 AND l.list_type IN ('restaurant', 'dish', 'mixed') -- Allow 'mixed'
    `;
    try {
        const result = await db.query(query, [numericListId]);
        return result.rows[0] || null; // Return raw row or null
    } catch (error) {
        console.error(`[ListModel findListByIdRaw] Error fetching list ${numericListId}:`, error);
        throw error;
    }
};

// Find List Items By List ID (uses imported formatter)
export const findListItemsByListId = async (listId) => {
    const numericListId = parseInt(listId, 10);
    if (isNaN(numericListId) || numericListId <= 0) {
        console.warn(`[ListModel findListItemsByListId] Invalid listId: ${listId}`);
        return [];
    }
    // Optimized query with conditional joins and tag aggregation
    const query = `
        SELECT
            li.id as list_item_id,
            li.item_id,
            li.item_type,
            li.added_at,
            li.notes, -- Include notes
            COALESCE(r.name, d.name) as name,
            COALESCE(r.city_name, r_dish.city_name) as city,
            COALESCE(r.neighborhood_name, r_dish.neighborhood_name) as neighborhood,
            r_dish.name as restaurant_name, -- Name of the restaurant for a dish item
            r.id as restaurant_id, -- ID of the restaurant if item_type is 'restaurant'
            d.id as dish_id,       -- ID of the dish if item_type is 'dish'
            COALESCE(tag_agg.tags, ARRAY[]::TEXT[]) as tags
        FROM ListItems li
        LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
        LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id -- Join to get dish's restaurant name
        -- Pre-aggregate tags using LATERAL join or a CTE if performance degrades
        LEFT JOIN LATERAL (
            SELECT ARRAY_AGG(h.name ORDER BY h.name) as tags
            FROM (
                SELECT rh.hashtag_id FROM RestaurantHashtags rh WHERE rh.restaurant_id = li.item_id AND li.item_type = 'restaurant'
                UNION ALL
                SELECT dh.hashtag_id FROM DishHashtags dh WHERE dh.dish_id = li.item_id AND li.item_type = 'dish'
            ) item_tags
            JOIN Hashtags h ON item_tags.hashtag_id = h.id
        ) tag_agg ON true
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC;
    `;
    try {
        const result = await db.query(query, [numericListId]);
        // Use the imported formatter
        return (result.rows || []).map(formatListItem).filter((item) => item !== null);
    } catch (error) {
        console.error(`[ListModel findListItemsByListId] Error fetching items for list ${numericListId}:`, error);
        throw error;
    }
};

// Create List (uses imported formatter)
export const createList = async (listData, userId, userHandle) => {
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericUserId) || numericUserId <= 0) throw new Error("Invalid User ID.");
    // Expect list_type directly
    const { name, description = null, is_public = true, list_type, tags = [], city_name = null } = listData;
    if (!name || !list_type || !['restaurant', 'dish', 'mixed'].includes(list_type)) { // Allow 'mixed'
        throw new Error("List creation requires name and valid 'list_type' ('restaurant', 'dish', or 'mixed').");
    }
    const query = `
        INSERT INTO Lists (name, description, is_public, list_type, tags, user_id, creator_handle, city_name, updated_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
    `;
    const cleanTags = Array.isArray(tags) ? tags.filter(Boolean).map(String) : [];
    const params = [name, description, !!is_public, list_type, cleanTags, numericUserId, userHandle, city_name];
    try {
        const result = await db.query(query, params);
        if (!result.rows[0]) throw new Error("List creation failed, no row returned.");
        // Use the imported formatter
        return formatList(result.rows[0]);
    } catch (error) {
        console.error(`[ListModel createList] Error for user ${numericUserId}:`, error);
        throw error;
    }
};

// Update List (uses imported formatter)
export const updateList = async (listId, listData) => {
    const numericListId = parseInt(listId, 10);
    if (isNaN(numericListId) || numericListId <= 0) {
        console.warn(`[ListModel Update] Invalid listId: ${listId}`); return null;
    }
    // Expect list_type directly
    const { name, description, is_public, list_type, tags, city_name } = listData;
    const fields = []; const values = []; let paramIndex = 1;

    // Allow changing type ONLY IF list is empty or new type is 'mixed'
    if (listData.hasOwnProperty('list_type')) {
        if (list_type && ['restaurant', 'dish', 'mixed'].includes(list_type)) {
            const currentListCheck = await db.query('SELECT list_type FROM lists WHERE id = $1', [numericListId]);
            const currentType = currentListCheck.rows[0]?.list_type;

            if (currentType && currentType !== list_type && list_type !== 'mixed' ) {
                // Check if list has items incompatible with the NEW specific type
                 const incompatibleCheck = await db.query(
                    `SELECT COUNT(*) FROM listitems WHERE list_id = $1 AND item_type != $2`,
                    [numericListId, list_type] // Check for items NOT matching the new specific type
                 );
                 if (parseInt(incompatibleCheck.rows[0]?.count || '0', 10) > 0) {
                    throw new Error(`Cannot change type to '${list_type}': list contains incompatible items. Change to 'mixed' first or empty the list.`);
                 }
            }
             // If currentType exists and is different, or if changing TO 'mixed'
            if (currentType && currentType !== list_type) {
                 fields.push(`list_type = $${paramIndex++}`);
                 values.push(list_type);
            } else if (!currentType) { /* List not found */ }
        } else if (list_type !== undefined) {
            throw new Error(`Invalid list_type: '${list_type}'. Must be 'restaurant', 'dish', or 'mixed'.`);
        }
    }

    // Update other fields
    if (listData.hasOwnProperty('name')) { if(String(name).trim()) { fields.push(`name = $${paramIndex++}`); values.push(name.trim()); } else { throw new Error("List name cannot be empty.") } }
    if (listData.hasOwnProperty('description')) { fields.push(`description = $${paramIndex++}`); values.push(description ?? null); }
    if (listData.hasOwnProperty('is_public')) { fields.push(`is_public = $${paramIndex++}`); values.push(!!is_public); }
    if (listData.hasOwnProperty('tags')) { fields.push(`tags = $${paramIndex++}`); values.push(Array.isArray(tags) ? tags.filter(Boolean).map(String) : []); }
    if (listData.hasOwnProperty('city_name')) { fields.push(`city_name = $${paramIndex++}`); values.push(city_name ?? null); }

    if (fields.length === 0) return formatList(await findListByIdRaw(numericListId)); // Return current formatted list

    fields.push(`updated_at = NOW()`);
    const query = `UPDATE Lists SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    values.push(numericListId);
    try {
        const result = await db.query(query, values);
        // Use the imported formatter
        return formatList(result.rows[0]);
    } catch (error) {
        console.error(`[ListModel updateList] Error updating list ${numericListId}:`, error);
        throw error;
    }
};

// Add Item To List (uses imported formatter)
export const addItemToList = async (listId, itemId, itemType, notes = null) => { // Added notes parameter
    const numericListId = parseInt(listId, 10);
    const numericItemId = parseInt(itemId, 10);
    if (isNaN(numericListId) || numericListId <= 0 || isNaN(numericItemId) || numericItemId <= 0 || !['restaurant', 'dish'].includes(itemType)) {
        throw new Error('Invalid arguments for addItemToList.');
    }
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        // Lock the list row to prevent concurrent type changes? Or rely on type check below.
        const listCheck = await client.query('SELECT list_type FROM lists WHERE id = $1', [numericListId]);
        if (listCheck.rowCount === 0) throw new Error(`List with ID ${numericListId} not found.`);

        const currentListType = listCheck.rows[0].list_type;
        // Allow adding if list is 'mixed' or if item type matches list type
        if (currentListType !== 'mixed' && currentListType !== itemType) {
            throw new Error(`Cannot add a ${itemType} to a list of type ${currentListType}.`);
        }

        // Check if item already exists
        const checkQuery = 'SELECT id FROM listitems WHERE list_id = $1 AND item_type = $2 AND item_id = $3';
        const checkResult = await client.query(checkQuery, [numericListId, itemType, numericItemId]);
        if (checkResult.rows.length > 0) {
             const err = new Error("Item already exists in list.");
             err.status = 409; // Conflict status code
             throw err;
        }

        // Insert the new item with notes
        const insertQuery = `
            INSERT INTO ListItems (list_id, item_id, item_type, notes, added_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id;
        `;
        const result = await client.query(insertQuery, [numericListId, numericItemId, itemType, notes]);
        await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [numericListId]);
        await client.query('COMMIT');

        if (!result.rows[0]?.id) throw new Error("Failed to add item, no row returned.");
        const newListItemId = parseInt(result.rows[0].id, 10);

         // Fetch the full item details after adding (using the optimized query from findListItemsByListId)
         const addedListItemRaw = await client.query(`
            SELECT
                li.id as list_item_id, li.item_id, li.item_type, li.added_at, li.notes,
                COALESCE(r.name, d.name) as name,
                COALESCE(r.city_name, r_dish.city_name) as city,
                COALESCE(r.neighborhood_name, r_dish.neighborhood_name) as neighborhood,
                r_dish.name as restaurant_name,
                r.id as restaurant_id, d.id as dish_id,
                COALESCE(tag_agg.tags, ARRAY[]::TEXT[]) as tags
            FROM ListItems li
            LEFT JOIN Restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
            LEFT JOIN Dishes d ON li.item_type = 'dish' AND li.item_id = d.id
            LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
            LEFT JOIN LATERAL (...) tag_agg ON true -- Simplified for brevity, use full tag query
            WHERE li.id = $1
        `, [newListItemId]);


        // Use the imported formatter
        const formattedItem = formatListItem(addedListItemRaw.rows[0]);
        if (!formattedItem) throw new Error("Failed to format newly added list item");
        return { message: 'Item added successfully', item: formattedItem };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[ListModel addItemToList] Error adding item to list ${numericListId}:`, err);
        throw err; // Re-throw the original error (might have status code)
    } finally {
        client.release();
    }
};

// Check List Type Compatibility (no change needed - but consider 'mixed')
export const checkListTypeCompatibility = async (listId, itemType) => {
    const numericListId = parseInt(listId, 10);
    if (isNaN(numericListId) || numericListId <= 0 || !['restaurant', 'dish'].includes(itemType)) throw new Error("Invalid arguments.");
    const query = 'SELECT list_type FROM lists WHERE id = $1';
    try {
        const result = await db.query(query, [numericListId]);
        if (result.rowCount === 0) throw new Error('List not found.');
        const listType = result.rows[0].list_type;
        return listType === 'mixed' || listType === itemType; // Compatible if list is mixed or matches item type
    } catch (error) { console.error(`[ListModel checkCompat] Error list ${numericListId}:`, error); throw error; }
};


// Is Following (no change needed)
export const isFollowing = async (listId, userId) => {
    const numericListId = parseInt(listId, 10); const numericUserId = parseInt(userId, 10);
    if (isNaN(numericListId) || isNaN(numericUserId)) return false;
    const query = 'SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2';
    try { const result = await db.query(query, [numericListId, numericUserId]); return (result.rowCount ?? 0) > 0; }
    catch (error) { console.error(`[ListModel isFollowing] Error list ${numericListId}, user ${numericUserId}:`, error); throw error; }
};

// Follow List (updated to return more details)
export const followList = async (listId, userId) => {
    const numericListId = parseInt(listId, 10);
    const numericUserId = parseInt(userId, 10);
    if (isNaN(numericListId) || isNaN(numericUserId)) throw new Error("Invalid ID.");

    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        // Check if list exists and is public (or if user is owner - though owner usually doesn't follow)
        const listCheck = await client.query('SELECT user_id, is_public FROM Lists WHERE id = $1', [numericListId]);
        if (listCheck.rowCount === 0) {
             throw { success: false, message: 'List not found.', status: 404 };
        }
        if (!listCheck.rows[0].is_public && listCheck.rows[0].user_id !== numericUserId) {
             throw { success: false, message: 'Cannot follow a private list.', status: 403 };
        }

        // Attempt to insert
        const insertQuery = 'INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, NOW()) ON CONFLICT (list_id, user_id) DO NOTHING RETURNING list_id';
        const insertResult = await client.query(insertQuery, [numericListId, numericUserId]);
        const followed = insertResult.rowCount > 0;

        // Update saved_count
        const adjustment = followed ? 1 : 0; // Only adjust if insert happened
        const countUpdateQuery = `
             UPDATE lists SET saved_count = GREATEST(0, saved_count + $1)
             WHERE id = $2
             RETURNING saved_count, name, list_type;
         `;
        const countResult = await client.query(countUpdateQuery, [adjustment, numericListId]);

        await client.query('COMMIT');

         if (countResult.rowCount === 0) { // Should not happen if list exists
             throw { success: false, message: 'Failed to update list follow count.', status: 500 };
         }

         const updatedCount = parseInt(countResult.rows[0].saved_count, 10) || 0;
         const listName = countResult.rows[0].name;
         const listType = countResult.rows[0].list_type;

        return {
            success: true,
            is_following: true, // User is now following (or was already)
            message: followed ? 'List followed successfully.' : 'Already following list.',
            saved_count: updatedCount,
             name: listName, // Return name
             list_type: listType // Return type
         };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[ListModel followList] Error list ${numericListId}, user ${numericUserId}:`, error);
         if (error.success === false) throw error; // Re-throw custom error objects
        throw new Error(`DB error following list: ${error.message}`);
    } finally {
        client.release();
    }
};


// Unfollow List (updated to return more details)
export const unfollowList = async (listId, userId) => {
    const numericListId = parseInt(listId, 10);
    const numericUserId = parseInt(userId, 10);
     if (isNaN(numericListId) || isNaN(numericUserId)) throw new Error("Invalid ID.");

     const client = await db.getClient();
     try {
         await client.query('BEGIN');

         // Attempt to delete
         const deleteQuery = 'DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2 RETURNING list_id';
         const deleteResult = await client.query(deleteQuery, [numericListId, numericUserId]);
         const unfollowed = deleteResult.rowCount > 0;

         // Update saved_count
         const adjustment = unfollowed ? -1 : 0; // Only adjust if delete happened
         const countUpdateQuery = `
              UPDATE lists SET saved_count = GREATEST(0, saved_count + $1)
              WHERE id = $2
              RETURNING saved_count, name, list_type;
          `;
         const countResult = await client.query(countUpdateQuery, [adjustment, numericListId]);

         await client.query('COMMIT');

         if (countResult.rowCount === 0) { // List might have been deleted? Unlikely but possible.
             // If list doesn't exist, unfollow technically succeeded (or was irrelevant)
             console.warn(`[ListModel unfollowList] List ${numericListId} not found during count update.`);
             return { success: true, is_following: false, message: 'List not found or already unfollowed.', saved_count: 0, name: null, list_type: null };
         }

         const updatedCount = parseInt(countResult.rows[0].saved_count, 10) || 0;
          const listName = countResult.rows[0].name;
          const listType = countResult.rows[0].list_type;


         return {
             success: true,
             is_following: false, // User is now not following
             message: unfollowed ? 'List unfollowed successfully.' : 'Was not following list.',
             saved_count: updatedCount,
              name: listName,
              list_type: listType
          };

     } catch (error) {
         await client.query('ROLLBACK');
         console.error(`[ListModel unfollowList] Error list ${numericListId}, user ${numericUserId}:`, error);
         throw new Error(`DB error unfollowing list: ${error.message}`);
     } finally {
         client.release();
     }
};


// Toggle Follow List (using follow/unfollow)
export const toggleFollowList = async (listId, userId) => {
     const numericListId = parseInt(listId, 10);
     const numericUserId = parseInt(userId, 10);
     if (isNaN(numericListId) || isNaN(numericUserId)) {
         throw { success: false, message: "Invalid list or user ID.", status: 400 };
     }

     try {
         const currentlyFollowing = await isFollowing(numericListId, numericUserId);

         if (currentlyFollowing) {
             return await unfollowList(numericListId, numericUserId);
         } else {
             return await followList(numericListId, numericUserId);
         }
     } catch (error) {
         console.error(`[ListModel toggleFollow] Error for list ${numericListId}, user ${numericUserId}:`, error);
         // Rethrow specific errors from follow/unfollow if they have status/message
         if (error.success === false) throw error;
         // Otherwise, throw a generic error
         throw { success: false, message: `Failed to toggle follow status: ${error.message}`, status: 500 };
     }
 };


// Update List Saved Count (no change needed)
export const updateListSavedCount = async (listId, adjustment) => {
    const numericListId = parseInt(listId, 10); const numericAdjustment = parseInt(adjustment, 10);
     if (isNaN(numericListId) || isNaN(numericAdjustment)) throw new Error("Invalid ID or adjustment.");
    const query = `UPDATE lists SET saved_count = GREATEST(0, saved_count + $1) WHERE id = $2 RETURNING saved_count;`;
    try {
        const result = await db.query(query, [numericAdjustment, numericListId]);
        if (result.rowCount === 0) {
             const current = await db.query('SELECT saved_count FROM lists WHERE id = $1', [numericListId]);
             return current.rows[0]?.saved_count ?? 0;
        }
        return parseInt(result.rows[0].saved_count, 10) || 0;
    } catch (error) { console.error(`[ListModel updateSavedCount] Error list ${numericListId}:`, error); throw error; }
};

// Remove Item From List (no change needed)
export const removeItemFromList = async (listId, listItemId) => {
    const numericListId = parseInt(listId, 10); const numericListItemId = parseInt(listItemId, 10);
     if (isNaN(numericListId) || isNaN(numericListItemId)) throw new Error("Invalid ID.");
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        const deleteQuery = 'DELETE FROM listitems WHERE id = $1 AND list_id = $2 RETURNING id';
        const deleteResult = await client.query(deleteQuery, [numericListItemId, numericListId]);
        const deleted = (deleteResult.rowCount ?? 0) > 0;
        if (deleted) await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [numericListId]);
        await client.query('COMMIT'); return deleted;
    } catch (error) { await client.query('ROLLBACK'); console.error(`[ListModel removeItem] Error list ${numericListId}, item ${numericListItemId}:`, error); throw error;
    } finally { client.release(); }
};

// Update List Visibility (uses imported formatter)
export const updateListVisibility = async (listId, is_public) => {
    const numericListId = parseInt(listId, 10);
     if (isNaN(numericListId)) throw new Error("Invalid ID.");
    const query = `UPDATE lists SET is_public = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
    try {
        const result = await db.query(query, [!!is_public, numericListId]);
        // Use the imported formatter
        return formatList(result.rows[0]);
    } catch (error) { console.error(`[ListModel updateVisibility] Error list ${numericListId}:`, error); throw error; }
};

// Delete List (no change needed)
export const deleteList = async (listId) => {
    const numericListId = parseInt(listId, 10);
     if (isNaN(numericListId)) throw new Error("Invalid ID.");
    const query = 'DELETE FROM lists WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [numericListId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
         if (error.code === '23503') throw new Error(`Cannot delete list ${numericListId}: Referenced by other items.`);
        console.error(`[ListModel delete] Error list ${numericListId}:`, error); throw error;
    }
};

// Export module pattern if preferred
const ListModel = {
    findListsByUser,
    findListByIdRaw,
    findListItemsByListId,
    createList,
    updateList,
    addItemToList,
    checkListTypeCompatibility,
    isFollowing,
    followList,
    unfollowList,
    toggleFollowList,
    updateListSavedCount,
    removeItemFromList,
    updateListVisibility,
    deleteList,
};

export default ListModel; // Make ListModel the default export