import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const TEST_DIRECTORIES = [
  'src/__tests__/e2e',
  'src/__tests__/integration',
  'src/__tests__/unit'
];

const TEST_TIMEOUT = 10000; // 10 seconds for most tests
const E2E_TEST_TIMEOUT = 30000; // 30 seconds for E2E tests

// Helper function to process a single file
async function processFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Skip if already has a timeout constant
    if (content.includes('const TEST_TIMEOUT =')) {
      console.log(`Skipping ${filePath} - already has timeout`);
      return;
    }
    
    // Determine the appropriate timeout
    const isE2E = filePath.includes('/e2e/');
    const timeoutValue = isE2E ? E2E_TEST_TIMEOUT : TEST_TIMEOUT;
    
    // Add timeout constant after the last import
    const importsEnd = Math.max(
      content.lastIndexOf("import '"),
      content.lastIndexOf('import "'),
      content.lastIndexOf('import ')
    );
    
    let newContent = content;
    if (importsEnd > -1) {
      const importEndLine = content.indexOf('\n', importsEnd) + 1;
      newContent = 
        content.substring(0, importEndLine) + 
        `\n// Test timeout (${timeoutValue/1000} seconds)\n` +
        `const TEST_TIMEOUT = ${timeoutValue};` +
        content.substring(importEndLine);
    } else {
      // If no imports found, add at the top
      newContent = 
        `// Test timeout (${timeoutValue/1000} seconds)\n` +
        `const TEST_TIMEOUT = ${timeoutValue};\n\n` + content;
    }
    
    // Add timeout to describe blocks
    newContent = newContent.replace(
      /(describe\s*\([^,)]+)(\)\s*=>\s*\{)/g, 
      `$1, ${timeoutValue}$2`
    );
    
    // Add timeout to it/test blocks
    newContent = newContent.replace(
      /(it|test)\s*\(([^,)]+)(\)\s*=>\s*\{)/g, 
      `$1($2, ${timeoutValue}$3`
    );
    
    await fs.writeFile(filePath, newContent, 'utf8');
    console.log(`Updated timeouts in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Main function to process all test files
async function main() {
  for (const dir of TEST_DIRECTORIES) {
    const fullPath = path.join(process.cwd(), dir);
    
    try {
      await fs.access(fullPath);
    } catch {
      console.log(`Directory not found: ${fullPath}`);
      continue;
    }
    
    console.log(`Processing directory: ${fullPath}`);
    
    // Recursively find all test files
    const files = [];
    async function findTestFiles(dirPath) {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          await findTestFiles(fullPath);
        } else if (item.isFile() && 
                  (item.name.endsWith('.test.js') || 
                   item.name.endsWith('.e2e.js') ||
                   item.name.endsWith('.spec.js'))) {
          files.push(fullPath);
        }
      }
    }
    
    await findTestFiles(fullPath);
    
    // Process each file
    for (const file of files) {
      await processFile(file);
    }
  }
  
  console.log('Finished updating test timeouts');
}

// Run the script
main().catch(console.error);
