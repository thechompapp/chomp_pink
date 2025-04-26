/* doof-backend/controllers/listController.js */
import { check, query, param, validationResult } from 'express-validator';
import { ListModel } from '../models/listModel.js';
import { formatList } from '../utils/formatters.js';
import config from '../config/config.js';

const handleControllerError = (res, error, message, statusCode = 500) => {
  console.error(`[listController] ${message}:`, error);
  res.status(statusCode).json({ success: false, message });
};

export const validateGetUserLists = [
  query('view').optional().isIn(['all', 'created', 'followed']).withMessage("View must be 'all', 'created', or 'followed'."),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('cityId').optional().isInt({ min: 1 }).withMessage('cityId must be a positive integer.'),
  query('boroughId').optional().isInt({ min: 1 }).withMessage('boroughId must be a positive integer.'),
  query('neighborhoodId').optional().isInt({ min: 1 }).withMessage('neighborhoodId must be a positive integer.'),
  query('query').optional().isString().trim().escape(),
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
  check('notes').optional().isString().trim().escape(),
];

export const getUserLists = async (req, res, next) => {
  console.log('[listController LOG] Entered getUserLists function.');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[listController getUserLists] Validation Errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const userId = req.user ? req.user.id : null;
  const defaultLimit = config?.DEFAULT_PAGE_LIMIT ?? 12;
  const { view = 'all', page = 1, limit = defaultLimit, cityId, boroughId, neighborhoodId, query: searchQuery } = req.query;
  let hashtags = req.query.hashtags;
  if (hashtags && typeof hashtags === 'string') hashtags = [hashtags];
  else if (!Array.isArray(hashtags)) hashtags = [];
  hashtags = hashtags.map(tag => String(tag).trim()).filter(Boolean);
  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const offset = (pageNum - 1) * limitNum;
  console.log(`[listController getUserLists] Parsed Params - userId: ${userId}, view: ${view}, page: ${pageNum}, limit: ${limitNum}, cityId: ${cityId}, neighborhoodId: ${neighborhoodId}, query: ${searchQuery}, hashtags: ${JSON.stringify(hashtags)}`);
  try {
    const options = { limit: limitNum, offset, cityId, boroughId, neighborhoodId, query: searchQuery, hashtags };
    if (view === 'followed' && userId) options.followedByUser = true;
    else if (view === 'created' && userId) options.createdByUser = true;
    else options.allLists = true;
    console.log(`[listController getUserLists] Calling ListModel.findListsByUser with user ${userId} and options:`, options);
    const results = await ListModel.findListsByUser(userId, options);
    console.log(`[listController getUserLists] Received results from model:`, results);
    if (!results || !results.data) {
      console.warn('[listController getUserLists] No results returned from model, returning empty response');
      return res.json({
        success: true,
        message: `No lists found (view: ${view}).`,
        data: [],
        pagination: { currentPage: pageNum, totalPages: 0, totalItems: 0, itemsPerPage: limitNum, currentView: view },
      });
    }
    const formattedLists = results.data;
    const totalItems = results.total || 0;
    const totalPages = limitNum > 0 ? Math.ceil(totalItems / limitNum) : 0;
    res.json({
      success: true,
      message: `Lists retrieved successfully (view: ${view}).`,
      data: formattedLists,
      pagination: { currentPage: pageNum, totalPages: totalPages, totalItems: totalItems, itemsPerPage: limitNum, currentView: view },
    });
    console.log('[listController getUserLists] Response sent successfully:', { totalItems, totalPages });
  } catch (error) {
    console.error(`[listController getUserLists] Caught error:`, error);
    handleControllerError(res, error, `Error fetching lists`);
  }
};

export const getListPreviewItems = async (req, res, next) => {
  console.log(`[listController LOG] Entered getListPreviewItems for List ID: ${req.params.id}`);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[listController getListPreviewItems] Validation Errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { id } = req.params;
  const listId = parseInt(id, 10);
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 3;
  const userId = req.user?.id;
  console.log(`[listController getListPreviewItems] Parsed Params - listId: ${listId}, limit: ${limit}, userId: ${userId}`);
  try {
    console.log(`[listController getListPreviewItems] Calling ListModel.findListByIdRaw for permissions check (List ID: ${listId})`);
    const listRaw = await ListModel.findListByIdRaw(listId);
    if (!listRaw) {
      console.log(`[listController getListPreviewItems] List ${listId} not found (for permissions).`);
      return res.status(404).json({ success: false, message: `List with ID ${listId} not found.` });
    }
    if (!listRaw.is_public && listRaw.user_id !== userId) {
      console.log(`[listController getListPreviewItems] Permission denied for list ${listId}.`);
      return res.status(403).json({ success: false, message: 'Permission denied: This list is private.' });
    }
    console.log(`[listController getListPreviewItems] Calling ListModel.findListItemsPreview for list ${listId}`);
    const previewItems = await ListModel.findListItemsPreview(listId, limit);
    console.log(`[listController getListPreviewItems] Received preview items from model:`, previewItems);
    res.json({
      success: true,
      message: `Preview items retrieved successfully for list ${listId}.`,
      data: previewItems,
    });
  } catch (error) {
    console.error(`[listController getListPreviewItems] Caught error for list ${listId}:`, error);
    handleControllerError(res, error, `Error fetching preview items for list ${listId}`);
  }
};

