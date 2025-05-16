#!/bin/bash

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API base URL and endpoints
API_URL="http://localhost:5174/api"
AUTH_ENDPOINT="${API_URL}/auth/login"
CHECK_DUPLICATE_ENDPOINT="${API_URL}/admin/check-existing/restaurants"

# Credentials
EMAIL="doof_user"
PASSWORD="doof_123"

# Function to get auth token
get_token() {
  echo -e "${BLUE}Authenticating...${NC}"
  auth_response=$(curl -s -X POST "${AUTH_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
  
  # Extract token from response
  token=$(echo "${auth_response}" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  
  if [ -z "$token" ]; then
    echo -e "${RED}Authentication failed:${NC}"
    echo "${auth_response}"
    exit 1
  fi
  
  echo -e "${GREEN}Authentication successful${NC}"
  echo "${token}"
}

# Test duplicate detection
test_duplicate_detection() {
  token=$1
  
  echo -e "\n${BLUE}Testing duplicate detection API...${NC}"
  
  payload='{
    "items": [
      {"name": "Maison Yaki", "type": "restaurant", "city_id": 1},
      {"name": "Kru", "type": "restaurant", "city_id": 1},
      {"name": "King", "type": "restaurant", "city_id": 1},
      {"name": "Zaytinya", "type": "restaurant", "city_id": 1},
      {"name": "Cholita Cuencana", "type": "restaurant", "city_id": 1}
    ]
  }'
  
  echo -e "${YELLOW}Request payload:${NC}"
  echo "${payload}"
  
  response=$(curl -s -X POST "${CHECK_DUPLICATE_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${token}" \
    -d "${payload}")
  
  echo -e "\n${YELLOW}Response:${NC}"
  echo "${response}"
  
  # Check for success
  success=$(echo "${response}" | grep -o '"success":[^,}]*' | sed 's/"success"://')
  
  if [ "${success}" = "true" ]; then
    echo -e "\n${GREEN}Duplicate check API call was successful${NC}"
    
    # Extract and analyze results
    if echo "${response}" | grep -q '"results"'; then
      echo -e "\n${BLUE}Results summary:${NC}"
      # Extract existing items (duplicates)
      echo "${response}" | grep -o '"item":{"name":"[^"]*"' | sed 's/"item":{"name":"//'
      
      # Check for duplicates (existing property indicates duplicate)
      if echo "${response}" | grep -q '"existing":'; then
        echo -e "\n${YELLOW}Duplicates detected in the response${NC}"
      else
        echo -e "\n${GREEN}No duplicates detected${NC}"
      fi
    else
      echo -e "\n${RED}No detailed results found in the response${NC}"
    fi
  else
    echo -e "\n${RED}Duplicate check API call failed${NC}"
    error=$(echo "${response}" | grep -o '"message":"[^"]*' | sed 's/"message":"//')
    echo "Error: ${error}"
  fi
}

# Get token and test
token=$(get_token)
test_duplicate_detection "${token}" 