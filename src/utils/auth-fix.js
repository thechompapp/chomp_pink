// src/utils/auth-fix.js
// Development mode authentication setup that automatically logs in as admin

/**
 * Development mode authentication configuration
 */
const DEV_AUTH_CONFIG = {
  adminCredentials: {
    email: "admin@example.com",
    password: "doof123"
  },
  user: {
    id: 2, 
    username: "admin",
    email: "admin@example.com",
    account_type: "superuser",
    role: "admin"
  }
};

/**
 * Storage keys used for authentication
 */
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token',
  AUTH_STORAGE: 'auth-storage',
  BYPASS_AUTH_CHECK: 'bypass_auth_check',
  ADMIN_ACCESS: 'admin_access_enabled',
  SUPERUSER_OVERRIDE: 'superuser_override',
  ADMIN_API_KEY: 'admin_api_key'
};

/**
 * Get a fresh admin token from the backend
 */
async function getFreshAdminToken() {
  try {
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(DEV_AUTH_CONFIG.adminCredentials)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data.token) {
        console.log('[Auth Fix] Fresh admin token obtained');
        return data.data.token;
      }
    }
  } catch (error) {
    console.warn('[Auth Fix] Failed to get fresh token:', error);
  }
  return null;
}

/**
 * Sets up development mode authentication
 */
async function setupDevelopmentAuth() {
  if (import.meta.env.PROD) {
    console.log('[Auth Fix] Production mode, skipping auth setup');
    return;
  }
  
  console.log('[Auth Fix] Setting up development mode authentication');
  
  // Get fresh token from backend
  const freshToken = await getFreshAdminToken();
  
  if (freshToken) {
    // Store the authentication token
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, freshToken);
    
    // Set up the auth storage state
    const authData = {
      state: {
        token: freshToken,
        isAuthenticated: true,
        user: DEV_AUTH_CONFIG.user,
        isSuperuser: true,
        isAdmin: true
      }
    };
    
    // Store auth data in localStorage for persistence
    localStorage.setItem(STORAGE_KEYS.AUTH_STORAGE, JSON.stringify(authData));
  }
  
  // Set development mode flags
  localStorage.setItem(STORAGE_KEYS.BYPASS_AUTH_CHECK, 'true');
  localStorage.setItem(STORAGE_KEYS.ADMIN_ACCESS, 'true');
  localStorage.setItem(STORAGE_KEYS.SUPERUSER_OVERRIDE, 'true');
  localStorage.setItem(STORAGE_KEYS.ADMIN_API_KEY, 'doof-admin-secret-key-dev');
  
  // Clear any logout flags
  localStorage.removeItem('user_explicitly_logged_out');
  
  console.log('[Auth Fix] Development authentication configured');
}

/**
 * Initialize development authentication
 */
async function initializeAuthentication() {
  if (import.meta.env.DEV) {
    await setupDevelopmentAuth();
    
    // Dispatch event to notify components of authentication
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:login_complete', {
        detail: { 
          isAuthenticated: true,
          user: DEV_AUTH_CONFIG.user
        }
      }));
    }
  }
}

// Execute authentication initialization
initializeAuthentication();
