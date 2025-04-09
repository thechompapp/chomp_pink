/* src/doof-backend/models/listModel.ts */
import db from '../db/index.js';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

// Define and EXPORT interfaces
export interface ListItem {
    list_item_id: number;
    id: number; // item_id exposed as id
    item_id: number; // original item_id
    item_type: 'restaurant' | 'dish';
    added_at?: string; // ISO string or Date
    name?: string;
    restaurant_name?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags: string[];
}

export interface List {
    id: number;
    user_id: number | null;
    name: string;
    description: string | null;
    tags: string[];
    is_public: boolean;
    is_following: boolean; // Added based on usage in components
    created_by_user: boolean; // Added based on usage in components
    item_count: number;
    saved_count: number;
    type: 'mixed' | 'restaurant' | 'dish';
    list_type?: 'mixed' | 'restaurant' | 'dish'; // Keep both if needed for compatibility
    creator_handle?: string | null;
    created_at?: string | Date; // ISO string or Date
    updated_at?: string | Date; // ISO string or Date
    city_name?: string | null; // Denormalized from Restaurants potentially
    city?: string | null; // Alias
}

interface RawListRow extends QueryResultRow {
    id: number | string;
    user_id?: number | string | null;
    name?: string | null; // Make name potentially null to handle DB inconsistencies
    description?: string | null;
    tags?: string[] | null;
    is_public?: boolean | null;
    is_following?: boolean | null; // This might come from JOIN or CASE
    created_by_user?: boolean | null; // This might come from CASE
    item_count?: number | string | null; // This might come from subquery
    saved_count?: number | string | null;
    list_type?: string | null; // Database column name
    type?: string | null; // Potential alias from frontend/types
    creator_handle?: string | null; // Joined from Users
    created_at?: string | Date;
    updated_at?: string | Date;
    city_name?: string | null;
}

interface RawListItemRow extends QueryResultRow {
    list_item_id: number | string;
    item_id: number | string;
    item_type: string;
    added_at?: string | Date;
    name?: string | null;
    restaurant_name?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[] | null;
}

