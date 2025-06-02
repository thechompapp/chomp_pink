// doof-backend/routes/admin.js
import express from 'express';
import { requireAuth, requireSuperuser } from '../middleware/auth.js'; 

// Import modular controllers (replacing legacy adminController)
import {
  // System and base operations
  getAdminStats,
  getSystemStatus,
  getSystemLogs,
  clearSystemCache,
  healthCheck
} from '../controllers/admin/adminSystemController.js';

import {
  // Restaurant operations
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  bulkValidateRestaurants
} from '../controllers/admin/adminRestaurantController.js';

import {
  // Dish operations
  getDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  bulkValidateDishes
} from '../controllers/admin/adminDishController.js';

import {
  // User operations
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  promoteUser,
  bulkValidateUsers
} from '../controllers/admin/adminUserController.js';

import {
  // Location operations (cities, neighborhoods, autosuggest, validation only)
  getCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  getNeighborhoods,
  getNeighborhoodById,
  createNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
  getAutosuggestCities,
  getAutosuggestNeighborhoods,
  getAutosuggestNeighborhoodsByCity,
  bulkValidateCities,
  bulkValidateNeighborhoods
} from '../controllers/admin/adminLocationController.js';

import {
  // Hashtag and restaurant chain operations (validation only)
  getHashtags,
  createHashtag,
  updateHashtag,
  deleteHashtag,
  getRestaurantChains,
  createRestaurantChain,
  updateRestaurantChain,
  deleteRestaurantChain,
  bulkValidateHashtags,
  bulkValidateRestaurantChains
} from '../controllers/admin/adminHashtagController.js';

import {
  // List operations
  getLists,
  getListById,
  createList,
  updateList,
  deleteList,
  bulkValidateLists
} from '../controllers/admin/adminListController.js';

import {
  // Submission operations
  getSubmissions,
  getSubmissionById,
  approveSubmission,
  rejectSubmission
} from '../controllers/admin/adminSubmissionController.js';

import {
  // All bulk CRUD operations (add, delete, update, import)
  bulkAddRestaurants,
  bulkDeleteRestaurants,
  bulkUpdateRestaurants,
  importRestaurants,
  bulkAddDishes,
  bulkDeleteDishes,
  bulkUpdateDishes,
  importDishes,
  bulkAddUsers,
  bulkDeleteUsers,
  bulkUpdateUsers,
  importUsers,
  bulkAddCities,
  bulkDeleteCities,
  bulkUpdateCities,
  importCities,
  bulkAddNeighborhoods,
  bulkDeleteNeighborhoods,
  bulkUpdateNeighborhoods,
  importNeighborhoods,
  bulkAddHashtags,
  bulkDeleteHashtags,
  bulkUpdateHashtags,
  importHashtags,
  bulkAddRestaurantChains,
  bulkDeleteRestaurantChains,
  bulkUpdateRestaurantChains,
  importRestaurantChains,
  bulkAddLists,
  bulkDeleteLists,
  bulkUpdateLists,
  importLists
} from '../controllers/admin/adminBulkController.js';

// Other controllers remain the same
import * as cleanupController from '../controllers/cleanupController.js';
import * as chainController from '../controllers/chainController.js';

// Import unified location routes (city/neighborhood combined logic)
import adminLocationsRoutes from './adminLocations.js';

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

// Define admin routes using modular controllers

// Submission routes
router.get('/submissions', getSubmissions);
router.post('/submissions/approve/:id', approveSubmission);
router.post('/submissions/reject/:id', rejectSubmission);
router.get('/submissions/:id', getSubmissionById);

// BULK OPERATIONS (must come before single resource routes to avoid conflicts)
// Restaurant bulk operations
router.post('/restaurants/validate', bulkValidateRestaurants);
router.post('/restaurants/bulk', bulkAddRestaurants);
router.delete('/restaurants/bulk', bulkDeleteRestaurants);
router.put('/restaurants/bulk', bulkUpdateRestaurants);
router.post('/restaurants/import', importRestaurants);

// Dishes bulk operations
router.post('/dishes/validate', bulkValidateDishes);
router.post('/dishes/bulk', bulkAddDishes);
router.delete('/dishes/bulk', bulkDeleteDishes);
router.put('/dishes/bulk', bulkUpdateDishes);
router.post('/dishes/import', importDishes);

// Users bulk operations  
router.post('/users/validate', bulkValidateUsers);
router.post('/users/bulk', bulkAddUsers);
router.delete('/users/bulk', bulkDeleteUsers);
router.put('/users/bulk', bulkUpdateUsers);
router.post('/users/import', importUsers);

