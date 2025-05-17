#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API request and validate response
test_endpoint() {
    local endpoint=$1
    local expected_fields=$2
    local description=$3
    
    echo -e "\n${YELLOW}Testing $description...${NC}"
    
    # Make the API request
    response=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5001/api/admin/$endpoint")
    
    # Check if request was successful
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to connect to API${NC}"
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${RED}Invalid JSON response${NC}"
        echo "Response: $response"
        return 1
    fi
    
    # Check if response has data field
    if ! echo "$response" | jq '.data' >/dev/null 2>&1; then
        echo -e "${RED}Response missing 'data' field${NC}"
        echo "Response: $response"
        return 1
    fi
    
    # Check if data is an array
    if ! echo "$response" | jq '.data | type == "array"' >/dev/null 2>&1; then
        echo -e "${RED}Response data is not an array${NC}"
        echo "Response: $response"
        return 1
    fi
    
    # Check for required fields in first item
    if [ $(echo "$response" | jq '.data | length') -gt 0 ]; then
        local first_item=$(echo "$response" | jq '.data[0]')
        for field in $expected_fields; do
            if ! echo "$first_item" | jq ".$field" >/dev/null 2>&1; then
                echo -e "${RED}Missing required field: $field${NC}"
                echo "First item: $first_item"
                return 1
            fi
        done
    fi
    
    echo -e "${GREEN}✓ $description passed${NC}"
    return 0
}

# Get auth token
echo -e "${YELLOW}Getting authentication token...${NC}"
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"adminpassword"}' \
    http://localhost:3000/api/auth/login | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get authentication token. Check credentials or server status.${NC}"
    exit 1
fi

echo -e "${GREEN}Successfully obtained authentication token.${NC}"

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get auth token${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting API tests...${NC}"

echo -e "\n${YELLOW}Testing all admin endpoints...${NC}"

# Test both endpoint formats to see which one works
echo -e "\n${YELLOW}Testing with /admin/resources/{resource} format:${NC}"
test_endpoint "resources/restaurants" "id,name" "Restaurants Endpoint (resources format)"
test_endpoint "resources/dishes" "id,name" "Dishes Endpoint (resources format)"
test_endpoint "resources/users" "id,email" "Users Endpoint (resources format)"
test_endpoint "resources/cities" "id,name" "Cities Endpoint (resources format)"
test_endpoint "resources/neighborhoods" "id,name" "Neighborhoods Endpoint (resources format)"
test_endpoint "resources/hashtags" "id,name" "Hashtags Endpoint (resources format)"

echo -e "\n${YELLOW}Testing with /admin/{resource} format:${NC}"
test_endpoint "restaurants" "id,name" "Restaurants Endpoint (direct format)"
test_endpoint "dishes" "id,name" "Dishes Endpoint (direct format)"
test_endpoint "users" "id,email" "Users Endpoint (direct format)"
test_endpoint "cities" "id,name" "Cities Endpoint (direct format)"
test_endpoint "neighborhoods" "id,name" "Neighborhoods Endpoint (direct format)"
test_endpoint "hashtags" "id,name" "Hashtags Endpoint (direct format)"
test_endpoint "submissions" "id" "Submissions Endpoint (direct format)"

echo -e "\n${GREEN}All tests completed!${NC}"