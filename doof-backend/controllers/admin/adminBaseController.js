import { logInfo, logError } from '../../utils/logger.js';
import {
  formatRestaurant,
  formatDish,
  formatList,
  formatUser,
  formatNeighborhood,
  formatListItem,
  identityFormatter
} from '../../utils/formatters.js';

/**
 * Maps resource type strings to their corresponding formatter functions
 * @param {string} resourceType - The type of resource to format
 * @returns {Function} The formatter function for the resource type
 */
export const getFormatterForResourceType = (resourceType) => {
  if (!resourceType) return identityFormatter;
  switch (resourceType.toLowerCase()) {
    case 'restaurants': return formatRestaurant;
    case 'dishes': return formatDish;
    case 'lists': return formatList;
    case 'users': return formatUser;
    case 'cities': return identityFormatter;
    case 'neighborhoods': return formatNeighborhood;
    case 'hashtags': return identityFormatter;
    case 'restaurant_chains': return identityFormatter;
    case 'submissions': return identityFormatter;
    case 'listitems': return formatListItem;
    default: return identityFormatter;
  }
};

/**
 * Validates that user has superuser privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True if user is authorized, false otherwise (response sent)
 */
export const validateSuperuserAccess = (req, res) => {
  const isUserPresent = req.user && req.user.id;
  const isSuperuserByRole = req.user && req.user.role === 'superuser';
  const isSuperuserByAccountType = req.user && req.user.account_type === 'superuser';
  const isSuperuser = isSuperuserByRole || isSuperuserByAccountType;
  
  if (!isUserPresent || !isSuperuser) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied: Superuser privileges required.',
      debug: process.env.NODE_ENV === 'development' ? {
        userPresent: isUserPresent,
        role: req.user?.role,
        account_type: req.user?.account_type
      } : undefined
    });
    return false;
  }
  
  return true;
};

/**
 * Standardized success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {Object} pagination - Optional pagination info
 */
export const sendSuccessResponse = (res, data, message = 'Operation successful', pagination = null) => {
  const response = {
    success: true,
    message,
    data
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  res.status(200).json(response);
};

/**
 * Standardized error response
 * @param {Object} res - Express response object
 * @param {Error|string} error - Error object or message
 * @param {number} statusCode - HTTP status code
 * @param {string} operation - Operation that failed
 */
export const sendErrorResponse = (res, error, statusCode = 500, operation = 'operation') => {
  const message = typeof error === 'string' ? error : error.message;
  logError(`Error in ${operation}:`, error);
  
  res.status(statusCode).json({
    success: false,
    message: `Failed to ${operation}. Error: ${message}`
  });
};

/**
 * Generic pagination helper
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination object
 */
export const createPagination = (page, limit, total) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  totalPages: Math.ceil(total / limit)
});

/**
 * Parse and validate pagination parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} Parsed pagination parameters
 */
export const parsePaginationParams = (query) => {
  const { page = 1, limit = 20, sort = 'id', order = 'asc', ...filters } = query;
  
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort,
    order,
    filters
  };
};

/**
 * Health check endpoint for admin services
 */
export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}; 