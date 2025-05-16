// Test script for bulk add functionality with Google Places API integration
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base URL for the API
const API_URL = 'http://localhost:5001/api';

// Login credentials
const LOGIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'doof123'
};

// Create axios instance with cookie support
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for cookie-based auth
});

// Store the session cookie
let sessionCookie = '';

// Function to login and get authentication
async function login() {
  try {
    console.log('Logging in with credentials:', LOGIN_CREDENTIALS.email);
    
    // Make the login request
    const response = await axios.post(`${API_URL}/auth/login`, LOGIN_CREDENTIALS, {
      withCredentials: true
    });
    
    console.log('Login response status:', response.status);
    console.log('Login response data:', response.data);
    
    // Check for cookies in the response
    if (response.headers['set-cookie']) {
      sessionCookie = response.headers['set-cookie'][0];
      console.log('Received session cookie:', sessionCookie);
      
      // Set the cookie for future requests
      api.defaults.headers.Cookie = sessionCookie;
      console.log('Cookie set for future requests');
    }
    
    // If we have a token in the response, use it
    if (response.data.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      console.log('Authentication token set successfully');
    }
    
    return response.data.success;
  } catch (error) {
    console.error('Error during login:', error.response?.data || error.message);
    return false;
  }
}

// Raw input data as it would be entered in the bulk add form
const rawInputData = [
  'Thai villa;restaurant;New York;Thai',
  'Cosme;restaurant;New York;Mexican',
  'Barbounia;restaurant;New York;Mediterranean'
];

// Function to parse raw input data
function parseRawInput(rawLines) {
  return rawLines
    .map((line, index) => ({
      raw: line.trim(),
      _lineNumber: index + 1
    }))
    .filter(item => item.raw)
    .map(item => {
      const parts = item.raw.split(';').map(part => part.trim());
      const [name = '', type = '', location = '', tagsRaw = ''] = parts;
      const isDish = type?.toLowerCase() === 'dish';
      
      return {
        _lineNumber: item._lineNumber,
        name: name,
        type: isDish ? 'dish' : (type?.toLowerCase() === 'restaurant' ? 'restaurant' : 'unknown'),
        restaurant_name: isDish ? location : undefined,
        city_name: !isDish ? location : undefined,
        cuisine_type: tagsRaw || '',
        tags: tagsRaw ? tagsRaw.split(',').map(tag => tag.trim()).filter(t => t) : [],
        status: 'pending',
        message: 'Waiting to process...'
      };
    })
    .filter(item => item.type !== 'unknown' && item.name);
}

// Function to test the place lookup
async function testPlaceLookup(restaurantName, cityName) {
  try {
    console.log(`Looking up place: ${restaurantName}, ${cityName}`);
    const queryString = encodeURIComponent(restaurantName + (cityName ? `, ${cityName}` : ''));
    const response = await api.get(`/places/autocomplete?input=${queryString}`);
    
    console.log('Place lookup response:', JSON.stringify(response.data, null, 2));
    
    // Check if the response has the expected structure
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return {
        status: 'OK',
        data: response.data.data
      };
    } else {
      return {
        status: 'ERROR',
        data: []
      };
    }
  } catch (error) {
    console.error('Error looking up place:', error.response?.data || error.message);
    return null;
  }
}

// Function to test getting place details
async function testPlaceDetails(placeId) {
  try {
    console.log(`Getting details for place ID: ${placeId}`);
    const response = await api.get(`/places/details?place_id=${placeId}`);
    
    console.log('Place details response:', JSON.stringify(response.data, null, 2));
    return {
      status: response.data.status || 'OK',
      data: response.data
    };
  } catch (error) {
    console.error('Error getting place details:', error.response?.data || error.message);
    return null;
  }
}

// Function to test neighborhood lookup by zipcode
async function testNeighborhoodLookup(zipcode) {
  try {
    console.log(`Looking up neighborhood for zipcode: ${zipcode}`);
    const response = await api.get(`/neighborhoods/by-zipcode/${zipcode}`);
    
    console.log('Neighborhood lookup response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error looking up neighborhood:', error.response?.data || error.message);
    return null;
  }
}

// Function to process place details for an item
async function processPlaceDetails(item, placeId) {
  try {
    console.log(`Processing place details for place ID: ${placeId}`);
    
    // Get place details
    const placeDetails = await testPlaceDetails(placeId);
    
    if (!placeDetails || placeDetails.status !== 'OK') {
      throw new Error(`Failed to get place details: ${placeDetails?.status || 'Unknown error'}`);
    }
    
    // Check if we have the expected data structure
    if (!placeDetails.data || !placeDetails.data.data) {
      throw new Error('Invalid place details response format');
    }
    
    const placeData = placeDetails.data.data;
    
    // Extract address components
    const address = placeData.formattedAddress;
    const zipcode = placeData.zipcode || placeData.addressComponents?.find(
      comp => comp.types.includes('postal_code')
    )?.long_name;
    
    console.log(`Found address: ${address}, zipcode: ${zipcode}`);
    
    // Update item with address info
    item.address = address;
    item.zipcode = zipcode;
    item.latitude = placeData.location?.lat;
    item.longitude = placeData.location?.lng;
    item.place_id = placeId;
    item.phone = placeData.phone;
    item.website = placeData.website;
    
    // Look up neighborhood by zipcode
    if (zipcode) {
      const neighborhoods = await testNeighborhoodLookup(zipcode);
      
      if (neighborhoods && neighborhoods.data && neighborhoods.data.length > 0) {
        console.log(`Found ${neighborhoods.data.length} neighborhoods for zipcode ${zipcode}`);
        
        // Add neighborhood_id to the item
        item.neighborhood_id = neighborhoods.data[0].id;
        item.neighborhood = neighborhoods.data[0].name;
        
        // Mark as processed successfully
        item.status = 'processed';
        item.message = 'Place details processed successfully';
        
        console.log(`Updated item with neighborhood:`, item);
      } else {
        // If no neighborhoods found, create a mock one for testing
        console.log(`No neighborhoods found for zipcode ${zipcode}, creating mock neighborhood for testing`);
        item.neighborhood_id = 1;
        item.neighborhood = 'Test Neighborhood';
        item.status = 'processed';
        item.message = 'Place details processed with mock neighborhood';
      }
    } else {
      // If no zipcode found, create a mock neighborhood for testing
      console.log('No zipcode found in address, creating mock neighborhood for testing');
      item.neighborhood_id = 1;
      item.neighborhood = 'Test Neighborhood';
      item.status = 'processed';
      item.message = 'Place details processed with mock neighborhood';
    }
    
    return item;
  } catch (error) {
    console.error(`Error processing place details:`, error.message);
    item.status = 'error';
    item.message = `Error processing place details: ${error.message}`;
    return item;
  }
}

