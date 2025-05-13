// doof-backend/controllers/adminController.js
import * as AdminModel from '../models/adminModel.js';
import * as RestaurantModel from '../models/restaurantModel.js';
import * as DishModel from '../models/dishModel.js';
import UserModel from '../models/userModel.js'; // Default import
import * as CityModel from '../models/cityModel.js'; // Assuming named exports or adjust
import * as NeighborhoodModel from '../models/neighborhoodModel.js'; // Assuming named exports or adjust
import * as HashtagModel from '../models/hashtagModel.js'; // Named exports
import { ListModel } from '../models/listModel.js'; // Named export
import SubmissionModel from '../models/submissionModel.js'; // Default import

import {
  formatRestaurant,
  formatDish,
  formatList,
  formatUser,
  formatNeighborhood,
  formatListItem
} from '../utils/formatters.js';

const identityFormatter = (item) => item;

const getModelForResourceType = (resourceType) => {
  switch (resourceType.toLowerCase()) {
    case 'restaurants': return RestaurantModel;
    case 'dishes': return DishModel;
    case 'users': return UserModel; // UserModel is default export, so direct usage if methods are on it
    case 'cities': return CityModel;
    case 'neighborhoods': return NeighborhoodModel;
    case 'hashtags': return HashtagModel;
    case 'lists': return ListModel;
    case 'submissions': return SubmissionModel; // SubmissionModel is default export
    case 'listitems': return null; // listitems might be managed via ListModel or directly if AdminModel config is added
    default: return null;
  }
};

const getFormatterForResourceType = (resourceType) => {
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

export const getAllResources = async (req, res) => {
  let { resourceType } = req.params;
  if(req.route && req.route.path === '/submissions' && !resourceType) resourceType = 'submissions';

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

    if (!data) {
      return res.status(404).json({ success: false, message: `${resourceType} not found or error in fetching.` });
    }

    const formatter = getFormatterForResourceType(resourceType);
    const formattedData = data.map(item => (formatter || identityFormatter)(item));

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
    res.status(500).json({ success: false, message: `Failed to fetch ${resourceType}. Error: ${error.message}` });
  }
};

export const getResourceById = async (req, res) => {
  const { resourceType, id } = req.params;
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
    res.status(500).json({ success: false, message: `Failed to fetch ${resourceType}. Error: ${error.message}` });
  }
};

export const createResource = async (req, res) => {
  const { resourceType } = req.params;
  const data = req.body;
  try {
    const newItem = await AdminModel.createResource(resourceType, data);
    if (!newItem) {
        return res.status(500).json({ success: false, message: `Failed to create ${resourceType}. No item returned.` });
    }
    const formatter = getFormatterForResourceType(resourceType);
    res.status(201).json({ success: true, message: `${resourceType} created successfully.`, data: (formatter || identityFormatter)(newItem) });
  } catch (error) {
    console.error(`Error creating ${resourceType}:`, error);
    if (error.code === '23505') {
        return res.status(409).json({ success: false, message: `${resourceType} already exists or a unique field conflicts. Details: ${error.detail || error.message}` });
    }
    res.status(500).json({ success: false, message: `Failed to create ${resourceType}. Error: ${error.message}` });
  }
};

export const updateResource = async (req, res) => {
  const { resourceType, id } = req.params;
  const data = req.body;
  const resourceId = parseInt(id, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format. ID must be an integer.' });
  }
  try {
    const updatedItem = await AdminModel.updateResource(resourceType, resourceId, data);
     if (!updatedItem) {
      const itemExists = await AdminModel.findResourceById(resourceType, resourceId);
      if (!itemExists) {
          return res.status(404).json({ success: false, message: `${resourceType} with ID ${resourceId} not found.` });
      }
      return res.status(500).json({ success: false, message: `Failed to update ${resourceType} with ID ${resourceId}. Update operation returned no result.` });
    }
    const formatter = getFormatterForResourceType(resourceType);
    res.status(200).json({ success: true, message: `${resourceType} updated successfully.`, data: (formatter || identityFormatter)(updatedItem) });
  } catch (error) {
    console.error(`Error updating ${resourceType} with ID ${id}:`, error);
    if (error.code === '23505') {
        return res.status(409).json({ success: false, message: `Update for ${resourceType} with ID ${resourceId} failed due to a unique constraint. Details: ${error.detail || error.message}` });
    }
    res.status(500).json({ success: false, message: `Failed to update ${resourceType}. Error: ${error.message}` });
  }
};

