import db from '../../db/index.js';
import format from 'pg-format';
import { getResourceConfig, logAdminOperation, createAdminModelError } from './AdminBaseModel.js';

/**
 * AdminQueryBuilder - Handles all database query construction for admin operations
 * Centralizes query logic and provides consistent, secure database interactions
 */

/**
 * Builds a SELECT query for finding all resources with optional joins and filtering
 * @param {string} resourceType - Type of resource to query
 * @param {number} page - Page number for pagination
 * @param {number} limit - Number of items per page
 * @param {string} sort - Column to sort by
 * @param {string} order - Sort order (asc/desc)
 * @param {object} filters - Additional filters to apply
 * @returns {object} Query object with query string and count query
 */
export const buildFindAllQuery = (resourceType, page = 1, limit = 20, sort = 'id', order = 'asc', filters = {}) => {
  const config = getResourceConfig(resourceType);
  const offset = (page - 1) * limit;
  
  let query;
  let countQuery;
  
  // Build resource-specific queries with appropriate joins
  switch (resourceType.toLowerCase()) {
    case 'dishes':
      query = format(`
        SELECT 
          d.*,
          r.name AS restaurant_name,
          r.address AS restaurant_address
        FROM %I d
        LEFT JOIN restaurants r ON d.restaurant_id = r.id
      `, config.tableName);
      countQuery = format(`SELECT COUNT(*) FROM %I d LEFT JOIN restaurants r ON d.restaurant_id = r.id`, config.tableName);
      break;
      
    case 'restaurants':
      query = format(`
        SELECT 
          r.*,
          c.name AS city_name,
          n.name AS neighborhood_name
        FROM %I r
        LEFT JOIN cities c ON r.city_id = c.id
        LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
      `, config.tableName);
      countQuery = format(`SELECT COUNT(*) FROM %I r LEFT JOIN cities c ON r.city_id = c.id LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id`, config.tableName);
      break;
      
    case 'neighborhoods':
      query = format(`
        SELECT 
          n.*,
          c.name AS city_name
        FROM %I n
        LEFT JOIN cities c ON n.city_id = c.id
      `, config.tableName);
      countQuery = format(`SELECT COUNT(*) FROM %I n LEFT JOIN cities c ON n.city_id = c.id`, config.tableName);
      break;
      
    default:
      query = format('SELECT * FROM %I', config.tableName);
      countQuery = format('SELECT COUNT(*) FROM %I', config.tableName);
  }
  
  // Add WHERE clause for filters if provided
  const { whereClause, queryParams } = buildWhereClause(filters);
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
    countQuery += ` WHERE ${whereClause}`;
  }
  
  // Add ORDER BY and LIMIT
  query += format(' ORDER BY %I %s LIMIT $%s OFFSET $%s', 
    sort, order.toUpperCase(), queryParams.length + 1, queryParams.length + 2);
  
  return {
    query,
    countQuery,
    params: [...queryParams, limit, offset],
    countParams: queryParams
  };
};

/**
 * Builds WHERE clause from filters object
 * @param {object} filters - Filter conditions
 * @returns {object} WHERE clause and parameters
 */
export const buildWhereClause = (filters) => {
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  for (const [field, value] of Object.entries(filters)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string') {
        conditions.push(format('%I ILIKE $%d', field, paramIndex));
        params.push(`%${value}%`);
      } else {
        conditions.push(format('%I = $%d', field, paramIndex));
        params.push(value);
      }
      paramIndex++;
    }
  }
  
  return {
    whereClause: conditions.length > 0 ? conditions.join(' AND ') : '',
    queryParams: params
  };
};

/**
 * Builds a SELECT query for finding a single resource by ID
 * @param {string} resourceType - Type of resource to find
 * @param {number} id - Resource ID
 * @returns {object} Query object
 */
