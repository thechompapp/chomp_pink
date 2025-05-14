#!/bin/bash
# Test script for Bulk Add functionality fixes in Chomp app
# This script tests the improved bulk add functionality with real API data

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

echo -e "${BLUE}=== Chomp Bulk Add Functionality Test ===${NC}"
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

# Step 2: Test bulk add with items from the error log
echo -e "\n${YELLOW}Step 2: Testing bulk add with items from error log...${NC}"

# Create a payload with the items from the error log
ERROR_LOG_PAYLOAD='{
  "items": [
    {
      "name": "Claro",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 24
    },
    {
      "name": "Fandi Mata",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 26
    },
    {
      "name": "Peaches",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 89
    },
    {
      "name": "Miss Lilys",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 4
    },
    {
      "name": "Shukette",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 1
    }
  ]
}'

echo "Sending payload:"
echo "$ERROR_LOG_PAYLOAD" | sed 's/,/,\n/g' | sed 's/{/{\n/g' | sed 's/}/\n}/g'

echo -e "\n${YELLOW}Sending bulk add request...${NC}"
BULK_ADD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/bulk/restaurants" \
  -b /tmp/chomp_cookies.txt \
  -H "Content-Type: application/json" \
  -d "$ERROR_LOG_PAYLOAD")

echo -e "\nResponse:"
echo "$BULK_ADD_RESPONSE" | sed 's/,/,\n/g' | sed 's/{/{\n/g' | sed 's/}/\n}/g'

# Check for successful additions
if echo "$BULK_ADD_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}Successfully processed items!${NC}"
  
  # Extract created items if available
  if echo "$BULK_ADD_RESPONSE" | grep -q '"createdItems"'; then
    CREATED_ITEMS=$(echo "$BULK_ADD_RESPONSE" | grep -o '"createdItems":[^}]*' | sed 's/"createdItems"://')
    echo -e "${GREEN}Created items: $CREATED_ITEMS${NC}"
  fi
  
  # Extract success count if available
  if echo "$BULK_ADD_RESPONSE" | grep -q '"successCount"'; then
    SUCCESS_COUNT=$(echo "$BULK_ADD_RESPONSE" | grep -o '"successCount":[0-9]*' | sed 's/"successCount"://')
    echo -e "${GREEN}Success count: $SUCCESS_COUNT${NC}"
  fi
else
  echo -e "${RED}Failed to add items. Response: $BULK_ADD_RESPONSE${NC}"
fi

# Step 3: Test with a mix of new and duplicate restaurants
echo -e "\n${YELLOW}Step 3: Testing with a mix of new and duplicate restaurants...${NC}"

# Create a payload with a mix of new and potentially duplicate restaurants
MIXED_PAYLOAD='{
  "items": [
    {
      "name": "Claro",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 24
    },
    {
      "name": "Unique Restaurant 1",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 1
    },
    {
      "name": "Unique Restaurant 2",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 2
    },
    {
      "name": "Peaches",
      "type": "restaurant",
      "city_id": 1,
      "neighborhood_id": 89
    }
  ]
}'

echo "Sending mixed payload:"
echo "$MIXED_PAYLOAD" | sed 's/,/,\n/g' | sed 's/{/{\n/g' | sed 's/}/\n}/g'

echo -e "\n${YELLOW}Sending mixed bulk add request...${NC}"
MIXED_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/bulk/restaurants" \
  -b /tmp/chomp_cookies.txt \
  -H "Content-Type: application/json" \
  -d "$MIXED_PAYLOAD")

echo -e "\nMixed Response:"
echo "$MIXED_RESPONSE" | sed 's/,/,\n/g' | sed 's/{/{\n/g' | sed 's/}/\n}/g'

# Check for duplicates in the response
if echo "$MIXED_RESPONSE" | grep -q '"duplicates"' || echo "$MIXED_RESPONSE" | grep -q '"duplicate"'; then
  echo -e "${GREEN}Duplicate detection working! Found duplicates in response.${NC}"
else
  echo -e "${YELLOW}No duplicates found in response. This could be normal if no duplicates exist.${NC}"
fi

# Check for successful additions
if echo "$MIXED_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}Successfully processed mixed items!${NC}"
else
  echo -e "${RED}Failed to process mixed items. Response: $MIXED_RESPONSE${NC}"
fi

# Clean up
rm -f /tmp/auth_response.txt
rm -f /tmp/chomp_cookies.txt

echo -e "\n${BLUE}=== Test Script Completed ===${NC}"
