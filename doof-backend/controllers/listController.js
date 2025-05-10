/* doof-backend/controllers/listController.js */
import { check, query, param, validationResult } from 'express-validator';
import { ListModel } from '../models/listModel.js';
import { formatList, formatListItem } from '../utils/formatters.js'; // Ensure formatListItem is imported if used elsewhere, though not in createList
import config from '../config/config.js';
import UserModel from '../models/userModel.js'; // For fetching user handle if not directly on req.user

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
  console.log(`[listController getUserLists] Parsed Params - userId: ${userId}, view: ${view}, page: ${pageNum}, limit: ${limitNum}, cityId: ${cityId}, boroughId: ${boroughId}, neighborhoodId: ${neighborhoodId}, query: ${searchQuery}, hashtags: ${JSON.stringify(hashtags)}`);
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
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10; // Default to 10 or make it more configurable
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
    const items = await ListModel.findListItemsByListId(listId); // This model function should handle formatting with formatListItem
    console.log(`[listController getListItems] Received items from model:`, items);
    const limitedItems = items ? items.slice(0, limit) : [];
    res.json({
      success: true,
      message: `Items retrieved successfully for list ${listId}.`,
      data: limitedItems, // Send formatted items
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
  console.log('[listController LOG] Entered createList function.');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[listController createList] Validation Errors:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id: userId, username: userHandleFromToken } = req.user; // req.user is populated by requireAuth
  const {
    name,
    description,
    list_type,
    is_public = true, // Default to public if not specified
    tags,
    city_id,
    // initialItemId, // Handled by frontend flow, not this core API
    // initialItemType,
  } = req.body;

  let creatorHandle = userHandleFromToken;

  // Fallback to fetch username if not on token (should ideally be on token)
  if (!creatorHandle) {
    try {
        const user = await UserModel.findUserById(userId);
        if (user) {
            creatorHandle = user.username;
        } else {
            console.warn(`[listController createList] User with ID ${userId} not found, cannot set creator_handle.`);
            // Depending on strictness, you might error out or proceed without it
        }
    } catch (userError) {
        console.error(`[listController createList] Error fetching user ${userId} for handle:`, userError);
        // Proceed without handle, or error if critical
    }
  }


  const listData = {
    name: name.trim(),
    description: description ? description.trim() : null,
    list_type,
    is_public: typeof is_public === 'boolean' ? is_public : true,
    tags: Array.isArray(tags) ? tags.map(tag => tag.trim()).filter(Boolean) : [],
    city_id: city_id ? parseInt(city_id, 10) : null,
  };

  console.log(`[listController createList] Parsed listData for user ${userId} (${creatorHandle}):`, listData);

  try {
    const newList = await ListModel.createList(listData, userId, creatorHandle);
    console.log('[listController createList] List created successfully by model:', newList);

    if (!newList) { // Should not happen if model throws error, but as safeguard
        return handleControllerError(res, new Error("Model returned no list"), "Failed to create list: Unknown error from model.", 500);
    }

    const formattedNewList = formatList(newList);

    if (!formattedNewList) {
        console.error('[listController createList] Failed to format the newly created list:', newList);
        return handleControllerError(res, new Error("Formatting error"), "List created but could not be formatted for response.", 500);
    }

    res.status(201).json({
      success: true,
      message: 'List created successfully.',
      data: formattedNewList,
    });
  } catch (error) {
    console.error(`[listController createList] Caught error for user ${userId}:`, error);
    if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        // This might be too generic; ideally, the model or DB layer gives more context for what was duplicated.
        // For now, assuming it might be a name conflict if a user tries to create two lists with the exact same name (if such a constraint exists at user level)
        return handleControllerError(res, error, 'Failed to create list: A list with similar identifying information might already exist.', 409);
    }
    handleControllerError(res, error, `Error creating list`);
  }
};