export const buildFindByIdQuery = (resourceType, id) => {
  const config = getResourceConfig(resourceType);
  
  let query;
  
  switch (resourceType.toLowerCase()) {
    case 'dishes':
      query = format(`
        SELECT 
          d.*,
          r.name AS restaurant_name,
          r.address AS restaurant_address
        FROM %I d
        LEFT JOIN restaurants r ON d.restaurant_id = r.id
        WHERE d.id = $1
      `, config.tableName);
      break;
      
    case 'restaurants':
      query = format(`
        SELECT 
          r.*,
          c.name AS city_name,
          n.name AS neighborhood_name
        FROM %I r
        LEFT JOIN cities c ON r.city_id = c.id
        LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
        WHERE r.id = $1
      `, config.tableName);
      break;
      
    case 'neighborhoods':
      query = format(`
        SELECT 
          n.*,
          c.name AS city_name
        FROM %I n
        LEFT JOIN cities c ON n.city_id = c.id
        WHERE n.id = $1
      `, config.tableName);
      break;
      
    default:
      query = format('SELECT * FROM %I WHERE id = $1', config.tableName);
  }
  
  return { query, params: [id] };
};

/**
 * Builds an INSERT query for creating new resources
 * @param {string} resourceType - Type of resource to create
 * @param {object} data - Data to insert
 * @returns {object} Query object
 */
export const buildCreateQuery = (resourceType, data) => {
  const config = getResourceConfig(resourceType);
  
  // Filter data to only allowed create columns
  const allowedData = {};
  for (const column of config.allowedCreateColumns) {
    if (data.hasOwnProperty(column)) {
      allowedData[column] = data[column];
    }
  }
  
  if (Object.keys(allowedData).length === 0) {
    throw new Error(`No valid columns provided for creating ${resourceType}`);
  }
  
  const columns = Object.keys(allowedData);
  const values = Object.values(allowedData);
  const placeholders = values.map((_, index) => `$${index + 1}`);
  
  const query = format(
    'INSERT INTO %I (%s) VALUES (%s) RETURNING *',
    config.tableName,
    columns.map(col => format('%I', col)).join(', '),
    placeholders.join(', ')
  );
  
  return { query, params: values };
};

/**
 * Builds an UPDATE query for modifying existing resources
 * @param {string} resourceType - Type of resource to update
 * @param {number} id - Resource ID
 * @param {object} data - Data to update
 * @returns {object} Query object
 */
export const buildUpdateQuery = (resourceType, id, data) => {
  const config = getResourceConfig(resourceType);
  
  // Filter data to only allowed update columns
  const allowedData = {};
  for (const column of config.allowedUpdateColumns) {
    if (data.hasOwnProperty(column)) {
      allowedData[column] = data[column];
    }
  }
  
  if (Object.keys(allowedData).length === 0) {
    throw new Error(`No valid columns provided for updating ${resourceType}`);
  }
  
  const columns = Object.keys(allowedData);
  const values = Object.values(allowedData);
  
  // Build SET clause without using format for parameter placeholders
  const setClause = columns.map((col, index) => 
    `${format('%I', col)} = $${index + 1}`
  ).join(', ');
  
  const query = format(
    'UPDATE %I SET %s WHERE id = $%s RETURNING *',
    config.tableName,
    setClause,
    values.length + 1
  );
  
  return { query, params: [...values, id] };
};

/**
 * Builds a DELETE query for removing resources
 * @param {string} resourceType - Type of resource to delete
 * @param {number} id - Resource ID
 * @returns {object} Query object
 */
export const buildDeleteQuery = (resourceType, id) => {
  const config = getResourceConfig(resourceType);
  
  const query = format('DELETE FROM %I WHERE id = $1 RETURNING *', config.tableName);
  
  return { query, params: [id] };
};

/**
 * Builds queries for checking existing items during bulk operations
 * @param {string} resourceType - Type of resource to check
 * @param {object} item - Item data to check against
 * @returns {object} Query object or null if no check possible
 */
