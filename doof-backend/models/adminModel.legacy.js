// doof-backend/models/adminModel.js
import db from '../db/index.js';
import format from 'pg-format';
import {
  formatRestaurant,
  formatDish,
  formatUser,
  formatNeighborhood,
  formatList,
  formatListItem,
  toTitleCase, // Import new utility
  identityFormatter // Import identityFormatter
} from '../utils/formatters.js';

import * as RestaurantModel from './restaurantModel.js';
import * as DishModel from './dishModel.js';
// import * as CityModel from './cityModel.js';
// import *_NeighborhoodModel from './neighborhoodModel.js';
// import * as HashtagModel from './hashtagModel.js';
// import { ListModel } from './listModel.js';
// import SubmissionModel from './submissionModel.js';


// This resourceConfig needs to be VERY CAREFULLY aligned with your actual schema_dump.sql
// Especially allowedCreateColumns and allowedUpdateColumns.
// Added 'fieldsForCleanup' to specify which fields are candidates for cleanup rules.
const resourceConfig = {
  restaurants: {
    tableName: 'restaurants',
    formatter: formatRestaurant,
    allowedCreateColumns: ['name', 'address', 'city_id', 'neighborhood_id', 'zip_code', 'phone', 'website', 'instagram_handle', 'google_place_id', 'latitude', 'longitude', 'chain_id', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'address', 'city_id', 'neighborhood_id', 'zip_code', 'phone', 'website', 'instagram_handle', 'google_place_id', 'latitude', 'longitude', 'adds', 'chain_id', 'updated_at'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        description: { truncate: 500 }, // Assuming description exists
        website: { prefixHttp: true },
        phone: { formatUS: true }
    }
  },
  dishes: {
    tableName: 'dishes',
    formatter: formatDish,
    allowedCreateColumns: ['name', 'restaurant_id', 'description', 'price', 'is_common', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'restaurant_id', 'description', 'price', 'is_common', 'adds', 'updated_at'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        description: { truncate: 500 }
    }
  },
  users: { // Example: Users might have fewer direct cleanup needs shown to admins
    tableName: 'users',
    formatter: formatUser,
    allowedCreateColumns: ['username', 'email', 'password_hash', 'account_type', 'created_at', 'name'],
    allowedUpdateColumns: ['username', 'email', 'password_hash', 'account_type', 'name', 'updated_at'],
    fieldsForCleanup: { // Assuming 'name' field exists on users for display purposes
        name: { titleCase: true, trim: true }, // e.g. a user's display name
        email: { toLowerCase: true } // Example for email
    }
  },
  cities: {
    tableName: 'cities',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'has_boroughs', 'state_code', 'country_code' /*, 'created_at', 'updated_at' if added */],
    allowedUpdateColumns: ['name', 'has_boroughs', 'state_code', 'country_code' /*, 'updated_at' if added */],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true }
    }
  },
  neighborhoods: {
    tableName: 'neighborhoods',
    formatter: formatNeighborhood,
    allowedCreateColumns: ['name', 'city_id', 'borough', 'zipcode_ranges', 'parent_id', 'location_level', 'geom' /*, 'created_at', 'updated_at' if added */],
    allowedUpdateColumns: ['name', 'city_id', 'borough', 'zipcode_ranges', 'parent_id', 'location_level', 'geom' /*, 'updated_at' if added */],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        borough: { titleCase: true, trim: true }
    }
  },
  hashtags: {
    tableName: 'hashtags',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'category' /*, 'created_at', 'updated_at' if added */],
    allowedUpdateColumns: ['name', 'category' /*, 'updated_at' if added */],
    fieldsForCleanup: {
        name: { trim: true }, // Hashtags usually don't get title-cased
        category: { titleCase: true, trim: true }
    }
  },
  lists: {
    tableName: 'lists',
    formatter: formatList,
    allowedCreateColumns: ['user_id', 'name', 'description', 'list_type', 'city_name', 'tags', 'is_public', 'created_by_user', 'creator_handle', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'description', 'list_type', 'saved_count', 'city_name', 'tags', 'is_public', 'creator_handle', 'is_following', 'updated_at'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        description: { truncate: 1000 }, // Lists might have longer descriptions
        creator_handle: { trim: true }
    }
  },
  restaurant_chains: {
    tableName: 'restaurant_chains',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'website', 'description', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'website', 'description', 'updated_at'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        website: { prefixHttp: true },
        description: { truncate: 500 }
    }
  },
  submissions: {
    tableName: 'submissions',
    formatter: identityFormatter, // Submissions usually have raw data
    allowedCreateColumns: ['user_id', 'type', 'name', 'location', 'tags', 'place_id', 'city', 'neighborhood', 'status', 'created_at', 'restaurant_id', 'restaurant_name', 'dish_id', 'rejection_reason', 'description', 'phone', 'website'],
    allowedUpdateColumns: ['status', 'reviewed_by', 'reviewed_at', 'restaurant_id', 'dish_id', 'rejection_reason', 'name', 'location', 'tags', 'city', 'neighborhood', 'description', 'phone', 'website'],
    fieldsForCleanup: { // Analyze raw submission data for potential cleanups before approval
        name: { titleCase: true, trim: true }, // Name of proposed item
        location: { trim: true }, // Address or location string
        city: { titleCase: true, trim: true },
        neighborhood: { titleCase: true, trim: true },
        restaurant_name: { titleCase: true, trim: true }, // If a dish submission links to a new restaurant by name
        description: { truncate: 500 },
        phone: { formatUS: true },
        website: { prefixHttp: true }
    },
    // Submissions often need specific handling, e.g., only 'pending' or 'needs_review' ones.
    analysisFilter: `(status = 'pending' OR status = 'needs_review')`
  },
  listitems: { 
    tableName: 'listitems',
    formatter: formatListItem,
    allowedCreateColumns: ['list_id', 'item_type', 'item_id', 'notes', 'added_at'],
    allowedUpdateColumns: ['notes', 'added_at'],
    fieldsForCleanup: {
        notes: { truncate: 255 } // Example: clean up notes
    }
  }
};

