// doof-backend/models/admin/AdminDataAnalyzer.js

import db from '../../db/index.js';
import format from 'pg-format';
import { 
  getResourceConfig, 
  generateChangeId, 
  formatPhoneNumber, 
  formatWebsite,
  logAdminOperation, 
  createAdminModelError 
} from './AdminBaseModel.js';
import { buildZipLookupQuery, executeQuery } from './AdminQueryBuilder.js';
import { getLookupData } from './AdminResourceManager.js';
import { toTitleCase } from '../../utils/formatters.js';

/**
 * AdminDataAnalyzer - Handles data cleanup and analysis operations
 * Provides comprehensive data quality checks and automated fixes
 */

/**
 * Fetches data from Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<object|null>} Place details or null if failed
 */
const fetchFromGooglePlaces = async (placeId) => {
  try {
    // This would integrate with Google Places API
    // For now, returning null to prevent API calls during development
    logAdminOperation('info', 'fetchFromGooglePlaces', 'external', `Skipping Google Places API call for place ID: ${placeId}`);
    return null;
  } catch (error) {
    logAdminOperation('error', 'fetchFromGooglePlaces', 'external', 'Google Places API call failed', { error: error.message, placeId });
    return null;
  }
};

/**
 * Looks up neighborhood by zip code
 * @param {string} zipCode - Zip code to lookup
 * @returns {Promise<object|null>} Neighborhood data or null if not found
 */
const lookupNeighborhoodByZip = async (zipCode) => {
  try {
    const queryObj = buildZipLookupQuery(zipCode);
    const result = await executeQuery(queryObj, 'lookupNeighborhoodByZip', 'neighborhoods');
    
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logAdminOperation('error', 'lookupNeighborhoodByZip', 'neighborhoods', 'Zip lookup failed', { error: error.message, zipCode });
    return null;
  }
};

/**
 * Gets name by ID for various resource types
 * @param {string} resourceType - Type of resource
 * @param {number} id - Resource ID
 * @returns {Promise<string|null>} Resource name or null if not found
 */
const getNameById = async (resourceType, id) => {
  try {
    const tableName = resourceType === 'neighborhoods' ? 'neighborhoods' : 
                     resourceType === 'restaurants' ? 'restaurants' : 
                     resourceType === 'cities' ? 'cities' : null;
    
    if (!tableName) {
      throw new Error(`Unsupported resource type for name lookup: ${resourceType}`);
    }
    
    const query = format('SELECT name FROM %I WHERE id = $1', tableName);
    const result = await db.query(query, [id]);
    
    return result.rows.length > 0 ? result.rows[0].name : null;
  } catch (error) {
    logAdminOperation('error', 'getNameById', resourceType, `Failed to get name for ID: ${id}`, { error: error.message });
    return null;
  }
};

/**
 * Analyzes data for a specific resource type and identifies cleanup opportunities
 * @param {string} resourceType - Type of resource to analyze
 * @returns {Promise<Array>} Array of proposed changes
 */
export const analyzeData = async (resourceType) => {
  try {
    const config = getResourceConfig(resourceType);
    if (!config || !config.tableName || !config.fieldsForCleanup) {
      logAdminOperation('error', 'analyzeData', resourceType, 'Misconfigured resource type', {
        hasConfig: !!config,
        hasTableName: !!(config?.tableName),
        hasFieldsForCleanup: !!(config?.fieldsForCleanup)
      });
      return [];
    }

    logAdminOperation('info', 'analyzeData', resourceType, 'Starting data analysis');

    const changes = [];
    let queryBase = format('SELECT * FROM %I', config.tableName);
    const queryParams = [];

    // Add resource-specific filters if defined
    if (config.analysisFilter) {
      queryBase += ` WHERE ${config.analysisFilter}`;
    }

    logAdminOperation('info', 'analyzeData', resourceType, 'Executing analysis query', { query: queryBase });

    let resources;
    try {
      resources = await db.query(queryBase, queryParams);
    } catch (dbError) {
      logAdminOperation('error', 'analyzeData', resourceType, 'Database error during analysis', { error: dbError.message });
      throw createAdminModelError('analyzeData', resourceType, dbError);
    }

    // Get lookup data for analysis
    const lookupData = await prepareLookupData(resourceType);

    // Analyze each resource
    for (const resource of resources.rows) {
      if (!resource.id) {
        logAdminOperation('warn', 'analyzeData', resourceType, 'Resource missing ID, skipping', { resource });
        continue;
      }

      const resourceId = resource.id;

      // Apply resource-specific analysis rules
      const resourceChanges = await analyzeResource(resourceType, resource, lookupData);
      changes.push(...resourceChanges);

      // Apply standard field cleanup rules
      const fieldChanges = await analyzeResourceFields(resourceType, resource, config);
      changes.push(...fieldChanges);
    }

    logAdminOperation('info', 'analyzeData', resourceType, `Analysis complete: found ${changes.length} potential changes`);
    return changes;
  } catch (error) {
    logAdminOperation('error', 'analyzeData', resourceType, 'Analysis failed', { error: error.message });
    throw createAdminModelError('analyzeData', resourceType, error);
  }
};

