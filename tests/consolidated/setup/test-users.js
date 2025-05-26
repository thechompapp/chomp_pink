/**
 * Test User Utilities
 * 
 * This module provides utility functions for generating test users
 * and managing test user data.
 */

/**
 * Generate a test user with unique identifiers
 * @param {Object} overrides - Optional overrides for the test user
 * @returns {Object} Test user data
 */
export function generateTestUser(overrides = {}) {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000);
  
  const defaultUser = {
    email: `testuser_${timestamp}_${randomSuffix}@example.com`,
    username: `testuser_${timestamp}_${randomSuffix}`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    ...overrides
  };
  
  return defaultUser;
}

/**
 * Generate an admin test user
 * @param {Object} overrides - Optional overrides for the admin user
 * @returns {Object} Admin test user data
 */
export function generateAdminUser(overrides = {}) {
  return generateTestUser({
    email: 'admin@example.com',
    username: 'adminuser',
    password: 'AdminPassword123!',
    role: 'admin',
    ...overrides
  });
}

/**
 * Generate a regular test user
 * @param {Object} overrides - Optional overrides for the regular user
 * @returns {Object} Regular test user data
 */
export function generateRegularUser(overrides = {}) {
  return generateTestUser({
    email: 'user@example.com',
    username: 'testuser',
    password: 'UserPassword123!',
    role: 'user',
    ...overrides
  });
}

export default {
  generateTestUser,
  generateAdminUser,
  generateRegularUser
};
