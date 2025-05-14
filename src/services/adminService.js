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
    return handleApiResponse(
      () => apiClient.get(`/admin/${resource}`),
      `AdminService Get${resource}`
    ).catch(error => {
      logError(`Failed to fetch admin ${resource}:`, error);
      throw error;
    });
  },

  createResource: async (type, payload) => {
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
        () => apiClient.post(`/admin/check-existing/restaurants`, formattedItems),
        `AdminService CheckExisting restaurants`,
        (data) => {
          logDebug(`AdminService CheckExisting restaurants response:`, data);
          return {
            success: true,
            message: data.message || 'Check completed',
            data: {
              results: data.results || []
            }
          };
        }
      ).catch(error => {
        logError(`Failed to check existing restaurants:`, error);
        
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

  checkExistingItems: async (payload, itemType = 'restaurants') => {
    try {
      // Validate the payload
      if (!payload || !payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
        logWarn('AdminService CheckExistingItems: No valid items provided in payload');
        return {
          success: false,
          message: 'No valid items provided for duplicate check',
          data: { results: [] }
        };
      }
      
      // Log the request payload for debugging
      logDebug('AdminService CheckExistingItems request payload:', payload);
      
      // Make the real API call - no fallbacks, always use real data
      try {
        // Make the API call with the properly formatted request body
        const response = await apiClient.post(
          `/admin/check-existing/${itemType}`, 
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Process the response data
        const data = response.data;
        logDebug(`AdminService CheckExisting ${itemType} response:`, data);
        
        // Format the response in a consistent way
        if (data && Array.isArray(data)) {
          // If the API returns an array directly
          return {
            success: true,
            message: 'Check completed',
            data: {
              results: data
            }
          };
        } else if (data && data.results && Array.isArray(data.results)) {
          // If the API returns an object with a results array
          return {
            success: true,
            message: data.message || 'Check completed',
            data: {
              results: data.results
            }
          };
        } else if (data && typeof data === 'object') {
          // If the API returns some other object structure
          return {
            success: true,
            message: data.message || 'Check completed',
            data: {
              results: data.results || []
            }
          };
        } else {
          // Fallback for unexpected response format
          logWarn(`AdminService CheckExisting ${itemType} unexpected response format:`, data);
          return {
            success: true,
            message: 'Check completed with unexpected response format',
            data: {
              results: []
            }
          };
        }
      } catch (apiError) {
        // Enhanced error logging
        const errorDetails = {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          request: {
            endpoint: `/admin/check-existing/${itemType}`,
            itemCount: payload.items.length,
            method: 'POST'
          }
        };
        
        logError(`AdminService CheckExisting ${itemType} API error:`, errorDetails);
        
        return {
          success: false,
          message: apiError.response?.data?.message || apiError.message || 'Error checking for duplicates',
          data: { results: [] }
        };
      }
    } catch (error) {
      logError('Unexpected error in checkExistingItems:', error);
      return {
        success: false,
        message: error.message || 'Error checking for duplicates',
        data: { results: [] }
      };
    }
  },
  
  bulkAddItems: async (payload) => {
    try {
      if (!payload) {
        const error = new Error('No payload provided for bulk add');
        logError('Invalid payload for bulk add:', { error });
        return {
          success: false,
          message: 'No payload provided for bulk add',
          error: { message: 'No payload provided' }
        };
      }
      
      // Ensure payload has the correct format for the API
      const formattedPayload = payload.items ? payload : { items: Array.isArray(payload) ? payload : [] };
      
      // Validate the payload before sending
      if (!formattedPayload.items || !Array.isArray(formattedPayload.items) || formattedPayload.items.length === 0) {
        return {
          success: false,
          message: 'Invalid items format for bulk add',
          error: { message: 'Items must be a non-empty array' }
        };
      }
      
      // Ensure each item has the required fields
      const validItems = formattedPayload.items.map(item => ({
        name: item.name,
        type: item.type || 'restaurant',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        zipcode: item.zipcode || '',
        city_id: item.city_id || 1, // Default to 1 if missing
        neighborhood_id: item.neighborhood_id || null,
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        tags: item.tags || [],
        place_id: item.placeId || '',
        _lineNumber: item._lineNumber // Keep for tracking
      }));
      
      // Create a new payload with validated items
      const validatedPayload = { items: validItems };
      
      // Log the request payload for debugging
      logDebug('AdminService BulkAddItems request payload:', validatedPayload);
      
      // Make the real API call - no fallbacks, always use real data
      try {
        // Make the real API call with proper error handling and explicit content type
        const response = await apiClient.post(
          '/admin/bulk/restaurants', 
          validatedPayload,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Process the response
        const data = response.data;
        logDebug('AdminService BulkAddItems response:', data);
        
        // Return standardized response with actual data from the API
        return {
          success: true,
          message: data.message || 'Items added successfully',
          data: {
            successCount: data.successCount || 0,
            failureCount: data.failureCount || 0,
            createdItems: data.createdItems || [],
            errors: data.errors || []
          }
        };
      } catch (apiError) {
        // Enhanced error logging with request details
        const errorDetails = {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          request: {
            endpoint: '/admin/bulk/restaurants',
            itemCount: validItems.length,
            method: 'POST'
          }
        };
        
        logError('Failed to bulk add items:', errorDetails);
        
        // Return a formatted error response
        return {
          success: false,
          message: apiError.message || 'Error submitting items',
          error: errorDetails
        };
      }
    } catch (error) {
      logError('Unexpected error in bulkAddItems:', error);
      
      // Return a formatted error response
      return {
        success: false,
        message: error.message || 'Unexpected error in bulk add',
        error: {
          message: error.message,
          stack: error.stack
        }
      };
    }
  },
};

// Only use named export for consistency