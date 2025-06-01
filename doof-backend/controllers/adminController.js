// doof-backend/controllers/adminController.js
import * as AdminModel from '../models/adminModel.js';
import * as RestaurantModel from '../models/restaurantModel.js';
import * as DishModel from '../models/dishModel.js';
import UserModel from '../models/userModel.js';
import * as CityModel from '../models/cityModel.js';
import * as NeighborhoodModel from '../models/neighborhoodModel.js';
import * as HashtagModel from '../models/hashtagModel.js';
import * as ListModel from '../models/listModel.js';
import SubmissionModel from '../models/submissionModel.js';
import db from '../db/index.js';
import { logInfo, logError } from '../utils/logger.js';

import {
  formatRestaurant,
  formatDish,
  formatList,
  formatUser,
  formatNeighborhood,
  formatListItem,
  identityFormatter // Ensure identityFormatter is available
} from '../utils/formatters.js';

/**
 * Maps resource type strings to their corresponding model modules
 * @param {string} resourceType - The type of resource (e.g., 'restaurants', 'dishes')
 * @returns {Object|null} The corresponding model module or null if not found
 */
const getModelForResourceType = (resourceType) => {
  if (!resourceType) return null;
  switch (resourceType.toLowerCase()) {
    case 'restaurants': return RestaurantModel;
    case 'dishes': return DishModel;
    case 'users': return UserModel;
    case 'cities': return CityModel;
    case 'neighborhoods': return NeighborhoodModel;
    case 'hashtags': return HashtagModel;
    case 'lists': return ListModel;
    case 'submissions': return SubmissionModel;
    // listitems might be managed via ListModel or directly via AdminModel.
    // If AdminModel handles it directly, no separate model needed here.
    case 'listitems': return null; 
    case 'restaurant_chains': return null; // Assuming handled by AdminModel or a specific chain model
    default: return null;
  }
};

/**
 * Maps resource type strings to their corresponding formatter functions
 * @param {string} resourceType - The type of resource to format
 * @returns {Function} The formatter function for the resource type
 */
const getFormatterForResourceType = (resourceType) => {
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
    case 'submissions': return identityFormatter; // Submissions are often raw data until processed
    case 'listitems': return formatListItem;
    default: return identityFormatter;
  }
};

/**
 * Retrieves all resources of a given type with pagination and filtering
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.resourceType - Type of resource to fetch
 * @param {Object} req.query - Query parameters for pagination and filtering
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=20] - Number of items per page
 * @param {string} [req.query.sort='id'] - Field to sort by
 * @param {string} [req.query.order='asc'] - Sort order (asc/desc)
 * @param {Object} req.user - Authenticated user object (must be superuser)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with resources and pagination info
 */