// Cities bulk operations
router.post('/cities/validate', bulkValidateCities);
router.post('/cities/bulk', bulkAddCities);
router.delete('/cities/bulk', bulkDeleteCities);
router.put('/cities/bulk', bulkUpdateCities);
router.post('/cities/import', importCities);

// Neighborhoods bulk operations
router.post('/neighborhoods/validate', bulkValidateNeighborhoods);
router.post('/neighborhoods/bulk', bulkAddNeighborhoods);
router.delete('/neighborhoods/bulk', bulkDeleteNeighborhoods);
router.put('/neighborhoods/bulk', bulkUpdateNeighborhoods);
router.post('/neighborhoods/import', importNeighborhoods);

// Hashtags bulk operations
router.post('/hashtags/validate', bulkValidateHashtags);
router.post('/hashtags/bulk', bulkAddHashtags);
router.delete('/hashtags/bulk', bulkDeleteHashtags);
router.put('/hashtags/bulk', bulkUpdateHashtags);
router.post('/hashtags/import', importHashtags);

// Restaurant chains bulk operations
router.post('/restaurant_chains/validate', bulkValidateRestaurantChains);
router.post('/restaurant_chains/bulk', bulkAddRestaurantChains);
router.delete('/restaurant_chains/bulk', bulkDeleteRestaurantChains);
router.put('/restaurant_chains/bulk', bulkUpdateRestaurantChains);
router.post('/restaurant_chains/import', importRestaurantChains);

// Lists bulk operations
router.post('/lists/validate', bulkValidateLists);
router.post('/lists/bulk', bulkAddLists);
router.delete('/lists/bulk', bulkDeleteLists);
router.put('/lists/bulk', bulkUpdateLists);
router.post('/lists/import', importLists);

// SINGLE RESOURCE OPERATIONS
// Restaurant routes
router.get('/restaurants', getRestaurants);
router.get('/restaurants/:id', getRestaurantById);
router.post('/restaurants', createRestaurant);
router.put('/restaurants/:id', updateRestaurant);
router.delete('/restaurants/:id', deleteRestaurant);

// Dish routes
router.get('/dishes', getDishes);
router.get('/dishes/:id', getDishById);
router.post('/dishes', createDish);
router.put('/dishes/:id', updateDish);
router.delete('/dishes/:id', deleteDish);

// User routes
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/promote/:id', promoteUser);

// City routes
router.get('/cities', getCities);
router.post('/cities', createCity);
router.put('/cities/:id', updateCity);
router.delete('/cities/:id', deleteCity);

// Neighborhood routes
router.get('/neighborhoods', getNeighborhoods);
router.post('/neighborhoods', createNeighborhood);
router.put('/neighborhoods/:id', updateNeighborhood);
router.delete('/neighborhoods/:id', deleteNeighborhood);

// Unified location management (enhanced city/neighborhood combined functionality)
router.use('/locations', adminLocationsRoutes);

// Hashtag routes
router.get('/hashtags', getHashtags);
router.post('/hashtags', createHashtag);
router.put('/hashtags/:id', updateHashtag);
router.delete('/hashtags/:id', deleteHashtag);

// Restaurant chain routes
router.get('/restaurant_chains', getRestaurantChains);
router.post('/restaurant_chains', createRestaurantChain);
router.put('/restaurant_chains/:id', updateRestaurantChain);
router.delete('/restaurant_chains/:id', deleteRestaurantChain);

// List routes
router.get('/lists', getLists);
router.get('/lists/:id', getListById);
router.post('/lists', createList);
router.put('/lists/:id', updateList);
router.delete('/lists/:id', deleteList);

// Enhanced chain management routes
router.get('/chains/scan', chainController.scanForChains);
router.get('/chains/stats', chainController.getChainStats);
router.get('/chains', chainController.getAllChains);
router.post('/chains', chainController.createChain);
router.put('/chains/:id/remove-restaurant', chainController.removeRestaurantFromChain);

// Autosuggest endpoints for inline editing
router.get('/autosuggest/cities', getAutosuggestCities);
router.get('/autosuggest/neighborhoods', getAutosuggestNeighborhoods);
router.get('/autosuggest/neighborhoods/:cityId', getAutosuggestNeighborhoodsByCity);

// Data cleanup endpoints
router.post('/cleanup/:resourceType/analyze', cleanupController.analyzeData);
router.post('/cleanup/:resourceType/apply', cleanupController.applyFixes);
router.get('/cleanup/status/:jobId', cleanupController.getStatus);

// System administrative routes
router.get('/stats', getAdminStats);
router.get('/system/status', getSystemStatus);
router.get('/system/logs', getSystemLogs);
router.post('/system/clear-cache', clearSystemCache);

// Health check endpoint (unprotected)
router.get('/cleanup/health', healthCheck);

export default router;