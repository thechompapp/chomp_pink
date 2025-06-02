// doof-backend/models/adminModel.js
// 
// ⚠️ LEGACY COMPATIBILITY WRAPPER ⚠️
// 
// This file maintains backward compatibility with existing code while
// delegating all functionality to the new modular admin model architecture.
// 
// The monolithic 1,620-line adminModel.js has been successfully refactored into:
// - AdminBaseModel: Resource configuration and utilities (~200 lines)
// - AdminQueryBuilder: Database query construction (~300 lines)
// - AdminResourceManager: CRUD operations (~300 lines)
// - AdminDataAnalyzer: Data cleanup and analysis (~400 lines)
// - AdminValidationModel: Validation and change application (~400 lines)
//
// Total: 5 focused, maintainable modules replacing 1 monolithic file
//

import { AdminModel } from './admin/index.js';

// Export all functions from the modular AdminModel for backward compatibility
export const {
  // Configuration
  resourceConfig,
  getResourceConfig,
  
  // Resource operations
  findAllResources,
  findResourceById,
  createResource,
  updateResource,
  deleteResource,
  bulkAddResources,
  checkExistingItems,
  
  // Analysis operations
  analyzeData,
  getChangesByIds,
  
  // Validation operations
  validateBulkData,
  applyChanges,
  rejectChanges,
  
  // Submission operations
  approveSubmission,
  rejectSubmission,
  
  // Utilities
  generateChangeId,
  formatPhoneNumber,
  formatWebsite,
  isValidResourceType,
  getSupportedResourceTypes,
  logAdminOperation
} = AdminModel;

// Default export for maximum compatibility
export default AdminModel; 