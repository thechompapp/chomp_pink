/**
 * Search and Filtering E2E Test Suite
 * 
 * This test suite covers the search and filtering-related test cases specified in TSINSTRUCTION.md:
 * - Test Case 3.1: Global Search for Restaurant
 * - Test Case 3.2: Global Search for Dish
 * - Test Case 3.3: Filter Restaurants by Cuisine
 * - Test Case 3.4: Filter Dishes by Neighborhood and Price Range
 * - Test Case 3.5: Autocomplete Search
 */

import { 
  login, 
  register,
  createRestaurant,
  createDish,
  getRestaurants,
  getDishes,
  searchGlobal,
  searchAutocomplete
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';

describe('Search and Filtering E2E Tests', function() {
  this.timeout(15000); // Set timeout to 15 seconds
  
  let testUser;
  let authToken;
  let testRestaurants = [];
  let testDishes = [];
  
  // Test data for restaurants and dishes
  const restaurantData = [
    {
      name: 'Italian Delight',
      description: 'Authentic Italian cuisine',
      address: '123 Pasta St, Food City, FC 12345',
      cuisine: 'Italian',
      price_range: '$$'
    },
    {
      name: 'Sushi Paradise',
      description: 'Fresh Japanese sushi',
      address: '456 Sushi Ave, Food City, FC 12345',
      cuisine: 'Japanese',
      price_range: '$$$'
    },
    {
      name: 'Taco Heaven',
      description: 'Delicious Mexican tacos',
      address: '789 Taco Blvd, Food City, FC 12345',
      cuisine: 'Mexican',
      price_range: '$'
    }
  ];
  
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
      
      // Create test restaurants
      for (const restaurant of restaurantData) {
        const response = await createRestaurant(restaurant);
        testRestaurants.push(response.data);
        console.log(`Created test restaurant: ${response.data.name}`);
        
        // Create dishes for each restaurant
        const dishData = {
          name: `Special ${restaurant.cuisine} Dish`,
          description: `Signature dish from ${restaurant.name}`,
          price: Math.floor(Math.random() * 20) + 10, // Random price between 10-30
          category: restaurant.cuisine,
          restaurant_id: response.data.id
        };
        
        const dishResponse = await createDish(dishData);
        testDishes.push(dishResponse.data);
        console.log(`Created test dish: ${dishResponse.data.name}`);
      }
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 3.1: Global Search for Restaurant
   */
  it('should find a restaurant using global search', async function() {
    try {
      // Search for the Italian restaurant
      const searchQuery = 'Italian';
      const response = await searchGlobal(searchQuery);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.results).to.be.an('array');
      
      // Check if the Italian restaurant is in the results
      const foundRestaurant = response.data.results.find(result => 
        result.type === 'restaurant' && result.name.includes('Italian')
      );
      
      expect(foundRestaurant).to.exist;
      
      console.log(`Found restaurant in search results: ${foundRestaurant.name}`);
    } catch (error) {
      console.error('Error in global restaurant search test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 3.2: Global Search for Dish
   */
  it('should find a dish using global search', async function() {
    try {
      // Search for the Japanese dish
      const searchQuery = 'Japanese Dish';
      const response = await searchGlobal(searchQuery);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.results).to.be.an('array');
      
      // Check if the Japanese dish is in the results
      const foundDish = response.data.results.find(result => 
        result.type === 'dish' && result.name.includes('Japanese')
      );
      
      expect(foundDish).to.exist;
      
      console.log(`Found dish in search results: ${foundDish.name}`);
    } catch (error) {
      console.error('Error in global dish search test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 3.3: Filter Restaurants by Cuisine
   */
  it('should filter restaurants by cuisine', async function() {
    try {
      // Filter for Mexican restaurants
      const response = await getRestaurants({ cuisine: 'Mexican' });
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.restaurants).to.be.an('array');
      
      // All returned restaurants should be Mexican
      const allMexican = response.data.restaurants.every(restaurant => 
        restaurant.cuisine === 'Mexican'
      );
      
      expect(allMexican).to.be.true;
      expect(response.data.restaurants.length).to.be.at.least(1);
      
      console.log(`Found ${response.data.restaurants.length} Mexican restaurants`);
    } catch (error) {
      console.error('Error in restaurant cuisine filter test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 3.4: Filter Dishes by Price Range
   */
  it('should filter dishes by price range', async function() {
    try {
      // Filter for expensive dishes (price > 20)
      const response = await getDishes({ min_price: 20 });
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.dishes).to.be.an('array');
      
      // All returned dishes should have price >= 20
      const allExpensive = response.data.dishes.every(dish => 
        parseFloat(dish.price) >= 20
      );
      
      expect(allExpensive).to.be.true;
      
      console.log(`Found ${response.data.dishes.length} expensive dishes`);
    } catch (error) {
      console.error('Error in dish price filter test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 3.5: Autocomplete Search
   */
  it('should return autocomplete suggestions', async function() {
    try {
      // Search for partial restaurant name
      const searchQuery = 'Ital';
      const response = await searchAutocomplete(searchQuery);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.suggestions).to.be.an('array');
      
      // Should find the Italian restaurant in suggestions
      const hasItalianSuggestion = response.data.suggestions.some(suggestion => 
        suggestion.text.toLowerCase().includes('ital')
      );
      
      expect(hasItalianSuggestion).to.be.true;
      
      console.log(`Found ${response.data.suggestions.length} autocomplete suggestions`);
    } catch (error) {
      console.error('Error in autocomplete search test:', error);
      throw error;
    }
  });
});
