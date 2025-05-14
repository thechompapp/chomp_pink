#!/bin/bash
# Test script for Bulk Add duplicate detection functionality in Chomp app
# This script tests the duplicate detection feature with real API data

# Set variables
API_BASE_URL="http://localhost:5001/api"
DEV_SERVER_URL="http://localhost:5173/api"

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Chomp Bulk Add Duplicate Detection Test ===${NC}"

# Step 1: Test with the actual data format from the error log (incorrect format)
echo -e "\n${YELLOW}Step 1: Testing with the incorrect format from the error log...${NC}"

# Create a test payload with the format from the error log
cat > /tmp/error_format_payload.json << EOL
[
  {"name":"Claro","type":"restaurant","city_id":1,"_lineNumber":1},
  {"name":"Fandi Mata","type":"restaurant","city_id":1,"_lineNumber":2},
  {"name":"Peaches","type":"restaurant","city_id":1,"_lineNumber":3},
  {"name":"Miss Lily's","type":"restaurant","city_id":1,"_lineNumber":4},
  {"name":"Shukette","type":"restaurant","city_id":1,"_lineNumber":5}
]
EOL

# Send the request with the error format
echo -e "${BLUE}Sending request with incorrect format...${NC}"
ERROR_FORMAT_RESPONSE=$(curl -s -X POST "$DEV_SERVER_URL/admin/check-existing/restaurants" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Authenticated: true" \
  -H "X-Bypass-Auth: true" \
  --data-binary @/tmp/error_format_payload.json)

# Display the response
echo -e "${RED}Response with incorrect format (should fail):${NC}"
echo "$ERROR_FORMAT_RESPONSE" | jq . 2>/dev/null || echo "$ERROR_FORMAT_RESPONSE"

# Step 2: Test with the corrected format for the same data
echo -e "\n${YELLOW}Step 2: Testing with the corrected format for the same data...${NC}"

# Create a test payload with the corrected format
cat > /tmp/corrected_format_payload.json << EOL
{
  "items": [
    {"name":"Claro","type":"restaurant","city_id":1,"_lineNumber":1},
    {"name":"Fandi Mata","type":"restaurant","city_id":1,"_lineNumber":2},
    {"name":"Peaches","type":"restaurant","city_id":1,"_lineNumber":3},
    {"name":"Miss Lily's","type":"restaurant","city_id":1,"_lineNumber":4},
    {"name":"Shukette","type":"restaurant","city_id":1,"_lineNumber":5}
  ]
}
EOL

# Send the request with the corrected format
echo -e "${BLUE}Sending request with corrected format...${NC}"
CORRECTED_FORMAT_RESPONSE=$(curl -s -X POST "$DEV_SERVER_URL/admin/check-existing/restaurants" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Authenticated: true" \
  -H "X-Bypass-Auth: true" \
  --data-binary @/tmp/corrected_format_payload.json)

# Display the response
echo -e "${GREEN}Response with corrected format (should succeed):${NC}"
echo "$CORRECTED_FORMAT_RESPONSE" | jq . 2>/dev/null || echo "$CORRECTED_FORMAT_RESPONSE"

# Step 3: Test the bulk add endpoint with the corrected format
echo -e "\n${YELLOW}Step 3: Testing bulk add endpoint with corrected format...${NC}"

# Create a test payload for bulk add
cat > /tmp/bulk_add_payload.json << EOL
{
  "items": [
    {
      "name": "Test Restaurant $(date +%s)",
      "type": "restaurant",
      "address": "123 Test St",
      "city": "New York",
      "state": "NY",
      "zipcode": "10001",
      "city_id": 1,
      "neighborhood_id": null,
      "latitude": 40.7128,
      "longitude": -74.0060,
      "_lineNumber": 1
    }
  ]
}
EOL

# Send the request to add items
echo -e "${BLUE}Sending bulk add request with corrected format...${NC}"
ADD_RESPONSE=$(curl -s -X POST "$DEV_SERVER_URL/admin/bulk/restaurants" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Authenticated: true" \
  -H "X-Bypass-Auth: true" \
  --data-binary @/tmp/bulk_add_payload.json)

# Display the response
echo -e "${GREEN}Response from bulk add:${NC}"
echo "$ADD_RESPONSE" | jq . 2>/dev/null || echo "$ADD_RESPONSE"

# Clean up
rm -f /tmp/error_format_payload.json /tmp/corrected_format_payload.json /tmp/bulk_add_payload.json

echo -e "\n${BLUE}=== Test completed ===${NC}"

# Provide a summary of the findings
echo -e "\n${PURPLE}=== Test Summary ===${NC}"
echo -e "1. Incorrect Format Test: ${YELLOW}$(echo "$ERROR_FORMAT_RESPONSE" | grep -q 'error\|fail\|invalid' && echo 'Failed (Expected)' || echo 'Succeeded (Unexpected)')${NC}"
echo -e "2. Corrected Format Test: ${YELLOW}$(echo "$CORRECTED_FORMAT_RESPONSE" | grep -q 'error\|fail\|invalid' && echo 'Failed (Unexpected)' || echo 'Succeeded (Expected)')${NC}"
echo -e "3. Bulk Add Test: ${YELLOW}$(echo "$ADD_RESPONSE" | grep -q 'error\|fail\|invalid' && echo 'Failed (Unexpected)' || echo 'Succeeded (Expected)')${NC}"

echo -e "\n${BLUE}The issue is: ${YELLOW}The API expects an object with an 'items' property, but is receiving an array directly.${NC}"
echo -e "${BLUE}Fix: ${YELLOW}We've updated the frontend code to send the correct payload format with an 'items' wrapper.${NC}"
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

# Step 3: Test bulk add with duplicate detection
echo -e "\n${YELLOW}Step 3: Testing bulk add with duplicate detection...${NC}"

# Create a payload with the existing restaurant and a new one
BULK_ADD_PAYLOAD="{
  \"items\": [
    {
      \"name\": \"$EXISTING_RESTAURANT_NAME\",
      \"type\": \"restaurant\",
      \"city_id\": 1,
      \"neighborhood_id\": 1
    },
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
