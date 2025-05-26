/* src/doof-backend/models/listModel.js */
import db from '../db/index.js';
import { formatList, formatListItem } from '../utils/formatters.js';
// pg-format is not strictly needed for these functions as currently written
// import format from 'pg-format';

export const findListItemsPreview = async (listId, limit = 3) => {
    console.log(`[ListModel findListItemsPreview] Called for listId: ${listId}, limit: ${limit}`);
    const numericListId = parseInt(String(listId), 10);
    if (isNaN(numericListId) || numericListId <= 0) {
        console.warn(`[ListModel findListItemsPreview] Invalid listId: ${listId}`);
        return [];
    }

    // Fetches city_name via JOINs, photo_url is explicitly NULL
    const query = `
      SELECT
        li.id as list_item_id,
        li.item_id,
        li.item_type,
        li.added_at,
        CASE
          WHEN li.item_type = 'restaurant' THEN r.name
          WHEN li.item_type = 'dish' THEN d.name
          ELSE NULL
        END as name,
        NULL AS photo_url, -- No photo_url from restaurant table
        CASE
          WHEN li.item_type = 'dish' THEN dr.name
          ELSE NULL
        END as restaurant_name,
        CASE
          WHEN li.item_type = 'restaurant' THEN r_city.name
          WHEN li.item_type = 'dish' THEN dr_city.name
          ELSE NULL
        END as city_name
      FROM listitems li
      LEFT JOIN restaurants r ON li.item_id = r.id AND li.item_type = 'restaurant'
      LEFT JOIN cities r_city ON r.city_id = r_city.id
      LEFT JOIN dishes d ON li.item_id = d.id AND li.item_type = 'dish'
      LEFT JOIN restaurants dr ON d.restaurant_id = dr.id
      LEFT JOIN cities dr_city ON dr.city_id = dr_city.id
      WHERE li.list_id = $1::integer
      ORDER BY li.added_at DESC
      LIMIT $2::integer
    `;
    try {
        const result = await db.query(query, [numericListId, limit]);
        console.log(`[ListModel findListItemsPreview] Found ${result.rows.length} items for list ${numericListId}`);
        return result.rows.map(row => {
            return {
                id: row.item_id,
                list_item_id: row.list_item_id,
                item_type: row.item_type,
                name: row.name || (row.item_type === 'restaurant' ? 'Restaurant' : 'Dish'),
                photo_url: row.photo_url, // Will be null
                restaurant_name: row.restaurant_name,
                city: row.city_name,
                added_at: row.added_at
            };
        });
    } catch (error) {
        console.error(`[ListModel findListItemsPreview] Error fetching preview items for list ${numericListId}:`, error);
        throw new Error(`Database error fetching preview items for list ${numericListId}.`);
    }
};


