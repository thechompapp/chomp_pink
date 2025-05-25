/**
 * Authentication E2E Test Suite
 * 
 * This test suite covers the authentication-related test cases specified in TSINSTRUCTION.md:
 * - Test Case 1.1: Successful User Registration
 * - Test Case 1.2: User Registration - Duplicate Email/Username
 * - Test Case 1.3: Successful User Login
 * - Test Case 1.4: User Login - Invalid Credentials
 * - Test Case 1.5: Accessing Protected Routes
 * - Test Case 1.6: Admin User Access to Admin Panel
 * - Test Case 1.7: Non-Admin User Denied Access to Admin Panel/Routes
 */

import { 
  login, 
  register,
  getProfile,
  getAdminData
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before, beforeEach } from 'mocha';
import { expect } from 'chai';

describe('Authentication API E2E Tests', function() {
  this.timeout(15000); // Set timeout to 15 seconds
  
  let testUser;
  let adminUser;
  let regularUser;
  
  before(async function() {
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Create test users
    adminUser = generateTestUser({ role: 'admin' });
    regularUser = generateTestUser({ role: 'user' });
    
    console.log(`Created admin test user: ${adminUser.email}`);
    console.log(`Created regular test user: ${regularUser.email}`);
    
    try {
      // Register the admin user
      await register(adminUser);
      
      // Register the regular user
      await register(regularUser);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  beforeEach(function() {
    // Generate a new test user for each test
    testUser = generateTestUser();
  });
  
  /**
   * Test Case 1.1: Successful User Registration
   */
  it('should successfully register a new user', async function() {
    try {
      const response = await register(testUser);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.user).to.be.an('object');
      expect(response.data.user.email).to.equal(testUser.email);
      expect(response.data.token).to.be.a('string');
      
      console.log(`Successfully registered user: ${testUser.email}`);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 1.2: User Registration - Duplicate Email/Username
   */
  it('should fail to register a user with duplicate email', async function() {
    try {
      // First registration should succeed
      await register(testUser);
      
      // Second registration with same email should fail
      const duplicateUser = { ...testUser, username: testUser.username + '_duplicate' };
      
      try {
        await register(duplicateUser);
        // If we reach here, the test failed
        throw new Error('Expected registration with duplicate email to fail, but it succeeded');
      } catch (error) {
        // This is expected - verify it's the right error
        expect(error.response).to.exist;
        expect(error.response.status).to.be.oneOf([400, 409]); // Either Bad Request or Conflict
        expect(error.response.data.success).to.be.false;
        
        console.log('Successfully caught duplicate email registration attempt');
      }
    } catch (error) {
      if (error.message && error.message.includes('Expected registration')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Unexpected error in duplicate email test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 1.3: Successful User Login
   */
  it('should successfully login with valid credentials', async function() {
    try {
      // First register the user
      await register(testUser);
      
      // Then try to login
      const loginResponse = await login({
        email: testUser.email,
        password: testUser.password
      });
      
      expect(loginResponse).to.be.an('object');
      expect(loginResponse.success).to.be.true;
      expect(loginResponse.data).to.be.an('object');
      expect(loginResponse.data.user).to.be.an('object');
      expect(loginResponse.data.user.email).to.equal(testUser.email);
      expect(loginResponse.data.token).to.be.a('string');
      
      console.log(`Successfully logged in user: ${testUser.email}`);
    } catch (error) {
      console.error('Error in login test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 1.4: User Login - Invalid Credentials
   */
  it('should fail to login with invalid credentials', async function() {
    try {
      // First register the user
      await register(testUser);
      
      // Then try to login with wrong password
      try {
        await login({
          email: testUser.email,
          password: 'wrong_password'
        });
        // If we reach here, the test failed
        throw new Error('Expected login with invalid credentials to fail, but it succeeded');
      } catch (error) {
        // This is expected - verify it's the right error
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(401); // Unauthorized
        expect(error.response.data.success).to.be.false;
        
        console.log('Successfully caught invalid credentials login attempt');
      }
      
      // Try with non-existent email
      try {
        await login({
          email: 'nonexistent_' + testUser.email,
          password: testUser.password
        });
        // If we reach here, the test failed
        throw new Error('Expected login with non-existent email to fail, but it succeeded');
      } catch (error) {
        // This is expected - verify it's the right error
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(401); // Unauthorized
        expect(error.response.data.success).to.be.false;
        
        console.log('Successfully caught non-existent email login attempt');
      }
    } catch (error) {
      if (error.message && (error.message.includes('Expected login'))) {
        throw error; // Rethrow our assertion error
      }
      console.error('Unexpected error in invalid credentials test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 1.5: Accessing Protected Routes
   */
  it('should deny access to protected routes without authentication', async function() {
    try {
      // Try to access a protected route without authentication
      try {
        await getProfile();
        // If we reach here, the test failed
        throw new Error('Expected access to protected route to fail without auth, but it succeeded');
      } catch (error) {
        // This is expected - verify it's the right error
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(401); // Unauthorized
        expect(error.response.data.success).to.be.false;
        
        console.log('Successfully caught unauthorized access attempt to protected route');
      }
    } catch (error) {
      if (error.message && error.message.includes('Expected access')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Unexpected error in protected route test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 1.6: Admin User Access to Admin Panel
   */
  it('should allow admin users to access admin routes', async function() {
    try {
      // Login as admin
      const loginResponse = await login({
        email: adminUser.email,
        password: adminUser.password
      });
      
      expect(loginResponse.success).to.be.true;
      expect(loginResponse.data.token).to.be.a('string');
      
      // Try to access admin data
      const adminDataResponse = await getAdminData(loginResponse.data.token);
      
      expect(adminDataResponse).to.be.an('object');
      expect(adminDataResponse.success).to.be.true;
      
      console.log('Admin successfully accessed admin data');
    } catch (error) {
      console.error('Error in admin access test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 1.7: Non-Admin User Denied Access to Admin Panel/Routes
   */
  it('should deny non-admin users access to admin routes', async function() {
    try {
      // Login as regular user
      const loginResponse = await login({
        email: regularUser.email,
        password: regularUser.password
      });
      
      expect(loginResponse.success).to.be.true;
      expect(loginResponse.data.token).to.be.a('string');
      
      // Try to access admin data
      try {
        await getAdminData(loginResponse.data.token);
        // If we reach here, the test failed
        throw new Error('Expected access to admin route to fail for non-admin, but it succeeded');
      } catch (error) {
        // This is expected - verify it's the right error
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(403); // Forbidden
        expect(error.response.data.success).to.be.false;
        
        console.log('Successfully caught unauthorized admin access attempt by regular user');
      }
    } catch (error) {
      if (error.message && error.message.includes('Expected access')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Unexpected error in non-admin access test:', error);
      throw error;
    }
  });
});
