// doof-backend/models/adminModel.js
import db from '../db/index.js';
import format from 'pg-format';
import {
  formatRestaurant,
  formatDish,
  formatUser,
  formatNeighborhood,
  formatList,
  formatListItem // Ensured this is imported
} from '../utils/formatters.js';

import * as RestaurantModel from './restaurantModel.js';
import * as DishModel from './dishModel.js';
import * as CityModel from './cityModel.js';
import * as NeighborhoodModel from './neighborhoodModel.js';
import * as HashtagModel from './hashtagModel.js';
// import * as RestaurantChainModel from './restaurantChainModel.js'; // Assuming this model might not exist or is not in use
import { ListModel } from './listModel.js'; // Assuming ListModel exports a named 'ListModel' object
import SubmissionModel from './submissionModel.js'; // Assuming default export

const identityFormatter = (item) => item;

// This resourceConfig needs to be VERY CAREFULLY aligned with your actual schema_dump.sql
// Especially allowedCreateColumns and allowedUpdateColumns.
const resourceConfig = {
  restaurants: {
    tableName: 'restaurants',
    formatter: formatRestaurant,
    allowedCreateColumns: ['name', 'address', 'city_id', 'neighborhood_id', 'zip_code', 'phone', 'website', 'instagram_handle', 'google_place_id', 'latitude', 'longitude', 'chain_id', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'address', 'city_id', 'neighborhood_id', 'zip_code', 'phone', 'website', 'instagram_handle', 'google_place_id', 'latitude', 'longitude', 'adds', 'chain_id', 'updated_at']
  },
  dishes: {
    tableName: 'dishes',
    formatter: formatDish,
    allowedCreateColumns: ['name', 'restaurant_id', 'description', 'price', 'is_common', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'restaurant_id', 'description', 'price', 'is_common', 'adds', 'updated_at']
  },
  users: {
    tableName: 'users',
    formatter: formatUser,
    allowedCreateColumns: ['username', 'email', 'password_hash', 'account_type', 'created_at'], // updated_at might be DB-managed
    allowedUpdateColumns: ['username', 'email', 'password_hash', 'account_type' /*, 'updated_at' */]
  },
  cities: {
    tableName: 'cities',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'has_boroughs' /*, 'created_at', 'updated_at' if added */],
    allowedUpdateColumns: ['name', 'has_boroughs' /*, 'updated_at' if added */]
  },
  neighborhoods: {
    tableName: 'neighborhoods',
    formatter: formatNeighborhood,
    allowedCreateColumns: ['name', 'city_id', 'borough', 'zipcode_ranges', 'parent_id', 'location_level', 'geom' /*, 'created_at', 'updated_at' if added */],
    allowedUpdateColumns: ['name', 'city_id', 'borough', 'zipcode_ranges', 'parent_id', 'location_level', 'geom' /*, 'updated_at' if added */]
  },
  hashtags: {
    tableName: 'hashtags',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'category' /*, 'created_at', 'updated_at' if added */],
    allowedUpdateColumns: ['name', 'category' /*, 'updated_at' if added */]
  },
  lists: {
    tableName: 'lists',
    formatter: formatList,
    allowedCreateColumns: ['user_id', 'name', 'description', 'list_type', 'city_name', 'tags', 'is_public', 'created_by_user', 'creator_handle', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'description', 'list_type', 'saved_count', 'city_name', 'tags', 'is_public', 'creator_handle', 'is_following', 'updated_at']
  },
  restaurant_chains: {
    tableName: 'restaurant_chains',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'website', 'description', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'website', 'description', 'updated_at']
  },
  submissions: {
    tableName: 'submissions',
    formatter: identityFormatter,
    allowedCreateColumns: ['user_id', 'type', 'name', 'location', 'tags', 'place_id', 'city', 'neighborhood', 'status', 'created_at', 'restaurant_id', 'restaurant_name', 'dish_id' /* if added */ , 'rejection_reason' /* if added */],
    allowedUpdateColumns: ['status', 'reviewed_by', 'reviewed_at', 'restaurant_id', 'dish_id' /* if added */, 'rejection_reason' /* if added */]
  },
  listitems: { // Ensures this key matches what adminController might use
    tableName: 'listitems',
    formatter: formatListItem, // Now correctly referenced
    allowedCreateColumns: ['list_id', 'item_type', 'item_id', 'notes', 'added_at'],
    allowedUpdateColumns: ['notes', 'added_at']
  }
};

