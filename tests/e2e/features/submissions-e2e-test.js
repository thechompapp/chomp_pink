/**
 * Submissions E2E Test Suite
 * 
 * This test suite covers the submissions-related test cases specified in TSINSTRUCTION.md:
 * - Test Case 5.1: User Submits a New Dish
 * - Test Case 5.2: Admin Approves a Submission
 * - Test Case 5.3: Admin Rejects a Submission
 */

import { 
  login, 
  register,
  createSubmission,
  getSubmissions,
  getSubmissionById,
  approveSubmission,
  rejectSubmission
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

describe('Submissions E2E Tests', function() {
  this.timeout(15000); // Set timeout to 15 seconds
  
  let regularUser;
  let adminUser;
  let regularUserToken;
  let adminUserToken;
  let testSubmission;
  
  before(async function() {
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Create test users
    regularUser = generateTestUser({ role: 'user' });
    adminUser = generateTestUser({ role: 'admin' });
    
    console.log(`Creating regular test user: ${regularUser.email}`);
    console.log(`Creating admin test user: ${adminUser.email}`);
    
    try {
      // Register the users
      await register(regularUser);
      await register(adminUser);
      
      // Login with the regular user
      const regularLoginResponse = await login({
        email: regularUser.email,
        password: regularUser.password
      });
      
      regularUserToken = regularLoginResponse.data.token;
      console.log('Regular user logged in successfully');
      
      // Login with the admin user
      const adminLoginResponse = await login({
        email: adminUser.email,
        password: adminUser.password
      });
      
      adminUserToken = adminLoginResponse.data.token;
      console.log('Admin user logged in successfully');
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 5.1: User Submits a New Dish
   */
  it('should allow a user to submit a new dish', async function() {
    try {
      // Use the regular user token
      const submissionData = {
        type: 'dish',
        data: {
          name: 'User Submitted Dish',
          description: 'A delicious dish submitted by a user',
          price: 15.99,
          category: 'Main Course',
          restaurant_name: 'New Restaurant for Submission',
          restaurant_address: '123 Submission St, Test City, TC 12345'
        }
      };
      
      const response = await createSubmission(submissionData, regularUserToken);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.be.a('number');
      expect(response.data.status).to.equal('pending');
      expect(response.data.type).to.equal('dish');
      
      // Store the submission for later tests
      testSubmission = response.data;
      
      console.log(`Created submission with ID: ${testSubmission.id}`);
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 5.2: Admin Approves a Submission
   */
  it('should allow an admin to approve a submission', async function() {
    try {
      // Skip if no test submission
      if (!testSubmission) {
        this.skip();
        return;
      }
      
      // Use the admin user token
      const response = await approveSubmission(testSubmission.id, adminUserToken);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.equal(testSubmission.id);
      expect(response.data.status).to.equal('approved');
      
      // Verify the submission was approved
      const submissionResponse = await getSubmissionById(testSubmission.id, adminUserToken);
      expect(submissionResponse.data.status).to.equal('approved');
      
      console.log(`Admin approved submission with ID: ${testSubmission.id}`);
      
      // Create a new submission for the rejection test
      const submissionData = {
        type: 'dish',
        data: {
          name: 'Another User Submitted Dish',
          description: 'Another dish for testing rejection',
          price: 18.99,
          category: 'Appetizer',
          restaurant_name: 'Another Test Restaurant',
          restaurant_address: '456 Submission St, Test City, TC 12345'
        }
      };
      
      const newSubmissionResponse = await createSubmission(submissionData, regularUserToken);
      testSubmission = newSubmissionResponse.data;
      
      console.log(`Created another submission with ID: ${testSubmission.id} for rejection test`);
    } catch (error) {
      console.error('Error approving submission:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 5.3: Admin Rejects a Submission
   */
  it('should allow an admin to reject a submission', async function() {
    try {
      // Skip if no test submission
      if (!testSubmission) {
        this.skip();
        return;
      }
      
      // Use the admin user token
      const response = await rejectSubmission(testSubmission.id, {
        reason: 'Not enough information provided'
      }, adminUserToken);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.equal(testSubmission.id);
      expect(response.data.status).to.equal('rejected');
      
      // Verify the submission was rejected
      const submissionResponse = await getSubmissionById(testSubmission.id, adminUserToken);
      expect(submissionResponse.data.status).to.equal('rejected');
      
      console.log(`Admin rejected submission with ID: ${testSubmission.id}`);
    } catch (error) {
      console.error('Error rejecting submission:', error);
      throw error;
    }
  });
});
