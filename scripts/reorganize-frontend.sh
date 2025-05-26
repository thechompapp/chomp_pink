#!/bin/bash

# Script to reorganize the frontend directory structure in the Chomp application

echo "Creating new directory structure..."

# Create new directories
mkdir -p /Users/naf/Downloads/doof/src/components/{common,forms,layout,feature}
mkdir -p /Users/naf/Downloads/doof/src/hooks/{api,auth,ui}
mkdir -p /Users/naf/Downloads/doof/src/services/api

# Move context files to contexts
echo "Consolidating context directories..."
if [ -d "/Users/naf/Downloads/doof/src/context" ]; then
  mkdir -p /Users/naf/Downloads/doof/backup_cleanup/context
  cp -r /Users/naf/Downloads/doof/src/context/* /Users/naf/Downloads/doof/backup_cleanup/context/
  cp -r /Users/naf/Downloads/doof/src/context/* /Users/naf/Downloads/doof/src/contexts/ 2>/dev/null
fi

# Move auth hooks to hooks/auth
echo "Organizing hooks..."
if [ -d "/Users/naf/Downloads/doof/src/hooks/auth" ]; then
  echo "Auth hooks directory already exists"
else
  mkdir -p /Users/naf/Downloads/doof/src/hooks/auth
  find /Users/naf/Downloads/doof/src/hooks -name "*Auth*.js" -exec cp {} /Users/naf/Downloads/doof/src/hooks/auth/ \; 2>/dev/null
fi

# Move API-related hooks to hooks/api
echo "Organizing API hooks..."
mkdir -p /Users/naf/Downloads/doof/src/hooks/api
find /Users/naf/Downloads/doof/src/hooks -name "*Api*.js" -o -name "*api*.js" -exec cp {} /Users/naf/Downloads/doof/src/hooks/api/ \; 2>/dev/null

# Move UI-related hooks to hooks/ui
echo "Organizing UI hooks..."
mkdir -p /Users/naf/Downloads/doof/src/hooks/ui
find /Users/naf/Downloads/doof/src/hooks -name "*UI*.js" -o -name "*ui*.js" -o -name "*Form*.js" -o -name "*Modal*.js" -exec cp {} /Users/naf/Downloads/doof/src/hooks/ui/ \; 2>/dev/null

echo "Frontend reorganization complete!"