const getResourceConfig = (resourceType) => {
  const rType = resourceType ? resourceType.toLowerCase() : null;
  if (!rType || !resourceConfig[rType]) {
      console.error(`Unsupported resource type for config: ${resourceType}`);
      // Fallback to a generic config or throw error
      // For now, let's allow it to proceed and fail later if tableName is needed by caller
      // This might happen if getResourceConfig is called without resourceType in some AdminModel functions
      // However, for cleanup, resourceType is essential.
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
  return resourceConfig[rType];
};


export const findAllResources = async (resourceType, page = 1, limit = 20, sort = 'id', order = 'asc', filters = {}) => {
  const config = getResourceConfig(resourceType);
  const offset = (page - 1) * limit;
  
  // Handle special cases where we need to join tables for better display
  let query;
  let countQuery;
  
  if (resourceType === 'dishes') {
    // For dishes, join with restaurants to get restaurant names
    query = `
      SELECT 
        d.*,
        r.name AS restaurant_name,
        r.address AS restaurant_address
      FROM ${config.tableName} d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id
    `;
    countQuery = `SELECT COUNT(*) FROM ${config.tableName} d LEFT JOIN restaurants r ON d.restaurant_id = r.id`;
  } else if (resourceType === 'restaurants') {
    // For restaurants, join with cities and neighborhoods  
    query = `
      SELECT 
        r.*,
        c.name AS city_name,
        n.name AS neighborhood_name
      FROM ${config.tableName} r
      LEFT JOIN cities c ON r.city_id = c.id
      LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
    `;
    countQuery = `SELECT COUNT(*) FROM ${config.tableName} r LEFT JOIN cities c ON r.city_id = c.id LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id`;
  } else if (resourceType === 'neighborhoods') {
    // For neighborhoods, join with cities
    query = `
      SELECT 
        n.*,
        c.name AS city_name
      FROM ${config.tableName} n
      LEFT JOIN cities c ON n.city_id = c.id
    `;
    countQuery = `SELECT COUNT(*) FROM ${config.tableName} n LEFT JOIN cities c ON n.city_id = c.id`;
  } else {
    // Default case - simple select
    query = format('SELECT * FROM %I', config.tableName);
    countQuery = format('SELECT COUNT(*) FROM %I', config.tableName);
  }
  
  const whereClauses = [];
  const queryParams = [];
  let paramIdx = 1;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const knownColumns = Array.from(new Set([...config.allowedCreateColumns, ...config.allowedUpdateColumns, 'id', 'created_at', 'updated_at']));
      // Added specific filterable keys that might not be in create/update columns directly (e.g. foreign keys used for filtering)
      const filterableKeys = ['search', 'status', 'city_id', 'restaurant_id', 'user_id', 'list_id', 'type', 'account_type'];
      if (knownColumns.includes(key) || filterableKeys.includes(key)) {
        
        // For joined queries, prefix the main table alias
        const tablePrefix = resourceType === 'dishes' ? 'd.' : 
                           resourceType === 'restaurants' ? 'r.' :
                           resourceType === 'neighborhoods' ? 'n.' : '';
        
        if (key === 'search' && (config.allowedCreateColumns.includes('name') || config.allowedUpdateColumns.includes('name'))) {
          whereClauses.push(`LOWER(${tablePrefix}name) LIKE LOWER($${paramIdx++})`);
          queryParams.push(`%${value}%`);
        } else if (key.endsWith('_id') || key === 'id' || ['user_id', 'list_id', 'restaurant_id', 'city_id'].includes(key)) {
          const parsedValue = parseInt(value, 10);
          if (!isNaN(parsedValue)) {
            whereClauses.push(`${tablePrefix}${key} = $${paramIdx++}`);
            queryParams.push(parsedValue);
          }
        } else if (typeof value === 'string' && (config.allowedUpdateColumns.includes(key) || config.allowedCreateColumns.includes(key) || ['status', 'type', 'account_type'].includes(key))) {
           if (['status', 'type', 'account_type'].includes(key)) {
             whereClauses.push(`${tablePrefix}${key} = $${paramIdx++}`);
             queryParams.push(value);
           } else {
             whereClauses.push(`LOWER(${tablePrefix}${key}) LIKE LOWER($${paramIdx++})`);
             queryParams.push(`%${value}%`);
           }
        }
      }
    }
  });

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
    countQuery += ' WHERE ' + whereClauses.join(' AND ');
  }

  const allKnownColumns = Array.from(new Set([...config.allowedCreateColumns, ...config.allowedUpdateColumns, 'id', 'created_at', 'updated_at', 'name']));
  const safeSort = allKnownColumns.includes(sort.toLowerCase()) ? sort : (config.allowedCreateColumns.includes('id') || config.allowedUpdateColumns.includes('id') ? 'id' : allKnownColumns[0] || 'id'); // Fallback sort
  const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  // For joined queries, prefix the sort column with table alias
  const tablePrefix = resourceType === 'dishes' ? 'd.' : 
                     resourceType === 'restaurants' ? 'r.' :
                     resourceType === 'neighborhoods' ? 'n.' : '';
  const sortColumn = (resourceType === 'dishes' || resourceType === 'restaurants' || resourceType === 'neighborhoods') ? 
                    `${tablePrefix}${safeSort}` : safeSort;

  query += ` ORDER BY ${sortColumn} ${safeOrder} LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  queryParams.push(limit, offset);
  
  let totalCount;
  if (whereClauses.length > 0) {
    const countQueryParams = queryParams.slice(0, whereClauses.length);
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

  // Automatically add created_at and updated_at if they are allowed and not provided
  const now = new Date();
  if (config.allowedCreateColumns.includes('created_at') && !data.hasOwnProperty('created_at')) {
    data.created_at = now;
  }
  if (config.allowedCreateColumns.includes('updated_at') && !data.hasOwnProperty('updated_at')) {
    data.updated_at = now;
  }

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

  // Automatically add updated_at if it's allowed and not explicitly being set to null
  if (config.allowedUpdateColumns.includes('updated_at') && data.updated_at !== null) {
      data.updated_at = new Date();
  }


  config.allowedUpdateColumns.forEach(col => {
    // Allow setting a field to null if it's in data
    if (data.hasOwnProperty(col)) {
      setClauses.push(format('%I = $%s', col, placeholderIndex++));
      values.push(data[col]);
    }
  });

  if (setClauses.length === 0) {
    // If no updatable fields are provided, fetch and return the existing item.
    // This prevents an error from an empty SET clause.
    const existingItem = await findResourceById(resourceType, id);
    if (!existingItem) throw new Error(`${resourceType} with ID ${id} not found for update (no changes provided).`);
     // Even if no fields changed, if updated_at is an allowed column, update it.
    if (config.allowedUpdateColumns.includes('updated_at') && !data.hasOwnProperty('updated_at')) {
        const updateTimestampQuery = format('UPDATE %I SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', config.tableName);
        const { rows } = await db.query(updateTimestampQuery, [id]);
        if (rows.length === 0) return null; // Should not happen if item exists
        return (config.formatter || identityFormatter)(rows[0]);
    }
    return existingItem;
  }

  values.push(id);
  const query = format('UPDATE %I SET %s WHERE id = $%s RETURNING *', config.tableName, setClauses.join(', '), placeholderIndex);
  const { rows } = await db.query(query, values);
  if (rows.length === 0) return null; // Or throw error if ID not found
  return (config.formatter || identityFormatter)(rows[0]);
};

export const deleteResource = async (resourceType, id) => {
  const config = getResourceConfig(resourceType);
  // Special handling for listitems: 'id' might refer to a different column or need cascading logic.
  // Assuming 'id' is the primary key for all tables for this generic delete.
  const pkColumn = 'id'; // Default primary key column name

  const query = format('DELETE FROM %I WHERE %I = $1 RETURNING *', config.tableName, pkColumn);
  const { rows, rowCount } = await db.query(query, [id]);
  // Return the deleted item or boolean status
  return rowCount > 0 ? (config.formatter || identityFormatter)(rows[0]) : false;
};


// --- DATA CLEANUP METHODS ---

// Helper function to generate a unique ID for each change suggestion
const generateChangeId = (resourceType, resourceId, field, changeType) => {
  return `${resourceType}-${resourceId}-${field}-${changeType}`;
};

// Helper function to fetch data from Google Places API
async function fetchFromGooglePlaces(placeId) {
  try {
    // Use Google Places API client library
    const googleMapsClient = require('@googlemaps/google-maps-services-js').Client;
    const client = new googleMapsClient({});
    
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: ['name', 'formatted_address', 'website', 'formatted_phone_number'],
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.result) {
      return {
        name: response.data.result.name,
        address: response.data.result.formatted_address,
        website: response.data.result.website,
        phone: response.data.result.formatted_phone_number
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return null;
  }
};

// Helper function to look up neighborhood by zip code
const lookupNeighborhoodByZip = async (zipCode) => {
  // In a real implementation, this would query the neighborhoods table
  // For now, we'll return a mock neighborhood ID
  console.log(`[Mock] Looking up neighborhood for zip code: ${zipCode}`);
  return 1; // Mock neighborhood ID
};

// Helper function to format phone numbers consistently
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
  }
  
  // Format as +X (XXX) XXX-XXXX for 11-digit numbers
  if (digitsOnly.length === 11) {
    return `+${digitsOnly[0]} (${digitsOnly.slice(1,4)}) ${digitsOnly.slice(4,7)}-${digitsOnly.slice(7)}`;
  }
  
  // Return original if can't format
  return phone;
};

// Helper function to format website URLs consistently
const formatWebsite = (website) => {
  if (!website) return null;
  
  // Trim whitespace
  let formattedSite = website.trim();
  
  // Add https:// if no protocol specified
  if (!/^https?:\/\//i.test(formattedSite) && formattedSite.length > 0) {
    formattedSite = `https://${formattedSite}`;
  }
  
  // Remove trailing slash if exists
  if (formattedSite.endsWith('/')) {
    formattedSite = formattedSite.slice(0, -1);
  }
  
  return formattedSite;
};

