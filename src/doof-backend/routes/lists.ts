/* src/doof-backend/routes/lists.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, param, body, ValidationChain } from 'express-validator';
// Corrected imports - Add .js extension back
import * as ListModel from '../models/listModel.js';
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import db from '../db/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { List, ListItem, ListDetails, ListParams, CreateListData, AddItemData, AddItemResult, FollowToggleResponse, UpdateVisibilityData } from '../../types/List'; // Use frontend types for consistency if possible

const router = express.Router();

// Consistent error response helper
const sendError = (res: Response, message: string, status: number = 500) => {
    // Log the server-side error for debugging
    console.error(`[API Error - Status ${status}] ${message}`);
    // Send a structured error response to the client
    res.status(status).json({
        success: false,
        message: message, // Use 'message' key consistently
        error: message,   // Keep 'error' for compatibility if frontend checks it
        data: null
    });
};

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errMsg = errors.array({ onlyFirstError: true })[0].msg;
        console.warn(`[Lists Route Validation Error] Path: ${req.path}`, errors.array());
        // Use sendError helper for consistent format
        sendError(res, errMsg, 400);
        return;
    }
    next();
};

// --- Validation Chains (Keep as defined previously) ---
const validateIdParam: ValidationChain[] = [
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer').toInt()
];
const validateListItemIdParam: ValidationChain[] = [
    param('listItemId').isInt({ gt: 0 }).withMessage('List Item ID must be a positive integer').toInt()
];
const validateGetListsQuery: ValidationChain[] = [
    queryValidator('createdByUser').optional().isBoolean().withMessage('createdByUser must be boolean').toBoolean(),
    queryValidator('followedByUser').optional().isBoolean().withMessage('followedByUser must be boolean').toBoolean(),
];
const validateCreateListBody: ValidationChain[] = [
    body('name').trim().notEmpty().withMessage('List name is required').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean().toBoolean(),
    body('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
        .custom((tags: any[]) => tags.every((tag: any) => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateUpdateListBody: ValidationChain[] = [
    body('name').optional().trim().notEmpty().withMessage('List name cannot be empty').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean().toBoolean(),
    body('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
        .custom((tags: any[]) => tags.every((tag: any) => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateAddItemBody: ValidationChain[] = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(),
    body('item_type').isIn(['restaurant', 'dish']).withMessage('Invalid item type'),
];
const validateVisibilityBody: ValidationChain[] = [
    body('is_public').isBoolean().withMessage('is_public must be a boolean value').toBoolean()
];
// --- End Validation Chains ---


// GET /api/lists - Fetch lists for the logged-in user
router.get('/', authMiddleware, validateGetListsQuery, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const createdByUserParam = req.query.createdByUser as boolean | undefined;
    const followedByUserParam = req.query.followedByUser as boolean | undefined;

    // Determine fetch options (same logic as before)
    const fetchOptions: ListParams = {};
    if (followedByUserParam === true) {
        fetchOptions.followedByUser = true;
        if (createdByUserParam === false) {
            fetchOptions.createdByUser = false; // Explicitly exclude user's own lists if requested
        } // If createdByUser is true or undefined, default behavior includes both
    } else if (createdByUserParam === true || createdByUserParam === undefined) {
        fetchOptions.createdByUser = true; // Default to created or if explicitly requested
    }

    try {
        const lists = await ListModel.findListsByUser(userId, fetchOptions);
        // Respond with consistent success structure
        res.json({ success: true, data: lists });
    } catch (err) {
        console.error(`[Lists GET /] Error fetching lists for user ${userId}:`, err);
        // Pass error to global handler, which will use sendError
        next(err);
    }
});

// POST /api/lists - Create a new list
router.post('/', authMiddleware, validateCreateListBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listData = req.body as CreateListData; // Use validated body
    const userId = req.user!.id;
    const userHandle = req.user!.username;
    try {
        const newList = await ListModel.createList(listData, userId, userHandle);
        if (!newList) {
            // Model should ideally throw, but handle null return defensively
            return sendError(res, "List creation failed. Please try again.", 500);
        }
        // Send 201 Created status with consistent success structure
        res.status(201).json({ success: true, data: newList });
    } catch (err: any) { // Catch specific errors if possible
        console.error(`[Lists POST /] Error creating list for user ${userId}:`, err);
         if (err.code === '23505') { // Handle potential unique constraint violation (e.g., name)
             return sendError(res, "A list with this name might already exist.", 409); // 409 Conflict
         }
        next(err); // Pass other errors to global handler
    }
});

// GET /api/lists/:id - Get details of a specific list
router.get('/:id', validateIdParam, handleValidationErrors, optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user?.id; // May be undefined due to optionalAuthMiddleware
    try {
        const listRaw = await ListModel.findListById(listId);
        if (!listRaw) {
            return sendError(res, 'List not found', 404);
        }

        // Format list data (ensure formatListForResponse handles potential nulls)
        const list = ListModel.formatListForResponse(listRaw);
        if (!list) {
             // This indicates an issue with formatting or the raw data itself
             console.error(`[Lists GET /:id] Failed to format list data for ID ${listId}. Raw:`, listRaw);
             return sendError(res, 'Failed to process list data.', 500);
        }

        // Permission Check: Deny access to private lists if user is not owner
        if (!list.is_public && list.user_id !== userId) {
            return sendError(res, 'You do not have permission to view this private list', 403);
        }

        // Fetch associated items
        const items = await ListModel.findListItemsByListId(listId);
        // Determine follow status (only if user is authenticated)
        const isFollowing = userId ? await ListModel.isFollowing(listId, userId) : false;

        // Construct final response payload
        const responsePayload: ListDetails = {
            ...list,
            items: items,
            item_count: items.length, // Ensure count matches fetched items
            is_following: isFollowing,
            created_by_user: list.user_id === userId, // Determine ownership based on current user
            creator_handle: listRaw.creator_handle, // Keep original creator handle
        };
        res.json({ success: true, data: responsePayload });
    } catch (err) {
        console.error(`[Lists GET /:id] Error fetching list ${listId}:`, err);
        next(err); // Pass to global error handler
    }
});

// PUT /api/lists/:id - Update a list
router.put('/:id', authMiddleware, validateIdParam, validateUpdateListBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const listData = req.body as Partial<List>; // Use validated update data
    try {
        const existingList = await ListModel.findListById(listId);
        if (!existingList) {
            return sendError(res, 'List not found', 404);
        }
        if (existingList.user_id !== userId) {
             return sendError(res, 'You can only edit your own lists', 403);
        }

        const updatedList = await ListModel.updateList(listId, listData);
        if (!updatedList) {
            // This could mean not found again or update failed in model
            console.warn(`[Lists PUT /:id] Update returned null for list ${listId}.`);
            return sendError(res, 'Failed to update list. Please try again.', 500);
        }
        res.json({ success: true, data: updatedList });
    } catch (err: any) {
        console.error(`[Lists PUT /:id] Error updating list ${listId}:`, err);
        if (err.code === '23505') { // Handle potential unique constraint violation
            return sendError(res, "Update failed: A list with this name might already exist.", 409);
        }
        next(err);
    }
});

// POST /api/lists/:id/items - Add an item to a list
router.post('/:id/items', authMiddleware, validateIdParam, validateAddItemBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const { item_id, item_type } = req.body as AddItemData;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) {
            return sendError(res, 'List not found', 404);
        }
        if (list.user_id !== userId) {
             return sendError(res, 'You can only add items to your own lists', 403);
        }

        // Compatibility check now handled within addItemToList model function, which throws specific errors
        const addedItemResult = await ListModel.addItemToList(listId, item_id, item_type);

        // The model now returns AddItemResult structure
        res.status(201).json({ success: true, data: addedItemResult }); // Send the structured response

    } catch (err: any) {
        console.error(`[Lists POST /:id/items] Error adding item to list ${listId}:`, err);
        // Handle specific errors thrown by the model
        if (err.message?.includes('Cannot add a')) { // Type incompatibility error
            return sendError(res, err.message, 409); // 409 Conflict
        }
        if (err.message?.includes('already exists') || err.status === 409 || err.code === '23505') { // Item exists error
            return sendError(res, 'This item already exists in the list.', 409); // 409 Conflict
        }
        next(err); // Pass other errors
    }
});

// DELETE /api/lists/:id/items/:listItemId - Remove item from a list
router.delete('/:id/items/:listItemId', authMiddleware, validateIdParam, validateListItemIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const listItemId = req.params.listItemId as unknown as number;
    const userId = req.user!.id;
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
             // Item might not have existed on the list
             return sendError(res, 'Item not found in this list.', 404);
        }
        // Success: Send 204 No Content status code
        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
        next(err);
    }
});

// POST /api/lists/:id/follow - Follow/unfollow a list
router.post('/:id/follow', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    // Use a DB transaction for atomicity
    const client = await db.getClient();
    try {
        const listRaw = await ListModel.findListById(listId); // Check existence first
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

        // Begin Transaction
        await client.query('BEGIN');
        const currentlyFollowing = await ListModel.isFollowing(listId, userId); // Check within transaction? Maybe not needed.
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
        // Update count within transaction
        const finalSavedCount = await ListModel.updateListSavedCount(listId, savedCountChange);
        // Commit Transaction
        await client.query('COMMIT');

        // Return the expected FollowToggleResponse structure within 'data'
        const responseData: FollowToggleResponse = {
            id: listId,
            is_following: finalFollowingStatus,
            saved_count: finalSavedCount,
            name: list.name, // Include name for context
            type: list.type // Include type for context
        };
        res.json({ success: true, data: responseData });

    } catch (err) {
        await client.query('ROLLBACK').catch((rbErr: any) => console.error("[Lists Follow] Rollback Error:", rbErr));
        console.error(`[Lists POST /:id/follow] Error toggling follow for list ${listId}:`, err);
        next(err); // Pass to global handler
    } finally {
         if (client) client.release(); // Ensure client is always released
    }
});

// PUT /api/lists/:id/visibility - Change list public/private status
router.put('/:id/visibility', authMiddleware, validateIdParam, validateVisibilityBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const { is_public } = req.body as UpdateVisibilityData; // Validated boolean
    try {
        const list = await ListModel.findListById(listId); // Check ownership first
        if (!list) {
            return sendError(res, 'List not found', 404);
        }
        if (list.user_id !== userId) {
             return sendError(res, 'You can only change visibility for your own lists', 403);
        }

        const updatedList = await ListModel.updateListVisibility(listId, is_public);
        if (!updatedList) {
             // Should not happen if ownership check passed, implies DB issue
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
router.delete('/:id', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const userAccountType = req.user!.account_type;
    try {
        const list = await ListModel.findListById(listId); // Check ownership/existence
        if (!list) {
            return sendError(res, 'List not found', 404);
        }
        // Allow deletion only by owner or superuser
        if (userAccountType !== 'superuser' && list.user_id !== userId) {
            return sendError(res, 'You do not have permission to delete this list', 403);
        }

        const deleted = await ListModel.deleteList(listId);
        if (!deleted) {
             // Should not happen if existence check passed, implies DB issue
             console.warn(`[Lists DELETE /:id] Delete returned false for list ${listId}.`);
            return sendError(res, 'Failed to delete list. Please try again.', 500);
        }
        // Success: Send 204 No Content
        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id] Error deleting list ${listId}:`, err);
        next(err);
    }
});


export default router;