export const getListDetails = async (req, res, next) => {
    console.log(`[listController LOG] Entered getListDetails for List ID: ${req.params.id}`);
    const listId = parseInt(req.params.id, 10);
    const userId = req.user?.id; // From optionalAuthMiddleware

    if (isNaN(listId) || listId <= 0) {
        return res.status(400).json({ success: false, message: "Invalid list ID format." });
    }
    console.log(`[listController getListDetails] Parsed Params - listId: ${listId}, userId (optional): ${userId}`);

    try {
        console.log(`[listController getListDetails] Calling ListModel.findListByIdRaw for list ${listId}`);
        const listRaw = await ListModel.findListByIdRaw(listId);

        if (!listRaw) {
            console.log(`[listController getListDetails] List ${listId} not found.`);
            return res.status(404).json({ success: false, message: `List with ID ${listId} not found.` });
        }

        // Check if the list is private and the user is not the owner
        if (!listRaw.is_public && listRaw.user_id !== userId) {
            console.log(`[listController getListDetails] Permission denied for private list ${listId}. User ${userId} is not owner ${listRaw.user_id}.`);
            return res.status(403).json({ success: false, message: 'Permission denied: This list is private.' });
        }

        console.log(`[listController getListDetails] Calling ListModel.findListItemsByListId for list ${listId}`);
        const items = await ListModel.findListItemsByListId(listId); // Expects formatted items
        
        const formattedList = formatList(listRaw);
        if (!formattedList) {
            console.error(`[listController getListDetails] Failed to format list ${listId}`);
            return handleControllerError(res, new Error("Formatting error"), "Could not retrieve list details due to a formatting issue.", 500);
        }
        
        // Augment with is_following and created_by_user status if user is authenticated
        if (userId) {
            formattedList.is_following = await ListModel.isFollowing(listId, userId);
            formattedList.created_by_user = (listRaw.user_id === userId);
        } else {
            formattedList.is_following = false;
            formattedList.created_by_user = false;
        }


        res.json({
            success: true,
            message: `List details retrieved successfully for list ${listId}.`,
            data: {
                ...formattedList,
                items: items || [], // Ensure items is an array, even if empty
            },
        });
    } catch (error) {
        console.error(`[listController getListDetails] Caught error for list ${listId}:`, error);
        handleControllerError(res, error, `Error fetching details for list ${listId}`);
    }
};

export const updateList = async (req, res, next) => { /* ... */ }; // Placeholder
export const deleteList = async (req, res, next) => { /* ... */ }; // Placeholder
export const removeItemFromList = async (req, res, next) => { /* ... */ }; // Placeholder

export const toggleFollowList = async (req, res, next) => {
  console.log(`[listController LOG] Entered toggleFollowList for List ID: ${req.params.id}`);
  const userId = req.user.id; // From requireAuth
  const listIdParam = req.params.id;

  const listId = parseInt(listIdParam, 10);
  if (isNaN(listId) || listId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid list ID format." });
  }
  console.log(`[listController toggleFollowList] Parsed Params - userId: ${userId}, listId: ${listId}`);

  try {
    console.log(`[listController toggleFollowList] Calling ListModel.findListByIdRaw for list ${listId} (existence check)`);
    const listRaw = await ListModel.findListByIdRaw(listId);
    if (!listRaw) {
      console.log(`[listController toggleFollowList] List ${listId} not found.`);
      return res.status(404).json({ success: false, message: 'List not found' });
    }

    // Cannot follow your own list (business rule)
    if (listRaw.user_id === userId) {
        console.log(`[listController toggleFollowList] User ${userId} attempted to follow their own list ${listId}.`);
        return res.status(400).json({ success: false, message: "You cannot follow your own list." });
    }
    // Cannot follow a private list you don't own (though findListByIdRaw doesn't restrict by privacy for this check)
    // The primary check here is existence. Following a private list you can't see is odd, but the model handles the follow/unfollow action.

    console.log(`[listController toggleFollowList] Calling ListModel.toggleFollowList for user ${userId}, list ${listId}`);
    const isNowFollowing = await ListModel.toggleFollowList(listId, userId); // Model function name matches the one in listModel.js
    console.log(`[listController toggleFollowList] Toggled follow status for list ${listId}: isNowFollowing=${isNowFollowing}`);
    res.json({ success: true, is_following: isNowFollowing });
  } catch (error) {
    console.error(`[listController toggleFollowList] Error toggling follow for list ${listId}:`, error);
    handleControllerError(res, error, `Error toggling follow for list ${listId}`);
  }
};