// Helper function to get neighborhood name by ID
const getNeighborhoodNameById = async (neighborhoodId) => {
  if (!neighborhoodId) return null;
  
  try {
    const query = 'SELECT name FROM neighborhoods WHERE id = $1';
    const { rows } = await db.query(query, [neighborhoodId]);
    return rows.length ? rows[0].name : `Unknown (ID: ${neighborhoodId})`;
  } catch (error) {
    console.error(`Error getting neighborhood name for ID ${neighborhoodId}:`, error);
    return `Error (ID: ${neighborhoodId})`;
  }
};

// Helper function to get restaurant name by ID
const getRestaurantNameById = async (restaurantId) => {
  if (!restaurantId) return null;
  
  try {
    const query = 'SELECT name FROM restaurants WHERE id = $1';
    const { rows } = await db.query(query, [restaurantId]);
    return rows.length ? rows[0].name : `Unknown (ID: ${restaurantId})`;
  } catch (error) {
    console.error(`Error getting restaurant name for ID ${restaurantId}:`, error);
    return `Error (ID: ${restaurantId})`;
  }
};

// Helper function to get city name by ID
const getCityNameById = async (cityId) => {
  if (!cityId) return null;
  
  try {
    const query = 'SELECT name FROM cities WHERE id = $1';
    const { rows } = await db.query(query, [cityId]);
    return rows.length ? rows[0].name : `Unknown (ID: ${cityId})`;
  } catch (error) {
    console.error(`Error getting city name for ID ${cityId}:`, error);
    return `Error (ID: ${cityId})`;
  }
};

