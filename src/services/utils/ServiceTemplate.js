/**
 * Service Template
 * 
 * This is a template for standardized service implementation.
 * Copy this file and customize it for each service.
 */
import { getDefaultApiClient } from '@/services/http';
import { validateId, createQueryParams, handleApiResponse } from './serviceHelpers';
import { logDebug } from '@/utils/logger';

/**
 * Base URL for this service's endpoints
 * @type {string}
 */
const BASE_URL = '/api/resource';

/**
 * Service for resource management
 */
class ResourceService {
  /**
   * Get all resources
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} List of resources
   */
  async getAll(params = {}) {
    logDebug('[ResourceService] Getting all resources');
    
    const queryParams = createQueryParams(params);
    const url = queryParams ? `${BASE_URL}?${queryParams}` : BASE_URL;
    
    return handleApiResponse(
      apiClient.get(url),
      {
        entity: 'resources',
        operation: 'fetch',
        defaultValue: [],
        transform: (data) => Array.isArray(data) ? data : []
      }
    );
  }
  
  /**
   * Get a resource by ID
   * @param {number|string} id - Resource ID
   * @returns {Promise<Object|null>} Resource or null if not found
   */
  async getById(id) {
    const validId = validateId(id, 'resource');
    if (!validId) return null;
    
    logDebug(`[ResourceService] Getting resource by ID: ${validId}`);
    
    return handleApiResponse(
      apiClient.get(`${BASE_URL}/${validId}`),
      {
        entity: 'resource',
        operation: 'fetch',
        defaultValue: null
      }
    );
  }
  
  /**
   * Create a new resource
   * @param {Object} data - Resource data
   * @returns {Promise<Object|null>} Created resource or null on error
   */
  async create(data) {
    if (!data) return null;
    
    logDebug('[ResourceService] Creating resource');
    
    return handleApiResponse(
      apiClient.post(BASE_URL, data),
      {
        entity: 'resource',
        operation: 'create',
        defaultValue: null
      }
    );
  }
  
  /**
   * Update a resource
   * @param {number|string} id - Resource ID
   * @param {Object} data - Updated resource data
   * @returns {Promise<Object|null>} Updated resource or null on error
   */
  async update(id, data) {
    const validId = validateId(id, 'resource');
    if (!validId || !data) return null;
    
    logDebug(`[ResourceService] Updating resource: ${validId}`);
    
    return handleApiResponse(
      apiClient.put(`${BASE_URL}/${validId}`, data),
      {
        entity: 'resource',
        operation: 'update',
        defaultValue: null
      }
    );
  }
  
  /**
   * Delete a resource
   * @param {number|string} id - Resource ID
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async delete(id) {
    const validId = validateId(id, 'resource');
    if (!validId) return false;
    
    logDebug(`[ResourceService] Deleting resource: ${validId}`);
    
    return handleApiResponse(
      apiClient.delete(`${BASE_URL}/${validId}`),
      {
        entity: 'resource',
        operation: 'delete',
        defaultValue: false,
        transform: () => true
      }
    );
  }
  
  /**
   * Search for resources
   * @param {string} query - Search query
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Array>} Search results
   */
  async search(query, params = {}) {
    if (!query) return [];
    
    logDebug(`[ResourceService] Searching resources: ${query}`);
    
    const searchParams = {
      ...params,
      q: query
    };
    
    const queryParams = createQueryParams(searchParams);
    
    return handleApiResponse(
      apiClient.get(`${BASE_URL}/search?${queryParams}`),
      {
        entity: 'resources',
        operation: 'search',
        defaultValue: [],
        transform: (data) => Array.isArray(data) ? data : []
      }
    );
  }
}

// Create and export a singleton instance
export const resourceService = new ResourceService();

// Export the class for testing or extension
export default ResourceService;
