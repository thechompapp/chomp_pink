#!/bin/bash

# Test Authentication and Offline Mode
# This script tests the authentication system and ensures that
# offline mode is properly disabled when a user is authenticated.

echo "Starting Authentication and Offline Mode Test"
echo "============================================="

# Ensure the server is running
if ! curl -s http://localhost:5001/api/health > /dev/null; then
  echo "Error: API server is not running. Please start the server first."
  echo "Run: npm run start-servers"
  exit 1
fi

# Run the test script
echo "Running authentication test script..."
node test-auth-offline-mode.js

# Check the result
if [ $? -eq 0 ]; then
  echo "✅ Authentication test passed!"
else
  echo "❌ Authentication test failed!"
fi

echo ""
echo "Manual verification steps:"
echo "1. Open the application in your browser"
echo "2. Log in with admin@example.com / doof123"
echo "3. Verify that admin features are visible in the navbar"
echo "4. Verify that the app is not in offline mode"
echo ""
echo "Test completed."
