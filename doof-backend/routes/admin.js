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

export default router;