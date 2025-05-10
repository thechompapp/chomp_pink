// doof-backend/routes/lists.js
import express from 'express';
import {
    getUserLists,
    getListItems,
    getListPreviewItems,
    createList,
    getListDetails,
    updateList,
    deleteList,
    addItemToList,
    removeItemFromList,
    toggleFollowList,
    validateGetUserLists,
    validateGetListPreviewItems,
    validateAddItemToList
} from '../controllers/listController.js';
import {
    requireAuth,
    optionalAuth,
    verifyListOwnership,
    verifyListAccess // Make sure this is exported from auth.js
} from '../middleware/auth.js';
import { check, param } from 'express-validator';

const router = express.Router();

router.get('/', optionalAuth, validateGetUserLists, getUserLists);

router.post('/', requireAuth, [
    check('name').notEmpty().withMessage('List name is required.').trim().escape(),
    check('description').optional().isString().trim().escape(),
    check('list_type').isIn(['restaurant', 'dish', 'mixed']).withMessage("List type must be 'restaurant', 'dish', or 'mixed'."),
    check('is_public').optional().isBoolean().toBoolean(),
    check('tags').optional().isArray(),
    check('tags.*').optional().isString().trim().escape(),
    check('city_name').optional().isString().trim().escape()
], createList);

// Use verifyListAccess for routes that show list details/items (public or owner)
router.get('/:id', optionalAuth, verifyListAccess, getListDetails);
router.get('/:id/items', optionalAuth, verifyListAccess, getListItems); // Added verifyListAccess
router.get('/:id/preview-items', optionalAuth, validateGetListPreviewItems, verifyListAccess, getListPreviewItems); // Added verifyListAccess


// Use verifyListOwnership for routes that modify list content or settings
router.put('/:id', requireAuth, verifyListOwnership, [
    check('name').optional().notEmpty().withMessage('List name cannot be empty if provided.').trim().escape(),
    check('description').optional({ checkFalsy: true }).isString().trim().escape(),
    check('list_type').optional().isIn(['restaurant', 'dish', 'mixed']).withMessage("List type must be 'restaurant', 'dish', or 'mixed'."),
    check('is_public').optional().isBoolean().toBoolean(),
    check('tags').optional().isArray(),
    check('tags.*').optional().isString().trim().escape(),
    check('city_name').optional({ checkFalsy: true }).isString().trim().escape()
], updateList);

router.delete('/:id', requireAuth, verifyListOwnership, deleteList);

router.post('/:id/items', requireAuth, verifyListOwnership, validateAddItemToList, addItemToList);

router.delete('/:id/items/:listItemId', requireAuth, verifyListOwnership, [
    param('listItemId').isInt({ gt: 0 }).withMessage('List item ID must be a positive integer.')
], removeItemFromList);

router.post('/:id/toggle-follow', requireAuth, toggleFollowList);

export default router;