/**
 * Enhanced Admin Service
 * 
 * Provides comprehensive admin panel functionality with:
 * - Optimized data fetching for all resource types
 * - Inline editing with field-specific validation
 * - Real-time error handling and feedback
 * - Proper CRUD operations with proper response handling
 * - Data transformation and normalization
 */

import httpClient from '@/services/http/httpClient';
import { handleApiResponse } from '@/utils/serviceHelpers';
import { logInfo, logError, logDebug, logWarn } from '@/utils/logger';

// Admin API endpoints configuration
const ADMIN_ENDPOINTS = {
  restaurants: '/admin/restaurants',
  dishes: '/admin/dishes', 
  users: '/admin/users',
  cities: '/admin/cities',
  neighborhoods: '/admin/neighborhoods',
  hashtags: '/admin/hashtags',
  restaurant_chains: '/admin/restaurant_chains',
  submissions: '/admin/submissions'
};

// Field validation rules
const VALIDATION_RULES = {
  restaurants: {
    name: { required: true, minLength: 2, maxLength: 100 },
    phone: { pattern: /^\+?[\d\s\-\(\)]+$/ },
    website: { pattern: /^https?:\/\/.+/ },
    price_range: { options: ['$', '$$', '$$$', '$$$$'] }
  },
  dishes: {
    name: { required: true, minLength: 2, maxLength: 100 },
    price: { type: 'number', min: 0, max: 1000 },
    restaurant_id: { required: true, type: 'number' }
  },
  users: {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    username: { required: true, minLength: 3, maxLength: 50 },
    full_name: { maxLength: 100 }
  },
  cities: {
    name: { required: true, minLength: 2, maxLength: 100 },
    state: { maxLength: 50 },
    country: { maxLength: 50 }
  },
  neighborhoods: {
    name: { required: true, minLength: 2, maxLength: 100 },
    city_id: { required: true, type: 'number' }
  },
  hashtags: {
    name: { required: true, minLength: 1, maxLength: 50, pattern: /^[a-zA-Z0-9_]+$/ }
  }
};

/**
 * Enhanced Admin Service
 */
