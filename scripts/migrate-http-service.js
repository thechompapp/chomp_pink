#!/usr/bin/env node

/**
 * Migration Script: httpInterceptor.js to @/services/http
 * 
 * This script helps migrate from the old httpInterceptor.js to the new
 * modular HTTP service structure. It updates import statements and function
 * calls to use the new API.
 * 
 * Usage:
 * 1. Run: node scripts/migrate-http-service.js --dry-run
 *    (to see what changes will be made)
 * 2. Run: node scripts/migrate-http-service.js
 *    (to apply the changes)
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Command } from 'commander';
import glob from 'glob';

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
    
    // Process each file
    const results = [];
    for (const file of files) {
      const result = await processFile(file);
      if (result.changed) {
        results.push(result);
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    
    if (results.length === 0) {
      console.log('✅ No files needed updating');
      return;
    }

    console.log(`✅ Updated ${results.length} files:\n`);
    
    for (const { filePath, changes } of results) {
      console.log(`📄 ${filePath}`);
      changes.forEach(change => console.log(`   • ${change}`));
      console.log();
    }

    if (options.dryRun) {
      console.log('\nℹ️  This was a dry run. No files were actually modified.');
      console.log('   Run without --dry-run to apply these changes.');
    } else {
      console.log('\n✅ Migration complete!');
      console.log('\nNext steps:');
      console.log('1. Review the changes made');
      console.log('2. Run your test suite to ensure everything works as expected');
      console.log('3. Commit the changes to your version control system');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
main();