export const analyzeData = async (resourceType) => {
  const config = getResourceConfig(resourceType);
  if (!config || !config.tableName || !config.fieldsForCleanup) {
    console.error(`[analyzeData] Misconfigured resource type: ${resourceType}. Missing tableName or fieldsForCleanup.`);
    return [];
  }
  console.log(`[analyzeData] Analyzing data for ${resourceType}`);

  const changes = [];
  let queryBase = `SELECT * FROM ${format('%I', config.tableName)}`;
  const queryParams = [];

  // Add resource-specific filters if defined (e.g., for submissions)
  if (config.analysisFilter) {
    queryBase += ` WHERE ${config.analysisFilter}`; // Note: analysisFilter should be trusted or parameterized
  }
  
  // For large tables, consider adding LIMIT and OFFSET for batch processing
  // queryBase += ` LIMIT 100`; // Example: Process in batches of 100

  console.log(`[analyzeData] Running query for ${resourceType}: ${queryBase}`);
  
  let resources;
  try {
    resources = await db.query(queryBase, queryParams);
  } catch(dbError) {
    console.error(`[analyzeData] Database error fetching resources for ${resourceType}:`, dbError);
    throw dbError;
  }

  // Get additional data needed for analysis
  let neighborhoodsMap = new Map();
  let restaurantsMap = new Map();
  let citiesMap = new Map();
  
  // Fetch lookups based on resource type
  if (resourceType === 'restaurants' || resourceType === 'neighborhoods') {
    try {
      const { rows } = await db.query('SELECT id, name FROM neighborhoods');
      neighborhoodsMap = new Map(rows.map(row => [row.id, row.name]));
    } catch (error) {
      console.error('[analyzeData] Error fetching neighborhoods:', error);
    }
  }
  
  if (resourceType === 'dishes') {
    try {
      const { rows } = await db.query('SELECT id, name FROM restaurants');
      restaurantsMap = new Map(rows.map(row => [row.id, row.name]));
    } catch (error) {
      console.error('[analyzeData] Error fetching restaurants:', error);
    }
  }
  
  if (resourceType === 'neighborhoods') {
    try {
      const { rows } = await db.query('SELECT id, name FROM cities');
      citiesMap = new Map(rows.map(row => [row.id, row.name]));
    } catch (error) {
      console.error('[analyzeData] Error fetching cities:', error);
    }
  }

  for (const resource of resources.rows) {
    if (!resource.id) {
        console.warn(`[analyzeData] Resource in ${resourceType} missing an ID:`, resource);
        continue;
    }
    const resourceId = resource.id;
    
    // Special case for restaurants: check for missing data that can be enhanced
    if (resourceType === 'restaurants') {
      // Check for missing address
      if (!resource.address && resource.google_place_id) {
        try {
          const placeDetails = await fetchFromGooglePlaces(resource.google_place_id);
          if (placeDetails?.address) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, 'address', 'google_places'),
              resourceId,
              resourceType,
              field: 'address',
              currentValue: resource.address || null,
              proposedValue: placeDetails.address,
              changeType: 'google_places',
              changeReason: 'Missing address retrieved from Google Places API',
              status: 'pending'
            });
          }
        } catch (error) {
          console.error(`Error fetching Google Places data for restaurant ${resourceId}:`, error);
        }
      }
      
      // Check for missing website
      if (!resource.website && resource.google_place_id) {
        try {
          const placeDetails = await fetchFromGooglePlaces(resource.google_place_id);
          if (placeDetails?.website) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, 'website', 'google_places'),
              resourceId,
              resourceType,
              field: 'website',
              currentValue: resource.website || null,
              proposedValue: formatWebsite(placeDetails.website),
              changeType: 'google_places',
              changeReason: 'Missing website retrieved from Google Places API',
              status: 'pending'
            });
          }
        } catch (error) {
          console.error(`Error fetching Google Places data for restaurant ${resourceId}:`, error);
        }
      }
      
      // Check for address but no neighborhood
      if (resource.address && !resource.neighborhood_id && resource.zip_code) {
        try {
          const neighborhood = await lookupNeighborhoodByZip(resource.zip_code);
          if (neighborhood?.id) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, 'neighborhood_id', 'zip_lookup'),
              resourceId,
              resourceType,
              field: 'neighborhood_id',
              currentValue: resource.neighborhood_id || null,
              proposedValue: neighborhood.id,
              changeType: 'zip_lookup',
              changeReason: `Neighborhood ${neighborhood.name} (ID: ${neighborhood.id}) found for zip code ${resource.zip_code}`,
              status: 'pending'
            });
          }
        } catch (error) {
          console.error(`Error looking up neighborhood for restaurant ${resourceId} by zip code:`, error);
        }
      }
      
      // Check for incorrectly formatted phone number
      if (resource.phone) {
        const formattedPhone = formatPhoneNumber(resource.phone);
        if (formattedPhone !== resource.phone) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'phone', 'format'),
            resourceId,
            resourceType,
            field: 'phone',
            currentValue: resource.phone,
            proposedValue: formattedPhone,
            changeType: 'format',
            changeReason: 'Phone number formatted consistently',
            status: 'pending'
          });
        }
      }
      
      // Check for incorrectly formatted website
      if (resource.website) {
        const formattedWebsite = formatWebsite(resource.website);
        if (formattedWebsite !== resource.website) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'website', 'format'),
            resourceId,
            resourceType,
            field: 'website',
            currentValue: resource.website,
            proposedValue: formattedWebsite,
            changeType: 'format',
            changeReason: 'Website URL formatted consistently',
            status: 'pending'
          });
        }
      }
    }
    
    // Special case for hashtags: ensure they have # prefix
    if (resourceType === 'hashtags' && resource.name && !resource.name.startsWith('#')) {
      changes.push({
        changeId: generateChangeId(resourceType, resourceId, 'name', 'format'),
        resourceId,
        resourceType,
        field: 'name',
        currentValue: resource.name,
        proposedValue: `#${resource.name}`,
        changeType: 'format',
        changeReason: 'Added # prefix to hashtag name',
        status: 'pending'
      });
    }
    
    // Standard field cleanup rules
    for (const field in config.fieldsForCleanup) {
      if (resource.hasOwnProperty(field)) {
        const rules = config.fieldsForCleanup[field];
        const currentValue = resource[field];

        // Rule: Trim whitespace
        if (rules.trim && typeof currentValue === 'string') {
          const proposedValue = currentValue.trim();
          if (proposedValue !== currentValue) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, field, 'trim'),
              resourceId: resourceId,
              resourceType: resourceType,
              title: `Trim whitespace from ${field}`,
              category: 'Text Formatting',
              type: 'trim',
              field: field,
              currentValue: currentValue,
              proposedValue: proposedValue,
              impact: 'Improves data quality and search accuracy',
              confidence: 1.0
            });
          }
        }
        
        // Rule: Title Case
        if (rules.titleCase && typeof currentValue === 'string') {
          const baseValueForTitleCase = (rules.trim && typeof currentValue === 'string' && currentValue.trim() !== currentValue) 
                                      ? currentValue.trim() 
                                      : currentValue;
          const proposedValue = toTitleCase(baseValueForTitleCase);
          if (proposedValue !== baseValueForTitleCase && proposedValue !== currentValue) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, field, 'titleCase'),
              resourceId: resourceId,
              resourceType: resourceType,
              title: `Convert ${field} to Title Case`,
              category: 'Text Formatting',
              type: 'titleCase',
              field: field,
              currentValue: currentValue,
              proposedValue: proposedValue,
              impact: 'Improves readability and consistency',
              confidence: 0.85
            });
          }
        }
        
        // Rule: Format website URL
        if (field === 'website' && typeof currentValue === 'string' && currentValue.length > 0) {
          const formattedWebsite = formatWebsite(currentValue);
          if (formattedWebsite !== currentValue) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, field, 'formatWebsite'),
              resourceId: resourceId,
              resourceType: resourceType,
              title: `Format website URL`,
              category: 'URL Formatting',
              type: 'formatWebsite',
              field: field,
              currentValue: currentValue,
              proposedValue: formattedWebsite,
              impact: 'Ensures proper URL formatting',
              confidence: 0.95
            });
          }
        }

        // Rule: Format phone number
        if (field === 'phone' && typeof currentValue === 'string' && currentValue.length > 0) {
          const formattedPhone = formatPhoneNumber(currentValue);
          if (formattedPhone !== currentValue) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, field, 'formatPhone'),
              resourceId: resourceId,
              resourceType: resourceType,
              title: `Format phone number`,
              category: 'Contact Information',
              type: 'formatPhone',
              field: field,
              currentValue: currentValue,
              proposedValue: formattedPhone,
              impact: 'Ensures consistent phone number format',
              confidence: 0.95
            });
          }
        }
      }
    }

    // Resource-specific cleanup rules
    switch (resourceType) {
      case 'restaurants': {
        // Check for missing address - would pull from Google Places API
        if (!resource.address && resource.google_place_id) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'address', 'fetchFromGoogle'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Fetch missing address from Google Places API`,
            category: 'Missing Data',
            type: 'fetchFromGoogle',
            field: 'address',
            currentValue: 'Missing',
            proposedValue: '[Will be fetched from Google Places API]',
            impact: 'Completes essential business information',
            confidence: 0.9,
            googlePlaceId: resource.google_place_id
          });
        }
        
        // Check for missing website - would pull from Google Places API
        if (!resource.website && resource.google_place_id) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'website', 'fetchFromGoogle'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Fetch missing website from Google Places API`,
            category: 'Missing Data',
            type: 'fetchFromGoogle',
            field: 'website',
            currentValue: 'Missing',
            proposedValue: '[Will be fetched from Google Places API]',
            impact: 'Completes essential business information',
            confidence: 0.9,
            googlePlaceId: resource.google_place_id
          });
        }
        
        // Check for address without neighborhood - would look up from zip code
        if (resource.address && !resource.neighborhood_id) {
          const zipMatch = resource.address.match(/\d{5}(-\d{4})?/);
          if (zipMatch) {
            changes.push({
              changeId: generateChangeId(resourceType, resourceId, 'neighborhood_id', 'lookupFromZip'),
              resourceId: resourceId,
              resourceType: resourceType,
              title: `Assign neighborhood based on zip code`,
              category: 'Missing Relation',
              type: 'lookupFromZip',
              field: 'neighborhood_id',
              currentValue: 'Missing',
              proposedValue: '[Will be looked up from zip code]',
              impact: 'Enables proper location filtering',
              confidence: 0.8,
              zipCode: zipMatch[0]
            });
          }
        }
        
        // Display neighborhood name instead of ID
        if (resource.neighborhood_id && neighborhoodsMap.has(resource.neighborhood_id)) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'neighborhood_display', 'replaceIdWithName'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Display neighborhood name instead of ID`,
            category: 'UI Improvement',
            type: 'replaceIdWithName',
            field: 'neighborhood_id',
            currentValue: String(resource.neighborhood_id),
            proposedValue: neighborhoodsMap.get(resource.neighborhood_id),
            impact: 'Improves readability in admin panel',
            confidence: 1.0,
            displayOnly: true
          });
        }
        
        // Remove price column suggestion
        changes.push({
          changeId: generateChangeId(resourceType, resourceId, 'price', 'hideColumn'),
          resourceId: resourceId,
          resourceType: resourceType,
          title: `Hide price column from restaurants table`,
          category: 'UI Improvement',
          type: 'hideColumn',
          field: 'price',
          currentValue: 'Visible',
          proposedValue: 'Hidden',
          impact: 'Removes unnecessary information from view',
          confidence: 1.0,
          displayOnly: true,
          affectsAllRows: true
        });
        break;
      }
      
      case 'dishes': {
        // Display restaurant name instead of ID
        if (resource.restaurant_id && restaurantsMap.has(resource.restaurant_id)) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'restaurant_display', 'replaceIdWithName'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Display restaurant name instead of ID`,
            category: 'UI Improvement',
            type: 'replaceIdWithName',
            field: 'restaurant_id',
            currentValue: String(resource.restaurant_id),
            proposedValue: restaurantsMap.get(resource.restaurant_id),
            impact: 'Improves readability in admin panel',
            confidence: 1.0,
            displayOnly: true
          });
        }
        
        // Remove price column suggestion
        changes.push({
          changeId: generateChangeId(resourceType, resourceId, 'price', 'hideColumn'),
          resourceId: resourceId,
          resourceType: resourceType,
          title: `Hide price column from dishes table`,
          category: 'UI Improvement',
          type: 'hideColumn',
          field: 'price',
          currentValue: 'Visible',
          proposedValue: 'Hidden',
          impact: 'Removes unnecessary information from view',
          confidence: 1.0,
          displayOnly: true,
          affectsAllRows: true
        });
        break;
      }
      
      case 'users': {
        // Add badge for admin users
        if (resource.account_type === 'admin' || resource.account_type === 'superuser') {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'admin_badge', 'addBadge'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Add admin badge to user`,
            category: 'UI Improvement',
            type: 'addBadge',
            field: 'account_type',
            currentValue: resource.account_type,
            proposedValue: `${resource.account_type} 🔰`,
            impact: 'Visually identifies admin users',
            confidence: 1.0,
            displayOnly: true
          });
        }
        
        // Fill in missing name for admin users
        if ((resource.account_type === 'admin' || resource.account_type === 'superuser') && 
            (!resource.name || resource.name === 'n/a' || resource.name === 'N/A')) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'name', 'fillAdminInfo'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Update admin user name from 'N/A'`,
            category: 'Missing Data',
            type: 'fillAdminInfo',
            field: 'name',
            currentValue: resource.name || 'N/A',
            proposedValue: `Admin User (${resource.email.split('@')[0]})`,
            impact: 'Provides proper identification for admin users',
            confidence: 0.9
          });
        }
        
        // Set verified status for admin users
        if ((resource.account_type === 'admin' || resource.account_type === 'superuser') && 
            (!resource.is_verified)) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'is_verified', 'setAdminVerified'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Mark admin user as verified`,
            category: 'Data Consistency',
            type: 'setAdminVerified',
            field: 'is_verified',
            currentValue: resource.is_verified ? 'true' : 'false',
            proposedValue: 'true',
            impact: 'Ensures all admin users are verified',
            confidence: 1.0
          });
        }
        break;
      }
      
      case 'cities': {
        // Ensure all city fields are filled
        const missingFields = [];
        if (!resource.name) missingFields.push('name');
        if (!resource.state) missingFields.push('state');
        if (!resource.country) missingFields.push('country');
        
        if (missingFields.length > 0) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'missing_fields', 'fillCityInfo'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Fill missing city information: ${missingFields.join(', ')}`,
            category: 'Missing Data',
            type: 'fillCityInfo',
            field: missingFields[0], // Primary field to update
            currentValue: 'Missing data',
            proposedValue: 'Will be filled by admin',
            impact: 'Ensures complete city information',
            confidence: 0.7,
            missingFields
          });
        }
        break;
      }
      
      case 'neighborhoods': {
        // Display city name instead of ID
        if (resource.city_id && citiesMap.has(resource.city_id)) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'city_display', 'replaceIdWithName'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Display city name instead of ID`,
            category: 'UI Improvement',
            type: 'replaceIdWithName',
            field: 'city_id',
            currentValue: String(resource.city_id),
            proposedValue: citiesMap.get(resource.city_id),
            impact: 'Improves readability in admin panel',
            confidence: 1.0,
            displayOnly: true
          });
        }
        break;
      }
      
      case 'hashtags': {
        // Add # prefix to hashtag names if missing
        if (resource.name && !resource.name.startsWith('#')) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, 'name', 'addHashPrefix'),
            resourceId: resourceId,
            resourceType: resourceType,
            title: `Add # prefix to hashtag name`,
            category: 'Format Standardization',
            type: 'addHashPrefix',
            field: 'name',
            currentValue: resource.name,
            proposedValue: `#${resource.name}`,
            impact: 'Ensures consistent hashtag format',
            confidence: 1.0
          });
        }
        break;
      }
    }
  }

  // Remove duplicate change suggestions (like column hiding that affects all rows)
  const uniqueChanges = [];
  const seenChangeTypes = new Set();
  
  for (const change of changes) {
    // For changes that affect all rows, only keep one instance
    if (change.affectsAllRows) {
      const changeType = `${change.type}-${change.field}`;
      if (!seenChangeTypes.has(changeType)) {
        seenChangeTypes.add(changeType);
        uniqueChanges.push(change);
      }
    } else {
      uniqueChanges.push(change);
    }
  }

  return uniqueChanges;
};