export const enhancedAdminService = {
  
  /**
   * Fetch all data for admin panel with optimized loading
   */
  async fetchAllAdminData() {
    logInfo('[EnhancedAdminService] Fetching all admin data');
    
    try {
      const results = {};
      
      // Fetch all endpoints in parallel for better performance
      const promises = Object.entries(ADMIN_ENDPOINTS).map(async ([key, endpoint]) => {
        try {
          
          // Add specific parameters for neighborhoods to get all data (not just default 20)
          let requestUrl = endpoint;
          if (key === 'neighborhoods') {
            requestUrl = `${endpoint}?limit=1000`;
            logDebug(`[EnhancedAdminService] Using extended limit for neighborhoods: ${requestUrl}`);
          }
          
          const response = await httpClient.get(requestUrl);
          
          // Extract data from response
          let data = [];
          if (response?.data?.data && Array.isArray(response.data.data)) {
            data = response.data.data;
          } else if (Array.isArray(response?.data)) {
            data = response.data;
          } else if (response?.data) {
            data = response.data;
          }
          
          logDebug(`[EnhancedAdminService] Fetched ${key}:`, { count: Array.isArray(data) ? data.length : 'non-array' });
          
          // Extra verification for neighborhoods to ensure we got neighborhood ID 88
          if (key === 'neighborhoods') {
            const neighborhood88 = data.find(n => n.id === 88);
            if (neighborhood88) {
              logInfo(`[EnhancedAdminService] ✅ Found neighborhood ID 88: ${neighborhood88.name}`);
            } else {
              logError(`[EnhancedAdminService] ❌ Neighborhood ID 88 not found in ${data.length} neighborhoods`);
            }
          }
          
          return { key, data: Array.isArray(data) ? data : [] };
        } catch (error) {
          logError(`[EnhancedAdminService] Error fetching ${key}:`, error);
          return { key, data: [] };
        }
      });
      
      const responses = await Promise.all(promises);
      
      // Build results object
      responses.forEach(({ key, data }) => {
        results[key] = data;
      });
      
      logInfo('[EnhancedAdminService] All admin data fetched successfully', {
        counts: Object.entries(results).map(([key, data]) => `${key}: ${data.length}`).join(', ')
      });
      
      return results;
      
    } catch (error) {
      logError('[EnhancedAdminService] Error fetching admin data:', error);
      throw error;
    }
  },

  /**
   * Fetch data for a specific resource type
   */
  async fetchResourceData(resourceType) {
    logDebug(`[EnhancedAdminService] Fetching ${resourceType} data`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    try {
      const response = await httpClient.get(endpoint);
      
      // Extract and normalize data
      let data = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      }
      
      logDebug(`[EnhancedAdminService] Fetched ${resourceType}:`, { count: data.length });
      
      return data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error fetching ${resourceType}:`, error);
      throw error;
    }
  },

  /**
   * Validate field data based on resource type and field rules
   */
  validateField(resourceType, fieldName, value) {
    const rules = VALIDATION_RULES[resourceType]?.[fieldName];
    if (!rules) return { valid: true };
    
    const errors = [];
    
    // Required check
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }
    
    // Skip other validations if value is empty (and not required)
    if (!value || value.toString().trim() === '') {
      return { valid: true };
    }
    
    // Type check
    if (rules.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        errors.push(`${fieldName} must be a number`);
      } else {
        // Min/Max check for numbers
        if (rules.min !== undefined && numValue < rules.min) {
          errors.push(`${fieldName} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && numValue > rules.max) {
          errors.push(`${fieldName} must be at most ${rules.max}`);
        }
      }
    }
    
    // String length checks
    const strValue = value.toString();
    if (rules.minLength && strValue.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength && strValue.length > rules.maxLength) {
      errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
    }
    
    // Pattern check
    if (rules.pattern && !rules.pattern.test(strValue)) {
      errors.push(`${fieldName} format is invalid`);
    }
    
    // Options check
    if (rules.options && !rules.options.includes(value)) {
      errors.push(`${fieldName} must be one of: ${rules.options.join(', ')}`);
    }
    
    return { valid: errors.length === 0, errors };
  },

  /**
   * Validate complete resource data
   */
  validateResourceData(resourceType, data) {
    const errors = [];
    const rules = VALIDATION_RULES[resourceType];
    
    if (!rules) {
      return { valid: true, errors: [] };
    }
    
    // Check all required fields
    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      if (fieldRules.required && (!data[fieldName] || data[fieldName].toString().trim() === '')) {
        errors.push(`${fieldName} is required`);
      }
    });
    
    // Validate provided fields
    Object.entries(data).forEach(([fieldName, value]) => {
      const validation = this.validateField(resourceType, fieldName, value);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    });
    
    return { valid: errors.length === 0, errors };
  },

  /**
   * Update a specific resource
   */
  async updateResource(resourceType, resourceId, updatedData) {
    logDebug(`[EnhancedAdminService] Updating ${resourceType} ${resourceId}:`, updatedData);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    // Validate the update data
    const validationErrors = {};
    for (const [fieldName, value] of Object.entries(updatedData)) {
      const validation = this.validateField(resourceType, fieldName, value);
      if (!validation.valid) {
        validationErrors[fieldName] = validation.errors;
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      const error = new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
      error.isValidationError = true;
      error.validationErrors = validationErrors;
      throw error;
    }
    
    try {
      const response = await httpClient.put(`${endpoint}/${resourceId}`, updatedData);
      
      logInfo(`[EnhancedAdminService] Successfully updated ${resourceType} ${resourceId}`);
      return response.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error updating ${resourceType} ${resourceId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new resource
   */
  async createResource(resourceType, resourceData) {
    logDebug(`[EnhancedAdminService] Creating ${resourceType}:`, resourceData);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    // Validate the resource data
    const validationErrors = {};
    for (const [fieldName, value] of Object.entries(resourceData)) {
      const validation = this.validateField(resourceType, fieldName, value);
      if (!validation.valid) {
        validationErrors[fieldName] = validation.errors;
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      const error = new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
      error.isValidationError = true;
      error.validationErrors = validationErrors;
      throw error;
    }
    
    try {
      const response = await httpClient.post(endpoint, resourceData);
      
      logInfo(`[EnhancedAdminService] Successfully created ${resourceType}`);
      return response.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error creating ${resourceType}:`, error);
      throw error;
    }
  },

  /**
   * Delete a resource
   */
  async deleteResource(resourceType, resourceId) {
    logDebug(`[EnhancedAdminService] Deleting ${resourceType} ${resourceId}`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    try {
      const response = await httpClient.delete(`${endpoint}/${resourceId}`);
      
      logInfo(`[EnhancedAdminService] Successfully deleted ${resourceType} ${resourceId}`);
      return response.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error deleting ${resourceType} ${resourceId}:`, error);
      throw error;
    }
  },

  /**
   * Process submission (approve/reject)
   */
  async processSubmission(submissionId, action, data = {}) {
    logDebug(`[EnhancedAdminService] ${action} submission ${submissionId}`);
    
    try {
      const response = await httpClient.post(`/admin/submissions/${action}/${submissionId}`, data);
      
      logInfo(`[EnhancedAdminService] Successfully ${action}ed submission ${submissionId}`);
      return response.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error ${action}ing submission ${submissionId}:`, error);
      throw error;
    }
  },

  /**
   * Search resources with filters
   */
  async searchResources(resourceType, query, filters = {}) {
    logDebug(`[EnhancedAdminService] Searching ${resourceType} with query: ${query}`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    try {
      const response = await httpClient.get(endpoint, {
        params: {
          search: query,
          ...filters
        }
      });
      
      // Extract and normalize data
      let data = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response?.data)) {
        data = response.data;
      }
      
      logDebug(`[EnhancedAdminService] Search returned ${data.length} results for ${resourceType}`);
      return data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error searching ${resourceType}:`, error);
      throw error;
    }
  },

  /**
   * Validate import data from file
   */
  async validateImportData(resourceType, formData) {
    logDebug(`[EnhancedAdminService] Validating import data for ${resourceType}`);
    
    try {
      // For now, return a mock validation result
      // In a real implementation, this would send the file to the backend for validation
      const mockValidation = {
        valid: [
          { row: 1, data: { name: 'Sample Restaurant 1', city: 'NYC' } },
          { row: 2, data: { name: 'Sample Restaurant 2', city: 'LA' } }
        ],
        invalid: [
          { row: 3, errors: ['Name is required'], data: { city: 'Chicago' } }
        ],
        summary: {
          totalRows: 3,
          validRows: 2,
          invalidRows: 1
        }
      };
      
      logInfo(`[EnhancedAdminService] Validation completed: ${mockValidation.valid.length} valid, ${mockValidation.invalid.length} invalid`);
      return mockValidation;
    } catch (error) {
      logError(`[EnhancedAdminService] Error validating import data:`, error);
      throw error;
    }
  },

  /**
   * Bulk import validated data
   */
  async bulkImport(resourceType, validData, progressCallback) {
    logDebug(`[EnhancedAdminService] Starting bulk import of ${validData.length} ${resourceType} records`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    try {
      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      const totalBatches = Math.ceil(validData.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const batch = validData.slice(start, start + batchSize);
        
        try {
          const response = await httpClient.post(`${endpoint}/bulk`, { records: batch });
          results.success += batch.length;
          
          // Report progress
          if (progressCallback) {
            progressCallback({
              completed: Math.min((i + 1) * batchSize, validData.length),
              total: validData.length,
              batchResults: response.data
            });
          }
        } catch (error) {
          results.failed += batch.length;
          results.errors.push(`Batch ${i + 1}: ${error.message}`);
          logError(`[EnhancedAdminService] Error in batch ${i + 1}:`, error);
        }
      }
      
      logInfo(`[EnhancedAdminService] Bulk import completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      logError(`[EnhancedAdminService] Error during bulk import:`, error);
      throw error;
    }
  },

  /**
   * Batch update multiple resources
   */
  async batchUpdate(resourceType, updates, progressCallback) {
    logDebug(`[EnhancedAdminService] Starting batch update of ${updates.length} ${resourceType} records`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    try {
      // Process in smaller batches to maintain good performance
      const batchSize = 5;
      const totalBatches = Math.ceil(updates.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const batch = updates.slice(start, start + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (update) => {
          try {
            const { id, ...updateData } = update;
            
            await httpClient.put(`${endpoint}/${id}`, updateData);
            results.success++;
            
            logDebug(`[EnhancedAdminService] Successfully updated ${resourceType} ${id}`);
          } catch (error) {
            results.failed++;
            results.errors.push(`${resourceType} ${update.id}: ${error.message}`);
            logError(`[EnhancedAdminService] Error updating ${resourceType} ${update.id}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Report progress
        if (progressCallback) {
          progressCallback({
            completed: Math.min((i + 1) * batchSize, updates.length),
            total: updates.length
          });
        }
      }
      
      logInfo(`[EnhancedAdminService] Batch update completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      logError(`[EnhancedAdminService] Error during batch update:`, error);
      throw error;
    }
  },

  /**
   * Bulk add restaurants
   */
  async bulkAddRestaurants(resourceType, restaurants, progressCallback) {
    if (resourceType !== 'restaurants') {
      throw new Error('Bulk add is only supported for restaurants');
    }
    
    logInfo(`[EnhancedAdminService] Starting bulk add of ${restaurants.length} restaurants`);
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    try {
      // Process in batches
      const batchSize = 20;
      const totalBatches = Math.ceil(restaurants.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const batch = restaurants.slice(start, start + batchSize);
        
        try {
          const response = await httpClient.post('/admin/restaurants/bulk', {
            restaurants: batch
          });
          
          results.success += batch.length;
          
          // Report progress
          if (progressCallback) {
            progressCallback({
              completed: Math.min((i + 1) * batchSize, restaurants.length),
              total: restaurants.length,
              batchResults: response.data
            });
          }
        } catch (error) {
          results.failed += batch.length;
          results.errors.push(`Batch ${i + 1}: ${error.message}`);
          logError(`[EnhancedAdminService] Error in batch ${i + 1}:`, error);
        }
      }
      
      logInfo(`[EnhancedAdminService] Bulk add completed: ${results.success} success, ${results.failed} failed`);
      return results;
    } catch (error) {
      logError(`[EnhancedAdminService] Error during bulk add:`, error);
      throw error;
    }
  },

  /**
   * Bulk add restaurants from uploaded file
   */
  async bulkAddRestaurantsFromFile(resourceType, file, progressCallback) {
    if (resourceType !== 'restaurants') {
      throw new Error('File bulk add is only supported for restaurants');
    }
    
    logInfo(`[EnhancedAdminService] Starting bulk add from file: ${file.name}`);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceType', resourceType);
      
      const response = await httpClient.post('/admin/restaurants/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressCallback) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            progressCallback({
              uploadProgress: progress,
              completed: progressEvent.loaded,
              total: progressEvent.total
            });
          }
        }
      });
      
      return response.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error during bulk add from file:`, error);
      throw error;
    }
  }
};

export default enhancedAdminService;