// Function to test the bulk add submission
async function testBulkAddSubmission(items) {
  try {
    console.log(`Submitting ${items.length} items for bulk add`);
    
    // Ensure all items have necessary fields
    const validItems = items.map(item => {
      if (!item.neighborhood_id) {
        console.warn(`Item ${item.name} is missing neighborhood_id, using default value`);
        item.neighborhood_id = 1; // Default or mock value
      }
      return item;
    });
    
    const response = await api.post(`/admin/bulk-add/restaurants`, {
      items: validItems
    });
    
    console.log('Bulk add response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error submitting bulk add:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('Starting bulk add tests...');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('Login failed, cannot proceed with tests');
    return;
  }
  
  console.log('Login successful, proceeding with tests...');
  
  // Step 1: Parse the raw input data
  console.log('\n--- Step 1: Parsing raw input data ---');
  const parsedItems = parseRawInput(rawInputData);
  console.log(`Parsed ${parsedItems.length} items:`, JSON.stringify(parsedItems, null, 2));
  
  // Step 2: Process each item to look up place details
  console.log('\n--- Step 2: Processing items to look up place details ---');
  const processedItems = [...parsedItems]; // Create a copy to modify
  
  for (let i = 0; i < processedItems.length; i++) {
    const item = processedItems[i];
    console.log(`\nProcessing item ${i + 1}/${processedItems.length}: ${item.name}`);
    
    // Skip items that are not restaurants
    if (item.type !== 'restaurant') {
      console.log(`Skipping item ${i + 1}: Not a restaurant`);
      continue;
    }
    
    // Update status
    item.status = 'processing';
    item.message = 'Looking up place...';
    
    try {
      // Look up place using Google Places API
      console.log(`Looking up place: ${item.name}, ${item.city_name}`);
      const placeResults = await testPlaceLookup(item.name, item.city_name);
      
      if (!placeResults || placeResults.status !== 'OK') {
        throw new Error(`Place lookup failed: ${placeResults?.status || 'Unknown error'}`);
      }
      
      // Check if we have multiple results
      if (Array.isArray(placeResults.data) && placeResults.data.length > 1) {
        // Multiple results found, would need user selection in the UI
        console.log(`Multiple places found for ${item.name}, simulating user selection of first option`);
        
        // In a real UI, the user would select one of these options
        // For testing, we'll just use the first one
        const placeId = placeResults.data[0].place_id;
        item.placeId = placeId;
        
        // Process place details
        await processPlaceDetails(item, placeId);
      } else if (Array.isArray(placeResults.data) && placeResults.data.length === 1) {
        // Single result found, process it directly
        const placeId = placeResults.data[0].place_id;
        item.placeId = placeId;
        
        // Process place details
        await processPlaceDetails(item, placeId);
      } else {
        // No results found
        item.status = 'error';
        item.message = 'No places found matching this name and location';
      }
    } catch (error) {
      console.error(`Error processing item ${i}:`, error.message);
      item.status = 'error';
      item.message = `Error: ${error.message}`;
    }
  }
  
  // Step 3: Mark valid items as ready for submission
  console.log('\n--- Step 3: Marking valid items as ready for submission ---');
  for (const item of processedItems) {
    if (item.status === 'processed' && item.address && item.neighborhood_id) {
      item.status = 'ready';
      item.message = 'Ready for submission';
      console.log(`Marked item ${item.name} as ready for submission`);
    }
  }
  
  // Step 4: Submit the ready items
  console.log('\n--- Step 4: Submitting ready items ---');
  const readyItems = processedItems.filter(item => item.status === 'ready');
  
  if (readyItems.length > 0) {
    console.log(`Submitting ${readyItems.length} ready items`);
    await testBulkAddSubmission(readyItems);
  } else {
    console.log('No items ready for submission after processing');
  }
  
  // Save the results to a file for inspection
  const resultsPath = path.join(__dirname, 'bulk-add-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    rawInput: rawInputData,
    parsedItems,
    processedItems,
    readyItems
  }, null, 2));
  console.log(`\nTest results saved to ${resultsPath}`);
  
  console.log('\nBulk add tests completed');
}

// Run the tests
runTests().catch(console.error);
