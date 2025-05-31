/**
 * Admin Authentication Testing Utilities
 * 
 * Browser console commands for debugging authentication issues
 */

import { AdminAuthSetup } from './adminAuthSetup';
import { toast } from 'react-hot-toast';

/**
 * Test admin authentication status
 * @returns {Object} Authentication test results
 */
const testAdminAuth = async () => {
  console.log('🔍 Testing admin authentication...');
  
  try {
    // 1. Check current auth state
    const authState = AdminAuthSetup.verifyAuthState();
    console.log('📊 Auth State:', authState);
    
    // 2. Test API access
    const apiTest = await AdminAuthSetup.testAdminAccess();
    console.log('🌐 API Test:', apiTest);
    
    // 3. Check localStorage flags
    const localStorage_flags = {
      authToken: localStorage.getItem('authToken') ? 'present' : 'missing',
      admin_access_enabled: localStorage.getItem('admin_access_enabled'),
      superuser_override: localStorage.getItem('superuser_override'),
      userData: localStorage.getItem('userData') ? 'present' : 'missing',
      dev_admin_setup: localStorage.getItem('dev_admin_setup'),
    };
    console.log('💾 LocalStorage Flags:', localStorage_flags);
    
    // 4. Overall status
    const overallStatus = authState.isValid && apiTest.success;
    console.log(`✅ Overall Status: ${overallStatus ? 'WORKING' : 'NEEDS FIXING'}`);
    
    if (!overallStatus) {
      console.log('🔧 Run fixAdminAuth() to attempt automatic fix');
    }
    
    return {
      authState,
      apiTest,
      localStorage_flags,
      overallStatus
    };
    
  } catch (error) {
    console.error('❌ Error testing admin auth:', error);
    return { error: error.message };
  }
};

/**
 * Fix admin authentication automatically
 * @returns {Object} Fix results
 */
