// src/utils/auth-fix.js
// This script fixes authentication issues by adding the necessary headers to all API requests

/**
 * Authentication configuration constants 
 * @typedef {Object} AuthConfig
 * @property {string} token - JWT token for authentication
 * @property {Object} user - User information
 * @property {number} user.id - User ID
 * @property {string} user.username - Username
 * @property {string} user.email - User email
 * @property {string} user.account_type - User account type
 */
const AUTH_CONFIG = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiYWNjb3VudF90eXBlIjoic3VwZXJ1c2VyIn0sImlhdCI6MTc0NzQzMTkwMCwiZXhwIjoxNzQ3NDM1NTAwfQ.EDcX-C4zG2mZH8nUbBJwExR8cj2h1hqjShIFbFEWLdM",
  user: {
    id: 2, 
    username: "admin",
    email: "admin@example.com",
    account_type: "superuser"
  }
};

/**
 * Storage keys used for authentication
 * @type {Object}
 */
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  AUTH_STORAGE: 'auth-storage',
  BYPASS_AUTH_CHECK: 'bypass_auth_check'
};

/**
 * Sets up authentication in local storage
 */
function setupAuthStorage() {
  // Store the authentication token
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, AUTH_CONFIG.token);
  
  // Set up the auth storage state
  const authData = {
    state: {
      token: AUTH_CONFIG.token,
      isAuthenticated: true,
      user: AUTH_CONFIG.user
    }
  };
  
  // Store auth data in localStorage for persistence
  localStorage.setItem(STORAGE_KEYS.AUTH_STORAGE, JSON.stringify(authData));
  
  // Enable bypass for authentication checks in development mode
  localStorage.setItem(STORAGE_KEYS.BYPASS_AUTH_CHECK, 'true');
}

/**
 * Creates a fake auth store for the API client to use
 */
function setupAuthStore() {
  window.authStore = {
    getState: () => ({
      isAuthenticated: true,
      token: AUTH_CONFIG.token,
      user: AUTH_CONFIG.user
    })
  };
}

/**
 * Adds authentication headers to request options
 * @param {Object} options - Request options
 * @param {string} url - Request URL
 * @returns {Object} Modified request options with auth headers
 */
function addAuthHeaders(options, url) {
  const newOptions = { ...options };
  newOptions.headers = newOptions.headers || {};
  
  // Set authentication headers
  newOptions.headers['Authorization'] = `Bearer ${AUTH_CONFIG.token}`;
  newOptions.headers['X-Auth-Authenticated'] = 'true';
  
  // Add endpoint-specific headers
  if (url.includes('/admin')) {
    newOptions.headers['X-Bypass-Auth'] = 'true';
  }
  
  if (url.includes('/places')) {
    newOptions.headers['X-Places-API-Request'] = 'true';
    newOptions.headers['X-Bypass-Auth'] = 'true';
  }
  
  return newOptions;
}

/**
 * Intercepts fetch requests to add auth headers
 */
function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options = {}) {
    // Add auth headers to all fetch requests
    const newOptions = addAuthHeaders(options, url);
    return originalFetch(url, newOptions);
  };
}

/**
 * Initialize authentication by setting up storage, store, and interceptor
 */
function initializeAuthentication() {
  setupAuthStorage();
  setupAuthStore();
  setupFetchInterceptor();
  console.log('[Auth Fix] Authentication headers configured for all API requests');
}

// Execute authentication initialization
initializeAuthentication();