const getResourceConfig = (resourceType) => {
  const config = resourceConfig[resourceType.toLowerCase()];
  if (!config) {
    throw new Error(`Unsupported resource type: ${resourceType}`);
  }
  return config;
};

export const findAllResources = async (resourceType, page = 1, limit = 20, sort = 'id', order = 'asc', filters = {}) => {
  const config = getResourceConfig(resourceType);
  const offset = (page - 1) * limit;
  let query = format('SELECT * FROM %I', config.tableName);
  const whereClauses = [];
  const queryParams = [];
  let paramIdx = 1;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const knownColumns = Array.from(new Set([...config.allowedCreateColumns, ...config.allowedUpdateColumns, 'id', 'created_at', 'updated_at']));
      if (knownColumns.includes(key) || ['search', 'status', 'city_id', 'restaurant_id', 'user_id', 'list_id', 'type'].includes(key)) {
        if (key === 'search' && (config.allowedCreateColumns.includes('name') || config.allowedUpdateColumns.includes('name'))) {
          whereClauses.push(format('LOWER(name) LIKE LOWER($%s)', paramIdx++));
          queryParams.push(`%${value}%`);
        } else if (key.endsWith('_id') || key === 'id' || key === 'user_id' || key === 'list_id') {
          const parsedValue = parseInt(value, 10);
          if (!isNaN(parsedValue)) {
            whereClauses.push(format('%I = $%s', key, paramIdx++));
            queryParams.push(parsedValue);
          }
        } else if (typeof value === 'string' && (config.allowedUpdateColumns.includes(key) || config.allowedCreateColumns.includes(key) || key === 'status' || key === 'type')) {
          if (key === 'status' || key === 'type') {
            whereClauses.push(format('%I = $%s', key, paramIdx++));
            queryParams.push(value);
          } else {
            whereClauses.push(format('LOWER(%I) LIKE LOWER($%s)', key, paramIdx++));
            queryParams.push(`%${value}%`);
          }
        }
      }
    }
  });

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  const allKnownColumns = Array.from(new Set([...config.allowedCreateColumns, ...config.allowedUpdateColumns, 'id', 'created_at', 'updated_at', 'name']));
  const safeSort = allKnownColumns.includes(sort.toLowerCase()) ? sort : 'id';
  const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  query += format(' ORDER BY %I %s LIMIT $%s OFFSET $%s', safeSort, safeOrder, paramIdx++, paramIdx++);
  queryParams.push(limit, offset);

  let countQuery = format('SELECT COUNT(*) FROM %I', config.tableName);
  let totalCount;
  if (whereClauses.length > 0) {
    const countQueryParams = queryParams.slice(0, whereClauses.length);
    let tempCountQueryWhere = ' WHERE ' + whereClauses.join(' AND ');
    let currentPlaceholderCount = 1;
    tempCountQueryWhere = tempCountQueryWhere.replace(/\$\d+/g, () => `$${currentPlaceholderCount++}`);
    countQuery += tempCountQueryWhere;
    const { rows: totalRows } = await db.query(countQuery, countQueryParams);
    totalCount = parseInt(totalRows[0].count, 10);
  } else {
    const { rows: totalRows } = await db.query(countQuery);
    totalCount = parseInt(totalRows[0].count, 10);
  }

  try {
    const { rows } = await db.query(query, queryParams);
    return {
      data: rows.map(config.formatter || identityFormatter),
      total: totalCount,
    };
  } catch (error) {
    console.error(`Error in findAllResources for ${resourceType}:`, error.message, error.stack);
    throw error;
  }
};

export const findResourceById = async (resourceType, id) => {
  const config = getResourceConfig(resourceType);
  const query = format('SELECT * FROM %I WHERE id = $1', config.tableName);
  const { rows } = await db.query(query, [id]);
  if (rows.length === 0) return null;
  return (config.formatter || identityFormatter)(rows[0]);
};

export const createResource = async (resourceType, data) => {
  const config = getResourceConfig(resourceType);
  const columns = [];
  const values = [];
  const valuePlaceholders = [];
  let placeholderIndex = 1;

  config.allowedCreateColumns.forEach(col => {
    if (data.hasOwnProperty(col) && data[col] !== undefined) {
      columns.push(format('%I', col));
      values.push(data[col]);
      valuePlaceholders.push(format('$%s', placeholderIndex++));
    }
  });
  if (columns.length === 0) throw new Error('No valid columns provided for creation.');

  const query = format('INSERT INTO %I (%s) VALUES (%s) RETURNING *', config.tableName, columns.join(', '), valuePlaceholders.join(', '));
  const { rows } = await db.query(query, values);
  return (config.formatter || identityFormatter)(rows[0]);
};

