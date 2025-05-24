/**
 * API Test Enhancer for Chomp/Doof
 * 
 * This module enhances API client calls in tests to capture request and response data
 * for improved test reporting.
 */

/**
 * Enhances an API client to capture request and response data for test reporting
 * @param {Object} apiClient - The API client to enhance
 * @returns {Object} - The enhanced API client
 */
function enhanceApiClient(apiClient) {
  const originalMethods = {
    get: apiClient.get,
    post: apiClient.post,
    put: apiClient.put,
    patch: apiClient.patch,
    delete: apiClient.delete
  };

  // Wrap each method to capture request and response data
  Object.keys(originalMethods).forEach(method => {
    apiClient[method] = async function(...args) {
      const url = args[0];
      const data = method === 'get' || method === 'delete' ? undefined : args[1];
      const config = method === 'get' || method === 'delete' ? args[1] : args[2];
      
      // Capture request data
      const request = {
        method: method.toUpperCase(),
        url,
        headers: config?.headers,
        body: data
      };
      
      try {
        // Make the actual API call
        const response = await originalMethods[method].apply(this, args);
        
        // Capture response data
        const responseData = {
          status: response.status,
          headers: response.headers,
          data: response.data
        };
        
        // Attach request and response to the current test context if possible
        if (global.currentTest) {
          global.currentTest.apiRequest = request;
          global.currentTest.apiResponse = responseData;
        }
        
        return response;
      } catch (error) {
        // Capture error response if available
        if (error.response) {
          const errorResponseData = {
            status: error.response.status,
            headers: error.response.headers,
            data: error.response.data
          };
          
          if (global.currentTest) {
            global.currentTest.apiRequest = request;
            global.currentTest.apiResponse = errorResponseData;
          }
        }
        
        throw error;
      }
    };
  });
  
  return apiClient;
}

/**
 * Setup function to be called in test setup files
 * @param {Object} apiClient - The API client to enhance
 */
function setupApiTestEnhancer(apiClient) {
  // Enhance the API client
  enhanceApiClient(apiClient);
  
  // Setup global hooks for Vitest
  if (global.beforeEach && global.afterEach) {
    global.beforeEach((context) => {
      global.currentTest = context;
    });
    
    global.afterEach(() => {
      global.currentTest = null;
    });
  }
}

module.exports = {
  enhanceApiClient,
  setupApiTestEnhancer
};
