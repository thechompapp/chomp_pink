#!/bin/bash

# Test list creation with city_name
curl -X POST http://localhost:5001/api/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4MjE5Mzg3LCJleHAiOjE3NDgyMjI5ODd9.KjLv-xJV4Hg_fpqmVGVIHSMpPeeEGJj3rDE40uE3gak" \
  -d '{"name": "Test List 1", "description": "Testing city_name", "list_type": "restaurant", "city_name": "New York"}'

echo -e "\n\n---\n"

# Test list creation with city_id
curl -X POST http://localhost:5001/api/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4MjE5Mzg3LCJleHAiOjE3NDgyMjI5ODd9.KjLv-xJV4Hg_fpqmVGVIHSMpPeeEGJj3rDE40uE3gak" \
  -d '{"name": "Test List 2", "description": "Testing city_id", "list_type": "restaurant", "city_id": 1}'

echo -e "\n\n---\n"

# Test list creation with location.city
curl -X POST http://localhost:5001/api/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4MjE5Mzg3LCJleHAiOjE3NDgyMjI5ODd9.KjLv-xJV4Hg_fpqmVGVIHSMpPeeEGJj3rDE40uE3gak" \
  -d '{"name": "Test List 3", "description": "Testing location.city", "list_type": "restaurant", "location": {"city": "Los Angeles"}}'
