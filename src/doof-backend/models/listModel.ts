/* src/doof-backend/models/listModel.ts */
import db from '../db/index.js'; // Ensure .js extension
import type { PoolClient, QueryResult } from 'pg'; // Import pg types

// Define and EXPORT interfaces
export interface ListItem {
    list_item_id: number;
    id: number; // ID of the restaurant/dish itself
    item_id: number; // Represents ID of restaurant/dish.
    item_type: 'restaurant' | 'dish';
    added_at?: string; // Or Date
    name?: string; // Name of the restaurant/dish
    restaurant_name?: string | null; // Name of the restaurant (for dishes)
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
    is_following: boolean; // Calculated field
    created_by_user: boolean; // Calculated field
    item_count: number; // Calculated or stored
    saved_count: number;
    type: 'mixed' | 'restaurant' | 'dish'; // Frontend preferred type key
    creator_handle?: string;
    created_at?: string; // Or Date
    updated_at?: string; // Or Date
    city_name?: string | null; // Denormalized city name
    list_type?: 'mixed' | 'restaurant' | 'dish'; // DB column name
}

// Type for raw DB row for lists
interface RawListRow extends Record<string, any> {
     id: number | string;
     user_id?: number | string | null;
     name: string;
     description?: string | null;
     tags?: string[] | null;
     is_public?: boolean | null;
     is_following?: boolean | null; // May come from JOIN
     created_by_user?: boolean | null; // May be calculated
     item_count?: number | string | null; // May come from JOIN/subquery
     saved_count?: number | string | null;
     list_type?: string | null; // DB column name
     type?: string | null; // Potential alias
     creator_handle?: string | null;
     created_at?: string; // Or Date
     updated_at?: string; // Or Date
     city_name?: string | null;
}

// Type for raw DB row for list items
interface RawListItemRow extends Record<string, any> {
    list_item_id: number | string;
    item_id: number | string;
    item_type: string;
    added_at?: string; // Or Date
    name?: string | null;
    restaurant_name?: string | null;
    city?: string | null;
    neighborhood?: string | null;
    tags?: string[] | null;
}

// Helper to safely format list data
const formatListForResponse = (listRow: RawListRow | undefined): List | null => {
    if (!listRow) return null;
    try {
        const listType = listRow.list_type || listRow.type || 'mixed';
        const tagsArray = Array.isArray(listRow.tags)
            ? listRow.tags.filter((tag): tag is string => typeof tag === 'string' && tag !== null)
            : [];

        return {
            id: parseInt(String(listRow.id), 10),
            user_id: listRow.user_id ? parseInt(String(listRow.user_id), 10) : null,
            name: listRow.name || 'Unnamed List',
            description: listRow.description ?? null,
            tags: tagsArray,
            is_public: listRow.is_public ?? true,
            is_following: !!listRow.is_following,
            created_by_user: !!listRow.created_by_user,
            item_count: listRow.item_count != null ? parseInt(String(listRow.item_count), 10) : 0,
            saved_count: listRow.saved_count != null ? parseInt(String(listRow.saved_count), 10) : 0,
            type: listType as List['type'], // Assert type
            list_type: listType as List['list_type'], // Keep original if needed
            creator_handle: listRow.creator_handle ?? undefined,
            created_at: listRow.created_at,
            updated_at: listRow.updated_at,
            city_name: listRow.city_name ?? undefined,
        };
    } catch(e) {
        console.error(`[ListModel Format Error] Failed to format list row:`, listRow, e);
        return null;
    }
};

// Helper to safely format list item data
const formatListItemForResponse = (itemRow: RawListItemRow | undefined): ListItem | null => {
    if (!itemRow || itemRow.list_item_id == null || itemRow.item_id == null || !itemRow.item_type) return null;
     try {
         const tagsArray = Array.isArray(itemRow.tags)
            ? itemRow.tags.filter((tag): tag is string => typeof tag === 'string' && tag !== null)
            : [];
        return {
            list_item_id: parseInt(String(itemRow.list_item_id), 10),
            id: parseInt(String(itemRow.item_id), 10), // Use item_id as primary ID
            item_id: parseInt(String(itemRow.item_id), 10), // Keep original field
            item_type: itemRow.item_type as ListItem['item_type'], // Assert type
            added_at: itemRow.added_at,
            name: itemRow.name || `Item ${itemRow.item_id}`,
            restaurant_name: itemRow.restaurant_name ?? null,
            city: itemRow.city ?? null,
            neighborhood: itemRow.neighborhood ?? null,
            tags: tagsArray,
        };
     } catch (e) {
         console.error(`[ListModel Format Error] Failed to format list item row:`, itemRow, e);
         return null;
     }
};


// --- Model Functions ---

