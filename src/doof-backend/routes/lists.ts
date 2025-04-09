/* src/doof-backend/routes/lists.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, param, body, ValidationChain } from 'express-validator';
import * as ListModel from '../models/listModel.js'; // Corrected to .js
import authMiddleware from '../middleware/auth.js'; // Corrected to .js
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Corrected to .js
import db from '../db/index.js'; // Corrected to .js
// Import AuthenticatedRequest directly if defined in auth.ts middleware, or define locally
import type { AuthenticatedRequest } from '../middleware/auth.js'; // Assuming it's exported from auth middleware

// If AuthenticatedRequest isn't exported, define it locally:
// interface AuthenticatedRequest extends Request {
//     user?: { id: number; username: string; account_type: string };
// }


const router = express.Router();


const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Lists Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return; // Explicit return
    }
    next();
};

const validateIdParam: ValidationChain[] = [
    param('id').isInt({ gt: 0 }).withMessage('List ID must be a positive integer').toInt()
];
const validateListItemIdParam: ValidationChain[] = [
    param('listItemId').isInt({ gt: 0 }).withMessage('List Item ID must be a positive integer').toInt()
];
const validateGetListsQuery: ValidationChain[] = [
    // Ensure boolean conversion happens correctly
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
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer').toInt(), // Ensure item_id is integer
    body('item_type').isIn(['restaurant', 'dish']).withMessage('Invalid item type'),
];
const validateVisibilityBody: ValidationChain[] = [
    body('is_public').isBoolean().withMessage('is_public must be a boolean value').toBoolean() // Ensure boolean
];

router.get('/', authMiddleware, validateGetListsQuery, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    // Use validated boolean values directly, provide defaults if undefined
    const createdByUserParam = req.query.createdByUser as boolean | undefined;
    const followedByUserParam = req.query.followedByUser as boolean | undefined;

    // Determine fetch options based on presence and value of params
    const fetchOptions: { createdByUser?: boolean; followedByUser?: boolean } = {};
    if (followedByUserParam === true) {
        fetchOptions.followedByUser = true;
        // If followedByUser is true, don't filter by createdByUser unless explicitly requested
        if(createdByUserParam === true) {
             fetchOptions.createdByUser = true; // Might mean "lists I created AND follow" ? Adjust logic if needed
        } else if (createdByUserParam === false) {
            // fetch only followed lists NOT created by user
        }
    } else if (createdByUserParam === true || createdByUserParam === undefined) { // Default to createdByUser if neither is specified or created=true
        fetchOptions.createdByUser = true;
    }
    // If createdByUser is explicitly false and followedByUser is not true, fetch lists neither created nor followed? Adjust as needed.


    try {
        const lists = await ListModel.findListsByUser(userId, fetchOptions);
        res.json({ data: lists });
    } catch (err) {
        console.error(`[Lists GET /] Error fetching lists for user ${userId}:`, err);
        next(err);
    }
});

router.post('/', authMiddleware, validateCreateListBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listData = req.body;
    const userId = req.user!.id;
    const userHandle = req.user!.username;
    try {
        const newList = await ListModel.createList(listData, userId, userHandle);
        if (!newList) throw new Error("List creation failed in model.");
        res.status(201).json({ data: newList });
    } catch (err) {
        console.error(`[Lists POST /] Error creating list for user ${userId}:`, err);
        next(err);
    }
});

router.get('/:id', validateIdParam, handleValidationErrors, optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number; // Use validated number
    const userId = req.user?.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (!list.is_public && list.user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to view this private list' });
        }

        const items = await ListModel.findListItemsByListId(listId);

        // *** FIX REQUIRED in ListModel: Ensure ListModel.isFollowing exists ***
        let isFollowing = false;
        if (userId && typeof (ListModel as any).isFollowing === 'function') {
             isFollowing = await (ListModel as any).isFollowing(listId, userId);
        } else if (userId) {
             console.warn(`[Lists GET /:id] ListModel.isFollowing function not found.`);
        }
        // *********************************************************************

        // *** FIX REQUIRED in ListModel: Ensure ListModel.formatListForResponse exists ***
        let formattedListBase = list;
        if (typeof (ListModel as any).formatListForResponse === 'function') {
            formattedListBase = (ListModel as any).formatListForResponse(list);
        } else {
             console.warn(`[Lists GET /:id] ListModel.formatListForResponse function not found.`);
        }
        // ***************************************************************************

        const responsePayload = {
            ...formattedListBase,
            items: items,
            item_count: items.length,
            is_following: isFollowing, // Uses the potentially incorrect value if model function missing
            created_by_user: list.user_id === userId,
            creator_handle: list.creator_handle, // Ensure this property exists on 'list' object from findListById
        };
        res.json({ data: responsePayload });
    } catch (err) {
        console.error(`[Lists GET /:id] Error fetching list ${listId}:`, err);
        next(err);
    }
});

router.put('/:id', authMiddleware, validateIdParam, validateUpdateListBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number; // Use validated number
    const userId = req.user!.id;
    const listData = req.body;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only edit your own lists' });

        const updatedList = await ListModel.updateList(listId, listData);
        if (!updatedList) {
             // Check if list still exists to differentiate between not found and no change/error
            const checkList = await ListModel.findListById(listId);
             if (!checkList) {
                return res.status(404).json({ error: 'List not found during update attempt.' });
            }
             // If list exists, maybe no change occurred or update returned null unexpectedly
             console.warn(`[Lists PUT /:id] Update for list ${listId} returned null, possibly no changes or DB issue.`);
             return res.status(200).json({ data: checkList, message: "No changes detected or update failed." });
        }

        res.json({ data: updatedList });
    } catch (err) {
        console.error(`[Lists PUT /:id] Error updating list ${listId}:`, err);
        next(err);
    }
});

router.post('/:id/items', authMiddleware, validateIdParam, validateAddItemBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number; // Use validated number
    const userId = req.user!.id;
    const { item_id, item_type } = req.body; // item_id is number due to .toInt()
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only add items to your own lists' });

        // *** FIX REQUIRED in ListModel: Ensure ListModel.checkListTypeCompatibility exists ***
        let isCompatible = true; // Assume compatible if function missing
        if (typeof (ListModel as any).checkListTypeCompatibility === 'function') {
            isCompatible = await (ListModel as any).checkListTypeCompatibility(listId, item_type);
        } else {
            console.warn(`[Lists POST /:id/items] ListModel.checkListTypeCompatibility function not found.`);
            // Fallback: basic check based on list.list_type if available
            if (list.list_type && list.list_type !== 'mixed' && list.list_type !== item_type) {
                isCompatible = false;
            }
        }
        // *********************************************************************************

        if (!isCompatible) {
            const listType = list.list_type || 'mixed';
            return res.status(409).json({ error: `Cannot add a ${item_type} to a list restricted to ${listType}s.` });
        }

        const addedItem = await ListModel.addItemToList(listId, item_id, item_type);
        res.status(201).json({ data: { message: 'Item added successfully', item: addedItem } });
    } catch (err: any) {
         // Handle potential conflict errors (e.g., item already exists) specifically if model throws them
        if (err.message?.includes("already exists") || err.code === '23505' /* Postgres unique violation */) {
            return res.status(409).json({ error: err.message || 'Item already exists in this list.' });
        }
        console.error(`[Lists POST /:id/items] Error adding item to list ${listId}:`, err);
        next(err);
    }
});

