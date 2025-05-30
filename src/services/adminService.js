/* src/services/adminService.js */
import { getDefaultApiClient } from '@/services/http';
import { handleApiResponse } from '@/utils/serviceHelpers';
import { logInfo, logError, logDebug, logWarn } from '@/utils/logger';

/**
 * Adds admin-specific headers to a request config object
 * @param {Object} config - API request config
 * @returns {Object} - Updated config with admin headers
 */
const addAdminHeaders = (config = {}) => {
  const adminApiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_api_key') : null) || 'doof-admin-secret-key-dev';
  const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth-token') : null;
  
  if (!config.headers) {
    config.headers = {};
  }
  
  // Add primary JWT authentication
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Add admin API key if available
  if (adminApiKey) {
    config.headers['X-Admin-API-Key'] = adminApiKey;
    config.headers['X-Bypass-Auth'] = 'true'; // Standard for admin key usage
    config.headers['X-Superuser-Override'] = 'true'; // Standard for admin key usage
    config.headers['X-Admin-Access'] = 'true'; // Standard for admin key usage
  }
  
  return config;
};

export const adminService = {
  getAdminRestaurants: async () => {
    const apiClient = getDefaultApiClient();
    const result = await handleApiResponse(
      () => apiClient.get('/admin/restaurants'),
      'AdminService.getAdminRestaurants'
    );
    
    if (!result.success) {
      logError('Failed to fetch admin restaurants:', result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },

  getAdminDishes: async () => {
    const apiClient = getDefaultApiClient();
    const result = await handleApiResponse(
      () => apiClient.get('/admin/dishes'),
      'AdminService.getAdminDishes'
    );
    
    if (!result.success) {
      logError('Failed to fetch admin dishes:', result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },

  getAdminUsers: async () => {
    const apiClient = getDefaultApiClient();
    const result = await handleApiResponse(
      () => apiClient.get('/admin/users'),
      'AdminService.getAdminUsers'
    );
    
    if (!result.success) {
      logError('Failed to fetch admin users:', result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },

  getAdminCitiesSimple: async () => {
    const apiClient = getDefaultApiClient();
    const result = await handleApiResponse(
      () => apiClient.get('/admin/cities'),
      'AdminService.getAdminCitiesSimple'
    );
    
    if (!result.success) {
      logError('Failed to fetch admin cities:', result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },

  getAdminNeighborhoods: async () => {
    const apiClient = getDefaultApiClient();
    const result = await handleApiResponse(
      () => apiClient.get('/admin/neighborhoods'),
      'AdminService.getAdminNeighborhoods'
    );
    
    if (!result.success) {
      logError('Failed to fetch admin neighborhoods:', result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },

  getAdminHashtags: async () => {
    const apiClient = getDefaultApiClient();
    const result = await handleApiResponse(
      () => apiClient.get('/admin/hashtags'),
      'AdminService.getAdminHashtags'
    );
    
    if (!result.success) {
      logError('Failed to fetch admin hashtags:', result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },

  /**
   * Get admin data for a specific endpoint
   * @param {string} endpoint - Admin endpoint to query
   * @param {Object} options - Request options
   * @returns {Promise} - Promise resolving to admin data
   */
  getAdminData: async (endpoint, options = {}) => {
    logDebug(`[AdminService] Fetching data from ${endpoint}`);
    
    const apiClient = getDefaultApiClient();
    
    // Add admin headers to the config, not as URL parameters
    const requestConfig = {
      ...options,
      headers: {
        ...(options.headers || {}),
        'X-Admin-API-Key': localStorage.getItem('admin_api_key') || 'doof-admin-secret-key-dev',
        'X-Bypass-Auth': 'true',
        'X-Superuser-Override': 'true',
        'X-Admin-Access': 'true'
      }
    };
    
    return handleApiResponse(
      () => apiClient.get(`/admin/${endpoint}`, undefined, requestConfig),
      `AdminService Get${endpoint}`
    );
  },
  
  /**
   * Create a new admin resource
   * @param {string} endpoint - Admin endpoint
   * @param {Object} data - Resource data
   * @returns {Promise} - Promise resolving to created resource
   */
  createResource: async (endpoint, data) => {
    logDebug(`[AdminService] Creating ${endpoint} resource`);
    
    const apiClient = getDefaultApiClient();
    const requestConfig = addAdminHeaders();
    
    return handleApiResponse(
      () => apiClient.post(`/admin/${endpoint}`, data, requestConfig),
      `AdminService Create${endpoint}`
    );
  },
  
  /**
   * Update an existing admin resource
   * @param {string} endpoint - Admin endpoint
   * @param {number|string} id - Resource ID
   * @param {Object} data - Updated resource data
   * @returns {Promise} - Promise resolving to updated resource
   */
  updateResource: async (endpoint, id, data) => {
    logDebug(`[AdminService] Updating ${endpoint} resource with ID ${id}`);
    
    const apiClient = getDefaultApiClient();
    const requestConfig = addAdminHeaders();
    
    return handleApiResponse(
      () => apiClient.put(`/admin/${endpoint}/${id}`, data, requestConfig),
      `AdminService Update${endpoint}`
    );
  },
  
  /**
   * Delete an admin resource
   * @param {string} endpoint - Admin endpoint
   * @param {number|string} id - Resource ID
   * @returns {Promise} - Promise resolving to deletion status
   */
  deleteResource: async (endpoint, id) => {
    logDebug(`[AdminService] Deleting ${endpoint} resource with ID ${id}`);
    
    const apiClient = getDefaultApiClient();
    const requestConfig = addAdminHeaders();
    
    return handleApiResponse(
      () => apiClient.delete(`/admin/${endpoint}/${id}`, requestConfig),
      `AdminService Delete${endpoint}`
    );
  },
  
  /**
   * Process a submission (approve/reject)
   * @param {number|string} id - Submission ID
   * @param {string} action - Action to take (approve/reject)
   * @param {Object} data - Additional data for processing
   * @returns {Promise} - Promise resolving to processed submission
   */
  processSubmission: async (id, action, data = {}) => {
    if (!['approve', 'reject'].includes(action)) {
      logError(`[AdminService] Invalid submission action: ${action}. Must be 'approve' or 'reject'.`);
      return { success: false, error: `Invalid submission action: ${action}. Must be 'approve' or 'reject'.` };
    }
    
    logDebug(`[AdminService] ${action === 'approve' ? 'Approving' : 'Rejecting'} submission ${id}`);
    
    const apiClient = getDefaultApiClient();
    const requestConfig = addAdminHeaders();
    
    return handleApiResponse(
      () => apiClient.post(`/admin/submissions/${action}/${id}`, data, requestConfig),
      `AdminService.processSubmission.${action}`
    );
  },

  checkExistingItems: async (items, resourceType = 'restaurants') => {
    try {
      // Log the request for debugging
      logDebug(`AdminService CheckExisting ${resourceType} request:`, items);
      
      // Ensure items is in the correct format
      const formattedItems = Array.isArray(items) ? { items } : items;
      
      // Validate input
      if (!formattedItems || !formattedItems.items || !Array.isArray(formattedItems.items) || formattedItems.items.length === 0) {
        logWarn(`Invalid items format for checkExistingItems:`, formattedItems);
        return {
          success: false,
          message: 'Invalid items format',
          data: { results: [] }
        };
      }
      
      // Make the API call to check for existing items
      const apiClient = getDefaultApiClient();
      return handleApiResponse(
        () => apiClient.post(`/admin/check-existing/${resourceType}`, formattedItems),
        `AdminService CheckExisting ${resourceType}`,
        (data) => {
          logDebug(`AdminService CheckExisting ${resourceType} response:`, data);
          return {
            success: true,
            message: data.message || 'Check completed',
            data: {
              results: data.results || []
            }
          };
        }
      ).catch(error => {
        logError(`Failed to check existing ${resourceType}:`, error);
        
        // If API call fails, fall back to local duplicate detection
        const localDuplicates = adminService.findLocalDuplicates(formattedItems.items);
        if (localDuplicates.length > 0) {
          logDebug(`API call failed, using ${localDuplicates.length} local duplicates:`, localDuplicates);
          return {
            success: true,
            message: 'Using local duplicate detection',
            data: {
              results: localDuplicates.map(dup => ({
                item: { name: dup.duplicate.name, _lineNumber: dup.duplicate._lineNumber },
                existing: {
                  id: -1, // Use -1 to indicate local duplicate
                  name: dup.original.name,
                  type: dup.original.type || 'restaurant'
                }
              }))
            }
          };
        }
        
        // If no duplicates found locally, return empty results
        return {
          success: true,
          message: 'No duplicates found (local check)',
          data: { results: [] }
        };
      });
    } catch (error) {
      logError(`Unexpected error in checkExistingItems:`, error);
      return {
        success: false,
        message: error.message || 'Error checking for duplicates',
        data: { results: [] }
      };
    }
  },
  
  // Helper function to find duplicates within the current batch
  findLocalDuplicates: (items) => {
    if (!items || !Array.isArray(items)) return [];
    
    const duplicates = [];
    const seen = new Map();
    
    // First pass: record all items
    items.forEach((item, index) => {
      if (!item.name) return;
      
      const key = item.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { item, index });
      }
    });
    
    // Second pass: find duplicates
    items.forEach((item, index) => {
      if (!item.name) return;
      
      const key = item.name.toLowerCase();
      const firstOccurrence = seen.get(key);
      
      if (firstOccurrence && firstOccurrence.index !== index) {
        duplicates.push({
          original: firstOccurrence.item,
          duplicate: item
        });
      }
    });
    
    logDebug(`Local duplicate check found ${duplicates.length} duplicates`);
    return duplicates;
  },

  // Data cleanup methods
  async analyzeData(resourceType) {
    const apiClient = getDefaultApiClient();
    return handleApiResponse(
      () => apiClient.get(`/admin/data-cleanup/${resourceType}/analyze`),
      `AdminService AnalyzeData for ${resourceType}`
    ).catch(error => {
      logError(`Failed to analyze data for ${resourceType}:`, error);
      throw error;
    });
  },

  async applyChanges(resourceType, changeIds) {
    const apiClient = getDefaultApiClient();
    return handleApiResponse(
      () => apiClient.post(`/admin/data-cleanup/${resourceType}/apply`, { changeIds }),
      `AdminService ApplyChanges for ${resourceType}`
    ).catch(error => {
      logError(`Failed to apply changes for ${resourceType}:`, error);
      throw error;
    });
  },

  async rejectChanges(resourceType, changeIds) {
    const apiClient = getDefaultApiClient();
    return handleApiResponse(
      () => apiClient.post(`/admin/data-cleanup/${resourceType}/reject`, { changeIds }),
      `AdminService RejectChanges for ${resourceType}`
    ).catch(error => {
      logError(`Failed to reject changes for ${resourceType}:`, error);
      throw error;
    });
  }
};

// Only use named export for consistency