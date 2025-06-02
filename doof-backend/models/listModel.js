import { logError, logWarn, logInfo } from '../utils/logger.js';
import db from '../db/index.js';
import { formatList, formatListItem } from '../utils/formatters.js';
import format from 'pg-format';

// ========== EXISTING LIST FUNCTIONS ==========

export const findListItemsPreview = async (listId, limit = 3) => {
  console.log(`[ListModel findListItemsPreview] Fetching up to ${limit} preview items for list ${listId}`);
  
  try {
    const listItemQuery = `
      SELECT li.id, li.item_id, li.item_type, li.added_at
      FROM listitems li
      WHERE li.list_id = $1
      ORDER BY li.added_at DESC
      LIMIT $2
    `;
    
    const result = await db.query(listItemQuery, [listId, limit]);
    
    if (result.rows.length === 0) {
      console.log(`[ListModel findListItemsPreview] No items found for list ${listId}`);
      return [];
    }
    
    const items = [];
    
    for (const row of result.rows) {
      let itemData = null;
      
      if (row.item_type === 'restaurant') {
        const restaurantQuery = 'SELECT id, name, cuisine, location FROM restaurants WHERE id = $1';
        const restaurantResult = await db.query(restaurantQuery, [row.item_id]);
        if (restaurantResult.rows.length > 0) {
          itemData = {
            ...restaurantResult.rows[0],
            type: 'restaurant'
          };
        }
      } else if (row.item_type === 'dish') {
        const dishQuery = 'SELECT id, name, description, restaurant_id FROM dishes WHERE id = $1';
        const dishResult = await db.query(dishQuery, [row.item_id]);
        if (dishResult.rows.length > 0) {
          itemData = {
            ...dishResult.rows[0],
            type: 'dish'
          };
        }
      }
      
      if (itemData) {
        items.push({
          listitem_id: row.id,
          item_id: row.item_id,
          item_type: row.item_type,
          added_at: row.added_at,
          item_data: itemData
        });
      }
    }
    
    console.log(`[ListModel findListItemsPreview] Found ${items.length} items for list ${listId}`);
    return items;
  } catch (error) {
    console.error(`[ListModel findListItemsPreview] Error fetching preview items for list ${listId}:`, error);
    throw new Error('Database error fetching list items preview.');
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
  sortBy = 'newest'
} = {}) => {
  console.log(`[ListModel findListsByUser] Searching lists for user ${userId} with filters:`, {
    createdByUser, followedByUser, allLists, limit, offset, cityId, query, hashtags, sortBy
  });

  let params = [];
  let paramIndex = 1;
  const addParam = (val) => {
    params.push(val);
    return `$${paramIndex++}`;
  };

  let baseQuery = `
    SELECT DISTINCT l.id, l.name, l.description, l.list_type, l.saved_count, 
           l.city_name, l.tags, l.is_public, l.creator_handle, l.user_id, 
           l.created_at, l.updated_at,
           u.username as creator_username,
           CASE WHEN lf.user_id IS NOT NULL THEN true ELSE false END as is_following,
           COUNT(li.id) as items_count
    FROM lists l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN listfollows lf ON l.id = lf.list_id AND lf.user_id = ${addParam(userId)}
    LEFT JOIN listitems li ON l.id = li.list_id
  `;

  let whereConditions = [];

  if (createdByUser) {
    whereConditions.push(`l.user_id = ${addParam(userId)}`);
  } else if (followedByUser) {
    whereConditions.push(`lf.user_id = ${addParam(userId)}`);
  } else if (!allLists) {
    whereConditions.push(`(l.user_id = ${addParam(userId)} OR l.is_public = true)`);
  }

  if (cityId) {
    const cityQuery = 'SELECT name FROM cities WHERE id = $1';
    const cityResult = await db.query(cityQuery, [cityId]);
    if (cityResult.rows.length > 0) {
      whereConditions.push(`l.city_name = ${addParam(cityResult.rows[0].name)}`);
    }
  }

  if (query) {
    whereConditions.push(`(
      LOWER(l.name) LIKE LOWER(${addParam(`%${query}%`)}) OR 
      LOWER(l.description) LIKE LOWER(${addParam(`%${query}%`)})
    )`);
  }

  if (hashtags.length > 0) {
    for (const hashtag of hashtags) {
      whereConditions.push(`${addParam(hashtag)} = ANY(l.tags)`);
    }
  }

  if (whereConditions.length > 0) {
    baseQuery += ` WHERE ${whereConditions.join(' AND ')}`;
  }

  baseQuery += ` GROUP BY l.id, u.username, lf.user_id`;

  const orderByClause = sortBy === 'oldest' ? 'l.created_at ASC' : 
                       sortBy === 'alphabetical' ? 'l.name ASC' :
                       sortBy === 'most_saved' ? 'l.saved_count DESC, l.created_at DESC' :
                       'l.created_at DESC';
  
  baseQuery += ` ORDER BY ${orderByClause}`;
  baseQuery += ` LIMIT ${addParam(limit)} OFFSET ${addParam(offset)}`;

  try {
    console.log(`[ListModel findListsByUser] Executing query:`, baseQuery);
    console.log(`[ListModel findListsByUser] With params:`, params);
    
    const result = await db.query(baseQuery, params);
    
    const formattedLists = result.rows.map(row => formatList({
      ...row,
      items_count: parseInt(row.items_count) || 0
    }));

    console.log(`[ListModel findListsByUser] Found ${formattedLists.length} lists for user ${userId}`);
    return formattedLists;
  } catch (error) {
    console.error(`[ListModel findListsByUser] Error fetching lists for user ${userId}:`, error);
    throw new Error('Database error fetching user lists.');
  }
};

