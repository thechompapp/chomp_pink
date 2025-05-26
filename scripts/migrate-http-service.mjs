#!/usr/bin/env node

/**
 * Migration Script: httpInterceptor.js to @/services/http
 * 
 * This script helps migrate from the old httpInterceptor.js to the new
 * modular HTTP service structure. It updates import statements and function
 * calls to use the new API.
 * 
 * Usage:
 * 1. Run: node scripts/migrate-http-service.mjs --dry-run
 *    (to see what changes will be made)
 * 2. Run: node scripts/migrate-http-service.mjs
 *    (to apply the changes)
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Command } from 'commander';
import glob from 'glob';
import { fileURLToPath } from 'url';

// Convert __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const globAsync = promisify(glob);

// Command line options
const program = new Command();
program
  .option('--dry-run', 'Show what would be changed without making changes', false)
  .option('--path <path>', 'Path to process (default: src)', 'src')
  .parse(process.argv);

const options = program.opts();

// Migration patterns
const MIGRATIONS = [
  // Update import statements
  {
    pattern: /import\s+(?:{[^}]*\b(?:httpInterceptor|apiClient)\b[^}]*}|apiClient|httpInterceptor)\s+from\s+['"]@\/services\/(?:httpInterceptor|apiClient)['"]/g,
    replacement: "import { apiClient } from '@/services/http'",
    description: "Update imports from httpInterceptor/apiClient to @/services/http"
  },
  {
    pattern: /import\s+{\s*(getLoadingState|subscribeToLoadingState|isUrlLoading|useHttpLoading)\s*}\s+from\s+['"]@\/services\/(?:httpInterceptor|apiClient)['"]/g,
    replacement: "import { $1 } from '@/services/http'",
    description: "Update specific imports from httpInterceptor to @/services/http"
  },
  // Update function calls
  {
    pattern: /httpInterceptor\.(getLoadingState|subscribeToLoadingState|isUrlLoading|useHttpLoading)\(/g,
    replacement: "$1(",
    description: "Update httpInterceptor.x() calls to direct function calls"
  }
];

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let updatedContent = content;
    const changes = [];

    // Apply migrations
    for (const { pattern, replacement, description } of MIGRATIONS) {
      if (pattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(pattern, replacement);
        changes.push(description);
      }
    }

    // If changes were made, update the file
    if (updatedContent !== content) {
      if (!options.dryRun) {
        await writeFile(filePath, updatedContent, 'utf8');
      }
      return { filePath, changed: true, changes };
    }

    return { filePath, changed: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return { filePath, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log(`🔍 Scanning for files in ${options.path}...`);
    
    // Find all JavaScript and TypeScript files
    const files = await globAsync(`${options.path}/**/*.{js,jsx,ts,tsx}`, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**']
    });

    console.log(`📋 Found ${files.length} files to process`);
    
    // Process files
    const results = await Promise.all(files.map(processFile));
    
    // Summarize results
    const changedFiles = results.filter(r => r.changed);
    const errorFiles = results.filter(r => r.error);
    
    console.log('\n📊 Migration Summary:');
    console.log(`Total files scanned: ${files.length}`);
    console.log(`Files with changes: ${changedFiles.length}`);
    console.log(`Files with errors: ${errorFiles.length}`);
    
    if (options.dryRun) {
      console.log('\n🔍 Dry run mode - no changes were made');
      
      if (changedFiles.length > 0) {
        console.log('\n📝 Files that would be changed:');
        changedFiles.forEach(({ filePath, changes }) => {
          console.log(`  - ${filePath}`);
          changes.forEach(change => console.log(`    • ${change}`));
        });
      }
    } else if (changedFiles.length > 0) {
      console.log('\n✅ Changes applied to:');
      changedFiles.forEach(({ filePath, changes }) => {
        console.log(`  - ${filePath}`);
        changes.forEach(change => console.log(`    • ${change}`));
      });
    }
    
    if (errorFiles.length > 0) {
      console.log('\n❌ Errors:');
      errorFiles.forEach(({ filePath, error }) => {
        console.log(`  - ${filePath}: ${error}`);
      });
    }
    
    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
