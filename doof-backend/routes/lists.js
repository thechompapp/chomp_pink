/* src/doof-backend/routes/lists.js */
import express from 'express';
import { query as queryValidator, validationResult, param, body } from 'express-validator';
// Corrected imports - Add .js extension back
import * as ListModel from '../models/listModel.js';
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import db from '../db/index.js';

const router = express.Router();

// Consistent error response helper
const sendError = (res, message, status = 500) => {
    console.error(`[API Error - Status ${status}] ${message}`);
    res.status(status).json({
        success: false,
        message: message,
        error: message, // Keep 'error' field for consistency with previous patterns if needed
        data: null
    });
};

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errMsg = errors.array({ onlyFirstError: true })[0].msg;
        console.warn(`[Lists Route Validation Error] Path: ${req.path}`, errors.array());
        sendError(res, errMsg, 400); // Use helper
        return;
    }
    next();
};

// --- Validation Chains ---
const validateIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer').toInt()
];
const validateListItemIdParam = [
    param('listItemId').isInt({ gt: 0 }).withMessage('List Item ID must be a positive integer').toInt()
];
const validateGetListsQuery = [
    queryValidator('createdByUser').optional().isBoolean().withMessage('createdByUser must be boolean').toBoolean(),
    queryValidator('followedByUser').optional().isBoolean().withMessage('followedByUser must be boolean').toBoolean(),
];
const validateCreateListBody = [
    body('name').trim().notEmpty().withMessage('List name is required').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean().toBoolean(),
    body('list_type') // Validate list_type is provided and correct
        .notEmpty().withMessage('List type (restaurant or dish) is required')
        .isIn(['restaurant', 'dish']).withMessage('Invalid list type (must be restaurant or dish)'), // Removed 'mixed'
    body('tags').optional().isArray().withMessage('Tags must be an array')
        .custom((tags) => tags.every((tag) => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateUpdateListBody = [
    body('name').optional().trim().notEmpty().withMessage('List name cannot be empty').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean().toBoolean(),
    body('list_type').optional().isIn(['restaurant', 'dish']).withMessage('Invalid list type (must be restaurant or dish)'), // Removed 'mixed'
    body('tags').optional().isArray().withMessage('Tags must be an array')
        .custom((tags) => tags.every((tag) => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateAddItemBody = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(),
    body('item_type').isIn(['restaurant', 'dish']).withMessage('Invalid item type'),
];
const validateVisibilityBody = [
    body('is_public').isBoolean().withMessage('is_public must be a boolean value').toBoolean()
];
// --- End Validation Chains ---


// GET /api/lists - Fetch lists for the logged-in user
router.get('/', authMiddleware, validateGetListsQuery, handleValidationErrors, async (req, res, next) => {
    const userId = req.user.id;
    const createdByUserParam = req.query.createdByUser;
    const followedByUserParam = req.query.followedByUser;

    const fetchOptions = {};
    if (followedByUserParam === true) {
        fetchOptions.followedByUser = true;
        if (createdByUserParam === false) {
            fetchOptions.createdByUser = false;
        }
    } else if (createdByUserParam === true || createdByUserParam === undefined) {
        fetchOptions.createdByUser = true;
    }

    try {
        const lists = await ListModel.findListsByUser(userId, fetchOptions);
        res.json({ success: true, data: lists });
    } catch (err) {
        console.error(`[Lists GET /] Error fetching lists for user ${userId}:`, err);
        next(err); // Pass to global error handler
    }
});

// POST /api/lists - Create a new list
router.post('/', authMiddleware, validateCreateListBody, handleValidationErrors, async (req, res, next) => {
    const listData = req.body; // Contains validated 'list_type'
    const userId = req.user.id;
    const userHandle = req.user.username;
    try {
        // Pass validated data to model
        const newList = await ListModel.createList({
             name: listData.name,
             description: listData.description,
             is_public: listData.is_public,
             list_type: listData.list_type, // Pass validated list_type
             tags: listData.tags,
             city_name: listData.city_name
        }, userId, userHandle);

        if (!newList) {
            // Model function should throw or return null/undefined on failure
            return sendError(res, "List creation failed in model.", 500);
        }
        res.status(201).json({ success: true, data: newList });
    } catch (err /*REMOVED: : any*/) {
        console.error(`[Lists POST /] Error creating list for user ${userId}:`, err);
         if (err.code === '23505') { // Specific check for unique constraint
             return sendError(res, "A list with this name might already exist.", 409);
         }
        next(err); // Pass other errors to global handler
    }
});

// GET /api/lists/:id - Get details of a specific list
router.get('/:id', validateIdParam, handleValidationErrors, optionalAuthMiddleware, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user?.id;
    try {
        const listRaw = await ListModel.findListById(listId);
        if (!listRaw) {
            return sendError(res, 'List not found', 404);
        }

        const list = ListModel.formatListForResponse(listRaw); // Use exported function
        if (!list) {
             console.error(`[Lists GET /:id] Failed to format list data for ID ${listId}. Raw:`, listRaw);
             return sendError(res, 'Failed to process list data.', 500);
        }

        if (!list.is_public && list.user_id !== userId) {
            return sendError(res, 'You do not have permission to view this private list', 403);
        }

        const items = await ListModel.findListItemsByListId(listId);
        const isFollowing = userId ? await ListModel.isFollowing(listId, userId) : false;

        // Ensure required ListDetails fields are present
        const responsePayload/*REMOVED: : ListDetails*/ = {
            ...list, // Spread the formatted list which includes necessary fields
            items: items, // Add the fetched items
            item_count: items.length, // Use length of fetched items for accuracy
            // Follow status might already be on list, but overwrite with specific check if needed
            is_following: isFollowing,
            // created_by_user is handled by formatList or can be added here
            created_by_user: list.user_id === userId,
            creator_handle: listRaw.creator_handle, // Get handle from raw data
        };

        res.json({ success: true, data: responsePayload });
    } catch (err) {
        console.error(`[Lists GET /:id] Error fetching list ${listId}:`, err);
        next(err);
    }
});

// PUT /api/lists/:id - Update a list
router.put('/:id', authMiddleware, validateIdParam, validateUpdateListBody, handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const listData = req.body; // Contains validated list_type if provided
    try {
        // Fetch the existing list first to check ownership
        const existingList = await ListModel.findListById(listId);
        if (!existingList) {
            return sendError(res, 'List not found', 404);
        }
        if (existingList.user_id !== userId) {
             return sendError(res, 'You can only edit your own lists', 403);
        }

        // The model's updateList now handles type compatibility checks internally
        const updatedList = await ListModel.updateList(listId, listData);

        if (!updatedList) {
            // This might happen if the update query affects 0 rows but list exists
            console.warn(`[Lists PUT /:id] Update returned null for list ${listId}.`);
            // Refetch to be sure? Or return specific message?
             return sendError(res, 'Failed to update list. Please try again.', 500);
        }
        res.json({ success: true, data: updatedList });
    } catch (err/*REMOVED: : any*/) {
        console.error(`[Lists PUT /:id] Error updating list ${listId}:`, err);
         if (err.code === '23505') { // Handle unique constraint errors
             return sendError(res, "Update failed: A list with this name might already exist.", 409);
         }
         // Handle error related to changing type with incompatible items (thrown by model)
         if (err instanceof Error && err.message.includes("Cannot change type")) {
             return sendError(res, err.message, 409);
         }
        next(err);
    }
});

// POST /api/lists/:id/items - Add an item to a list
router.post('/:id/items', authMiddleware, validateIdParam, validateAddItemBody, handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const { item_id, item_type } = req.body;
    try {
        // Check list ownership before adding
        const list = await ListModel.findListById(listId);
        if (!list) {
            return sendError(res, 'List not found', 404);
        }
        if (list.user_id !== userId) {
             return sendError(res, 'You can only add items to your own lists', 403);
        }

        // The model now handles compatibility check internally based on STRICT list type
        const addedItemResult = await ListModel.addItemToList(listId, item_id, item_type);

        // Ensure the response structure matches AddItemResult: { message?: string, item: { id: number,... } }
        const responsePayload = {
             message: "Item added successfully", // Add a standard success message
             item: addedItemResult.item // This should contain the formatted item from the model
        };

        res.status(201).json({ success: true, data: responsePayload });

    } catch (err/*REMOVED: : any*/) {
        console.error(`[Lists POST /:id/items] Error adding item to list ${listId}:`, err);
         // Check for specific compatibility error thrown by the model
         if (err.message?.includes('Cannot add a')) {
             return sendError(res, err.message, 409);
         }
         if (err.message?.includes('already exists') || err.status === 409 || err.code === '23505') {
             return sendError(res, 'This item already exists in the list.', 409);
         }
        next(err);
    }
});

// DELETE /api/lists/:id/items/:listItemId - Remove item from a list
router.delete('/:id/items/:listItemId', authMiddleware, validateIdParam, validateListItemIdParam, handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const listItemId = req.params.listItemId;
    const userId = req.user.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) {
            return sendError(res, 'List not found', 404);
        }
        if (list.user_id !== userId) {
            return sendError(res, 'You can only remove items from your own lists', 403);
        }

        const deleted = await ListModel.removeItemFromList(listId, listItemId);
        if (!deleted) {
             // Check if list item *ever* existed or just wasn't found *now*
             return sendError(res, 'Item not found in this list.', 404);
        }
        res.status(204).send(); // Success, no content
    } catch (err) {
        console.error(`[Lists DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
        next(err);
    }
});

// POST /api/lists/:id/follow - Follow/unfollow a list
router.post('/:id/follow', authMiddleware, validateIdParam, handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const client = await db.getClient(); // Use transaction for consistency
    try {
        const listRaw = await ListModel.findListById(listId);
        if (!listRaw) {
             client.release();
             return sendError(res, 'List not found.', 404);
        }
        const list = ListModel.formatListForResponse(listRaw); // Format for checks
        if (!list) {
             client.release();
             return sendError(res, 'Failed to process list data.', 500);
        }
        if (list.user_id === userId) {
            client.release();
            return sendError(res, 'You cannot follow your own list.', 400);
        }
        if (!list.is_public) {
            client.release();
            return sendError(res, 'You cannot follow a private list.', 403);
        }

        await client.query('BEGIN');
        const currentlyFollowing = await ListModel.isFollowing(listId, userId);
        let savedCountChange = 0;
        let finalFollowingStatus = false;

        if (currentlyFollowing) {
            await ListModel.unfollowList(listId, userId);
            savedCountChange = -1;
            finalFollowingStatus = false;
        } else {
            await ListModel.followList(listId, userId);
            savedCountChange = 1;
            finalFollowingStatus = true;
        }
        // Update count within the transaction
        const finalSavedCount = await ListModel.updateListSavedCount(listId, savedCountChange);
        await client.query('COMMIT');

        const responseData/*REMOVED: : FollowToggleResponse*/ = {
            id: listId,
            is_following: finalFollowingStatus,
            saved_count: finalSavedCount,
            // Include name and type for potential frontend updates
            name: list.name,
            type: list.type
        };
        res.json({ success: true, data: responseData });

    } catch (err) {
        await client.query('ROLLBACK').catch((rbErr/*REMOVED: : any*/) => console.error("[Lists Follow] Rollback Error:", rbErr));
        console.error(`[Lists POST /:id/follow] Error toggling follow for list ${listId}:`, err);
        next(err);
    } finally {
         if (client) client.release(); // Ensure client is released
    }
});

// PUT /api/lists/:id/visibility - Change list public/private status
router.put('/:id/visibility', authMiddleware, validateIdParam, validateVisibilityBody, handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const { is_public } = req.body; // Use validated boolean
    try {
        const list = await ListModel.findListById(listId);
        if (!list) {
            return sendError(res, 'List not found', 404);
        }
        if (list.user_id !== userId) {
             return sendError(res, 'You can only change visibility for your own lists', 403);
        }

        const updatedList = await ListModel.updateListVisibility(listId, is_public);
        if (!updatedList) {
             // This could mean list was deleted concurrently, or update failed
             console.warn(`[Lists PUT /:id/visibility] Update returned null for list ${listId}.`);
             return sendError(res, 'Failed to update list visibility. Please try again.', 500);
        }
        res.json({ success: true, data: updatedList });
    } catch (err) {
        console.error(`[Lists PUT /:id/visibility] Error updating visibility for list ${listId}:`, err);
        next(err);
    }
});

// DELETE /api/lists/:id - Delete a list
router.delete('/:id', authMiddleware, validateIdParam, handleValidationErrors, async (req, res, next) => {
    const listId = req.params.id;
    const userId = req.user.id;
    const userAccountType = req.user.account_type;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) {
            return sendError(res, 'List not found', 404);
        }
        // Allow superuser OR owner to delete
        if (userAccountType !== 'superuser' && list.user_id !== userId) {
            return sendError(res, 'You do not have permission to delete this list', 403);
        }

        const deleted = await ListModel.deleteList(listId);
        if (!deleted) {
             // Should not happen if list was found above, but handle defensively
             console.warn(`[Lists DELETE /:id] Delete returned false for list ${listId}.`);
            return sendError(res, 'Failed to delete list. Please try again.', 500);
        }
        res.status(204).send(); // Success, no content
    } catch (err) {
        console.error(`[Lists DELETE /:id] Error deleting list ${listId}:`, err);
        next(err);
    }
});


export default router;