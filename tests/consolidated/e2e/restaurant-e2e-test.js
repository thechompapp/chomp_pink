/**
 * Restaurant E2E Test
 * 
 * This test verifies that the simplified restaurant endpoints are working correctly.
 */

const { login, register, getRestaurants, createRestaurant } = require('../setup/robust-api-client.js');
const { generateTestUser } = require('../setup/test-users.js');
const { initializeDatabase } = require('../setup/db-init.js');
const { describe, it, before } = require('mocha');
const { expect } = require('chai');

describe('Restaurant API E2E Tests', function() {
  this.timeout(10000); // Set timeout to 10 seconds
  
  let testUser;
  let authToken;
  
  before(async function() {
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Create a test user
    testUser = generateTestUser();
    console.log(`Creating test user: ${testUser.email}`);
    
    try {
      // Register the test user
      const registerResponse = await register(testUser);
      console.log('User registered successfully:', registerResponse.success);
      
      // Login with the test user
      const loginResponse = await login({
        email: testUser.email,
        password: testUser.password
      });
      
      console.log('User logged in successfully:', loginResponse.success);
      authToken = loginResponse.data.token;
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  it('should get an empty list of restaurants', async function() {
    try {
      const response = await getRestaurants();
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.restaurants).to.be.an('array');
      
      console.log(`Retrieved ${response.data.restaurants.length} restaurants`);
    } catch (error) {
      console.error('Error getting restaurants:', error);
      throw error;
    }
  });
  
  it('should create a new restaurant', async function() {
    try {
      const restaurantData = {
        name: 'Test Restaurant',
        description: 'A test restaurant for E2E testing',
        address: '123 Test St, Test City, TC 12345',
        cuisine: 'Test Cuisine',
        price_range: '$$'
      };
      
      const response = await createRestaurant(restaurantData);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.be.a('number');
      expect(response.data.name).to.equal(restaurantData.name);
      
      console.log(`Created restaurant with ID: ${response.data.id}`);
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  });
  
  it('should get a list with the newly created restaurant', async function() {
    try {
      const response = await getRestaurants();
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.restaurants).to.be.an('array');
      expect(response.data.restaurants.length).to.be.at.least(1);
      
      const testRestaurant = response.data.restaurants.find(r => r.name === 'Test Restaurant');
      expect(testRestaurant).to.exist;
      
      console.log(`Retrieved restaurant: ${testRestaurant.name}`);
    } catch (error) {
      console.error('Error getting restaurants:', error);
      throw error;
    }
  });
});
