// doof-backend/controllers/adminController.js
import * as AdminModel from '../models/adminModel.js';
import * as RestaurantModel from '../models/restaurantModel.js';
import * as DishModel from '../models/dishModel.js';
import UserModel from '../models/userModel.js';
import * as CityModel from '../models/cityModel.js';
import * as NeighborhoodModel from '../models/neighborhoodModel.js';
import * as HashtagModel from '../models/hashtagModel.js';
import { ListModel } from '../models/listModel.js';
import SubmissionModel from '../models/submissionModel.js';

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
    const { restaurants } = req.body;
    
    if (!restaurants || !Array.isArray(restaurants)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurants data provided'
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: restaurants.length,
      errors: []
    };
    
    // Process each restaurant
    for (const restaurant of restaurants) {
      try {
        // Validate required fields
        if (!restaurant.name || !restaurant.address) {
          results.failed++;
          results.errors.push(`Missing required fields for restaurant: ${restaurant.name || 'Unknown'}`);
          continue;
        }
        
        // Create restaurant using the RestaurantModel
        const restaurantData = {
          name: restaurant.name,
          address: restaurant.address,
          city: restaurant.city || null,
          state: restaurant.state || null,
          zip: restaurant.zip || null,
          phone: restaurant.phone || null,
          website: restaurant.website || null,
          price_range: restaurant.price_range || null,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        await RestaurantModel.create(restaurantData);
        results.success++;
        
      } catch (error) {
        console.error(`Error adding restaurant ${restaurant.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${restaurant.name}: ${error.message}`);
      }
    }
    
    console.log(`Bulk add completed: ${results.success} success, ${results.failed} failed`);
    
    return res.status(200).json({
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
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of IDs is required'
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