#!/bin/bash

# Script to run E2E tests with proper environment setup
# This script will:
# 1. Start the backend server if not already running
# 2. Run the E2E tests with proper configuration

# Configuration
BACKEND_DIR="./doof-backend"
BACKEND_PORT=5001
FRONTEND_PORT=5173

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Chomp/Doof E2E Test Runner =====${NC}"
echo "Setting up environment for E2E tests..."

# Check if backend server is running
if nc -z localhost $BACKEND_PORT 2>/dev/null; then
    echo -e "${GREEN}✓ Backend server is already running on port $BACKEND_PORT${NC}"
else
    echo -e "${YELLOW}⚠ Backend server is not running. Starting it now...${NC}"
    
    # Start backend server
    cd "$BACKEND_DIR" || { echo -e "${RED}Error: Could not navigate to backend directory${NC}"; exit 1; }
    
    # Run backend server in background
    echo "Starting backend server..."
    ./start-backend.sh &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo "Waiting for backend server to start..."
    for i in {1..30}; do
        if nc -z localhost $BACKEND_PORT 2>/dev/null; then
            echo -e "${GREEN}✓ Backend server started successfully${NC}"
            break
        fi
        
        if [ $i -eq 30 ]; then
            echo -e "${RED}Error: Backend server failed to start${NC}"
            kill $BACKEND_PID 2>/dev/null
            exit 1
        fi
        
        echo -n "."
        sleep 1
    done
    
    cd ..
fi

# Run database setup for tests
echo "Setting up test database..."
node tests/setup/db-setup.js

# Run E2E tests
echo -e "${YELLOW}Running E2E tests...${NC}"

# Run API tests first
echo "Running API tests..."
npm run test:e2e:api

# Run feature tests
echo "Running feature tests..."
npm run test:e2e:features

echo -e "${GREEN}===== E2E Tests Completed =====${NC}"