export const findListsByUser = async (userId, { 
  createdByUser, 
  followedByUser, 
  allLists, 
  limit = 10, 
  offset = 0, 
  cityId, 
  query, 
  hashtags = [],
  sortBy = 'newest' // Default to 'newest' if not specified
} = {}) => {
  console.log('[ListModel findListsByUser] Starting with params:', { 
    userId, 
    createdByUser, 
    followedByUser, 
    allLists, 
    limit, 
    offset, 
    cityId, 
    query, 
    hashtags,
    sortBy
  });

  // Initialize arrays for query parameters
  const mainValues = [];
  let paramIndex = 1;
  const addParam = (val) => {
    mainValues.push(val);
    return `$${paramIndex++}`;
  };

  // Build the SELECT clause with all necessary fields
  const selectClause = `
    SELECT l.*,
           COALESCE(u.username, l.creator_handle, 'unknown') as creator_handle,
           (SELECT COUNT(*) FROM listitems li WHERE li.list_id = l.id) as item_count,
           (CASE WHEN $1::INTEGER > 0 AND EXISTS (
             SELECT 1 FROM list_follows lf WHERE lf.list_id = l.id AND lf.user_id = $1::INTEGER
           ) THEN TRUE ELSE FALSE END) as is_following,
           (CASE WHEN l.user_id = $1::INTEGER THEN TRUE ELSE FALSE END) as created_by_user,
           u.username as owner_username
  `;

  // Build the FROM clause with necessary joins
  let fromClause = `
    FROM lists l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN listitems li ON l.id = li.list_id
  `;

  // Build the WHERE conditions
  const conditions = [];
  
  // Add user ID parameter for the main query
  // Use a placeholder value if userId is null to avoid SQL errors
  const userIdParam = addParam(userId || -1); // -1 is an invalid user ID
  
  // Handle different view types
  if (createdByUser && userId) {
    conditions.push(`l.user_id = $1`);
  } else if (followedByUser && userId) {
    // Use EXISTS to check if user is following the list
    conditions.push(`EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1)`);
  } else if (allLists && userId) {
    // Show all public lists or lists owned by the user
    conditions.push(`(l.is_public = TRUE OR l.user_id = $1)`);
  } else if (userId) {
    // Default: show user's own lists and public lists
    conditions.push(`(l.is_public = TRUE OR l.user_id = $1)`);
  } else {
    // No user ID provided, only show public lists
    conditions.push(`l.is_public = TRUE`);
  }

  // Add city filter if provided
  if (cityId) {
    const cityNameQuery = `SELECT name FROM cities WHERE id = ${addParam(cityId)}`;
    conditions.push(`l.city_name = (${cityNameQuery})`);
  }

  // Add search query filter
  if (query) {
    const searchTerm = `%${query}%`;
    conditions.push(`(l.name ILIKE ${addParam(searchTerm)} OR l.description ILIKE ${addParam(searchTerm)})`);
  }

  // Add hashtags filter
  if (hashtags && hashtags.length > 0) {
    const tagConditions = hashtags.map(tag => `l.tags @> ARRAY[${addParam(tag)}]`).join(' OR ');
    conditions.push(`(${tagConditions})`);
  }

  // Build the final WHERE clause
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build the ORDER BY clause
  let orderByClause = '';
  if (sortBy === 'newest') {
    orderByClause = 'ORDER BY updated_at DESC';
  } else if (sortBy === 'popular') {
    orderByClause = 'ORDER BY saved_count DESC, updated_at DESC';
  } else {
    // Default sorting
    orderByClause = 'ORDER BY updated_at DESC';
  }

  // Build the main query
  const mainQuery = `
    SELECT * FROM (
      ${selectClause}
      ${fromClause}
      ${whereClause}
      GROUP BY l.id, u.username
    ) as list_data
    ${orderByClause}
    LIMIT ${addParam(limit)} OFFSET ${addParam(offset)}
  `;

  // Build the count query - use a simpler approach with the same WHERE clause
  // but without the parameterized values to avoid binding issues
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT DISTINCT l.id
      FROM lists l
      LEFT JOIN users u ON l.user_id = u.id
      ${followedByUser && userId ? 'JOIN list_follows lf ON l.id = lf.list_id' : ''}
      WHERE l.is_public = TRUE
    ) as subq
  `;
  
  // For count query, we don't need to pass any parameters since we're just counting public lists
  const countValues = [];

  console.log('[ListModel findListsByUser] Main Query:', mainQuery);
  console.log('[ListModel findListsByUser] Query Params:', mainValues);
  console.log('[ListModel findListsByUser] Count Query:', countQuery);

  try {
    console.log('[ListModel findListsByUser] Executing main query:', mainQuery);
    console.log('[ListModel findListsByUser] With parameters:', mainValues);
    
    // Execute the main query
    const mainResult = await db.query(mainQuery, mainValues);
    console.log(`[ListModel findListsByUser] Found ${mainResult.rows.length} lists`);
    
    if (mainResult.rows.length > 0) {
      console.log('[ListModel findListsByUser] First row sample:', JSON.stringify(mainResult.rows[0], null, 2));
    }

    console.log('[ListModel findListsByUser] Executing count query:', countQuery);
    // Execute the count query without parameters
    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0]?.total, 10) || 0;
    console.log(`[ListModel findListsByUser] Total matching lists: ${total}`);

    // Format the results
    const formattedData = mainResult.rows.map(row => {
      const formatted = formatList(row);
      console.log(`[ListModel findListsByUser] Formatted row:`, JSON.stringify(formatted, null, 2));
      return formatted;
    });

    // Return the results
    return {
      data: formattedData,
      total,
    };
  } catch (error) {
    console.error('[ListModel findListsByUser] Database error:', {
      error: error.message,
      code: error.code,
      query: error.query,
      parameters: error.parameters,
      stack: error.stack
    });
    
    // Provide more specific error messages for common issues
    if (error.code === '42P01') {
      throw new Error('Database table not found. Check if all migrations have been run.');
    } else if (error.code === '42703') {
      throw new Error('Database column not found. The schema may be out of date.');
    } else if (error.code === '22P02') {
      throw new Error('Invalid input syntax for integer. Check your query parameters.');
    }
    
    throw new Error(`Failed to fetch lists: ${error.message}`);
  }
};

export const findListItemsByListId = async (listId) => {
  const numericListId = parseInt(String(listId), 10);
  if (isNaN(numericListId) || numericListId <= 0) {
    console.warn(`[ListModel findListItemsByListId] Invalid listId: ${listId}`);
    return [];
  }
  // Corrected query:
  // - Fetches city_name and neighborhood_name via JOINs from actual tables.
  // - photo_url is explicitly NULL as it's not on the restaurants table.
  const query = `
    SELECT
      li.id AS list_item_id,
      li.item_id,
      li.item_type,
      li.added_at,
      CASE
        WHEN li.item_type = 'restaurant' THEN r.name
        WHEN li.item_type = 'dish' THEN d.name
        ELSE 'Unknown Item'
      END as name,
      CASE
        WHEN li.item_type = 'restaurant' THEN r_city.name
        WHEN li.item_type = 'dish' THEN dr_city.name
        ELSE NULL
      END as city,
      CASE
        WHEN li.item_type = 'restaurant' THEN r_hood.name
        WHEN li.item_type = 'dish' THEN dr_hood.name
        ELSE NULL
      END as neighborhood,
      CASE
        WHEN li.item_type = 'dish' THEN dr.name
        ELSE NULL
      END as restaurant_name,
      NULL AS photo_url, -- Set to NULL as per schema and user instruction
      CASE
        WHEN li.item_type = 'restaurant' THEN ARRAY(SELECT h.name FROM restauranthashtags rht JOIN hashtags h ON rht.hashtag_id = h.id WHERE rht.restaurant_id = r.id)
        WHEN li.item_type = 'dish' THEN ARRAY(SELECT h.name FROM dishhashtags dht JOIN hashtags h ON dht.hashtag_id = h.id WHERE dht.dish_id = d.id)
        ELSE ARRAY[]::TEXT[]
      END as tags
    FROM listitems li
    LEFT JOIN restaurants r ON li.item_id = r.id AND li.item_type = 'restaurant'
    LEFT JOIN cities r_city ON r.city_id = r_city.id
    LEFT JOIN neighborhoods r_hood ON r.neighborhood_id = r_hood.id
    LEFT JOIN dishes d ON li.item_id = d.id AND li.item_type = 'dish'
    LEFT JOIN restaurants dr ON d.restaurant_id = dr.id
    LEFT JOIN cities dr_city ON dr.city_id = dr_city.id
    LEFT JOIN neighborhoods dr_hood ON dr.neighborhood_id = dr_hood.id
    WHERE li.list_id = $1::integer
    ORDER BY li.added_at ASC
  `;
  try {
    const result = await db.query(query, [numericListId]);
    console.log(`[ListModel findListItemsByListId] Found ${result.rows.length} items for list ${numericListId}`);
    return result.rows.map(row => {
      const itemDataForFormatter = {
        id: row.list_item_id,
        item_id: row.item_id,
        item_type: row.item_type,
        name: row.name,
        added_at: row.added_at,
        restaurant_name: row.restaurant_name,
        city: row.city,
        neighborhood: row.neighborhood,
        photo_url: row.photo_url, // Will be null
        tags: row.tags || [],
      };
      const formatted = formatListItem(itemDataForFormatter);
      if (!formatted) {
          console.warn(`[ListModel findListItemsByListId] Failed to format item:`, itemDataForFormatter);
          return null;
      }
      return formatted;
    }).filter(item => item !== null);
  } catch (error) {
    console.error(`[ListModel findListItemsByListId] Error fetching items for list ${numericListId}:`, error);
    throw new Error(`Database error fetching items for list ${numericListId}.`);
  }
};

export const findListByIdRaw = async (listId) => {
  const numericListId = parseInt(String(listId), 10);
  if (isNaN(numericListId) || numericListId <= 0) {
    console.warn(`[ListModel findListByIdRaw] Invalid listId: ${listId}`);
    return null;
  }
  console.log(`[ListModel findListByIdRaw] Querying for list ID: ${numericListId}`);
  const query = `
    SELECT l.*,
           COUNT(DISTINCT li.id) AS item_count,
           COALESCE(u.username, l.creator_handle) as resolved_creator_handle
    FROM lists l
    LEFT JOIN listitems li ON l.id = li.list_id
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.id = $1::integer
    GROUP BY l.id, u.username
  `;
  try {
    const result = await db.query(query, [numericListId]);
    if (result.rows.length === 0) {
      console.log(`[ListModel findListByIdRaw] List ${numericListId} not found in DB.`);
      return null;
    }
    const listRow = result.rows[0];
    console.log(`[ListModel findListByIdRaw] Found list ${numericListId} in DB:`, listRow);
    listRow.item_count = parseInt(listRow.item_count, 10) || 0;
    listRow.creator_handle = listRow.resolved_creator_handle || listRow.creator_handle;
    delete listRow.resolved_creator_handle;
    return listRow;
  } catch (error) {
    console.error(`[ListModel findListByIdRaw] Error fetching list ${numericListId}:`, error);
    throw new Error(`Database error fetching list ${numericListId}.`);
  }
};

export const createList = async (listData, userId, userHandle) => {
  console.log('[ListModel createList] Called with listData:', listData, `userId: ${userId}`, `userHandle: ${userHandle}`);
  const {
    name,
    description,
    list_type,
    is_public = true,
    tags = [],
    city_name // Expecting city_name (string) as lists table has city_name, not city_id
  } = listData;

  // The 'lists' table in schema_dump.sql has city_name VARCHAR(100), NO city_id.
  // So we directly insert the provided city_name.
  const query = `
    INSERT INTO lists (user_id, name, description, list_type, is_public, tags, city_name, creator_handle)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const queryTags = Array.isArray(tags) ? tags.map(String) : [];

  const values = [
    userId,
    name,
    description,
    list_type,
    is_public,
    queryTags,
    city_name || null, // Store the provided city_name string
    userHandle
  ];

  try {
    console.log('[ListModel createList] Executing query:', query);
    console.log('[ListModel createList] With values:', values);
    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      console.error('[ListModel createList] List creation failed, no row returned.');
      throw new Error('List creation failed, no data returned from database.');
    }
    const newListRaw = result.rows[0];
    console.log('[ListModel createList] Successfully created list (raw):', newListRaw);
    return findListByIdRaw(newListRaw.id);
  } catch (error) {
    console.error('[ListModel createList] Error creating list in database:', error);
    if (error.code === '23503') {
        // Check for specific foreign key constraints if possible, though lists.city_name is not an FK
        if (error.detail?.includes('user_id')) throw new Error('Invalid user reference for creating list.');
        throw new Error('Invalid reference for creating list.');
    }
    if (error.code === '23505') {
        throw new Error('A list with this identifying information already exists.');
    }
    throw new Error('Database error creating list.');
  }
};

