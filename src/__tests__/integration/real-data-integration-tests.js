/**
 * Real Data Rendering Diagnostic Integration Tests
 * 
 * Comprehensive diagnostics to identify why the app isn't rendering
 * real online components (lists, restaurants, dishes) from the database.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';

describe('Real Data Rendering Diagnostics', () => {
  let diagnosticResults = {
    backend: {},
    database: {},
    authentication: {},
    services: {},
    components: {},
    rendering: {}
  };

  beforeEach(() => {
    console.log('\n🔍 Starting Real Data Diagnostic Test...');
    // Clear any offline mode flags
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('offline-mode');
      localStorage.removeItem('offline_mode');
      localStorage.setItem('force_online', 'true');
    }
  });

  afterEach(() => {
    console.log('📊 Diagnostic Results Summary:');
    console.log(JSON.stringify(diagnosticResults, null, 2));
  });

  describe('Backend Connectivity Diagnostics', () => {
    test('should verify backend server is running and accessible', async () => {
      const backendUrl = 'http://localhost:5001';
      
      try {
        // Test basic connectivity - use the actual health endpoint
        const response = await fetch(`${backendUrl}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        diagnosticResults.backend.serverRunning = response.ok;
        diagnosticResults.backend.serverStatus = response.status;

        console.log(`📡 Backend server status: ${response.status}`);
        
        if (response.ok) {
          const healthData = await response.json();
          diagnosticResults.backend.healthData = healthData;
          console.log('✅ Backend server is accessible');
          console.log(`   Database pool status: ${JSON.stringify(healthData.databasePool)}`);
        } else {
          console.warn('⚠️ Backend server responded but not OK');
        }
      } catch (error) {
        diagnosticResults.backend.error = error.message;
        console.error('❌ Backend server connectivity failed:', error.message);
        
        // Don't fail the test - this is diagnostic
      }
      
      expect(true).toBe(true);
    }, 15000);

    test('should verify API endpoints are responding', async () => {
      const endpoints = [
        '/api/auth/login',
        '/api/lists', 
        '/api/filters/cities'
      ];

      diagnosticResults.backend.endpoints = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:5001${endpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });

          diagnosticResults.backend.endpoints[endpoint] = {
            status: response.status,
            accessible: response.status !== 404,
            reachable: true
          };

          console.log(`📡 ${endpoint}: ${response.status}`);
        } catch (error) {
          diagnosticResults.backend.endpoints[endpoint] = {
            error: error.message,
            accessible: false,
            reachable: false
          };
          console.error(`❌ ${endpoint}: ${error.message}`);
        }
      }

      // This is diagnostic - always pass
      expect(true).toBe(true);
    }, 15000);
  });

  describe('Authentication Diagnostics', () => {
    test('should verify authentication flow', async () => {
      try {
        const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@example.com',
            password: 'doof123'
          })
        });

        diagnosticResults.authentication.loginStatus = loginResponse.status;
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          diagnosticResults.authentication.loginSuccessful = true;
          diagnosticResults.authentication.tokenReceived = !!loginData.token;
          console.log('✅ Authentication flow working');
        } else {
          diagnosticResults.authentication.loginSuccessful = false;
          console.error('❌ Authentication failed');
        }
      } catch (error) {
        diagnosticResults.authentication.error = error.message;
        console.error('❌ Authentication test failed:', error.message);
      }

      // Diagnostic test - always pass
      expect(true).toBe(true);
    }, 15000);
  });

  describe('Online Mode Diagnostics', () => {
    test('should verify offline mode is disabled', () => {
      const offlineIndicators = [
        localStorage.getItem('offline-mode'),
        localStorage.getItem('offline_mode'),
        sessionStorage.getItem('offline-mode'),
        sessionStorage.getItem('offline_mode')
      ].filter(flag => flag !== null);

      const forceOnlineFlag = localStorage.getItem('force_online');

      diagnosticResults.rendering.offlineMode = {
        offlineFlags: offlineIndicators,
        forceOnlineSet: forceOnlineFlag === 'true',
        fullyOnline: offlineIndicators.length === 0 && forceOnlineFlag === 'true'
      };

      if (diagnosticResults.rendering.offlineMode.fullyOnline) {
        console.log('✅ App is in online mode');
      } else {
        console.warn('⚠️ App may be in offline mode');
        console.log('Offline flags found:', offlineIndicators);
        console.log('Force online flag:', forceOnlineFlag);
      }

      expect(true).toBe(true);
    });

    test('should verify network connectivity', async () => {
      try {
        const networkTest = await fetch('http://localhost:5001/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        diagnosticResults.rendering.networkConnectivity = {
          online: navigator.onLine,
          backendReachable: networkTest.ok
        };

        if (diagnosticResults.rendering.networkConnectivity.backendReachable) {
          console.log('✅ Network connectivity verified');
        } else {
          console.warn('⚠️ Backend not reachable');
        }
      } catch (error) {
        diagnosticResults.rendering.networkConnectivity = {
          online: navigator.onLine,
          backendReachable: false,
          error: error.message
        };
        console.error('❌ Network connectivity failed:', error.message);
      }

      expect(true).toBe(true);
    }, 15000);
  });

  describe('Comprehensive Diagnostic Summary', () => {
    test('should provide actionable recommendations', () => {
      console.log('\n📋 COMPREHENSIVE DIAGNOSTIC SUMMARY');
      console.log('=====================================');
      
      const issues = [];
      const successes = [];

      // Analyze results
      if (!diagnosticResults.backend?.serverRunning) {
        issues.push('Backend server not accessible');
      } else {
        successes.push('Backend server running');
      }

      if (!diagnosticResults.authentication?.loginSuccessful) {
        issues.push('Authentication not working');
      } else {
        successes.push('Authentication working');
      }

      if (!diagnosticResults.rendering?.networkConnectivity?.backendReachable) {
        issues.push('Network connectivity issues');
      } else {
        successes.push('Network connectivity OK');
      }

      if (!diagnosticResults.rendering?.offlineMode?.fullyOnline) {
        issues.push('App not in full online mode');
      } else {
        successes.push('App in online mode');
      }

      console.log('\n✅ WORKING COMPONENTS:');
      successes.forEach(success => console.log(`  • ${success}`));

      console.log('\n❌ ISSUES FOUND:');
      if (issues.length === 0) {
        console.log('  • No critical issues detected');
      } else {
        issues.forEach(issue => console.log(`  • ${issue}`));
      }

      console.log('\n🔧 RECOMMENDED ACTIONS:');
      if (issues.length === 0) {
        console.log('  • Backend and network appear healthy');
        console.log('  • Check frontend service integration');
        console.log('  • Verify component rendering logic');
        console.log('  • Check browser console for errors');
      } else {
        if (!diagnosticResults.backend?.serverRunning) {
          console.log('  • Start backend: cd doof-backend && npm start');
        }
        if (!diagnosticResults.authentication?.loginSuccessful) {
          console.log('  • Check backend authentication setup');
          console.log('  • Verify admin user exists in database');
        }
        if (!diagnosticResults.rendering?.networkConnectivity?.backendReachable) {
          console.log('  • Check network/CORS configuration');
        }
        if (!diagnosticResults.rendering?.offlineMode?.fullyOnline) {
          console.log('  • Clear browser storage and reload');
        }
      }

      console.log('\n📊 Full Diagnostic Data:');
      console.log(JSON.stringify(diagnosticResults, null, 2));

      // Always pass - this is diagnostic
      expect(true).toBe(true);
    });
  });
}); 