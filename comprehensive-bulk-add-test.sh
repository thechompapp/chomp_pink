#!/bin/bash

# Set colors for better readability
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Chomp Comprehensive Bulk Add Test ===${NC}\n"

# Base URL for the API
API_URL="http://localhost:3000/api"

# Test data
UNIQUE_RESTAURANT="Test Restaurant $(date +%s)"
UNIQUE_RESTAURANT2="Another Test Restaurant $(date +%s)"

# Function to make API calls
call_api() {
  local endpoint=$1
  local payload=$2
  local method=${3:-POST}
  
  echo -e "${BLUE}API Call to $endpoint with method $method${NC}"
  echo -e "${BLUE}Payload:${NC} $payload"
  
  response=$(curl -s -X $method \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$API_URL$endpoint")
  
  echo -e "${GREEN}Response:${NC} $response\n"
  echo "$response"
}

# ===== TEST 1: Duplicate Detection with Various Payload Formats =====
echo -e "\n${YELLOW}TEST 1: Duplicate Detection with Various Payload Formats${NC}"

# Test 1.1: Incorrect format (direct array)
echo -e "\n${YELLOW}Test 1.1: Incorrect format (direct array)${NC}"
incorrect_payload='[
  {"name":"Claro","type":"restaurant","city_id":1,"_lineNumber":1},
  {"name":"Fandi Mata","type":"restaurant","city_id":1,"_lineNumber":2}
]'
call_api "/admin/check-existing/restaurants" "$incorrect_payload"

# Test 1.2: Correct format (object with items property)
echo -e "\n${YELLOW}Test 1.2: Correct format (object with items property)${NC}"
correct_payload='{
  "items": [
    {"name":"Claro","type":"restaurant","city_id":1,"_lineNumber":1},
    {"name":"Fandi Mata","type":"restaurant","city_id":1,"_lineNumber":2},
    {"name":"'"$UNIQUE_RESTAURANT"'","type":"restaurant","city_id":1,"_lineNumber":3}
  ]
}'
duplicate_check_response=$(call_api "/admin/check-existing/restaurants" "$correct_payload")

# ===== TEST 2: Bulk Add with Mixed Items =====
echo -e "\n${YELLOW}TEST 2: Bulk Add with Mixed Items${NC}"

# Test 2.1: Add a mix of duplicate and unique items
echo -e "\n${YELLOW}Test 2.1: Add a mix of duplicate and unique items${NC}"
bulk_add_payload='{
  "items": [
    {"name":"Claro","type":"restaurant","city_id":1,"_lineNumber":1},
    {"name":"'"$UNIQUE_RESTAURANT"'","type":"restaurant","city_id":1,"_lineNumber":2},
    {"name":"'"$UNIQUE_RESTAURANT2"'","type":"restaurant","city_id":1,"_lineNumber":3}
  ]
}'
bulk_add_response=$(call_api "/admin/bulk/restaurants" "$bulk_add_payload")

# ===== TEST 3: Error Handling for Invalid Inputs =====
echo -e "\n${YELLOW}TEST 3: Error Handling for Invalid Inputs${NC}"

# Test 3.1: Empty items array
echo -e "\n${YELLOW}Test 3.1: Empty items array${NC}"
empty_payload='{
  "items": []
}'
call_api "/admin/check-existing/restaurants" "$empty_payload"

# Test 3.2: Missing required fields
echo -e "\n${YELLOW}Test 3.2: Missing required fields${NC}"
invalid_payload='{
  "items": [
    {"type":"restaurant","city_id":1,"_lineNumber":1}
  ]
}'
call_api "/admin/check-existing/restaurants" "$invalid_payload"

# ===== TEST 4: Verify Results =====
echo -e "\n${YELLOW}TEST 4: Verify Results${NC}"

# Test 4.1: Check if unique restaurants were added
echo -e "\n${YELLOW}Test 4.1: Check if unique restaurants were added${NC}"
get_restaurants_response=$(curl -s "$API_URL/restaurants")
echo -e "${GREEN}All Restaurants:${NC} $get_restaurants_response"

# Check if our unique restaurant names are in the response
if echo "$get_restaurants_response" | grep -q "$UNIQUE_RESTAURANT"; then
  echo -e "${GREEN}SUCCESS: $UNIQUE_RESTAURANT was added to the database${NC}"
else
  echo -e "${RED}FAILURE: $UNIQUE_RESTAURANT was not found in the database${NC}"
fi

if echo "$get_restaurants_response" | grep -q "$UNIQUE_RESTAURANT2"; then
  echo -e "${GREEN}SUCCESS: $UNIQUE_RESTAURANT2 was added to the database${NC}"
else
  echo -e "${RED}FAILURE: $UNIQUE_RESTAURANT2 was not found in the database${NC}"
fi

# ===== SUMMARY =====
echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "1. Duplicate Detection: ${GREEN}Tested with various payload formats${NC}"
echo -e "2. Bulk Add: ${GREEN}Tested with mixed duplicate and unique items${NC}"
echo -e "3. Error Handling: ${GREEN}Tested with invalid inputs${NC}"
echo -e "4. Result Verification: ${GREEN}Checked if unique items were added to the database${NC}"

echo -e "\n${PURPLE}Test completed at $(date)${NC}"
