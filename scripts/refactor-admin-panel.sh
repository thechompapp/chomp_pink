#!/bin/bash

# Script to refactor the AdminPanel component

echo "Creating backup of AdminPanel files..."
mkdir -p /Users/naf/Downloads/doof/backup_cleanup/AdminPanel
cp -r /Users/naf/Downloads/doof/src/pages/AdminPanel/* /Users/naf/Downloads/doof/backup_cleanup/AdminPanel/

echo "Creating new AdminPanel component structure..."
mkdir -p /Users/naf/Downloads/doof/src/pages/AdminPanel/{components,hooks,utils}

# Create AdminPanelLayout component
echo "Creating AdminPanelLayout component..."