export const updateList = async (listId, listData) => { console.warn("updateList is a placeholder"); return null; };

export const addItemToList = async (listId, itemId, itemType) => {
    console.log(`[ListModel addItemToList] Adding item ${itemId} (${itemType}) to list ${listId}`);
    // Ensure to use 'listitems' table
    const query = `
        INSERT INTO listitems (list_id, item_id, item_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (list_id, item_type, item_id) DO UPDATE
          SET added_at = CURRENT_TIMESTAMP
        RETURNING *;
    `;
    try {
        const result = await db.query(query, [listId, itemId, itemType]);
        if (result.rows.length === 0) {
            console.error(`[ListModel addItemToList] Failed to add or update item ${itemId} (${itemType}) in list ${listId}. No row returned.`);
            const checkQuery = `SELECT * FROM listitems WHERE list_id = $1 AND item_id = $2 AND item_type = $3`;
            const checkResult = await db.query(checkQuery, [listId, itemId, itemType]);
            if (checkResult.rows.length > 0) return checkResult.rows[0];
            throw new Error('Failed to add item to list and could not find existing item.');
        }
        console.log('[ListModel addItemToList] Item added/updated in listitems:', result.rows[0]);
        return result.rows[0];
    } catch (error) {
        console.error(`[ListModel addItemToList] Error adding item to list ${listId}:`, error);
        if (error.message && (error.message.includes('Invalid restaurant ID') || error.message.includes('Invalid dish ID'))) {
            throw new Error(error.message);
        }
        if (error.code === '23503') {
             throw new Error(`List with ID ${listId} does not exist.`);
        }
        throw new Error(`Database error adding item to list ${listId}.`);
    }
};