export const applyChanges = async (resourceType, changesToApply, options = {}) => {
  const config = getResourceConfig(resourceType);
  
  if (!config || !config.tableName) {
    throw new Error(`Unsupported resource type: ${resourceType}`);
  }
  
  if (!Array.isArray(changesToApply) || changesToApply.length === 0) {
    return [];
  }
  
  // Process each change
  const results = [];
  
  for (const change of changesToApply) {
    const result = {
      changeId: change.changeId,
      resourceId: change.resourceId,
      field: change.field,
      type: change.type,
      success: false,
      message: ''
    };

    try {
      // Skip UI-only changes that don't need to be persisted to the database
      if (change.displayOnly) {
        result.success = true;
        result.message = 'UI-only change applied successfully';
        results.push(result);
        continue;
      }

      // Get current resource data
      const { rows } = await db.query(
        format('SELECT * FROM %I WHERE id = $1', config.tableName),
        [change.resourceId]
      );
      
      if (rows.length === 0) {
        result.message = `Resource with ID ${change.resourceId} not found`;
        results.push(result);
        continue;
      }

      const resource = rows[0];
      
      // Process change based on type
      switch (change.type) {
        case 'trim':
        case 'titleCase':
        case 'toLowerCase': 
        case 'formatWebsite':
        case 'formatPhone':
        case 'addHashPrefix': {
          // Simple field updates
          await db.query(
            format('UPDATE %I SET %I = $1 WHERE id = $2', config.tableName, change.field),
            [change.proposedValue, change.resourceId]
          );
          result.success = true;
          result.message = `Successfully updated ${change.field}`;
          break;
        }
          
        case 'fetchFromGoogle': {
          // Fetch data from Google Places API
          if (!resource.google_place_id) {
            result.message = 'Missing Google Place ID, cannot fetch data';
            break;
          }
          
          try {
            const placeData = await fetchFromGooglePlaces(resource.google_place_id);
            if (!placeData || !placeData[change.field]) {
              result.message = `No ${change.field} found in Google Places API data`;
              break;
            }
            
            await db.query(
              format('UPDATE %I SET %I = $1 WHERE id = $2', config.tableName, change.field),
              [placeData[change.field], change.resourceId]
            );
            result.success = true;
            result.message = `Successfully updated ${change.field} from Google Places API`;
          } catch (error) {
            result.message = `Error fetching from Google Places API: ${error.message}`;
          }
          break;
        }
          
        case 'lookupFromZip': {
          if (!change.zipCode) {
            result.message = 'Missing zip code, cannot lookup neighborhood';
            break;
          }
          
          try {
            const neighborhoodId = await lookupNeighborhoodByZip(change.zipCode);
            if (!neighborhoodId) {
              result.message = 'No neighborhood found for the given zip code';
              break;
            }
            
            await db.query(
              format('UPDATE %I SET neighborhood_id = $1 WHERE id = $2', config.tableName),
              [neighborhoodId, change.resourceId]
            );
            result.success = true;
            result.message = 'Successfully assigned neighborhood based on zip code';
          } catch (error) {
            result.message = `Error looking up neighborhood: ${error.message}`;
          }
          break;
        }
          
        case 'replaceIdWithName': {
          // This is a display-only change, shouldn't reach here
          result.success = true;
          result.message = 'Display-only change processed (no database updates needed)';
          break;
        }
          
        case 'hideColumn': {
          // This is a display-only change, shouldn't reach here
          result.success = true;
          result.message = 'Display-only change processed (no database updates needed)';
          break;
        }
          
        case 'addBadge': {
          // This is a display-only change, shouldn't reach here
          result.success = true;
          result.message = 'Display-only change processed (no database updates needed)';
          break;
        }
          
        case 'fillAdminInfo': {
          // Fill in missing name for admin users
          await db.query(
            format('UPDATE %I SET name = $1 WHERE id = $2', config.tableName),
            [change.proposedValue, change.resourceId]
          );
          result.success = true;
          result.message = 'Successfully updated admin user name';
          break;
        }
          
        case 'setAdminVerified': {
          // Set verified status for admin users
          await db.query(
            format('UPDATE %I SET is_verified = true WHERE id = $1', config.tableName),
            [change.resourceId]
          );
          result.success = true;
          result.message = 'Successfully marked admin user as verified';
          break;
        }
          
        case 'fillCityInfo': {
          // Prep for filling missing city information
          if (!change.missingFields || !Array.isArray(change.missingFields) || change.missingFields.length === 0) {
            result.message = 'No missing fields specified';
            break;
          }
          
          // For this mockup, we'll set placeholder values
          // In a real implementation, you would prompt the admin for each value
          const updates = {};
          change.missingFields.forEach(field => {
            updates[field] = field === 'name' ? 'New City Name' : 
                           field === 'state' ? 'New State' : 
                           field === 'country' ? 'USA' : 'Placeholder';
          });
          
          // Build SET clause for all fields at once
          const setClauses = [];
          const values = [];
          let paramCounter = 1;
          
          Object.entries(updates).forEach(([field, value]) => {
            setClauses.push(`${field} = $${paramCounter++}`);
            values.push(value);
          });
          
          values.push(change.resourceId);
          
          await db.query(
            format(`UPDATE %I SET ${setClauses.join(', ')} WHERE id = $${paramCounter}`, config.tableName),
            values
          );
          
          result.success = true;
          result.message = `Successfully updated missing city information: ${change.missingFields.join(', ')}`;
          break;
        }
          
        default: {
          result.message = `Unsupported change type: ${change.type}`;
          break;
        }
      }
    } catch (error) {
      console.error(`Error applying change ${change.changeId}:`, error);
      result.message = `Error: ${error.message}`;
    }
    
    results.push(result);
  }
  
  return results;
};