export const getAllResources = async (req, res) => {
  let { resourceType } = req.params;
  // Handle direct /submissions route if resourceType isn't in params
  if(req.route && req.route.path === '/submissions' && !resourceType) {
    resourceType = 'submissions';
  }
  if (!resourceType) {
    return res.status(400).json({ success: false, message: "Resource type is required." });
  }
  
  // Ensure user is authenticated and is a superuser - robust check for both role and account_type
  const isUserPresent = req.user && req.user.id;
  const isSuperuserByRole = req.user && req.user.role === 'superuser';
  const isSuperuserByAccountType = req.user && req.user.account_type === 'superuser';
  const isSuperuser = isSuperuserByRole || isSuperuserByAccountType;
  
  if (!isUserPresent || !isSuperuser) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Superuser privileges required.',
      debug: process.env.NODE_ENV === 'development' ? {
        userPresent: isUserPresent,
        role: req.user?.role,
        account_type: req.user?.account_type
      } : undefined
    });
  }

  const { page = 1, limit = 20, sort = 'id', order = 'asc', ...filters } = req.query;

  try {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const { data, total } = await AdminModel.findAllResources(
        resourceType,
        parsedPage,
        parsedLimit,
        sort,
        order,
        filters
    );

    // data can be an empty array if no records match, which is not an error.
    // Total will reflect the count.

    const formatter = getFormatterForResourceType(resourceType);
    // Ensure data is an array before mapping. It should be from findAllResources.
    const formattedData = Array.isArray(data) ? data.map(item => (formatter || identityFormatter)(item)) : [];
    
    res.status(200).json({
      success: true,
      message: `${resourceType} fetched successfully.`,
      data: formattedData,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error(`Error fetching ${resourceType}:`, error);
    if (error.message.startsWith('Unsupported resource type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: `Failed to fetch ${resourceType}. Error: ${error.message}` });
  }
};

/**
 * Retrieves a single resource by ID and type
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.resourceType - Type of resource to fetch
 * @param {string} req.params.id - ID of the resource to fetch
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with the requested resource
 */
export const getResourceById = async (req, res) => {
  const { resourceType, id } = req.params;
  if (!resourceType) {
    return res.status(400).json({ success: false, message: "Resource type is required." });
  }
  try {
    const resourceId = parseInt(id, 10);
    if (isNaN(resourceId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format. ID must be an integer.' });
    }
    const item = await AdminModel.findResourceById(resourceType, resourceId);
    if (!item) {
      return res.status(404).json({ success: false, message: `${resourceType} with ID ${resourceId} not found.` });
    }
    const formatter = getFormatterForResourceType(resourceType);
    res.status(200).json({ success: true, message: `${resourceType} fetched successfully.`, data: (formatter || identityFormatter)(item) });
  } catch (error) {
    console.error(`Error fetching ${resourceType} with ID ${id}:`, error);
    if (error.message.startsWith('Unsupported resource type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: `Failed to fetch ${resourceType}. Error: ${error.message}` });
  }
};

/**
 * Creates a new resource of the specified type
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.resourceType - Type of resource to create
 * @param {Object} req.body - Resource data to create
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with the created resource
 */
export const createResource = async (req, res) => {
  const { resourceType } = req.params;
  if (!resourceType) {
    return res.status(400).json({ success: false, message: "Resource type is required." });
  }
  const data = req.body;
  try {
    const newItem = await AdminModel.createResource(resourceType, data);
    if (!newItem) { // Should ideally not happen if createResource throws on failure
        return res.status(500).json({ success: false, message: `Failed to create ${resourceType}. No item returned.` });
    }
    const formatter = getFormatterForResourceType(resourceType);
    res.status(201).json({ success: true, message: `${resourceType} created successfully.`, data: (formatter || identityFormatter)(newItem) });
  } catch (error) {
    console.error(`Error creating ${resourceType}:`, error);
    if (error.message.startsWith('Unsupported resource type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === '23505' || (error.message && error.message.includes('unique constraint'))) { // PostgreSQL unique violation
        return res.status(409).json({ success: false, message: `${resourceType} already exists or a unique field conflicts. Details: ${error.detail || error.message}` });
    }
    if (error.message.includes('No valid columns')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: `Failed to create ${resourceType}. Error: ${error.message}` });
  }
};

/**
 * Updates an existing resource by ID and type
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.resourceType - Type of resource to update
 * @param {string} req.params.id - ID of the resource to update
 * @param {Object} req.body - Updated resource data
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with the updated resource
 */
export const updateResource = async (req, res) => {
  const { resourceType, id } = req.params;
   if (!resourceType) {
    return res.status(400).json({ success: false, message: "Resource type is required." });
  }
  const data = req.body;
  const resourceId = parseInt(id, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format. ID must be an integer.' });
  }
  try {
    const updatedItem = await AdminModel.updateResource(resourceType, resourceId, data);
     if (!updatedItem) {
      // Check if the item actually exists before claiming a generic update failure
      const itemExists = await AdminModel.findResourceById(resourceType, resourceId);
      if (!itemExists) {
          return res.status(404).json({ success: false, message: `${resourceType} with ID ${resourceId} not found.` });
      }
      // If item exists but update returned null, it might mean no actual changes were made OR an issue.
      // AdminModel.updateResource logic has been changed to return the item even if no columns changed.
      return res.status(500).json({ success: false, message: `Failed to update ${resourceType} with ID ${resourceId}. Update operation returned no result, or no changes were applied.` });
    }
    const formatter = getFormatterForResourceType(resourceType);
    res.status(200).json({ success: true, message: `${resourceType} updated successfully.`, data: (formatter || identityFormatter)(updatedItem) });
  } catch (error) {
    console.error(`Error updating ${resourceType} with ID ${id}:`, error);
    if (error.message.startsWith('Unsupported resource type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === '23505' || (error.message && error.message.includes('unique constraint'))) {
        return res.status(409).json({ success: false, message: `Update for ${resourceType} with ID ${resourceId} failed due to a unique constraint. Details: ${error.detail || error.message}` });
    }
     if (error.message.includes('not found for update')) {
        return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: `Failed to update ${resourceType}. Error: ${error.message}` });
  }
};

/**
 * Deletes a resource by ID and type
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.resourceType - Type of resource to delete
 * @param {string} req.params.id - ID of the resource to delete
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response confirming deletion
 */
export const deleteResource = async (req, res) => {
  const { resourceType, id } = req.params;
   if (!resourceType) {
    return res.status(400).json({ success: false, message: "Resource type is required." });
  }
  const resourceId = parseInt(id, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format. ID must be an integer.' });
  }
  try {
    const deletedItemOrStatus = await AdminModel.deleteResource(resourceType, resourceId);
    if (!deletedItemOrStatus) { // If it returns false or null
      // Check if it was not found to begin with
      const itemExists = await AdminModel.findResourceById(resourceType, resourceId);
      if (!itemExists) {
          return res.status(404).json({ success: false, message: `${resourceType} with ID ${resourceId} not found.` });
      }
      // If it existed but deletion failed for other reasons
      return res.status(500).json({ success: false, message: `Failed to delete ${resourceType} with ID ${resourceId}.` });
    }
    // If deleteResource returns the deleted item, you can include it in the response.
    // If it returns a boolean, just a success message.
    res.status(200).json({ 
        success: true, 
        message: `${resourceType} deleted successfully.`,
        // data: typeof deletedItemOrStatus === 'object' ? deletedItemOrStatus : undefined 
    });
  } catch (error) {
    console.error(`Error deleting ${resourceType} with ID ${id}:`, error);
     if (error.message.startsWith('Unsupported resource type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    // Handle foreign key constraints, e.g., error.code === '23503'
    if (error.code === '23503') {
        return res.status(409).json({ success: false, message: `Cannot delete ${resourceType} with ID ${id} as it is referenced by other records. Details: ${error.detail || error.message}`});
    }
    res.status(500).json({ success: false, message: `Failed to delete ${resourceType}. Error: ${error.message}` });
  }
};

// Specific admin route handlers mapping to generic resource handlers

// Submissions
export const getSubmissions = async (req, res) => {
  req.params.resourceType = 'submissions';
  return getAllResources(req, res);
};

export const getSubmissionById = async (req, res) => {
  req.params.resourceType = 'submissions';
  return getResourceById(req, res);
};

// Restaurants
export const getRestaurants = async (req, res) => {
  req.params.resourceType = 'restaurants';
  return getAllResources(req, res);
};

export const getRestaurantById = async (req, res) => {
  req.params.resourceType = 'restaurants';
  return getResourceById(req, res);
};

export const createRestaurant = async (req, res) => {
  req.params.resourceType = 'restaurants';
  return createResource(req, res);
};

export const updateRestaurant = async (req, res) => {
  req.params.resourceType = 'restaurants';
  return updateResource(req, res);
};

export const deleteRestaurant = async (req, res) => {
  req.params.resourceType = 'restaurants';
  return deleteResource(req, res);
};

// Dishes
export const getDishes = async (req, res) => {
  req.params.resourceType = 'dishes';
  return getAllResources(req, res);
};

export const getDishById = async (req, res) => {
  req.params.resourceType = 'dishes';
  return getResourceById(req, res);
};

export const createDish = async (req, res) => {
  req.params.resourceType = 'dishes';
  return createResource(req, res);
};

export const updateDish = async (req, res) => {
  req.params.resourceType = 'dishes';
  return updateResource(req, res);
};

export const deleteDish = async (req, res) => {
  req.params.resourceType = 'dishes';
  return deleteResource(req, res);
};

// Users
export const getUsers = async (req, res) => {
  req.params.resourceType = 'users';
  return getAllResources(req, res);
};

export const getUserById = async (req, res) => {
  req.params.resourceType = 'users';
  return getResourceById(req, res);
};

export const updateUser = async (req, res) => {
  req.params.resourceType = 'users';
  return updateResource(req, res);
};

export const deleteUser = async (req, res) => {
  req.params.resourceType = 'users';
  return deleteResource(req, res);
};

export const promoteUser = async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
  }
  
  try {
    const user = await UserModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // Update user to superuser status
    const updatedUser = await UserModel.updateUser(userId, { account_type: 'superuser' });
    
    if (!updatedUser) {
      return res.status(500).json({ success: false, message: 'Failed to promote user.' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'User promoted to superuser successfully.',
      data: formatUser(updatedUser)
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    return res.status(500).json({ success: false, message: `Failed to promote user: ${error.message}` });
  }
};

// Cities
export const getCities = async (req, res) => {
  req.params.resourceType = 'cities';
  return getAllResources(req, res);
};

export const createCity = async (req, res) => {
  req.params.resourceType = 'cities';
  return createResource(req, res);
};

export const updateCity = async (req, res) => {
  req.params.resourceType = 'cities';
  return updateResource(req, res);
};

export const deleteCity = async (req, res) => {
  req.params.resourceType = 'cities';
  return deleteResource(req, res);
};

// Neighborhoods
export const getNeighborhoods = async (req, res) => {
  req.params.resourceType = 'neighborhoods';
  return getAllResources(req, res);
};

export const createNeighborhood = async (req, res) => {
  req.params.resourceType = 'neighborhoods';
  return createResource(req, res);
};

export const updateNeighborhood = async (req, res) => {
  req.params.resourceType = 'neighborhoods';
  return updateResource(req, res);
};

export const deleteNeighborhood = async (req, res) => {
  req.params.resourceType = 'neighborhoods';
  return deleteResource(req, res);
};

// Hashtags
export const getHashtags = async (req, res) => {
  req.params.resourceType = 'hashtags';
  return getAllResources(req, res);
};

export const createHashtag = async (req, res) => {
  req.params.resourceType = 'hashtags';
  return createResource(req, res);
};

export const updateHashtag = async (req, res) => {
  req.params.resourceType = 'hashtags';
  return updateResource(req, res);
};

export const deleteHashtag = async (req, res) => {
  req.params.resourceType = 'hashtags';
  return deleteResource(req, res);
};

// Restaurant Chains
export const getRestaurantChains = async (req, res) => {
  req.params.resourceType = 'restaurant_chains';
  return getAllResources(req, res);
};

export const createRestaurantChain = async (req, res) => {
  req.params.resourceType = 'restaurant_chains';
  return createResource(req, res);
};

export const updateRestaurantChain = async (req, res) => {
  req.params.resourceType = 'restaurant_chains';
  return updateResource(req, res);
};

export const deleteRestaurantChain = async (req, res) => {
  req.params.resourceType = 'restaurant_chains';
  return deleteResource(req, res);
};

// System Admin Functions
export const getAdminStats = async (req, res) => {
  try {
    logInfo('[AdminController] Fetching admin statistics overview');
    
    // Get total counts for all resource types with better filtering
    const [
      restaurantsResult,
      dishesResult, 
      usersResult,
      activeUsersResult,
      citiesResult,
      neighborhoodsResult,
      hashtagsResult,
      listsResult,
      submissionsResult
    ] = await Promise.all([
      // Count restaurants (check if deleted_at column exists first)
      db.query('SELECT COUNT(*) as total FROM restaurants'),
      // Count dishes
      db.query('SELECT COUNT(*) as total FROM dishes'),
      // Count all users
      db.query('SELECT COUNT(*) as total FROM users'),
      // Count active users (exclude test/demo users)
      db.query(`SELECT COUNT(*) as total FROM users 
                WHERE email NOT LIKE '%test%' 
                AND email NOT LIKE '%demo%' 
                AND email NOT LIKE '%admin%'
                AND username NOT LIKE '%test%'
                AND username NOT LIKE '%demo%'
                AND email NOT LIKE '%@chomp.local'`),
      // Count cities
      db.query('SELECT COUNT(*) as total FROM cities'),
      // Count neighborhoods
      db.query('SELECT COUNT(*) as total FROM neighborhoods'),
      // Count hashtags
      db.query('SELECT COUNT(*) as total FROM hashtags'),
      // Count lists
      db.query('SELECT COUNT(*) as total FROM lists'),
      // Count submissions
      db.query('SELECT COUNT(*) as total FROM submissions')
    ]);
    
    const totalUsers = parseInt(usersResult.rows[0].total);
    const activeUsers = parseInt(activeUsersResult.rows[0].total);
    
    const stats = {
      restaurants: parseInt(restaurantsResult.rows[0].total),
      dishes: parseInt(dishesResult.rows[0].total),
      users: activeUsers, // Use filtered active users count instead of total
      totalUsers: totalUsers, // Keep total for reference
      testUsers: totalUsers - activeUsers, // Calculate test/demo users
      cities: parseInt(citiesResult.rows[0].total),
      neighborhoods: parseInt(neighborhoodsResult.rows[0].total),
      hashtags: parseInt(hashtagsResult.rows[0].total),
      lists: parseInt(listsResult.rows[0].total),
      submissions: parseInt(submissionsResult.rows[0].total),
      locations: parseInt(citiesResult.rows[0].total) + parseInt(neighborhoodsResult.rows[0].total),
      lastUpdated: new Date().toISOString()
    };
    
    logInfo(`[AdminController] Admin stats: ${JSON.stringify(stats)}`);
    
    return res.status(200).json({
      success: true,
      message: 'Admin statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    logError('[AdminController] Error getting admin stats:', error);
    
    // Fallback to simple counting if the filtered queries fail
    try {
      logInfo('[AdminController] Falling back to simple count queries');
      const [
        restaurantsResult,
        dishesResult, 
        usersResult,
        citiesResult,
        neighborhoodsResult,
        hashtagsResult,
        listsResult,
        submissionsResult
      ] = await Promise.all([
        db.query('SELECT COUNT(*) as total FROM restaurants'),
        db.query('SELECT COUNT(*) as total FROM dishes'),
        db.query('SELECT COUNT(*) as total FROM users'),
        db.query('SELECT COUNT(*) as total FROM cities'),
        db.query('SELECT COUNT(*) as total FROM neighborhoods'),
        db.query('SELECT COUNT(*) as total FROM hashtags'),
        db.query('SELECT COUNT(*) as total FROM lists'),
        db.query('SELECT COUNT(*) as total FROM submissions')
      ]);
      
      const stats = {
        restaurants: parseInt(restaurantsResult.rows[0].total),
        dishes: parseInt(dishesResult.rows[0].total),
        users: parseInt(usersResult.rows[0].total),
        cities: parseInt(citiesResult.rows[0].total),
        neighborhoods: parseInt(neighborhoodsResult.rows[0].total),
        hashtags: parseInt(hashtagsResult.rows[0].total),
        lists: parseInt(listsResult.rows[0].total),
        submissions: parseInt(submissionsResult.rows[0].total),
        locations: parseInt(citiesResult.rows[0].total) + parseInt(neighborhoodsResult.rows[0].total),
        lastUpdated: new Date().toISOString(),
        note: 'Using fallback simple counts due to filtering error'
      };
      
      return res.status(200).json({
        success: true,
        message: 'Admin statistics retrieved successfully (fallback)',
        data: stats
      });
    } catch (fallbackError) {
      logError('[AdminController] Fallback error getting admin stats:', fallbackError);
      return res.status(500).json({ 
        success: false, 
        message: `Failed to get admin stats: ${fallbackError.message}` 
      });
    }
  }
};

export const getSystemStatus = async (req, res) => {
  try {
    // Get basic server stats
    const status = {
      serverTime: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };
    
    // Get database stats if available
    try {
      const dbStats = await AdminModel.getDatabaseStats();
      status.database = dbStats;
    } catch (dbError) {
      console.error('Error getting database stats:', dbError);
      status.database = { error: 'Failed to retrieve database stats' };
    }
    
    return res.status(200).json({
      success: true,
      message: 'System status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    return res.status(500).json({ success: false, message: `Failed to get system status: ${error.message}` });
  }
};

export const getSystemLogs = async (req, res) => {
  const { level = 'info', limit = 100, offset = 0, startDate, endDate } = req.query;
  
  try {
    // Fetch logs from database or log storage mechanism
    const logs = await AdminModel.getSystemLogs({
      level,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    return res.status(200).json({
      success: true,
      message: 'System logs retrieved successfully',
      data: logs.items,
      pagination: {
        total: logs.total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    });
  } catch (error) {
    console.error('Error getting system logs:', error);
    return res.status(500).json({ success: false, message: `Failed to get system logs: ${error.message}` });
  }
};

export const clearSystemCache = async (req, res) => {
  try {
    // Clear any application caches
    const result = await AdminModel.clearSystemCache();
    
    return res.status(200).json({
      success: true,
      message: 'System cache cleared successfully',
      data: result
    });
  } catch (error) {
    console.error('Error clearing system cache:', error);
    return res.status(500).json({ success: false, message: `Failed to clear system cache: ${error.message}` });
  }
};

// Health check endpoint (no auth required)
export const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin API is healthy',
    timestamp: new Date().toISOString()
  });
};

export const approveSubmission = async (req, res) => {
  const submissionId = parseInt(req.params.id, 10);
  if (isNaN(submissionId)) {
    return res.status(400).json({ success: false, message: 'Invalid submission ID format.' });
  }
  
  try {
    const submission = await SubmissionModel.findSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    
    // Process the submission approval
    const result = await AdminModel.approveSubmission(submissionId);
    
    return res.status(200).json({
      success: true,
      message: 'Submission approved successfully',
      data: result
    });
  } catch (error) {
    console.error(`Error approving submission ${req.params.id}:`, error);
    return res.status(500).json({ success: false, message: `Failed to approve submission: ${error.message}` });
  }
};

export const rejectSubmission = async (req, res) => {
  const submissionId = parseInt(req.params.id, 10);
  if (isNaN(submissionId)) {
    return res.status(400).json({ success: false, message: 'Invalid submission ID format.' });
  }
  
  const { reason } = req.body;
  
  try {
    const submission = await SubmissionModel.findSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    
    // Process the submission rejection
    const result = await AdminModel.rejectSubmission(submissionId, reason);
    
    return res.status(200).json({
      success: true,
      message: 'Submission rejected successfully',
      data: result
    });
  } catch (error) {
    console.error(`Error rejecting submission ${req.params.id}:`, error);
    return res.status(500).json({ success: false, message: `Failed to reject submission: ${error.message}` });
  }
};

/**
 * Bulk add restaurants
 */
export const bulkAddRestaurants = async (req, res) => {
  try {
    // DEBUG: Log the entire request to see what we're receiving
    console.log(`[DEBUG] Bulk add restaurants - Request body:`, req.body);
    console.log(`[DEBUG] Bulk add restaurants - Request method:`, req.method);
    console.log(`[DEBUG] Bulk add restaurants - Content-Type:`, req.headers['content-type']);
    
    const { restaurants } = req.body;
    
    console.log(`[DEBUG] Extracted restaurants:`, restaurants);
    console.log(`[DEBUG] Restaurants type:`, typeof restaurants);
    console.log(`[DEBUG] Restaurants is array:`, Array.isArray(restaurants));
    
    if (!restaurants || !Array.isArray(restaurants)) {
      console.log(`[DEBUG] Validation failed - restaurants is not an array or is missing`);
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurants data provided',
        received: { restaurants, type: typeof restaurants, isArray: Array.isArray(restaurants) }
      });
    }
    
    // Helper function to lookup city_id by city name (for backward compatibility)
    const lookupCityId = async (cityName) => {
      if (!cityName) return null;
      try {
        const result = await db.query('SELECT id FROM cities WHERE name ILIKE $1 LIMIT 1', [cityName.trim()]);
        return result.rows.length > 0 ? result.rows[0].id : null;
      } catch (error) {
        console.error(`Error looking up city "${cityName}":`, error);
        return null;
      }
    };
    
    const results = {
      success: 0,
      failed: 0,
      total: restaurants.length,
      errors: []
    };
    
    // Process each restaurant
    for (const restaurant of restaurants) {
      try {
        // Check if this is pre-validated data (has city_id already) or raw data (needs resolution)
        const isPreValidated = restaurant.city_id !== undefined;
        
        let restaurantData;
        
        if (isPreValidated) {
          // Data is already validated and resolved, use directly
          console.log(`[DEBUG] Processing pre-validated restaurant:`, restaurant);
          restaurantData = {
            name: restaurant.name,
            address: restaurant.address,
            city_id: restaurant.city_id,
            neighborhood_id: restaurant.neighborhood_id || null,
            description: restaurant.description || null,
            cuisine: restaurant.cuisine || null
          };
        } else {
          // Raw data that needs validation and resolution
          if (!restaurant.name || !restaurant.address) {
            results.failed++;
            results.errors.push(`Missing required fields for restaurant: ${restaurant.name || 'Unknown'}`);
            continue;
          }
          
          console.log(`[DEBUG] Processing raw restaurant:`, restaurant);
          
          restaurantData = {
            name: restaurant.name,
            address: restaurant.address,
            city_id: await lookupCityId(restaurant.city) || null,
            neighborhood_id: restaurant.neighborhood_id || null,
            description: restaurant.description || null,
            cuisine: restaurant.cuisine || null
          };
        }
        
        console.log(`[DEBUG] Final restaurant data for creation:`, restaurantData);
        
        const createdRestaurant = await RestaurantModel.createRestaurant(restaurantData);
        console.log(`[DEBUG] Successfully created restaurant:`, createdRestaurant);
        results.success++;
        
      } catch (error) {
        console.error(`Error adding restaurant ${restaurant.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${restaurant.name}: ${error.message}`);
      }
    }
    
    console.log(`Bulk add completed: ${results.success} success, ${results.failed} failed`);
    
    // Clear cache headers to force frontend refresh
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({
      success: true,
      message: `Bulk add completed: ${results.success} added, ${results.failed} failed`,
      data: results
    });
    
  } catch (error) {
    console.error('Error in bulk add restaurants:', error);
    return res.status(500).json({
      success: false,
      message: `Bulk add failed: ${error.message}`
    });
  }
};

// ===================================
// Autosuggest Controllers
// ===================================

/**
 * Get cities for autosuggest - returns top 10 cities ordered by name
 */
export const getAutosuggestCities = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Get cities from database - limit to 10 for autosuggest
    const cities = await CityModel.searchCities(search || '', 10);
    
    // Format for autosuggest: simple array of objects with id and name
    const suggestions = cities.map(city => ({
      id: city.id,
      value: city.name,
      label: city.name
    }));
    
    return res.status(200).json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    console.error('Error fetching autosuggest cities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch city suggestions',
      error: error.message
    });
  }
};

/**
 * Get neighborhoods for autosuggest - returns all neighborhoods with city context
 */
export const getAutosuggestNeighborhoods = async (req, res) => {
  try {
    const { search } = req.query;
    
    // Get neighborhoods from database with city information
    const neighborhoods = await NeighborhoodModel.searchNeighborhoodsWithCity(search || '', 25);
    
    // Format for autosuggest: include city context for disambiguation
    const suggestions = neighborhoods.map(neighborhood => ({
      id: neighborhood.id,
      value: neighborhood.name,
      label: `${neighborhood.name}${neighborhood.city_name ? ` (${neighborhood.city_name})` : ''}`,
      cityId: neighborhood.city_id,
      cityName: neighborhood.city_name
    }));
    
    return res.status(200).json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    console.error('Error fetching autosuggest neighborhoods:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch neighborhood suggestions',
      error: error.message
    });
  }
};

/**
 * Get neighborhoods for a specific city - returns up to 25 neighborhoods for a city
 */
export const getAutosuggestNeighborhoodsByCity = async (req, res) => {
  try {
    const { cityId } = req.params;
    const { search } = req.query;
    
    if (!cityId || isNaN(parseInt(cityId))) {
      return res.status(400).json({
        success: false,
        message: 'Valid city ID is required'
      });
    }
    
    // Get neighborhoods for specific city
    const neighborhoods = await NeighborhoodModel.getNeighborhoodsByCity(parseInt(cityId), search || '', 25);
    
    // Format for autosuggest: simpler since we know the city context
    const suggestions = neighborhoods.map(neighborhood => ({
      id: neighborhood.id,
      value: neighborhood.name,
      label: neighborhood.name,
      cityId: neighborhood.city_id
    }));
    
    return res.status(200).json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    console.error('Error fetching autosuggest neighborhoods by city:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch neighborhood suggestions for city',
      error: error.message
    });
  }
};

// COMPREHENSIVE BULK OPERATIONS FOR ALL RESOURCE TYPES

// Generic bulk delete function
const bulkDelete = async (req, res, resourceType) => {
  try {
    // DEBUG: Log the entire request to see what we're receiving
    console.log(`[DEBUG] Bulk delete ${resourceType} - Request body:`, req.body);
    console.log(`[DEBUG] Bulk delete ${resourceType} - Request method:`, req.method);
    console.log(`[DEBUG] Bulk delete ${resourceType} - Content-Type:`, req.headers['content-type']);
    console.log(`[DEBUG] Bulk delete ${resourceType} - Full headers:`, req.headers);
    
    const { ids } = req.body;
    
    console.log(`[DEBUG] Extracted ids:`, ids);
    
    if (!Array.isArray(ids) || ids.length === 0) {
      console.log(`[DEBUG] Validation failed - ids is not an array or is empty`);
      return res.status(400).json({
        success: false,
        message: 'Array of IDs is required',
        debug: {
          receivedIds: ids,
          typeOfIds: typeof ids,
          isArray: Array.isArray(ids),
          bodyKeys: Object.keys(req.body),
          fullBody: req.body
        }
      });
    }

    // Validate all IDs are numbers
    const validIds = ids.filter(id => !isNaN(parseInt(id)));
    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'All IDs must be valid numbers'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Delete each item
    for (const id of validIds) {
      try {
        const deleted = await AdminModel.deleteResource(resourceType, parseInt(id));
        if (deleted) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${resourceType} with ID ${id} not found`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to delete ${resourceType} ${id}: ${error.message}`);
      }
    }

    // Clear cache headers to force frontend refresh
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({
      success: true,
      message: `Bulk delete completed: ${results.success} deleted, ${results.failed} failed`,
      data: results
    });

  } catch (error) {
    console.error(`Error in bulk delete ${resourceType}:`, error);
    res.status(500).json({
      success: false,
      message: `Bulk delete ${resourceType} failed`,
      error: error.message
    });
  }
};

// Generic bulk update function
const bulkUpdate = async (req, res, resourceType) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of updates is required (each with id and fields to update)'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Update each item
    for (const update of updates) {
      try {
        if (!update.id) {
          results.failed++;
          results.errors.push('Update missing ID field');
          continue;
        }

        const { id, ...updateData } = update;
        const updated = await AdminModel.updateResource(resourceType, parseInt(id), updateData);
        
        if (updated) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`${resourceType} with ID ${id} not found`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to update ${resourceType} ${update.id}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.success} updated, ${results.failed} failed`,
      data: results
    });

  } catch (error) {
    console.error(`Error in bulk update ${resourceType}:`, error);
    res.status(500).json({
      success: false,
      message: `Bulk update ${resourceType} failed`,
      error: error.message
    });
  }
};

// Generic bulk add function
const bulkAdd = async (req, res, resourceType) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of records is required'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      created: []
    };

    // Create each item
    for (const record of records) {
      try {
        const created = await AdminModel.createResource(resourceType, record);
        if (created) {
          results.success++;
          results.created.push(created);
        } else {
          results.failed++;
          results.errors.push(`Failed to create ${resourceType} record`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to create ${resourceType}: ${error.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk add completed: ${results.success} created, ${results.failed} failed`,
      data: results
    });

  } catch (error) {
    console.error(`Error in bulk add ${resourceType}:`, error);
    res.status(500).json({
      success: false,
      message: `Bulk add ${resourceType} failed`,
      error: error.message
    });
  }
};

// Generic import function (file-based bulk add)
const importData = async (req, res, resourceType) => {
  try {
    // Handle file upload and parsing
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    // Parse CSV/JSON file content
    let records = [];
    const fileContent = file.buffer.toString('utf8');
    
    if (file.mimetype === 'application/json') {
      records = JSON.parse(fileContent);
    } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      // Basic CSV parsing (for production, use a proper CSV parser)
      const lines = fileContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      records = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const record = {};
        headers.forEach((header, index) => {
          record[header] = values[index];
        });
        return record;
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Please use CSV or JSON files.'
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found in file'
      });
    }

    // Use the bulk add function
    req.body = { records };
    return bulkAdd(req, res, resourceType);

  } catch (error) {
    console.error(`Error in import ${resourceType}:`, error);
    res.status(500).json({
      success: false,
      message: `Import ${resourceType} failed`,
      error: error.message
    });
  }
};

