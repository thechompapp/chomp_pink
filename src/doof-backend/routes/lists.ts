/* src/doof-backend/routes/lists.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, param, body, ValidationChain } from 'express-validator';
import * as ListModel from '../models/listModel.js'; // Corrected to .js
import authMiddleware from '../middleware/auth.js'; // Corrected to .js
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Corrected to .js
import db from '../db/index.js'; // Corrected to .js

const router = express.Router();

interface AuthenticatedRequest extends Request {
    user?: { id: number; username: string; account_type: string };
}

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Lists Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
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
    queryValidator('createdByUser').optional().isBoolean().toBoolean(),
    queryValidator('followedByUser').optional().isBoolean().toBoolean(),
];
const validateCreateListBody: ValidationChain[] = [
    body('name').trim().notEmpty().withMessage('List name is required').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean().toBoolean(),
    body('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
        .custom((tags: any[]) => tags.every((tag: string) => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateUpdateListBody: ValidationChain[] = [
    body('name').optional().trim().notEmpty().withMessage('List name cannot be empty').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean().toBoolean(),
    body('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
        .custom((tags: any[]) => tags.every((tag: string) => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateAddItemBody: ValidationChain[] = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer'),
    body('item_type').isIn(['restaurant', 'dish']).withMessage('Invalid item type'),
];
const validateVisibilityBody: ValidationChain[] = [
    body('is_public').isBoolean().withMessage('is_public must be a boolean value')
];

router.get('/', authMiddleware, validateGetListsQuery, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.id;
    const createdByUser = req.query.createdByUser ?? true;
    const followedByUser = req.query.followedByUser ?? false;
    const fetchOptions = {
        createdByUser: createdByUser && !followedByUser,
        followedByUser: followedByUser
    };
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
    const { id: listId } = req.params;
    const userId = req.user?.id;
    try {
        const list = await ListModel.findListById(parseInt(listId, 10));
        if (!list) {
            return res.status(404).json({ error: 'List not found' });
        }
        if (!list.is_public && list.user_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to view this private list' });
        }

        const items = await ListModel.findListItemsByListId(parseInt(listId, 10));
        let isFollowing = userId ? await ListModel.isFollowing(parseInt(listId, 10), userId) : false;

        const responsePayload = {
            ...ListModel.formatListForResponse(list),
            items: items,
            item_count: items.length,
            is_following: isFollowing,
            created_by_user: list.user_id === userId,
            creator_handle: list.creator_handle,
        };
        res.json({ data: responsePayload });
    } catch (err) {
        console.error(`[Lists GET /:id] Error fetching list ${listId}:`, err);
        next(err);
    }
});

router.put('/:id', authMiddleware, validateIdParam, validateUpdateListBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id: listId } = req.params;
    const userId = req.user!.id;
    const listData = req.body;
    try {
        const list = await ListModel.findListById(parseInt(listId, 10));
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only edit your own lists' });

        const updatedList = await ListModel.updateList(parseInt(listId, 10), listData);
        if (!updatedList) throw new Error("Update failed in model.");

        res.json({ data: updatedList });
    } catch (err) {
        console.error(`[Lists PUT /:id] Error updating list ${listId}:`, err);
        next(err);
    }
});

router.post('/:id/items', authMiddleware, validateIdParam, validateAddItemBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id: listId } = req.params;
    const userId = req.user!.id;
    const { item_id, item_type } = req.body;
    try {
        const list = await ListModel.findListById(parseInt(listId, 10));
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only add items to your own lists' });

        const isCompatible = await ListModel.checkListTypeCompatibility(parseInt(listId, 10), item_type);
        if (!isCompatible) {
            const listType = list.list_type || 'mixed';
            return res.status(409).json({ error: `Cannot add a ${item_type} to a list restricted to ${listType}s.` });
        }

        const addedItem = await ListModel.addItemToList(parseInt(listId, 10), item_id, item_type);
        res.status(201).json({ data: { message: 'Item added successfully', item: addedItem } });
    } catch (err: any) {
        if (err.status === 409) return res.status(409).json({ error: err.message });
        console.error(`[Lists POST /:id/items] Error adding item to list ${listId}:`, err);
        next(err);
    }
});

router.delete('/:id/items/:listItemId', authMiddleware, validateIdParam, validateListItemIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id: listId, listItemId } = req.params;
    const userId = req.user!.id;
    try {
        const list = await ListModel.findListById(parseInt(listId, 10));
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only remove items from your own lists' });

        const deleted = await ListModel.removeItemFromList(parseInt(listId, 10), parseInt(listItemId, 10));
        if (!deleted) return res.status(404).json({ error: 'Item not found in list.' });

        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
        next(err);
    }
});

router.post('/:id/follow', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id: listId } = req.params;
    const userId = req.user!.id;
    const currentDb = req.app?.get('db') || db;
    try {
        const list = await ListModel.findListById(parseInt(listId, 10));
        if (!list) return res.status(404).json({ error: 'List not found.' });
        if (list.user_id === userId) return res.status(400).json({ error: 'You cannot follow your own list.' });
        if (!list.is_public) return res.status(403).json({ error: 'You cannot follow a private list.' });

        await currentDb.query('BEGIN');
        const currentlyFollowing = await ListModel.isFollowing(parseInt(listId, 10), userId);
        let savedCountChange = 0;
        let finalFollowingStatus = false;

        if (currentlyFollowing) {
            await ListModel.unfollowList(parseInt(listId, 10), userId);
            savedCountChange = -1;
            finalFollowingStatus = false;
        } else {
            await ListModel.followList(parseInt(listId, 10), userId);
            savedCountChange = 1;
            finalFollowingStatus = true;
        }
        const finalSavedCount = await ListModel.updateListSavedCount(parseInt(listId, 10), savedCountChange);
        await currentDb.query('COMMIT');

        res.json({
            data: {
                id: parseInt(listId, 10),
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
    const { id: listId } = req.params;
    const userId = req.user!.id;
    const { is_public } = req.body;
    try {
        const list = await ListModel.findListById(parseInt(listId, 10));
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only change visibility for your own lists' });

        const updatedList = await ListModel.updateListVisibility(parseInt(listId, 10), is_public);
        if (!updatedList) throw new Error("Update failed in model.");

        res.json({ data: updatedList });
    } catch (err) {
        console.error(`[Lists PUT /:id/visibility] Error updating visibility for list ${listId}:`, err);
        next(err);
    }
});

router.delete('/:id', authMiddleware, validateIdParam, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { id: listId } = req.params;
    const userId = req.user!.id;
    try {
        const list = await ListModel.findListById(parseInt(listId, 10));
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (req.user!.account_type !== 'superuser' && list.user_id !== userId) {
            return res.status(403).json({ error: 'You can only delete your own lists' });
        }

        const deleted = await ListModel.deleteList(parseInt(listId, 10));
        if (!deleted) return res.status(404).json({ error: 'List not found or already deleted.' });

        res.status(204).send();
    } catch (err) {
        console.error(`[Lists DELETE /:id] Error deleting list ${listId}:`, err);
        next(err);
    }
});

export default router;