export const rejectChanges = async (resourceType, changesToReject) => {
  // For now, "rejecting" primarily means it won't be applied.
  // Future implementation could involve logging rejections or updating a status on the change suggestion itself if they were stored.
  // The current model has changes generated on-the-fly, so rejection is a client-side concern mostly,
  // unless we want to mark the underlying resource as "reviewed, no change needed".
  
  const config = getResourceConfig(resourceType);
   if (!config || !config.tableName) {
    throw new Error(`Unsupported resource type for rejecting changes: ${resourceType}`);
  }

  console.log(`[rejectChanges] Received ${changesToReject.length} changes to mark as 'rejected' for resource type ${resourceType}.`);
  const results = [];

  // Example: If submissions have a status, we might update it.
  // For other types, this might just be a log or no-op on the backend.
  if (resourceType === 'submissions' && config.allowedUpdateColumns.includes('status')) {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');
        for (const change of changesToReject) {
            if (!change.resourceId) {
                results.push({ changeId: change.changeId || 'unknown', success: false, message: 'Missing resourceId for rejection.' });
                continue;
            }
            // This is a simplified rejection - it updates the original submission item,
            // not a separate "change suggestion" record.
            const updateQuery = format(
                'UPDATE %I SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status = $3 RETURNING *',
                config.tableName
            );
            // Assuming 'pending' is the status that can be rejected to 'reviewed_rejected' or similar.
            const queryValues = ['pending_rejection_review', change.resourceId, 'pending']; // Example statuses

            try {
                const { rows } = await client.query(updateQuery, queryValues);
                if (rows.length > 0) {
                    results.push({
                        changeId: change.changeId,
                        resourceId: change.resourceId,
                        success: true,
                        message: `Submission ${change.resourceId} marked for rejection review.`,
                        data: (config.formatter || identityFormatter)(rows[0])
                    });
                } else {
                     results.push({
                        changeId: change.changeId,
                        resourceId: change.resourceId,
                        success: false,
                        message: `Submission ${change.resourceId} not found or not in 'pending' state for rejection.`
                    });
                }
            } catch (itemError) {
                 console.error(`[rejectChanges] Error rejecting change for submission ${change.resourceId}:`, itemError);
                 results.push({ changeId: change.changeId, resourceId: change.resourceId, success: false, message: itemError.message });
            }
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[rejectChanges] Transaction error for submissions:`, error);
        throw error; // Propagate error
    } finally {
        client.release();
    }
  } else {
     changesToReject.forEach(change => {
        results.push({
            changeId: change.changeId,
            resourceId: change.resourceId,
            success: true, // Effectively a no-op for non-submission types in this basic model
            message: `Change suggestion for resource ${change.resourceId} noted as rejected (no backend state change).`
        });
    });
  }
  return results;
};


// --- Other AdminModel functions (approveSubmission, bulkAddResources, etc.) ---
// These are assumed to be largely okay based on the request focusing on data cleanup,
// but they should also use getResourceConfig and formatters consistently.
// Ensure that any direct table name usage is replaced by config.tableName.

export const approveSubmission = async (submissionId, itemType, itemData, cityId, neighborhoodId, placeId, submittedByUserId, reviewedByAdminId) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    let newItem;
    const commonItemData = { ...itemData, google_place_id: placeId };

    const targetResourceType = itemType === 'restaurant' ? 'restaurants' : 'dishes';
    const itemConfig = getResourceConfig(targetResourceType);


    if (itemType === 'restaurant') {
      const restaurantData = { 
          ...commonItemData, 
          city_id: cityId, 
          neighborhood_id: neighborhoodId, 
          phone: commonItemData.phone || commonItemData.phone_number, 
        };
      // Remove fields not in restaurant schema or handled by commonItemData
      delete restaurantData.tags; delete restaurantData.type; delete restaurantData.phone_number;
      delete restaurantData.city_name; delete restaurantData.borough; delete restaurantData.neighborhood_name;
      // Ensure only allowed columns are passed
      const finalRestaurantData = {};
        itemConfig.allowedCreateColumns.forEach(col => {
            if (restaurantData.hasOwnProperty(col)) {
                finalRestaurantData[col] = restaurantData[col];
            }
        });

      newItem = await createResource(targetResourceType, finalRestaurantData); // Use generic createResource
    } else if (itemType === 'dish') {
      if (!itemData.restaurant_id && !commonItemData.restaurant_id) throw new Error('Restaurant ID is required for dish submission.');
      const dishData = { 
          ...commonItemData, 
          restaurant_id: parseInt(itemData.restaurant_id || commonItemData.restaurant_id, 10), 
        };
      delete dishData.type; delete dishData.city_id; delete dishData.neighborhood_id;
      delete dishData.city_name; delete dishData.borough; delete dishData.neighborhood_name;

      const finalDishData = {};
        itemConfig.allowedCreateColumns.forEach(col => {
            if (dishData.hasOwnProperty(col)) {
                finalDishData[col] = dishData[col];
            }
        });
      newItem = await createResource(targetResourceType, finalDishData); // Use generic createResource
    } else { throw new Error(`Unsupported item type for submission approval: ${itemType}`); }

    if (!newItem || !newItem.id) throw new Error(`Failed to create ${itemType} from submission or created item has no ID.`);

    const submissionConfig = getResourceConfig('submissions');
    let submissionUpdateQuery = `UPDATE ${format('%I', submissionConfig.tableName)} SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1 `;
    const updateValues = [reviewedByAdminId, submissionId];
    let itemFkColumn = null;
    if (itemType === 'restaurant' && submissionConfig.allowedUpdateColumns.includes('restaurant_id')) itemFkColumn = 'restaurant_id';
    else if (itemType === 'dish' && submissionConfig.allowedUpdateColumns.includes('dish_id')) itemFkColumn = 'dish_id';


    if (itemFkColumn) {
        submissionUpdateQuery += `, ${format('%I',itemFkColumn)} = $${updateValues.length + 1} `;
        updateValues.push(parseInt(newItem.id, 10));
    }
    submissionUpdateQuery += ` WHERE id = $2 RETURNING *;`; // $2 is submissionId

    const { rows: updatedSubmissionRows } = await client.query(submissionUpdateQuery, updateValues);
    if (updatedSubmissionRows.length === 0) throw new Error('Failed to update submission status after item creation.');

    await client.query('COMMIT');
    const formatter = itemConfig.formatter || identityFormatter;
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
  const submissionConfig = getResourceConfig('submissions');
  const query = format(`
    UPDATE %I
    SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = $2
    WHERE id = $3 AND status = 'pending' RETURNING *;
  `, submissionConfig.tableName);
  try {
    const { rows } = await db.query(query, [reviewedByAdminId, rejection_reason, submissionId]);
    return rows.length > 0 ? (submissionConfig.formatter || identityFormatter)(rows[0]) : null;
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
            try {
                // Use the generic createResource function which handles allowed columns and formatters
                const createdItem = await createResource(resourceType, item); // createResource is part of this model
                 if (createdItem) {
                    results.createdItems.push(createdItem); // createResource already applies formatter
                    results.successCount++;
                } else {
                    throw new Error('Insert did not return a record via createResource.');
                }
            } catch (itemError) {
                 results.failureCount++;
                 results.errors.push({
                    itemProvided: item,
                    error: itemError.message,
                    detail: itemError.detail || (itemError.original ? itemError.original.detail : null)
                });
            }
        }
        if (results.failureCount > 0 && results.successCount === 0) {
            await client.query('ROLLBACK');
            console.warn(`[bulkAddResources] All items failed for ${resourceType}. Rolling back.`);
        } else if (results.failureCount > 0) {
            await client.query('COMMIT'); // Partial success, commit successful items
            console.warn(`[bulkAddResources] Some items failed during bulk add for ${resourceType}. Successful items committed.`);
        }
        else {
            await client.query('COMMIT');
        }
        return results;
    } catch (batchError) {
        await client.query('ROLLBACK');
        console.error(`[bulkAddResources] Critical error during bulk add for ${resourceType}:`, batchError);
        throw batchError;
    } finally {
        client.release();
    }
};

export const checkExistingItems = async (resourceType, itemsToCheck) => {
  const config = getResourceConfig(resourceType);
  const results = [];
  for (const item of itemsToCheck) {
    let existingDbRecord = null;
    let checkQuery = null;
    const queryValues = [];
    let queryBuilt = false;

    // Define specific checks for resource types
    if (resourceType === 'restaurants') {
        if (item.google_place_id) {
            checkQuery = format('SELECT * FROM %I WHERE google_place_id = $1 LIMIT 1', config.tableName);
            queryValues.push(item.google_place_id);
            queryBuilt = true;
        } else if (item.name && item.address && item.city_id) { // More specific check for restaurants
            checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND LOWER(address) = LOWER($2) AND city_id = $3 LIMIT 1', config.tableName);
            queryValues.push(item.name, item.address, parseInt(item.city_id, 10));
            queryBuilt = true;
        } else if (item.name && item.city_id) { // Fallback if address not provided
            checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND city_id = $2 LIMIT 1', config.tableName);
            queryValues.push(item.name, parseInt(item.city_id, 10));
            queryBuilt = true;
        }
    } else if (resourceType === 'dishes') {
        if (item.name && item.restaurant_id) {
            checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND restaurant_id = $2 LIMIT 1', config.tableName);
            queryValues.push(item.name, parseInt(item.restaurant_id, 10));
            queryBuilt = true;
        }
    } else if (resourceType === 'cities') {
        if (item.name) { // Optionally add state_code, country_code for uniqueness
            checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) LIMIT 1', config.tableName);
            queryValues.push(item.name);
             if (item.state_code && config.allowedCreateColumns.includes('state_code')) {
                checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND LOWER(state_code) = LOWER($2) LIMIT 1', config.tableName);
                queryValues.push(item.state_code);
            }
            queryBuilt = true;
        }
    } else if (resourceType === 'neighborhoods') {
        if (item.name && item.city_id) {
            checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) AND city_id = $2 LIMIT 1', config.tableName);
            queryValues.push(item.name, parseInt(item.city_id, 10));
            queryBuilt = true;
        }
    } else if (resourceType === 'hashtags') {
        if (item.name) {
            checkQuery = format('SELECT * FROM %I WHERE LOWER(name) = LOWER($1) LIMIT 1', config.tableName);
            queryValues.push(item.name);
            queryBuilt = true;
        }
    } else if (resourceType === 'users') {
        if (item.email) {
            checkQuery = format('SELECT * FROM %I WHERE LOWER(email) = LOWER($1) LIMIT 1', config.tableName);
            queryValues.push(item.email);
            queryBuilt = true;
        } else if (item.username && config.allowedCreateColumns.includes('username')) {
            checkQuery = format('SELECT * FROM %I WHERE LOWER(username) = LOWER($1) LIMIT 1', config.tableName);
            queryValues.push(item.username);
            queryBuilt = true;
        }
    }
    // Add more resource-specific checks as needed

    if (queryBuilt && checkQuery) {
        const { rows } = await db.query(checkQuery, queryValues);
        if (rows.length > 0) {
            existingDbRecord = rows[0];
        }
    }
    results.push({
        item,
        existing: existingDbRecord ? (config.formatter || identityFormatter)(existingDbRecord) : null
    });
  }
  return results;
};

// Helper function to get changes by IDs
export const getChangesByIds = async (resourceType, changeIds) => {
  if (!changeIds || !Array.isArray(changeIds) || changeIds.length === 0) {
    console.log('[AdminModel] getChangesByIds called with empty or invalid changeIds');
    return [];
  }

  console.log(`[AdminModel] getChangesByIds: Attempting to find ${changeIds.length} changes for ${resourceType}`);
  console.log(`[AdminModel] changeIds to find: ${changeIds.join(', ')}`);

  try {
    // First get all changes for the resource type
    const allChanges = await analyzeData(resourceType);
    
    console.log(`[AdminModel] analyzeData returned ${allChanges.length} total changes`);
    
    // Log all changeIds from analyzeData for comparison
    console.log(`[AdminModel] All available changeIds: ${allChanges.map(c => c.changeId).join(', ')}`);
    
    // Filter to only the changes with matching changeIds
    const matchedChanges = allChanges.filter(change => 
      changeIds.includes(change.changeId)
    );
    
    console.log(`[AdminModel] Found ${matchedChanges.length} changes out of ${changeIds.length} requested IDs for ${resourceType}`);
    
    // Log each change that was found
    matchedChanges.forEach((change, index) => {
      console.log(`[AdminModel] Found change #${index + 1}: changeId=${change.changeId}, type=${change.type}, field=${change.field}`);
    });
    
    // Log each changeId that wasn't found
    const missingChangeIds = changeIds.filter(id => !matchedChanges.some(change => change.changeId === id));
    if (missingChangeIds.length > 0) {
      console.log(`[AdminModel] Missing changeIds: ${missingChangeIds.join(', ')}`);
    }
    
    return matchedChanges;
  } catch (error) {
    console.error(`[AdminModel] Error in getChangesByIds for ${resourceType}:`, error);
    throw error;
  }
};