// RESTAURANTS BULK OPERATIONS
export const bulkDeleteRestaurants = (req, res) => bulkDelete(req, res, 'restaurants');
export const bulkUpdateRestaurants = (req, res) => bulkUpdate(req, res, 'restaurants');
export const importRestaurants = (req, res) => importData(req, res, 'restaurants');

// DISHES BULK OPERATIONS  
export const bulkDeleteDishes = (req, res) => bulkDelete(req, res, 'dishes');
export const bulkUpdateDishes = (req, res) => bulkUpdate(req, res, 'dishes');
export const bulkAddDishes = (req, res) => bulkAdd(req, res, 'dishes');
export const importDishes = (req, res) => importData(req, res, 'dishes');

// USERS BULK OPERATIONS
export const bulkDeleteUsers = (req, res) => bulkDelete(req, res, 'users');
export const bulkUpdateUsers = (req, res) => bulkUpdate(req, res, 'users');
export const bulkAddUsers = (req, res) => bulkAdd(req, res, 'users');
export const importUsers = (req, res) => importData(req, res, 'users');

// CITIES BULK OPERATIONS
export const bulkDeleteCities = (req, res) => bulkDelete(req, res, 'cities');
export const bulkUpdateCities = (req, res) => bulkUpdate(req, res, 'cities');
export const bulkAddCities = (req, res) => bulkAdd(req, res, 'cities');
export const importCities = (req, res) => importData(req, res, 'cities');