/**
 * Prepares lookup data needed for analysis
 * @param {string} resourceType - Resource type being analyzed
 * @returns {Promise<object>} Object containing relevant lookup maps
 */
const prepareLookupData = async (resourceType) => {
  const lookupData = {};

  try {
    if (resourceType === 'restaurants' || resourceType === 'neighborhoods') {
      lookupData.neighborhoods = await getLookupData('neighborhoods');
    }

    if (resourceType === 'dishes') {
      lookupData.restaurants = await getLookupData('restaurants');
    }

    if (resourceType === 'neighborhoods') {
      lookupData.cities = await getLookupData('cities');
    }
  } catch (error) {
    logAdminOperation('warn', 'prepareLookupData', resourceType, 'Failed to load some lookup data', { error: error.message });
  }

  return lookupData;
};

/**
 * Analyzes a single resource for resource-specific issues
 * @param {string} resourceType - Type of resource
 * @param {object} resource - Resource data
 * @param {object} lookupData - Lookup data for analysis
 * @returns {Promise<Array>} Array of changes for this resource
 */
const analyzeResource = async (resourceType, resource, lookupData) => {
  const changes = [];
  const resourceId = resource.id;

  try {
    switch (resourceType.toLowerCase()) {
      case 'restaurants':
        changes.push(...await analyzeRestaurant(resource, lookupData));
        break;
      case 'hashtags':
        changes.push(...await analyzeHashtag(resource));
        break;
      case 'dishes':
        changes.push(...await analyzeDish(resource, lookupData));
        break;
      // Add more resource-specific analyzers as needed
    }
  } catch (error) {
    logAdminOperation('warn', 'analyzeResource', resourceType, `Failed to analyze resource ${resourceId}`, { error: error.message });
  }

  return changes;
};

/**
 * Analyzes restaurant-specific issues
 * @param {object} restaurant - Restaurant data
 * @param {object} lookupData - Lookup data
 * @returns {Promise<Array>} Array of changes
 */
const analyzeRestaurant = async (restaurant, lookupData) => {
  const changes = [];
  const resourceId = restaurant.id;

  // Check for missing address via Google Places
  if (!restaurant.address && restaurant.google_place_id) {
    try {
      const placeDetails = await fetchFromGooglePlaces(restaurant.google_place_id);
      if (placeDetails?.address) {
        changes.push({
          changeId: generateChangeId('restaurants', resourceId, 'address', 'google_places'),
          resourceId,
          resourceType: 'restaurants',
          field: 'address',
          currentValue: restaurant.address || null,
          proposedValue: placeDetails.address,
          changeType: 'google_places',
          changeReason: 'Missing address retrieved from Google Places API',
          status: 'pending'
        });
      }
    } catch (error) {
      logAdminOperation('warn', 'analyzeRestaurant', 'restaurants', `Google Places lookup failed for restaurant ${resourceId}`, { error: error.message });
    }
  }

  // Check for missing website via Google Places
  if (!restaurant.website && restaurant.google_place_id) {
    try {
      const placeDetails = await fetchFromGooglePlaces(restaurant.google_place_id);
      if (placeDetails?.website) {
        changes.push({
          changeId: generateChangeId('restaurants', resourceId, 'website', 'google_places'),
          resourceId,
          resourceType: 'restaurants',
          field: 'website',
          currentValue: restaurant.website || null,
          proposedValue: formatWebsite(placeDetails.website),
          changeType: 'google_places',
          changeReason: 'Missing website retrieved from Google Places API',
          status: 'pending'
        });
      }
    } catch (error) {
      logAdminOperation('warn', 'analyzeRestaurant', 'restaurants', `Google Places lookup failed for restaurant ${resourceId}`, { error: error.message });
    }
  }

  // Check for missing neighborhood via zip code lookup
  if (restaurant.address && !restaurant.neighborhood_id && restaurant.zip_code) {
    try {
      const neighborhood = await lookupNeighborhoodByZip(restaurant.zip_code);
      if (neighborhood?.id) {
        changes.push({
          changeId: generateChangeId('restaurants', resourceId, 'neighborhood_id', 'zip_lookup'),
          resourceId,
          resourceType: 'restaurants',
          field: 'neighborhood_id',
          currentValue: restaurant.neighborhood_id || null,
          proposedValue: neighborhood.id,
          changeType: 'zip_lookup',
          changeReason: `Neighborhood ${neighborhood.name} (ID: ${neighborhood.id}) found for zip code ${restaurant.zip_code}`,
          status: 'pending'
        });
      }
    } catch (error) {
      logAdminOperation('warn', 'analyzeRestaurant', 'restaurants', `Zip lookup failed for restaurant ${resourceId}`, { error: error.message });
    }
  }

  return changes;
};

/**
 * Analyzes hashtag-specific issues
 * @param {object} hashtag - Hashtag data
 * @returns {Array} Array of changes
 */
