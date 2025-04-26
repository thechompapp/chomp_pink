/* doof-backend/routes/lists.js */
import express from 'express';
import {
  validateGetUserLists,
  validateGetListPreviewItems,
  validateAddItemToList,
  getUserLists,
  getListPreviewItems,
  getListItems,
  getListDetails,
  createList,
  updateList,
  deleteList,
  addItemToList,
  removeItemFromList,
  toggleFollowList,
} from '../controllers/listController.js';
import { requireAuth, verifyListOwnership } from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Fix: Use default import
import { handleValidationErrors } from '../middleware/validators.js';

const router = express.Router();

router.get('/', optionalAuthMiddleware, validateGetUserLists, handleValidationErrors, getUserLists);
router.get('/previewbyid/:id', optionalAuthMiddleware, validateGetListPreviewItems, handleValidationErrors, getListPreviewItems);
router.get('/:id', optionalAuthMiddleware, getListDetails);
router.post('/', requireAuth, createList);
router.put('/:id', requireAuth, updateList);
router.delete('/:id', requireAuth, deleteList);
router.post('/:id/items', requireAuth, verifyListOwnership, validateAddItemToList, handleValidationErrors, addItemToList);
router.delete('/:id/items/:itemId', requireAuth, removeItemFromList);
router.post('/:id/follow', requireAuth, toggleFollowList);
router.get('/:id/items', optionalAuthMiddleware, validateGetListPreviewItems, handleValidationErrors, getListItems);

export default router;