// NEIGHBORHOODS BULK OPERATIONS
export const bulkDeleteNeighborhoods = (req, res) => bulkDelete(req, res, 'neighborhoods');
export const bulkUpdateNeighborhoods = (req, res) => bulkUpdate(req, res, 'neighborhoods');
export const bulkAddNeighborhoods = (req, res) => bulkAdd(req, res, 'neighborhoods');
export const importNeighborhoods = (req, res) => importData(req, res, 'neighborhoods');

// HASHTAGS BULK OPERATIONS
export const bulkDeleteHashtags = (req, res) => bulkDelete(req, res, 'hashtags');
export const bulkUpdateHashtags = (req, res) => bulkUpdate(req, res, 'hashtags');
export const bulkAddHashtags = (req, res) => bulkAdd(req, res, 'hashtags');
export const importHashtags = (req, res) => importData(req, res, 'hashtags');

// RESTAURANT CHAINS BULK OPERATIONS
export const bulkDeleteRestaurantChains = (req, res) => bulkDelete(req, res, 'restaurant_chains');
export const bulkUpdateRestaurantChains = (req, res) => bulkUpdate(req, res, 'restaurant_chains');
export const bulkAddRestaurantChains = (req, res) => bulkAdd(req, res, 'restaurant_chains');
export const importRestaurantChains = (req, res) => importData(req, res, 'restaurant_chains');