const analyzeHashtag = async (hashtag) => {
  const changes = [];
  const resourceId = hashtag.id;

  // Ensure hashtags have # prefix
  if (hashtag.name && !hashtag.name.startsWith('#')) {
    changes.push({
      changeId: generateChangeId('hashtags', resourceId, 'name', 'format'),
      resourceId,
      resourceType: 'hashtags',
      field: 'name',
      currentValue: hashtag.name,
      proposedValue: `#${hashtag.name}`,
      changeType: 'format',
      changeReason: 'Added # prefix to hashtag name',
      status: 'pending'
    });
  }

  return changes;
};

/**
 * Analyzes dish-specific issues
 * @param {object} dish - Dish data
 * @param {object} lookupData - Lookup data
 * @returns {Array} Array of changes
 */
const analyzeDish = async (dish, lookupData) => {
  const changes = [];
  // Add dish-specific analysis logic here
  // For example: check for missing restaurant names, price formatting, etc.
  return changes;
};

/**
 * Analyzes standard field cleanup rules for any resource
 * @param {string} resourceType - Type of resource
 * @param {object} resource - Resource data
 * @param {object} config - Resource configuration
 * @returns {Promise<Array>} Array of field changes
 */
const analyzeResourceFields = async (resourceType, resource, config) => {
  const changes = [];
  const resourceId = resource.id;

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
            resourceId,
            resourceType,
            field,
            currentValue,
            proposedValue,
            changeType: 'trim',
            changeReason: 'Removed leading/trailing whitespace',
            status: 'pending'
          });
        }
      }

      // Rule: Title case formatting
      if (rules.titleCase && typeof currentValue === 'string') {
        const proposedValue = toTitleCase(currentValue);
        if (proposedValue !== currentValue) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, field, 'title_case'),
            resourceId,
            resourceType,
            field,
            currentValue,
            proposedValue,
            changeType: 'title_case',
            changeReason: 'Applied title case formatting',
            status: 'pending'
          });
        }
      }

      // Rule: Truncate long text
      if (rules.truncate && typeof currentValue === 'string') {
        const maxLength = rules.truncate;
        if (currentValue.length > maxLength) {
          const proposedValue = currentValue.substring(0, maxLength - 3) + '...';
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, field, 'truncate'),
            resourceId,
            resourceType,
            field,
            currentValue,
            proposedValue,
            changeType: 'truncate',
            changeReason: `Truncated to ${maxLength} characters`,
            status: 'pending'
          });
        }
      }

      // Rule: Format phone numbers
      if (rules.formatUS && typeof currentValue === 'string') {
        const proposedValue = formatPhoneNumber(currentValue);
        if (proposedValue !== currentValue) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, field, 'phone_format'),
            resourceId,
            resourceType,
            field,
            currentValue,
            proposedValue,
            changeType: 'phone_format',
            changeReason: 'Formatted phone number to US standard',
            status: 'pending'
          });
        }
      }

      // Rule: Format websites
      if (rules.prefixHttp && typeof currentValue === 'string') {
        const proposedValue = formatWebsite(currentValue);
        if (proposedValue !== currentValue) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, field, 'website_format'),
            resourceId,
            resourceType,
            field,
            currentValue,
            proposedValue,
            changeType: 'website_format',
            changeReason: 'Added protocol prefix to website URL',
            status: 'pending'
          });
        }
      }

      // Rule: Convert to lowercase
      if (rules.toLowerCase && typeof currentValue === 'string') {
        const proposedValue = currentValue.toLowerCase();
        if (proposedValue !== currentValue) {
          changes.push({
            changeId: generateChangeId(resourceType, resourceId, field, 'lowercase'),
            resourceId,
            resourceType,
            field,
            currentValue,
            proposedValue,
            changeType: 'lowercase',
            changeReason: 'Converted to lowercase',
            status: 'pending'
          });
        }
      }
    }
  }

  return changes;
};

/**
 * Gets changes by their IDs for applying or rejecting
 * @param {string} resourceType - Type of resource
 * @param {Array} changeIds - Array of change IDs to retrieve
 * @returns {Promise<Array>} Array of matching changes
 */
export const getChangesByIds = async (resourceType, changeIds) => {
  if (!changeIds || !Array.isArray(changeIds) || changeIds.length === 0) {
    logAdminOperation('info', 'getChangesByIds', resourceType, 'Called with empty or invalid changeIds');
    return [];
  }

  logAdminOperation('info', 'getChangesByIds', resourceType, `Attempting to find ${changeIds.length} changes`);

  try {
    // Get all changes for the resource type
    const allChanges = await analyzeData(resourceType);

    // Filter to only the changes with matching changeIds
    const matchedChanges = allChanges.filter(change => 
      changeIds.includes(change.changeId)
    );

    logAdminOperation('info', 'getChangesByIds', resourceType, 
      `Found ${matchedChanges.length} changes out of ${changeIds.length} requested IDs`);

    return matchedChanges;
  } catch (error) {
    logAdminOperation('error', 'getChangesByIds', resourceType, 'Failed to get changes by IDs', { error: error.message });
    throw createAdminModelError('getChangesByIds', resourceType, error);
  }
};

/**
 * Default export containing all data analysis functions
 */
export default {
  analyzeData,
  getChangesByIds
}; 