export const updateResource = async (resourceType, id, data) => {
  const config = getResourceConfig(resourceType);
  const setClauses = [];
  const values = [];
  let placeholderIndex = 1;

  config.allowedUpdateColumns.forEach(col => {
    if (data.hasOwnProperty(col)) {
      setClauses.push(format('%I = $%s', col, placeholderIndex++));
      values.push(data[col]);
    }
  });

  if (!data.hasOwnProperty('updated_at') && config.allowedUpdateColumns.includes('updated_at') && !['users', 'cities', 'neighborhoods', 'hashtags'].includes(config.tableName) ) {
      if (!setClauses.some(clause => clause.startsWith(format('%I', 'updated_at')))) {
          setClauses.push(format('%I = CURRENT_TIMESTAMP', 'updated_at'));
      }
  }
  if (setClauses.length === 0) {
    const existingItem = await findResourceById(resourceType, id);
    if (!existingItem) throw new Error(`${resourceType} with ID ${id} not found for update.`);
    return existingItem;
  }

  values.push(id);
  const query = format('UPDATE %I SET %s WHERE id = $%s RETURNING *', config.tableName, setClauses.join(', '), placeholderIndex);
  const { rows } = await db.query(query, values);
  if (rows.length === 0) return null;
  return (config.formatter || identityFormatter)(rows[0]);
};

