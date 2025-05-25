/**
 * Test Users Setup
 * 
 * This file provides utilities for creating and managing test users
 * for E2E testing.
 */

import { config } from './config.js';
import axios from 'axios';
import crypto from 'crypto';

// Create a dedicated API client for user management
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    'X-Test-Request': 'true'
  }
});

/**
 * Generate a unique test user
 * @param {string} prefix - Prefix for the username and email
 * @returns {Object} Test user data
 */
export function generateTestUser(prefix = 'test') {
  const uniqueId = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  
  return {
    email: `${prefix}_${uniqueId}_${timestamp}@example.com`,
    password: 'Test123!',
    username: `${prefix}_${uniqueId}`,
    role: 'user'
  };
}

/**
 * Create a test user in the database
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} Created user data
 */
export async function createTestUser(userData = null) {
  const user = userData || generateTestUser();
  
  try {
    const response = await apiClient.post('/auth/register', user);
    
    if (response.status === 201) {
      console.log(`Test user created: ${user.email}`);
      return {
        ...user,
        id: response.data.userId,
        token: response.data.token
      };
    } else {
      console.error(`Failed to create test user: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('Error creating test user:', error.message);
    
    // If the error is a 409 (Conflict), the user might already exist
    if (error.response?.status === 409) {
      console.log(`User ${user.email} already exists, attempting to login`);
      return loginTestUser(user.email, user.password);
    }
    
    return null;
  }
}

/**
 * Login a test user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with token
 */
export async function loginTestUser(email, password) {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    
    if (response.status === 200 && response.data.token) {
      console.log(`Test user logged in: ${email}`);
      return {
        email,
        token: response.data.token,
        id: response.data.userId || response.data.id
      };
    } else {
      console.error(`Failed to login test user: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error('Error logging in test user:', error.message);
    return null;
  }
}

/**
 * Get or create a test user
 * This will first try to login with the default credentials,
 * and if that fails, it will create a new user.
 * @returns {Promise<Object>} User data with token
 */
export async function getOrCreateTestUser() {
  // First try to login with the default test user
  const defaultUser = {
    email: config.testUsers.regular.email,
    password: config.testUsers.regular.password
  };
  
  try {
    const loggedInUser = await loginTestUser(defaultUser.email, defaultUser.password);
    if (loggedInUser) {
      return loggedInUser;
    }
  } catch (error) {
    console.log('Default user login failed, creating new test user');
  }
  
  // If login fails, create a new test user
  return createTestUser();
}

/**
 * Get or create an admin test user
 * @returns {Promise<Object>} Admin user data with token
 */
export async function getOrCreateAdminUser() {
  // First try to login with the default admin user
  const adminUser = {
    email: config.testUsers.admin.email,
    password: config.testUsers.admin.password
  };
  
  try {
    const loggedInAdmin = await loginTestUser(adminUser.email, adminUser.password);
    if (loggedInAdmin) {
      return loggedInAdmin;
    }
  } catch (error) {
    console.log('Admin user login failed, cannot create new admin user');
    return null;
  }
}

/**
 * Delete a test user
 * @param {string} userId - User ID to delete
 * @param {string} adminToken - Admin token for authorization
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTestUser(userId, adminToken) {
  try {
    const response = await apiClient.delete(`/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Error deleting test user:', error.message);
    return false;
  }
}

export default {
  generateTestUser,
  createTestUser,
  loginTestUser,
  getOrCreateTestUser,
  getOrCreateAdminUser,
  deleteTestUser
};
