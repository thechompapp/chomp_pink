// doof-backend/routes/admin.js
import express from 'express';
import { requireAuth, requireSuperuser } from '../middleware/auth.js'; // Correct named imports
import * as adminController from '../controllers/adminController.js'; // Namespace import

const router = express.Router();

// Secure all admin routes
router.use(requireAuth, requireSuperuser);

// Generic Resource Management Routes
router.get('/resources/:resourceType', adminController.getAllResources);
router.get('/resources/:resourceType/:id', adminController.getResourceById);
router.post('/resources/:resourceType', adminController.createResource);
router.put('/resources/:resourceType/:id', adminController.updateResource);
router.delete('/resources/:resourceType/:id', adminController.deleteResource);

// Submission Management
router.get('/submissions', (req, res) => {
    req.params.resourceType = 'submissions'; // Ensure resourceType is set for generic handler
    adminController.getAllResources(req, res);
});
router.post('/submissions/:submissionId/approve', adminController.approveSubmission);
router.post('/submissions/:submissionId/reject', adminController.rejectSubmission);

// Bulk Operations
router.post('/bulk/:resourceType', adminController.bulkAddResources);

// Direct routes for specific resources to match frontend API calls
router.get('/restaurants', (req, res) => {
    req.params.resourceType = 'restaurants';
    adminController.getAllResources(req, res);
});

router.get('/dishes', (req, res) => {
    req.params.resourceType = 'dishes';
    adminController.getAllResources(req, res);
});

router.get('/users', (req, res) => {
    req.params.resourceType = 'users';
    adminController.getAllResources(req, res);
});

router.get('/cities', (req, res) => {
    req.params.resourceType = 'cities';
    adminController.getAllResources(req, res);
});

router.get('/neighborhoods', (req, res) => {
    req.params.resourceType = 'neighborhoods';
    adminController.getAllResources(req, res);
});

router.get('/hashtags', (req, res) => {
    req.params.resourceType = 'hashtags';
    adminController.getAllResources(req, res);
});

router.get('/restaurant_chains', (req, res) => {
    req.params.resourceType = 'restaurant_chains';
    adminController.getAllResources(req, res);
});

export default router;