/* doof-backend/controllers/listController.js */
import { check, query, param, validationResult } from 'express-validator';
import { ListModel } from '../models/listModel.js';
import { formatList, formatListItem } from '../utils/formatters.js'; // Ensure formatListItem is imported if used elsewhere, though not in createList
import config from '../config/config.js';
import UserModel from '../models/userModel.js'; // For fetching user handle if not directly on req.user
import { createController } from '../utils/controllerWrapper.js';
import { logDebug, logError } from '../utils/logger.js';
import listService from '../services/listService.js';

const handleControllerError = (res, error, message, statusCode = 500) => {
  console.error(`[listController] ${message}:`, error);
  // Check if the error is a known type or has a specific status code
  const responseStatusCode = error.statusCode || statusCode;
  const responseMessage = error.message && responseStatusCode < 500 ? error.message : message; // Prefer specific error messages for client errors
  res.status(responseStatusCode).json({ success: false, message: responseMessage });
};

export const validateCreateList = [
  check('name').trim().notEmpty().withMessage('List name is required.')
    .isLength({ min: 3, max: 100 }).withMessage('List name must be between 3 and 100 characters.'),
  check('description').optional({ checkFalsy: true }).trim()
    .isLength({ max: 500 }).withMessage('Description can be up to 500 characters.'),
  check('list_type').isIn(['restaurant', 'dish', 'mixed']).withMessage("list_type must be 'restaurant', 'dish', or 'mixed'."),
  check('is_public').optional().isBoolean().withMessage('is_public must be a boolean value (true or false).'),
  check('tags').optional().isArray().withMessage('Tags must be an array.')
    .custom(value => value.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50))
    .withMessage('Each tag must be a non-empty string up to 50 characters.'),
  check('city_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('city_id must be a positive integer.'),
  // initialItemId and initialItemType are handled by frontend if list is created with an item,
  // but the core createList API should focus on list metadata. Adding item is a subsequent step.
];


