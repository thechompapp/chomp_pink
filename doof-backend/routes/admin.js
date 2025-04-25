// Filename: /root/doof-backend/routes/admin.js
/* REFACTORED: Convert to ES Modules (import/export) */
/* FIXED: Changed requireSuperuser import to default */
/* ADDED: validatePagination for GET /:resourceType */
/* FIXED: Removed validatePagination() call, used array directly */
import express from 'express';
import adminController from '../controllers/adminController.js'; // Use import, add .js
import { requireAuth } from '../middleware/auth.js'; // Use import, add .js
import requireSuperuser from '../middleware/requireSuperuser.js'; // Use DEFAULT import
import {
    validateAdminResourceParam,
    validateAdminResourceTypeParam,
    validateAdminUpdate,
    validateAdminCreate,
    validatePagination,
    handleValidationErrors
} from '../middleware/validators.js'; // Use import, add .js

// Import neighborhood admin routes
import adminNeighborhoodRoutes from './adminNeighborhoods.js'; // Use import, add .js

const router = express.Router();

// --- Middleware for all admin routes ---
// Ensure user is authenticated AND is a superuser for all admin panel access
router.use(requireAuth, requireSuperuser); // requireSuperuser is now correctly imported

// --- Specific Admin Resource Routes (Generic CRUD) ---

// GET all resources of a specific type
router.get(
    '/:resourceType',
    validateAdminResourceTypeParam, // Validate :resourceType param
    validatePagination, // Use array directly
    handleValidationErrors,
    adminController.getAllResources // Use controller object method
);

// GET a single resource by ID
router.get(
    '/:resourceType/:id',
    validateAdminResourceTypeParam,
    validateAdminResourceParam, // Validate :id param
    handleValidationErrors,
    adminController.getResourceById // Use controller object method
);

// CREATE a new resource
router.post(
    '/:resourceType',
    validateAdminResourceTypeParam,
    // validateAdminCreate, // Consider adding specific validation per resource type here or in controller
    handleValidationErrors,
    adminController.createResource // Use controller object method
);

// UPDATE a resource by ID
router.put(
    '/:resourceType/:id',
    validateAdminResourceTypeParam,
    validateAdminResourceParam,
    // validateAdminUpdate, // Consider adding specific validation per resource type here or in controller
    handleValidationErrors,
    adminController.updateResource // Use controller object method
);

// DELETE a resource by ID
router.delete(
    '/:resourceType/:id',
    validateAdminResourceTypeParam,
    validateAdminResourceParam,
    handleValidationErrors,
    adminController.deleteResource // Use controller object method
);

// --- Bulk Add Route ---
router.post(
    '/bulk-add/:resourceType', // e.g., /api/admin/bulk-add/restaurants
    validateAdminResourceTypeParam,
    handleValidationErrors, // Basic validation on type
    adminController.bulkAdd // Use controller object method
);

// --- Submission Review Routes ---
router.post(
    '/submissions/:id/approve',
    validateAdminResourceParam, // Validate submission :id
    handleValidationErrors,
    adminController.approveSubmission // Use controller object method
);

router.post(
    '/submissions/:id/reject',
    validateAdminResourceParam, // Validate submission :id
    handleValidationErrors,
    adminController.rejectSubmission // Use controller object method
);

// --- Mount Neighborhood Admin Routes ---
// Mounts routes defined in adminNeighborhoods.js under /api/admin/neighborhoods
router.use('/neighborhoods', adminNeighborhoodRoutes);

// --- Lookup Routes (Example for Neighborhoods) ---
router.post(
    '/lookup/neighborhoods', // Changed from GET to POST to handle potentially large array in body
    adminController.lookupNeighborhoods // Use controller object method
);

// Add other lookup routes if needed (e.g., /lookup/restaurants, /lookup/dishes)

export default router; // Use export default