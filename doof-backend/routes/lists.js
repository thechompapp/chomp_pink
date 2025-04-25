// Filename: /root/doof-backend/routes/lists.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
/* FIXED: Changed validatePaginationQuery to validatePagination */
/* FIXED: Removed validatePagination() call, used array directly */
import express from 'express';
import * as listController from '../controllers/listController.js'; // Use namespace import
import { requireAuth } from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import {
    validateList, validateAddItemToList, validateIdParam, validateRemoveListItem, handleValidationErrors, validatePagination
} from '../middleware/validators.js';

const router = express.Router();

router.get('/', requireAuth, validatePagination, handleValidationErrors, listController.getUserLists);
router.post('/', requireAuth, validateList, handleValidationErrors, listController.createList);
router.get('/:id', validateIdParam('id'), handleValidationErrors, optionalAuthMiddleware, listController.getListDetails);
router.put('/:id', requireAuth, validateIdParam('id'), validateList, handleValidationErrors, listController.updateList);
router.delete('/:id', requireAuth, validateIdParam('id'), handleValidationErrors, listController.deleteList);
router.post('/:id/items', requireAuth, validateAddItemToList, handleValidationErrors, listController.addItemToList);
router.delete('/:id/items/:listItemId', requireAuth, validateRemoveListItem, handleValidationErrors, listController.removeItemFromList);
router.post('/:id/follow', requireAuth, validateIdParam('id'), handleValidationErrors, listController.toggleFollowList);

export default router;