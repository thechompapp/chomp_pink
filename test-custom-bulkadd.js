// Custom test script for bulk add functionality
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
    
    // Check for cookies in the response
    if (response.headers['set-cookie']) {
      sessionCookie = response.headers['set-cookie'][0];
      console.log('Received session cookie');
      
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

// Function to read restaurants from file
function readRestaurantsFromFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => {
      const parts = line.split(';').map(part => part.trim());
      const [name = '', type = '', location = '', tagsRaw = ''] = parts;
      return {
        _lineNumber: index + 1,
        name: name,
        type: type.toLowerCase() === 'restaurant' ? 'restaurant' : 'unknown',
        city_name: location,
        tags: tagsRaw ? tagsRaw.split(',').map(tag => tag.trim()) : [],
        cuisine_type: tagsRaw || '',
        status: 'pending',
        message: 'Waiting to process...'
      };
    }).filter(item => item.type !== 'unknown' && item.name);
  } catch (error) {
    console.error('Error reading restaurants file:', error);
    return [];
  }
}

// Function to test place lookup
async function lookupPlace(restaurantName, cityName) {
  try {
    console.log(`Looking up place: ${restaurantName}, ${cityName}`);
    const queryString = encodeURIComponent(restaurantName + (cityName ? `, ${cityName}` : ''));
    const response = await api.get(`/places/autocomplete?input=${queryString}`);
    
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
    return { status: 'ERROR', data: [] };
  }
}

// Function to get place details
async function getPlaceDetails(placeId) {
  try {
    console.log(`Getting details for place ID: ${placeId}`);
    const response = await api.get(`/places/details?place_id=${placeId}`);
    
    return {
      status: response.data.status || 'OK',
      data: response.data
    };
  } catch (error) {
    console.error('Error getting place details:', error.response?.data || error.message);
    return { status: 'ERROR', data: null };
  }
}