export const buildExistenceCheckQuery = (resourceType, item) => {
  const config = getResourceConfig(resourceType);
  
  let query = null;
  let params = [];
  
  switch (resourceType.toLowerCase()) {
    case 'restaurants':
      if (item.google_place_id) {
        query = format('SELECT * FROM %I WHERE google_place_id = $1 LIMIT 1', config.tableName);
        params = [item.google_place_id];
      } else if (item.name && item.address && item.city_id) {
        query = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND LOWER(address) = LOWER($2) AND city_id = $3 LIMIT 1', config.tableName);
        params = [item.name, item.address, parseInt(item.city_id, 10)];
      } else if (item.name && item.city_id) {
        query = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND city_id = $2 LIMIT 1', config.tableName);
        params = [item.name, parseInt(item.city_id, 10)];
      }
      break;
      
    case 'dishes':
      if (item.name && item.restaurant_id) {
        query = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND restaurant_id = $2 LIMIT 1', config.tableName);
        params = [item.name, parseInt(item.restaurant_id, 10)];
      }
      break;
      
    case 'cities':
      if (item.name) {
        if (item.state_code && config.allowedCreateColumns.includes('state_code')) {
          query = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND LOWER(state_code) = LOWER($2) LIMIT 1', config.tableName);
          params = [item.name, item.state_code];
        } else {
          query = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) LIMIT 1', config.tableName);
          params = [item.name];
        }
      }
      break;
      
    case 'neighborhoods':
      if (item.name && item.city_id) {
        query = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND city_id = $2 LIMIT 1', config.tableName);
        params = [item.name, parseInt(item.city_id, 10)];
      }
      break;
      
    case 'hashtags':
      if (item.name) {
        query = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) LIMIT 1', config.tableName);
        params = [item.name];
      }
      break;
      
    case 'users':
      if (item.email) {
        query = format('SELECT * FROM %I WHERE LOWER(email) = LOWER($1) LIMIT 1', config.tableName);
        params = [item.email];
      } else if (item.username && config.allowedCreateColumns.includes('username')) {
        query = format('SELECT * FROM %I WHERE LOWER(username) = LOWER($1) LIMIT 1', config.tableName);
        params = [item.username];
      }
      break;
  }
  
  return query ? { query, params } : null;
};

/**
 * Builds lookup queries for reference data
 * @param {string} type - Type of lookup (neighborhoods, restaurants, cities)
 * @returns {object} Query object
 */
export const buildLookupQuery = (type) => {
  const queries = {
    neighborhoods: 'SELECT id, name FROM neighborhoods',
    restaurants: 'SELECT id, name FROM restaurants',
    cities: 'SELECT id, name FROM cities'
  };
  
  const query = queries[type.toLowerCase()];
  if (!query) {
    throw new Error(`Unsupported lookup type: ${type}`);
  }
  
  return { query, params: [] };
};

/**
 * Builds a query for looking up neighborhoods by zip code
 * @param {string} zipCode - Zip code to lookup
 * @returns {object} Query object
 */
export const buildZipLookupQuery = (zipCode) => {
  const query = `
    SELECT id, name 
    FROM neighborhoods 
    WHERE zipcode_ranges::text LIKE $1 
    LIMIT 1
  `;
  
  return { query, params: [`%${zipCode}%`] };
};

/**
 * Executes a query with proper error handling and logging
 * @param {object} queryObj - Query object with query and params
 * @param {string} operation - Operation being performed
 * @param {string} resourceType - Resource type involved
 * @returns {Promise<object>} Query result
 */
export const executeQuery = async (queryObj, operation, resourceType) => {
  try {
    logAdminOperation('info', operation, resourceType, 'Executing query', { 
      query: queryObj.query,
      paramCount: queryObj.params.length 
    });
    
    const result = await db.query(queryObj.query, queryObj.params);
    
    logAdminOperation('info', operation, resourceType, 'Query completed successfully', {
      rowCount: result.rows.length
    });
    
    return result;
  } catch (error) {
    logAdminOperation('error', operation, resourceType, 'Query failed', {
      error: error.message,
      query: queryObj.query
    });
    
    throw createAdminModelError(operation, resourceType, error);
  }
};

/**
 * Default export containing all query builder functions
 */
export default {
  buildFindAllQuery,
  buildWhereClause,
  buildFindByIdQuery,
  buildCreateQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildExistenceCheckQuery,
  buildLookupQuery,
  buildZipLookupQuery,
  executeQuery
}; 