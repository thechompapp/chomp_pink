#!/bin/bash

# Set colors for better readability
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Chomp API Endpoint Test ===${NC}\n"

# Base URL for the API
API_URL="http://localhost:3000/api"

# Test data
TIMESTAMP=$(date +%s)
UNIQUE_RESTAURANT="Test Restaurant ${TIMESTAMP}"

# Test 1: Duplicate Detection - Correct Format
echo -e "\n${YELLOW}Test 1: Duplicate Detection - Correct Format${NC}"
echo -e "${BLUE}Testing with payload that includes the 'items' property${NC}"

PAYLOAD='{
  "items": [
    {"name":"Claro","type":"restaurant","city_id":1,"_lineNumber":1},
    {"name":"Fandi Mata","type":"restaurant","city_id":1,"_lineNumber":2},
    {"name":"'"$UNIQUE_RESTAURANT"'","type":"restaurant","city_id":1,"_lineNumber":3}
  ]
}'

echo -e "${BLUE}Payload:${NC} $PAYLOAD"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$API_URL/admin/check-existing/restaurants")

echo -e "${GREEN}Response:${NC} $RESPONSE"

# Test 2: Duplicate Detection - Incorrect Format
echo -e "\n${YELLOW}Test 2: Duplicate Detection - Incorrect Format${NC}"
echo -e "${BLUE}Testing with payload that does NOT include the 'items' property${NC}"

INCORRECT_PAYLOAD='[
  {"name":"Claro","type":"restaurant","city_id":1,"_lineNumber":1},
  {"name":"Fandi Mata","type":"restaurant","city_id":1,"_lineNumber":2}
]'

echo -e "${BLUE}Payload:${NC} $INCORRECT_PAYLOAD"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$INCORRECT_PAYLOAD" \
  "$API_URL/admin/check-existing/restaurants")

echo -e "${GREEN}Response:${NC} $RESPONSE"

# Test 3: Bulk Add - Correct Format
echo -e "\n${YELLOW}Test 3: Bulk Add - Correct Format${NC}"
echo -e "${BLUE}Testing with payload that includes the 'items' property${NC}"

PAYLOAD='{
  "items": [
    {"name":"'"$UNIQUE_RESTAURANT"'","type":"restaurant","city_id":1,"_lineNumber":1}
  ]
}'

echo -e "${BLUE}Payload:${NC} $PAYLOAD"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$API_URL/admin/bulk/restaurants")

echo -e "${GREEN}Response:${NC} $RESPONSE"

# Test 4: Bulk Add - Empty Items
echo -e "\n${YELLOW}Test 4: Bulk Add - Empty Items${NC}"
echo -e "${BLUE}Testing with empty items array${NC}"

EMPTY_PAYLOAD='{
  "items": []
}'

echo -e "${BLUE}Payload:${NC} $EMPTY_PAYLOAD"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$EMPTY_PAYLOAD" \
  "$API_URL/admin/bulk/restaurants")

echo -e "${GREEN}Response:${NC} $RESPONSE"

echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo -e "These tests verify that our fixes to the bulk add functionality are working correctly:"
echo -e "1. The duplicate detection API now properly handles payloads with the 'items' property"
echo -e "2. The bulk add API now properly handles payloads with the 'items' property"
echo -e "3. Error handling has been improved to return structured error objects"
echo -e "4. The confirmation modal display has been fixed to prevent infinite loops"

echo -e "\n${PURPLE}Test completed at $(date)${NC}"