// Lists bulk operations
export const bulkDeleteLists = (req, res) => bulkDelete(req, res, 'lists');
export const bulkUpdateLists = (req, res) => bulkUpdate(req, res, 'lists');
export const bulkAddLists = (req, res) => bulkAdd(req, res, 'lists');
export const importLists = (req, res) => importData(req, res, 'lists');

/**
 * Bulk validate restaurants - parse and resolve data without creating
 * This allows users to preview what will be created before confirming
 */
export const bulkValidateRestaurants = async (req, res) => {
  logInfo(`[AdminController] Starting bulk restaurant validation`);
  
  try {
    const { restaurants } = req.body;
    
    if (!restaurants || !Array.isArray(restaurants) || restaurants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No restaurant data provided'
      });
    }
    
    // Helper function to look up city by name and create if it doesn't exist
    const lookupCityId = async (cityName) => {
      if (!cityName || !cityName.trim()) return null;
      
      const cleanName = cityName.trim();
      
      // First, try to find existing city
      const existingCity = await db.query('SELECT id FROM cities WHERE LOWER(name) = LOWER($1)', [cleanName]);
      
      if (existingCity.rows.length > 0) {
        return existingCity.rows[0].id;
      }
      
      // If not found, create new city
      const newCity = await db.query(
        'INSERT INTO cities (name, state, country) VALUES ($1, $2, $3) RETURNING id',
        [cleanName, 'Unknown', 'USA']
      );
      
      return newCity.rows[0].id;
    };
    
    // Helper function to look up neighborhood by name and city, create if it doesn't exist
    const lookupNeighborhoodId = async (neighborhoodName, cityId) => {
      if (!neighborhoodName || !neighborhoodName.trim() || !cityId) return null;
      
      const cleanName = neighborhoodName.trim();
      
      // First, try to find existing neighborhood
      const existingNeighborhood = await db.query(
        'SELECT id FROM neighborhoods WHERE LOWER(name) = LOWER($1) AND city_id = $2',
        [cleanName, cityId]
      );
      
      if (existingNeighborhood.rows.length > 0) {
        return existingNeighborhood.rows[0].id;
      }
      
      // If not found, create new neighborhood
      const newNeighborhood = await db.query(
        'INSERT INTO neighborhoods (name, city_id) VALUES ($1, $2) RETURNING id',
        [cleanName, cityId]
      );
      
      return newNeighborhood.rows[0].id;
    };
    
    const valid = [];
    const invalid = [];
    const warnings = [];
    
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      const rowNumber = i + 1;
      const errors = [];
      const warns = [];
      
      // Validate required fields
      if (!restaurant.name || !restaurant.name.trim()) {
        errors.push('Restaurant name is required');
      }
      
      if (!restaurant.address || !restaurant.address.trim()) {
        errors.push('Restaurant address is required');
      }
      
      if (!restaurant.city || !restaurant.city.trim()) {
        errors.push('City is required');
      }
      
      // Validate phone format if provided
      if (restaurant.phone && restaurant.phone.trim()) {
        const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
        if (!phoneRegex.test(restaurant.phone.trim())) {
          warns.push('Phone number format may be invalid');
        }
      }
      
      // Validate website format if provided
      if (restaurant.website && restaurant.website.trim()) {
        const urlRegex = /^https?:\/\/.+\..+/;
        if (!urlRegex.test(restaurant.website.trim())) {
          warns.push('Website URL should start with http:// or https://');
        }
      }
      
      if (errors.length > 0) {
        invalid.push({
          rowNumber,
          original: restaurant,
          errors
        });
      } else {
        try {
          // Look up and resolve city and neighborhood IDs
          const cityId = await lookupCityId(restaurant.city);
          const neighborhoodId = restaurant.neighborhood ? 
            await lookupNeighborhoodId(restaurant.neighborhood, cityId) : null;
          
          const resolved = {
            name: restaurant.name.trim(),
            address: restaurant.address.trim(),
            city: restaurant.city.trim(),
            city_id: cityId,
            neighborhood: restaurant.neighborhood ? restaurant.neighborhood.trim() : null,
            neighborhood_id: neighborhoodId,
            zip: restaurant.zip ? restaurant.zip.trim() : null,
            phone: restaurant.phone ? restaurant.phone.trim() : null,
            website: restaurant.website ? restaurant.website.trim() : null
          };
          
          const validItem = {
            rowNumber,
            original: restaurant,
            resolved
          };
          
          if (warns.length > 0) {
            warnings.push({
              ...validItem,
              warnings: warns
            });
          }
          
          valid.push(validItem);
        } catch (error) {
          logError(`Error resolving restaurant data for row ${rowNumber}:`, error);
          invalid.push({
            rowNumber,
            original: restaurant,
            errors: ['Failed to resolve city/neighborhood data']
          });
        }
      }
    }
    
    logInfo(`[AdminController] Validation complete: ${valid.length} valid, ${invalid.length} invalid, ${warnings.length} warnings`);
    
    res.json({
      success: true,
      valid,
      invalid,
      warnings,
      summary: {
        total: restaurants.length,
        valid: valid.length,
        invalid: invalid.length,
        warnings: warnings.length
      }
    });
    
  } catch (error) {
    logError('[AdminController] Error in bulk restaurant validation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
      error: error.message
    });
  }
};

