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


// --- Submission Management ---
export const approveSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const adminUserId = req.user.id; // Assuming req.user is populated by auth middleware
  try {
    const submission = await SubmissionModel.getSubmissionById(parseInt(submissionId, 10));
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    if (submission.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Submission is already ${submission.status}.` });
    }

    let cityId = submission.city_id;
    let neighborhoodId = submission.neighborhood_id;

    // Resolve city if provided as string
    if (submission.city && !cityId && typeof submission.city === 'string' && submission.city.trim() !== '') {
        const cityInstance = await CityModel.findByNameOrCreate(submission.city.trim());
        if (cityInstance && cityInstance.id) cityId = cityInstance.id;
    }

    // Resolve neighborhood if provided as string and cityId is known
    if (cityId && submission.neighborhood && !neighborhoodId && typeof submission.neighborhood === 'string' && submission.neighborhood.trim() !== '') {
        const boroughName = submission.data?.borough || submission.borough || null;
        const neighborhoodInstance = await NeighborhoodModel.findByNameAndCityIdOrCreate(submission.neighborhood.trim(), cityId, boroughName);
        if (neighborhoodInstance && neighborhoodInstance.id) neighborhoodId = neighborhoodInstance.id;
    }
    
    // For restaurant submissions, city is mandatory.
    if (submission.type === 'restaurant' && !cityId) {
        console.warn(`Attempted to approve restaurant submission ${submissionId} without a resolvable city: ${submission.city}`);
        return res.status(400).json({ success: false, message: `Cannot approve restaurant submission. City "${submission.city}" could not be resolved or created.` });
    }

    const itemData = {
        name: submission.name,
        description: submission.description || null, // Ensure description exists or is null
        tags: submission.tags || [], // Ensure tags is an array
        phone: submission.phone || null,
        website: submission.website || null,
        ...(submission.data || {}), // Spread additional data from submission.data
    };

    if (submission.type === 'restaurant') {
        itemData.address = submission.location; // 'location' field from submission maps to 'address'
        itemData.google_place_id = submission.place_id;
    } else if (submission.type === 'dish') {
        if (!submission.restaurant_id) {
            return res.status(400).json({ success: false, message: 'Restaurant ID is required for dish submission.' });
        }
        itemData.restaurant_id = submission.restaurant_id;
        itemData.restaurant_name = submission.restaurant_name; // Often denormalized
    }

    const approvedItem = await AdminModel.approveSubmission(
        parseInt(submissionId, 10),
        submission.type, // 'restaurant' or 'dish'
        itemData,
        cityId,
        neighborhoodId,
        submission.place_id, // Pass google_place_id
        submission.user_id,
        adminUserId
    );

    if (!approvedItem) { // approveSubmission in model should throw on failure
        return res.status(500).json({ success: false, message: 'Approval process failed or no item was returned.' });
    }
    const formatter = getFormatterForResourceType(submission.type); // 'restaurant' or 'dish'
    res.status(200).json({ success: true, message: 'Submission approved successfully.', data: (formatter || identityFormatter)(approvedItem) });
  } catch (error) {
    console.error(`Error approving submission ${submissionId}:`, error);
    res.status(500).json({ success: false, message: `Failed to approve submission. Error: ${error.message}` });
  }
};

export const rejectSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { rejection_reason } = req.body;
  const adminUserId = req.user.id;
  try {
    const rejectedSubmission = await AdminModel.rejectSubmission(parseInt(submissionId, 10), rejection_reason, adminUserId);
    if (!rejectedSubmission) {
      const submission = await SubmissionModel.getSubmissionById(parseInt(submissionId, 10));
      if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });
      return res.status(400).json({ success: false, message: 'Failed to reject submission, it might have been already processed or an unknown error occurred.' });
    }
    const formatter = getFormatterForResourceType('submissions');
    res.status(200).json({ success: true, message: 'Submission rejected successfully.', data: (formatter || identityFormatter)(rejectedSubmission) });
  } catch (error) {
    console.error(`Error rejecting submission ${submissionId}:`, error);
    res.status(500).json({ success: false, message: `Failed to reject submission. Error: ${error.message}` });
  }
};


// --- Bulk Operations ---
export const bulkAddResources = async (req, res) => {
    const { resourceType } = req.params;
     if (!resourceType) {
        return res.status(400).json({ success: false, message: "Resource type is required." });
    }
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'No items provided for bulk addition.' });
    }
    try {
        const results = await AdminModel.bulkAddResources(resourceType, items, req.user.id);
        // Determine overall status based on results
        const status = results.failureCount > 0 && results.successCount === 0 ? 400 : (results.failureCount > 0 ? 207 : 200); // 207 Multi-Status
        res.status(status).json({ 
            success: results.failureCount === 0, 
            message: `Bulk add for ${resourceType} processed. Success: ${results.successCount}, Failures: ${results.failureCount}.`, 
            data: results 
        });
    } catch (error) {
        console.error(`Error bulk adding ${resourceType}:`, error);
        if (error.message.startsWith('Unsupported resource type')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: `Failed to bulk add ${resourceType}. Error: ${error.message}` });
    }
};

export const checkExistingItems = async (req, res) => { // Changed from internal function to controller
    const { resourceType } = req.params;
    if (!resourceType) {
        return res.status(400).json({ success: false, message: "Resource type is required." });
    }
    const itemsToCheck = req.body.items || [];
    if (!itemsToCheck || !Array.isArray(itemsToCheck) || itemsToCheck.length === 0) {
        return res.status(400).json({ success: false, message: 'No items provided to check.' });
    }
    try {
        const results = await AdminModel.checkExistingItems(resourceType, itemsToCheck);
        res.status(200).json({
            success: true,
            message: `Checked ${itemsToCheck.length} items for ${resourceType}.`,
            data: results
        });
    } catch (error) {
        console.error(`Error checking existing ${resourceType}:`, error);
        if (error.message.startsWith('Unsupported resource type')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: `Failed to check existing ${resourceType}. Error: ${error.message}` });
    }
};


// --- DATA CLEANUP METHODS ---

export const getCleanupApiHealth = (req, res) => {
  res.status(200).json({ success: true, available: true, message: "Data Cleanup API is healthy." });
};

export const analyzeData = async (req, res) => {
  const { resourceType } = req.params;
  try {
    console.log(`[adminController] Analyzing data for ${resourceType}`);
    console.log(`[adminController] User from request: ${req.user ? JSON.stringify({id: req.user.id, type: req.user.account_type}) : 'No user'}`);
    console.log(`[adminController] Auth header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
    
    // Validation for resourceType happens in AdminModel.getResourceConfig now
    const changes = await AdminModel.analyzeData(resourceType);
    console.log(`[adminController] Found ${changes.length} changes for ${resourceType}`);
    
    // Log a few sample changeIds to help with debugging
    if (changes.length > 0) {
      const sampleSize = Math.min(changes.length, 5);
      const sampleChanges = changes.slice(0, sampleSize);
      console.log(`[adminController] Sample changeIds: ${sampleChanges.map(c => c.changeId).join(', ')}`);
    }
    
    res.status(200).json({
      success: true,
      message: `Data analysis completed for ${resourceType}. Found ${changes.length} potential changes.`,
      changes: changes // Frontend expects 'changes' array
    });
  } catch (error) {
    console.error(`[adminController] Error analyzing data for ${resourceType}:`, error);
    if (error.message.startsWith('Unsupported resource type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: `Failed to analyze data for ${resourceType}. Error: ${error.message}`
    });
  }
};

