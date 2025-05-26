#!/bin/bash

# Script to complete the HTTP service migration
# This script helps finalize the migration from httpInterceptor.js to the new HTTP service

echo "Starting HTTP service migration completion..."

# Check which files are still using the old httpInterceptor
echo "Checking for files still using the old httpInterceptor..."
OLD_IMPORTS=$(grep -r "import.*from.*httpInterceptor" --include="*.js" --include="*.jsx" /Users/naf/Downloads/doof/src)

if [ -n "$OLD_IMPORTS" ]; then
  echo "The following files are still using the old httpInterceptor:"
  echo "$OLD_IMPORTS"
  echo ""
  echo "Please update these files to use the new HTTP service before proceeding."
  echo "You can use the migrate-http-service.mjs script to help with this:"
  echo "node scripts/migrate-http-service.mjs"
  exit 1
fi

echo "No files found using the old httpInterceptor. Proceeding with backup..."

# Create backup directory for old HTTP service files
mkdir -p /Users/naf/Downloads/doof/backup_cleanup/services/http

# Backup old HTTP service files
echo "Backing up old HTTP service files..."
cp /Users/naf/Downloads/doof/src/services/httpInterceptor.js /Users/naf/Downloads/doof/backup_cleanup/services/http/ 2>/dev/null || echo "httpInterceptor.js not found"
cp /Users/naf/Downloads/doof/src/services/axios-fix.js /Users/naf/Downloads/doof/backup_cleanup/services/http/ 2>/dev/null || echo "axios-fix.js not found"
cp /Users/naf/Downloads/doof/src/services/axios-method-fix.js /Users/naf/Downloads/doof/backup_cleanup/services/http/ 2>/dev/null || echo "axios-method-fix.js not found"
cp /Users/naf/Downloads/doof/src/services/axios-patch.js /Users/naf/Downloads/doof/backup_cleanup/services/http/ 2>/dev/null || echo "axios-patch.js not found"
cp /Users/naf/Downloads/doof/src/services/axios-simple-fix.js /Users/naf/Downloads/doof/backup_cleanup/services/http/ 2>/dev/null || echo "axios-simple-fix.js not found"
cp /Users/naf/Downloads/doof/src/services/axiosXhrFixer.js /Users/naf/Downloads/doof/backup_cleanup/services/http/ 2>/dev/null || echo "axiosXhrFixer.js not found"
cp /Users/naf/Downloads/doof/src/services/axios-init.js /Users/naf/Downloads/doof/backup_cleanup/services/http/ 2>/dev/null || echo "axios-init.js not found"

echo "HTTP service migration completed successfully!"
echo "The old HTTP service files have been backed up to /Users/naf/Downloads/doof/backup_cleanup/services/http/"
echo ""
echo "Note: The old files have not been deleted. Once you've verified that everything is working correctly,"
echo "you can safely delete them using:"
echo "rm /Users/naf/Downloads/doof/src/services/httpInterceptor.js"
echo "rm /Users/naf/Downloads/doof/src/services/axios-*.js"
echo "rm /Users/naf/Downloads/doof/src/services/axiosXhrFixer.js"
