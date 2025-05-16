#!/bin/bash
RESOURCE=${1:-restaurants}
AUTH_TOKEN=${2:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwiYWNjb3VudF90eXBlIjoic3VwZXJ1c2VyIn0sImlhdCI6MTc0NzM2MDg1NywiZXhwIjoxNzQ3MzY0NDU3fQ.QynIY9WqNb08H_kMcvunXvFQ-iZrsgp_6lPNUCwKc4Q"}
echo "Testing analyze endpoint for resource: $RESOURCE"
curl -v http://localhost:5001/api/admin/cleanup/analyze/$RESOURCE \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo 