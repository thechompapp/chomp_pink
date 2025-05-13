#!/bin/bash
# Test script for Bulk Add duplicate detection functionality in Chomp app
# This script tests the duplicate detection feature with real API data

# Set variables
API_BASE_URL="http://localhost:5001/api"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="doof123"

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Chomp Bulk Add Duplicate Detection Test ===${NC}"
echo "Testing with API base URL: $API_BASE_URL"

# Step 1: Login as admin user to get authentication token
echo -e "\n${YELLOW}Step 1: Authenticating as admin user...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# The API uses cookies for authentication instead of tokens
# Save the response cookies to a file
echo "$AUTH_RESPONSE" > /tmp/auth_response.txt
curl -s -c /tmp/chomp_cookies.txt -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}Authentication successful!${NC}"
  echo "Response: $(echo $AUTH_RESPONSE | cut -c 1-100)... (truncated)"
else
  echo -e "${RED}Authentication failed. Response: $AUTH_RESPONSE${NC}"
  exit 1
fi

# Step 2: Get a list of existing restaurants to use for duplicate detection test
echo -e "\n${YELLOW}Step 2: Fetching existing restaurants...${NC}"
RESTAURANTS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/admin/restaurants" \
  -b /tmp/chomp_cookies.txt)

# Extract the first restaurant from the response
if echo "$RESTAURANTS_RESPONSE" | grep -q '"name"'; then
  EXISTING_RESTAURANT_NAME=$(echo $RESTAURANTS_RESPONSE | grep -o '"name":"[^"]*' | head -1 | sed 's/"name":"//')
  EXISTING_RESTAURANT_ID=$(echo $RESTAURANTS_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
  
  echo -e "${GREEN}Found existing restaurant: $EXISTING_RESTAURANT_NAME (ID: $EXISTING_RESTAURANT_ID)${NC}"
else
  echo -e "${RED}Failed to fetch existing restaurants. Response: $RESTAURANTS_RESPONSE${NC}"
  exit 1
fi

# Step 3: Test the check-existing endpoint
echo -e "\n${YELLOW}Step 3: Testing check-existing endpoint...${NC}"

# Create a test payload with the existing restaurant
cat > /tmp/check_existing_payload.json << EOF
{
  "items": [
    {
      "name": "$EXISTING_RESTAURANT_NAME",
      "type": "restaurant",
      "city_id": 1,
      "_lineNumber": 1
    }
  ]
}
EOF

echo "Check Existing Payload:"
cat /tmp/check_existing_payload.json

# Call the check-existing endpoint
CHECK_EXISTING_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/check-existing/restaurants" \
  -H "Content-Type: application/json" \
  -b /tmp/chomp_cookies.txt \
  -d @/tmp/check_existing_payload.json)

echo -e "\nCheck Existing Response:"
echo "$CHECK_EXISTING_RESPONSE" | sed 's/,/,\n/g' | sed 's/{/{\n/g' | sed 's/}/\n}/g'

# Check if the response indicates a duplicate
if echo "$CHECK_EXISTING_RESPONSE" | grep -q '"existing":'; then
  echo -e "${GREEN}Duplicate detection working! Found existing restaurant.${NC}"
else
  echo -e "${RED}Duplicate detection failed. Response does not contain expected 'existing' field.${NC}"
fi

# Step 4: Test with a new restaurant that should not be a duplicate
echo -e "\n${YELLOW}Step 4: Testing with a new restaurant (non-duplicate)...${NC}"

# Generate a unique restaurant name with timestamp
UNIQUE_NAME="Test Restaurant $(date +%s)"

# Create a test payload with a unique restaurant name
cat > /tmp/check_unique_payload.json << EOF
{
  "items": [
    {
      "name": "$UNIQUE_NAME",
      "type": "restaurant",
      "city_id": 1,
      "_lineNumber": 1
    }
  ]
}
EOF

echo "Check Unique Payload:"
cat /tmp/check_unique_payload.json

# Call the check-existing endpoint
CHECK_UNIQUE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/check-existing/restaurants" \
  -H "Content-Type: application/json" \
  -b /tmp/chomp_cookies.txt \
  -d @/tmp/check_unique_payload.json)

echo -e "\nCheck Unique Response:"
echo "$CHECK_UNIQUE_RESPONSE" | sed 's/,/,\n/g' | sed 's/{/{\n/g' | sed 's/}/\n}/g'

# Check if the response indicates no duplicate
if echo "$CHECK_UNIQUE_RESPONSE" | grep -q '"existing":null'; then
  echo -e "${GREEN}Duplicate detection working! Correctly identified non-duplicate restaurant.${NC}"
else
  echo -e "${RED}Duplicate detection failed. Response does not indicate a non-duplicate as expected.${NC}"
fi

# Clean up
rm -f /tmp/auth_response.txt
rm -f /tmp/chomp_cookies.txt
rm -f /tmp/check_existing_payload.json
rm -f /tmp/check_unique_payload.json

echo -e "\n${BLUE}=== Test Script Completed ===${NC}"