export const getListItems = async (req, res, next) => {
  console.log(`[listController LOG] Entered getListItems for List ID: ${req.params.id}`);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[listController getListItems] Validation Errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { id } = req.params;
  const listId = parseInt(id, 10);
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
  const userId = req.user?.id;
  console.log(`[listController getListItems] Parsed Params - listId: ${listId}, limit: ${limit}, userId: ${userId}`);
  try {
    console.log(`[listController getListItems] Calling ListModel.findListByIdRaw for permissions check (List ID: ${listId})`);
    const listRaw = await ListModel.findListByIdRaw(listId);
    if (!listRaw) {
      console.log(`[listController getListItems] List ${listId} not found (for permissions).`);
      return res.status(404).json({ success: false, message: `List with ID ${listId} not found.` });
    }
    if (!listRaw.is_public && listRaw.user_id !== userId) {
      console.log(`[listController getListItems] Permission denied for list ${listId}.`);
      return res.status(403).json({ success: false, message: 'Permission denied: This list is private.' });
    }
    console.log(`[listController getListItems] Calling ListModel.findListItemsByListId for list ${listId}`);
    const items = await ListModel.findListItemsByListId(listId);
    console.log(`[listController getListItems] Received items from model:`, items);
    const limitedItems = items ? items.slice(0, limit) : []; // Fix: Handle undefined items
    res.json({
      success: true,
      message: `Items retrieved successfully for list ${listId}.`,
      data: limitedItems,
    });
  } catch (error) {
    console.error(`[listController getListItems] Caught error for list ${listId}:`, error);
    handleControllerError(res, error, `Error fetching items for list ${listId}`);
  }
};

export const addItemToList = async (req, res, next) => {
  console.log(`[listController LOG] Entered addItemToList for List ID: ${req.params.id}`);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[listController addItemToList] Validation Errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { id } = req.params;
  const listId = parseInt(id, 10);
  const { itemId, itemType, notes } = req.body;
  const userId = req.user.id;
  console.log(`[listController addItemToList] Parsed Params - listId: ${listId}, itemId: ${itemId}, itemType: ${itemType}, notes: ${notes}, userId: ${userId}`);
  try {
    console.log(`[listController addItemToList] Calling ListModel.findListByIdRaw for permissions check (List ID: ${listId})`);
    const listRaw = await ListModel.findListByIdRaw(listId);
    if (!listRaw) {
      console.log(`[listController addItemToList] List ${listId} not found.`);
      return res.status(404).json({ success: false, message: `List with ID ${listId} not found.` });
    }
    if (listRaw.user_id !== userId) {
      console.log(`[listController addItemToList] Permission denied for list ${listId}.`);
      return res.status(403).json({ success: false, message: 'Permission denied: You do not own this list.' });
    }
    console.log(`[listController addItemToList] Checking list type compatibility for itemType: ${itemType}`);
    const isCompatible = await ListModel.checkListTypeCompatibility(listId, itemType);
    if (!isCompatible) {
      console.log(`[listController addItemToList] Item type ${itemType} is not compatible with list ${listId}.`);
      return res.status(400).json({ success: false, message: `Item type ${itemType} is not compatible with this list.` });
    }
    console.log(`[listController addItemToList] Adding item to list ${listId}`);
    const listItem = await ListModel.addItemToList(listId, itemId, itemType, notes);
    console.log(`[listController addItemToList] Item added successfully:`, listItem);
    res.status(201).json({
      success: true,
      message: 'Item added to list successfully.',
      data: listItem,
    });
  } catch (error) {
    console.error(`[listController addItemToList] Caught error for list ${listId}:`, error);
    handleControllerError(res, error, `Error adding item to list ${listId}`);
  }
};

export const createList = async (req, res, next) => { /* ... */ };
export const getListDetails = async (req, res, next) => { /* ... */ };
export const updateList = async (req, res, next) => { /* ... */ };
export const deleteList = async (req, res, next) => { /* ... */ };
export const removeItemFromList = async (req, res, next) => { /* ... */ };
export const toggleFollowList = async (req, res, next) => { /* ... */ };