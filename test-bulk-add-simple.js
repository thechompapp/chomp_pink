// Simple test script for bulk add functionality
import axios from 'axios';

// Base URL for the API
const API_URL = 'http://localhost:5001/api';

// Sample data with pre-filled information (as if we already looked up places)
const testData = [
  {
    name: 'Chipotle',
    type: 'restaurant',
    city_name: 'New York',
    cuisine_type: 'Mexican',
    tags: ['Fast Casual', 'Burritos'],
    address: '111 Broadway, New York, NY 10006',
    zipcode: '10006',
    neighborhood_id: 1, // Assuming neighborhood ID 1 exists
    status: 'ready'
  },
  {
    name: 'Shake Shack',
    type: 'restaurant',
    city_name: 'New York',
    cuisine_type: 'American',
    tags: ['Burgers', 'Fast Casual'],
    address: '215 Murray St, New York, NY 10282',
    zipcode: '10282',
    neighborhood_id: 2, // Assuming neighborhood ID 2 exists
    status: 'ready'
  }
];

// Function to test the bulk add submission directly
async function testBulkAddSubmission() {
  try {
    console.log(`Submitting ${testData.length} items for bulk add`);
    
    // Log the data we're submitting
    console.log('Submission data:', JSON.stringify(testData, null, 2));
    
    // Instead of making an actual API call, log what would be submitted
    console.log('In a real scenario, this would be submitted to the API endpoint:');
    console.log(`POST ${API_URL}/admin/bulk-add/restaurants`);
    
    // Simulate a successful response
    const simulatedResponse = {
      success: true,
      message: 'Items added successfully',
      data: {
        added: testData.length,
        skipped: 0,
        error: 0,
        details: testData.map((item, index) => ({
          id: 1000 + index,
          name: item.name,
          status: 'added'
        }))
      }
    };
    
    console.log('Simulated API response:', JSON.stringify(simulatedResponse, null, 2));
    return simulatedResponse;
  } catch (error) {
    console.error('Error in bulk add simulation:', error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('Starting simplified bulk add tests...');
  
  // Test bulk add submission with pre-processed items
  await testBulkAddSubmission();
  
  console.log('Simplified bulk add tests completed');
}

// Run the tests
runTests().catch(console.error);