router.delete('/:id/items/:listItemId', authMiddleware, validateIdParam, validateListItemIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number; // Use validated number
    const listItemId = req.params.listItemId as unknown as number; // Use validated number
    const userId = req.user!.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only remove items from your own lists' });

        // *** FIX REQUIRED in ListModel: Ensure ListModel.removeItemFromList exists ***
        let deleted = false;
        if (typeof (ListModel as any).removeItemFromList === 'function') {
            deleted = await (ListModel as any).removeItemFromList(listId, listItemId);
        } else {
             console.warn(`[Lists DELETE /:id/items/:listItemId] ListModel.removeItemFromList function not found.`);
             // Cannot proceed without the model function
             return res.status(501).json({ error: "Functionality to remove item not implemented."});
        }
        // ****************************************************************************

        if (!deleted) return res.status(404).json({ error: 'Item not found in list or deletion failed.' });

        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
        next(err);
    }
});

router.post('/:id/follow', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number; // Use validated number
    const userId = req.user!.id;
    const currentDb = req.app?.get('db') || db;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found.' });
        if (list.user_id === userId) return res.status(400).json({ error: 'You cannot follow your own list.' });
        if (!list.is_public) return res.status(403).json({ error: 'You cannot follow a private list.' });

        // Check required functions exist before transaction
        if (typeof (ListModel as any).isFollowing !== 'function' ||
            typeof (ListModel as any).unfollowList !== 'function' ||
            typeof (ListModel as any).followList !== 'function' ||
            typeof (ListModel as any).updateListSavedCount !== 'function') {
            console.error(`[Lists POST /:id/follow] Missing required ListModel functions (isFollowing, unfollowList, followList, updateListSavedCount).`);
            return res.status(501).json({ error: "Follow functionality not fully implemented in the backend model." });
        }


        await currentDb.query('BEGIN');
        // *** FIX REQUIRED in ListModel: Ensure ListModel.isFollowing exists ***
        const currentlyFollowing = await (ListModel as any).isFollowing(listId, userId);

        let savedCountChange = 0;
        let finalFollowingStatus = false;

        if (currentlyFollowing) {
            // *** FIX REQUIRED in ListModel: Ensure ListModel.unfollowList exists ***
            await (ListModel as any).unfollowList(listId, userId);
            savedCountChange = -1;
            finalFollowingStatus = false;
        } else {
            // *** FIX REQUIRED in ListModel: Ensure ListModel.followList exists ***
            await (ListModel as any).followList(listId, userId);
            savedCountChange = 1;
            finalFollowingStatus = true;
        }
        // *** FIX REQUIRED in ListModel: Ensure ListModel.updateListSavedCount exists ***
        const finalSavedCount = await (ListModel as any).updateListSavedCount(listId, savedCountChange);
        await currentDb.query('COMMIT');

        res.json({
            data: {
                id: listId,
                is_following: finalFollowingStatus,
                saved_count: finalSavedCount,
                name: list.name, // Assumes name exists on list object
                type: list.list_type // Assumes list_type exists on list object
            }
        });
    } catch (err) {
        await currentDb.query('ROLLBACK').catch((rbErr: any) => console.error("[Lists Follow] Rollback Error:", rbErr));
        console.error(`[Lists POST /:id/follow] Error toggling follow for list ${listId}:`, err);
        next(err);
    }
});

