#!/bin/bash
# Test script for Admin Panel data cleanup

echo "Testing Admin Panel Data Cleanup API"
echo "==================================="

# Set variables
API_URL="http://localhost:3000"
AUTH_TOKEN="your_auth_token_here"  # Replace with actual token

# Test 1: Check API health
echo -e "\n1. Checking API health..."
curl -s "${API_URL}/admin/cleanup/health" | jq

# Test 2: Analyze restaurant data for cleanup opportunities
echo -e "\n2. Analyzing restaurant data..."
curl -s -H "Authorization: Bearer ${AUTH_TOKEN}" "${API_URL}/admin/cleanup/analyze/restaurants" | jq

# Test 3: Analyze dishes data
echo -e "\n3. Analyzing dishes data..."
curl -s -H "Authorization: Bearer ${AUTH_TOKEN}" "${API_URL}/admin/cleanup/analyze/dishes" | jq

# Test 4: Analyze hashtags data
echo -e "\n4. Analyzing hashtags data..."
curl -s -H "Authorization: Bearer ${AUTH_TOKEN}" "${API_URL}/admin/cleanup/analyze/hashtags" | jq

# Test 5: Apply changes to a specific resource (example with restaurant)
echo -e "\n5. Applying changes to restaurants..."
echo "This would be an interactive step where an admin reviews and approves changes"
echo "Example curl command:"
echo "curl -s -X POST -H \"Authorization: Bearer \${AUTH_TOKEN}\" -H \"Content-Type: application/json\" -d '{\"changeIds\":[\"change-id-1\",\"change-id-2\"]}' \"${API_URL}/admin/cleanup/apply/restaurants\""

echo -e "\nTests completed"