export const findListsByUser = async (userId: number, { createdByUser, followedByUser }: { createdByUser?: boolean; followedByUser?: boolean }): Promise<List[]> => {
    if (isNaN(userId) || userId <= 0) {
         console.warn(`[ListModel findListsByUser] Invalid userId: ${userId}`);
         return [];
    }
    console.log(`[ListModel] Finding lists for user ${userId}, created: ${createdByUser}, followed: ${followedByUser}`);
    // Base query selects all list fields and calculates item_count and follow status
    let queryText = `
        SELECT
            l.*, -- Select all fields from lists table
            COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
            -- Calculate following status based on user ID parameter ($1)
            CASE WHEN $1::INTEGER IS NOT NULL THEN EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1::INTEGER) ELSE FALSE END as is_following,
            -- Determine if the list was created by the user ID parameter ($1)
            CASE WHEN $1::INTEGER IS NOT NULL THEN (l.user_id = $1::INTEGER) ELSE FALSE END as created_by_user
        FROM Lists l
    `;
    const params: (number | boolean)[] = [userId];
    let conditionIndex = 2; // Start param index after userId ($1)
    let conditions: string[] = [];

    if (createdByUser) {
        conditions.push(`l.user_id = $${conditionIndex++}`);
        params.push(userId);
    } else if (followedByUser) {
        // Join is needed only if filtering by followed lists
        queryText += ` JOIN listfollows lf ON l.id = lf.list_id `;
        conditions.push(`lf.user_id = $${conditionIndex++}`);
        params.push(userId);
    } else {
        // Default case if neither is explicitly true (e.g., fetch lists created by user)
        conditions.push(`l.user_id = $${conditionIndex++}`);
        params.push(userId);
    }

    if (conditions.length > 0) {
        queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ' ORDER BY l.updated_at DESC, l.created_at DESC';

    console.log("[ListModel findListsByUser] Executing query:", queryText, params);
    try {
        const result: QueryResult<RawListRow> = await db.query(queryText, params);
        return (result.rows || []).map(formatListForResponse).filter((list): list is List => list !== null);
    } catch(error) {
        console.error(`[ListModel findListsByUser] Error for user ${userId}:`, error);
        throw error;
    }
};

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
        return result.rows[0]; // Return raw row or undefined
    } catch (error) {
        console.error(`[ListModel findListById] Error fetching list ${listId}:`, error);
        throw error;
    }
};

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
        LEFT JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id
        WHERE li.list_id = $1
        ORDER BY li.added_at DESC;
    `;
    try {
        const result: QueryResult<RawListItemRow> = await db.query(query, [listId]);
        return (result.rows || []).map(formatListItemForResponse).filter((item): item is ListItem => item !== null);
    } catch (error) {
        console.error(`[ListModel findListItemsByListId] Error fetching items for list ${listId}:`, error);
        throw error;
    }
};


// Other functions (createList, updateList, etc.) should also apply formatting before returning
// Example for createList:
export const createList = async (listData: Partial<List> & { name: string }, userId: number, userHandle: string): Promise<List> => {
     console.log(`[ListModel] Creating list for user <span class="math-inline">\{userId\} \(</span>{userHandle})`, listData);
     const { name, description = null, is_public = true, type = 'mixed', tags = [], city_name = null } = listData;
     // Use list_type for the database column
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
         return formatted;
     } catch (error) {
         console.error(`[ListModel createList] Error for user ${userId}:`, error);
         throw error;
     }
 };

 // Example for updateList:
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
        return formatListForResponse(result.rows[0]);
    } catch (error) {
        console.error(`[ListModel updateList] Error updating list ${listId}:`, error);
        throw error;
    }
 };

 // --- Other functions need similar review and application of formatters ---
 export const addItemToList = async (listId: number, itemId: number, itemType: 'restaurant' | 'dish'): Promise<{ id: number; list_id: number; item_id: number; item_type: string; added_at: string }> => {
    if (isNaN(listId) || listId <= 0 || isNaN(itemId) || itemId <= 0 || !['restaurant', 'dish'].includes(itemType)) {
         throw new Error('Invalid arguments for addItemToList.');
    }
    console.log(`[ListModel] Adding item <span class="math-inline">\{itemType\}\:</span>{itemId} to list ${listId}`);
    const client = await db.getClient(); // Use transaction
    try {
        await client.query('BEGIN');
        // 1. Check compatibility
        const listCheck = await client.query<{ list_type: string }>('SELECT list_type FROM lists WHERE id = $1 FOR UPDATE', [listId]);
        if (listCheck.rows.length === 0) throw new Error('List not found.');
        const listType = listCheck.rows[0].list_type;
        if (listType !== 'mixed' && itemType !== listType) {
            throw new Error(`Cannot add a ${itemType} to a list restricted to ${listType}s.`);
        }
        // 2. Check if item already exists
        const checkQuery = 'SELECT id FROM listitems WHERE list_id = $1 AND item_type = $2 AND item_id = $3';
        const checkResult = await client.query(checkQuery, [listId, itemType, itemId]);
        if (checkResult.rows.length > 0) {
            const error: any = new Error("Item already exists in list.");
            error.status = 409;
            throw error;
        }
        // 3. Insert the item
        const insertQuery = `
            INSERT INTO ListItems (list_id, item_id, item_type, added_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, list_id, item_id, item_type, added_at;
        `;
        console.log('[ListModel addItemToList] Insert Query:', insertQuery, 'Params:', [listId, itemId, itemType]);
        const result = await client.query(insertQuery, [listId, itemId, itemType]);
        // 4. Update the list's timestamp
        await client.query('UPDATE Lists SET updated_at = NOW() WHERE id = $1', [listId]);
        await client.query('COMMIT');

        if (!result.rows[0]) throw new Error("Failed to add item, no row returned.");
        // Return the structured data expected by the service/frontend
        return {
            id: parseInt(result.rows[0].id, 10),
            list_id: parseInt(result.rows[0].list_id, 10),
            item_id: parseInt(result.rows[0].item_id, 10),
            item_type: result.rows[0].item_type,
            added_at: result.rows[0].added_at,
        };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[ListModel addItemToList] Error adding item to list ${listId}:`, err);
        throw err; // Re-throw error
    } finally {
        client.release();
    }
 };