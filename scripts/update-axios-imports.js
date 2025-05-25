import fs from 'fs';
import path from 'path';

// Files to update
const filesToUpdate = [
  'tests/setup/test-utils.js',
  'tests/integration/auth-basic.test.js',
  'tests/integration/dishes.test.js',
  'tests/integration/restaurants.test.js',
  'tests/integration/simple-restaurant.test.js',
  'tests/integration/search.test.js',
];

// Update each file
filesToUpdate.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const updatedContent = content.replace(
        /import\s+axios\s+from\s+['"]axios['"]/g,
        'import axios from \'axios/dist/node/axios.cjs\''
      );
      
      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, 'utf8');
        console.log(`Updated: ${filePath}`);
      } else {
        console.log(`No changes needed: ${filePath}`);
      }
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
});

console.log('Axios import updates complete!');
