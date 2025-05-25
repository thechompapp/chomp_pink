import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing test files
const testDir = path.join(__dirname, '../src/__tests__/integration');

// Files to update
const filesToUpdate = [
  'simplified-auth.test.js',
  'simplified-dishes.test.js',
  'simplified-restaurants.test.js'
];

// Main function to update test files
async function updateTestFiles() {
  for (const file of filesToUpdate) {
    const filePath = path.join(testDir, file);
    
    // Skip if file doesn't exist
    try {
      await fs.promises.access(filePath);
    } catch (err) {
      console.log(`Skipping ${file} - file not found`);
      continue;
    }
    
    try {
      // Read file content
      let content = await fs.promises.readFile(filePath, 'utf8');
      
      // Update import statement
      content = content.replace(
        /import\s+\{\s*config\s*\}\s+from\s+['"]\.\.\/setup\/config\.js['"]\s*;/,
        'import { testUsers, endpoints } from \'../setup/config.js\';'
      );
      
      // Update config.testUsers to testUsers
      content = content.replace(
        /config\.testUsers/g,
        'testUsers'
      );
      
      // Update config.endpoints to endpoints
      content = content.replace(
        /config\.endpoints/g,
        'endpoints'
      );
      
      // Write updated content back to file
      await fs.promises.writeFile(filePath, content, 'utf8');
      console.log(`✅ Updated ${file}`);
    } catch (err) {
      console.error(`❌ Error updating ${file}:`, err.message);
    }
  }
}

// Run the update
updateTestFiles()
  .then(() => console.log('\n✅ All test files have been updated.'))
  .catch(err => console.error('❌ Error updating test files:', err));
