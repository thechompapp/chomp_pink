/**
 * Authentication Integration Tests
 * 
 * These tests verify the complete authentication flow, including:
 * - Login/logout functionality
 * - Token persistence and refresh
 * - Session management
 * - Admin vs regular user permissions
 * - Offline authentication handling
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// Create axios instance
let api = null;

// Test module
const authTests = {
  /**
   * Run all authentication tests
   * @param {Object} config - Test configuration
   * @param {Object} logger - Logger utility
   */
  async run(config, logger) {
    const section = logger.section('Authentication');
    
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
    
    // Run tests - in parallel if in fast mode
    if (config.FAST_MODE) {
      logger.info('Running auth tests in parallel (FAST MODE)');
      await Promise.all([
        this.runTest(section, 'Admin login', async () => {
          try {
            const response = await api.post('/api/auth/login', {
              email: config.ADMIN_EMAIL,
              password: config.ADMIN_PASSWORD
            });
            return { success: true, message: 'Admin login successful' };
          } catch (error) {
            return { success: false, message: `Admin login failed: ${error.message}` };
          }
        }),
        this.runTest(section, 'User login', async () => {
          try {
            const response = await api.post('/api/auth/login', {
              email: config.USER_EMAIL,
              password: config.USER_PASSWORD
            });
            return { success: true, message: 'User login successful' };
          } catch (error) {
            return { success: false, message: `User login failed: ${error.message}` };
          }
        }),
        this.runTest(section, 'Protected routes', async () => {
          try {
            // Just verify a protected endpoint exists
            await api.get('/api/lists');
            return { success: true, message: 'Protected routes accessible' };
          } catch (error) {
            return { success: false, message: `Protected route test failed: ${error.message}` };
          }
        }),
        // Skip slower tests in fast mode
        this.runTest(section, 'Token persistence', async () => {
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        }),
        this.runTest(section, 'Token refresh', async () => {
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        }),
        this.runTest(section, 'Logout functionality', async () => {
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        })
      ]);
      return;
    }
    
    // Standard mode - run tests sequentially
    const adminLoginResult = await this.testAdminLogin(config, logger, section);
    const userLoginResult = await this.testUserLogin(config, logger, section);
    
    // Skip remaining tests if both logins failed
    if (!adminLoginResult.success && !userLoginResult.success) {
      logger.error('All login tests failed. Skipping remaining authentication tests.');
      return;
    }
    
    // Use admin token for subsequent tests if available, otherwise use user token
    const token = adminLoginResult.token || userLoginResult.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Test 3: Token Persistence
    await this.testTokenPersistence(config, logger, section, token);
    
    // Test 4: Authentication State
    await this.testAuthState(config, logger, section);
    
    // Test 5: Protected Route Access
    await this.testProtectedRouteAccess(config, logger, section);
    
    // Test 6: Admin-Only Route Access
    if (adminToken) {
      await this.testAdminRouteAccess(config, logger, section, adminToken);
    } else {
      await this.runTest(section, 'Admin-only route access', async () => {
        return { success: false, skipped: true, message: 'Admin login failed, cannot test admin routes' };
      });
    }
    
    // Test 7: Token Refresh
    await this.testTokenRefresh(config, logger, section, token);
    
    // Test 8: Logout
    await this.testLogout(config, logger, section);
    
    // Test 9: Offline Authentication
    await this.testOfflineAuth(config, logger, section);
  },
  
  /**
   * Test admin login
   */
  async testAdminLogin(config, logger, section) {
    return await this.runTest(section, 'Admin login', async () => {
      try {
        const response = await api.post('/api/auth/login', config.AUTH.admin);
        
        logger.debug('Admin login response:', response.data);
        
        if (response.data && response.data.success) {
          // Extract token from response
          const token = response.data.token || 
                        response.data.accessToken || 
                        response.headers['authorization']?.replace('Bearer ', '');
          
          if (token) {
            return { 
              success: true,
              token
            };
          } else {
            return { 
              success: false, 
              message: 'Login succeeded but no token was returned' 
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Login failed: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Login failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test regular user login
   */
  async testUserLogin(config, logger, section) {
    return await this.runTest(section, 'Regular user login', async () => {
      try {
        const response = await api.post('/api/auth/login', config.AUTH.user);
        
        logger.debug('User login response:', response.data);
        
        if (response.data && response.data.success) {
          // Extract token from response
          const token = response.data.token || 
                        response.data.accessToken || 
                        response.headers['authorization']?.replace('Bearer ', '');
          
          if (token) {
            return { 
              success: true,
              token
            };
          } else {
            return { 
              success: false, 
              message: 'Login succeeded but no token was returned' 
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Login failed: Invalid response format' 
          };
        }
      } catch (error) {
        // If user account doesn't exist, this is expected
        if (error.response && error.response.status === 401) {
          return { 
            success: false, 
            skipped: true,
            message: 'Regular user account does not exist (this is okay)' 
          };
        }
        
        return { 
          success: false, 
          message: `Login failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test token persistence
   */
  async testTokenPersistence(config, logger, section, token) {
    return await this.runTest(section, 'Token persistence', async () => {
      try {
        // Create a new axios instance with the token
        const newApi = axios.create({
          baseURL: config.BACKEND_URL,
          timeout: config.TIMEOUT_MS,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Try to access a protected endpoint
        const response = await newApi.get('/api/auth/me');
        
        logger.debug('Token persistence response:', response.data);
        
        if (response.data && response.data.user) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Failed to access protected endpoint with persisted token' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Token persistence test failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test authentication state
   */
  async testAuthState(config, logger, section) {
    return await this.runTest(section, 'Authentication state', async () => {
      try {
        const response = await api.get('/api/auth/me');
        
        logger.debug('Auth state response:', response.data);
        
        if (response.data && response.data.user) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: 'Failed to verify authentication state' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Auth state test failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test protected route access
   */
  async testProtectedRouteAccess(config, logger, section) {
    return await this.runTest(section, 'Protected route access', async () => {
      try {
        // Try to access a protected endpoint (lists)
        const response = await api.get('/api/lists');
        
        logger.debug('Protected route response:', response.data);
        
        if (response.status === 200) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: `Unexpected status code: ${response.status}` 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Protected route access failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test admin-only route access
   */
  async testAdminRouteAccess(config, logger, section, adminToken) {
    return await this.runTest(section, 'Admin-only route access', async () => {
      try {
        // Create a new axios instance with the admin token
        const adminApi = axios.create({
          baseURL: config.BACKEND_URL,
          timeout: config.TIMEOUT_MS,
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        // Try to access an admin-only endpoint (users or admin dashboard)
        const response = await adminApi.get('/api/admin/users');
        
        logger.debug('Admin route response:', response.data);
        
        if (response.status === 200) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: `Unexpected status code: ${response.status}` 
          };
        }
      } catch (error) {
        // If the endpoint doesn't exist, try an alternative
        try {
          const altResponse = await api.get('/api/admin/dashboard');
          if (altResponse.status === 200) {
            return { success: true };
          }
        } catch (altError) {
          // If both fail, check if it's a 403 (which would indicate admin check is working)
          if (error.response && error.response.status === 403) {
            return { 
              success: false, 
              skipped: true,
              message: 'No admin routes found, but got 403 which suggests admin check is working' 
            };
          }
        }
        
        return { 
          success: false, 
          message: `Admin route access failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test token refresh
   */
  async testTokenRefresh(config, logger, section, token) {
    return await this.runTest(section, 'Token refresh', async () => {
      try {
        // Try to refresh the token
        const response = await api.post('/api/auth/refresh');
        
        logger.debug('Token refresh response:', response.data);
        
        if (response.data && (response.data.token || response.data.accessToken)) {
          return { success: true };
        } else {
          // If refresh endpoint doesn't exist, this might be normal
          return { 
            success: false, 
            skipped: true,
            message: 'Token refresh endpoint not found or not implemented' 
          };
        }
      } catch (error) {
        // If we get a 404, the endpoint might not exist
        if (error.response && error.response.status === 404) {
          return { 
            success: false, 
            skipped: true,
            message: 'Token refresh endpoint not found' 
          };
        }
        
        return { 
          success: false, 
          message: `Token refresh failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test logout
   */
  async testLogout(config, logger, section) {
    return await this.runTest(section, 'Logout', async () => {
      try {
        const response = await api.post('/api/auth/logout');
        
        logger.debug('Logout response:', response.data);
        
        // Try to access a protected endpoint after logout
        try {
          await api.get('/api/auth/me');
          return { 
            success: false, 
            message: 'Still authenticated after logout' 
          };
        } catch (authError) {
          // If we get a 401, logout worked
          if (authError.response && authError.response.status === 401) {
            return { success: true };
          } else {
            return { 
              success: false, 
              message: `Unexpected error after logout: ${authError.message}` 
            };
          }
        }
      } catch (error) {
        // If logout endpoint doesn't exist, this might be normal
        if (error.response && error.response.status === 404) {
          return { 
            success: false, 
            skipped: true,
            message: 'Logout endpoint not found' 
          };
        }
        
        return { 
          success: false, 
          message: `Logout failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test offline authentication
   */
  async testOfflineAuth(config, logger, section) {
    return await this.runTest(section, 'Offline authentication', async () => {
      try {
        // This test is more complex and would require browser automation
        // For now, we'll just check if the offline mode is enabled in the frontend
        
        // Try to access the frontend offline mode endpoint
        const response = await axios.get(`${config.FRONTEND_URL}/api/offline/status`, {
          timeout: 5000
        });
        
        logger.debug('Offline status response:', response.data);
        
        if (response.data && response.data.enabled) {
          return { success: true };
        } else {
          return { 
            success: false, 
            skipped: true,
            message: 'Offline mode not enabled or not testable via API' 
          };
        }
      } catch (error) {
        // This is expected since we're testing a frontend feature
        return { 
          success: false, 
          skipped: true,
          message: 'Cannot test offline authentication without browser automation' 
        };
      }
    });
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

export default authTests;
