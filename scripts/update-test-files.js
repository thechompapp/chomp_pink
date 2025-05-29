import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DIR = path.join(__dirname, '..', 'tests');

async function updateTestFiles(dir) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        await updateTestFiles(fullPath);
      } else if (file.name.endsWith('.test.js') || file.name.endsWith('.test.jsx')) {
        await updateTestFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

async function updateTestFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Skip if already updated
    if (content.includes('from \'vitest\'') || content.includes('from "vitest"')) {
      console.log(`Skipping ${filePath} - already updated`);
      return;
    }
    
    let updated = false;
    
    // Add vitest import if not present
    if (!content.includes('import { vi }') && !content.includes('import vi from')) {
      const importStatement = 'import { vi } from \'vitest\';\n\n';
      const importMatch = content.match(/^(\/\*\*[\s\S]*?\*\/\s*\n)?(\s*\n)?/);
      const insertPos = importMatch ? importMatch[0].length : 0;
      content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
      updated = true;
    }
    
    // Replace jest.mock with vi.mock
    if (content.includes('jest.mock(')) {
      content = content.replace(/jest\.mock\(/g, 'vi.mock(');
      updated = true;
    }
    
    // Replace jest.fn with vi.fn
    if (content.includes('jest.fn(')) {
      content = content.replace(/jest\.fn\(/g, 'vi.fn(');
      updated = true;
    }
    
    // Replace jest.spyOn with vi.spyOn
    if (content.includes('jest.spyOn(')) {
      content = content.replace(/jest\.spyOn\(/g, 'vi.spyOn(');
      updated = true;
    }
    
    // Replace other common jest globals
    const replacements = [
      ['jest.clearAllMocks', 'vi.clearAllMocks'],
      ['jest.resetAllMocks', 'vi.resetAllMocks'],
      ['jest.useFakeTimers', 'vi.useFakeTimers'],
      ['jest.runAllTimers', 'vi.runAllTimers'],
      ['jest.advanceTimersByTime', 'vi.advanceTimersByTime'],
      ['jest.setSystemTime', 'vi.setSystemTime'],
      ['jest.getRealSystemTime', 'vi.getRealSystemTime'],
      ['jest.useRealTimers', 'vi.useRealTimers']
    ];
    
    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        const regex = new RegExp(escapeRegExp(from), 'g');
        content = content.replace(regex, to);
        updated = true;
      }
    }
    
    if (updated) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run the updater
async function main() {
  console.log('Updating test files to use Vitest syntax...');
  await updateTestFiles(TEST_DIR);
  console.log('Done!');
}

main().catch(console.error);
