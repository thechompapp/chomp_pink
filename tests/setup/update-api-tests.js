/**
 * Update API Tests Utility
 * 
 * This script updates all API test files to use the direct HTTP client
 * instead of axios to bypass CORS restrictions in the test environment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing API tests
const API_TESTS_DIR = path.join(__dirname, '..', 'e2e', 'api');

// Import statement to add to each test file
const DIRECT_CLIENT_IMPORT = "import { createDirectClient } from '../../../tests/setup/direct-http-client.js';";

// Function to update a test file
function updateTestFile(filePath) {
  console.log(`Updating test file: ${filePath}`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file already uses the direct client
  if (content.includes('direct-http-client.js')) {
    console.log(`  - File already uses direct HTTP client, skipping`);
    return;
  }
  
  // Replace axios import with direct client import
  content = content.replace(
    /import axios from ['"]axios['"];/g,
    DIRECT_CLIENT_IMPORT
  );
  
  // Replace axios.create with createDirectClient
  content = content.replace(
    /const apiClient = axios\.create\(\{[\s\S]*?\}\);/g,
    `const apiClient = createDirectClient('http://localhost:5001');`
  );
  
  // Remove axios interceptors if present
  content = content.replace(
    /apiClient\.interceptors[\s\S]*?}\);/g,
    ''
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content);
  console.log(`  - File updated successfully`);
}

// Find all test files in the API tests directory
function findTestFiles(dir) {
  const files = fs.readdirSync(dir);
  
  return files
    .filter(file => file.endsWith('.test.js') || file.endsWith('-e2e-test.js'))
    .map(file => path.join(dir, file));
}

// Main function
function main() {
  console.log('Updating API test files to use direct HTTP client...');
  
  // Get all test files
  const testFiles = findTestFiles(API_TESTS_DIR);
  console.log(`Found ${testFiles.length} test files`);
  
  // Update each test file
  testFiles.forEach(updateTestFile);
  
  console.log('Update complete!');
}

// Run the script
main();