export const applyChanges = async (req, res) => {
  const { resourceType } = req.params;
  // Log the request body to help with debugging
  console.log(`[adminController] Apply changes for ${resourceType} request:`, {
    bodyKeys: Object.keys(req.body),
    changeIds: req.body.changeIds,
    authHeader: req.headers.authorization ? 'Present' : 'Missing',
    userInfo: req.user ? `ID: ${req.user.id}, Type: ${req.user.account_type}` : 'No user in request'
  });
  
  // Expecting an array of changeIds
  const changeIds = req.body.changeIds || [];
  
  if (!changeIds || !Array.isArray(changeIds)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request. `changeIds` must be an array.'
    });
  }

  try {
    // Fetch the actual changes based on the changeIds
    console.log(`[adminController] Fetching changes for IDs: ${changeIds.join(', ')}`);
    const changes = await AdminModel.getChangesByIds(resourceType, changeIds);
    
    if (!changes || changes.length === 0) {
      console.log(`[adminController] No changes found for IDs: ${changeIds.join(', ')}`);
      return res.status(404).json({
        success: false,
        message: 'No valid changes found with the provided changeIds.'
      });
    }
    
    console.log(`[adminController] Found ${changes.length} changes to apply`);
    
    const results = await AdminModel.applyChanges(resourceType, changes);
    const successfulChanges = results.filter(r => r.success).length;
    const failedChanges = results.length - successfulChanges;

    // Log the results for debugging
    console.log(`[adminController] Apply changes for ${resourceType} completed:`, {
      total: results.length,
      successful: successfulChanges,
      failed: failedChanges,
      resultSummary: results.map(r => ({
        changeId: r.changeId,
        success: r.success,
        message: r.message
      }))
    });

    res.status(200).json({
      success: failedChanges === 0, // Overall success if no failures
      message: `Changes application process completed for ${resourceType}. ${successfulChanges} succeeded, ${failedChanges} failed.`,
      data: results
    });
  } catch (error) {
    console.error(`[adminController] Error applying changes for ${resourceType}:`, error);
    console.error(`[adminController] Stack trace:`, error.stack);
    
    if (error.message.startsWith('Unsupported resource type')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: `Failed to apply changes for ${resourceType}. Error: ${error.message}`
    });
  }
};

export const rejectChanges = async (req, res) => {
  const { resourceType } = req.params;
  // Log the request body to help with debugging
  console.log(`[adminController] Reject changes for ${resourceType} request:`, {
    bodyKeys: Object.keys(req.body),
    changeIds: req.body.changeIds
  });
  
  // Expecting an array of changeIds
  const changeIds = req.body.changeIds || [];
  
  if (!changeIds || !Array.isArray(changeIds)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request. `changeIds` must be an array.'
    });
  }

  try {
    // Fetch the actual changes based on the changeIds
    const changes = await AdminModel.getChangesByIds(resourceType, changeIds);
    if (!changes || changes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid changes found with the provided changeIds.'
      });
    }
    
    const results = await AdminModel.rejectChanges(resourceType, changes);
    const successfulRejections = results.filter(r => r.success).length;
    const failedRejections = results.length - successfulRejections;

    // Log the results for debugging
    console.log(`[adminController] Reject changes for ${resourceType} completed:`, {
      total: results.length,
      successful: successfulRejections,
      failed: failedRejections
    });

    res.status(200).json({
      success: failedRejections === 0,
      message: `Changes rejection process completed for ${resourceType}. ${successfulRejections} noted/processed, ${failedRejections} failed.`,
      data: results
    });
  } catch (error) {
    console.error(`Error rejecting changes for ${resourceType}:`, error);
    if (error.message.startsWith('Unsupported resource type')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: `Failed to reject changes for ${resourceType}. Error: ${error.message}`
    });
  }
};