export const deleteResource = async (req, res) => {
  const { resourceType, id } = req.params;
  const resourceId = parseInt(id, 10);
  if (isNaN(resourceId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format. ID must be an integer.' });
  }
  try {
    const success = await AdminModel.deleteResource(resourceType, resourceId);
    if (!success) {
      const itemExists = await AdminModel.findResourceById(resourceType, resourceId);
      if (!itemExists) {
          return res.status(404).json({ success: false, message: `${resourceType} with ID ${resourceId} not found.` });
      }
      return res.status(500).json({ success: false, message: `Failed to delete ${resourceType} with ID ${resourceId}.` });
    }
    res.status(200).json({ success: true, message: `${resourceType} deleted successfully.` });
  } catch (error) {
    console.error(`Error deleting ${resourceType} with ID ${id}:`, error);
    res.status(500).json({ success: false, message: `Failed to delete ${resourceType}. Error: ${error.message}` });
  }
};

export const approveSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const adminUserId = req.user.id;
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

    if (submission.city && !cityId && typeof submission.city === 'string' && submission.city.trim() !== '') {
        const cityInstance = await CityModel.findByNameOrCreate(submission.city.trim());
        if (cityInstance && cityInstance.id) cityId = cityInstance.id;
    }

    if (cityId && submission.neighborhood && !neighborhoodId && typeof submission.neighborhood === 'string' && submission.neighborhood.trim() !== '') {
        const boroughName = submission.data?.borough || submission.borough || null;
        const neighborhoodInstance = await NeighborhoodModel.findByNameAndCityIdOrCreate(submission.neighborhood.trim(), cityId, boroughName);
        if (neighborhoodInstance && neighborhoodInstance.id) neighborhoodId = neighborhoodInstance.id;
    }

    if (submission.type === 'restaurant' && !cityId) {
        return res.status(400).json({ success: false, message: `Cannot approve restaurant submission without a valid city. City "${submission.city}" could not be resolved.` });
    }

    const itemData = {
        name: submission.name,
        description: submission.description,
        tags: submission.tags,
        ...(submission.data || {}),
    };
    if (submission.type === 'restaurant') {
        itemData.address = submission.location;
        itemData.google_place_id = submission.place_id;
    } else if (submission.type === 'dish') {
        itemData.restaurant_id = submission.restaurant_id;
        itemData.restaurant_name = submission.restaurant_name;
    }

    const approvedItem = await AdminModel.approveSubmission(
        parseInt(submissionId, 10),
        submission.type,
        itemData,
        cityId,
        neighborhoodId,
        submission.place_id,
        submission.user_id,
        adminUserId
    );

    if (!approvedItem) {
        return res.status(500).json({ success: false, message: 'Approval process completed but no item was returned or an error occurred.' });
    }
    const formatter = getFormatterForResourceType(submission.type);
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
    const success = await AdminModel.rejectSubmission(parseInt(submissionId, 10), rejection_reason, adminUserId);
    if (!success) {
      const submission = await SubmissionModel.getSubmissionById(parseInt(submissionId, 10));
      if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });
      return res.status(400).json({ success: false, message: 'Failed to reject submission, it might have been already processed or an unknown error occurred.' });
    }
    res.status(200).json({ success: true, message: 'Submission rejected successfully.' });
  } catch (error) {
    console.error(`Error rejecting submission ${submissionId}:`, error);
    res.status(500).json({ success: false, message: `Failed to reject submission. Error: ${error.message}` });
  }
};

export const checkExistingItems = async (resourceType, itemsToCheck) => {
    try {
        const results = await AdminModel.checkExistingItems(resourceType, itemsToCheck);
        return results;
    } catch (error) {
        console.error(`Error checking existing ${resourceType}:`, error);
        throw error;
    }
};

export const bulkAddResources = async (req, res) => {
    const { resourceType } = req.params;
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'No items provided for bulk addition.' });
    }
    try {
        const results = await AdminModel.bulkAddResources(resourceType, items, req.user.id);
        res.status(200).json({ success: true, message: `Bulk add for ${resourceType} processed.`, data: results });
    } catch (error) {
        console.error(`Error bulk adding ${resourceType}:`, error);
        res.status(500).json({ success: false, message: `Failed to bulk add ${resourceType}. Error: ${error.message}` });
    }
};