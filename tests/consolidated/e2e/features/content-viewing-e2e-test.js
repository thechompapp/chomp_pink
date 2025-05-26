/**
 * Content Viewing E2E Test Suite
 * 
 * This test suite covers the content viewing-related test cases specified in TSINSTRUCTION.md:
 * - Test Case 4.1: View Restaurant Details
 * - Test Case 4.2: View Dish Details
 */

import { 
  login, 
  register,
  createRestaurant,
  createDish,
  getRestaurantById,
  getDishById
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

describe('Content Viewing E2E Tests', function() {
  this.timeout(15000); // Set timeout to 15 seconds
  
  let testUser;
  let authToken;
  let testRestaurant;
  let testDish;
  
  before(async function() {
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Create and register a test user
    testUser = generateTestUser();
    console.log(`Creating test user: ${testUser.email}`);
    
    try {
      // Register the test user
      await register(testUser);
      
      // Login with the test user
      const loginResponse = await login({
        email: testUser.email,
        password: testUser.password
      });
      
      console.log('User logged in successfully');
      authToken = loginResponse.data.token;
      
      // Create a test restaurant
      const restaurantData = {
        name: 'Gourmet Delights',
        description: 'A fine dining experience with exquisite flavors',
        address: '123 Gourmet Ave, Foodie City, FC 12345',
        cuisine: 'Fine Dining',
        price_range: '$$$$'
      };
      
      const restaurantResponse = await createRestaurant(restaurantData);
      testRestaurant = restaurantResponse.data;
      console.log(`Created test restaurant: ${testRestaurant.name}`);
      
      // Create a test dish
      const dishData = {
        name: 'Truffle Infused Risotto',
        description: 'Creamy risotto with imported truffles and aged parmesan',
        price: 32.99,
        category: 'Main Course',
        restaurant_id: testRestaurant.id
      };
      
      const dishResponse = await createDish(dishData);
      testDish = dishResponse.data;
      console.log(`Created test dish: ${testDish.name}`);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 4.1: View Restaurant Details
   */
  it('should view detailed restaurant information', async function() {
    try {
      const response = await getRestaurantById(testRestaurant.id);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      
      // Verify restaurant details
      expect(response.data.id).to.equal(testRestaurant.id);
      expect(response.data.name).to.equal(testRestaurant.name);
      expect(response.data.description).to.equal(testRestaurant.description);
      expect(response.data.address).to.equal(testRestaurant.address);
      expect(response.data.cuisine).to.equal(testRestaurant.cuisine);
      expect(response.data.price_range).to.equal(testRestaurant.price_range);
      
      // Restaurant should have dishes array
      if (response.data.dishes) {
        expect(response.data.dishes).to.be.an('array');
        
        // Check if our test dish is in the restaurant's dishes
        const foundDish = response.data.dishes.find(dish => dish.id === testDish.id);
        if (foundDish) {
          expect(foundDish.name).to.equal(testDish.name);
        }
      }
      
      console.log(`Successfully viewed restaurant details for: ${response.data.name}`);
    } catch (error) {
      console.error('Error viewing restaurant details:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 4.2: View Dish Details
   */
  it('should view detailed dish information', async function() {
    try {
      const response = await getDishById(testDish.id);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      
      // Verify dish details
      expect(response.data.id).to.equal(testDish.id);
      expect(response.data.name).to.equal(testDish.name);
      expect(response.data.description).to.equal(testDish.description);
      expect(parseFloat(response.data.price)).to.equal(testDish.price);
      expect(response.data.category).to.equal(testDish.category);
      expect(response.data.restaurant_id).to.equal(testRestaurant.id);
      
      // Dish should have restaurant information
      if (response.data.restaurant) {
        expect(response.data.restaurant).to.be.an('object');
        expect(response.data.restaurant.id).to.equal(testRestaurant.id);
        expect(response.data.restaurant.name).to.equal(testRestaurant.name);
      }
      
      console.log(`Successfully viewed dish details for: ${response.data.name}`);
    } catch (error) {
      console.error('Error viewing dish details:', error);
      throw error;
    }
  });
});
