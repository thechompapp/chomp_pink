// Filename: /root/doof-backend/controllers/listController.js
/* REFACTORED: Convert to ES Modules */
import * as ListModel from '../models/listModel.js'; // Use named imports from model
import { formatList, formatListItem } from '../utils/formatters.js';
import { validationResult } from 'express-validator';
import config from '../config/config.js';

const handleControllerError = (res, error, message, statusCode = 500) => {
    // Basic error handler, can be expanded
    console.error(message, error);
    res.status(statusCode).json({ success: false, message: error.message || message });
};

// Controller to get user lists
export const getUserLists = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const userId = req.user.id;
    const { view = 'created', page = 1, limit = config.DEFAULT_PAGE_LIMIT ?? 12 } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const offset = (pageNum - 1) * limitNum;
    try {
        // Determine which model function to call based on view
        const options = { limit: limitNum, offset };
        if (view === 'followed') options.followedByUser = true;
        else options.createdByUser = true; // Default to created

        const results = await ListModel.findListsByUser(userId, options); // findListsByUser now handles both cases + pagination

        const formattedLists = results.data; // Model already formats
        const totalItems = results.total || 0;
        const totalPages = Math.ceil(totalItems / limitNum);
        res.json({
            success: true, message: `Lists retrieved successfully (view: ${view}).`, data: formattedLists,
            pagination: { currentPage: pageNum, totalPages: totalPages, totalItems: totalItems, itemsPerPage: limitNum, currentView: view, },
        });
    } catch (error) { handleControllerError(res, error, `Error fetching user lists for user ${userId}`); }
};

// Controller to create a new list
export const createList = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) }); }
    const userId = req.user.id;
    const userHandle = req.user.username; // Get handle from authenticated user
    try {
        const createdList = await ListModel.createList(req.body, userId, userHandle);
        res.status(201).json({ success: true, message: 'List created successfully.', data: createdList, });
    } catch (error) { handleControllerError(res, error, `Error creating list for user ${userId}`); }
};

// Controller to get list details
export const getListDetails = async (req, res, next) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const { id } = req.params;
    const listId = parseInt(id, 10);
    const userId = req.user?.id;
    try {
        const listRaw = await ListModel.findListByIdRaw(listId); // Fetch raw list data first
        if (!listRaw) { return res.status(404).json({ success: false, message: `List with ID ${listId} not found.` }); }
        // Privacy check
        if (!listRaw.is_public && listRaw.user_id !== userId) { return res.status(403).json({ success: false, message: 'You do not have permission to view this private list.' }); }
        // Fetch items separately
        const items = await ListModel.findListItemsByListId(listId);
        // Format and combine
        const formattedList = formatList(listRaw); // Use formatter
        formattedList.items = items; // Attach formatted items
        formattedList.is_following = userId ? await ListModel.isFollowing(listId, userId) : false; // Check follow status if user is logged in
        formattedList.created_by_user = listRaw.user_id === userId;

        res.json({ success: true, message: 'List details retrieved successfully.', data: formattedList, });
    } catch (error) { handleControllerError(res, error, `Error fetching list details for ID ${listId}`); }
};

// Controller to update a list
export const updateList = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) }); }
    const { id } = req.params;
    const listId = parseInt(id, 10);
    const userId = req.user.id;
    try {
        const list = await ListModel.findListByIdRaw(listId);
        if (!list) { return res.status(404).json({ success: false, message: `List not found.` }); }
        if (list.user_id !== userId /* && req.user.account_type !== 'superuser' */) { return res.status(403).json({ success: false, message: 'Permission denied.' }); }
        if (Object.keys(req.body).length === 0) { return res.status(400).json({ success: false, message: 'No update data provided.' }); }
        const updatedList = await ListModel.updateList(listId, req.body);
        res.json({ success: true, message: 'List updated successfully.', data: updatedList });
    } catch (error) { handleControllerError(res, error, `Error updating list ID ${listId}`); }
};

// Controller to delete a list
export const deleteList = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const { id } = req.params;
    const listId = parseInt(id, 10);
    const userId = req.user.id;
    try {
        const list = await ListModel.findListByIdRaw(listId);
        if (!list) { return res.status(404).json({ success: false, message: `List not found.` }); }
        if (list.user_id !== userId /* && req.user.account_type !== 'superuser' */) { return res.status(403).json({ success: false, message: 'Permission denied.' }); }
        const success = await ListModel.deleteList(listId);
        if (!success) { return res.status(404).json({ success: false, message: `List with ID ${listId} not found or delete failed.` }); }
        res.status(200).json({ success: true, message: 'List deleted successfully.' }); // Use 200 with message
    } catch (error) { handleControllerError(res, error, `Error deleting list ID ${listId}`); }
};

// Controller to add an item to a list
export const addItemToList = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) }); }
    const { id: listIdParam } = req.params;
    const listId = parseInt(listIdParam, 10);
    const userId = req.user.id;
    const { item_id, item_type, notes } = req.body;
    try {
        const list = await ListModel.findListByIdRaw(listId);
        if (!list) { return res.status(404).json({ success: false, message: `List not found.` }); }
        if (list.user_id !== userId) { return res.status(403).json({ success: false, message: 'Permission denied.' }); }
        const result = await ListModel.addItemToList(listId, item_id, item_type, notes); // Pass notes
        res.status(201).json({ success: true, message: result.message, data: result.item });
    } catch (error) { handleControllerError(res, error, `Error adding item to list ${listId}`, error.status); } // Pass status code if available
};

// Controller to remove an item from a list
export const removeItemFromList = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const { id: listIdParam, listItemId: listItemIdParam } = req.params;
    const listId = parseInt(listIdParam, 10);
    const listItemId = parseInt(listItemIdParam, 10);
    const userId = req.user.id;
    try {
        const list = await ListModel.findListByIdRaw(listId);
        if (!list) { return res.status(404).json({ success: false, message: `List not found.` }); }
        if (list.user_id !== userId) { return res.status(403).json({ success: false, message: 'Permission denied.' }); }
        const success = await ListModel.removeItemFromList(listId, listItemId); // Model verifies listItemId belongs to listId
        if (!success) { return res.status(404).json({ success: false, message: `List item not found on this list.` }); }
        res.status(200).json({ success: true, message: 'Item removed successfully.' });
    } catch (error) { handleControllerError(res, error, `Error removing list item ${listItemId}`); }
};

// Controller to toggle follow status
export const toggleFollowList = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const { id } = req.params;
    const listId = parseInt(id, 10);
    const userId = req.user.id;
    try {
        const result = await ListModel.toggleFollowList(listId, userId); // Model handles logic and returns detailed status
        res.json({ success: true, message: result.message, data: { is_following: result.is_following, saved_count: result.saved_count, name: result.name, list_type: result.list_type } });
    } catch (error) { handleControllerError(res, error, `Error toggling follow for list ID ${listId}`, error.status); }
};