export const checkListTypeCompatibility = async (listId, itemTypeToAdd) => {
    console.log(`[ListModel checkListTypeCompatibility] Checking list ${listId} for itemType ${itemTypeToAdd}`);
    if (!['restaurant', 'dish'].includes(itemTypeToAdd)) {
        console.warn(`[ListModel checkListTypeCompatibility] Invalid itemTypeToAdd: ${itemTypeToAdd}`);
        return false;
    }
    try {
        const listQuery = 'SELECT list_type FROM lists WHERE id = $1';
        const { rows } = await db.query(listQuery, [listId]);
        if (rows.length === 0) {
            console.warn(`[ListModel checkListTypeCompatibility] List ${listId} not found.`);
            throw new Error(`List with ID ${listId} not found.`);
        }
        const currentListType = rows[0].list_type;
        console.log(`[ListModel checkListTypeCompatibility] Current list type: ${currentListType}`);

        if (currentListType === 'mixed') {
            return true;
        }
        return currentListType === itemTypeToAdd;
    } catch (error) {
        console.error(`[ListModel checkListTypeCompatibility] Error checking compatibility for list ${listId}:`, error);
        if (error.message.startsWith('List with ID')) throw error;
        throw new Error('Database error checking list type compatibility.');
    }
};

export const isFollowing = async (listId, userId) => {
    const query = 'SELECT 1 FROM listfollows WHERE list_id = $1 AND user_id = $2';
    try {
        const result = await db.query(query, [listId, userId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error(`[ListModel isFollowing] Error checking follow status for list ${listId}, user ${userId}:`, error);
        throw new Error('Database error checking follow status.');
    }
};

export const followList = async (listId, userId) => {
    const listCheck = await findListByIdRaw(listId);
    if (!listCheck) throw new Error(`List with ID ${listId} not found.`);
    const query = 'INSERT INTO listfollows (list_id, user_id) VALUES ($1, $2) ON CONFLICT (list_id, user_id) DO NOTHING RETURNING list_id';
    try {
        const result = await db.query(query, [listId, userId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error(`[ListModel followList] Error following list ${listId} for user ${userId}:`, error);
        if (error.code === '23503') throw new Error('Invalid user or list reference for follow.');
        throw new Error('Database error following list.');
    }
};

export const unfollowList = async (listId, userId) => {
    const query = 'DELETE FROM listfollows WHERE list_id = $1 AND user_id = $2 RETURNING list_id';
    try {
        const result = await db.query(query, [listId, userId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error(`[ListModel unfollowList] Error unfollowing list ${listId} for user ${userId}:`, error);
        throw new Error('Database error unfollowing list.');
    }
};

export const toggleFollowList = async (listId, userId) => {
  console.log(`[ListModel toggleFollowList] Toggling follow for user ${userId} on list ${listId}`);
  try {
    const list = await findListByIdRaw(listId);
    if (!list) {
        throw new Error(`List with ID ${listId} not found.`);
    }
    const isCurrentlyFollowing = await isFollowing(listId, userId);
    if (isCurrentlyFollowing) {
      console.log(`[ListModel toggleFollowList] User ${userId} is unfollowing list ${listId}`);
      await unfollowList(listId, userId);
      return false;
    } else {
      console.log(`[ListModel toggleFollowList] User ${userId} is following list ${listId}`);
      await followList(listId, userId);
      return true;
    }
  } catch (error) {
    console.error(`[ListModel toggleFollowList] Error toggling follow for list ${listId}:`, error);
    if (error.message.startsWith('List with ID')) throw error;
    throw new Error('Database error toggling follow status.');
  }
};

export const updateListSavedCount = async (listId, adjustment) => { console.warn("updateListSavedCount is a placeholder"); return null;};
export const removeItemFromList = async (listId, listItemId) => { console.warn("removeItemFromList is a placeholder"); return null; };
export const updateListVisibility = async (listId, is_public) => { console.warn("updateListVisibility is a placeholder"); return null; };
export const deleteList = async (listId) => { console.warn("deleteList is a placeholder"); return null; };

export const ListModel = {
  findListsByUser,
  findListByIdRaw,
  findListItemsByListId,
  findListItemsPreview,
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