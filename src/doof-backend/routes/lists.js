/* src/doof-backend/routes/lists.js */
import express from 'express';
import { check, query as queryValidator, param, validationResult, body } from 'express-validator'; // Added body
import * as ListModel from '../models/listModel.js';
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import db from '../db/index.js'; // Keep for transaction management if needed
import { queryClient } from '@/queryClient'; // Assuming accessible for potential server-side cache invalidation if needed

const router = express.Router();

// --- Middleware ---
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[Lists Route Validation Error] Path: ${req.path}`, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
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
  queryValidator('createdByUser').optional().isBoolean().toBoolean(),
  queryValidator('followedByUser').optional().isBoolean().toBoolean(),
];
const validateCreateListBody = [
  body('name').trim().notEmpty().withMessage('List name is required').isLength({ max: 255 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  body('is_public').optional().isBoolean().toBoolean(),
  body('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
    .custom((tags) => tags.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
    .withMessage('Invalid tag format or length (1-50 chars)'),
  body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateUpdateListBody = [ // Validation for PUT
    body('name').optional().trim().notEmpty().withMessage('List name cannot be empty').isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim().isLength({ max: 1000 }),
    body('is_public').optional().isBoolean().toBoolean(),
    body('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage('Invalid list type'),
    body('tags').optional().isArray().withMessage('Tags must be an array')
        .custom((tags) => tags.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= 50))
        .withMessage('Invalid tag format or length (1-50 chars)'),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
const validateAddItemBody = [
    body('item_id').isInt({ gt: 0 }).withMessage('Item ID must be a positive integer'),
    body('item_type').isIn(['restaurant', 'dish']).withMessage('Invalid item type'),
];
const validateVisibilityBody = [
    body('is_public').isBoolean().withMessage('is_public must be a boolean value')
];

// --- Routes (using standard { data: ... } response) ---

// GET /api/lists
router.get('/', authMiddleware, validateGetListsQuery, handleValidationErrors, async (req, res, next) => {
    const userId = req.user.id;
    const createdByUser = req.query.createdByUser ?? true;
    const followedByUser = req.query.followedByUser ?? false;
    const fetchOptions = {
         createdByUser: createdByUser && !followedByUser,
         followedByUser: followedByUser
    };
    try {
        const lists = await ListModel.findListsByUser(userId, fetchOptions);
        res.json({ data: lists }); // Model function handles formatting
    } catch (err) {
        console.error(`[Lists GET /] Error fetching lists for user ${userId}:`, err);
        next(err);
    }
});

// POST /api/lists
router.post('/', authMiddleware, validateCreateListBody, handleValidationErrors, async (req, res, next) => {
    const listData = req.body;
    const userId = req.user.id;
    const userHandle = req.user.username;
    try {
        const newList = await ListModel.createList(listData, userId, userHandle);
        if (!newList) throw new Error("List creation failed in model."); // Handle potential conflict return
        res.status(201).json({ data: newList }); // Model function handles formatting
    } catch (err) {
        console.error(`[Lists POST /] Error creating list for user ${userId}:`, err);
        next(err);
    }
});

// GET /api/lists/:id
router.get('/:id', validateIdParam, handleValidationErrors, optionalAuthMiddleware, async (req, res, next) => {
    const { id: listId } = req.params;
    const userId = req.user?.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (!list.is_public && list.user_id !== userId) return res.status(403).json({ error: 'You do not have permission to view this private list' });

        const items = await ListModel.findListItemsByListId(listId);
        let isFollowing = userId ? await ListModel.isFollowing(listId, userId) : false;

        const responsePayload = {
            ...ListModel.formatListForResponse(list), // Format the base list
            items: items, // Items are already formatted by findListItemsByListId
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

// PUT /api/lists/:id
router.put('/:id', authMiddleware, validateIdParam, validateUpdateListBody, handleValidationErrors, async (req, res, next) => {
    const { id: listId } = req.params;
    const userId = req.user.id;
    const listData = req.body;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.user_id !== userId) return res.status(403).json({ error: 'You can only edit your own lists' });

        const updatedList = await ListModel.updateList(listId, listData);
        if (!updatedList) throw new Error("Update failed in model.");

        queryClient?.invalidateQueries({ queryKey: ['listDetails', listId] });
        queryClient?.invalidateQueries({ queryKey: ['userLists', 'created'] });

        res.json({ data: updatedList }); // Model function handles formatting
    } catch (err) {
        console.error(`[Lists PUT /:id] Error updating list ${listId}:`, err);
        next(err);
    }
});

// POST /api/lists/:id/items
router.post('/:id/items', authMiddleware, validateIdParam, validateAddItemBody, handleValidationErrors, async (req, res, next) => {
    const { id: listId } = req.params;
    const userId = req.user.id;
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
         queryClient?.invalidateQueries({ queryKey: ['listDetails', listId] });
         queryClient?.invalidateQueries({ queryKey: ['userLists'] });

         res.status(201).json({ data: { message: 'Item added successfully', item: addedItem } });
     } catch (err) {
         if (err.status === 409) return res.status(409).json({ error: err.message });
         console.error(`[Lists POST /:id/items] Error adding item to list ${listId}:`, err);
         next(err);
     }
});

// DELETE /api/lists/:id/items/:listItemId
router.delete('/:id/items/:listItemId', authMiddleware, validateIdParam, validateListItemIdParam, handleValidationErrors, async (req, res, next) => {
     const { id: listId, listItemId } = req.params;
     const userId = req.user.id;
     try {
         const list = await ListModel.findListById(listId);
         if (!list) return res.status(404).json({ error: 'List not found' });
         if (list.user_id !== userId) return res.status(403).json({ error: 'You can only remove items from your own lists' });

         const deleted = await ListModel.removeItemFromList(listId, listItemId);
         if (!deleted) return res.status(404).json({ error: 'Item not found in list.' });

         queryClient?.invalidateQueries({ queryKey: ['listDetails', listId] });
         queryClient?.invalidateQueries({ queryKey: ['userLists'] });

         res.status(204).send();
     } catch (err) {
         console.error(`[Lists DELETE /:id/items/:listItemId] Error removing item ${listItemId} from list ${listId}:`, err);
         next(err);
     }
});

// POST /api/lists/:id/follow
router.post('/:id/follow', authMiddleware, validateIdParam, handleValidationErrors, async (req, res, next) => {
    const { id: listId } = req.params;
    const userId = req.user.id;
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

         queryClient?.invalidateQueries({ queryKey: ['listDetails', listId] });
         queryClient?.invalidateQueries({ queryKey: ['trendingListsPage'] });
         queryClient?.invalidateQueries({ queryKey: ['userLists', 'followed'] });

         res.json({
             data: {
                 id: listId,
                 is_following: finalFollowingStatus,
                 saved_count: finalSavedCount,
                 name: list.name, // Include necessary info for cache update
                 type: list.list_type
             }
          });
    } catch (err) {
        await currentDb.query('ROLLBACK').catch(rbErr => console.error("[Lists Follow] Rollback Error:", rbErr));
        console.error(`[Lists POST /:id/follow] Error toggling follow for list ${listId}:`, err);
        next(err);
    }
});

// PUT /api/lists/:id/visibility
router.put('/:id/visibility', authMiddleware, validateIdParam, validateVisibilityBody, handleValidationErrors, async (req, res, next) => {
    const { id: listId } = req.params;
    const userId = req.user.id;
    const { is_public } = req.body;
    try {
         const list = await ListModel.findListById(listId);
         if (!list) return res.status(404).json({ error: 'List not found' });
         if (list.user_id !== userId) return res.status(403).json({ error: 'You can only change visibility for your own lists' });

         const updatedList = await ListModel.updateListVisibility(listId, is_public);
         if (!updatedList) throw new Error("Update failed in model.");

         queryClient?.invalidateQueries({ queryKey: ['listDetails', listId] });
         queryClient?.invalidateQueries({ queryKey: ['userLists', 'created'] });
         queryClient?.invalidateQueries({ queryKey: ['trendingListsPage'] });

         res.json({ data: updatedList }); // Model function formats response
    } catch (err) {
        console.error(`[Lists PUT /:id/visibility] Error updating visibility for list ${listId}:`, err);
        next(err);
    }
});

// DELETE /api/lists/:id (Delete List) - Added
router.delete('/:id', authMiddleware, validateIdParam, handleValidationErrors, async (req, res, next) => {
    const { id: listId } = req.params;
    const userId = req.user.id;
    try {
        const list = await ListModel.findListById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });
        // Allow superuser to delete any list, otherwise only owner
        if (req.user.account_type !== 'superuser' && list.user_id !== userId) {
             return res.status(403).json({ error: 'You can only delete your own lists' });
        }

        const deleted = await ListModel.deleteList(listId);
        if (!deleted) return res.status(404).json({ error: 'List not found or already deleted.' });

        // Invalidate caches
        queryClient?.invalidateQueries({ queryKey: ['listDetails', listId] });
        queryClient?.invalidateQueries({ queryKey: ['userLists'] });
        queryClient?.invalidateQueries({ queryKey: ['adminData', 'lists'] });
        queryClient?.invalidateQueries({ queryKey: ['trendingListsPage'] });


        res.status(204).send(); // No content on success
    } catch (err) {
        console.error(`[Lists DELETE /:id] Error deleting list ${listId}:`, err);
        next(err);
    }
});


export default router;