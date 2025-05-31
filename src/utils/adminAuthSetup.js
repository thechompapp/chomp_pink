/**
 * Admin Authentication Setup Utility
 * 
 * Fixes authentication issues identified by TDD analysis
 */

import { logInfo, logDebug, logWarn } from './logger';
import { toast } from 'react-hot-toast';

export class AdminAuthSetup {
  /**
   * Setup development mode authentication with real JWT tokens
   */
  static async setupDevelopmentAuth() {
    if (typeof window === 'undefined') return false;

    logInfo('[AdminAuthSetup] Setting up development authentication...');

    try {
      // Check if we're in development mode
      const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
      if (!isDev) {
        logWarn('[AdminAuthSetup] Not in development mode, skipping setup');
        return false;
      }

      // Perform actual login to get valid JWT tokens
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'doof123'
        })
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      }

      const loginData = await loginResponse.json();
      
      if (!loginData.success || !loginData.data?.token) {
        throw new Error('Invalid login response format');
      }

      const { token, user } = loginData.data;

      // Store the real JWT token using the tokenManager
      const tokenManager = (await import('@/services/auth/tokenManager')).default;
      tokenManager.setTokens({
        accessToken: token,
        refreshToken: `dev-refresh-${Date.now()}`, // Fake refresh token for development
        expiresIn: 3600 * 24 // 24 hours for development
      });

      // Store tokens in legacy locations for compatibility
      localStorage.setItem('authToken', token);
      localStorage.setItem('auth-token', token);
      
      // Store auth data in Zustand format
      const zustandAuthData = {
        state: {
          token: token,
          user: user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          refreshToken: null
        },
        version: 0
      };
      localStorage.setItem('auth-authentication-storage', JSON.stringify(zustandAuthData));
      
      // Store simple auth storage format
      const authStorage = {
        token: token,
        user: user,
        isAuthenticated: true,
        expiresAt: Date.now() + (3600 * 1000) // 1 hour
      };
      localStorage.setItem('auth-storage', JSON.stringify(authStorage));
      
      // Set admin access flags
      localStorage.setItem('admin_access_enabled', 'true');
      localStorage.setItem('superuser_override', 'true');
      localStorage.setItem('dev_admin_setup', 'true');
      
      // Store user data
      localStorage.setItem('userData', JSON.stringify(user));
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // DON'T clear logout flags - respect user's explicit logout intention
      // Only clear logout flags if this is NOT an explicit logout scenario
      const isExplicitLogout = localStorage.getItem('user_explicitly_logged_out') === 'true';
      const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
      
      if (!isExplicitLogout && !isE2ETesting) {
        localStorage.removeItem('user_explicitly_logged_out');
      }
      
      // Trigger auth state update events
      window.dispatchEvent(new CustomEvent('auth:token_updated', {
        detail: { token, user }
      }));
      
      // Trigger storage event for cross-tab sync
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth_access_token',
        newValue: token,
        oldValue: null,
        storageArea: localStorage
      }));
      
      logInfo('[AdminAuthSetup] Development authentication setup complete');
      return true;
    } catch (error) {
      console.error('[AdminAuthSetup] Failed to setup development auth:', error);
      toast.error(`Failed to setup development authentication: ${error.message}`);
      return false;
    }
  }

  /**
   * Restore development authentication after logout
   */
  static async restoreDevelopmentAuth() {
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    const wasSetup = localStorage.getItem('dev_admin_setup') === 'true';
    const isExplicitLogout = localStorage.getItem('user_explicitly_logged_out') === 'true';
    const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
    
    // Don't restore if user explicitly logged out or in E2E testing
    if (isExplicitLogout || isE2ETesting) {
      logInfo('[AdminAuthSetup] Not restoring development auth - explicit logout or E2E testing mode');
      return false;
    }
    
    if (isDev && wasSetup) {
      logInfo('[AdminAuthSetup] Restoring development authentication after system logout');
      return await this.setupDevelopmentAuth();
    }
    
    return false;
  }

  /**
   * Verify authentication state
   */
  static verifyAuthState() {
    if (typeof window === 'undefined') return { isValid: false, issues: ['No window object'] };

    const authToken = localStorage.getItem('authToken');
    const adminAccess = localStorage.getItem('admin_access_enabled');
    const superuserOverride = localStorage.getItem('superuser_override');
    const userData = localStorage.getItem('userData');

    const issues = [];
    
    if (!authToken) issues.push('Missing auth token');
    if (adminAccess !== 'true') issues.push('Admin access not enabled');
    if (superuserOverride !== 'true') issues.push('Superuser override not set');
    if (!userData) issues.push('Missing user data');

    return {
      isValid: issues.length === 0,
      issues,
      state: {
        authToken: authToken ? 'present' : 'missing',
        adminAccess,
        superuserOverride,
        userData: userData ? 'present' : 'missing',
      }
    };
  }

  /**
   * Test admin API access with better error handling
   */
  static async testAdminAccess() {
    const authToken = localStorage.getItem('authToken');
    
    try {
      // First check if backend is running
      const healthResponse = await fetch('http://localhost:5001/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!healthResponse.ok) {
        return {
          success: false,
          error: 'Backend server is not running on port 5001',
          status: healthResponse.status,
        };
      }

      // Test admin endpoint
      const response = await fetch('http://localhost:5001/api/admin/restaurants', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Admin-API-Key': 'doof-admin-secret-key-dev',
          'X-Superuser-Override': 'true',
          'X-Admin-Access': 'true',
          'Content-Type': 'application/json',
        },
      });

      logDebug('[AdminAuthSetup] Admin API test response:', response.status, response.statusText);

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      console.error('[AdminAuthSetup] Admin API test failed:', error);
      
      let errorMessage = error.message;
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Cannot connect to backend server. Make sure it\'s running on port 5001';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Clear all authentication state
   */
  static clearAuth() {
    if (typeof window === 'undefined') return;

    const keys = [
      'authToken',
      'admin_access_enabled', 
      'superuser_override',
      'admin_api_key',
      'userData',
      'refreshToken',
      'dev_admin_setup',
    ];

    keys.forEach(key => localStorage.removeItem(key));
    logInfo('[AdminAuthSetup] Authentication state cleared');
  }

  /**
   * Auto-fix authentication issues with better error handling
   */
  static async autoFix() {
    logInfo('[AdminAuthSetup] Starting auto-fix...');
    
    try {
      // 1. Verify current state
      const verification = this.verifyAuthState();
      logDebug('[AdminAuthSetup] Current state:', verification);

      // 2. Setup development auth if needed
      if (!verification.isValid) {
        logInfo('[AdminAuthSetup] Setting up development authentication...');
        const setupSuccess = await this.setupDevelopmentAuth();
        
        if (!setupSuccess) {
          return {
            success: false,
            error: 'Failed to setup development authentication',
            authState: verification,
            apiAccess: { success: false, error: 'Setup failed' }
          };
        }
      }

      // 3. Test API access
      const apiTest = await this.testAdminAccess();
      logDebug('[AdminAuthSetup] API test result:', apiTest);

      // 4. Final verification
      const finalVerification = this.verifyAuthState();
      
      const success = finalVerification.isValid && apiTest.success;
      
      if (success) {
        toast.success('Admin authentication setup successfully!');
      } else {
        toast.error('Admin authentication setup failed. Check console for details.');
      }
      
      return {
        success,
        authState: finalVerification,
        apiAccess: apiTest,
      };
    } catch (error) {
      console.error('[AdminAuthSetup] Auto-fix error:', error);
      toast.error('Error during authentication setup');
      
      return {
        success: false,
        error: error.message,
        authState: { isValid: false, issues: [error.message] },
        apiAccess: { success: false, error: error.message }
      };
    }
  }

  /**
   * Initialize development authentication system
   */
  static async initialize() {
    if (typeof window === 'undefined') return;
    
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (!isDev) return;

    // Setup authentication immediately
    await this.setupDevelopmentAuth();

    // Listen for logout events and restore auth ONLY if not explicitly logged out
    window.addEventListener('auth:logout_complete', async (event) => {
      // Check if this is an explicit logout by the user
      const isExplicitLogout = localStorage.getItem('user_explicitly_logged_out') === 'true';
      const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
      
      if (isExplicitLogout || isE2ETesting) {
        logInfo('[AdminAuthSetup] Explicit logout or E2E testing detected, NOT restoring development auth');
        return;
      }
      
      // Only restore if it was an automatic/system logout (not user-initiated)
      logInfo('[AdminAuthSetup] System logout detected, restoring development auth...');
      setTimeout(async () => {
        await this.restoreDevelopmentAuth();
      }, 100); // Small delay to let logout complete
    });

    // Listen for storage changes and maintain auth ONLY if not explicitly logged out
    window.addEventListener('storage', async (e) => {
      if (e.key === 'user_explicitly_logged_out' && e.newValue === 'true') {
        logInfo('[AdminAuthSetup] User explicitly logged out, NOT restoring development auth');
        return;
      }
      
      // Only restore for other storage changes if not explicitly logged out
      const isExplicitLogout = localStorage.getItem('user_explicitly_logged_out') === 'true';
      const isE2ETesting = localStorage.getItem('e2e_testing_mode') === 'true';
      
      if (!isExplicitLogout && !isE2ETesting) {
        logInfo('[AdminAuthSetup] Storage change detected, restoring development auth...');
        setTimeout(async () => {
          await this.restoreDevelopmentAuth();
        }, 200);
      }
    });

    logInfo('[AdminAuthSetup] Development authentication system initialized with explicit logout respect');
  }
}

// Auto-initialize in development mode
if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'development')) {
  AdminAuthSetup.initialize().catch(error => {
    console.error('[AdminAuthSetup] Initialization failed:', error);
  });
}

// Global utility for browser console access
if (typeof window !== 'undefined') {
  window.AdminAuthSetup = AdminAuthSetup;
} 