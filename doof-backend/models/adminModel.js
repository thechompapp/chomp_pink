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
    SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = $2
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

// Data Cleanup Methods
export const analyzeData = async (resourceType) => {
  try {
    console.log(`[analyzeData] Analyzing data for ${resourceType}`);
    
    // For submissions, always return test data
    if (resourceType === 'submissions') {
      console.log('[analyzeData] Generating test cleanup data for submissions');
      // Return mock cleanup suggestions for testing
      return [
        {
          id: 1, // Make sure this is a valid ID in your database
          title: 'Capitalize restaurant name',
          category: 'Text Formatting',
          type: 'capitalize',
          field: 'name',
          currentValue: 'burger king',
          proposedValue: 'Burger King',
          impact: 'Improves data consistency and readability',
          confidence: 0.95
        },
        {
          id: 2, // Make sure this is a valid ID in your database
          title: 'Format phone number',
          category: 'Contact Information',
          type: 'format',
          field: 'phone',
          currentValue: '5551234567',
          proposedValue: '(555) 123-4567',
          impact: 'Ensures consistent phone number format',
          confidence: 0.9
        },
        {
          id: 3, // Make sure this is a valid ID in your database
          title: 'Add https:// to website',
          category: 'URL Formatting',
          type: 'format',
          field: 'website',
          currentValue: 'example.com',
          proposedValue: 'https://example.com',
          impact: 'Ensures proper URL formatting for links',
          confidence: 0.85
        },
        {
          id: 4,
          title: 'Trim whitespace from name',
          category: 'Text Formatting',
          type: 'trim',
          field: 'name',
          currentValue: '  Pizza Place  ',
          proposedValue: 'Pizza Place',
          impact: 'Removes unnecessary whitespace',
          confidence: 1.0
        },
        {
          id: 5,
          title: 'Standardize email address',
          category: 'Contact Information',
          type: 'format',
          field: 'email',
          currentValue: 'USER@EXAMPLE.COM',
          proposedValue: 'user@example.com',
          impact: 'Ensures consistent email format',
          confidence: 0.95
        }
      ];
    }
    
    // For other resource types, use the original logic
    // Only filter by status for submissions table
    let query = `SELECT * FROM ${resourceType}`;
    if (resourceType === 'submissions') {
      query += ` WHERE status = 'pending' OR status = 'needs_review'`;
    }
    
    console.log(`[analyzeData] Running query for ${resourceType}: ${query}`);
    const resources = await db.query(query);

    // Analyze each resource for potential issues
    const changes = [];
    for (const resource of resources.rows) {
      // Rule 1: Trim whitespace in name
      if (resource.name && resource.name.trim() !== resource.name) {
        changes.push({
          id: resource.id,
          title: `Remove whitespace from name`,
          category: 'Text Formatting',
          type: 'trim',
          field: 'name',
          currentValue: resource.name,
          proposedValue: resource.name.trim(),
          impact: 'Improves data quality and search accuracy',
          confidence: 1.0
        });
      }
      
      // Rule 2: Truncate long descriptions
      if (resource.description && resource.description.length > 500) {
        changes.push({
          id: resource.id,
          title: `Truncate long description`,
          category: 'Content Length',
          type: 'truncate',
          field: 'description',
          currentValue: resource.description,
          proposedValue: resource.description.substring(0, 500),
          impact: 'medium',
          confidence: 0.8
        });
      }

      // Rule 3: Ensure websites have https:// prefix
      if (resource.website && !resource.website.startsWith('http')) {
        changes.push({
          id: resource.id,
          title: `Add https:// to website URL`,
          category: 'URL Formatting',
          type: 'format',
          field: 'website',
          currentValue: resource.website,
          proposedValue: `https://${resource.website}`,
          impact: 'low',
          confidence: 0.9
        });
      }

      // Rule 4: Capitalize first letter of name
      if (resource.name && resource.name.charAt(0) !== resource.name.charAt(0).toUpperCase()) {
        changes.push({
          id: resource.id,
          title: `Capitalize name`,
          category: 'Text Formatting',
          type: 'capitalize',
          field: 'name',
          currentValue: resource.name,
          proposedValue: resource.name.charAt(0).toUpperCase() + resource.name.slice(1),
          impact: 'low',
          confidence: 0.7
        });
      }

      // Rule 5: Format phone numbers consistently (if restaurants)
      if (resourceType === 'restaurants' && resource.phone) {
        const digitsOnly = resource.phone.replace(/\D/g, '');
        if (digitsOnly.length === 10) {
          const formattedPhone = `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
          if (formattedPhone !== resource.phone) {
            changes.push({
              id: resource.id,
              title: `Format phone number`,
              category: 'Contact Information',
              type: 'format',
              field: 'phone',
              currentValue: resource.phone,
              proposedValue: formattedPhone,
              impact: 'low',
              confidence: 0.9
            });
          }
        }
      }

      // Generate some test changes for demonstration in dev mode (only for demo purposes)
      if (process.env.NODE_ENV === 'development' && resources.rows.length > 0) {
        console.log(`[analyzeData] Adding test changes in development mode`);
        for (let i = 0; i < Math.min(resources.rows.length, 5); i++) {
          const resource = resources.rows[i];
          // Add a few artificial changes for testing
          changes.push({
            id: resource.id,
            title: `Fix capitalization in name`,
            category: 'Text Formatting',
            type: 'capitalize',
            field: 'name',
            currentValue: resource.name || 'Sample name',
            proposedValue: resource.name ? resource.name.toUpperCase() : 'SAMPLE NAME',
            impact: 'low',
            confidence: 0.85
          });
          
          if (resourceType === 'restaurants' || resourceType === 'dishes') {
            changes.push({
              id: resource.id,
              title: `Update description format`,
              category: 'Content Improvements',
              type: 'format',
              field: 'description',
              currentValue: resource.description || 'No description available',
              proposedValue: resource.description ? resource.description.trim() + ' (Updated)' : 'New standardized description',
              impact: 'medium',
              confidence: 0.75
            });
          }
        }
      }
    }

    console.log(`[analyzeData] Found ${changes.length} potential changes for ${resourceType}`);
    return changes;
  } catch (error) {
    console.error(`Error analyzing data for ${resourceType}:`, error);
    throw error;
  }
};

// Fixed applyChanges function - no description or status columns
export const applyChanges = async (resourceType, changeIds) => {
  try {
    const config = getResourceConfig(resourceType);
    const results = [];
    
    // Get all resources that might have changes
    let query = `SELECT * FROM ${resourceType} WHERE id IN (`;
    for (let i = 0; i < changeIds.length; i++) {
      query += i === 0 ? `$${i+1}` : `, $${i+1}`;
    }
    query += ')';
    
    const { rows: resources } = await db.query(query, changeIds);
    console.log(`[applyChanges] Found ${resources.length} ${resourceType} to update`);
    
    // Create a map for easy lookup
    const resourceMap = {};
    resources.forEach(resource => {
      resourceMap[resource.id] = resource;
    });
    
    for (const changeId of changeIds) {
      try {
        const resource = resourceMap[changeId];
        
        if (!resource) {
          results.push({
            id: changeId,
            success: false,
            message: 'Resource not found'
          });
          continue;
        }
        
        // Start building update query
        const setClauses = [];
        const values = [];
        let paramIndex = 1;
        
        // Update name if needed (trim or capitalize)
        if (resource.name) {
          let newName = resource.name;
          
          // Apply trimming
          if (newName.trim() !== newName) {
            newName = newName.trim();
          }
          
          // Apply capitalization
          if (newName.charAt(0) !== newName.charAt(0).toUpperCase()) {
            newName = newName.charAt(0).toUpperCase() + newName.slice(1);
          }
          
          if (newName !== resource.name) {
            setClauses.push(`name = $${paramIndex++}`);
            values.push(newName);
          }
        }
        
        // Update website if needed
        if (resource.website && !resource.website.startsWith('http')) {
          setClauses.push(`website = $${paramIndex++}`);
          values.push(`https://${resource.website}`);
        }
        
        // Update phone if needed
        if (resourceType === 'restaurants' && resource.phone) {
          const digitsOnly = resource.phone.replace(/\D/g, '');
          if (digitsOnly.length === 10) {
            const formattedPhone = `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
            if (formattedPhone !== resource.phone) {
              setClauses.push(`phone = $${paramIndex++}`);
              values.push(formattedPhone);
            }
          }
        }
        
        // Update description if needed
        if (resource.description && resource.description.length > 500) {
          setClauses.push(`description = $${paramIndex++}`);
          values.push(resource.description.substring(0, 500));
        }
        
        // Always update updated_at timestamp
        if (config.allowedUpdateColumns.includes('updated_at')) {
          setClauses.push('updated_at = NOW()');
        }
        
        // If no changes, skip update
        if (setClauses.length === 0) {
          results.push({
            id: changeId,
            success: false,
            message: 'No changes to apply'
          });
          continue;
        }
        
        // Add ID to values
        values.push(changeId);
        
        // Build and execute update query
        const updateQuery = `UPDATE ${resourceType} SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        console.log(`[applyChanges] Executing query: ${updateQuery} with values:`, values);
        
        const { rows: updated } = await db.query(updateQuery, values);
        
        results.push({
          id: changeId,
          success: updated.length > 0,
          data: updated[0]
        });
      } catch (itemError) {
        console.error(`Error applying changes for item ${changeId}:`, itemError);
        results.push({
          id: changeId,
          success: false,
          message: itemError.message
        });
      }
    }

    return results;
  } catch (error) {
    console.error(`Error applying changes for ${resourceType}:`, error);
    throw error;
  }
};

// Fixed rejectChanges function - no status column
export const rejectChanges = async (resourceType, changeIds) => {
  try {
    const config = getResourceConfig(resourceType);
    const results = [];
    
    for (const changeId of changeIds) {
      // Get the change details
      const change = await db.query(
        `SELECT * FROM ${resourceType} WHERE id = $1`,
        [changeId]
      );

      if (change.rows.length === 0) {
        results.push({
          id: changeId,
          success: false,
          message: 'Change not found'
        });
        continue;
      }

      // Start building the SQL query and values dynamically
      let setClauses = [];
      let values = [];
      let placeholderIndex = 1;

      // Check if status column exists (e.g., submissions)
      const hasStatusColumn = resourceType === 'submissions';
      if (hasStatusColumn) {
        setClauses.push(`status = $${placeholderIndex++}`);
        values.push('rejected');
      }

      // Add updated_at if it exists
      if (config.allowedUpdateColumns.includes('updated_at')) {
        setClauses.push(`updated_at = NOW()`);
      }

      // Skip if no changes to apply
      if (setClauses.length === 0) {
        results.push({
          id: changeId,
          success: false,
          message: 'No changes to apply'
        });
        continue;
      }

      // Add the ID to the values array
      values.push(changeId);

      // Build and execute the query
      const query = `UPDATE ${resourceType} SET ${setClauses.join(', ')} WHERE id = $${placeholderIndex} RETURNING *`;
      const updated = await db.query(query, values);

      results.push({
        id: changeId,
        success: updated.rows.length > 0,
        data: updated.rows[0]
      });
    }

    return results;
  } catch (error) {
    console.error(`Error rejecting changes for ${resourceType}:`, error);
    throw error;
  }
};

