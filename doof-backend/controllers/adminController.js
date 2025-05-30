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

export const getAllResources = async (req, res) => {
  let { resourceType } = req.params;
  // Handle direct /submissions route if resourceType isn't in params
  if(req.route && req.route.path === '/submissions' && !resourceType) {
    resourceType = 'submissions';
  }
  if (!resourceType) {
    return res.status(400).json({ success: false, message: "Resource type is required." });
  }
  
  // Ensure user is authenticated and is a superuser
  if (!req.user || req.user.account_type !== 'superuser') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Superuser privileges required.' 
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