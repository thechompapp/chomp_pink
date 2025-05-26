/**
 * Admin Data Processor
 * 
 * Utility functions for processing admin data from the API.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 */

import { adminService } from '@/services/adminService';

/**
 * Data processing utilities for admin panel
 */
const DataProcessor = {
  /**
   * Process the response data consistently for each endpoint
   * @param {Object|Array} response - API response data
   * @param {string} endpoint - API endpoint name
   * @returns {Array} Processed data array
   */
  processResponseData: (response, endpoint) => {
    if (!response) {
      console.warn(`Empty response for ${endpoint}`);
      return [];
    }
    
    // Handle array response
    if (Array.isArray(response)) {
      return response;
    }
    
    // Handle { data: [...] } response
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Handle { data: { data: [...] } } response
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Try to find any array property
    if (typeof response === 'object' && response !== null) {
      const arrayProps = Object.keys(response).filter(key => Array.isArray(response[key]));
      if (arrayProps.length > 0) {
        return response[arrayProps[0]];
      }
    }
    
    // Return empty array as fallback
    console.warn(`Could not extract array data from ${endpoint} response:`, response);
    return [];
  },

  /**
   * Fetch data for a specific endpoint
   * @param {string} endpoint - API endpoint name
   * @returns {Promise<Object>} Object containing endpoint name and data
   */
  fetchEndpointData: async (endpoint) => {
    try {
      console.log(`Fetching data for ${endpoint}`);
      const response = await adminService.getAdminData(endpoint);
      const processedData = DataProcessor.processResponseData(response, endpoint);
      
      console.log(`Successfully processed ${endpoint} data:`, {
        length: processedData.length
      });
      
      return { endpoint, data: processedData };
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, {
        message: error.message,
        status: error.response?.status
      });
      
      return { endpoint, data: [] };
    }
  },

  /**
   * Fetch all admin data from the API
   * @returns {Promise<Object>} Object containing data for all endpoints
   */
  fetchAllAdminData: async (endpoints) => {
    try {
      console.log('Fetching admin data...');
      
      // This will be populated with results from API
      const data = {};
      
      // Use Promise.all for parallel requests to improve performance
      const results = await Promise.all(
        endpoints.map(endpoint => DataProcessor.fetchEndpointData(endpoint))
      );
      
      // Populate the data object with results
      results.forEach(({ endpoint, data: endpointData }) => {
        data[endpoint] = endpointData;
      });
      
      console.log('All admin data fetched:', 
        Object.entries(data).map(([key, val]) => `${key}: ${val.length}`).join(', '));
      
      return data;
    } catch (error) {
      console.error('Error in fetchAllAdminData:', error);
      throw error;
    }
  }
};

export default DataProcessor;
