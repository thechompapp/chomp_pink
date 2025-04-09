/* src/doof-backend/routes/lists.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, param, body, ValidationChain } from 'express-validator';
import * as ListModel from '../models/listModel.js'; // Corrected to .js
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import db from '../db/index.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Lists Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
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

router.get('/', authMiddleware, validateGetListsQuery, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const createdByUserParam = req.query.createdByUser as boolean | undefined;
    const followedByUserParam = req.query.followedByUser as boolean | undefined;

    const fetchOptions: { createdByUser?: boolean; followedByUser?: boolean } = {};
    if (followedByUserParam === true) {
        fetchOptions.followedByUser = true;
        if (createdByUserParam === true) {
            fetchOptions.createdByUser = true;
        } else if (createdByUserParam === false) {
            // Explicitly exclude lists created by user
        }
    } else if (createdByUserParam === true || createdByUserParam === undefined) {
        fetchOptions.createdByUser = true;
    }

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
    const listId = req.params.id as unknown as number;
    const userId = req.user?.id;
    try {
        const listRaw = await ListModel.findListById(listId);
        if (!listRaw) {
            return res.status(404).json({ error: 'List not found' });
        }
        const list = ListModel.formatListForResponse(listRaw); // Use exported function
        if (!list) {
            return res.status(500).json({ error: 'Failed to format list data' });
        }
        if (!list.is_public && list.user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to view this private list' });
        }

        const items = await ListModel.findListItemsByListId(listId);
        const isFollowing = userId ? await ListModel.isFollowing(listId, userId) : false;

        const responsePayload = {
            ...list,
            items: items,
            item_count: items.length,
            is_following: isFollowing,
            created_by_user: list.user_id === userId,
            creator_handle: listRaw.creator_handle,
        };
        res.json({ data: responsePayload });
    } catch (err) {
        console.error(`[Lists GET /:id] Error fetching list ${listId}:`, err);
        next(err);
    }
});

router.put('/:id', authMiddleware, validateIdParam, validateUpdateListBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const listData = req.body;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only edit your own lists' });

        const updatedList = await ListModel.updateList(listId, listData);
        if (!updatedList) {
            return res.status(404).json({ error: 'List not found during update attempt.' });
        }
        res.json({ data: updatedList });
    } catch (err) {
        console.error(`[Lists PUT /:id] Error updating list ${listId}:`, err);
        next(err);
    }
});

router.post('/:id/items', authMiddleware, validateIdParam, validateAddItemBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const { item_id, item_type } = req.body;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only add items to your own lists' });

        const isCompatible = await ListModel.checkListTypeCompatibility(listId, item_type);
        if (!isCompatible) {
            const listType = list.list_type || 'mixed';
            return res.status(409).json({ error: `Cannot add a ${item_type} to a list restricted to ${listType}s.` });
        }

        const addedItem = await ListModel.addItemToList(listId, item_id, item_type);
        res.status(201).json({ data: { message: 'Item added successfully', item: addedItem } });
    } catch (err: any) {
        if (err.status === 409 || err.code === '23505') {
            return res.status(409).json({ error: err.message || 'Item already exists in this list.' });
        }
        console.error(`[Lists POST /:id/items] Error adding item to list ${listId}:`, err);
        next(err);
    }
});

router.delete('/:id/items/:listItemId', authMiddleware, validateIdParam, validateListItemIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const listItemId = req.params.listItemId as unknown as number;
    const userId = req.user!.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only remove items from your own lists' });

        const deleted = await ListModel.removeItemFromList(listId, listItemId);
        if (!deleted) return res.status(404).json({ error: 'Item not found in list or deletion failed.' });

        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
        next(err);
    }
});

router.post('/:id/follow', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const currentDb = req.app?.get('db') || db;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found.' });
        if (list.user_id === userId) return res.status(400).json({ error: 'You cannot follow your own list.' });
        if (!list.is_public) return res.status(403).json({ error: 'You cannot follow a private list.' });

        await currentDb.query('BEGIN');
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
        const finalSavedCount = await ListModel.updateListSavedCount(listId, savedCountChange);
        await currentDb.query('COMMIT');

        res.json({
            data: {
                id: listId,
                is_following: finalFollowingStatus,
                saved_count: finalSavedCount,
                name: list.name,
                type: list.list_type
            }
        });
    } catch (err) {
        await currentDb.query('ROLLBACK').catch((rbErr: any) => console.error("[Lists Follow] Rollback Error:", rbErr));
        console.error(`[Lists POST /:id/follow] Error toggling follow for list ${listId}:`, err);
        next(err);
    }
});

router.put('/:id/visibility', authMiddleware, validateIdParam, validateVisibilityBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    const { is_public } = req.body;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only change visibility for your own lists' });

        const updatedList = await ListModel.updateListVisibility(listId, is_public);
        if (!updatedList) {
            return res.status(404).json({ error: 'List not found during visibility update attempt.' });
        }
        res.json({ data: updatedList });
    } catch (err) {
        console.error(`[Lists PUT /:id/visibility] Error updating visibility for list ${listId}:`, err);
        next(err);
    }
});

router.delete('/:id', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listId = req.params.id as unknown as number;
    const userId = req.user!.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (req.user!.account_type !== 'superuser' && list.user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to delete this list' });
        }

        const deleted = await ListModel.deleteList(listId);
        if (!deleted) return res.status(404).json({ error: 'List not found or deletion failed.' });

        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id] Error deleting list ${listId}:`, err);
        next(err);
    }
});

export default router;