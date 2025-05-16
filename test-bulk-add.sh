#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API base URL
API_BASE_URL="http://localhost:5001/api"

echo -e "${GREEN}Testing Bulk Add API${NC}"

# Function to authenticate and get JWT token
get_auth_token() {
  echo -e "${YELLOW}Authenticating to get token...${NC}"
  
  RESPONSE=$(curl -v -X POST "${API_BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"doof123"}' 2>&1)
  
  # Extract the token from the Cookie header
  TOKEN=$(echo "$RESPONSE" | grep -o "Set-Cookie: token=[^;]*" | cut -d'=' -f2)
  
  if [ -z "$TOKEN" ]; then
    echo -e "${RED}Authentication failed!${NC}"
    echo "Could not extract token from response"
    return 1
  fi
  
  echo -e "${GREEN}Authentication successful!${NC}"
  echo "$TOKEN"
}

# Get authentication token
TOKEN=$(get_auth_token)

# Check if authentication was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to get authentication token. Exiting.${NC}"
  exit 1
fi

# Test bulk add with our test restaurants
echo -e "\n${GREEN}=== Step 1: Testing Bulk Add with 5 Restaurants ===${NC}"

BULK_ADD_PAYLOAD='{
  "items": [
    {
      "name": "Maison Yaki",
      "type": "restaurant",
      "address": "626 Vanderbilt Ave, Brooklyn, NY 11238",
      "city": "New York",
      "state": "NY",
      "zipcode": "11238",
      "city_id": 1,
      "neighborhood_id": 26,
      "latitude": 40.6796875,
      "longitude": -73.9689685,
      "tags": ["Japanese", "French"],
      "_lineNumber": 1
    },
    {
      "name": "Kru",
      "type": "restaurant",
      "address": "190 N 14th St, Brooklyn, NY 11249",
      "city": "New York",
      "state": "NY",
      "zipcode": "11249",
      "city_id": 1,
      "neighborhood_id": 22,
      "latitude": 40.7223431,
      "longitude": -73.9521788,
      "tags": ["Thai", "Modern"],
      "_lineNumber": 2
    },
    {
      "name": "King",
      "type": "restaurant",
      "address": "18 King St, New York, NY 10014",
      "city": "New York",
      "state": "NY",
      "zipcode": "10014",
      "city_id": 1,
      "neighborhood_id": 8,
      "latitude": 40.7286333,
      "longitude": -74.0066635,
      "tags": ["Italian", "Mediterranean"],
      "_lineNumber": 3
    },
    {
      "name": "Zaytinya",
      "type": "restaurant",
      "address": "1185 Broadway, New York, NY 10001",
      "city": "New York",
      "state": "NY",
      "zipcode": "10001",
      "city_id": 1,
      "neighborhood_id": 1,
      "latitude": 40.7449887,
      "longitude": -73.9889297,
      "tags": ["Mediterranean", "Turkish", "Greek"],
      "_lineNumber": 4
    },
    {
      "name": "Cholita Cuencana",
      "type": "restaurant",
      "address": "59-08 Roosevelt Ave, Woodside, NY 11377",
      "city": "New York",
      "state": "NY",
      "zipcode": "11377",
      "city_id": 1,
      "neighborhood_id": 1,
      "latitude": 40.7451098,
      "longitude": -73.9066386,
      "tags": ["Ecuadorian", "South American"],
      "_lineNumber": 5
    }
  ]
}'

echo -e "${YELLOW}Submitting bulk add request...${NC}"
BULK_ADD_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/admin/bulk/restaurants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$BULK_ADD_PAYLOAD")

echo -e "${GREEN}Bulk Add Response:${NC}"
echo "$BULK_ADD_RESPONSE"
echo "" # Add newline

# Check the duplicate detection status
echo -e "\n${GREEN}=== Step 2: Checking for Duplicates After Bulk Add ===${NC}"

CHECK_EXISTING_PAYLOAD='{
  "items": [
    {"name": "Maison Yaki", "type": "restaurant", "city_id": 1, "_lineNumber": 1},
    {"name": "Kru", "type": "restaurant", "city_id": 1, "_lineNumber": 2},
    {"name": "King", "type": "restaurant", "city_id": 1, "_lineNumber": 3},
    {"name": "Zaytinya", "type": "restaurant", "city_id": 1, "_lineNumber": 4},
    {"name": "Cholita Cuencana", "type": "restaurant", "city_id": 1, "_lineNumber": 5}
  ]
}'

echo -e "${YELLOW}Checking for duplicates...${NC}"
CHECK_EXISTING_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/admin/check-existing/restaurants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$CHECK_EXISTING_PAYLOAD")

echo -e "${GREEN}Duplicate Check Response:${NC}"
echo "$CHECK_EXISTING_RESPONSE"
echo "" # Add newline

# Check for duplicates in the response text
DUPLICATE_COUNT=$(echo "$CHECK_EXISTING_RESPONSE" | grep -c '"existing":')
echo -e "${GREEN}Number of duplicates detected (approximate): $DUPLICATE_COUNT${NC}"

echo -e "\n${GREEN}Testing complete${NC}" 