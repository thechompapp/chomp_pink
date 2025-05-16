// Test script to verify the duplicate detection functionality
import { adminService } from './src/services/adminService.js';
import { logDebug, logError } from './src/utils/logger.js';
const axios = require('axios');
const fs = require('fs');

// Test data with duplicates
const testPayload = {
  items: [
    {
      name: "Test Restaurant 1",
      type: "restaurant",
      city_id: 1,
      _lineNumber: 1
    },
    {
      name: "Test Restaurant 2",
      type: "restaurant",
      city_id: 1,
      _lineNumber: 2
    },
    {
      name: "Test Restaurant 1", // Duplicate
      type: "restaurant",
      city_id: 1,
      _lineNumber: 3
    }
  ]
};

// API base URL
const API_URL = 'http://localhost:5174/api';

// Test data - restaurants we want to check
const restaurants = [
  { name: "Maison Yaki", type: "restaurant", city_id: 1 },
  { name: "Kru", type: "restaurant", city_id: 1 },
  { name: "King", type: "restaurant", city_id: 1 },
  { name: "Zaytinya", type: "restaurant", city_id: 1 },
  { name: "Cholita Cuencana", type: "restaurant", city_id: 1 }
];

// Credentials for authentication
const credentials = {
  email: 'doof_user',
  password: 'doof_123'
};

// Function to test duplicate detection
async function testDuplicateDetection() {
  console.log('=== Testing Duplicate Detection ===');
  console.log('Test payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    console.log('Calling checkExistingItems...');
    const response = await adminService.checkExistingItems(testPayload, 'restaurants');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    if (response.success) {
      console.log('✅ Duplicate detection API call successful!');
      
      if (response.data && response.data.results) {
        console.log(`Found ${response.data.results.length} results`);
        
        // Check if duplicates were detected
        const duplicates = response.data.results.filter(result => result.existing);
        console.log(`Detected ${duplicates.length} duplicates`);
        
        if (duplicates.length > 0) {
          console.log('Duplicates:', duplicates);
        }
      }
    } else {
      console.error('❌ Duplicate detection failed:', response.message);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Main function
async function checkDuplicates() {
  try {
    console.log('Authenticating...');
    // Authenticate and get token
    const authResponse = await axios.post(`${API_URL}/auth/login`, credentials);
    
    if (!authResponse.data.success) {
      throw new Error(`Authentication failed: ${authResponse.data.message}`);
    }
    
    const token = authResponse.data.data.token;
    console.log('Authentication successful, received token');
    
    // Check for duplicates with authenticated request
    console.log('Checking for duplicates...');
    const duplicateCheckResponse = await axios.post(
      `${API_URL}/admin/check-existing/restaurants`, 
      { items: restaurants },
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        } 
      }
    );
    
    console.log('Duplicate check response:');
    console.log(JSON.stringify(duplicateCheckResponse.data, null, 2));
    
    // Process results
    if (duplicateCheckResponse.data.success) {
      const results = duplicateCheckResponse.data.data.results;
      
      if (results && results.length > 0) {
        console.log('\nSummary of duplicate check:');
        results.forEach(result => {
          const itemName = result.item ? result.item.name : 'Unknown';
          if (result.existing) {
            console.log(`✓ DUPLICATE: "${itemName}" already exists (ID: ${result.existing.id})`);
          } else {
            console.log(`✗ UNIQUE: "${itemName}" is not in the database`);
          }
        });
      } else {
        console.log('No detailed results returned from duplicate check');
      }
    } else {
      console.log(`Duplicate check failed: ${duplicateCheckResponse.data.message}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDuplicateDetection().catch(err => {
  console.error('Unhandled error during test:', err);
});

// Run the check
checkDuplicates();
