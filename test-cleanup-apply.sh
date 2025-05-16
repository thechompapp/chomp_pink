#!/bin/bash
RESOURCE=${1:-restaurants}
AUTH_TOKEN=${2:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiYWNjb3VudF90eXBlIjoic3VwZXJ1c2VyIn0sImlhdCI6MTc0NzM2MDg1NywiZXhwIjoxNzQ3MzY0NDU3fQ.QynIY9WqNb08H_kMcvunXvFQ-iZrsgp_6lPNUCwKc4Q"}
# Replace with real changeIds from the analyze response (must be integers)
CHANGE_IDS='[1, 2, 3]'
echo "Testing apply endpoint for resource: $RESOURCE"
curl -v -X POST http://localhost:5001/api/admin/cleanup/apply/$RESOURCE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"changeIds\":$CHANGE_IDS}"
echo 