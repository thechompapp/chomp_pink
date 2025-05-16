#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Testing Neighborhood Lookup API${NC}"

# Function to test neighborhood lookup by zipcode
test_neighborhood_lookup() {
  local zipcode=$1
  echo -e "${YELLOW}Looking up neighborhood for zipcode: $zipcode${NC}"
  
  curl -s -X GET "http://localhost:5001/api/filters/neighborhoods?zipcode=$zipcode" \
    -H "Content-Type: application/json"
  echo "" # Add newline after response
}

# Function to test getting all neighborhoods for a city
test_neighborhoods_by_city() {
  local city_id=$1
  echo -e "${YELLOW}Looking up neighborhoods for city ID: $city_id${NC}"
  
  curl -s -X GET "http://localhost:5001/api/filters/neighborhoods?cityId=$city_id" \
    -H "Content-Type: application/json"
  echo "" # Add newline after response
}

# Test various zipcodes
echo -e "\n${GREEN}=== Testing Zipcode Lookup ===${NC}"
test_neighborhood_lookup "10014" # West Village, Manhattan
test_neighborhood_lookup "11249" # Williamsburg, Brooklyn
test_neighborhood_lookup "90210" # Should use fallback logic

# Test city lookups
echo -e "\n${GREEN}=== Testing City Lookup ===${NC}"
test_neighborhoods_by_city 1 # New York

echo -e "\n${GREEN}Testing complete${NC}" 