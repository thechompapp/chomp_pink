/**
 * Admin Panel CRUD Operations E2E Test Suite
 * 
 * This test suite covers the admin panel CRUD operations test cases specified in TSINSTRUCTION.md:
 * - Test Case 7.1.1: Admin Views Users
 * - Test Case 7.1.2: Admin Creates a New User
 * - Test Case 7.1.3: Admin Updates an Existing User
 * - Test Case 7.1.4: Admin Deletes a User
 */

import { 
  login, 
  register,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

describe('Admin Panel CRUD Operations E2E Tests', function() {
  this.timeout(15000); // Set timeout to 15 seconds
  
  let adminUser;
  let adminToken;
  let createdUserId;
  
  before(async function() {
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Create and register an admin user
    adminUser = generateTestUser({ role: 'admin' });
    console.log(`Creating admin user: ${adminUser.email}`);
    
    try {
      // Register the admin user
      await register(adminUser);
      
      // Login with the admin user
      const loginResponse = await login({
        email: adminUser.email,
        password: adminUser.password
      });
      
      console.log('Admin user logged in successfully');
      adminToken = loginResponse.data.token;
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 7.1.1: Admin Views Users
   */
  it('should allow admin to view users', async function() {
    try {
      const response = await getAdminUsers({}, adminToken);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.users).to.be.an('array');
      expect(response.data.users.length).to.be.at.least(1); // Should at least have the admin user
      
      // Verify pagination data
      expect(response.data.pagination).to.be.an('object');
      expect(response.data.pagination.total).to.be.a('number');
      expect(response.data.pagination.page).to.be.a('number');
      expect(response.data.pagination.limit).to.be.a('number');
      
      console.log(`Admin successfully viewed ${response.data.users.length} users`);
    } catch (error) {
      console.error('Error in admin view users test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 7.1.2: Admin Creates a New User
   */
  it('should allow admin to create a new user', async function() {
    try {
      const newUser = generateTestUser();
      
      // Add role to the user data
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      };
      
      const response = await createAdminUser(userData, adminToken);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.be.a('number');
      expect(response.data.email).to.equal(userData.email);
      expect(response.data.username).to.equal(userData.username);
      expect(response.data.role).to.equal(userData.role);
      
      // Store the created user ID for later tests
      createdUserId = response.data.id;
      
      console.log(`Admin successfully created user with ID: ${createdUserId}`);
    } catch (error) {
      console.error('Error in admin create user test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 7.1.3: Admin Updates an Existing User
   */
  it('should allow admin to update an existing user', async function() {
    try {
      // Skip if no user was created
      if (!createdUserId) {
        this.skip();
        return;
      }
      
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        role: 'moderator'
      };
      
      const response = await updateAdminUser(createdUserId, updateData, adminToken);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.equal(createdUserId);
      expect(response.data.first_name).to.equal(updateData.first_name);
      expect(response.data.last_name).to.equal(updateData.last_name);
      expect(response.data.role).to.equal(updateData.role);
      
      console.log(`Admin successfully updated user with ID: ${createdUserId}`);
    } catch (error) {
      console.error('Error in admin update user test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 7.1.4: Admin Deletes a User
   */
  it('should allow admin to delete a user', async function() {
    try {
      // Skip if no user was created
      if (!createdUserId) {
        this.skip();
        return;
      }
      
      const response = await deleteAdminUser(createdUserId, adminToken);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      
      // Verify the user was deleted by trying to get users and checking
      const usersResponse = await getAdminUsers({}, adminToken);
      const deletedUser = usersResponse.data.users.find(user => user.id === createdUserId);
      
      expect(deletedUser).to.be.undefined;
      
      console.log(`Admin successfully deleted user with ID: ${createdUserId}`);
    } catch (error) {
      console.error('Error in admin delete user test:', error);
      throw error;
    }
  });
});
