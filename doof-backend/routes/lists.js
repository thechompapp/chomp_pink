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
    toggleFollowList
} from '../controllers/listController.js';
import {
    requireAuth,
    optionalAuth,
    verifyListOwnership,
    verifyListAccess,
    verifyListModifyAccess
} from '../middleware/auth.js';
import { validators, validate, validationRules } from '../utils/validationUtils.js';
import { param } from 'express-validator';

const router = express.Router();

// Get lists with optional auth
router.get(
    '/',
    optionalAuth,
    validate(validators.list.getUserLists),
    getUserLists
);

// Create a new list (requires authentication)
router.post(
    '/',
    requireAuth,
    validate(validators.list.create),
    createList
);

// Get list details with access check
router.get(
    '/:id',
    optionalAuth,
    validate([validationRules.id()]),
    verifyListAccess,
    getListDetails
);

// Get list items with access check
router.get(
    '/:id/items',
    optionalAuth,
    validate(validators.list.getListItems),
    verifyListAccess,
    getListItems
);

// Get list preview items with access check
router.get(
    '/:id/preview-items',
    optionalAuth,
    validate([
        validationRules.id(),
        ...validators.list.getListItems
    ]),
    verifyListAccess,
    getListPreviewItems
);

// Update a list (requires ownership)
router.put(
    '/:id',
    requireAuth,
    validate([
        validationRules.id(),
        ...validators.list.create.map(rule => {
            // Make all fields optional for updates
            if (rule._context && rule._context.optional !== true) {
                return { ...rule, optional: () => rule.optional() };
            }
            return rule;
        })
    ]),
    verifyListOwnership,
    updateList
);

// Delete a list (requires ownership)
router.delete(
    '/:id',
    requireAuth,
    validate([validationRules.id()]),
    verifyListOwnership,
    deleteList
);

// Add an item to a list (requires modify access - ownership or public list)
router.post(
    '/:id/items',
    requireAuth,
    validate(validators.list.addItemToList),
    verifyListModifyAccess,
    addItemToList
);

// Remove an item from a list (requires ownership)
router.delete(
    '/:id/items/:listItemId',
    requireAuth,
    validate([
        validationRules.id(),
        param('listItemId').isInt({ gt: 0 }).withMessage('List item ID must be a positive integer')
    ]),
    verifyListOwnership,
    removeItemFromList
);

// Toggle list follow status (requires authentication)
router.post(
    '/:id/toggle-follow',
    requireAuth,
    validate([validationRules.id()]),
    toggleFollowList
);

export default router;