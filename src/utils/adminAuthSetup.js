/**
 * Admin Authentication Setup Utility
 * 
 * Fixes authentication issues identified by TDD analysis
 */

import { logInfo, logDebug, logWarn } from './logger';
import { toast } from 'react-hot-toast';

export class AdminAuthSetup {
  /**
   * Setup development mode authentication with persistence
   */
  static setupDevelopmentAuth() {
    if (typeof window === 'undefined') return false;

    logInfo('[AdminAuthSetup] Setting up development authentication...');

    try {
      // Check if we're in development mode
      const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
      if (!isDev) {
        logWarn('[AdminAuthSetup] Not in development mode, skipping setup');
        return false;
      }

      // Set auth token
      localStorage.setItem('authToken', 'dev-admin-token-123');
      
      // Set admin access flags with persistence markers
      localStorage.setItem('admin_access_enabled', 'true');
      localStorage.setItem('superuser_override', 'true');
      localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
      localStorage.setItem('dev_admin_setup', 'true'); // Marker for development setup
      
      // Set fake user data for development
      const devUser = {
        id: 1,
        username: 'admin',
        email: 'admin@doof.dev',
        is_superuser: true,
        is_staff: true,
        first_name: 'Admin',
        last_name: 'User',
        created_at: new Date().toISOString(),
        account_type: 'superuser',
        role: 'admin',
      };
      
      localStorage.setItem('userData', JSON.stringify(devUser));
      
      // Clear any logout flags
      localStorage.removeItem('user_explicitly_logged_out');
      
      logInfo('[AdminAuthSetup] Development authentication setup complete');
      return true;
    } catch (error) {
      console.error('[AdminAuthSetup] Failed to setup development auth:', error);
      toast.error('Failed to setup development authentication');
      return false;
    }
  }

  /**
   * Restore development authentication after logout
   */
  static restoreDevelopmentAuth() {
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    const wasSetup = localStorage.getItem('dev_admin_setup') === 'true';
    
    if (isDev && wasSetup) {
      logInfo('[AdminAuthSetup] Restoring development authentication after logout');
      return this.setupDevelopmentAuth();
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
        const setupSuccess = this.setupDevelopmentAuth();
        
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
  static initialize() {
    if (typeof window === 'undefined') return;
    
    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (!isDev) return;

    // Setup authentication immediately
    this.setupDevelopmentAuth();

    // Listen for logout events and restore auth
    window.addEventListener('auth:logout_complete', () => {
      logInfo('[AdminAuthSetup] Logout detected, restoring development auth...');
      setTimeout(() => {
        this.restoreDevelopmentAuth();
      }, 100); // Small delay to let logout complete
    });

    // Listen for storage changes and maintain auth
    window.addEventListener('storage', (e) => {
      if (e.key === 'user_explicitly_logged_out' && e.newValue === 'true') {
        logInfo('[AdminAuthSetup] Explicit logout detected, restoring development auth...');
        setTimeout(() => {
          this.restoreDevelopmentAuth();
        }, 200);
      }
    });

    logInfo('[AdminAuthSetup] Development authentication system initialized');
  }
}

// Auto-initialize in development mode
if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'development')) {
  AdminAuthSetup.initialize();
}

// Global utility for browser console access
if (typeof window !== 'undefined') {
  window.AdminAuthSetup = AdminAuthSetup;
} 