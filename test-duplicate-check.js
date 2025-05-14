// Test script to verify the duplicate detection functionality
import { adminService } from './src/services/adminService.js';
import { logDebug, logError } from './src/utils/logger.js';

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

// Run the test
testDuplicateDetection().catch(err => {
  console.error('Unhandled error during test:', err);
});
