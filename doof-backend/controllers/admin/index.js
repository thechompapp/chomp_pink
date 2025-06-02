// doof-backend/controllers/admin/index.js

// Base utilities
export * from './adminBaseController.js';

// Resource-specific controllers
export * from './adminRestaurantController.js';
export * from './adminDishController.js';
export * from './adminUserController.js';
export * from './adminLocationController.js';
export * from './adminListController.js';
export * from './adminSubmissionController.js';
export * from './adminHashtagController.js';
export * from './adminSystemController.js';

// Generic operations controllers
export * from './adminBulkController.js';

// All legacy functions have been migrated to modular controllers
// This index provides a convenient single import point for all admin functionality 