router.put('/:id/visibility', authMiddleware, validateIdParam, validateVisibilityBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number; // Use validated number
    const userId = req.user!.id;
    const { is_public } = req.body; // is_public is boolean due to .toBoolean()
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only change visibility for your own lists' });

         // *** FIX REQUIRED in ListModel: Ensure ListModel.updateListVisibility exists ***
         let updatedList;
         if (typeof (ListModel as any).updateListVisibility === 'function') {
             updatedList = await (ListModel as any).updateListVisibility(listId, is_public);
         } else {
             console.warn(`[Lists PUT /:id/visibility] ListModel.updateListVisibility function not found.`);
             return res.status(501).json({ error: "Functionality to update visibility not implemented."});
         }
         // *****************************************************************************

        if (!updatedList) {
             // Check if list still exists
             const checkList = await ListModel.findListById(listId);
             if (!checkList) {
                return res.status(404).json({ error: 'List not found during visibility update attempt.' });
             }
             console.warn(`[Lists PUT /:id/visibility] Update for list ${listId} returned null.`);
              // Return current state if update failed silently
             return res.status(200).json({ data: checkList, message: "Update visibility failed or returned no result." });
        }

        res.json({ data: updatedList });
    } catch (err) {
        console.error(`[Lists PUT /:id/visibility] Error updating visibility for list ${listId}:`, err);
        next(err);
    }
});

router.delete('/:id', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number; // Use validated number
    const userId = req.user!.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        // Allow superusers to delete any list
        if (req.user!.account_type !== 'superuser' && list.user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to delete this list' });
        }

        // *** FIX REQUIRED in ListModel: Ensure ListModel.deleteList exists ***
        let deleted = false;
         if (typeof (ListModel as any).deleteList === 'function') {
            deleted = await (ListModel as any).deleteList(listId);
         } else {
            console.warn(`[Lists DELETE /:id] ListModel.deleteList function not found.`);
            return res.status(501).json({ error: "Functionality to delete list not implemented."});
         }
        // ******************************************************************

        if (!deleted) return res.status(404).json({ error: 'List not found or deletion failed.' });

        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id] Error deleting list ${listId}:`, err);
        next(err);
    }
});

export default router;