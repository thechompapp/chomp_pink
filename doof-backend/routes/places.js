// Filename: /root/doof-backend/routes/places.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Use namespace import for controller */
import express from 'express';
import * as placesController from '../controllers/placesController.js'; // Use namespace import
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth); // Apply auth to prevent key abuse

// Add routes that match the frontend API paths
router.get('/autocomplete', placesController.proxyAutocomplete);
router.get('/details', placesController.proxyDetails);

// Keep the original routes for backward compatibility
router.get('/proxy/autocomplete', placesController.proxyAutocomplete);
router.get('/proxy/details', placesController.proxyDetails);

export default router;