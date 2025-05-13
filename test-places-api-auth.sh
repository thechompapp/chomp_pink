#!/bin/bash
# Test script for Places API authentication bypass

# ANSI color codes for better readability
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# API base URL
API_BASE_URL=${VITE_API_BASE_URL:-"http://localhost:5001/api"}
echo -e "${BLUE}=== Testing Places API Authentication Bypass ===${NC}"
echo "Testing with API base URL: $API_BASE_URL"
echo ""

# Test restaurant name and city
RESTAURANT_NAME="Shake Shack"
CITY_NAME="New York"
QUERY="${RESTAURANT_NAME}, ${CITY_NAME}"
ENCODED_QUERY=$(echo "$QUERY" | tr ' ' '+')

# Step 1: Test without auth headers (should fail with 401)
echo -e "${YELLOW}Step 1: Testing without auth headers (expecting 401 error)...${NC}"
RESPONSE_WITHOUT_HEADERS=$(curl -s -X GET "$API_BASE_URL/places/autocomplete?input=$ENCODED_QUERY")

if [[ "$RESPONSE_WITHOUT_HEADERS" == *"Authentication token is missing"* ]]; then
  echo -e "${GREEN}Success! Received expected 401 error without auth headers${NC}"
else
  echo -e "${RED}Unexpected response without auth headers:${NC}"
  echo "$RESPONSE_WITHOUT_HEADERS" | jq '.' 2>/dev/null || echo "$RESPONSE_WITHOUT_HEADERS"
fi

echo ""

# Step 2: Test with auth bypass headers
echo -e "${YELLOW}Step 2: Testing with auth bypass headers...${NC}"
RESPONSE_WITH_HEADERS=$(curl -s -X GET "$API_BASE_URL/places/autocomplete?input=$ENCODED_QUERY" \
  -H "X-Bypass-Auth: true" \
  -H "X-Places-Api-Request: true")

if [[ "$RESPONSE_WITH_HEADERS" == *"\"status\":\"OK\""* ]]; then
  echo -e "${GREEN}Success! Received valid response with auth bypass headers${NC}"
  echo "Response preview:"
  echo "$RESPONSE_WITH_HEADERS" | jq '.data[0]' 2>/dev/null || echo "$RESPONSE_WITH_HEADERS" | head -20
else
  echo -e "${RED}Error with auth bypass headers:${NC}"
  echo "$RESPONSE_WITH_HEADERS" | jq '.' 2>/dev/null || echo "$RESPONSE_WITH_HEADERS"
fi

echo ""

# Step 3: Test place details with auth bypass headers
echo -e "${YELLOW}Step 3: Testing place details with auth bypass headers...${NC}"

# Extract place_id from previous response
PLACE_ID=$(echo "$RESPONSE_WITH_HEADERS" | grep -o '"place_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$PLACE_ID" ]; then
  echo -e "${RED}Could not extract place_id from previous response${NC}"
  exit 1
fi

echo "Using place_id: $PLACE_ID"

DETAILS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/places/details?placeId=$PLACE_ID" \
  -H "X-Bypass-Auth: true" \
  -H "X-Places-Api-Request: true")

if [[ "$DETAILS_RESPONSE" == *"\"status\":\"OK\""* ]]; then
  echo -e "${GREEN}Success! Received valid place details with auth bypass headers${NC}"
  echo "Response preview:"
  echo "$DETAILS_RESPONSE" | jq '.data' 2>/dev/null || echo "$DETAILS_RESPONSE" | head -20
else
  echo -e "${RED}Error with place details:${NC}"
  echo "$DETAILS_RESPONSE" | jq '.' 2>/dev/null || echo "$DETAILS_RESPONSE"
fi

echo ""
echo -e "${BLUE}=== Test Complete ===${NC}"