export const findListItemsByListId = async (listId) => {
  console.log(`[ListModel findListItemsByListId] Fetching all items for list ${listId}`);
  
  try {
    // Complete query that properly handles both restaurants and dishes
    const result = await db.query(`
      SELECT 
        li.id as list_item_id,
        li.item_id,
        li.item_type,
        li.added_at,
        li.notes,
        
        -- Restaurant fields (only populated when item_type = 'restaurant')
        CASE WHEN li.item_type = 'restaurant' THEN li.item_id ELSE NULL END as restaurant_id,
        r.name as restaurant_name,
        r.cuisine,
        r.address,
        r.city_name as restaurant_city,
        
        -- Dish fields (only populated when item_type = 'dish')
        CASE WHEN li.item_type = 'dish' THEN li.item_id ELSE NULL END as dish_id,
        d.name as dish_name,
        d.description as dish_description,
        d.restaurant_id as dish_restaurant_id,
        dr.name as dish_restaurant_name
        
      FROM listitems li
      LEFT JOIN restaurants r ON li.item_type = 'restaurant' AND li.item_id = r.id
      LEFT JOIN dishes d ON li.item_type = 'dish' AND li.item_id = d.id
      LEFT JOIN restaurants dr ON li.item_type = 'dish' AND d.restaurant_id = dr.id
      WHERE li.list_id = $1
      ORDER BY li.added_at DESC
    `, [listId]);
    
    console.log(`[ListModel findListItemsByListId] Query result:`, result.rows);
    
    // Format the results for the frontend with proper semantic fields
    const items = result.rows.map(row => {
      const baseItem = {
        list_item_id: row.list_item_id,
        id: row.list_item_id, // For frontend compatibility
        item_id: row.item_id,
        item_type: row.item_type,
        added_at: row.added_at,
        notes: row.notes || null,
      };
      
      if (row.item_type === 'restaurant') {
        return {
          ...baseItem,
          restaurant_id: row.restaurant_id,
          name: row.restaurant_name || `Restaurant ${row.item_id}`,
          restaurant_name: row.restaurant_name,
          cuisine: row.cuisine,
          address: row.address,
          city_name: row.restaurant_city,
          location: row.address, // Alias for compatibility
        };
      } else if (row.item_type === 'dish') {
        return {
          ...baseItem,
          dish_id: row.dish_id,
          name: row.dish_name || `Dish ${row.item_id}`,
          dish_name: row.dish_name,
          description: row.dish_description,
          restaurant_id: row.dish_restaurant_id, // Parent restaurant
          restaurant_name: row.dish_restaurant_name,
        };
      } else {
        // Custom items or other types
        return {
          ...baseItem,
          name: `${row.item_type} ${row.item_id}`,
        };
      }
    });
    
    console.log(`[ListModel findListItemsByListId] Returning ${items.length} formatted items`);
    return items;
  } catch (error) {
    console.error(`[ListModel findListItemsByListId] Error fetching items for list ${listId}:`, error);
    throw new Error('Database error fetching list items.');
  }
};

