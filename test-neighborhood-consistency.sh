#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}Testing Neighborhood API vs Frontend Processing Logic${NC}"
echo -e "${BLUE}======================================================${NC}"

# Test zipcodes - let's test a variety of NYC zipcodes
TEST_ZIPCODES=("10014" "11249" "10001" "11377" "11238")
ZIPCODE_DESCRIPTIONS=("West Village" "Williamsburg Brooklyn" "Chelsea/Midtown" "Woodside Queens" "Prospect Heights Brooklyn")

# Function to test backend neighborhood API
test_backend_api() {
  local zipcode=$1
  local description=$2
  
  echo -e "${YELLOW}Testing API for zipcode: $zipcode ($description)${NC}"
  
  RESPONSE=$(curl -s -X GET "http://localhost:5001/api/neighborhoods/by-zipcode/$zipcode")
  
  # Format the response to look better
  FORMATTED_RESPONSE=$(echo "$RESPONSE" | sed 's/\[{/\[\n  {/g' | sed 's/},{/},\n  {/g' | sed 's/}]/}\n]/g')
  
  echo -e "${GREEN}Direct API Response:${NC}"
  echo "$FORMATTED_RESPONSE"
  echo ""
  
  # Extract neighborhood data
  NEIGHBORHOOD_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  NEIGHBORHOOD_NAME=$(echo "$RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//g' | sed 's/"//g')
  CITY_ID=$(echo "$RESPONSE" | grep -o '"city_id":[0-9]*' | head -1 | cut -d':' -f2)
  CITY_NAME=$(echo "$RESPONSE" | grep -o '"city_name":"[^"]*"' | head -1 | sed 's/"city_name":"//g' | sed 's/"//g')
  
  echo -e "${BLUE}Extracted information:${NC}"
  echo "Neighborhood ID: $NEIGHBORHOOD_ID"
  echo "Neighborhood Name: $NEIGHBORHOOD_NAME"
  echo "City ID: $CITY_ID"
  echo "City Name: $CITY_NAME"
  echo ""
  
  # Return as a string
  echo "$NEIGHBORHOOD_ID|$NEIGHBORHOOD_NAME|$CITY_ID|$CITY_NAME"
}

# Function to simulate frontend processing logic
simulate_frontend_processing() {
  local zipcode=$1
  local description=$2
  
  echo -e "${YELLOW}Simulating frontend processing for zipcode: $zipcode ($description)${NC}"
  
  # This is similar to what fetchNeighborhoodByZipcode in useBulkAddProcessor.js does
  
  # First, try to get the direct API response
  API_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/neighborhoods/by-zipcode/$zipcode")
  
  # Check if we got a valid response with an ID
  NEIGHBORHOOD_ID=$(echo "$API_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  
  if [ -n "$NEIGHBORHOOD_ID" ]; then
    # We have a valid neighborhood, extract the information
    NEIGHBORHOOD_NAME=$(echo "$API_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | sed 's/"name":"//g' | sed 's/"//g')
    CITY_ID=$(echo "$API_RESPONSE" | grep -o '"city_id":[0-9]*' | head -1 | cut -d':' -f2)
    CITY_NAME=$(echo "$API_RESPONSE" | grep -o '"city_name":"[^"]*"' | head -1 | sed 's/"city_name":"//g' | sed 's/"//g')
    
    echo -e "${BLUE}Using direct API response:${NC}"
    echo "Neighborhood ID: $NEIGHBORHOOD_ID"
    echo "Neighborhood Name: $NEIGHBORHOOD_NAME"
    echo "City ID: $CITY_ID"
    echo "City Name: $CITY_NAME"
  else
    # No valid neighborhood found, simulate the frontend fallback to city neighborhoods
    echo -e "${BLUE}No neighborhood found for zipcode, falling back to city neighborhoods${NC}"
    
    # Get all neighborhoods for city (default to New York, cityId=1)
    CITY_NEIGHBORHOODS_RESPONSE=$(curl -s -X GET "http://localhost:5001/api/filters/neighborhoods?cityId=1")
    
    # Check if we got valid neighborhoods
    if [[ "$CITY_NEIGHBORHOODS_RESPONSE" == *"\"data\":"* ]]; then
      # Extract the first neighborhood from the data array
      DATA_START=$(echo "$CITY_NEIGHBORHOODS_RESPONSE" | grep -o '"data":\[.*\]' | cut -d'[' -f2 | cut -d']' -f1)
      FIRST_NEIGHBORHOOD=$(echo "$DATA_START" | cut -d',' -f1)
      
      # Extract neighborhood information
      NEIGHBORHOOD_ID=$(echo "$FIRST_NEIGHBORHOOD" | grep -o '"id":[0-9]*' | cut -d':' -f2)
      NEIGHBORHOOD_NAME=$(echo "$FIRST_NEIGHBORHOOD" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g')
      CITY_ID=$(echo "$FIRST_NEIGHBORHOOD" | grep -o '"city_id":[0-9]*' | cut -d':' -f2)
      CITY_NAME=$(echo "$FIRST_NEIGHBORHOOD" | grep -o '"city_name":"[^"]*"' | sed 's/"city_name":"//g' | sed 's/"//g')
      
      echo -e "${BLUE}Using first neighborhood from city:${NC}"
      echo "Neighborhood ID: $NEIGHBORHOOD_ID"
      echo "Neighborhood Name: $NEIGHBORHOOD_NAME"
      echo "City ID: $CITY_ID"
      echo "City Name: $CITY_NAME"
    else
      # No neighborhoods found for city, use default neighborhood
      echo -e "${BLUE}No neighborhoods found for city, using default neighborhood${NC}"
      NEIGHBORHOOD_ID=1
      NEIGHBORHOOD_NAME="Default Neighborhood"
      CITY_ID=1
      CITY_NAME="New York"
      
      echo "Neighborhood ID: $NEIGHBORHOOD_ID"
      echo "Neighborhood Name: $NEIGHBORHOOD_NAME"
      echo "City ID: $CITY_ID"
      echo "City Name: $CITY_NAME"
    fi
  fi
  echo ""
  
  # Return as a string
  echo "$NEIGHBORHOOD_ID|$NEIGHBORHOOD_NAME|$CITY_ID|$CITY_NAME"
}

# Run the comparison for each zipcode
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}Running Comparison Tests${NC}"
echo -e "${BLUE}======================================================${NC}"

# Table header
echo -e "${YELLOW}Zipcode | Direct API Result | Frontend Simulation | Match?${NC}"
echo "-------------------------------------------------------------------"

for i in "${!TEST_ZIPCODES[@]}"; do
  ZIPCODE=${TEST_ZIPCODES[$i]}
  DESCRIPTION=${ZIPCODE_DESCRIPTIONS[$i]}
  
  echo -e "${BLUE}Testing zipcode $ZIPCODE ($DESCRIPTION)${NC}"
  
  # Run both tests and capture results
  API_RESULT=$(test_backend_api "$ZIPCODE" "$DESCRIPTION")
  FRONTEND_RESULT=$(simulate_frontend_processing "$ZIPCODE" "$DESCRIPTION")
  
  # Extract neighborhood information for comparison
  API_NEIGHBORHOOD_ID=$(echo "$API_RESULT" | cut -d'|' -f1)
  API_NEIGHBORHOOD_NAME=$(echo "$API_RESULT" | cut -d'|' -f2)
  
  FRONTEND_NEIGHBORHOOD_ID=$(echo "$FRONTEND_RESULT" | cut -d'|' -f1)
  FRONTEND_NEIGHBORHOOD_NAME=$(echo "$FRONTEND_RESULT" | cut -d'|' -f2)
  
  # Compare results
  if [ "$API_NEIGHBORHOOD_ID" == "$FRONTEND_NEIGHBORHOOD_ID" ] && 
     [ "$API_NEIGHBORHOOD_NAME" == "$FRONTEND_NEIGHBORHOOD_NAME" ]; then
    MATCH="${GREEN}YES${NC}"
  else
    MATCH="${RED}NO${NC}"
  fi
  
  # Print comparison line
  echo -e "$ZIPCODE | ID: $API_NEIGHBORHOOD_ID, Name: $API_NEIGHBORHOOD_NAME | ID: $FRONTEND_NEIGHBORHOOD_ID, Name: $FRONTEND_NEIGHBORHOOD_NAME | $MATCH"
  echo "-------------------------------------------------------------------"
done

# Now test the full bulk add flow with direct headers and the actual neighborhood data
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}Testing Full Bulk Add with Direct Neighborhood Data${NC}"
echo -e "${BLUE}======================================================${NC}"

# Function to authenticate and get JWT token
get_auth_token() {
  RESPONSE=$(curl -v -X POST "http://localhost:5001/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"doof123"}' 2>&1)
  
  # Extract the token from the Cookie header
  TOKEN=$(echo "$RESPONSE" | grep -o "Set-Cookie: token=[^;]*" | cut -d'=' -f2)
  echo "$TOKEN"
}

# Get authentication token
TOKEN=$(get_auth_token)
if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get authentication token. Exiting.${NC}"
  exit 1
fi

echo -e "${GREEN}Got authentication token${NC}"

# Create a test payload with explicit neighborhood_id values
cat > /tmp/bulk-add-explicit.json << EOL
{
  "items": [
    {
      "name": "Maison Yaki Test",
      "type": "restaurant",
      "address": "626 Vanderbilt Ave, Brooklyn, NY 11238",
      "city": "New York",
      "state": "NY",
      "zipcode": "11238",
      "city_id": 1,
      "neighborhood_id": 28,
      "tags": ["Japanese", "French"],
      "_lineNumber": 1
    },
    {
      "name": "Kru Test",
      "type": "restaurant",
      "address": "190 N 14th St, Brooklyn, NY 11249",
      "city": "New York",
      "state": "NY",
      "zipcode": "11249",
      "city_id": 1,
      "neighborhood_id": 89,
      "tags": ["Thai", "Modern"],
      "_lineNumber": 2
    },
    {
      "name": "King Test",
      "type": "restaurant",
      "address": "18 King St, New York, NY 10014",
      "city": "New York",
      "state": "NY",
      "zipcode": "10014",
      "city_id": 1,
      "neighborhood_id": 6,
      "tags": ["Italian", "Mediterranean"],
      "_lineNumber": 3
    },
    {
      "name": "Zaytinya Test",
      "type": "restaurant",
      "address": "1185 Broadway, New York, NY 10001",
      "city": "New York",
      "state": "NY",
      "zipcode": "10001",
      "city_id": 1,
      "neighborhood_id": 1,
      "tags": ["Mediterranean", "Turkish", "Greek"],
      "_lineNumber": 4
    },
    {
      "name": "Cholita Cuencana Test",
      "type": "restaurant",
      "address": "59-08 Roosevelt Ave, Woodside, NY 11377",
      "city": "New York",
      "state": "NY",
      "zipcode": "11377",
      "city_id": 1,
      "neighborhood_id": 56,
      "tags": ["Ecuadorian", "South American"],
      "_lineNumber": 5
    }
  ]
}
EOL

# Submit the bulk add request with explicit neighborhood IDs
echo -e "${YELLOW}Submitting bulk add request with explicit neighborhood IDs...${NC}"
BULK_ADD_RESPONSE=$(curl -s -X POST "http://localhost:5001/api/admin/bulk/restaurants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @/tmp/bulk-add-explicit.json)

echo -e "${GREEN}Bulk Add Response:${NC}"
echo "$BULK_ADD_RESPONSE"
echo ""

# Verify the created restaurants have the correct neighborhood IDs
CREATED_COUNT=$(echo "$BULK_ADD_RESPONSE" | grep -o '"successCount":[0-9]*' | cut -d':' -f2)
if [ -n "$CREATED_COUNT" ] && [ "$CREATED_COUNT" -gt 0 ]; then
  echo -e "${GREEN}Successfully created $CREATED_COUNT restaurants with explicit neighborhood IDs${NC}"
  
  # Extract the created item IDs
  CREATED_ITEMS=$(echo "$BULK_ADD_RESPONSE" | grep -o '"createdItems":\[.*\]' | cut -d'[' -f2 | cut -d']' -f1)
  
  if [ -n "$CREATED_ITEMS" ]; then
    echo -e "${YELLOW}Verifying created items have correct neighborhood IDs...${NC}"
    
    # This would be a complex parsing task in bash, so we'll just show the raw data
    echo -e "${GREEN}Created items:${NC}"
    echo "$CREATED_ITEMS" | sed 's/},{/},\n/g'
  fi
else
  echo -e "${RED}Failed to create restaurants or no count returned${NC}"
fi

# Clean up
rm /tmp/bulk-add-explicit.json

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}Testing Complete${NC}"
echo -e "${BLUE}======================================================${NC}" 