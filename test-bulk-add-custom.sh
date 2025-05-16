#!/bin/bash
# Test script for bulk add functionality with custom restaurants

# ANSI color codes for better readability
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API base URL
API_BASE_URL=${VITE_API_BASE_URL:-"http://localhost:5001/api"}
echo -e "${BLUE}=== Chomp Bulk Add Custom Test ===${NC}"
echo "Testing with API base URL: $API_BASE_URL"
echo ""

# Step 1: Authenticate as admin
echo -e "${YELLOW}Step 1: Authenticating as admin user...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"doof123"}')

# The API uses cookies for authentication instead of tokens
# Save the response cookies to a file
echo "$AUTH_RESPONSE" > /tmp/auth_response.txt
curl -s -c /tmp/chomp_cookies.txt -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"doof123"}'

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}Authentication successful!${NC}"
  echo "Response: $(echo $AUTH_RESPONSE | cut -c 1-100)... (truncated)"
else
  echo -e "${RED}Authentication failed!${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo ""

# Function to process a restaurant
process_restaurant() {
  local name="$1"
  local type="$2"
  local city="$3"
  local tags="$4"
  
  echo -e "${BLUE}=======================================${NC}"
  echo -e "${PURPLE}Processing Restaurant: $name${NC}"
  echo -e "${BLUE}=======================================${NC}"
  
  # Step 2: Test Google Places API integration
  echo -e "${YELLOW}Step 2: Testing Google Places API integration...${NC}"
  echo "Looking up place ID for: $name in $city"
  
  PLACE_RESPONSE=$(curl -s -b /tmp/chomp_cookies.txt -X GET "$API_BASE_URL/places/autocomplete?input=$(echo "$name, $city" | tr ' ' '+')" \
    -H "X-Bypass-Auth: true" \
    -H "X-Places-Api-Request: true")
  
  # Check if we got a valid response
  if [[ "$PLACE_RESPONSE" == *"\"status\":\"OK\""* ]]; then
    # Extract the first place_id
    PLACE_ID=$(echo "$PLACE_RESPONSE" | grep -o '"place_id":"[^"]*' | head -1 | cut -d'"' -f4)
    DESCRIPTION=$(echo "$PLACE_RESPONSE" | grep -o '"description":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$PLACE_ID" ]; then
      echo -e "${GREEN}Successfully retrieved place ID: $PLACE_ID${NC}"
      echo -e "${GREEN}Place description: $DESCRIPTION${NC}"
    else
      echo -e "${RED}Failed to extract place ID from response${NC}"
      echo "Response: $PLACE_RESPONSE"
      return
    fi
  else
    echo -e "${RED}Failed to get place ID${NC}"
    echo "Response: $PLACE_RESPONSE"
    return
  fi
  
  # Step 2.1: Get place details
  echo -e "${YELLOW}Step 2.1: Getting place details...${NC}"
  DETAILS_RESPONSE=$(curl -s -b /tmp/chomp_cookies.txt -X GET "$API_BASE_URL/places/details?placeId=$PLACE_ID" \
    -H "X-Bypass-Auth: true" \
    -H "X-Places-Api-Request: true")
  
  # Check if we got a valid response
  if [[ "$DETAILS_RESPONSE" == *"\"status\":\"OK\""* ]]; then
    # Extract address components
    ADDRESS=$(echo "$DETAILS_RESPONSE" | grep -o '"formatted_address":"[^"]*' | cut -d'"' -f4)
    LAT=$(echo "$DETAILS_RESPONSE" | grep -o '"lat":[^,}]*' | head -1 | cut -d':' -f2)
    LNG=$(echo "$DETAILS_RESPONSE" | grep -o '"lng":[^,}]*' | head -1 | cut -d':' -f2)
    PHONE=$(echo "$DETAILS_RESPONSE" | grep -o '"formatted_phone_number":"[^"]*' | cut -d'"' -f4)
    WEBSITE=$(echo "$DETAILS_RESPONSE" | grep -o '"website":"[^"]*' | cut -d'"' -f4)
    
    echo -e "${GREEN}Address: $ADDRESS${NC}"
    echo -e "${GREEN}Coordinates: $LAT, $LNG${NC}"
    if [ -n "$PHONE" ]; then
      echo -e "${GREEN}Phone: $PHONE${NC}"
    fi
    if [ -n "$WEBSITE" ]; then
      echo -e "${GREEN}Website: $WEBSITE${NC}"
    fi
    
    # Extract zipcode from address
    ZIPCODE=$(echo "$ADDRESS" | grep -o 'NY [0-9]\{5\}' | cut -d' ' -f2)
    if [ -n "$ZIPCODE" ]; then
      echo -e "${GREEN}Successfully extracted zipcode: $ZIPCODE${NC}"
    else
      echo -e "${RED}Failed to extract zipcode from address${NC}"
      ZIPCODE="10001" # Default to Manhattan
    fi
  else
    echo -e "${RED}Failed to get place details${NC}"
    echo "Response: $DETAILS_RESPONSE"
    return
  fi
  
  # Step 3: Test neighborhood lookup by zipcode
  echo -e "${YELLOW}Step 3: Testing neighborhood lookup by zipcode...${NC}"
  NEIGHBORHOOD_RESPONSE=$(curl -s -b /tmp/chomp_cookies.txt -X GET "$API_BASE_URL/neighborhoods?zipcode=$ZIPCODE")
  
  echo "Neighborhood Response: $NEIGHBORHOOD_RESPONSE"
  
  # Extract neighborhood info
  NEIGHBORHOOD_ID=$(echo "$NEIGHBORHOOD_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  NEIGHBORHOOD_NAME=$(echo "$NEIGHBORHOOD_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
  CITY_ID=$(echo "$NEIGHBORHOOD_RESPONSE" | grep -o '"city_id":[0-9]*' | head -1 | cut -d':' -f2)
  
  if [ -n "$NEIGHBORHOOD_ID" ] && [ -n "$NEIGHBORHOOD_NAME" ]; then
    echo -e "${GREEN}Successfully retrieved neighborhood: $NEIGHBORHOOD_NAME (ID: $NEIGHBORHOOD_ID)${NC}"
  else
    echo -e "${RED}Failed to retrieve neighborhood info${NC}"
    echo "Using default neighborhood (Manhattan)"
    NEIGHBORHOOD_ID=1
    NEIGHBORHOOD_NAME="Manhattan"
    CITY_ID=1
  fi
  
  # Convert tags string to JSON array
  IFS=',' read -ra TAG_ARRAY <<< "$tags"
  TAGS_JSON="["
  for i in "${!TAG_ARRAY[@]}"; do
    if [ $i -gt 0 ]; then
      TAGS_JSON+=","
    fi
    TAGS_JSON+="\"${TAG_ARRAY[$i]}\""
  done
  TAGS_JSON+="]"
  
  # Step 4: Test bulk add submission
  echo -e "${YELLOW}Step 4: Testing bulk add submission...${NC}"
  
  # Prepare the payload
  PAYLOAD=$(cat <<EOF
{
  "items": [
    {
      "name": "$name",
      "type": "$type",
      "address": "$ADDRESS",
      "city": "$city",
      "state": "NY",
      "zipcode": "$ZIPCODE",
      "city_id": $CITY_ID,
      "neighborhood_id": $NEIGHBORHOOD_ID,
      "latitude": $LAT,
      "longitude": $LNG,
      "tags": $TAGS_JSON,
      "place_id": "$PLACE_ID"
    }
  ]
}
EOF
)
  
  echo "Bulk Add Payload:"
  echo "$PAYLOAD" | jq '.' 2>/dev/null || echo "$PAYLOAD"
  echo ""
  
  # Make the API call
  BULK_ADD_RESPONSE=$(curl -s -b /tmp/chomp_cookies.txt -X POST "$API_BASE_URL/admin/bulk/restaurants" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")
  
  echo "Bulk Add Response:"
  echo ""
  echo "$BULK_ADD_RESPONSE" | jq '.' 2>/dev/null || echo "$BULK_ADD_RESPONSE"
  echo ""
  
  # Check if successful
  if [[ "$BULK_ADD_RESPONSE" == *"\"success\":true"* ]]; then
    SUCCESS_COUNT=$(echo "$BULK_ADD_RESPONSE" | grep -o '"successCount":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}Bulk add successful! $SUCCESS_COUNT items added.${NC}"
    
    # Extract created item ID if available
    if [[ $SUCCESS_COUNT -gt 0 ]]; then
      ITEM_ID=$(echo "$BULK_ADD_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
      if [ -n "$ITEM_ID" ]; then
        echo -e "${GREEN}Created item ID: $ITEM_ID${NC}"
        CREATED_ITEMS+=("$name:$ITEM_ID:$NEIGHBORHOOD_NAME:1")
      fi
    else
      CREATED_ITEMS+=("$name:0:$NEIGHBORHOOD_NAME:0")
    fi
  else
    echo -e "${RED}Bulk add failed!${NC}"
    CREATED_ITEMS+=("$name:0:$NEIGHBORHOOD_NAME:0")
  fi
  
  echo -e "${BLUE}=======================================${NC}"
  echo ""
}

# Array to store results
CREATED_ITEMS=()

# Process each restaurant
process_restaurant "Dirt Candy" "restaurant" "New York" "Vegetarian"
process_restaurant "Wu's Wonton King" "restaurant" "New York" "Chinese"
process_restaurant "Kokomo" "restaurant" "New York" "Caribbean"
process_restaurant "Oiji Mi" "restaurant" "New York" "Korean"
process_restaurant "Llama San" "restaurant" "New York" "Japanese,Peruvian"

# Print summary
echo -e "${BLUE}=======================================${NC}"
echo -e "${YELLOW}Summary of Bulk Add Results:${NC}"
echo -e "${BLUE}=======================================${NC}"
printf "%-20s %-15s %-8s %-5s\n" "Restaurant" "Neighborhood" "Success" "ID"

for item in "${CREATED_ITEMS[@]}"; do
  IFS=':' read -r name id neighborhood success <<< "$item"
  printf "%-20s %-15s %-8s %-5s\n" "${name:0:20}" "${neighborhood:0:15}" "$success" "$id"
done

echo ""
echo -e "${BLUE}=== Test Script Completed ===${NC}"
