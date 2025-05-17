// doof-backend/routes/admin.js
import express from 'express';
import { optionalAuth, requireSuperuser } from '../middleware/auth.js'; 
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Apply optional auth to all routes (will set req.user if token is valid)
router.use(optionalAuth);

// Require superuser for all admin routes except health check
router.use((req, res, next) => {
  // Skip auth for health check endpoint
  if (req.path === '/cleanup/health') {
    return next();
  }
  
  // Development mode bypass - check for special headers
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasBypassHeader = req.headers['x-bypass-auth'] === 'true';
  const hasSuperuserHeader = req.headers['x-superuser-override'] === 'true';
  const hasAdminHeader = req.headers['x-admin-access'] === 'true';
  
  // Allow access in development mode with bypass headers
  if (isDevelopment && (hasBypassHeader || hasSuperuserHeader || hasAdminHeader)) {
    console.log('[Admin Route] Development mode bypass authentication enabled');
    // Set a mock superuser for the request
    req.user = {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      account_type: 'superuser',
      role: 'admin'
    };
    return next();
  }
  
  // Standard production check - user must be authenticated and a superuser
  if (!req.user || req.user.account_type !== 'superuser') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Superuser privileges required.' 
    });
  }
  
  next();
});

// Data Cleanup Routes
router.get('/cleanup/health', adminController.getCleanupApiHealth); // New health endpoint
router.get('/cleanup/analyze/:resourceType', adminController.analyzeData);
router.post('/cleanup/apply/:resourceType', adminController.applyChanges);
router.post('/cleanup/reject/:resourceType', adminController.rejectChanges);

// Generic Resource Management Routes
router.get('/resources/:resourceType', adminController.getAllResources);
router.get('/resources/:resourceType/:id', adminController.getResourceById);
router.post('/resources/:resourceType', adminController.createResource);
router.put('/resources/:resourceType/:id', adminController.updateResource);
router.delete('/resources/:resourceType/:id', adminController.deleteResource);

// Submission Management
// Using the generic resource route for GET, but keeping specific POST for approve/reject
router.get('/submissions', (req, res) => {
    req.params.resourceType = 'submissions';
    adminController.getAllResources(req, res);
});
router.post('/submissions/:submissionId/approve', adminController.approveSubmission);
router.post('/submissions/:submissionId/reject', adminController.rejectSubmission);

// Bulk Operations
router.post('/bulk/:resourceType', adminController.bulkAddResources);

// Check for existing items before bulk add (moved to use resourceType in path)
router.post('/check-existing/:resourceType', adminController.checkExistingItems);


// Optional: Direct routes for specific common resources (can be removed if /resources/:resourceType is always used)
// These are helpful if frontend code has hardcoded paths.
const directResourceRoutes = ['restaurants', 'dishes', 'users', 'cities', 'neighborhoods', 'hashtags', 'lists', 'restaurant_chains', 'listitems'];
directResourceRoutes.forEach(resource => {
    router.get(`/${resource}`, (req, res) => {
        req.params.resourceType = resource;
        adminController.getAllResources(req, res);
    });
     router.get(`/${resource}/:id`, (req, res) => {
        req.params.resourceType = resource;
        adminController.getResourceById(req, res);
    });
    router.post(`/${resource}`, (req, res) => {
        req.params.resourceType = resource;
        adminController.createResource(req, res);
    });
    router.put(`/${resource}/:id`, (req, res) => {
        req.params.resourceType = resource;
        adminController.updateResource(req, res);
    });
    router.delete(`/${resource}/:id`, (req, res) => {
        req.params.resourceType = resource;
        adminController.deleteResource(req, res);
    });
});


export default router;