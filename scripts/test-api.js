import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_TIMEOUT = 10000;

// Test cases
const tests = [
  {
    name: 'Health Check',
    method: 'get',
    endpoint: '/health',
    validate: (response) => {
      if (response.status !== 200) throw new Error(`Expected status 200, got ${response.status}`);
      console.log('✅ Health check passed');
      return true;
    }
  },
  {
    name: 'Database Status',
    method: 'get',
    endpoint: '/health',
    validate: (response) => {
      if (!response.data.databasePool) throw new Error('Missing databasePool in response');
      console.log('✅ Database status check passed');
      return true;
    }
  },
  {
    name: 'Memory Usage',
    method: 'get',
    endpoint: '/health',
    validate: (response) => {
      if (!response.data.memoryUsage) throw new Error('Missing memoryUsage in response');
      console.log('✅ Memory usage check passed');
      return true;
    }
  }
];

// Run tests
async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  let passed = 0;
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🧪 Running test: ${test.name}`);
      const response = await axios({
        method: test.method,
        url: `${API_BASE_URL}${test.endpoint}`,
        timeout: TEST_TIMEOUT
      });
      
      const isValid = await test.validate(response);
      if (isValid) {
        passed++;
        results.push({ name: test.name, status: '✅ PASSED' });
      }
    } catch (error) {
      console.error(`❌ Test failed: ${test.name}`);
      console.error(`   Error: ${error.message}`);
      results.push({ 
        name: test.name, 
        status: '❌ FAILED', 
        error: error.message 
      });
    }
    console.log('');
  }
  
  // Print summary
  console.log('\n📊 Test Results:');
  console.log('='.repeat(50));
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.status}`);
    if (result.error) console.log(`   → ${result.error}`);
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ ${passed} passed | ❌ ${results.length - passed} failed`);
  console.log(`🏁 Tests completed at ${new Date().toISOString()}`);
  
  process.exit(passed === results.length ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error in test runner:', error);
  process.exit(1);
});
