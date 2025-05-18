/* src/services/adminService.js */
import apiClient from './apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';

export const adminService = {
  getAdminRestaurants: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/restaurants'),
      'AdminService GetRestaurants'
    ).catch(error => {
      logError('Failed to fetch admin restaurants:', error);
      throw error;
    });
  },

  getAdminDishes: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/dishes'),
      'AdminService GetDishes'
    ).catch(error => {
      logError('Failed to fetch admin dishes:', error);
      throw error;
    });
  },

  getAdminUsers: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/users'),
      'AdminService GetUsers'
    ).catch(error => {
      logError('Failed to fetch admin users:', error);
      throw error;
    });
  },

  getAdminCitiesSimple: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/cities'),
      'AdminService GetCitiesSimple'
    ).catch(error => {
      logError('Failed to fetch admin cities:', error);
      throw error;
    });
  },

  getAdminNeighborhoods: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/neighborhoods'),
      'AdminService GetNeighborhoods'
    ).catch(error => {
      logError('Failed to fetch admin neighborhoods:', error);
      throw error;
    });
  },

  getAdminHashtags: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/hashtags'),
      'AdminService GetHashtags'
    ).catch(error => {
      logError('Failed to fetch admin hashtags:', error);
      throw error;
    });
  },

  getAdminData: async (resource) => {
    // Log the request for debugging
    logDebug(`Fetching admin data for resource: ${resource}`);
    
    // Use the correct endpoint based on the resource type
    let endpoint = `/admin/${resource}`;
    
    // Special case for submissions which has a dedicated endpoint
    if (resource === 'submissions') {
      endpoint = '/admin/submissions';
    }
    
    logDebug(`Using endpoint: ${endpoint} for resource: ${resource}`);
    
    return handleApiResponse(
      () => apiClient.get(endpoint),
      `AdminService Get${resource}`
    )
    .then(response => {
      logDebug(`Admin data response for ${resource}:`, {
        status: response?.status || 'unknown',
        dataType: typeof response,
        isArray: Array.isArray(response),
        hasData: !!response?.data,
        dataLength: Array.isArray(response) ? response.length : 
                  (Array.isArray(response?.data) ? response.data.length : 'not array')
      });
      
      // Extract the data from the response based on the structure
      // The API returns { success: true, message: string, data: Array }
      if (response && typeof response === 'object' && response.data) {
        return response.data;
      }
      
      return response;
    })
    .catch(error => {
      logError(`Failed to fetch admin ${resource}:`, error);
      throw error;
    });
  },

  createResource: async (type, payload) => {
    console.log(`[adminService] Creating resource of type ${type} with payload:`, JSON.stringify(payload, null, 2));
    return handleApiResponse(
      () => apiClient.post(`/admin/${type}`, payload),
      `AdminService Create${type}`
    ).catch(error => {
      logError(`Failed to create ${type}:`, error);
      throw error;
    });
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

  // Other service methods (updateResource, deleteResource, etc.)
  updateResource: async (type, id, payload) => {
    logDebug(`[adminService] Updating ${type} with ID ${id}`, payload);
    return handleApiResponse(
      () => apiClient.put(`/admin/${type}/${id}`, payload),
      `AdminService Update${type}`
    ).catch(error => {
      logError(`Failed to update ${type} ${id}:`, error);
      throw error;
    });
  },

  deleteResource: async (type, id) => {
    logDebug(`[adminService] Deleting ${type} with ID ${id}`);
    return handleApiResponse(
      () => apiClient.delete(`/admin/${type}/${id}`),
      `AdminService Delete${type}`
    ).catch(error => {
      logError(`Failed to delete ${type} ${id}:`, error);
      throw error;
    });
  },

  // Alias methods for backward compatibility
  updateAdminItem: async (type, id, data) => {
    return adminService.updateResource(type, id, data);
  },

  deleteAdminItem: async (type, id) => {
    return adminService.deleteResource(type, id);
  },

  // Data cleanup methods
  async analyzeData(resourceType) {
    return handleApiResponse(
      () => apiClient.get(`/admin/data-cleanup/${resourceType}/analyze`),
      `AdminService AnalyzeData for ${resourceType}`
    ).catch(error => {
      logError(`Failed to analyze data for ${resourceType}:`, error);
      throw error;
    });
  },

  async applyChanges(resourceType, changeIds) {
    return handleApiResponse(
      () => apiClient.post(`/admin/data-cleanup/${resourceType}/apply`, { changeIds }),
      `AdminService ApplyChanges for ${resourceType}`
    ).catch(error => {
      logError(`Failed to apply changes for ${resourceType}:`, error);
      throw error;
    });
  },

  async rejectChanges(resourceType, changeIds) {
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