export const deleteResource = async (resourceType, id) => {
  const config = getResourceConfig(resourceType);
  if (resourceType.toLowerCase() === 'listitems') {
    const query = format('DELETE FROM %I WHERE id = $1 RETURNING *', config.tableName);
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  const query = format('DELETE FROM %I WHERE id = $1', config.tableName);
  const { rowCount } = await db.query(query, [id]);
  return rowCount > 0;
};

export const approveSubmission = async (submissionId, itemType, itemData, cityId, neighborhoodId, placeId, submittedByUserId, reviewedByAdminId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    let newItem;
    const commonItemData = { ...itemData, google_place_id: placeId };

    if (itemType === 'restaurant') {
      const restaurantData = { ...commonItemData, city_id: cityId, neighborhood_id: neighborhoodId, phone: commonItemData.phone || commonItemData.phone_number, };
      delete restaurantData.tags; delete restaurantData.type; delete restaurantData.phone_number;
      delete restaurantData.city_name; delete restaurantData.borough; delete restaurantData.neighborhood_name;
      newItem = await RestaurantModel.createRestaurant(restaurantData, client);
    } else if (itemType === 'dish') {
      if (!itemData.restaurant_id && !commonItemData.restaurant_id) throw new Error('Restaurant ID is required for dish submission.');
      const dishData = { ...commonItemData, restaurant_id: parseInt(itemData.restaurant_id || commonItemData.restaurant_id, 10), };
      delete dishData.type; delete dishData.city_id; delete dishData.neighborhood_id;
      delete dishData.city_name; delete dishData.borough; delete dishData.neighborhood_name;
      newItem = await DishModel.createDish(dishData, client);
    } else { throw new Error(`Unsupported item type for submission approval: ${itemType}`); }

    if (!newItem || !newItem.id) throw new Error(`Failed to create ${itemType} from submission or created item has no ID.`);

    let submissionUpdateQuery = `UPDATE submissions SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1 `;
    const updateValues = [reviewedByAdminId, submissionId];
    let itemFkColumn = null;
    if (itemType === 'restaurant') itemFkColumn = 'restaurant_id';
    // else if (itemType === 'dish') itemFkColumn = 'dish_id'; // Only if submissions table has dish_id

    if (itemFkColumn) {
        submissionUpdateQuery += `, ${itemFkColumn} = $${updateValues.length + 1} `;
        updateValues.push(parseInt(newItem.id, 10));
    }
    submissionUpdateQuery += ` WHERE id = $2 RETURNING *;`;

    const { rows: updatedSubmissionRows } = await client.query(submissionUpdateQuery, updateValues);
    if (updatedSubmissionRows.length === 0) throw new Error('Failed to update submission status after item creation.');

    await client.query('COMMIT');
    const formatter = getFormatterForResourceType(itemType) || identityFormatter;
    return formatter(newItem);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in approveSubmission model:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const rejectSubmission = async (submissionId, rejection_reason, reviewedByAdminId) => {
  const query = `
    UPDATE submissions
    SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = $2
    WHERE id = $3 AND status = 'pending' RETURNING *;
  `;
  try {
    const { rows } = await db.query(query, [reviewedByAdminId, rejection_reason, submissionId]);
    return rows.length > 0;
  } catch (error) {
    console.error('Error in rejectSubmission model:', error);
    throw error;
  }
};

export const bulkAddResources = async (resourceType, items, adminUserId) => {
    const config = getResourceConfig(resourceType);
    const client = await db.getClient();
    const results = { successCount: 0, failureCount: 0, errors: [], createdItems: [] };
    try {
        await client.query('BEGIN');
        for (const item of items) {
            const columns = []; const values = []; const valuePlaceholders = []; let placeholderIndex = 1;
            if (!item.created_at && config.allowedCreateColumns.includes('created_at')) item.created_at = new Date();
            if (!item.updated_at && config.allowedCreateColumns.includes('updated_at')) item.updated_at = new Date();
            config.allowedCreateColumns.forEach(col => {
                if (item.hasOwnProperty(col) && item[col] !== undefined) {
                    if (resourceType === 'restaurants' && col === 'phone' && item.hasOwnProperty('phone_number')) {
                        columns.push(format('%I', 'phone')); values.push(item['phone_number']);
                    } else { columns.push(format('%I', col)); values.push(item[col]); }
                    valuePlaceholders.push(format('$%s', placeholderIndex++));
                }
            });
            if (columns.length === 0) { results.failureCount++; results.errors.push({ itemProvided: item, error: 'No valid columns for creation.' }); continue; }
            const query = format('INSERT INTO %I (%s) VALUES (%s) RETURNING *', config.tableName, columns.join(', '), valuePlaceholders.join(', '));
            try {
                const { rows } = await client.query(query, values);
                if (rows[0]) { results.createdItems.push((config.formatter || identityFormatter)(rows[0])); results.successCount++; }
                else { throw new Error('Insert did not return a record.'); }
            } catch (itemError) { results.failureCount++; results.errors.push({ itemProvided: item, error: itemError.message, detail: itemError.detail }); }
        }
        if (results.failureCount > 0 && results.successCount === 0) { await client.query('ROLLBACK'); }
        else { await client.query('COMMIT'); }
        return results;
    } catch (batchError) {
        await client.query('ROLLBACK'); console.error(`Critical error during bulk add for ${resourceType}:`, batchError); throw batchError;
    } finally { client.release(); }
};

export const checkExistingItems = async (resourceType, itemsToCheck) => {
  const config = getResourceConfig(resourceType);
  const results = [];
  for (const item of itemsToCheck) {
    let existingDbRecord = null; let checkQuery = null; const queryValues = [];
    if (resourceType === 'restaurants') {
        if (item.google_place_id) { checkQuery = format('SELECT * FROM %I WHERE google_place_id = $1 LIMIT 1', config.tableName); queryValues.push(item.google_place_id); }
        else if (item.name && item.city_id) { checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND city_id = $2 LIMIT 1', config.tableName); queryValues.push(item.name, parseInt(item.city_id, 10)); }
    } else if (resourceType === 'dishes') {
        if (item.name && item.restaurant_id) { checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND restaurant_id = $2 LIMIT 1', config.tableName); queryValues.push(item.name, parseInt(item.restaurant_id, 10)); }
    } else if (resourceType === 'cities') {
        if (item.name) { checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) LIMIT 1', config.tableName); queryValues.push(item.name); }
    } else if (resourceType === 'neighborhoods') {
        if (item.name && item.city_id) { checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND city_id = $2 LIMIT 1', config.tableName); queryValues.push(item.name, parseInt(item.city_id, 10)); }
    } else if (resourceType === 'hashtags') {
        if (item.name) { checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) LIMIT 1', config.tableName); queryValues.push(item.name); }
    }
    if (checkQuery) { const { rows } = await db.query(checkQuery, queryValues); if (rows.length > 0) existingDbRecord = rows[0]; }
    results.push({ item, existing: existingDbRecord ? (config.formatter || identityFormatter)(existingDbRecord) : null });
  }
  return results;
};
