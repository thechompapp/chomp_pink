/**
 * Admin Models - Modular Architecture
 * 
 * This module provides a clean, organized approach to admin model functionality
 * by splitting the monolithic adminModel.js into focused, maintainable components.
 * 
 * Architecture:
 * - AdminBaseModel: Resource configuration, utilities, and shared functions
 * - AdminQueryBuilder: Database query construction and execution
 * - AdminResourceManager: Generic CRUD operations for all resources
 * - AdminDataAnalyzer: Data cleanup and analysis functionality
 * - AdminValidationModel: Validation rules and change application
 */

// Base utilities and configuration
export {
  resourceConfig,
  getResourceConfig,
  generateChangeId,
  formatPhoneNumber,
  formatWebsite,
  isValidResourceType,
  getSupportedResourceTypes,
  createAdminModelError,
  logAdminOperation,
  default as AdminBaseModel
} from './AdminBaseModel.js';

// Query building and execution
export {
  buildFindAllQuery,
  buildWhereClause,
  buildFindByIdQuery,
  buildCreateQuery,
  buildUpdateQuery,
  buildDeleteQuery,
  buildExistenceCheckQuery,
  buildLookupQuery,
  buildZipLookupQuery,
  executeQuery,
  default as AdminQueryBuilder
} from './AdminQueryBuilder.js';

// Resource management operations
export {
  findAllResources,
  findResourceById,
  createResource,
  updateResource,
  deleteResource,
  bulkAddResources,
  checkExistingItems,
  getLookupData,
  default as AdminResourceManager
} from './AdminResourceManager.js';

// Data analysis and cleanup
export {
  analyzeData,
  getChangesByIds,
  default as AdminDataAnalyzer
} from './AdminDataAnalyzer.js';

// Validation and change management
export {
  applyChanges,
  rejectChanges,
  validateBulkData,
  approveSubmission,
  rejectSubmission,
  default as AdminValidationModel
} from './AdminValidationModel.js';

/**
 * Convenient grouped exports for specific use cases
 */

// Import for grouped exports
import {
  findAllResources,
  findResourceById,
  createResource,
  updateResource,
  deleteResource,
  bulkAddResources,
  checkExistingItems
} from './AdminResourceManager.js';

import {
  validateBulkData,
  applyChanges,
  rejectChanges,
  approveSubmission,
  rejectSubmission
} from './AdminValidationModel.js';

import {
  analyzeData,
  getChangesByIds
} from './AdminDataAnalyzer.js';

import {
  resourceConfig,
  getResourceConfig,
  generateChangeId,
  formatPhoneNumber,
  formatWebsite,
  isValidResourceType,
  getSupportedResourceTypes,
  logAdminOperation
} from './AdminBaseModel.js';

// All CRUD operations
export const AdminCRUD = {
  findAllResources,
  findResourceById,
  createResource,
  updateResource,
  deleteResource,
  bulkAddResources,
  checkExistingItems
};

// All validation operations
export const AdminValidation = {
  validateBulkData,
  applyChanges,
  rejectChanges,
  approveSubmission,
  rejectSubmission
};

// All analysis operations
export const AdminAnalysis = {
  analyzeData,
  getChangesByIds
};

// All utility operations
export const AdminUtils = {
  getResourceConfig,
  generateChangeId,
  formatPhoneNumber,
  formatWebsite,
  isValidResourceType,
  getSupportedResourceTypes,
  logAdminOperation
};

/**
 * Complete admin model interface for backward compatibility
 * This provides the same interface as the legacy adminModel.js
 */
export const AdminModel = {
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
};

// Default export for easy importing
export default AdminModel; 