const fixAdminAuth = async () => {
  console.log('🔧 Attempting to fix admin authentication...');
  
  try {
    const result = await AdminAuthSetup.autoFix();
    
    if (result.success) {
      console.log('✅ Admin authentication fixed successfully!');
      toast.success('Admin authentication fixed!');
      
      // Test again to confirm
      setTimeout(async () => {
        const testResult = await testAdminAuth();
        if (testResult.overallStatus) {
          console.log('🎉 Confirmed: Authentication is now working!');
        } else {
          console.warn('⚠️ Fix completed but issues remain');
        }
      }, 1000);
      
    } else {
      console.error('❌ Failed to fix admin authentication:', result.error);
      toast.error(`Fix failed: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error during fix:', error);
    toast.error('Error during authentication fix');
    return { success: false, error: error.message };
  }
};

/**
 * Reset admin authentication (clear all auth data)
 * @returns {void}
 */
const resetAdminAuth = async () => {
  console.log('🗑️ Resetting admin authentication...');
  
  try {
    AdminAuthSetup.clearAuth();
    console.log('✅ Admin authentication reset complete');
    toast.success('Authentication reset');
    
    // Setup fresh auth in development
    if (import.meta.env.DEV) {
      setTimeout(async () => {
        await AdminAuthSetup.setupDevelopmentAuth();
        console.log('🔄 Fresh development authentication setup');
      }, 500);
    }
    
  } catch (error) {
    console.error('❌ Error resetting admin auth:', error);
    toast.error('Error resetting authentication');
  }
};

/**
 * Check current admin authentication status (simple version)
 * @returns {Object} Simple status check
 */
const checkAdminAuth = () => {
  console.log('📋 Quick admin auth check...');
  
  const hasAuthToken = !!localStorage.getItem('authToken');
  const hasAdminAccess = localStorage.getItem('admin_access_enabled') === 'true';
  const hasSuperuserOverride = localStorage.getItem('superuser_override') === 'true';
  const hasUserData = !!localStorage.getItem('userData');
  
  const status = {
    hasAuthToken,
    hasAdminAccess,
    hasSuperuserOverride,
    hasUserData,
    allGood: hasAuthToken && hasAdminAccess && hasSuperuserOverride && hasUserData
  };
  
  console.table(status);
  
  if (status.allGood) {
    console.log('✅ All authentication flags are set');
  } else {
    console.log('❌ Some authentication flags are missing');
    console.log('🔧 Run fixAdminAuth() to fix');
  }
  
  return status;
};

/**
 * Debug backend connectivity
 * @returns {Object} Connectivity test results
 */
const debugBackend = async () => {
  console.log('🌐 Testing backend connectivity...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:5001/api/health');
    const healthData = await healthResponse.json();
    
    console.log('🏥 Health check:', healthResponse.ok ? '✅ OK' : '❌ FAILED');
    console.log('📊 Health data:', healthData);
    
    // Test admin endpoint with auth
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      const adminResponse = await fetch('http://localhost:5001/api/admin/restaurants', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Admin-API-Key': 'doof-admin-secret-key-dev',
          'X-Superuser-Override': 'true',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🔐 Admin endpoint:', adminResponse.ok ? '✅ OK' : '❌ FAILED');
      console.log('📊 Admin response status:', adminResponse.status, adminResponse.statusText);
    } else {
      console.log('🔐 Admin endpoint: ⚠️ SKIPPED (no auth token)');
    }
    
    return {
      health: { ok: healthResponse.ok, data: healthData },
      admin: authToken ? { 
        ok: adminResponse.ok, 
        status: adminResponse.status, 
        statusText: adminResponse.statusText 
      } : { skipped: true }
    };
    
  } catch (error) {
    console.error('❌ Backend connectivity error:', error);
    return { error: error.message };
  }
};

/**
 * Get comprehensive authentication report
 * @returns {Object} Comprehensive auth report
 */
const getAuthReport = async () => {
  console.log('📋 Generating comprehensive authentication report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      isDevelopment: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      url: window.location.href,
    },
    authentication: AdminAuthSetup.verifyAuthState(),
    backend: await debugBackend(),
    localStorage: {
      authToken: localStorage.getItem('authToken') ? '✅ Present' : '❌ Missing',
      admin_access_enabled: localStorage.getItem('admin_access_enabled') || '❌ Missing',
      superuser_override: localStorage.getItem('superuser_override') || '❌ Missing',
      userData: localStorage.getItem('userData') ? '✅ Present' : '❌ Missing',
      dev_admin_setup: localStorage.getItem('dev_admin_setup') || '❌ Missing',
    }
  };
  
  console.log('📊 Authentication Report:');
  console.table(report.localStorage);
  console.log('🔍 Full Report:', report);
  
  return report;
};

// Expose functions globally for browser console access
if (typeof window !== 'undefined') {
  // Main testing functions
  window.testAdminAuth = testAdminAuth;
  window.fixAdminAuth = fixAdminAuth;
  window.resetAdminAuth = resetAdminAuth;
  window.checkAdminAuth = checkAdminAuth;
  
  // Debug functions
  window.debugBackend = debugBackend;
  window.getAuthReport = getAuthReport;
  
  // Admin auth utilities
  window.AdminAuthSetup = AdminAuthSetup;
  
  // Convenience aliases
  window.authTest = testAdminAuth;
  window.authFix = fixAdminAuth;
  window.authReset = resetAdminAuth;
  window.authCheck = checkAdminAuth;
  
  console.log(`
🛠️ Admin Authentication Testing Utilities Loaded!

Available commands:
  testAdminAuth()   - Test current auth status
  fixAdminAuth()    - Auto-fix authentication issues  
  resetAdminAuth()  - Reset and recreate auth
  checkAdminAuth()  - Quick status check
  debugBackend()    - Test backend connectivity
  getAuthReport()   - Comprehensive auth report

Aliases:
  authTest(), authFix(), authReset(), authCheck()

Try: testAdminAuth() to get started!
  `);
}

export {
  testAdminAuth,
  fixAdminAuth,
  resetAdminAuth,
  checkAdminAuth,
  debugBackend,
  getAuthReport,
}; 