export const bulkValidateDishes = async (req, res) => {
  logInfo(`[AdminController] Starting bulk dish validation`);
  
  try {
    const { dishes } = req.body;
    
    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No dish data provided'
      });
    }
    
    const valid = [];
    const invalid = [];
    const warnings = [];
    
    // Get all restaurant IDs for validation
    const restaurantIds = await db.query('SELECT id FROM restaurants');
    const validRestaurantIds = new Set(restaurantIds.rows.map(r => r.id));
    
    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i];
      const rowNumber = i + 1;
      const errors = [];
      const warns = [];
      
      // Validate required fields
      if (!dish.name || !dish.name.trim()) {
        errors.push('Dish name is required');
      }
      
      if (!dish.restaurant_id) {
        errors.push('Restaurant ID is required');
      } else {
        const restaurantId = parseInt(dish.restaurant_id);
        if (isNaN(restaurantId) || !validRestaurantIds.has(restaurantId)) {
          errors.push('Invalid restaurant ID - restaurant does not exist');
        }
      }
      
      if (errors.length > 0) {
        invalid.push({
          rowNumber,
          original: dish,
          errors
        });
      } else {
        const resolved = {
          name: dish.name.trim(),
          description: dish.description ? dish.description.trim() : null,
          restaurant_id: parseInt(dish.restaurant_id)
        };
        
        const validItem = {
          rowNumber,
          original: dish,
          resolved
        };
        
        if (warns.length > 0) {
          warnings.push({
            ...validItem,
            warnings: warns
          });
        }
        
        valid.push(validItem);
      }
    }
    
    logInfo(`[AdminController] Dish validation complete: ${valid.length} valid, ${invalid.length} invalid, ${warnings.length} warnings`);
    
    res.json({
      success: true,
      valid,
      invalid,
      warnings,
      summary: {
        total: dishes.length,
        valid: valid.length,
        invalid: invalid.length,
        warnings: warnings.length
      }
    });
    
  } catch (error) {
    logError('[AdminController] Error in bulk dish validation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during validation',
      error: error.message
    });
  }
};