// Function to lookup neighborhood by zipcode
async function lookupNeighborhood(zipcode) {
  try {
    console.log(`Looking up neighborhood for zipcode: ${zipcode}`);
    const response = await api.get(`/neighborhoods/by-zipcode/${zipcode}`);
    
    if (response.data && Array.isArray(response.data)) {
      return {
        status: 'OK',
        data: response.data
      };
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
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
    console.error('Error looking up neighborhood:', error.response?.data || error.message);
    return { status: 'ERROR', data: [] };
  }
}

// Function to check for duplicates
async function checkDuplicates(items) {
  try {
    console.log(`Checking for duplicates for ${items.length} items`);
    const response = await api.post('/admin/check-existing/restaurants', { items });
    
    if (response.data && response.data.success) {
      return {
        status: 'OK',
        data: response.data.data,
        duplicates: response.data.data?.results || []
      };
    } else {
      return {
        status: 'ERROR',
        data: null,
        duplicates: []
      };
    }
  } catch (error) {
    console.error('Error checking for duplicates:', error.response?.data || error.message);
    return { status: 'ERROR', data: null, duplicates: [] };
  }
}

// Function to submit restaurants
async function submitRestaurants(items) {
  try {
    console.log(`Submitting ${items.length} restaurants`);
    const response = await api.post('/admin/bulk/restaurants', { items });
    
    return {
      status: response.data.success ? 'OK' : 'ERROR',
      data: response.data
    };
  } catch (error) {
    console.error('Error submitting restaurants:', error.response?.data || error.message);
    return { status: 'ERROR', data: null };
  }
}

// Main function
async function main() {
  try {
    console.log('=== Starting Custom Bulk Add Test ===');
    
    // Login
    const loggedIn = await login();
    if (!loggedIn) {
      console.error('Failed to log in, cannot proceed with test');
      return;
    }
    
    // Read restaurants from file
    const filePath = path.join(__dirname, 'test-restaurants.txt');
    const restaurants = readRestaurantsFromFile(filePath);
    console.log(`Read ${restaurants.length} restaurants from file`);
    
    if (restaurants.length === 0) {
      console.error('No valid restaurants found in file');
      return;
    }
    
    // Process each restaurant to get place details and neighborhood
    const processedRestaurants = [...restaurants];
    
    for (let i = 0; i < processedRestaurants.length; i++) {
      const restaurant = processedRestaurants[i];
      console.log(`\nProcessing restaurant ${i+1}/${restaurants.length}: ${restaurant.name}`);
      
      // Look up place
      const placeResult = await lookupPlace(restaurant.name, restaurant.city_name);
      
      if (placeResult.status !== 'OK' || !placeResult.data || placeResult.data.length === 0) {
        console.log(`No place found for ${restaurant.name}, skipping`);
        restaurant.status = 'error';
        restaurant.message = 'No place found';
        continue;
      }
      
      // Use the first place result
      const placeId = placeResult.data[0].place_id;
      restaurant.placeId = placeId;
      
      // Get place details
      const detailsResult = await getPlaceDetails(placeId);
      
      if (detailsResult.status !== 'OK' || !detailsResult.data || !detailsResult.data.data) {
        console.log(`No place details found for ${restaurant.name}, skipping`);
        restaurant.status = 'error';
        restaurant.message = 'No place details found';
        continue;
      }
      
      const placeData = detailsResult.data.data;
      
      // Extract address components
      const address = placeData.formattedAddress;
      const zipcode = placeData.zipcode;
      
      console.log(`Found address: ${address}, zipcode: ${zipcode}`);
      
      // Update restaurant with address info
      restaurant.address = address;
      restaurant.zipcode = zipcode;
      restaurant.latitude = placeData.location?.lat || 0;
      restaurant.longitude = placeData.location?.lng || 0;
      
      // Look up neighborhood by zipcode
      if (zipcode) {
        const neighborhoodResult = await lookupNeighborhood(zipcode);
        
        if (neighborhoodResult.status === 'OK' && neighborhoodResult.data.length > 0) {
          const neighborhood = neighborhoodResult.data[0];
          console.log(`Found neighborhood: ${neighborhood.name} (ID: ${neighborhood.id})`);
          
          restaurant.neighborhood_id = neighborhood.id;
          restaurant.neighborhood = neighborhood.name;
          restaurant.city_id = neighborhood.city_id || 1;
        } else {
          console.log(`No neighborhood found for zipcode ${zipcode}, using default`);
          restaurant.neighborhood_id = 1; // Default to first neighborhood
          restaurant.neighborhood = 'Default Neighborhood';
          restaurant.city_id = 1; // Default to New York
        }
      } else {
        console.log(`No zipcode found, using default neighborhood`);
        restaurant.neighborhood_id = 1; // Default to first neighborhood
        restaurant.neighborhood = 'Default Neighborhood';
        restaurant.city_id = 1; // Default to New York
      }
      
      restaurant.status = 'ready';
      restaurant.message = 'Ready for submission';
    }
    
    // Filter out restaurants with errors
    const readyRestaurants = processedRestaurants.filter(r => r.status === 'ready');
    console.log(`\n${readyRestaurants.length} restaurants ready for submission`);
    
    // Display restaurants with their neighborhoods
    console.log('\n=== Processed Restaurants with Neighborhoods ===');
    readyRestaurants.forEach(r => {
      console.log(`${r.name} - Neighborhood: ${r.neighborhood} (ID: ${r.neighborhood_id}), Zipcode: ${r.zipcode}`);
    });
    
    // Check for duplicates
    console.log('\n=== Checking for Duplicates ===');
    const duplicateResult = await checkDuplicates(readyRestaurants);
    
    if (duplicateResult.status === 'OK') {
      const duplicates = duplicateResult.duplicates;
      console.log(`Found ${duplicates.length} duplicates`);
      
      if (duplicates.length > 0) {
        console.log('\n=== Duplicate Restaurants ===');
        duplicates.forEach(d => {
          console.log(`${d.item.name} - Duplicate of: ${d.existing.name} (ID: ${d.existing.id})`);
        });
      }
      
      // Mark duplicates
      const restaurantsWithDuplicates = readyRestaurants.map(restaurant => {
        const duplicate = duplicates.find(d => 
          d.item && d.item.name === restaurant.name
        );
        
        if (duplicate) {
          return {
            ...restaurant,
            isDuplicate: true,
            duplicateInfo: duplicate.existing,
            status: 'duplicate',
            message: `Duplicate of existing restaurant (ID: ${duplicate.existing.id})`
          };
        }
        
        return restaurant;
      });
      
      // Filter out duplicates for submission
      const uniqueRestaurants = restaurantsWithDuplicates.filter(r => !r.isDuplicate);
      console.log(`\n${uniqueRestaurants.length} unique restaurants ready for submission`);
      
      if (uniqueRestaurants.length > 0) {
        // Submit restaurants
        console.log('\n=== Submitting Restaurants ===');
        const submitResult = await submitRestaurants(uniqueRestaurants);
        
        if (submitResult.status === 'OK') {
          console.log('Restaurants submitted successfully');
          
          // Display results
          const successCount = submitResult.data.data?.successCount || 0;
          const failureCount = submitResult.data.data?.failureCount || 0;
          
          console.log(`\nResults: ${successCount} added, ${failureCount} failed`);
          
          if (failureCount > 0 && submitResult.data.data?.errors) {
            console.log('\n=== Submission Errors ===');
            submitResult.data.data.errors.forEach(error => {
              console.log(`${error.itemProvided.name} - Error: ${error.error}`);
            });
          }
        } else {
          console.log('Failed to submit restaurants');
        }
      } else {
        console.log('No unique restaurants to submit');
      }
    } else {
      console.log('Failed to check for duplicates');
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
main().catch(console.error); 