// Exported formatter function with improved null checks
export const formatListForResponse = (listRow: RawListRow | undefined): List | null => {
    // Ensure listRow and essential fields (like id, name) exist
    if (!listRow || listRow.id == null || typeof listRow.name !== 'string') {
        console.warn('[ListModel Format Error] Invalid or incomplete list data received:', listRow);
        return null; // Return null if essential data is missing
    }
    try {
        const listType = (listRow.list_type || listRow.type || 'mixed') as List['type'];
        const tagsArray = Array.isArray(listRow.tags)
            ? listRow.tags.filter((tag): tag is string => typeof tag === 'string' && tag !== null)
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
            type: listType,
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

const formatListItemForResponse = (itemRow: RawListItemRow | undefined): ListItem | null => {
    // Ensure essential fields exist
    if (!itemRow || itemRow.list_item_id == null || itemRow.item_id == null || !itemRow.item_type) {
        console.warn('[ListModel Format Error] Invalid or incomplete list item data received:', itemRow);
        return null;
    }
    try {
        const tagsArray = Array.isArray(itemRow.tags)
            ? itemRow.tags.filter((tag): tag is string => typeof tag === 'string' && tag !== null)
            : [];
        return {
            list_item_id: parseInt(String(itemRow.list_item_id), 10),
            id: parseInt(String(itemRow.item_id), 10), // Use item_id as primary ID for consistency
            item_id: parseInt(String(itemRow.item_id), 10), // Keep original field if needed
            item_type: itemRow.item_type as ListItem['item_type'], // Assert type
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

export const findListsByUser = async (userId: number, { createdByUser, followedByUser }: { createdByUser?: boolean; followedByUser?: boolean }): Promise<List[]> => {
    if (isNaN(userId) || userId <= 0) {
        console.warn(`[ListModel findListsByUser] Invalid userId: ${userId}`);
        return [];
    }
    console.log(`[ListModel] Finding lists for user ${userId}, created: ${createdByUser}, followed: ${followedByUser}`);
    // This query structure seems logically correct for fetching created/followed lists.
    // Ensure all selected columns (l.*, u.username) exist and aliases are correct.
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
    const params: (number | boolean)[] = [userId];
    let conditionIndex = 2;
    let conditions: string[] = [];

    // Logic to determine which lists to fetch based on parameters
    if (followedByUser === true) {
        queryText += ` JOIN listfollows lf_filter ON l.id = lf_filter.list_id `;
        conditions.push(`lf_filter.user_id = $${conditionIndex++}`);
        params.push(userId);
        if (createdByUser === false) { // Fetch lists followed BUT NOT created by user
            conditions.push(`l.user_id IS NULL OR l.user_id != $${conditionIndex++}`);
            params.push(userId);
        }
        // If createdByUser is true or undefined while followedByUser is true, it fetches lists both created AND followed by the user.
    } else if (createdByUser === true || createdByUser === undefined) { // Default to createdByUser if neither is specified or created=true
        conditions.push(`l.user_id = $${conditionIndex++}`);
        params.push(userId);
    } else {
        // createdByUser is explicitly false, and followedByUser is not true.
        // This case might need clarification - fetch lists NEITHER created nor followed? Or all public lists?
        // For now, let's assume it might mean fetch all public lists if the user isn't filtering by created/followed.
        // Add appropriate conditions if needed, otherwise, it fetches nothing specific here.
        // conditions.push(`l.is_public = TRUE`); // Example: Fetch all public if no user filter
    }

    if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY l.updated_at DESC, l.created_at DESC';

    console.log("[ListModel findListsByUser] Executing query:", queryText.replace(/\s+/g, ' ').trim(), params);
    try {
        const result: QueryResult<RawListRow> = await db.query(queryText, params);
        console.log(`[ListModel findListsByUser] Query returned ${result.rowCount} rows.`);
        // Map and filter results rigorously using the improved formatter
        const formattedLists = (result.rows || []).map(formatListForResponse).filter((list): list is List => list !== null);
        console.log(`[ListModel findListsByUser] Formatted ${formattedLists.length} valid lists.`);
        return formattedLists;
    } catch (error) {
        console.error(`[ListModel findListsByUser] Error executing query for user ${userId}:`, error);
        // Throw a more specific error if possible, otherwise the generic one
        throw new Error(`Database error fetching lists for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
};

// --- findListById (Keep existing implementation, ensure formatter is used in route) ---
export const findListById = async (listId: number): Promise<RawListRow | undefined> => {
    if (isNaN(listId) || listId <= 0) {
        console.warn(`[ListModel findListById] Invalid listId: ${listId}`);
        return undefined;
    }
    console.log(`[ListModel] Finding list by ID: ${listId}`);
    const query = `
        SELECT l.*, u.username as creator_handle
        FROM Lists l
        LEFT JOIN Users u ON l.user_id = u.id
        WHERE l.id = $1
    `;
    try {
        const result = await db.query<RawListRow>(query, [listId]);
        return result.rows[0]; // Return raw row for the route to format
    } catch (error) {
        console.error(`[ListModel findListById] Error fetching list ${listId}:`, error);
        throw error;
    }
};


// --- findListItemsByListId (Keep existing implementation, ensure formatter is used in route) ---
export const findListItemsByListId = async (listId: number): Promise<ListItem[]> => {
    if (isNaN(listId) || listId <= 0) {
        console.warn(`[ListModel findListItemsByListId] Invalid listId: ${listId}`);
        return [];
    }
    console.log(`[ListModel] Finding items for list ID: ${listId}`);
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
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id -- Join restaurant for dish items
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC;
    `;
    try {
        const result: QueryResult<RawListItemRow> = await db.query(query, [listId]);
        // Filter rigorously after mapping
        return (result.rows || []).map(formatListItemForResponse).filter((item): item is ListItem => item !== null);
    } catch (error) {
        console.error(`[ListModel findListItemsByListId] Error fetching items for list ${listId}:`, error);
        throw error;
    }
};


// --- createList (Keep existing implementation, formatter is used) ---
export const createList = async (listData: Partial<List> & { name: string }, userId: number, userHandle: string): Promise<List> => {
    console.log(`[ListModel] Creating list for user ${userId} (${userHandle})`, listData);
    const { name, description = null, is_public = true, type = 'mixed', tags = [], city_name = null } = listData;
    const dbListType = type;
    const query = `
        INSERT INTO Lists (name, description, is_public, list_type, tags, user_id, creator_handle, city_name, updated_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
    `;
    const cleanTags = Array.isArray(tags) ? tags.filter(Boolean).map(String) : [];
    const params = [name, description, is_public, dbListType, cleanTags, userId, userHandle, city_name];
    console.log('[ListModel createList] Query:', query, 'Params:', params);
    try {
        const result = await db.query<RawListRow>(query, params);
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

// --- updateList (Keep existing implementation, formatter is used) ---
export const updateList = async (listId: number, listData: Partial<List>): Promise<List | null> => {
    if (isNaN(listId) || listId <= 0) {
        console.warn(`[ListModel Update] Invalid listId: ${listId}`);
        return null;
    }
    console.log(`[ListModel] Updating list ID: ${listId}`, listData);
    const { name, description, is_public, type, tags, city_name } = listData;
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description ?? null); }
    if (is_public !== undefined) { fields.push(`is_public = $${paramIndex++}`); values.push(is_public); }
    // Use list_type for DB column, validate value
    if (type !== undefined && ['mixed', 'restaurant', 'dish'].includes(type)) {
        fields.push(`list_type = $${paramIndex++}`); values.push(type);
    }
    if (tags !== undefined) {
        fields.push(`tags = $${paramIndex++}`);
        values.push(Array.isArray(tags) ? tags.filter(Boolean).map(String) : []);
    }
    if (city_name !== undefined) { fields.push(`city_name = $${paramIndex++}`); values.push(city_name ?? null); }

    if (fields.length === 0) {
        console.warn(`[ListModel Update] No valid fields provided for update on list ${listId}`);
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
    console.log('[ListModel updateList] Query:', query, 'Params:', values);
    try {
        const result = await db.query<RawListRow>(query, values);
        // Refetch item count after update for accuracy
        const updatedList = formatListForResponse(result.rows[0]);
        if (updatedList) {
            const countResult = await db.query<{ count: string }>('SELECT COUNT(*) FROM listitems WHERE list_id = $1', [listId]);
            updatedList.item_count = parseInt(countResult.rows[0]?.count || '0', 10);
        }
        return updatedList;
    } catch (error) {
        console.error(`[ListModel updateList] Error updating list ${listId}:`, error);
        throw error;
    }
};


// --- addItemToList (Keep existing implementation) ---
export const addItemToList = async (listId: number, itemId: number, itemType: 'restaurant' | 'dish'): Promise<{ id: number; list_id: number; item_id: number; item_type: string; added_at: string }> => {
    if (isNaN(listId) || listId <= 0 || isNaN(itemId) || itemId <= 0 || !['restaurant', 'dish'].includes(itemType)) {
        throw new Error('Invalid arguments for addItemToList.');
    }
    console.log(`[ListModel] Adding item ${itemType}:${itemId} to list ${listId}`);
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        // 1. Check compatibility
        const compatible = await checkListTypeCompatibility(listId, itemType);
        if (!compatible) {
             // Fetch list type again for error message (could optimize)
             const listCheck = await client.query<{ list_type: string }>('SELECT list_type FROM lists WHERE id = $1', [listId]);
             const listType = listCheck.rows[0]?.list_type || 'unknown';
             throw new Error(`Cannot add a ${itemType} to a list restricted to ${listType}s.`);
        }
        // 2. Check if item already exists
        const checkQuery = 'SELECT id FROM listitems WHERE list_id = $1 AND item_type = $2 AND item_id = $3';
        const checkResult = await client.query(checkQuery, [listId, itemType, itemId]);
        if (checkResult.rows.length > 0) {
            const error: any = new Error("Item already exists in list.");
            error.status = 409; // Use status for specific error handling
            throw error;
        }
        // 3. Insert the item
        const insertQuery = `
            INSERT INTO ListItems (list_id, item_id, item_type, added_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, list_id, item_id, item_type, added_at;
        `;
        const result = await client.query(insertQuery, [listId, itemId, itemType]);
        // 4. Update the list's timestamp
        await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [listId]);
        await client.query('COMMIT');

        if (!result.rows[0]) throw new Error("Failed to add item, no row returned.");
        // Format the returned item
        return {
            id: parseInt(result.rows[0].id, 10),
            list_id: parseInt(result.rows[0].list_id, 10),
            item_id: parseInt(result.rows[0].item_id, 10),
            item_type: result.rows[0].item_type,
            added_at: typeof result.rows[0].added_at === 'string' ? result.rows[0].added_at : result.rows[0].added_at?.toISOString(),
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[ListModel addItemToList] Error adding item to list ${listId}:`, err);
        throw err; // Re-throw error for service/route handler
    } finally {
        client.release();
    }
};

// --- checkListTypeCompatibility (Keep existing implementation) ---
export const checkListTypeCompatibility = async (listId: number, itemType: 'restaurant' | 'dish'): Promise<boolean> => {
    console.log(`[ListModel] Checking compatibility for item type ${itemType} in list ${listId}`);
    const query = 'SELECT list_type FROM lists WHERE id = $1';
    try {
        const result = await db.query<{ list_type: string }>(query, [listId]);
        if (result.rowCount === 0) {
            throw new Error('List not found for compatibility check.');
        }
        const listType = result.rows[0].list_type;
        return listType === 'mixed' || listType === itemType;
    } catch (error) {
        console.error(`[ListModel checkListTypeCompatibility] Error checking list ${listId}:`, error);
        throw error; // Re-throw error
    }
};


// --- isFollowing (Keep existing implementation) ---
export const isFollowing = async (listId: number, userId: number): Promise<boolean> => {
    console.log(`[ListModel] Checking if user ${userId} follows list ${listId}`);
    const query = 'SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2';
    try {
        const result = await db.query(query, [listId, userId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[ListModel isFollowing] Error checking follow status for list ${listId}, user ${userId}:`, error);
        throw error;
    }
};

// --- followList (Keep existing implementation) ---
export const followList = async (listId: number, userId: number): Promise<void> => {
    console.log(`[ListModel] User ${userId} following list ${listId}`);
    const query = 'INSERT INTO listfollows (list_id, user_id, followed_at) VALUES ($1, $2, NOW()) ON CONFLICT (list_id, user_id) DO NOTHING';
    try {
        await db.query(query, [listId, userId]);
    } catch (error) {
        console.error(`[ListModel followList] Error following list ${listId} for user ${userId}:`, error);
        throw error;
    }
};

// --- unfollowList (Keep existing implementation) ---
export const unfollowList = async (listId: number, userId: number): Promise<void> => {
    console.log(`[ListModel] User ${userId} unfollowing list ${listId}`);
    const query = 'DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2';
    try {
        await db.query(query, [listId, userId]);
    } catch (error) {
        console.error(`[ListModel unfollowList] Error unfollowing list ${listId} for user ${userId}:`, error);
        throw error;
    }
};

// --- updateListSavedCount (Keep existing implementation) ---
export const updateListSavedCount = async (listId: number, adjustment: number): Promise<number> => {
    console.log(`[ListModel] Updating saved_count for list ${listId} by ${adjustment}`);
    const query = `
        UPDATE lists
        SET saved_count = GREATEST(0, saved_count + $1) -- Prevent negative counts
        WHERE id = $2
        RETURNING saved_count;
    `;
    try {
        const result = await db.query<{ saved_count: number }>(query, [adjustment, listId]);
        if (result.rowCount === 0) {
             // List might not exist, fetch current count (should be 0 or list not found)
             const currentCountResult = await db.query<{ saved_count: number }>('SELECT saved_count FROM lists WHERE id = $1', [listId]);
             if (currentCountResult.rowCount === 0) {
                 console.warn(`[ListModel updateListSavedCount] List ${listId} not found.`);
                 return 0; // Return 0 if list doesn't exist
             }
             return currentCountResult.rows[0].saved_count;
        }
        return result.rows[0].saved_count;
    } catch (error) {
        console.error(`[ListModel updateListSavedCount] Error updating count for list ${listId}:`, error);
        throw error;
    }
};


// --- removeItemFromList (Keep existing implementation) ---
export const removeItemFromList = async (listId: number, listItemId: number): Promise<boolean> => {
    console.log(`[ListModel] Removing list item ${listItemId} from list ${listId}`);
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        // Delete the item
        const deleteQuery = 'DELETE FROM listitems WHERE id = $1 AND list_id = $2 RETURNING id';
        const deleteResult = await client.query(deleteQuery, [listItemId, listId]);
        const deleted = (deleteResult.rowCount ?? 0) > 0;

        if (deleted) {
            // Update the list's timestamp if an item was deleted
            await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [listId]);
        } else {
            console.warn(`[ListModel removeItemFromList] Item ${listItemId} not found in list ${listId} or already deleted.`);
        }

        await client.query('COMMIT');
        return deleted; // Return true if deletion happened, false otherwise
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[ListModel removeItemFromList] Error removing item ${listItemId} from list ${listId}:`, error);
        throw error; // Re-throw error
    } finally {
        client.release();
    }
};


// --- updateListVisibility (Keep existing implementation, formatter is used) ---
export const updateListVisibility = async (listId: number, is_public: boolean): Promise<List | null> => {
    console.log(`[ListModel] Updating visibility for list ${listId} to ${is_public}`);
    const query = `
        UPDATE lists
        SET is_public = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
    `;
    try {
        const result = await db.query<RawListRow>(query, [is_public, listId]);
        // Refetch item count after update for accuracy
        const updatedList = formatListForResponse(result.rows[0]);
        if (updatedList) {
            const countResult = await db.query<{ count: string }>('SELECT COUNT(*) FROM listitems WHERE list_id = $1', [listId]);
            updatedList.item_count = parseInt(countResult.rows[0]?.count || '0', 10);
        }
        return updatedList;
    } catch (error) {
        console.error(`[ListModel updateListVisibility] Error updating visibility for list ${listId}:`, error);
        throw error;
    }
};

// --- deleteList (Keep existing implementation) ---
export const deleteList = async (listId: number): Promise<boolean> => {
    console.log(`[ListModel] Deleting list ${listId}`);
    // Cascading delete should handle listitems and listfollows due to schema constraints
    const query = 'DELETE FROM lists WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [listId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[ListModel deleteList] Error deleting list ${listId}:`, error);
        throw error;
    }
};