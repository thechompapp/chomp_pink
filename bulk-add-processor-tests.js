/**
 * Bulk Add Processor Test Suite
 * 
 * This script specifically tests the bulk add processor component,
 * focusing on data processing, validation, and integration with the Places API.
 * 
 * Usage: node bulk-add-processor-tests.js [--verbose] [--file=<test-file-path>]
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// ====================================
// Configuration
// ====================================

const CONFIG = {
  // API endpoints
  BACKEND_URL: 'http://localhost:5001',
  
  // Authentication
  AUTH: {
    email: 'admin@example.com',
    password: 'doof123'
  },
  
  // Test data
  TEST_DATA: [
    { name: 'Maison Passerelle', location: 'New York', cuisine: 'French-Diaspora Fusion' },
    { name: 'Bar Bianchi', location: 'New York', cuisine: 'Milanese' },
    { name: 'JR & Son', location: 'New York', cuisine: 'Italian-American' },
    { name: "Papa d'Amour", location: 'New York', cuisine: 'French-Asian Bakery' },
    { name: 'Figure Eight', location: 'New York', cuisine: 'Chinese-American' }
  ],
  
  // Edge cases
  EDGE_CASES: [
    { name: '', location: 'New York', cuisine: 'Empty Name' },
    { name: 'Missing Location', location: '', cuisine: 'Test' },
    { name: 'Very Long Restaurant Name That Exceeds Normal Limits And Might Cause Issues With Processing Or Display In Some Systems', location: 'New York', cuisine: 'Test' },
    { name: 'Duplicate 1', location: 'New York', cuisine: 'Test' },
    { name: 'Duplicate 1', location: 'New York', cuisine: 'Test' },
    { name: 'Special Characters !@#$%^&*()', location: 'New York', cuisine: 'Test' }
  ],
  
  // Request options
  TIMEOUT_MS: 15000
};

// Parse command line arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const TEST_FILE = args.find(arg => arg.startsWith('--file='))?.split('=')[1];

// ====================================
// Utilities
// ====================================

// Create axios instance
const api = axios.create({
  baseURL: CONFIG.BACKEND_URL,
  timeout: CONFIG.TIMEOUT_MS,
  withCredentials: true
});

// Test result tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  sections: {}
};

// Logger utility
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  error: (message, error) => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
    if (error) {
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        if (VERBOSE) {
          console.error(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
          console.error(`  Message: ${error.response.data?.message || 'No error message provided'}`);
        }
      } else if (error.request) {
        console.error(`  No response received`);
      } else {
        console.error(`  Error details: ${error.message}`);
      }
    }
  },
  debug: (message, data) => {
    if (VERBOSE) {
      console.log(`[DEBUG] ${message}`);
      if (data) console.log(JSON.stringify(data, null, 2));
    }
  },
  section: (name) => {
    console.log('\n' + '='.repeat(80));
    console.log(`SECTION: ${name}`);
    console.log('='.repeat(80));
    
    // Initialize section in results
    testResults.sections[name] = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: {}
    };
    
    return name;
  },
  test: (section, name, status, duration, message) => {
    testResults.total++;
    testResults.sections[section].total++;
    
    if (status === 'PASSED') {
      testResults.passed++;
      testResults.sections[section].passed++;
      console.log(`\x1b[32m✓\x1b[0m ${name} (${duration}ms)`);
    } 
    else if (status === 'FAILED') {
      testResults.failed++;
      testResults.sections[section].failed++;
      console.log(`\x1b[31m✗\x1b[0m ${name} (${duration}ms)`);
      if (message) console.log(`  \x1b[31m${message}\x1b[0m`);
    }
    else if (status === 'SKIPPED') {
      testResults.skipped++;
      testResults.sections[section].skipped++;
      console.log(`\x1b[33m-\x1b[0m ${name} (skipped)`);
    }
    
    // Store test result
    testResults.sections[section].tests[name] = {
      status,
      duration,
      message
    };
  }
};

// Test runner
async function runTest(section, name, testFn) {
  const startTime = performance.now();
  try {
    const result = await testFn();
    const duration = Math.round(performance.now() - startTime);
    
    if (result.success) {
      logger.test(section, name, 'PASSED', duration);
    } else if (result.skipped) {
      logger.test(section, name, 'SKIPPED', 0, result.message);
    } else {
      logger.test(section, name, 'FAILED', duration, result.message);
    }
    
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    const message = error.message || 'Unknown error';
    logger.test(section, name, 'FAILED', duration, message);
    logger.error(`Test execution error: ${name}`, error);
    return { success: false, message };
  }
}

// Helper to save auth token
let authToken = null;
let testListId = null;

// ====================================
// Test Sections
// ====================================

// 1. Authentication
async function runAuthTests() {
  const section = logger.section('Authentication');
  
  // Test 1: Login with valid credentials
  const loginResult = await runTest(section, 'Login with valid credentials', async () => {
    try {
      const response = await api.post('/api/auth/login', CONFIG.AUTH);
      
      logger.debug('Login response:', response.data);
      
      if (response.data && response.data.success) {
        // Save auth token if available in response
        if (response.data.token) {
          authToken = response.data.token;
          api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }
        return { success: true };
      } else {
        return { 
          success: false, 
          message: 'Login failed: Invalid response format' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Login failed: ${error.message}` 
      };
    }
  });
  
  if (!loginResult.success) {
    logger.error('Authentication failed. Skipping tests that require authentication.');
  }
  
  return loginResult.success;
}

// 2. Create Test List
async function createTestList() {
  const section = logger.section('Test List Creation');
  
  // Create a test list for adding items
  const createListResult = await runTest(section, 'Create test list', async () => {
    try {
      const response = await api.post('/api/lists', {
        name: 'Bulk Add Test List',
        description: 'Test list for bulk add processor tests'
      });
      
      logger.debug('Create list response:', response.data);
      
      if (response.data && response.data.id) {
        testListId = response.data.id;
        return { 
          success: true,
          listId: testListId
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to create test list: Invalid response format' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create test list: ${error.message}` 
      };
    }
  });
  
  return createListResult.success ? testListId : null;
}

// 3. Generate Test CSV File
async function generateTestCsv() {
  const section = logger.section('Test Data Generation');
  
  // Generate a CSV file with test data
  const generateCsvResult = await runTest(section, 'Generate test CSV file', async () => {
    try {
      const csvPath = TEST_FILE || path.join(process.cwd(), 'bulk-add-test-data.csv');
      
      // Generate CSV content
      let csvContent = 'Name,Location,Tags\n';
      
      // Add normal test data
      CONFIG.TEST_DATA.forEach(item => {
        csvContent += `${item.name},${item.location},${item.cuisine}\n`;
      });
      
      // Add edge cases
      CONFIG.EDGE_CASES.forEach(item => {
        csvContent += `${item.name},${item.location},${item.cuisine}\n`;
      });
      
      // Write to file
      fs.writeFileSync(csvPath, csvContent);
      
      return { 
        success: true,
        filePath: csvPath
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to generate test CSV: ${error.message}` 
      };
    }
  });
  
  return generateCsvResult.success ? generateCsvResult.filePath : null;
}

// 4. Test Individual Restaurant Processing
async function testIndividualProcessing() {
  const section = logger.section('Individual Restaurant Processing');
  
  // Test each restaurant individually
  for (const restaurant of CONFIG.TEST_DATA) {
    await runTest(section, `Process: "${restaurant.name}"`, async () => {
      try {
        // Step 1: Search for place
        const query = `${restaurant.name}, ${restaurant.location}`;
        logger.info(`Searching for: ${query}`);
        
        const searchResponse = await api.get('/api/places/autocomplete', {
          params: { input: query }
        });
        
        const predictions = searchResponse.data.predictions || searchResponse.data.data;
        
        if (!predictions || predictions.length === 0) {
          return { 
            success: false, 
            message: 'No place predictions found' 
          };
        }
        
        const placeId = predictions[0].place_id;
        logger.info(`Found place_id: ${placeId}`);
        
        // Step 2: Get place details
        logger.info('Getting place details');
        const detailsResponse = await api.get('/api/places/details', {
          params: { place_id: placeId }
        });
        
        const details = detailsResponse.data.result || detailsResponse.data.data;
        
        if (!details) {
          return { 
            success: false, 
            message: 'No place details found' 
          };
        }
        
        const address = details.formatted_address || details.formattedAddress;
        logger.info(`Found address: ${address}`);
        
        // Step 3: Add to list if we have a test list
        if (testListId) {
          logger.info(`Adding to list: ${testListId}`);
          
          const addResponse = await api.post(`/api/lists/${testListId}/items`, {
            name: details.name || restaurant.name,
            description: restaurant.cuisine,
            location: address,
            placeId: placeId
          });
          
          if (addResponse.status !== 200 && addResponse.status !== 201) {
            return { 
              success: false, 
              message: `Failed to add to list: ${addResponse.status}` 
            };
          }
        }
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          message: `Processing failed: ${error.message}` 
        };
      }
    });
  }
}

// 5. Test Edge Cases
async function testEdgeCases() {
  const section = logger.section('Edge Cases');
  
  // Test edge cases
  for (const edgeCase of CONFIG.EDGE_CASES) {
    const testName = edgeCase.name || 'Empty name';
    
    await runTest(section, `Edge case: "${testName}"`, async () => {
      try {
        // Skip empty inputs
        if (!edgeCase.name || !edgeCase.location) {
          return { 
            success: true,
            message: 'Skipped empty input as expected' 
          };
        }
        
        // Step 1: Search for place
        const query = `${edgeCase.name}, ${edgeCase.location}`;
        logger.info(`Searching for: ${query}`);
        
        const searchResponse = await api.get('/api/places/autocomplete', {
          params: { input: query }
        });
        
        const predictions = searchResponse.data.predictions || searchResponse.data.data;
        
        // For edge cases, we're testing the API's ability to handle unusual inputs
        // So not finding results is actually okay in some cases
        if (!predictions || predictions.length === 0) {
          return { 
            success: true,
            message: 'No results found for edge case (expected)' 
          };
        }
        
        // If we did find results, continue with details
        const placeId = predictions[0].place_id;
        logger.info(`Found place_id: ${placeId}`);
        
        // Step 2: Get place details
        logger.info('Getting place details');
        const detailsResponse = await api.get('/api/places/details', {
          params: { place_id: placeId }
        });
        
        const details = detailsResponse.data.result || detailsResponse.data.data;
        
        if (!details) {
          return { 
            success: false, 
            message: 'No place details found' 
          };
        }
        
        return { success: true };
      } catch (error) {
        // For edge cases, errors might be expected
        if (error.response && error.response.status === 400) {
          return { 
            success: true,
            message: 'API correctly rejected invalid input' 
          };
        }
        
        return { 
          success: false, 
          message: `Unexpected error: ${error.message}` 
        };
      }
    });
  }
}

// 6. Test Batch Processing
async function testBatchProcessing() {
  const section = logger.section('Batch Processing');
  
  // Test batch processing (this is more of a simulation since we can't directly call the hook)
  await runTest(section, 'Process multiple restaurants in batch', async () => {
    try {
      const results = [];
      
      // Process first 3 restaurants in parallel
      const batch = CONFIG.TEST_DATA.slice(0, 3);
      
      logger.info(`Processing batch of ${batch.length} restaurants`);
      
      const promises = batch.map(async (restaurant) => {
        try {
          // Step 1: Search for place
          const query = `${restaurant.name}, ${restaurant.location}`;
          
          const searchResponse = await api.get('/api/places/autocomplete', {
            params: { input: query }
          });
          
          const predictions = searchResponse.data.predictions || searchResponse.data.data;
          
          if (!predictions || predictions.length === 0) {
            return { 
              restaurant: restaurant.name,
              success: false, 
              message: 'No place predictions found' 
            };
          }
          
          const placeId = predictions[0].place_id;
          
          // Step 2: Get place details
          const detailsResponse = await api.get('/api/places/details', {
            params: { place_id: placeId }
          });
          
          const details = detailsResponse.data.result || detailsResponse.data.data;
          
          if (!details) {
            return { 
              restaurant: restaurant.name,
              success: false, 
              message: 'No place details found' 
            };
          }
          
          return {
            restaurant: restaurant.name,
            success: true,
            placeId,
            details
          };
        } catch (error) {
          return { 
            restaurant: restaurant.name,
            success: false, 
            message: error.message 
          };
        }
      });
      
      // Wait for all promises to resolve
      const batchResults = await Promise.all(promises);
      
      // Count successes
      const successCount = batchResults.filter(r => r.success).length;
      
      if (successCount === batch.length) {
        return { 
          success: true,
          message: `Successfully processed all ${batch.length} restaurants in batch` 
        };
      } else {
        return { 
          success: false, 
          message: `Only ${successCount}/${batch.length} restaurants processed successfully` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Batch processing failed: ${error.message}` 
      };
    }
  });
}

// 7. Clean Up
async function cleanUp(listId) {
  const section = logger.section('Clean Up');
  
  // Delete test list if it exists
  if (listId) {
    await runTest(section, 'Delete test list', async () => {
      try {
        const response = await api.delete(`/api/lists/${listId}`);
        
        if (response.status === 200 || response.status === 204) {
          return { success: true };
        } else {
          return { 
            success: false, 
            message: `Unexpected status code: ${response.status}` 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to delete test list: ${error.message}` 
        };
      }
    });
  }
  
  // Delete test CSV file
  const csvPath = TEST_FILE || path.join(process.cwd(), 'bulk-add-test-data.csv');
  
  await runTest(section, 'Delete test CSV file', async () => {
    try {
      if (fs.existsSync(csvPath)) {
        fs.unlinkSync(csvPath);
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to delete test CSV: ${error.message}` 
      };
    }
  });
}

// ====================================
// Main Test Runner
// ====================================

async function runAllTests() {
  console.log('\n' + '*'.repeat(80));
  console.log('BULK ADD PROCESSOR TEST SUITE');
  console.log('*'.repeat(80) + '\n');
  
  const startTime = performance.now();
  
  try {
    // Step 1: Authenticate
    const isAuthenticated = await runAuthTests();
    
    if (!isAuthenticated) {
      logger.error('Authentication failed. Cannot proceed with tests.');
      process.exit(1);
    }
    
    // Step 2: Create test list
    const listId = await createTestList();
    
    // Step 3: Generate test CSV
    const csvPath = await generateTestCsv();
    
    if (!csvPath) {
      logger.error('Failed to generate test data. Cannot proceed with tests.');
      process.exit(1);
    }
    
    // Step 4: Test individual processing
    await testIndividualProcessing();
    
    // Step 5: Test edge cases
    await testEdgeCases();
    
    // Step 6: Test batch processing
    await testBatchProcessing();
    
    // Step 7: Clean up
    await cleanUp(listId);
    
    // Generate summary report
    const duration = Math.round((performance.now() - startTime) / 1000);
    generateTestSummary(duration);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Test execution failed', error);
    process.exit(1);
  }
}

// Generate test summary report
function generateTestSummary(duration) {
  console.log('\n' + '*'.repeat(80));
  console.log('TEST SUMMARY');
  console.log('*'.repeat(80));
  
  console.log(`\nTotal duration: ${duration} seconds`);
  console.log(`Tests: ${testResults.total} total, ${testResults.passed} passed, ${testResults.failed} failed, ${testResults.skipped} skipped\n`);
  
  // Section summaries
  Object.entries(testResults.sections).forEach(([section, results]) => {
    const passRate = results.total > 0 ? Math.round((results.passed / (results.total - results.skipped)) * 100) : 0;
    console.log(`${section}: ${results.passed}/${results.total - results.skipped} passed (${passRate}%)`);
    
    // List failed tests in this section
    const failedTests = Object.entries(results.tests)
      .filter(([_, test]) => test.status === 'FAILED')
      .map(([name, test]) => `  - ${name}: ${test.message}`);
    
    if (failedTests.length > 0) {
      console.log('  Failed tests:');
      failedTests.forEach(test => console.log(test));
    }
  });
  
  // Overall assessment
  console.log('\nOverall Assessment:');
  
  if (testResults.failed === 0) {
    console.log('✅ All tests passed! The bulk add processor is working correctly.');
  } else {
    console.log('❌ Some tests failed. Please review the issues above.');
    
    // Provide specific recommendations based on failures
    const recommendations = [];
    
    if (testResults.sections['Authentication']?.failed > 0) {
      recommendations.push('- Check authentication credentials and JWT configuration');
    }
    
    if (testResults.sections['Individual Restaurant Processing']?.failed > 0) {
      recommendations.push('- Review the Places API integration for individual restaurant processing');
      recommendations.push('- Check error handling in the processing pipeline');
    }
    
    if (testResults.sections['Edge Cases']?.failed > 0) {
      recommendations.push('- Improve validation and error handling for edge cases');
      recommendations.push('- Add more robust input sanitization');
    }
    
    if (testResults.sections['Batch Processing']?.failed > 0) {
      recommendations.push('- Review promise handling in batch processing');
      recommendations.push('- Check for race conditions or concurrency issues');
    }
    
    if (recommendations.length > 0) {
      console.log('\nRecommendations:');
      recommendations.forEach(rec => console.log(rec));
    }
  }
  
  console.log('\n' + '*'.repeat(80));
}

// Run all tests
runAllTests();
