/**
 * Admin E2E Tests
 * 
 * Tests admin-specific functionality including user management,
 * content moderation, and system configuration.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import apiClient, { handleApiRequest, setAuthToken, clearAuthToken } from '../setup/api-client.js';
import { config } from '../setup/config.js';
import { initializeTestDatabase, cleanupTestDatabase, closeDbConnections } from '../setup/db-utils.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('Admin', () => {
  // Setup test environment before all tests
  beforeAll(async () => {
    // Initialize test database with seed data
    await initializeTestDatabase();
    
    // Login as admin
    const loginResult = await handleApiRequest(
      () => apiClient.post('/auth/login', config.users.admin),
      'Admin login for tests'
    );
    
    if (loginResult.success) {
      setAuthToken(loginResult.data.token);
    } else {
      throw new Error('Failed to login as admin for tests');
    }
  }, TEST_TIMEOUT);
  
  // Clean up after all tests
  afterAll(async () => {
    // Clean up test database
    await cleanupTestDatabase();
    
    // Close database connections
    await closeDbConnections();
    
    // Clear auth token
    clearAuthToken();
  }, TEST_TIMEOUT);
  
  // User management tests
  describe('User Management', () => {
    it('should get all users', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/admin/users'),
        'Get all users'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should get a specific user by ID', async () => {
      // First get all users to find a valid ID
      const usersResult = await handleApiRequest(
        () => apiClient.get('/admin/users'),
        'Get all users for ID test'
      );
      
      expect(usersResult.success).toBe(true);
      expect(usersResult.data.length).toBeGreaterThan(0);
      
      const userId = usersResult.data[0].id;
      
      const result = await handleApiRequest(
        () => apiClient.get(`/admin/users/${userId}`),
        'Get user by ID'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('id', userId);
    });
    
    it('should create a new user', async () => {
      const newUser = {
        username: `testuser_${Date.now()}`,
        email: `testuser_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        role: 'user'
      };
      
      const result = await handleApiRequest(
        () => apiClient.post('/admin/users', newUser),
        'Create new user'
      );
      
      expect(result.success).toBe(true);
      expect([200, 201]).toContain(result.status);
      expect(result.data).toHaveProperty('username', newUser.username);
      expect(result.data).toHaveProperty('email', newUser.email);
      expect(result.data).toHaveProperty('role', newUser.role);
    });
    
    it('should update a user', async () => {
      // First get all users to find a valid ID
      const usersResult = await handleApiRequest(
        () => apiClient.get('/admin/users'),
        'Get all users for update test'
      );
      
      expect(usersResult.success).toBe(true);
      expect(usersResult.data.length).toBeGreaterThan(0);
      
      // Find a non-admin user to update
      const userToUpdate = usersResult.data.find(user => user.role !== 'admin');
      
      // Skip if no suitable user found
      if (!userToUpdate) {
        console.warn('Skipping test: No suitable user found for update test');
        return;
      }
      
      const userId = userToUpdate.id;
      const updatedData = {
        username: `updated_${userToUpdate.username}`,
        role: 'moderator' // Change role to moderator
      };
      
      const result = await handleApiRequest(
        () => apiClient.put(`/admin/users/${userId}`, updatedData),
        'Update user'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('username', updatedData.username);
      expect(result.data).toHaveProperty('role', updatedData.role);
    });
    
    it('should disable a user account', async () => {
      // First create a test user to disable
      const newUser = {
        username: `disable_test_${Date.now()}`,
        email: `disable_test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        role: 'user'
      };
      
      const createResult = await handleApiRequest(
        () => apiClient.post('/admin/users', newUser),
        'Create user for disable test'
      );
      
      expect(createResult.success).toBe(true);
      const userId = createResult.data.id;
      
      // Now disable the user
      const result = await handleApiRequest(
        () => apiClient.post(`/admin/users/${userId}/disable`),
        'Disable user'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status', 'disabled');
    });
  });
  
  // Submission management tests
  describe('Submission Management', () => {
    it('should get all pending submissions', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/admin/submissions?status=pending'),
        'Get pending submissions'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    it('should approve a submission', async () => {
      // First create a submission to approve
      // Login as regular user to create submission
      clearAuthToken();
      const regularLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Regular user login for submission test'
      );
      
      expect(regularLoginResult.success).toBe(true);
      setAuthToken(regularLoginResult.data.token);
      
      // Create a restaurant submission
      const newRestaurant = {
        name: `Test Restaurant ${Date.now()}`,
        cuisine: 'French',
        address: '123 Test Street',
        city_id: 1,
        neighborhood_id: 1
      };
      
      const submissionResult = await handleApiRequest(
        () => apiClient.post('/submissions', {
          type: 'restaurant',
          data: newRestaurant
        }),
        'Create submission for approval test'
      );
      
      expect(submissionResult.success).toBe(true);
      const submissionId = submissionResult.data.id;
      
      // Login back as admin
      clearAuthToken();
      const adminLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login for submission approval'
      );
      
      expect(adminLoginResult.success).toBe(true);
      setAuthToken(adminLoginResult.data.token);
      
      // Approve the submission
      const result = await handleApiRequest(
        () => apiClient.post(`/admin/submissions/approve/${submissionId}`),
        'Approve submission'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status', 'approved');
    });
    
    it('should reject a submission', async () => {
      // First create a submission to reject
      // Login as regular user to create submission
      clearAuthToken();
      const regularLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Regular user login for submission test'
      );
      
      expect(regularLoginResult.success).toBe(true);
      setAuthToken(regularLoginResult.data.token);
      
      // Create a restaurant submission
      const newRestaurant = {
        name: `Test Restaurant ${Date.now()}`,
        cuisine: 'Italian',
        address: '456 Test Avenue',
        city_id: 1,
        neighborhood_id: 1
      };
      
      const submissionResult = await handleApiRequest(
        () => apiClient.post('/submissions', {
          type: 'restaurant',
          data: newRestaurant
        }),
        'Create submission for rejection test'
      );
      
      expect(submissionResult.success).toBe(true);
      const submissionId = submissionResult.data.id;
      
      // Login back as admin
      clearAuthToken();
      const adminLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login for submission rejection'
      );
      
      expect(adminLoginResult.success).toBe(true);
      setAuthToken(adminLoginResult.data.token);
      
      // Reject the submission
      const result = await handleApiRequest(
        () => apiClient.post(`/admin/submissions/reject/${submissionId}`, {
          reason: 'Test rejection reason'
        }),
        'Reject submission'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status', 'rejected');
    });
  });
  
  // System configuration tests
  describe('System Configuration', () => {
    it('should get system configuration', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/admin/config'),
        'Get system configuration'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toBeInstanceOf(Object);
    });
    
    it('should update system configuration', async () => {
      // First get current configuration
      const configResult = await handleApiRequest(
        () => apiClient.get('/admin/config'),
        'Get system configuration for update test'
      );
      
      expect(configResult.success).toBe(true);
      
      // Update a configuration value
      const updatedConfig = {
        ...configResult.data,
        maintenance_mode: !configResult.data.maintenance_mode
      };
      
      const result = await handleApiRequest(
        () => apiClient.put('/admin/config', updatedConfig),
        'Update system configuration'
      );
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('maintenance_mode', updatedConfig.maintenance_mode);
    });
  });
  
  // Access control tests
  describe('Access Control', () => {
    it('should verify admin-only endpoints are protected', async () => {
      // Login as regular user
      clearAuthToken();
      const regularLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.regular),
        'Regular user login for access control test'
      );
      
      expect(regularLoginResult.success).toBe(true);
      setAuthToken(regularLoginResult.data.token);
      
      // Try to access admin-only endpoint
      const result = await handleApiRequest(
        () => apiClient.get('/admin/users'),
        'Regular user accessing admin endpoint'
      );
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(403);
      
      // Login back as admin
      clearAuthToken();
      const adminLoginResult = await handleApiRequest(
        () => apiClient.post('/auth/login', config.users.admin),
        'Admin login after access control test'
      );
      
      expect(adminLoginResult.success).toBe(true);
      setAuthToken(adminLoginResult.data.token);
    });
  });
});
