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

// Legacy support - for backwards compatibility during transition
// Re-export selected functions from the main adminController until migration is complete
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} from '../adminController.js';

export {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
}; 