export const findListByIdRaw = async (listId) => {
  console.log(`[ListModel findListByIdRaw] Fetching list ${listId} (raw format)`);
  
  try {
    const query = `
      SELECT l.*, u.username as creator_username,
             COUNT(li.id) as items_count
      FROM lists l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN listitems li ON l.id = li.list_id
      WHERE l.id = $1
      GROUP BY l.id, u.username
    `;
    
    const result = await db.query(query, [listId]);
    
    if (result.rows.length === 0) {
      console.log(`[ListModel findListByIdRaw] List ${listId} not found`);
      return null;
    }
    
    const list = {
      ...result.rows[0],
      item_count: parseInt(result.rows[0].items_count) || 0
    };
    
    console.log(`[ListModel findListByIdRaw] Found list ${listId}:`, list.name);
    return list;
  } catch (error) {
    console.error(`[ListModel findListByIdRaw] Error fetching list ${listId}:`, error);
    throw new Error('Database error fetching list.');
  }
};

export const createList = async (listData) => {
  try {
    const { name, description, list_type, city_name, tags, is_public, creator_handle, user_id } = listData;
    
    const query = `
      INSERT INTO lists (name, description, list_type, city_name, tags, is_public, creator_handle, user_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, 
      description, 
      list_type || 'mixed', 
      city_name, 
      tags || [], 
      is_public !== false, 
      creator_handle, 
      user_id
    ]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create list');
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in createList:', error);
    throw new Error('Failed to create list');
  }
};

export const addItemToList = async (listId, itemId, itemType) => {
  console.log(`[ListModel addItemToList] Adding item ${itemId} (${itemType}) to list ${listId}`);
  
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

// ========== ADMIN FUNCTIONS ==========

/**
 * Get all lists with optional pagination and filtering
 */
export const getAllLists = async ({ page = 1, limit = 50, search = null, userId = null, listType = null, isPublic = null, sort = 'updated_at', order = 'desc' } = {}) => {
  try {
    let baseQuery = `
      SELECT 
        l.id,
        l.name,
        l.description,
        l.list_type,
        l.saved_count,
        l.city_name,
        l.tags,
        l.is_public,
        l.creator_handle,
        l.user_id,
        l.created_at,
        l.updated_at,
        u.username as creator_username,
        u.email as creator_email,
        COUNT(li.id) as items_count
      FROM lists l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN listitems li ON l.id = li.list_id
    `;
    
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Add search filter
    if (search) {
      conditions.push(`(
        LOWER(l.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(l.description) LIKE LOWER($${paramIndex}) OR
        LOWER(l.creator_handle) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add user filter
    if (userId) {
      conditions.push(`l.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }
    
    // Add list type filter
    if (listType) {
      conditions.push(`l.list_type = $${paramIndex}`);
      queryParams.push(listType);
      paramIndex++;
    }
    
    // Add public/private filter
    if (isPublic !== null) {
      conditions.push(`l.is_public = $${paramIndex}`);
      queryParams.push(isPublic);
      paramIndex++;
    }
    
    // Build WHERE clause
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add GROUP BY for aggregation
    baseQuery += ` GROUP BY l.id, u.username, u.email`;
    
    // Add sorting
    const validSortColumns = ['name', 'created_at', 'updated_at', 'saved_count', 'items_count', 'list_type'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'updated_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    if (sort === 'items_count') {
      baseQuery += ` ORDER BY items_count ${sortOrder}`;
    } else {
      baseQuery += ` ORDER BY l.${sortColumn} ${sortOrder}`;
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(baseQuery, queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM lists l';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, queryParams.slice(0, -2)); // Remove LIMIT and OFFSET params
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      lists: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        list_type: row.list_type,
        saved_count: row.saved_count || 0,
        city_name: row.city_name,
        tags: row.tags || [],
        is_public: row.is_public,
        creator_handle: row.creator_handle,
        user_id: row.user_id,
        creator_username: row.creator_username,
        creator_email: row.creator_email,
        item_count: parseInt(row.items_count) || 0,
        created_at: row.created_at,
        updated_at: row.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    logError('Error in getAllLists:', error);
    throw new Error('Failed to fetch lists');
  }
};

/**
 * Get a single list by ID
 */
export const getListById = async (id) => {
  try {
    const query = `
      SELECT 
        l.id,
        l.name,
        l.description,
        l.list_type,
        l.saved_count,
        l.city_name,
        l.tags,
        l.is_public,
        l.creator_handle,
        l.user_id,
        l.created_at,
        l.updated_at,
        u.username as creator_username,
        u.email as creator_email,
        COUNT(li.id) as items_count
      FROM lists l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN listitems li ON l.id = li.list_id
      WHERE l.id = $1
      GROUP BY l.id, u.username, u.email
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      list_type: row.list_type,
      saved_count: row.saved_count || 0,
      city_name: row.city_name,
      tags: row.tags || [],
      is_public: row.is_public,
      creator_handle: row.creator_handle,
      user_id: row.user_id,
      creator_username: row.creator_username,
      creator_email: row.creator_email,
      item_count: parseInt(row.items_count) || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } catch (error) {
    logError('Error in getListById:', error);
    throw new Error('Failed to fetch list');
  }
};

/**
 * Update a list
 */
export const updateList = async (id, updateData) => {
  try {
    const { name, description, list_type, city_name, tags, is_public, creator_handle } = updateData;
    
    const query = `
      UPDATE lists 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          list_type = COALESCE($3, list_type),
          city_name = COALESCE($4, city_name),
          tags = COALESCE($5, tags),
          is_public = COALESCE($6, is_public),
          creator_handle = COALESCE($7, creator_handle),
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    
    const result = await db.query(query, [name, description, list_type, city_name, tags, is_public, creator_handle, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in updateList:', error);
    throw new Error('Failed to update list');
  }
};

/**
 * Delete a list
 */
export const deleteList = async (id) => {
  try {
    const query = 'DELETE FROM lists WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in deleteList:', error);
    throw new Error('Failed to delete list');
  }
};

/**
 * Bulk validate lists data
 */
export const bulkValidateLists = async (listsData) => {
  try {
    const validatedLists = [];
    const errors = [];
    
    for (let i = 0; i < listsData.length; i++) {
      const listData = listsData[i];
      const rowErrors = [];
      
      // Validate required fields
      if (!listData.name || typeof listData.name !== 'string' || listData.name.trim().length === 0) {
        rowErrors.push('Name is required and must be a non-empty string');
      }
      
      // Validate list_type
      if (listData.list_type && !['restaurant', 'dish', 'mixed'].includes(listData.list_type)) {
        rowErrors.push('List type must be one of: restaurant, dish, mixed');
      }
      
      // Validate is_public
      if (listData.is_public !== undefined && typeof listData.is_public !== 'boolean') {
        rowErrors.push('is_public must be a boolean');
      }
      
      // Validate tags array
      if (listData.tags && !Array.isArray(listData.tags)) {
        rowErrors.push('Tags must be an array');
      }
      
      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, errors: rowErrors });
      } else {
        validatedLists.push({
          ...listData,
          list_type: listData.list_type || 'mixed',
          is_public: listData.is_public !== false,
          tags: listData.tags || []
        });
      }
    }
    
    return {
      valid: validatedLists,
      errors: errors,
      isValid: errors.length === 0
    };
  } catch (error) {
    logError('Error in bulkValidateLists:', error);
    throw new Error('Failed to validate lists data');
  }
};

/**
 * Bulk create lists
 */
export const bulkCreateLists = async (listsData) => {
  try {
    if (!Array.isArray(listsData) || listsData.length === 0) {
      throw new Error('Lists data must be a non-empty array');
    }
    
    // Validate data first
    const validation = await bulkValidateLists(listsData);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }
    
    const values = validation.valid.map((list, index) => [
      list.name,
      list.description || null,
      list.list_type,
      list.city_name || null,
      list.tags,
      list.is_public,
      list.creator_handle || null,
      list.user_id || null
    ]);
    
    const query = format(`
      INSERT INTO lists (name, description, list_type, city_name, tags, is_public, creator_handle, user_id, created_at, updated_at)
      VALUES %L
      RETURNING *
    `, values.map(val => [...val, 'NOW()', 'NOW()']));
    
    const result = await db.query(query);
    
    return {
      success: true,
      created: result.rows,
      count: result.rows.length
    };
  } catch (error) {
    logError('Error in bulkCreateLists:', error);
    throw new Error('Failed to bulk create lists');
  }
};

// Export object for backward compatibility
export const ListModel = {
  findListsByUser,
  findListByIdRaw,
  findListItemsByListId,
  findListItemsPreview,
  createList,
  addItemToList,
  isFollowing,
  followList,
  unfollowList,
  toggleFollowList
}; 