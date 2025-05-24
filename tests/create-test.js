#!/usr/bin/env node

/**
 * Script to create a new test file with the correct structure
 * Usage: node create-test.js <test-type> <test-name> [subtype]
 * Example: node create-test.js e2e auth-login features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get command line arguments
const testType = process.argv[2];
const testName = process.argv[3];
const subType = process.argv[4];

// Validate arguments
if (!testType || !testName) {
  console.error('Usage: node create-test.js <test-type> <test-name> [subtype]');
  console.error('  test-type: e2e, integration, unit');
  console.error('  test-name: name of the test (e.g., auth-login)');
  console.error('  subtype: for e2e (api, features), for unit (services, components)');
  process.exit(1);
}

// Determine the test file path based on the test type
let testFilePath;
let testFileName;

switch (testType) {
  case 'e2e':
    const e2eSubType = subType || 'features'; // Default to features if not specified
    if (e2eSubType !== 'api' && e2eSubType !== 'features') {
      console.error('Invalid e2e subtype. Must be "api" or "features".');
      process.exit(1);
    }
    testFileName = `${testName}-e2e-test.js`;
    testFilePath = path.join(__dirname, 'e2e', e2eSubType, testFileName);
    break;
  case 'integration':
    testFileName = `${testName}.test.js`;
    testFilePath = path.join(__dirname, 'integration', testFileName);
    break;
  case 'unit':
    const unitSubType = subType || 'services'; // Default to services if not specified
    testFileName = `${testName}.test.js`;
    testFilePath = path.join(__dirname, 'unit', unitSubType, testFileName);
    break;
  default:
    console.error(`Unknown test type: ${testType}`);
    console.error('Valid test types: e2e, integration, unit');
    process.exit(1);
}

// Check if the file already exists
if (fs.existsSync(testFilePath)) {
  rl.question(`File ${testFilePath} already exists. Overwrite? (y/N) `, answer => {
    if (answer.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      rl.close();
      process.exit(0);
    } else {
      createTestFile();
    }
  });
} else {
  createTestFile();
}

// Function to create the test file
function createTestFile() {
  // Generate test file content based on test type
  let testContent;
  
  switch (testType) {
    case 'e2e':
      if (subType === 'api') {
        testContent = generateE2EApiTestContent(testName);
      } else {
        testContent = generateE2EFeatureTestContent(testName);
      }
      break;
    case 'integration':
      testContent = generateIntegrationTestContent(testName);
      break;
    case 'unit':
      testContent = generateUnitTestContent(testName, subType);
      break;
  }
  
  // Ensure the directory exists
  const testDir = path.dirname(testFilePath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Write the test file
  fs.writeFileSync(testFilePath, testContent);
  console.log(`Created test file: ${testFilePath}`);
  rl.close();
}

// Template generators
function generateE2EApiTestContent(testName) {
  return `/**
 * E2E API Test: ${testName}
 * Tests the API endpoints related to ${testName.replace(/-/g, ' ')}
 */

import { expect } from 'chai';
import { apiClient } from '../../setup/robust-api-client.js';

describe('${testName.replace(/-/g, ' ')} API E2E Tests', () => {
  let authToken;
  
  before(async () => {
    // Setup: Login or any other prerequisites
    try {
      const response = await apiClient.post('/auth/login', {
        email: 'admin@example.com',
        password: 'doof123'
      });
      
      authToken = response.data.token;
      apiClient.setAuthToken(authToken);
    } catch (error) {
      console.error('Setup failed:', error.message);
      throw error;
    }
  });
  
  after(() => {
    // Cleanup
    apiClient.clearAuthToken();
  });
  
  it('should test something specific to ${testName.replace(/-/g, ' ')}', async () => {
    // Test implementation
    expect(true).to.be.true;
  });
  
  // Add more test cases as needed
});
`;
}

function generateE2EFeatureTestContent(testName) {
  return `/**
 * E2E Feature Test: ${testName}
 * Tests the complete user flow for ${testName.replace(/-/g, ' ')}
 */

import { expect } from 'chai';
import { apiClient } from '../../setup/robust-api-client.js';

describe('${testName.replace(/-/g, ' ')} Feature E2E Tests', () => {
  let authToken;
  let userId;
  
  before(async () => {
    // Setup: Create test user, login, etc.
    try {
      // Register a test user
      const registerResponse = await apiClient.post('/auth/register', {
        username: \`test_user_\${Date.now()}\`,
        email: \`test_\${Date.now()}@example.com\`,
        password: 'testpassword123'
      });
      
      // Login as the test user
      const loginResponse = await apiClient.post('/auth/login', {
        email: registerResponse.data.user.email,
        password: 'testpassword123'
      });
      
      authToken = loginResponse.data.token;
      userId = loginResponse.data.user.id;
      apiClient.setAuthToken(authToken);
    } catch (error) {
      console.error('Setup failed:', error.message);
      throw error;
    }
  });
  
  after(async () => {
    // Cleanup: Delete test user, etc.
    try {
      if (userId) {
        await apiClient.delete(\`/users/\${userId}\`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
    
    apiClient.clearAuthToken();
  });
  
  it('should complete the ${testName.replace(/-/g, ' ')} user flow successfully', async () => {
    // Test implementation for the complete user flow
    expect(true).to.be.true;
  });
  
  // Add more test cases for different scenarios
});
`;
}

function generateIntegrationTestContent(testName) {
  return `/**
 * Integration Test: ${testName}
 * Tests the integration between components related to ${testName.replace(/-/g, ' ')}
 */

import { expect } from 'chai';
import { apiClient } from '../setup/simplified-api-client.js';

describe('${testName.replace(/-/g, ' ')} Integration Tests', () => {
  before(async () => {
    // Setup
  });
  
  after(() => {
    // Cleanup
  });
  
  it('should test the integration of ${testName.replace(/-/g, ' ')} components', async () => {
    // Test implementation
    expect(true).to.be.true;
  });
  
  // Add more test cases as needed
});
`;
}

function generateUnitTestContent(testName, subType) {
  if (subType === 'services') {
    return `/**
 * Unit Test: ${testName}
 * Tests the functionality of the ${testName} service
 */

import { expect } from 'chai';
import { ${testName} } from '../../../src/services/${testName}.js';

describe('${testName} Service Unit Tests', () => {
  it('should test a specific function in the ${testName} service', () => {
    // Test implementation
    expect(true).to.be.true;
  });
  
  // Add more test cases for different functions in the service
});
`;
  } else {
    return `/**
 * Unit Test: ${testName}
 * Tests the functionality of the ${testName} component/module
 */

import { expect } from 'chai';

describe('${testName} Unit Tests', () => {
  it('should test a specific functionality of ${testName}', () => {
    // Test implementation
    expect(true).to.be.true;
  });
  
  // Add more test cases as needed
});
`;
  }
}
