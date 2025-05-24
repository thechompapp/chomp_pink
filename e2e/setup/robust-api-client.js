/**
 * Robust API Client for E2E Testing
 * 
 * This client provides robust error handling and logging for API requests.
 */

const axios = require('axios');
const config = require('./config.js');

// Create a simple in-memory storage for tokens
const tokenStorage = {
  token: null,
  setToken(token) {
    this.token = token;
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  clearToken() {
    this.token = null;
    delete apiClient.defaults.headers.common['Authorization'];
  },
  getToken() {
    return this.token;
  }
};

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    'X-Test-Request': 'true'
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add auth token if available
    const token = tokenStorage.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response for debugging
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Log detailed error information for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    return Promise.reject(error);
  }
);

/**
 * API request wrapper with standardized error handling
 * @param {Function} requestFn - Function that returns a promise from axios
 * @param {string} context - Context for error messages
 * @returns {Promise<Object>} - Standardized response object
 */
export const handleApiRequest = async (requestFn, context = 'API Request') => {
  try {
    const response = await requestFn();
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.message || error.message,
      data: error.response?.data,
      context
    };
  }
};

/**
 * Login with the provided credentials
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Login result
 */
export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    
    // Check if token is in the response data
    if (response.status === 200 && response.data.token) {
      tokenStorage.setToken(response.data.token);
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    }
    
    // If token is not in response data, check if it's in a nested object
    if (response.status === 200 && response.data.data && response.data.data.token) {
      tokenStorage.setToken(response.data.data.token);
      return {
        success: true,
        status: response.status,
        data: response.data.data
      };
    }
    
    // If no token found, return error
    return {
      success: false,
      status: response.status,
      error: 'No token received',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.error?.message || error.response?.data?.message || error.message,
      data: error.response?.data
    };
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
export const register = async (userData) => {
  return handleApiRequest(
    () => apiClient.post('/auth/register', userData),
    'User Registration'
  );
};

/**
 * Logout the current user
 * @returns {Promise<Object>} Logout result
 */
export const logout = async () => {
  const result = await handleApiRequest(
    () => apiClient.post('/auth/logout'),
    'User Logout'
  );
  
  if (result.success) {
    tokenStorage.clearToken();
  }
  
  return result;
};

/**
 * Get the current user's profile
 * @returns {Promise<Object>} User profile
 */
export const getCurrentUser = async () => {
  return handleApiRequest(
    () => apiClient.get('/users/me'),
    'Get Current User'
  );
};

/**
 * Get a list of restaurants
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Restaurants list
 */
export const getRestaurants = async (params = {}) => {
  return handleApiRequest(
    () => apiClient.get('/e2e/restaurants', { params }),
    'Get Restaurants'
  );
};

/**
 * Create a new restaurant
 * @param {Object} restaurantData - Restaurant data
 * @returns {Promise<Object>} Created restaurant
 */
export const createRestaurant = async (restaurantData) => {
  return handleApiRequest(
    () => apiClient.post('/e2e/restaurants', restaurantData),
    'Create Restaurant'
  );
};

/**
 * Get restaurant by ID
 * @param {number} id - Restaurant ID
 * @returns {Promise<Object>} Restaurant details
 */
export const getRestaurantById = async (id) => {
  return handleApiRequest(
    () => apiClient.get(`/e2e/restaurants/${id}`),
    'Get Restaurant Details'
  );
};

/**
 * Get a list of dishes
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Dishes list
 */
export const getDishes = async (params = {}) => {
  return handleApiRequest(
    () => apiClient.get('/e2e/dishes', { params }),
    'Get Dishes'
  );
};

/**
 * Create a new dish
 * @param {Object} dishData - Dish data
 * @returns {Promise<Object>} Created dish
 */
export const createDish = async (dishData) => {
  return handleApiRequest(
    () => apiClient.post('/e2e/dishes', dishData),
    'Create Dish'
  );
};

/**
 * Get dish by ID
 * @param {number} id - Dish ID
 * @returns {Promise<Object>} Dish details
 */
export const getDishById = async (id) => {
  return handleApiRequest(
    () => apiClient.get(`/e2e/dishes/${id}`),
    'Get Dish Details'
  );
};

/**
 * Get user profile (protected route)
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} User profile data
 */
export const getProfile = async (token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.get('/api/auth/profile'),
    'Get User Profile'
  );
};

/**
 * Get admin data (admin-only route)
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Admin data
 */
export const getAdminData = async (token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.get('/api/admin/data'),
    'Get Admin Data'
  );
};

/**
 * Create a new list
 * @param {Object} listData - List data (name, description)
 * @returns {Promise<Object>} Created list
 */
export const createList = async (listData) => {
  return handleApiRequest(
    () => apiClient.post('/api/lists', listData),
    'Create List'
  );
};

/**
 * Get all lists for the authenticated user
 * @returns {Promise<Object>} User's lists
 */
export const getLists = async () => {
  return handleApiRequest(
    () => apiClient.get('/api/lists'),
    'Get Lists'
  );
};

/**
 * Get a list by ID
 * @param {number} listId - List ID
 * @returns {Promise<Object>} List details
 */
export const getListById = async (listId) => {
  return handleApiRequest(
    () => apiClient.get(`/api/lists/${listId}`),
    'Get List Details'
  );
};

