/* src/doof-backend/models/listModel.js */
import db from '../db/index.js';
import { formatList, formatListItem } from '../utils/formatters.js';
import format from 'pg-format';

export const findListItemsPreview = async (listId, limit = 3) => { /* ... */ };

export const findListsByUser = async (userId, { createdByUser, followedByUser, allLists, limit = 10, offset = 0, cityId, boroughId, neighborhoodId, query, hashtags }) => {
  console.log('[ListModel findListsByUser] Called with params:', { userId, createdByUser, followedByUser, allLists, limit, offset, cityId, boroughId, neighborhoodId, query, hashtags });
  try {
    let baseQuery = `
      SELECT l.*, 
             COUNT(DISTINCT li.id) as item_count
      FROM lists l
      LEFT JOIN listitems li ON l.id = li.list_id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (!userId || (!createdByUser && !followedByUser)) {
      console.log('[ListModel findListsByUser] Adding public list filter');
      baseQuery += ` AND (l.is_public = $${paramIndex++} OR l.user_id = $${paramIndex++})`;
      values.push(true);
      values.push(userId || null);
    }

    if (createdByUser && userId) {
      console.log('[ListModel findListsByUser] Adding createdByUser filter');
      baseQuery += ` AND l.user_id = $${paramIndex++}`;
      values.push(userId);
    }

    if (followedByUser && userId) {
      console.log('[ListModel findListsByUser] Adding followedByUser filter');
      baseQuery += `
        AND l.id IN (
          SELECT list_id FROM list_followers WHERE user_id = $${paramIndex++}
        )
      `;
      values.push(userId);
    }

    if (cityId) {
      console.log('[ListModel findListsByUser] Adding cityId filter');
      baseQuery += ` AND l.city_id = $${paramIndex++}`;
      values.push(cityId);
    }
    if (boroughId) {
      console.log('[ListModel findListsByUser] Adding boroughId filter');
      baseQuery += ` AND l.borough_id = $${paramIndex++}`;
      values.push(boroughId);
    }
    if (neighborhoodId) {
      console.log('[ListModel findListsByUser] Adding neighborhoodId filter');
      baseQuery += ` AND l.neighborhood_id = $${paramIndex++}`;
      values.push(neighborhoodId);
    }

    if (query) {
      console.log('[ListModel findListsByUser] Adding search query filter');
      baseQuery += ` AND (l.name ILIKE $${paramIndex++} OR l.description ILIKE $${paramIndex++})`;
      values.push(`%${query}%`, `%${query}%`);
    }

    if (hashtags && hashtags.length > 0) {
      console.log('[ListModel findListsByUser] Adding hashtags filter');
      const hashtagPlaceholders = hashtags.map(() => `$${paramIndex++}`).join(',');
      baseQuery += `
        AND l.id IN (
          SELECT list_id FROM list_hashtags WHERE hashtag IN (${hashtagPlaceholders})
        )
      `;
      values.push(...hashtags);
    }

    baseQuery += `
      GROUP BY l.id
      ORDER BY l.updated_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    values.push(limit, offset);

    console.log('[ListModel findListsByUser] Final query:', baseQuery);
    console.log('[ListModel findListsByUser] Query values:', values);

    const result = await db.query(baseQuery, values);
    console.log('[ListModel findListsByUser] Query result:', result.rows);

    let countQuery = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM lists l
      WHERE 1=1
    `;
    const countValues = [];
    paramIndex = 1;

    if (!userId || (!createdByUser && !followedByUser)) {
      countQuery += ` AND (l.is_public = $${paramIndex++} OR l.user_id = $${paramIndex++})`;
      countValues.push(true);
      countValues.push(userId || null);
    }
    if (createdByUser && userId) {
      countQuery += ` AND l.user_id = $${paramIndex++}`;
      countValues.push(userId);
    }
    if (followedByUser && userId) {
      countQuery += `
        AND l.id IN (
          SELECT list_id FROM list_followers WHERE user_id = $${paramIndex++}
        )
      `;
      countValues.push(userId);
    }
    if (cityId) {
      countQuery += ` AND l.city_id = $${paramIndex++}`;
      countValues.push(cityId);
    }
    if (boroughId) {
      countQuery += ` AND l.borough_id = $${paramIndex++}`;
      countValues.push(boroughId);
    }
    if (neighborhoodId) {
      countQuery += ` AND l.neighborhood_id = $${paramIndex++}`;
      countValues.push(neighborhoodId);
    }
    if (query) {
      countQuery += ` AND (l.name ILIKE $${paramIndex++} OR l.description ILIKE $${paramIndex++})`;
      countValues.push(`%${query}%`, `%${query}%`);
    }
    if (hashtags && hashtags.length > 0) {
      const hashtagPlaceholders = hashtags.map(() => `$${paramIndex++}`).join(',');
      countQuery += `
        AND l.id IN (
          SELECT list_id FROM list_hashtags WHERE hashtag IN (${hashtagPlaceholders})
        )
      `;
      countValues.push(...hashtags);
    }

    console.log('[ListModel findListsByUser] Count query:', countQuery);
    console.log('[ListModel findListsByUser] Count query values:', countValues);

    const countResult = await db.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total, 10) || 0;
    console.log('[ListModel findListsByUser] Total count:', total);

    return {
      data: result.rows.map(row => ({
        ...formatList(row),
        item_count: parseInt(row.item_count, 10) || 0,
      })),
      total,
    };
  } catch (error) {
    console.error('[ListModel findListsByUser] Error fetching lists:', error);
    throw new Error('Database error fetching lists');
  }
};

export const findListItemsByListId = async (listId) => {
  const numericListId = parseInt(String(listId), 10);
  if (isNaN(numericListId) || numericListId <= 0) {
    console.warn(`[ListModel findListItemsByListId] Invalid listId: ${listId}`);
    return [];
  }
  const query = `
    SELECT li.*,
           r.name as restaurant_name,
           d.name as dish_name
    FROM listitems li
    LEFT JOIN restaurants r ON li.item_id = r.id AND li.item_type = 'restaurant'
    LEFT JOIN dishes d ON li.item_id = d.id AND li.item_type = 'dish'
    WHERE li.list_id = $1::integer
    ORDER BY li.added_at DESC
  `;
  try {
    const result = await db.query(query, [numericListId]);
    console.log(`[ListModel findListItemsByListId] Found ${result.rows.length} items for list ${numericListId}`);
    if (result.rows.length === 0) {
      return [];
    }
    return result.rows.map(row => {
      const formattedItem = formatListItem(row);
      if (!formattedItem) {
        return { name: row.item_type === 'restaurant' ? (row.restaurant_name || 'Unknown Restaurant') : (row.dish_name || 'Unknown Dish') };
      }
      if (row.item_type === 'restaurant') {
        formattedItem.name = row.restaurant_name || 'Unknown Restaurant';
      } else if (row.item_type === 'dish') {
        formattedItem.name = row.dish_name || 'Unknown Dish';
      } else {
        formattedItem.name = 'Unknown Item';
      }
      return formattedItem;
    });
  } catch (error) {
    console.error(`[ListModel findListItemsByListId] Error fetching items for list ${numericListId}:`, error);
    throw new Error(`Database error fetching items for list ${numericListId}`);
  }
};

export const findListByIdRaw = async (listId) => {
  const numericListId = parseInt(String(listId), 10);
  if (isNaN(numericListId) || numericListId <= 0) {
    console.warn(`[ListModel findListByIdRaw] Invalid listId: ${listId}`);
    return null;
  }
  console.log(`[ListModel findListByIdRaw] Querying for list ID: ${numericListId}`);
  const query = `SELECT * FROM lists WHERE id = $1::integer`;
  try {
    const result = await db.query(query, [numericListId]);
    if (result.rows.length === 0) {
      console.log(`[ListModel findListByIdRaw] List ${numericListId} not found in DB.`);
      return null;
    }
    console.log(`[ListModel findListByIdRaw] Found list ${numericListId} in DB.`);
    return result.rows[0];
  } catch (error) {
    console.error(`[ListModel findListByIdRaw] Error fetching list ${numericListId}:`, error);
    throw new Error(`Database error fetching list ${numericListId}`);
  }
};

export const createList = async (listData, userId, userHandle) => { /* ... */ };
export const updateList = async (listId, listData) => { /* ... */ };
export const addItemToList = async (listId, itemId, itemType, notes = null) => { /* ... */ };
export const checkListTypeCompatibility = async (listId, itemType) => { /* ... */ };
export const isFollowing = async (listId, userId) => { /* ... */ };
export const followList = async (listId, userId) => { /* ... */ };
export const unfollowList = async (listId, userId) => { /* ... */ };
export const toggleFollowList = async (listId, userId) => { /* ... */ };
export const updateListSavedCount = async (listId, adjustment) => { /* ... */ };
export const removeItemFromList = async (listId, listItemId) => { /* ... */ };
export const updateListVisibility = async (listId, is_public) => { /* ... */ };
export const deleteList = async (listId) => { /* ... */ };

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