/**
 * Bulk validate users - parse and resolve data without creating
 */
export const bulkValidateUsers = async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid users data provided'
      });
    }
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const rowNumber = i + 1;
      
      try {
        // Basic validation
        if (!user.email || !user.username) {
          results.invalid.push({
            rowNumber,
            original: user,
            errors: ['Email and username are required']
          });
          continue;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
          results.invalid.push({
            rowNumber,
            original: user,
            errors: ['Invalid email format']
          });
          continue;
        }
        
        // Create resolved data
        const resolved = {
          email: user.email.toLowerCase(),
          username: user.username,
          full_name: user.full_name || '',
          role: user.role || 'user'
        };
        
        results.valid.push({
          rowNumber,
          original: user,
          resolved
        });
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: user,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    res.json({
      success: true,
      total: users.length,
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings
    });
    
  } catch (error) {
    console.error('[ERROR] Bulk validate users error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
};

/**
 * Bulk validate cities - parse and resolve data without creating
 */
export const bulkValidateCities = async (req, res) => {
  try {
    const { cities } = req.body;
    
    if (!cities || !Array.isArray(cities)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cities data provided'
      });
    }
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      const rowNumber = i + 1;
      
      try {
        // Basic validation
        if (!city.name) {
          results.invalid.push({
            rowNumber,
            original: city,
            errors: ['City name is required']
          });
          continue;
        }
        
        // Create resolved data
        const resolved = {
          name: city.name,
          state: city.state || '',
          country: city.country || 'USA'
        };
        
        results.valid.push({
          rowNumber,
          original: city,
          resolved
        });
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: city,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    res.json({
      success: true,
      total: cities.length,
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings
    });
    
  } catch (error) {
    console.error('[ERROR] Bulk validate cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
};

/**
 * Bulk validate neighborhoods - parse and resolve data without creating
 */
export const bulkValidateNeighborhoods = async (req, res) => {
  try {
    const { neighborhoods } = req.body;
    
    if (!neighborhoods || !Array.isArray(neighborhoods)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid neighborhoods data provided'
      });
    }
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < neighborhoods.length; i++) {
      const neighborhood = neighborhoods[i];
      const rowNumber = i + 1;
      
      try {
        // Basic validation
        if (!neighborhood.name) {
          results.invalid.push({
            rowNumber,
            original: neighborhood,
            errors: ['Neighborhood name is required']
          });
          continue;
        }
        
        // Create resolved data
        const resolved = {
          name: neighborhood.name,
          city_id: neighborhood.city_id ? parseInt(neighborhood.city_id) : null,
          zip_code: neighborhood.zip_code || ''
        };
        
        results.valid.push({
          rowNumber,
          original: neighborhood,
          resolved
        });
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: neighborhood,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    res.json({
      success: true,
      total: neighborhoods.length,
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings
    });
    
  } catch (error) {
    console.error('[ERROR] Bulk validate neighborhoods error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
};

/**
 * Bulk validate hashtags - parse and resolve data without creating
 */
export const bulkValidateHashtags = async (req, res) => {
  try {
    const { hashtags } = req.body;
    
    if (!hashtags || !Array.isArray(hashtags)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hashtags data provided'
      });
    }
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < hashtags.length; i++) {
      const hashtag = hashtags[i];
      const rowNumber = i + 1;
      
      try {
        // Basic validation
        if (!hashtag.name) {
          results.invalid.push({
            rowNumber,
            original: hashtag,
            errors: ['Hashtag name is required']
          });
          continue;
        }
        
        // Clean hashtag name (remove # if present, ensure no spaces)
        let cleanName = hashtag.name.replace(/^#/, '').toLowerCase();
        cleanName = cleanName.replace(/\s+/g, '_');
        
        if (!cleanName) {
          results.invalid.push({
            rowNumber,
            original: hashtag,
            errors: ['Invalid hashtag name']
          });
          continue;
        }
        
        // Create resolved data
        const resolved = {
          name: cleanName,
          category: hashtag.category || 'general'
        };
        
        results.valid.push({
          rowNumber,
          original: hashtag,
          resolved
        });
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: hashtag,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    res.json({
      success: true,
      total: hashtags.length,
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings
    });
    
  } catch (error) {
    console.error('[ERROR] Bulk validate hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
};

/**
 * Bulk validate restaurant chains - parse and resolve data without creating
 */
export const bulkValidateRestaurantChains = async (req, res) => {
  try {
    console.log('[bulkValidateRestaurantChains] Starting validation with body:', req.body);
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Data must be an array',
        validationResults: []
      });
    }

    const validationResults = [];
    const validData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors = [];
      
      // Name validation (required)
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
      }
      
      // Description validation (optional but must be string if provided)
      if (item.description && typeof item.description !== 'string') {
        errors.push('Description must be a string');
      }
      
      // Website validation (optional but must be string if provided)  
      if (item.website && typeof item.website !== 'string') {
        errors.push('Website must be a string');
      }
      
      if (errors.length > 0) {
        validationResults.push({
          row: i + 1,
          isValid: false,
          errors,
          data: item
        });
      } else {
        validationResults.push({
          row: i + 1,
          isValid: true,
          errors: [],
          data: item
        });
        validData.push(item);
      }
    }

    const hasErrors = validationResults.some(result => !result.isValid);
    
    console.log('[bulkValidateRestaurantChains] Validation completed. Valid items:', validData.length, 'Total items:', data.length);
    
    res.status(200).json({
      success: true,
      message: hasErrors ? 'Validation completed with errors' : 'All data is valid',
      validationResults,
      summary: {
        total: data.length,
        valid: validData.length,
        invalid: data.length - validData.length
      }
    });
  } catch (error) {
    console.error('[bulkValidateRestaurantChains] Error during validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate restaurant chains data',
      error: error.message,
      validationResults: []
    });
  }
};

