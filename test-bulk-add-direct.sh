#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing Neighborhood Lookup and Bulk Add${NC}"

# Test neighborhood lookup for each zipcode
test_neighborhood() {
  local zipcode=$1
  echo -e "${YELLOW}Looking up neighborhood for zipcode: $zipcode${NC}"
  
  RESPONSE=$(curl -s -X GET "http://localhost:5001/api/neighborhoods/by-zipcode/$zipcode")
  
  echo -e "${GREEN}Response:${NC} $RESPONSE"
  echo ""
}

# Test for specific zipcodes
test_neighborhood "10014" # West Village
test_neighborhood "11249" # Williamsburg
test_neighborhood "10001" # Chelsea/Midtown

# Now let's prepare a bulk add payload based on the test data
echo -e "${YELLOW}Creating bulk add payload for testing${NC}"

# Function to authenticate and get JWT token
get_auth_token() {
  echo -e "${YELLOW}Authenticating to get token...${NC}"
  
  RESPONSE=$(curl -v -X POST "http://localhost:5001/api/auth/login" \
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

# Create the payload
cat > /tmp/bulk-add-payload.json << EOL
{
  "items": [
    {
      "name": "Maison Yaki",
      "type": "restaurant",
      "address": "626 Vanderbilt Ave, Brooklyn, NY 11238",
      "city": "New York",
      "state": "NY",
      "zipcode": "11238",
      "city_id": 1,
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
      "tags": ["Ecuadorian", "South American"],
      "_lineNumber": 5
    }
  ]
}
EOL

# Submit the bulk add request
echo -e "${YELLOW}Submitting bulk add request...${NC}"
BULK_ADD_RESPONSE=$(curl -s -X POST "http://localhost:5001/api/admin/bulk/restaurants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @/tmp/bulk-add-payload.json)

echo -e "${GREEN}Bulk Add Response:${NC}"
echo "$BULK_ADD_RESPONSE"
echo ""

# Clean up
rm /tmp/bulk-add-payload.json

echo -e "${GREEN}Testing complete${NC}" 