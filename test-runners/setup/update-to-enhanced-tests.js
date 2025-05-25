/**
 * Update API Tests to Use Enhanced Test Setup
 * 
 * This script updates existing API test files to use the enhanced test setup
 * with improved reporting capabilities.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_TEST_DIR = path.join(__dirname, '..', 'e2e', 'api');
const OLD_IMPORT = "import { apiClient, tokenStorage, withAuth, TEST_TIMEOUT } from '../../setup/direct-http-client.js';";
const NEW_IMPORT = "import { apiClient, tokenStorage, withAuth, TEST_TIMEOUT } from '../../setup/enhanced-test-setup.js';";

/**
 * Update import statements in a file
 * @param {string} filePath - Path to the file to update
 * @returns {boolean} - Whether the file was updated
 */
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports from direct-http-client.js
    if (content.includes('direct-http-client.js')) {
      // Replace the import statement
      content = content.replace(
        /import.*from ['"]\.\.\/\.\.\/setup\/direct-http-client\.js['"];/g,
        NEW_IMPORT
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      return true;
    } else {
      console.log(`Skipped: ${filePath} (no direct-http-client import found)`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Find and update all API test files
 */
function updateAllApiTests() {
  try {
    // Get all JavaScript files in the API test directory
    const files = fs.readdirSync(API_TEST_DIR)
      .filter(file => file.endsWith('.test.js'))
      .map(file => path.join(API_TEST_DIR, file));
    
    console.log(`Found ${files.length} API test files`);
    
    // Update each file
    let updatedCount = 0;
    for (const file of files) {
      if (updateFile(file)) {
        updatedCount++;
      }
    }
    
    console.log(`\nSummary: Updated ${updatedCount} of ${files.length} files`);
    
    if (updatedCount > 0) {
      console.log('\nYou can now run tests with enhanced reporting using:');
      console.log('node tests/run-with-reporter.js tests/e2e/api');
    }
  } catch (error) {
    console.error('Error updating API tests:', error.message);
  }
}

// Run the update
updateAllApiTests();
