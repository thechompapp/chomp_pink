/**
 * Admin Authentication Setup Utility
 * 
 * Fixes authentication issues identified by TDD analysis
 */

import { logInfo, logDebug } from './logger';

export class AdminAuthSetup {
  /**
   * Setup development mode authentication
   */
  static setupDevelopmentAuth() {
    if (typeof window === 'undefined') return false;

    logInfo('[AdminAuthSetup] Setting up development authentication...');

    try {
      // Set auth token
      localStorage.setItem('authToken', 'dev-admin-token-123');
      
      // Set admin access flags
      localStorage.setItem('admin_access_enabled', 'true');
      localStorage.setItem('superuser_override', 'true');
      localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
      
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
      };
      
      localStorage.setItem('userData', JSON.stringify(devUser));
      
      logInfo('[AdminAuthSetup] Development authentication setup complete');
      return true;
    } catch (error) {
      console.error('[AdminAuthSetup] Failed to setup development auth:', error);
      return false;
    }
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
   * Test admin API access
   */
  static async testAdminAccess() {
    const authToken = localStorage.getItem('authToken');
    
    try {
      const response = await fetch('http://localhost:5001/api/admin/restaurants', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Admin-API-Key': 'doof-admin-secret-key-dev',
          'X-Superuser-Override': 'true',
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
      return {
        success: false,
        error: error.message,
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
    ];

    keys.forEach(key => localStorage.removeItem(key));
    logInfo('[AdminAuthSetup] Authentication state cleared');
  }

  /**
   * Auto-fix authentication issues
   */
  static async autoFix() {
    logInfo('[AdminAuthSetup] Starting auto-fix...');
    
    // 1. Verify current state
    const verification = this.verifyAuthState();
    logDebug('[AdminAuthSetup] Current state:', verification);

    // 2. Setup development auth if needed
    if (!verification.isValid) {
      logInfo('[AdminAuthSetup] Setting up development authentication...');
      this.setupDevelopmentAuth();
    }

    // 3. Test API access
    const apiTest = await this.testAdminAccess();
    logDebug('[AdminAuthSetup] API test result:', apiTest);

    // 4. Final verification
    const finalVerification = this.verifyAuthState();
    
    return {
      success: finalVerification.isValid && apiTest.success,
      authState: finalVerification,
      apiAccess: apiTest,
    };
  }
}

// Global utility for browser console access
if (typeof window !== 'undefined') {
  window.AdminAuthSetup = AdminAuthSetup;
} 