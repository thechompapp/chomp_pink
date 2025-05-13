#!/bin/bash
# Test script for Bulk Add functionality in Chomp app
# This script tests the complete flow from authentication to bulk add submission
# with three different unique non-chain restaurants in NYC

# Set variables
API_BASE_URL="http://localhost:5001/api"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="doof123"

# Define restaurants to test
RESTAURANTS=(
  "Russ & Daughters:Lower East Side" 
  "Veselka:East Village" 
  "Katz's Delicatessen:Lower East Side"
)

# Text colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Chomp Bulk Add Testing Script - Multiple Restaurants ===${NC}"
echo "Testing with API base URL: $API_BASE_URL"
echo -e "Testing restaurants: ${PURPLE}${RESTAURANTS[0]}${NC}, ${PURPLE}${RESTAURANTS[1]}${NC}, ${PURPLE}${RESTAURANTS[2]}${NC}"

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

# Function to process a single restaurant
process_restaurant() {
  local RESTAURANT_INFO=$1
  local RESTAURANT_NAME=$(echo $RESTAURANT_INFO | cut -d':' -f1)
  local NEIGHBORHOOD_HINT=$(echo $RESTAURANT_INFO | cut -d':' -f2)
  
  echo -e "\n${BLUE}=======================================${NC}"
  echo -e "${PURPLE}Processing Restaurant: $RESTAURANT_NAME${NC}"
  echo -e "${PURPLE}Expected Neighborhood: $NEIGHBORHOOD_HINT${NC}"
  echo -e "${BLUE}=======================================${NC}"
  
  # Step 2: Test Google Places API integration
  echo -e "\n${YELLOW}Step 2: Testing Google Places API integration...${NC}"
  CITY_NAME="New York"
  ENCODED_QUERY=$(echo "$RESTAURANT_NAME, $CITY_NAME" | sed 's/ /%20/g')

  echo "Looking up place ID for: $RESTAURANT_NAME in $CITY_NAME"
  PLACE_RESPONSE=$(curl -s -X GET "$API_BASE_URL/places/autocomplete?input=$ENCODED_QUERY" \
    -b /tmp/chomp_cookies.txt)

  # Extract the first place_id (most relevant match)
  if echo "$PLACE_RESPONSE" | grep -q "place_id"; then
    PLACE_ID=$(echo $PLACE_RESPONSE | grep -o '"place_id":"[^"]*' | head -1 | sed 's/"place_id":"//')
    PLACE_DESCRIPTION=$(echo $PLACE_RESPONSE | grep -o '"description":"[^"]*' | head -1 | sed 's/"description":"//')
    echo -e "${GREEN}Successfully retrieved place ID: $PLACE_ID${NC}"
    echo -e "${GREEN}Place description: $PLACE_DESCRIPTION${NC}"
    
    # Step 2.1: Get place details using the place ID
    echo -e "\n${YELLOW}Step 2.1: Getting place details...${NC}"
    DETAILS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/places/details?placeId=$PLACE_ID" \
      -b /tmp/chomp_cookies.txt)
    
    # Extract key information from place details
    ADDRESS=$(echo $DETAILS_RESPONSE | grep -o '"formattedAddress":"[^"]*' | sed 's/"formattedAddress":"//')
    LATITUDE=$(echo $DETAILS_RESPONSE | grep -o '"lat":[^,}]*' | head -1 | sed 's/"lat"://')
    LONGITUDE=$(echo $DETAILS_RESPONSE | grep -o '"lng":[^,}]*' | head -1 | sed 's/"lng"://')
    PHONE=$(echo $DETAILS_RESPONSE | grep -o '"phone":"[^"]*' | sed 's/"phone":"//')
    WEBSITE=$(echo $DETAILS_RESPONSE | grep -o '"website":"[^"]*' | sed 's/"website":"//')
    
    echo -e "${GREEN}Address: $ADDRESS${NC}"
    echo -e "${GREEN}Coordinates: $LATITUDE, $LONGITUDE${NC}"
    [ -n "$PHONE" ] && echo -e "${GREEN}Phone: $PHONE${NC}"
    [ -n "$WEBSITE" ] && echo -e "${GREEN}Website: $WEBSITE${NC}"
    
    # Extract zipcode from address (assuming US format with 5-digit zip at the end)
    ZIPCODE=$(echo $ADDRESS | grep -o '[0-9]\{5\}' | tail -1)
    
    if [ -n "$ZIPCODE" ]; then
      echo -e "${GREEN}Successfully extracted zipcode: $ZIPCODE${NC}"
    else
      echo -e "${RED}Failed to extract zipcode from address: $ADDRESS${NC}"
      # Use a default zipcode for testing
      ZIPCODE="10001"
      echo -e "${YELLOW}Using default zipcode for testing: $ZIPCODE${NC}"
    fi
  else
    echo -e "${RED}Failed to retrieve place ID. Response: $PLACE_RESPONSE${NC}"
    # Use a mock place ID for testing subsequent steps
    PLACE_ID="ChIJK1kVLx5awokRBXtcbIvRCUE"
    ZIPCODE="10001"
    ADDRESS="Unknown Address"
    LATITUDE="40.7128"
    LONGITUDE="-74.0060"
    echo -e "${YELLOW}Using mock place ID for testing: $PLACE_ID${NC}"
    echo -e "${YELLOW}Using default zipcode for testing: $ZIPCODE${NC}"
  fi

  # Step 3: Test neighborhood lookup
  echo -e "\n${YELLOW}Step 3: Testing neighborhood lookup by zipcode...${NC}"
  NEIGHBORHOOD_RESPONSE=$(curl -s -X GET "$API_BASE_URL/neighborhoods/by-zipcode/$ZIPCODE" \
    -b /tmp/chomp_cookies.txt)

  echo "Neighborhood Response: $NEIGHBORHOOD_RESPONSE"

  # Check if we got a valid neighborhood
  if echo "$NEIGHBORHOOD_RESPONSE" | grep -q '"id"'; then
    NEIGHBORHOOD_ID=$(echo $NEIGHBORHOOD_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    NEIGHBORHOOD_NAME=$(echo $NEIGHBORHOOD_RESPONSE | grep -o '"name":"[^"]*' | head -1 | sed 's/"name":"//')
    echo -e "${GREEN}Successfully retrieved neighborhood: $NEIGHBORHOOD_NAME (ID: $NEIGHBORHOOD_ID)${NC}"
    
    # Compare with expected neighborhood
    if [[ "$NEIGHBORHOOD_NAME" == *"$NEIGHBORHOOD_HINT"* || "$NEIGHBORHOOD_HINT" == *"$NEIGHBORHOOD_NAME"* ]]; then
      echo -e "${GREEN}✓ Neighborhood match confirmed: Expected '$NEIGHBORHOOD_HINT', got '$NEIGHBORHOOD_NAME'${NC}"
    else
      echo -e "${YELLOW}⚠ Neighborhood mismatch: Expected '$NEIGHBORHOOD_HINT', got '$NEIGHBORHOOD_NAME'${NC}"
    fi
  else
    echo -e "${RED}Failed to retrieve neighborhood. Response: $NEIGHBORHOOD_RESPONSE${NC}"
    # Use a default neighborhood ID for testing
    NEIGHBORHOOD_ID="1"
    echo -e "${YELLOW}Using default neighborhood ID for testing: $NEIGHBORHOOD_ID${NC}"
  fi

  # Step 4: Prepare and submit bulk add request
  echo -e "\n${YELLOW}Step 4: Testing bulk add submission...${NC}"
  
  # Determine appropriate tags based on restaurant
  TAGS="[]"
  if [[ "$RESTAURANT_NAME" == *"Russ & Daughters"* ]]; then
    TAGS="[\"jewish\", \"bagels\", \"appetizing\", \"smoked fish\"]"
  elif [[ "$RESTAURANT_NAME" == *"Veselka"* ]]; then
    TAGS="[\"ukrainian\", \"pierogi\", \"comfort food\", \"24-hour\"]"
  elif [[ "$RESTAURANT_NAME" == *"Katz"* ]]; then
    TAGS="[\"jewish\", \"deli\", \"pastrami\", \"sandwiches\"]"
  fi

  # Create a JSON payload for bulk add
  # Note: city_id 1 is for New York in the database
  cat > /tmp/bulk_add_payload.json << EOF
{
  "items": [
    {
      "name": "$RESTAURANT_NAME",
      "type": "restaurant",
      "address": "$ADDRESS",
      "city": "New York",
      "state": "NY",
      "zipcode": "$ZIPCODE",
      "city_id": 1,
      "neighborhood_id": $NEIGHBORHOOD_ID,
      "latitude": $LATITUDE,
      "longitude": $LONGITUDE,
      "tags": $TAGS,
      "place_id": "$PLACE_ID"
    }
  ]
}
EOF

  echo "Bulk Add Payload:"
  cat /tmp/bulk_add_payload.json

  # Submit the bulk add request
  BULK_ADD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/admin/bulk/restaurants" \
    -H "Content-Type: application/json" \
    -b /tmp/chomp_cookies.txt \
    -d @/tmp/bulk_add_payload.json)

  # Format the response for better readability
  FORMATTED_RESPONSE=$(echo $BULK_ADD_RESPONSE | sed 's/,/,\n/g' | sed 's/{/\n{\n/g' | sed 's/}/\n}\n/g')
  echo -e "\nBulk Add Response:\n$FORMATTED_RESPONSE"

  # Check if bulk add was successful
  if echo "$BULK_ADD_RESPONSE" | grep -q '"success":true'; then
    SUCCESS_COUNT=$(echo $BULK_ADD_RESPONSE | grep -o '"successCount":[0-9]*' | sed 's/"successCount"://')
    RESTAURANT_ID=$(echo $BULK_ADD_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    echo -e "${GREEN}Bulk add successful! $SUCCESS_COUNT items added.${NC}"
    [ -n "$RESTAURANT_ID" ] && echo -e "${GREEN}Restaurant added with ID: $RESTAURANT_ID${NC}"
    
    # Add to summary
    echo "$RESTAURANT_NAME|$NEIGHBORHOOD_NAME|$SUCCESS_COUNT|$RESTAURANT_ID" >> /tmp/bulk_add_summary.txt
  else
    ERROR_MSG=$(echo $BULK_ADD_RESPONSE | grep -o '"error":"[^"]*' | sed 's/"error":"//')
    echo -e "${RED}Bulk add failed. Error: $ERROR_MSG${NC}"
    
    # Add to summary
    echo "$RESTAURANT_NAME|$NEIGHBORHOOD_NAME|0|ERROR" >> /tmp/bulk_add_summary.txt
  fi
  
  echo -e "\n${BLUE}=======================================${NC}"
}

# Initialize summary file
echo "Restaurant|Neighborhood|Success|ID" > /tmp/bulk_add_summary.txt

# Process each restaurant
for restaurant in "${RESTAURANTS[@]}"; do
  process_restaurant "$restaurant"
done

# Display summary table
echo -e "\n${BLUE}=======================================${NC}"
echo -e "${YELLOW}Summary of Bulk Add Results:${NC}"
echo -e "${BLUE}=======================================${NC}"
column -t -s '|' /tmp/bulk_add_summary.txt

# Clean up
rm -f /tmp/bulk_add_payload.json
rm -f /tmp/bulk_add_summary.txt

echo -e "\n${BLUE}=== Test Script Completed ===${NC}"
