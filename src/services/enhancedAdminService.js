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
import offlineModeGuard from '@/utils/offlineModeGuard';

// Admin API endpoints configuration
const ADMIN_ENDPOINTS = {
  restaurants: '/admin/restaurants',
  dishes: '/admin/dishes', 
  users: '/admin/users',
  cities: '/admin/cities',
  neighborhoods: '/admin/neighborhoods',
  hashtags: '/admin/hashtags',
  restaurant_chains: '/admin/restaurant_chains',
  submissions: '/admin/submissions',
  lists: '/admin/lists'
};

// Field validation rules
const VALIDATION_RULES = {
  restaurants: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    description: { type: 'string', required: false, maxLength: 1000 },
    cuisine: { type: 'string', required: false, maxLength: 100 },
    location: { type: 'string', required: false, maxLength: 200 },
    city_name: { type: 'string', required: false, maxLength: 100 },
    neighborhood_name: { type: 'string', required: false, maxLength: 100 },
    hashtags: { type: 'array', required: false }
  },
  dishes: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    description: { type: 'string', required: false, maxLength: 1000 },
    cuisine: { type: 'string', required: false, maxLength: 100 },
    restaurant_id: { type: 'number', required: false, min: 1 },
    hashtags: { type: 'array', required: false }
  },
  lists: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    description: { type: 'string', required: false, maxLength: 500 },
    list_type: { type: 'string', required: true, enum: ['restaurant', 'dish'] },
    is_public: { type: 'boolean', required: false, default: true },
    is_pinned: { type: 'boolean', required: false, default: false }
  },
  users: {
    username: { type: 'string', required: true, minLength: 3, maxLength: 50 },
    email: { type: 'email', required: true, maxLength: 255 },
    role: { type: 'enum', required: false, values: ['user', 'admin', 'superuser'] }
  },
  cities: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    state: { type: 'string', required: false, maxLength: 50 },
    country: { type: 'string', required: false, maxLength: 50 }
  },
  neighborhoods: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    city_name: { type: 'string', required: true, maxLength: 100 }
  },
  hashtags: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 50 }
  },
  restaurant_chains: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 200 },
    description: { type: 'string', required: false, maxLength: 1000 },
    website: { type: 'string', required: false, maxLength: 255 }
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
   * Fetch all neighborhoods in a hierarchical structure.
   */
  async fetchAllNeighborhoods() {
    logInfo('[EnhancedAdminService] Fetching all neighborhoods');
    try {
      const response = await httpClient.get('/neighborhoods');
      return response.data;
    } catch (error) {
      logError('[EnhancedAdminService] Error fetching neighborhoods:', error);
      throw error;
    }
  },

  /**
   * Fetch data for a specific resource type with enhanced error handling
   */
  async fetchResourceData(resourceType) {
    logDebug(`[EnhancedAdminService] Fetching ${resourceType} data`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    try {
      // Check if httpClient is available
      if (!httpClient) {
        throw new Error('HTTP client is not available');
      }

      // Use longer timeout for admin requests
      const response = await httpClient.get(endpoint, {
        timeout: 45000, // 45 seconds for admin data
        _allowOffline: false,
        _retryCount: 2
      });
      
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
      
      // Handle specific error types
      if (error.message?.includes('HTTP client is not available')) {
        throw new Error(`Service unavailable. Please refresh the page and try again.`);
      } else if (error.message?.includes('Cannot make network requests in offline mode')) {
        // Clear offline mode using the guard and try again
        offlineModeGuard.clearOfflineModeFlags();
        logWarn(`[EnhancedAdminService] Cleared offline mode using guard and retrying ${resourceType}`);
        
        try {
          const retryResponse = await httpClient.get(endpoint, {
            timeout: 30000,
            _allowOffline: false
          });
          
          let retryData = [];
          if (retryResponse?.data?.data && Array.isArray(retryResponse.data.data)) {
            retryData = retryResponse.data.data;
          } else if (Array.isArray(retryResponse?.data)) {
            retryData = retryResponse.data;
          }
          
          logDebug(`[EnhancedAdminService] Retry successful for ${resourceType}:`, { count: retryData.length });
          return retryData;
        } catch (retryError) {
          logError(`[EnhancedAdminService] Retry failed for ${resourceType}:`, retryError);
          throw new Error(`Unable to load ${resourceType}. Please check your connection and try again.`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(`Request timeout loading ${resourceType}. Please try again.`);
      } else if (error.isOffline) {
        throw new Error(`Network connection unavailable. Please check your connection and try again.`);
      } else if (error.response?.status === 500) {
        throw new Error(`Server error loading ${resourceType}. Please try again later.`);
      }
      
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
  validateResourceData(resourceType, records) {
    const rules = VALIDATION_RULES[resourceType] || {};
    const valid = [];
    const invalid = [];
    const warnings = [];
    
    records.forEach((record, index) => {
      const errors = [];
      const recordWarnings = [];
      
      // Validate each field
      Object.entries(rules).forEach(([field, fieldRules]) => {
        const value = record[field];
        const validation = this.validateField(resourceType, field, value);
        
        if (!validation.valid) {
          errors.push(...(validation.errors || [`${field} is invalid`]));
        }
      });
      
      // Check for missing required fields
      const requiredFields = Object.entries(rules)
        .filter(([_, fieldRules]) => fieldRules.required)
        .map(([field]) => field);
      
      requiredFields.forEach(field => {
        if (!record[field] || record[field].toString().trim() === '') {
          errors.push(`${field} is required`);
        }
      });
      
      // Resource-specific validations
      if (resourceType === 'dishes' && record.restaurant_id) {
        const restaurantId = parseInt(record.restaurant_id);
        if (isNaN(restaurantId)) {
          errors.push('restaurant_id must be a valid number');
        }
      }
      
      if (resourceType === 'neighborhoods' && record.city_id) {
        const cityId = parseInt(record.city_id);
        if (isNaN(cityId)) {
          errors.push('city_id must be a valid number');
        }
      }
      
      if (errors.length === 0) {
        valid.push({
          row: record.row || index + 1,
          data: record
        });
      } else {
        invalid.push({
          row: record.row || index + 1,
          errors,
          data: record
        });
      }
      
      if (recordWarnings.length > 0) {
        warnings.push({
          row: record.row || index + 1,
          warnings: recordWarnings
        });
      }
    });
    
    const summary = [
      `Total records: ${records.length}`,
      `Valid records: ${valid.length}`,
      `Invalid records: ${invalid.length}`,
      `Records with warnings: ${warnings.length}`
    ];
    
    return {
      valid,
      invalid,
      warnings,
      summary
    };
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
      // Check if httpClient is available
      if (!httpClient) {
        throw new Error('HTTP client is not available');
      }

      const response = await httpClient.get(endpoint, {
        params: {
          search: query,
          ...filters
        },
        timeout: 30000, // 30 seconds for search
        _allowOffline: false
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
      
      // Handle specific error types similar to fetchResourceData
      if (error.message?.includes('HTTP client is not available')) {
        throw new Error(`Service unavailable. Please refresh the page and try again.`);
      } else if (error.message?.includes('Cannot make network requests in offline mode')) {
        // Clear offline mode using the guard and try simple fetch instead
        offlineModeGuard.clearOfflineModeFlags();
        logWarn(`[EnhancedAdminService] Cleared offline mode using guard, falling back to basic fetch for ${resourceType}`);
        return this.fetchResourceData(resourceType);
      }
      
      throw error;
    }
  },

  /**
   * Enhanced validate import data from file (real implementation)
   */
  async validateImportData(resourceType, formData) {
    logDebug(`[EnhancedAdminService] Validating import data for ${resourceType}`);
    
    try {
      // Extract file from formData
      const file = formData.get('file');
      if (!file) {
        throw new Error('No file provided');
      }
      
      const text = await file.text();
      let records = [];
      
      // Parse based on file type
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        records = JSON.parse(text);
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // Basic CSV parsing
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        records = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const record = { row: index + 2 }; // Row number in spreadsheet
          headers.forEach((header, i) => {
            record[header] = values[i] || '';
          });
          return record;
        });
      } else {
        throw new Error('Unsupported file type. Please use CSV or JSON files.');
      }
      
      if (!Array.isArray(records)) {
        throw new Error('File content must be an array of records');
      }
      
      // Validate records
      const validation = this.validateResourceData(resourceType, records);
      
      logInfo(`[EnhancedAdminService] Validation completed: ${validation.valid.length} valid, ${validation.invalid.length} invalid`);
      return validation;
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
    
    try {
      // Use the new bulk update endpoint
      const response = await httpClient.put(`${endpoint}/bulk`, { updates });
      
      logInfo(`[EnhancedAdminService] Bulk update completed: ${response.data.data.success} success, ${response.data.data.failed} failed`);
      
      if (progressCallback) {
        progressCallback(100);
      }
      
      return response.data.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error during bulk update:`, error);
      throw error;
    }
  },

  /**
   * Bulk delete multiple resources
   */
  async bulkDelete(resourceType, ids, progressCallback) {
    logDebug(`[EnhancedAdminService] Starting bulk delete of ${ids.length} ${resourceType} records`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    try {
      // FIXED: Use the axios() method with explicit config instead of httpClient.delete() 
      // This ensures the data is properly sent in the request body for DELETE requests
      const response = await httpClient({
        method: 'DELETE',
        url: `${endpoint}/bulk`,
        data: { ids },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      logInfo(`[EnhancedAdminService] Bulk delete completed: ${response.data.data.success} deleted, ${response.data.data.failed} failed`);
      
      if (progressCallback) {
        progressCallback(100);
      }
      
      return response.data.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error during bulk delete:`, error);
      throw error;
    }
  },

  /**
   * Bulk validate resources (parse and resolve data without creating)
   */
  async bulkValidateResources(resourceType, records, progressCallback) {
    logDebug(`[EnhancedAdminService] Starting bulk validation of ${records.length} ${resourceType} records`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    try {
      // Send for validation (parsing and resolution)
      const requestBody = {};
      
      switch (resourceType) {
        case 'restaurants':
          requestBody.restaurants = records;
          break;
        case 'dishes':
          requestBody.dishes = records;
          break;
        case 'users':
          requestBody.users = records;
          break;
        case 'cities':
          requestBody.cities = records;
          break;
        case 'neighborhoods':
          requestBody.neighborhoods = records;
          break;
        case 'hashtags':
          requestBody.hashtags = records;
          break;
        case 'restaurant_chains':
          requestBody.restaurant_chains = records;
          break;
        default:
          // Generic field name for unknown resource types
          requestBody[resourceType] = records;
      }

      logDebug(`[EnhancedAdminService] Sending validation request to ${endpoint}/validate`, requestBody);

      const response = await httpClient.post(`${endpoint}/validate`, requestBody);
      
      logDebug(`[EnhancedAdminService] Validation response:`, response.data);
      
      if (progressCallback && typeof progressCallback === 'function') {
        progressCallback({
          completed: records.length,
          total: records.length,
          phase: 'validation_complete'
        });
      }

      return response.data;

    } catch (error) {
      logError(`[EnhancedAdminService] Bulk validation error:`, error);
      
      if (error.response?.data) {
        throw new Error(error.response.data.message || `Validation failed for ${resourceType}`);
      }
      
      throw new Error(`Network error during ${resourceType} validation: ${error.message}`);
    }
  },

  /**
   * Bulk add resources
   */
  async bulkAddResources(resourceType, records, progressCallback) {
    logDebug(`[EnhancedAdminService] Starting bulk add of ${records.length} ${resourceType} records`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    try {
      // Send for creation
      const requestBody = {};
      
      switch (resourceType) {
        case 'restaurants':
          requestBody.restaurants = records;
          break;
        case 'dishes':
          requestBody.dishes = records;
          break;
        case 'users':
          requestBody.users = records;
          break;
        case 'cities':
          requestBody.cities = records;
          break;
        case 'neighborhoods':
          requestBody.neighborhoods = records;
          break;
        case 'hashtags':
          requestBody.hashtags = records;
          break;
        case 'restaurant_chains':
          requestBody.restaurant_chains = records;
          break;
        default:
          // Generic field name for unknown resource types
          requestBody[resourceType] = records;
      }

      logDebug(`[EnhancedAdminService] Sending bulk add request to ${endpoint}/bulk`, requestBody);

      const response = await httpClient.post(`${endpoint}/bulk`, requestBody);
      
      logDebug(`[EnhancedAdminService] Bulk add response:`, response.data);
      
      if (progressCallback && typeof progressCallback === 'function') {
        progressCallback({
          completed: records.length,
          total: records.length,
          phase: 'creation_complete'
        });
      }

      return response.data;

    } catch (error) {
      logError(`[EnhancedAdminService] Bulk add error:`, error);
      
      if (error.response?.data) {
        throw new Error(error.response.data.message || `Creation failed for ${resourceType}`);
      }
      
      throw new Error(`Network error during ${resourceType} creation: ${error.message}`);
    }
  },

  /**
   * Legacy method name for backward compatibility
   */
  async bulkAdd(resourceType, records, progressCallback) {
    return this.bulkAddResources(resourceType, records, progressCallback);
  },

  /**
   * Legacy method aliases for backward compatibility
   */
  async bulkAddFromFile(resourceType, file, progressCallback) {
    return this.importFromFile(resourceType, file, progressCallback);
  },

  async bulkAddRestaurants(resourceType, restaurants, progressCallback) {
    return this.bulkAddResources(resourceType, restaurants, progressCallback);
  },

  async bulkAddRestaurantsFromFile(resourceType, file, progressCallback) {
    return this.importFromFile(resourceType, file, progressCallback);
  },

  /**
   * Real file import functionality
   */
  async importFromFile(resourceType, file, progressCallback) {
    logDebug(`[EnhancedAdminService] Starting file import for ${resourceType}`);
    
    const endpoint = ADMIN_ENDPOINTS[resourceType];
    if (!endpoint) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await httpClient.post(`${endpoint}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      logInfo(`[EnhancedAdminService] Import completed: ${response.data.data.success} imported, ${response.data.data.failed} failed`);
      
      if (progressCallback) {
        progressCallback(100);
      }
      
      return response.data.data;
    } catch (error) {
      logError(`[EnhancedAdminService] Error during import:`, error);
      throw error;
    }
  },
}

export default enhancedAdminService;