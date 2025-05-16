#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting complete test suite...${NC}"

# 1. Kill any existing process on port 5001
echo -e "\n${YELLOW}Checking for processes on port 5001...${NC}"
PORT_PID=$(lsof -i :5001 | grep LISTEN | awk '{print $2}')
if [ -n "$PORT_PID" ]; then
  echo -e "Killing process $PORT_PID on port 5001"
  kill -9 $PORT_PID
  sleep 1
else
  echo -e "No process found using port 5001"
fi

# 2. Start the backend server
echo -e "\n${YELLOW}Starting backend server...${NC}"
cd doof-backend
npm run dev &
BACKEND_PID=$!
echo -e "Backend server started with PID: $BACKEND_PID"

# Wait for server to start
echo -e "Waiting for server to start..."
sleep 5

# 3. Run backend API tests
echo -e "\n${YELLOW}Running backend API tests...${NC}"
cd ..
./test-admin-api.sh

# 4. Insert the frontend test scripts
echo -e "\n${YELLOW}Preparing frontend tests...${NC}"
mkdir -p public
cp test-frontend.js public/
cp test-admin-frontend.js public/

# 5. Output instructions for frontend testing
echo -e "\n${YELLOW}Frontend test instructions:${NC}"
echo -e "1. Open your browser to http://localhost:5173"
echo -e "2. Navigate to the Admin panel"
echo -e "3. Open the browser console"
echo -e "4. Run the following command in the console: testAdminPanel()"
echo -e "5. Check the console output for test results"

# 6. Wait for user to press a key to continue
echo -e "\n${YELLOW}Press any key when you're done testing to clean up...${NC}"
read -n 1 -s

# 7. Clean up
echo -e "\n${YELLOW}Cleaning up...${NC}"
kill $BACKEND_PID
rm public/test-frontend.js
rm public/test-admin-frontend.js

echo -e "\n${GREEN}Tests completed!${NC}" 