#!/usr/bin/env node

/**
 * Migration Script: useAuthStore to useAuth
 * 
 * This script automatically migrates components from the deprecated useAuthStore
 * to the new useAuth() hook from AuthContext.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const minimatch = require('minimatch');

// Configuration
const SRC_DIR = path.join(__dirname, '../src');
const FILE_PATTERNS = ['**/*.jsx', '**/*.js'];
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.js',
  '**/*.test.jsx',
  '**/AuthMigrationHelper.js' // Keep this file as is
];

// Migration patterns
const MIGRATIONS = [
  {
    name: 'Import statement - default import',
    pattern: /import\s+useAuthStore\s+from\s+['"]@\/stores\/useAuthStore['"];?/g,
    replacement: "import { useAuth } from '@/contexts/auth/AuthContext';"
  },
  {
    name: 'Import statement - named import',
    pattern: /import\s+\{\s*useAuthStore\s*\}\s+from\s+['"]@\/stores\/useAuthStore['"];?/g,
    replacement: "import { useAuth } from '@/contexts/auth/AuthContext';"
  },
  {
    name: 'Hook usage - selector pattern',
    pattern: /const\s+(\w+)\s+=\s+useAuthStore\(\s*(?:state\s*=>\s*state\.(\w+)|(\w+)\s*=>\s*\w+\.(\w+))\s*\);?/g,
    replacement: (match, varName, prop1, selector, prop2) => {
      const prop = prop1 || prop2;
      return `const { ${prop}: ${varName} } = useAuth();`;
    }
  },
  {
    name: 'Hook usage - destructuring',
    pattern: /const\s+\{\s*([^}]+)\s*\}\s+=\s+useAuthStore\(\s*(?:state\s*=>\s*\(\s*\{[^}]+\}\s*\)|)\s*\)\s*\|\|\s*\{\};?/g,
    replacement: 'const { $1 } = useAuth() || {};'
  },
  {
    name: 'Hook usage - simple destructuring',
    pattern: /const\s+\{\s*([^}]+)\s*\}\s+=\s+useAuthStore\(\);?/g,
    replacement: 'const { $1 } = useAuth();'
  },
  {
    name: 'Hook usage - single property',
    pattern: /useAuthStore\(\s*(?:state\s*=>\s*state\.(\w+)|\(\s*state\s*\)\s*=>\s*state\.(\w+))\s*\)/g,
    replacement: (match, prop1, prop2) => {
      const prop = prop1 || prop2;
      return `useAuth().${prop}`;
    }
  }
];

// Utility functions
function shouldProcessFile(filePath) {
  // Check if file matches include patterns
  const matchesPattern = FILE_PATTERNS.some(pattern => 
    minimatch(filePath, pattern)
  );
  
  if (!matchesPattern) return false;
  
  // Check if file matches exclude patterns
  const matchesExclude = EXCLUDE_PATTERNS.some(pattern => 
    minimatch(filePath, pattern)
  );
  
  return !matchesExclude;
}

function migrateFileContent(content, filePath) {
  let modified = false;
  let newContent = content;
  const appliedMigrations = [];

  // Check if file uses useAuthStore
  if (!content.includes('useAuthStore')) {
    return { content: newContent, modified: false, appliedMigrations: [] };
  }

  // Apply migrations
  for (const migration of MIGRATIONS) {
    const originalContent = newContent;
    
    if (typeof migration.replacement === 'function') {
      newContent = newContent.replace(migration.pattern, migration.replacement);
    } else {
      newContent = newContent.replace(migration.pattern, migration.replacement);
    }
    
    if (newContent !== originalContent) {
      modified = true;
      appliedMigrations.push(migration.name);
    }
  }

  // Add comment about migration
  if (modified && !content.includes('// Migrated from useAuthStore')) {
    const importIndex = newContent.indexOf("import { useAuth }");
    if (importIndex !== -1) {
      const lineEnd = newContent.indexOf('\n', importIndex);
      newContent = newContent.slice(0, lineEnd) + ' // Migrated from useAuthStore' + newContent.slice(lineEnd);
    }
  }

  return { content: newContent, modified, appliedMigrations };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = migrateFileContent(content, filePath);
    
    if (result.modified) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✅ Migrated: ${path.relative(SRC_DIR, filePath)}`);
      if (result.appliedMigrations.length > 0) {
        console.log(`   Applied: ${result.appliedMigrations.join(', ')}`);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting useAuthStore to useAuth migration...\n');
  
  // Find all files to process
  const allFiles = [];
  for (const pattern of FILE_PATTERNS) {
    const files = glob.sync(pattern, { 
      cwd: SRC_DIR,
      absolute: true,
      ignore: EXCLUDE_PATTERNS 
    });
    allFiles.push(...files);
  }
  
  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];
  
  console.log(`Found ${uniqueFiles.length} files to check...\n`);
  
  let processedCount = 0;
  let migratedCount = 0;
  
  for (const filePath of uniqueFiles) {
    if (shouldProcessFile(path.relative(SRC_DIR, filePath))) {
      processedCount++;
      if (processFile(filePath)) {
        migratedCount++;
      }
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`   Files checked: ${processedCount}`);
  console.log(`   Files migrated: ${migratedCount}`);
  console.log(`   Files unchanged: ${processedCount - migratedCount}`);
  
  if (migratedCount > 0) {
    console.log('\n✨ Migration completed successfully!');
    console.log('🔍 Please review the changes and test your application.');
  } else {
    console.log('\n✅ No files needed migration.');
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { migrateFileContent, MIGRATIONS }; 