/**
 * Update a list
 * @param {number} listId - List ID
 * @param {Object} updateData - Updated list data
 * @returns {Promise<Object>} Updated list
 */
export const updateList = async (listId, updateData) => {
  return handleApiRequest(
    () => apiClient.put(`/api/lists/${listId}`, updateData),
    'Update List'
  );
};

/**
 * Delete a list
 * @param {number} listId - List ID
 * @returns {Promise<Object>} Success response
 */
export const deleteList = async (listId) => {
  return handleApiRequest(
    () => apiClient.delete(`/api/lists/${listId}`),
    'Delete List'
  );
};

/**
 * Add an item to a list
 * @param {number} listId - List ID
 * @param {Object} itemData - Item data (itemId, itemType, notes)
 * @returns {Promise<Object>} Success response
 */
export const addItemToList = async (listId, itemData) => {
  return handleApiRequest(
    () => apiClient.post(`/api/lists/${listId}/items`, itemData),
    'Add Item to List'
  );
};

/**
 * Bulk add multiple items to a list
 * @param {number} listId - List ID
 * @param {Array} items - Array of item data objects
 * @returns {Promise<Object>} Success response with count of added items
 */
export const bulkAddItemsToList = async (listId, items) => {
  return handleApiRequest(
    () => apiClient.post(`/api/lists/${listId}/items/bulk`, { items }),
    'Bulk Add Items to List'
  );
};

/**
 * Remove an item from a list
 * @param {number} listId - List ID
 * @param {number} itemId - Item ID
 * @returns {Promise<Object>} Success response
 */
export const removeItemFromList = async (listId, itemId) => {
  return handleApiRequest(
    () => apiClient.delete(`/api/lists/${listId}/items/${itemId}`),
    'Remove Item from List'
  );
};

/**
 * Search for content
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} Search results
 */
export const search = async (query, params = {}) => {
  return handleApiRequest(
    () => apiClient.get('/search', { params: { q: query, ...params } }),
    'Search'
  );
};

/**
 * Global search for content
 * @param {string} query - Search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} Search results
 */
export const searchGlobal = async (query, params = {}) => {
  return handleApiRequest(
    () => apiClient.get('/api/search', { params: { query, ...params } }),
    'Global Search'
  );
};

/**
 * Autocomplete search
 * @param {string} query - Partial search query
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} Autocomplete suggestions
 */
export const searchAutocomplete = async (query, params = {}) => {
  return handleApiRequest(
    () => apiClient.get('/api/search/autocomplete', { params: { query, ...params } }),
    'Autocomplete Search'
  );
};

/**
 * Create a new submission
 * @param {Object} submissionData - Submission data
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Created submission
 */
export const createSubmission = async (submissionData, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.post('/api/submissions', submissionData),
    'Create Submission'
  );
};

/**
 * Get all submissions
 * @param {Object} params - Query parameters
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Submissions list
 */
export const getSubmissions = async (params = {}, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.get('/api/submissions', { params }),
    'Get Submissions'
  );
};

/**
 * Get a submission by ID
 * @param {number} id - Submission ID
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Submission details
 */
export const getSubmissionById = async (id, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.get(`/api/submissions/${id}`),
    'Get Submission Details'
  );
};

/**
 * Approve a submission
 * @param {number} id - Submission ID
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Approved submission
 */
export const approveSubmission = async (id, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.put(`/api/submissions/${id}/approve`),
    'Approve Submission'
  );
};

/**
 * Reject a submission
 * @param {number} id - Submission ID
 * @param {Object} data - Rejection data (reason)
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Rejected submission
 */
export const rejectSubmission = async (id, data = {}, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.put(`/api/submissions/${id}/reject`, data),
    'Reject Submission'
  );
};

/**
 * Get all users (admin only)
 * @param {Object} params - Query parameters
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Users list
 */
export const getAdminUsers = async (params = {}, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.get('/api/admin/data/users', { params }),
    'Get Admin Users'
  );
};

/**
 * Create a new user (admin only)
 * @param {Object} userData - User data
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Created user
 */
export const createAdminUser = async (userData, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.post('/api/admin/data/users', userData),
    'Create Admin User'
  );
};

/**
 * Update a user (admin only)
 * @param {number} id - User ID
 * @param {Object} updateData - Updated user data
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Updated user
 */
export const updateAdminUser = async (id, updateData, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.put(`/api/admin/data/users/${id}`, updateData),
    'Update Admin User'
  );
};

/**
 * Delete a user (admin only)
 * @param {number} id - User ID
 * @param {string} token - Optional token to override stored token
 * @returns {Promise<Object>} Success response
 */
export const deleteAdminUser = async (id, token = null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  return handleApiRequest(
    () => apiClient.delete(`/api/admin/data/users/${id}`),
    'Delete Admin User'
  );
};

/**
 * Get API health status
 * @returns {Promise<Object>} Health status
 */
export const getHealth = async () => {
  return handleApiRequest(
    () => apiClient.get('/health'),
    'Health Check'
  );
};

export default {
  apiClient,
  tokenStorage,
  handleApiRequest,
  login,
  register,
  logout,
  getCurrentUser,
  getRestaurants,
  createRestaurant,
  getDishes,
  createDish,
  search,
  getHealth
};
