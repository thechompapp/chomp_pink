import {
  formatRestaurant,
  formatDish,
  formatUser,
  formatNeighborhood,
  formatList,
  formatListItem,
  toTitleCase,
  identityFormatter
} from '../../utils/formatters.js';

/**
 * Resource configuration for all admin operations
 * This centralized configuration defines the structure for each resource type
 */
export const resourceConfig = {
  restaurants: {
    tableName: 'restaurants',
    formatter: formatRestaurant,
    allowedCreateColumns: ['name', 'cuisine', 'address', 'city_id', 'neighborhood_id', 'zip_code', 'phone', 'website', 'instagram_handle', 'google_place_id', 'latitude', 'longitude', 'chain_id', 'created_at', 'updated_at'],
    allowedUpdateColumns: ['name', 'cuisine', 'address', 'city_id', 'neighborhood_id', 'zip_code', 'phone', 'website', 'instagram_handle', 'google_place_id', 'latitude', 'longitude', 'adds', 'chain_id', 'updated_at'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        cuisine: { titleCase: true, trim: true },
        description: { truncate: 500 },
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
  users: {
    tableName: 'users',
    formatter: formatUser,
    allowedCreateColumns: ['username', 'email', 'password_hash', 'account_type', 'created_at', 'name'],
    allowedUpdateColumns: ['username', 'email', 'password_hash', 'account_type', 'name', 'updated_at'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        email: { toLowerCase: true }
    }
  },
  cities: {
    tableName: 'cities',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'has_boroughs', 'state_code', 'country_code'],
    allowedUpdateColumns: ['name', 'has_boroughs', 'state_code', 'country_code'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true }
    }
  },
  neighborhoods: {
    tableName: 'neighborhoods',
    formatter: formatNeighborhood,
    allowedCreateColumns: ['name', 'city_id', 'borough', 'zipcode_ranges', 'parent_id', 'location_level', 'geom'],
    allowedUpdateColumns: ['name', 'city_id', 'borough', 'zipcode_ranges', 'parent_id', 'location_level', 'geom'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        borough: { titleCase: true, trim: true }
    }
  },
  hashtags: {
    tableName: 'hashtags',
    formatter: identityFormatter,
    allowedCreateColumns: ['name', 'category'],
    allowedUpdateColumns: ['name', 'category'],
    fieldsForCleanup: {
        name: { trim: true },
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
        description: { truncate: 1000 },
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
    formatter: identityFormatter,
    allowedCreateColumns: ['user_id', 'type', 'name', 'location', 'tags', 'place_id', 'city', 'neighborhood', 'status', 'created_at', 'restaurant_id', 'restaurant_name', 'dish_id', 'rejection_reason', 'description', 'phone', 'website'],
    allowedUpdateColumns: ['status', 'reviewed_by', 'reviewed_at', 'restaurant_id', 'dish_id', 'rejection_reason', 'name', 'location', 'tags', 'city', 'neighborhood', 'description', 'phone', 'website'],
    fieldsForCleanup: {
        name: { titleCase: true, trim: true },
        location: { trim: true },
        city: { titleCase: true, trim: true },
        neighborhood: { titleCase: true, trim: true },
        restaurant_name: { titleCase: true, trim: true },
        description: { truncate: 500 },
        phone: { formatUS: true },
        website: { prefixHttp: true }
    },
    analysisFilter: `(status = 'pending' OR status = 'needs_review')`
  },
  listitems: { 
    tableName: 'listitems',
    formatter: formatListItem,
    allowedCreateColumns: ['list_id', 'item_type', 'item_id', 'notes', 'added_at'],
    allowedUpdateColumns: ['notes', 'added_at'],
    fieldsForCleanup: {
        notes: { truncate: 255 }
    }
  }
};

/**
 * Gets configuration for a specific resource type
 * @param {string} resourceType - The resource type to get config for
 * @returns {object} Resource configuration object
 * @throws {Error} If resource type is not supported
 */
export const getResourceConfig = (resourceType) => {
  const rType = resourceType ? resourceType.toLowerCase() : null;
  if (!rType || !resourceConfig[rType]) {
      console.error(`Unsupported resource type for config: ${resourceType}`);
      throw new Error(`Unsupported resource type: ${resourceType}`);
  }
  return resourceConfig[rType];
};

/**
 * Generates a unique change ID for tracking data modifications
 * @param {string} resourceType - Type of resource being changed
 * @param {number} resourceId - ID of the resource
 * @param {string} field - Field being changed
 * @param {string} changeType - Type of change (format, google_places, etc.)
 * @returns {string} Unique change identifier
 */
export const generateChangeId = (resourceType, resourceId, field, changeType) => {
  return `${resourceType}_${resourceId}_${field}_${changeType}_${Date.now()}`;
};

/**
 * Formats phone numbers to US standard format
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return phone;
  
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Handle common patterns
  if (digits.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // Remove leading 1 and format
    digits = digits.slice(1);
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Return original if not standard format
  return phone;
};

/**
 * Formats website URLs to include protocol
 * @param {string} website - Raw website URL
 * @returns {string} Formatted website URL with protocol
 */
export const formatWebsite = (website) => {
  if (!website || typeof website !== 'string') return website;
  
  const trimmed = website.trim().toLowerCase();
  
  // Skip if already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return website.trim();
  }
  
  // Add https:// prefix
  return `https://${website.trim()}`;
};

/**
 * Validates that a resource type is supported
 * @param {string} resourceType - Resource type to validate
 * @returns {boolean} True if supported, false otherwise
 */
export const isValidResourceType = (resourceType) => {
  return resourceType && typeof resourceType === 'string' && 
         resourceConfig.hasOwnProperty(resourceType.toLowerCase());
};

/**
 * Gets all supported resource types
 * @returns {string[]} Array of supported resource type names
 */
export const getSupportedResourceTypes = () => {
  return Object.keys(resourceConfig);
};

/**
 * Creates a standardized error object for admin model operations
 * @param {string} operation - The operation that failed
 * @param {string} resourceType - The resource type involved
 * @param {Error} originalError - The original error
 * @returns {Error} Standardized error object
 */
export const createAdminModelError = (operation, resourceType, originalError) => {
  const error = new Error(`Admin Model ${operation} failed for ${resourceType}: ${originalError.message}`);
  error.operation = operation;
  error.resourceType = resourceType;
  error.originalError = originalError;
  return error;
};

/**
 * Logs admin model operations with consistent formatting
 * @param {string} level - Log level (info, warn, error)
 * @param {string} operation - Operation being performed
 * @param {string} resourceType - Resource type involved
 * @param {string} message - Log message
 * @param {object} data - Optional additional data
 */
export const logAdminOperation = (level, operation, resourceType, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[AdminModel][${operation}][${resourceType}] ${message}`;
  
  if (data) {
    console[level](`${timestamp} ${logMessage}`, data);
  } else {
    console[level](`${timestamp} ${logMessage}`);
  }
};

/**
 * Default export object containing all base utilities
 */
export default {
  resourceConfig,
  getResourceConfig,
  generateChangeId,
  formatPhoneNumber,
  formatWebsite,
  isValidResourceType,
  getSupportedResourceTypes,
  createAdminModelError,
  logAdminOperation
}; 