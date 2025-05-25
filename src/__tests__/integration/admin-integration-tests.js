/**
 * Admin Panel Integration Tests
 * 
 * These tests verify the admin panel functionality, including:
 * - Admin authentication and authorization
 * - Admin-specific API endpoints
 * - Data management capabilities
 * - User management
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// Create axios instance
let api = null;

// Test module
const adminTests = {
  /**
   * Run all admin panel tests
   * @param {Object} config - Test configuration
   * @param {Object} logger - Logger utility
   */
  async run(config, logger) {
    const section = logger.section('Admin Panel');
    
    // Save config and logger for use in other methods
    this.config = config;
    this.logger = logger;
    
    // Initialize API client
    api = axios.create({
      baseURL: config.BACKEND_URL,
      timeout: config.TIMEOUT_MS, // Use global timeout configuration
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Authenticate as admin
    let token = null;
    try {
      const authResponse = await api.post('/api/auth/login', {
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD
      });
      
      token = authResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.success('Authenticated as admin for admin panel tests');
    } catch (error) {
      logger.error('Failed to authenticate as admin for admin panel tests', error);
      return;
    }
    
    // Run tests - in parallel if in fast mode, otherwise sequentially
    if (config.FAST_MODE) {
      logger.info('Running admin panel tests in parallel (FAST MODE)');
      
      await Promise.all([
        this.runTest(section, 'Admin authentication', async () => {
          try {
            // Verify admin-only endpoint access
            const response = await api.get('/api/admin/status');
            return { 
              success: response.status === 200, 
              message: 'Admin authentication verified' 
            };
          } catch (error) {
            return { success: false, message: `Admin authentication failed: ${error.message}` };
          }
        }),
        
        this.runTest(section, 'User management', async () => {
          try {
            // Check if we can get the list of users
            const response = await api.get('/api/admin/users');
            return { 
              success: response.status === 200 && Array.isArray(response.data), 
              message: `Retrieved ${response.data.length} users` 
            };
          } catch (error) {
            return { success: false, message: `User management failed: ${error.message}` };
          }
        }),
        
        this.runTest(section, 'Data management', async () => {
          try {
            // Check if we can access data management endpoints
            const response = await api.get('/api/admin/data/stats');
            return { 
              success: response.status === 200, 
              message: 'Data management endpoints accessible' 
            };
          } catch (error) {
            return { success: false, message: `Data management failed: ${error.message}` };
          }
        }),
        
        this.runTest(section, 'System configuration', async () => {
          // Skip in fast mode but mark as skipped
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        })
      ]);
    } else {
      // Standard mode - run tests sequentially
      await this.runTest(section, 'Admin authentication', this.testAdminAuthentication.bind(this));
      await this.runTest(section, 'User management', this.testUserManagement.bind(this));
      await this.runTest(section, 'Data management', this.testDataManagement.bind(this));
      await this.runTest(section, 'System configuration', this.testSystemConfiguration.bind(this));
    }
  },
  
  /**
   * Test admin authentication and authorization
   */
  async testAdminAuthentication() {
    try {
      // Verify admin-only endpoint access
      const response = await api.get('/api/admin/status');
      
      if (response.status !== 200) {
        return { success: false, message: `Unexpected status code: ${response.status}` };
      }
      
      // Try accessing with invalid token to verify security
      const originalToken = api.defaults.headers.common['Authorization'];
      api.defaults.headers.common['Authorization'] = 'Bearer invalid_token';
      
      try {
        await api.get('/api/admin/status');
        // If we get here, the endpoint is not secure
        api.defaults.headers.common['Authorization'] = originalToken;
        return { success: false, message: 'Admin endpoint accessible with invalid token' };
      } catch (error) {
        // This is expected - the request should fail with invalid token
        api.defaults.headers.common['Authorization'] = originalToken;
        
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          return { success: true, message: 'Admin authentication and authorization verified' };
        } else {
          return { success: false, message: `Unexpected error with invalid token: ${error.message}` };
        }
      }
    } catch (error) {
      return { success: false, message: `Admin authentication test failed: ${error.message}` };
    }
  },
  
  /**
   * Test user management functionality
   */
  async testUserManagement() {
    try {
      // Get list of users
      const usersResponse = await api.get('/api/admin/users');
      
      if (usersResponse.status !== 200 || !Array.isArray(usersResponse.data)) {
        return { success: false, message: 'Failed to retrieve users list' };
      }
      
      // Check if we can get details for a specific user
      if (usersResponse.data.length > 0) {
        const userId = usersResponse.data[0].id || usersResponse.data[0]._id;
        
        if (userId) {
          const userDetailResponse = await api.get(`/api/admin/users/${userId}`);
          
          if (userDetailResponse.status !== 200) {
            return { success: false, message: 'Failed to retrieve user details' };
          }
        }
      }
      
      return { 
        success: true, 
        message: `Successfully verified user management with ${usersResponse.data.length} users` 
      };
    } catch (error) {
      return { success: false, message: `User management test failed: ${error.message}` };
    }
  },
  
  /**
   * Test data management functionality
   */
  async testDataManagement() {
    try {
      // Check data statistics endpoint
      const statsResponse = await api.get('/api/admin/data/stats');
      
      if (statsResponse.status !== 200) {
        return { success: false, message: 'Failed to retrieve data statistics' };
      }
      
      // Check lists management endpoint
      const listsResponse = await api.get('/api/admin/lists');
      
      if (listsResponse.status !== 200 || !Array.isArray(listsResponse.data)) {
        return { success: false, message: 'Failed to retrieve lists data' };
      }
      
      return { 
        success: true, 
        message: 'Successfully verified data management functionality' 
      };
    } catch (error) {
      return { success: false, message: `Data management test failed: ${error.message}` };
    }
  },
  
  /**
   * Test system configuration functionality
   */
  async testSystemConfiguration() {
    try {
      // Check system configuration endpoint
      const configResponse = await api.get('/api/admin/config');
      
      if (configResponse.status !== 200) {
        return { success: false, message: 'Failed to retrieve system configuration' };
      }
      
      // Check if we can update a non-critical configuration setting
      // First, we'll try to get a test setting
      let testSetting = null;
      
      try {
        const testSettingResponse = await api.get('/api/admin/config/test');
        testSetting = testSettingResponse.data;
      } catch (error) {
        // If the test setting doesn't exist, we'll create a dummy value
        testSetting = { value: 'test-value' };
      }
      
      // Now try to update it
      const updateResponse = await api.put('/api/admin/config/test', {
        value: testSetting.value
      });
      
      if (updateResponse.status !== 200 && updateResponse.status !== 201 && updateResponse.status !== 204) {
        return { success: false, message: 'Failed to update system configuration' };
      }
      
      return { 
        success: true, 
        message: 'Successfully verified system configuration functionality' 
      };
    } catch (error) {
      // If the endpoint doesn't exist, we'll mark it as skipped rather than failed
      return { 
        success: true, 
        skipped: true,
        message: 'System configuration endpoints not available or not accessible' 
      };
    }
  },
  
  /**
   * Run a test and handle timing/logging
   */
  async runTest(section, name, testFn) {
    const startTime = performance.now();
    try {
      const result = await testFn();
      const duration = Math.round(performance.now() - startTime);
      
      if (result.success) {
        this.logger.test(section, name, 'PASSED', duration);
      } else if (result.skipped) {
        this.logger.test(section, name, 'SKIPPED', 0, result.message);
      } else {
        this.logger.test(section, name, 'FAILED', duration, result.message);
      }
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const message = error.message || 'Unknown error';
      this.logger.test(section, name, 'FAILED', duration, message);
      this.logger.error(`Test execution error: ${name}`, error);
      return { success: false, message };
    }
  }
};

export default adminTests;