export const validateGetUserLists = [
  query('view').optional().isIn(['all', 'created', 'followed']).withMessage("View must be 'all', 'created', or 'followed'."),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('cityId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('cityId must be a positive integer.'),
  query('boroughId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('boroughId must be a positive integer.'),
  query('neighborhoodId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('neighborhoodId must be a positive integer.'),
  query('query').optional({ checkFalsy: true }).isString().trim().escape(),
  query('hashtags').optional(),
];

export const validateGetListPreviewItems = [
  param('id').isInt({ gt: 0 }).withMessage('List ID in URL must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10.')
];

export const validateAddItemToList = [
  param('id').isInt({ gt: 0 }).withMessage('List ID in URL must be a positive integer.'),
  check('itemId').isInt({ gt: 0 }).withMessage('itemId must be a positive integer.'),
  check('itemType').isIn(['dish', 'restaurant']).withMessage("itemType must be 'dish' or 'restaurant'."),
  check('notes').optional({ checkFalsy: true }).isString().trim().escape(),
];

// Raw controller methods that will be wrapped
const rawMethods = {
  /**
   * Get lists for the current user or public lists
   */
  getUserLists: async (req, res) => {
    logDebug('[listController] Entered getUserLists function');
    
    const userId = req.user ? req.user.id : null;
    const defaultLimit = config?.DEFAULT_PAGE_LIMIT ?? 12;
    const { 
      view = 'all', 
      page = 1, 
      limit = defaultLimit, 
      cityId, 
      boroughId, 
      neighborhoodId, 
      query: searchQuery 
    } = req.query;
    
    // Process hashtags
    let hashtags = req.query.hashtags;
    if (hashtags && typeof hashtags === 'string') hashtags = [hashtags];
    else if (!Array.isArray(hashtags)) hashtags = [];
    hashtags = hashtags.map(tag => String(tag).trim()).filter(Boolean);
    
    // Calculate pagination
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const offset = (pageNum - 1) * limitNum;
    
    logDebug(`[listController getUserLists] Params: userId=${userId}, view=${view}, page=${pageNum}, limit=${limitNum}`);
    
    // Prepare options based on view type
    const options = { 
      limit: limitNum, 
      offset, 
      cityId, 
      boroughId, 
      neighborhoodId, 
      query: searchQuery, 
      hashtags 
    };
    
    if (view === 'followed' && userId) options.followedByUser = true;
    else if (view === 'created' && userId) options.createdByUser = true;
    else options.allLists = true;
    
    // Get lists through the service
    const result = await listService.getUserLists(userId, options);
    
    // Format the response with pagination
    const totalItems = result.total || 0;
    const totalPages = limitNum > 0 ? Math.ceil(totalItems / limitNum) : 0;
    
    return {
      success: true,
      message: `Lists retrieved successfully (view: ${view}).`,
      data: result.data,
      pagination: { 
        currentPage: pageNum, 
        totalPages, 
        totalItems, 
        itemsPerPage: limitNum, 
        currentView: view 
      }
    };
  },
  
  /**
   * Get preview items for a list
   */
  getListPreviewItems: async (req, res) => {
    const { id } = req.params;
    const listId = parseInt(id, 10);
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 3;
    const userId = req.user?.id;
    
    logDebug(`[listController getListPreviewItems] Params: listId=${listId}, limit=${limit}, userId=${userId}`);
    
    // First check if list exists and if user has access
    const list = await listService.getList(listId, userId);
    
    if (!list.success) {
      return list; // Return error from service
    }
    
    // Get preview items through service
    const listItems = await listService.getListItems(listId, { limit });
    
    return {
      success: true,
      message: `Preview items retrieved successfully for list ${listId}.`,
      data: listItems.data
    };
  },
  
  /**
   * Get all items in a list
   */
  getListItems: async (req, res) => {
    const { id } = req.params;
    const listId = parseInt(id, 10);
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
    const userId = req.user?.id;
    
    logDebug(`[listController getListItems] Params: listId=${listId}, limit=${limit}, userId=${userId}`);
    
    // First check if list exists and if user has access
    const list = await listService.getList(listId, userId);
    
    if (!list.success) {
      return list; // Return error from service
    }
    
    // Get items through service
    const listItems = await listService.getListItems(listId, { limit });
    
    return {
      success: true,
      message: `Items retrieved successfully for list ${listId}.`,
      data: listItems.data
    };
  },
  
  /**
   * Get list details
   */
  getListDetails: async (req, res) => {
    const { id } = req.params;
    const listId = parseInt(id, 10);
    const userId = req.user?.id;
    
    logDebug(`[listController getListDetails] Params: listId=${listId}, userId=${userId}`);
    
    const result = await listService.getList(listId, userId);
    
    return {
      success: result.success,
      message: result.success ? `List details retrieved successfully` : result.message,
      data: result.data
    };
  },
  
  // Additional methods to be implemented in same pattern
};

// Create the controller with wrapped methods
const listController = createController({
  name: 'ListController',
  methods: {
    getUserLists: { fn: rawMethods.getUserLists },
    getListPreviewItems: { fn: rawMethods.getListPreviewItems },
    getListItems: { fn: rawMethods.getListItems },
    getListDetails: { fn: rawMethods.getListDetails },
    // Add other methods as they are refactored
  }
});

// Add the raw methods that haven't been refactored yet
// This allows gradual migration of endpoints to the new pattern
export const { getUserLists, getListPreviewItems, getListItems, getListDetails } = listController;

// Legacy controller methods to be refactored later
export const addItemToList = async (req, res, next) => {
  // This method would be refactored to use the raw method pattern
  // and then added to the listController object
  console.log(`[listController LOG] Entered addItemToList for List ID: ${req.params.id}`);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[listController addItemToList] Validation Errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  // req.list is attached by verifyListOwnership middleware
  const listId = req.list.id; // Use the validated listId from middleware
  const { itemId, itemType, notes } = req.body;
  // userId is implicitly confirmed by verifyListOwnership
  console.log(`[listController addItemToList] Parsed Params - listId: ${listId}, itemId: ${itemId}, itemType: ${itemType}, notes: ${notes}`);
  try {
    console.log(`[listController addItemToList] Checking list type compatibility for itemType: ${itemType}`);
    const isCompatible = await ListModel.checkListTypeCompatibility(listId, itemType);
    if (!isCompatible) {
      console.log(`[listController addItemToList] Item type ${itemType} is not compatible with list ${listId}.`);
      return res.status(400).json({ success: false, message: `Item type '${itemType}' is not compatible with this list's type ('${req.list.list_type}').` });
    }
    console.log(`[listController addItemToList] Adding item to list ${listId}`);
    const listItem = await ListModel.addItemToList(listId, itemId, itemType, notes);
    console.log(`[listController addItemToList] Item added successfully:`, listItem);

    // Fetch the updated list to get the new item_count and updated_at
    const updatedListRaw = await ListModel.findListByIdRaw(listId);
    const formattedUpdatedList = updatedListRaw ? formatList(updatedListRaw) : null;


    res.status(201).json({
      success: true,
      message: 'Item added to list successfully.',
      data: {
        listItem: formatListItem(listItem), // Format the newly added list item
        list: formattedUpdatedList // Send the updated list object
      }
    });
  } catch (error) {
    console.error(`[listController addItemToList] Caught error for list ${listId}:`, error);
    if (error.message && error.message.includes('violates foreign key constraint')) {
        return handleControllerError(res, error, `Error adding item: The specified ${itemType} (ID: ${itemId}) does not exist.`, 404);
    }
    if (error.message && error.message.includes('already exists in the list')) { // Assuming model throws specific error
        return handleControllerError(res, error, `This item already exists in the list.`, 409);
    }
    handleControllerError(res, error, `Error adding item to list ${listId}`);
  }
};

export const createList = async (req, res, next) => {
  try {
    console.log('[listController] Entered createList function');
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('[listController] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: { type: 'ValidationError' },
        data: errors.array()
      });
    }

    const { id: userId } = req.user;
    const {
      name,
      description = '',
      list_type,
      isPublic,
      is_public,
      tags = [],
      location = {}
    } = req.body;
    
    // Handle both isPublic and is_public for backward compatibility
    const isPublicFinal = isPublic !== undefined ? isPublic : (is_public !== undefined ? is_public : true);

    console.log(`[listController] Creating list for user ${userId} with data:`, {
      name,
      list_type,
      isPublic: isPublicFinal,
      tags: Array.isArray(tags) ? tags.join(',') : '[]'
    });

    // Prepare list data for creation
    const listData = {
      name,
      description,
      list_type,
      is_public: isPublicFinal,
      created_by: userId, // Use the authenticated user's ID
      user_id: userId,    // Also store as user_id for backward compatibility
      tags: Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string') : [],
      location: location || {},
      status: 'active',
      metadata: {}
    };

    // Create the list using the service
    const newList = await listService.createList(listData, userId, req.user.username);
    
    console.log(`[listController] Successfully created list ${newList.id} for user ${userId}`);
    
    // Format the response
    const response = {
      success: true,
      message: 'List created successfully',
      data: {
        id: newList.id,
        name: newList.name,
        description: newList.description,
        list_type: newList.list_type,
        is_public: newList.is_public,
        created_at: newList.created_at,
        updated_at: newList.updated_at,
        item_count: 0
      }
    };
    
    return res.status(201).json(response);
    
  } catch (error) {
    console.error('[listController] Error in createList:', error);
    
    // Handle specific error types
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'A list with this name already exists',
        error: { type: 'DuplicateListError' }
      });
    }
    
    // Default error response
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating list',
      error: { type: 'ServerError' }
    });
  }
};

// Placeholder methods to be refactored later
export const updateList = async (req, res, next) => { /* ... */ };
export const deleteList = async (req, res, next) => { /* ... */ };
export const removeItemFromList = async (req, res, next) => { /* ... */ };
export const toggleFollowList = async (req, res, next) => { /* ... */ };