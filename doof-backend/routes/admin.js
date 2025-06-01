// doof-backend/routes/admin.js
import express from 'express';
import { requireAuth, requireSuperuser } from '../middleware/auth.js'; 
import * as adminController from '../controllers/adminController.js';
import * as cleanupController from '../controllers/cleanupController.js';
import * as chainController from '../controllers/chainController.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(requireAuth);

// Require superuser for all admin routes except health check
router.use((req, res, next) => {
  // Skip auth for health check endpoint
  if (req.path === '/cleanup/health') {
    return next();
  }
  
  // Check if user is a superuser (check both account_type and role for backward compatibility)
  const isSuperuser = req.user && (
    req.user.account_type === 'superuser' || 
    req.user.role === 'superuser' ||
    (req.user.user && (req.user.user.account_type === 'superuser' || req.user.user.role === 'superuser'))
  );
  
  if (!isSuperuser) {
    console.log('Access denied. User details:', {
      user: req.user,
      hasAccountType: !!req.user?.account_type,
      hasRole: !!req.user?.role,
      accountType: req.user?.account_type,
      role: req.user?.role,
      isSuperuser
    });
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied: Superuser privileges required.',
      details: {
        userId: req.user?.id,
        username: req.user?.username,
        accountType: req.user?.account_type,
        role: req.user?.role,
        hasSuperuserRole: req.user?.role === 'superuser',
        hasSuperuserAccountType: req.user?.account_type === 'superuser'
      }
    });
  }
  
  // User is authorized, log the access
  console.log(`[Admin Route] Superuser access granted to ${req.path} for user: ${req.user.username} (${req.user.id})`);
  next();
});

// Define admin routes
router.get('/submissions', adminController.getSubmissions);
router.post('/submissions/approve/:id', adminController.approveSubmission);
router.post('/submissions/reject/:id', adminController.rejectSubmission);
router.get('/submissions/:id', adminController.getSubmissionById);

// BULK OPERATIONS (must come before single resource routes to avoid conflicts)
router.post('/restaurants/bulk', adminController.bulkAddRestaurants);
router.delete('/restaurants/bulk', adminController.bulkDeleteRestaurants);
router.put('/restaurants/bulk', adminController.bulkUpdateRestaurants);
router.post('/restaurants/import', adminController.importRestaurants);

router.delete('/dishes/bulk', adminController.bulkDeleteDishes);
router.put('/dishes/bulk', adminController.bulkUpdateDishes);
router.post('/dishes/bulk', adminController.bulkAddDishes);
router.post('/dishes/import', adminController.importDishes);

router.delete('/users/bulk', adminController.bulkDeleteUsers);
router.put('/users/bulk', adminController.bulkUpdateUsers);
router.post('/users/bulk', adminController.bulkAddUsers);
router.post('/users/import', adminController.importUsers);

router.delete('/cities/bulk', adminController.bulkDeleteCities);
router.put('/cities/bulk', adminController.bulkUpdateCities);
router.post('/cities/bulk', adminController.bulkAddCities);
router.post('/cities/import', adminController.importCities);

router.delete('/neighborhoods/bulk', adminController.bulkDeleteNeighborhoods);
router.put('/neighborhoods/bulk', adminController.bulkUpdateNeighborhoods);
router.post('/neighborhoods/bulk', adminController.bulkAddNeighborhoods);
router.post('/neighborhoods/import', adminController.importNeighborhoods);

router.delete('/hashtags/bulk', adminController.bulkDeleteHashtags);
router.put('/hashtags/bulk', adminController.bulkUpdateHashtags);
router.post('/hashtags/bulk', adminController.bulkAddHashtags);
router.post('/hashtags/import', adminController.importHashtags);

router.delete('/restaurant_chains/bulk', adminController.bulkDeleteRestaurantChains);
router.put('/restaurant_chains/bulk', adminController.bulkUpdateRestaurantChains);
router.post('/restaurant_chains/bulk', adminController.bulkAddRestaurantChains);
router.post('/restaurant_chains/import', adminController.importRestaurantChains);

// SINGLE RESOURCE OPERATIONS
router.get('/restaurants', adminController.getRestaurants);
router.get('/restaurants/:id', adminController.getRestaurantById);
router.post('/restaurants', adminController.createRestaurant);
router.put('/restaurants/:id', adminController.updateRestaurant);
router.delete('/restaurants/:id', adminController.deleteRestaurant);

router.get('/dishes', adminController.getDishes);
router.get('/dishes/:id', adminController.getDishById);
router.post('/dishes', adminController.createDish);
router.put('/dishes/:id', adminController.updateDish);
router.delete('/dishes/:id', adminController.deleteDish);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/promote/:id', adminController.promoteUser);

router.get('/cities', adminController.getCities);
router.post('/cities', adminController.createCity);
router.put('/cities/:id', adminController.updateCity);
router.delete('/cities/:id', adminController.deleteCity);

router.get('/neighborhoods', adminController.getNeighborhoods);
router.post('/neighborhoods', adminController.createNeighborhood);
router.put('/neighborhoods/:id', adminController.updateNeighborhood);
router.delete('/neighborhoods/:id', adminController.deleteNeighborhood);

router.get('/hashtags', adminController.getHashtags);
router.post('/hashtags', adminController.createHashtag);
router.put('/hashtags/:id', adminController.updateHashtag);
router.delete('/hashtags/:id', adminController.deleteHashtag);

router.get('/restaurant_chains', adminController.getRestaurantChains);
router.post('/restaurant_chains', adminController.createRestaurantChain);
router.put('/restaurant_chains/:id', adminController.updateRestaurantChain);
router.delete('/restaurant_chains/:id', adminController.deleteRestaurantChain);

// Enhanced chain management routes
router.get('/chains/scan', chainController.scanForChains);
router.get('/chains/stats', chainController.getChainStats);
router.get('/chains', chainController.getAllChains);
router.post('/chains', chainController.createChain);
router.put('/chains/:id/remove-restaurant', chainController.removeRestaurantFromChain);

// Autosuggest endpoints for inline editing
router.get('/autosuggest/cities', adminController.getAutosuggestCities);
router.get('/autosuggest/neighborhoods', adminController.getAutosuggestNeighborhoods);
router.get('/autosuggest/neighborhoods/:cityId', adminController.getAutosuggestNeighborhoodsByCity);

// Data cleanup endpoints
router.post('/cleanup/:resourceType/analyze', cleanupController.analyzeData);
router.post('/cleanup/:resourceType/apply', cleanupController.applyFixes);
router.get('/cleanup/status/:jobId', cleanupController.getStatus);

// System administrative routes
router.get('/system/status', adminController.getSystemStatus);
router.get('/system/logs', adminController.getSystemLogs);
router.post('/system/clear-cache', adminController.clearSystemCache);

// Health check endpoint (unprotected)
router.get('/cleanup/health', adminController.healthCheck);

export default router;