#!/bin/bash

echo "Running data cleanup test script..."

# Helper function to check if a JSON response is valid and extract info
check_json_response() {
  local response="$1"
  if [[ "$response" == *"success\":true"* ]]; then
    echo "✅ API returned success:true"
    return 0
  else
    echo "❌ API did not return success:true"
    return 1
  fi
}

# Helper function to check if response has changes array
check_changes_array() {
  local response="$1"
  if [[ "$response" == *"changes\":"* && "$response" != *"changes\":[]"* ]]; then
    echo "✅ API returned changes array with data"
    return 0
  else
    echo "❌ API did not return changes array with data"
    return 1
  fi
}

# Helper function to check if response has required fields for UI
check_required_fields() {
  local response="$1"
  local all_fields=true
  
  for field in "id" "title" "category" "type" "field" "currentValue" "proposedValue"; do
    if [[ "$response" != *"\"$field\""* ]]; then
      echo "❌ Missing required field: $field"
      all_fields=false
    fi
  done
  
  if [ "$all_fields" = true ]; then
    echo "✅ All required fields for UI are present"
    return 0
  else
    return 1
  fi
}

# Test all resource types that should be available for cleanup
RESOURCE_TYPES=("restaurants" "dishes" "submissions")

for RESOURCE_TYPE in "${RESOURCE_TYPES[@]}"; do
  echo -e "\n\n========================================"
  echo "TESTING DATA CLEANUP FOR: $RESOURCE_TYPE"
  echo "========================================"
  
  # Test analyze endpoint
  echo -e "\n===== Testing analyzeData for $RESOURCE_TYPE ====="
  ANALYZE_RESPONSE=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    -H "X-Bypass-Auth: true" \
    "http://localhost:5001/api/admin/cleanup/analyze/$RESOURCE_TYPE")

  echo "Response summary (truncated):"
  echo "${ANALYZE_RESPONSE:0:300}..."

  # Check if the response is valid JSON with success:true
  if check_json_response "$ANALYZE_RESPONSE"; then
    # Check if the response contains changes array
    if check_changes_array "$ANALYZE_RESPONSE"; then
      # Check if the response has all required fields for UI
      check_required_fields "$ANALYZE_RESPONSE"
      
      # Extract first change ID if available
      CHANGE_ID=$(echo "$ANALYZE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
      
      if [ -n "$CHANGE_ID" ]; then
        echo "Found change ID: $CHANGE_ID"
        
        # Test apply endpoint
        echo -e "\n===== Testing applyChanges for $RESOURCE_TYPE ====="
        APPLY_RESPONSE=$(curl -s -X POST \
          -H "Content-Type: application/json" \
          -H "X-Bypass-Auth: true" \
          -d "{\"changeIds\":[$CHANGE_ID]}" \
          "http://localhost:5001/api/admin/cleanup/apply/$RESOURCE_TYPE")
        
        echo "Response: $APPLY_RESPONSE"
        
        if check_json_response "$APPLY_RESPONSE"; then
          echo "✅ Apply changes API is working for $RESOURCE_TYPE"
        else
          echo "❌ Apply changes API failed for $RESOURCE_TYPE"
        fi
        
        # Test reject endpoint with a different change ID if available
        CHANGE_ID2=$(echo "$ANALYZE_RESPONSE" | grep -o '"id":[0-9]*' | head -2 | tail -1 | grep -o '[0-9]*')
        if [ -z "$CHANGE_ID2" ]; then
          CHANGE_ID2=$CHANGE_ID  # Use the same ID if only one is available
        fi
        
        echo -e "\n===== Testing rejectChanges for $RESOURCE_TYPE ====="
        REJECT_RESPONSE=$(curl -s -X POST \
          -H "Content-Type: application/json" \
          -H "X-Bypass-Auth: true" \
          -d "{\"changeIds\":[$CHANGE_ID2]}" \
          "http://localhost:5001/api/admin/cleanup/reject/$RESOURCE_TYPE")
        
        echo "Response: $REJECT_RESPONSE"
        
        if check_json_response "$REJECT_RESPONSE"; then
          echo "✅ Reject changes API is working for $RESOURCE_TYPE"
        else
          echo "❌ Reject changes API failed for $RESOURCE_TYPE"
        fi
      else
        echo "❌ No change ID found in response for $RESOURCE_TYPE"
      fi
    else
      echo "❌ No changes array found in response for $RESOURCE_TYPE"
    fi
  else
    echo "❌ API is not working correctly for $RESOURCE_TYPE"
  fi
done

# Test the frontend API client directly
echo -e "\n\n========================================"
echo "TESTING FRONTEND API CLIENT INTEGRATION"
echo "========================================"

# Use curl to simulate the frontend API call exactly as it would be made
echo -e "\n===== Testing frontend analyzeData call ====="
FRONTEND_RESPONSE=$(curl -s -X GET \
  -H "Content-Type: application/json" \
  -H "X-Bypass-Auth: true" \
  "http://localhost:5173/api/admin/cleanup/analyze/restaurants")

echo "Frontend API response summary (truncated):"
echo "${FRONTEND_RESPONSE:0:300}..."

if check_json_response "$FRONTEND_RESPONSE"; then
  echo "✅ Frontend API integration is working correctly"
  check_changes_array "$FRONTEND_RESPONSE"
  check_required_fields "$FRONTEND_RESPONSE"
else
  echo "❌ Frontend API integration is not working correctly"
fi

echo -e "\n===== Test complete ====="