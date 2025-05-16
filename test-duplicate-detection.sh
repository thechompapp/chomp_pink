#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing Duplicate Detection API${NC}"

# Function to test duplicate detection
test_duplicate_check() {
  local items=$1
  local description=$2
  
  echo -e "${YELLOW}$description${NC}"
  
  curl -s -X POST "http://localhost:5001/api/admin/check-existing/restaurants" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$items"
  echo "" # Add newline
}

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

# Test with a mix of unique and potentially duplicate restaurants
echo -e "\n${GREEN}=== Testing Mixed Items ===${NC}"
test_duplicate_check '{
  "items": [
    {"name": "Maison Yaki", "type": "restaurant", "city_id": 1, "_lineNumber": 1},
    {"name": "Kru", "type": "restaurant", "city_id": 1, "_lineNumber": 2},
    {"name": "King", "type": "restaurant", "city_id": 1, "_lineNumber": 3},
    {"name": "Zaytinya", "type": "restaurant", "city_id": 1, "_lineNumber": 4},
    {"name": "Cholita Cuencana", "type": "restaurant", "city_id": 1, "_lineNumber": 5}
  ]
}' "Testing 5 restaurants for duplicates"

# Test with a restaurant we know is probably a duplicate
echo -e "\n${GREEN}=== Testing Known Restaurant ===${NC}"
test_duplicate_check '{
  "items": [
    {"name": "Le Bernardin", "type": "restaurant", "city_id": 1, "_lineNumber": 1}
  ]
}' "Testing a well-known NYC restaurant"

echo -e "\n${GREEN}Testing complete${NC}" 