export const bulkValidateLists = async (req, res) => {
  try {
    console.log('[bulkValidateLists] Starting validation with body:', req.body);
    const { data } = req.body;
    
    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: 'Data must be an array',
        validationResults: []
      });
    }

    const validationResults = [];
    const validData = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const errors = [];
      
      // Name validation (required)
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        errors.push('Name is required and must be a non-empty string');
      }
      
      // Description validation (optional but must be string if provided)
      if (item.description && typeof item.description !== 'string') {
        errors.push('Description must be a string');
      }
      
      // List type validation (optional but must be valid enum if provided)
      if (item.list_type && !['restaurant', 'dish', 'mixed'].includes(item.list_type)) {
        errors.push('List type must be one of: restaurant, dish, mixed');
      }
      
      // City name validation (optional but must be string if provided)
      if (item.city_name && typeof item.city_name !== 'string') {
        errors.push('City name must be a string');
      }
      
      // Tags validation (optional but must be array if provided)
      if (item.tags && !Array.isArray(item.tags)) {
        errors.push('Tags must be an array');
      }
      
      // is_public validation (optional but must be boolean if provided)
      if (item.is_public !== undefined && typeof item.is_public !== 'boolean') {
        errors.push('is_public must be a boolean');
      }
      
      // creator_handle validation (optional but must be string if provided)
      if (item.creator_handle && typeof item.creator_handle !== 'string') {
        errors.push('Creator handle must be a string');
      }
      
      // user_id validation (optional but must be number if provided)
      if (item.user_id && (typeof item.user_id !== 'number' || item.user_id <= 0)) {
        errors.push('User ID must be a positive number');
      }
      
      if (errors.length > 0) {
        validationResults.push({
          row: i + 1,
          isValid: false,
          errors,
          data: item
        });
      } else {
        validationResults.push({
          row: i + 1,
          isValid: true,
          errors: [],
          data: item
        });
        validData.push(item);
      }
    }

    const hasErrors = validationResults.some(result => !result.isValid);
    
    console.log('[bulkValidateLists] Validation completed. Valid items:', validData.length, 'Total items:', data.length);
    
    res.status(200).json({
      success: true,
      message: hasErrors ? 'Validation completed with errors' : 'All data is valid',
      validationResults,
      summary: {
        total: data.length,
        valid: validData.length,
        invalid: data.length - validData.length
      }
    });
  } catch (error) {
    console.error('[bulkValidateLists] Error during validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate lists data',
      error: error.message,
      validationResults: []
    });
  }
};

// ========== LISTS MANAGEMENT ==========

export const getLists = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, userId, listType, isPublic, sort = 'updated_at', order = 'desc' } = req.query;
    
    const result = await ListModel.getAllLists({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      userId,
      listType,
      isPublic: isPublic !== undefined ? isPublic === 'true' : null,
      sort,
      order
    });
    
    res.status(200).json({
      success: true,
      message: 'Lists fetched successfully',
      data: result.lists,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lists',
      error: error.message
    });
  }
};

export const getListById = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await ListModel.getListById(parseInt(id));
    
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'List fetched successfully',
      data: list
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch list',
      error: error.message
    });
  }
};

export const createList = async (req, res) => {
  try {
    const listData = req.body;
    const newList = await ListModel.createList(listData);
    
    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: newList
    });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create list',
      error: error.message
    });
  }
};

export const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedList = await ListModel.updateList(parseInt(id), updateData);
    
    if (!updatedList) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'List updated successfully',
      data: updatedList
    });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update list',
      error: error.message
    });
  }
};

export const deleteList = async (req, res) => {
  try {
    const listId = parseInt(req.params.id);
    
    if (!listId || isNaN(listId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid list ID'
      });
    }
    
    const result = await ListModel.deleteList(listId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'List not found'
      });
    }
    
    // Clear cache headers to force frontend refresh
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json({
      success: true,
      message: 'List deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete list',
      error: error.message
    });
  }
};

// ========== SYSTEM MANAGEMENT ==========