// Test setup file
import '@testing-library/jest-dom';
import bcrypt from 'bcryptjs';
import TestDBHelper from './test-db-helper.js';

// Create a test database helper instance
export const dbHelper = new TestDBHelper();

// Test user constants
export const TEST_USER = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpassword123',
  role: 'user'
};

/**
 * Create a test user in the database
 * @param {Object} userData - User data to create
 * @returns {Promise<Object>} The created user
 */
export async function createTestUser(userData = {}) {
  const user = { 
    username: `testuser_${Math.random().toString(36).substring(2, 10)}`,
    email: `test_${Math.random().toString(36).substring(2, 10)}@example.com`,
    password: 'testpassword123',
    role: 'user',
    ...userData  // Allow overriding defaults
  };
  
  const hashedPassword = await bcrypt.hash(user.password, 10);
  
  const result = await dbHelper.query(
    `INSERT INTO users (username, email, password_hash, role, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, username, email, role, created_at`,
    [user.username, user.email, hashedPassword, user.role]
  );
  
  return {
    ...result.rows[0],
    password: user.password // Include plain text password for testing
  };
}

/**
 * Delete a test user by email
 * @param {string} email - Email of the user to delete
 */
export async function deleteTestUser(email) {
  await dbHelper.query('DELETE FROM users WHERE email = $1', [email]);
}

// Setup and teardown for tests
export function setupTestEnvironment() {
  beforeAll(async () => {
    // Connect to the test database and start a transaction
    await dbHelper.connect();
  });

  beforeEach(async () => {
    // Truncate all tables before each test
    await dbHelper.truncateAll();
  });

  afterAll(async () => {
    // Rollback the transaction and release the connection
    await dbHelper.cleanup();
  });
}

// Initialize the test environment
setupTestEnvironment();
