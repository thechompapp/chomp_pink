#!/bin/bash

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API base URL
API_URL="http://localhost:5174/api"

# Database credentials
DB_USER="doof_user"
DB_PASS="doof_123"
DB_NAME="doof_db"

echo -e "${BLUE}=== Checking for Duplicate Restaurants ===${NC}"

echo -e "${YELLOW}Restaurants to check:${NC}"
echo " - Maison Yaki"
echo " - Kru"
echo " - King"
echo " - Zaytinya"
echo " - Cholita Cuencana"
echo ""

# Connect to database and execute query
echo -e "${GREEN}Connecting to database...${NC}"
psql -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT id, name, neighborhood_id, created_at 
  FROM restaurants 
  WHERE name IN ('Maison Yaki', 'Kru', 'King', 'Zaytinya', 'Cholita Cuencana')
  ORDER BY name;
"

echo ""
echo -e "${GREEN}Validating duplicate detection...${NC}"
echo -e "If any restaurants are shown above, they already exist in the database"
echo -e "and should be detected as duplicates when using the bulk add feature." 