/* doof-backend/controllers/listController.js */
import { check, query, param } from 'express-validator';
import { ListModel } from '../models/listModel.js';
import { logDebug, logError } from '../utils/logger.js';
import listService from '../services/listService.js';

// Validation Middleware
export const validateCreateList = [
  check('name').trim().notEmpty().withMessage('List name is required.')
    .isLength({ min: 3, max: 100 }).withMessage('List name must be between 3 and 100 characters.'),
  check('description').optional({ checkFalsy: true }).trim()
    .isLength({ max: 500 }).withMessage('Description can be up to 500 characters.'),
  check('list_type').isIn(['restaurant', 'dish', 'mixed']).withMessage("list_type must be 'restaurant', 'dish', or 'mixed'."),
  check('is_public').optional().isBoolean().withMessage('is_public must be a boolean value (true or false).'),
  check('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean value (true or false).'),
  check('tags').optional().isArray().withMessage('Tags must be an array.')
    .custom(value => value.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50))
    .withMessage('Each tag must be a non-empty string up to 50 characters.'),
  check('city_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('city_id must be a positive integer.'),
  check('city_name').optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 })
    .withMessage('city_name must be a string up to 100 characters.')
];

export const validateGetUserLists = [
  query('view').optional().isIn(['all', 'created', 'followed']).withMessage("View must be 'all', 'created', or 'followed'."),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.')
];

export const validateGetListPreviewItems = [
  param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer')
];

// Controller Functions
export const getUserLists = async (req, res) => {
  try {
    const { 
      view = 'all', 
      page = 1, 
      limit = 10,
      sortBy = 'newest',
      sortOrder = 'desc',
      isPublic,
      cityId,
      query: searchQuery,
      hashtags
    } = req.query;
    const userId = req.user?.id;
    
    logDebug(`[listController] Getting lists for user ${userId} with parameters:`, {
      view, page, limit, sortBy, sortOrder, isPublic, cityId, searchQuery, hashtags
    });
    
    // If isPublic is explicitly true and no user is authenticated, get public lists
    const shouldGetPublicLists = isPublic === 'true' && !userId;
    
    let result;
    
    if (shouldGetPublicLists) {
      // Import getAllLists and call it directly for public lists
      const { getAllLists } = await import('../models/listModel.js');
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        search: searchQuery,
        isPublic: true,
        sort: sortBy === 'newest' ? 'created_at' : sortBy,
        order: sortOrder
      };
      
      result = await getAllLists(options);
      
      // Format the response to match expected structure
      result = {
        success: true,
        data: result.lists,
        total: result.pagination.totalCount,
        pagination: result.pagination
      };
    } else {
      // Use the service for user-specific lists
      const options = {
        view,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        cityId: cityId ? parseInt(cityId) : undefined,
        query: searchQuery,
        hashtags: hashtags ? (Array.isArray(hashtags) ? hashtags : [hashtags]) : []
      };
      
      result = await listService.getUserLists(userId, options);
    }
    
    logDebug(`[listController] Service/Model returned:`, {
      success: result?.success,
      dataLength: result?.data?.length,
      hasTotal: 'total' in result,
      hasPagination: 'pagination' in result
    });
    
    // Return the correct structure without double-wrapping
    res.status(200).json({
      success: true,
      message: 'Lists retrieved successfully',
      data: result.data,
      total: result.total,
      pagination: result.pagination
    });
  } catch (error) {
    logError('Error in getUserLists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve lists',
      error: error.message
    });
  }
};

export const getListPreviewItems = async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    
    logDebug(`[listController] Getting preview items for list ${listId}`);
    
    const result = await listService.getListPreviewItems(listId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Preview items retrieved successfully',
      data: result.data
    });
  } catch (error) {
    logError('Error in getListPreviewItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve preview items',
      error: error.message
    });
  }
};

export const getListItems = async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    
    console.log(`\n\n=== [listController.getListItems] CALLED FOR LIST ${listId} ===`);
    logDebug(`[listController] Getting items for list ${listId}`);
    
    // Call model directly to get items
    const { findListItemsByListId } = await import('../models/listModel.js');
    const items = await findListItemsByListId(listId);
    
    console.log(`[listController] Model returned type:`, typeof items);
    console.log(`[listController] Model returned keys:`, items ? Object.keys(items) : 'null');
    console.log(`[listController] Is array:`, Array.isArray(items));
    console.log(`[listController] First few items:`, JSON.stringify(items).substring(0, 200));
    
    res.status(200).json({
      success: true,
      message: 'List items retrieved successfully',
      data: items,
      total: Array.isArray(items) ? items.length : (items?.total || 0)
    });
  } catch (error) {
    logError('Error in getListItems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve list items',
      error: error.message
    });
  }
};

export const getListDetails = async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    
    logDebug(`[listController] Getting details for list ${listId}`);
    
    const result = await listService.getList(listId, userId);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'List not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'List details retrieved successfully',
      data: result.data
    });
  } catch (error) {
    logError('Error in getListDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve list details',
      error: error.message
    });
  }
};

export const createList = async (req, res) => {
  try {
    const userId = req.user?.id;
    const listData = {
      ...req.body,
      user_id: userId,
      creator_handle: req.user?.username
    };
    
    logDebug(`[listController] Creating list for user ${userId}`, { listData });
    
    const result = await listService.createList(listData);
    
    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: result.data
    });
  } catch (error) {
    logError('Error in createList:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create list',
      error: error.message
    });
  }
};

// Placeholder methods to be implemented
export const updateList = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

export const deleteList = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

export const addItemToList = async (req, res) => {
  try {
    const listId = parseInt(req.params.id, 10);
    const { itemId, itemType, notes } = req.body;
    const userId = req.user?.id;
    
    logDebug(`[listController] Adding item ${itemId} of type ${itemType} to list ${listId}`);
    
    // Create the itemData object that the service expects
    const itemData = {
      itemId: parseInt(itemId),
      itemType,
      notes: notes || null
    };
    
    const result = await listService.addItemToList(listId, itemData);
    
    res.status(200).json({
      success: true,
      message: 'Item added to list successfully',
      data: result.data || result
    });
  } catch (error) {
    logError('Error in addItemToList:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to list',
      error: error.message
    });
  }
};

export const removeItemFromList = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};

export const toggleFollowList = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented' });
};
