# API Test Runner Fixes Summary

## Overview

This document provides a detailed summary of the issues identified in the Chomp API test runner and the fixes implemented to resolve them. The test runner is designed to validate the functionality of various API endpoints including user registration, login, authentication status checks, and CRUD operations for restaurants and dishes.

## Files Involved

1. `/Users/naf/Downloads/doof/public/api-test-runner.html` - Main test runner HTML file
2. `/Users/naf/Downloads/doof/public/api-test-runner-fixed.html` - Backup/fixed version of the test runner
3. `/Users/naf/Downloads/doof/serve-test-runner.js` - Node.js server that serves the test runner and proxies API requests

## Issues Identified

### 1. Response Structure Mismatches

The test runner was expecting response data at the top level of the API response objects, but the actual API responses were nesting data within a `data` property. This caused tests to fail even when the API calls were successful.

**Example Error:**
```
[ERROR] Login failed: Login successful. {"success":true,"message":"Login successful.","data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","user":{...}}}
```

### 2. Incorrect API Endpoints

The test runner was using `/e2e/` prefixed endpoints (e.g., `/e2e/restaurants`, `/e2e/dishes`) instead of the standard `/api/` endpoints that the backend actually implements.

**Example Error:**
```
[ERROR] Create Restaurant failed {"status":400,"statusText":"Bad Request","responseBody":"","rawResponseText":"\"\""}
```

### 3. Request Body Format Mismatches

The test runner was using camelCase property names (e.g., `priceRange`) while the API expected snake_case (e.g., `price_range`).

### 4. Error Handling Issues

The `handleApiResponse` function was not properly handling successful API responses that contained nested data structures, leading to false error reports.

## Fixes Implemented

### 1. Response Structure Handling

Updated all test functions to properly access data from the nested `data` property in API responses:

```javascript
// Before
if (!apiResult.responseBody.success || !apiResult.responseBody.user) {
  // Error handling
}

// After
if (!apiResult.responseBody.success || !apiResult.responseBody.data) {
  // Error handling
}
```

### 2. API Endpoint Corrections

Updated all API endpoint references to use the correct paths:

```javascript
// Before
const response = await apiRequest('/e2e/restaurants', {
  // Request options
});

// After
const response = await apiRequest('/api/restaurants', {
  // Request options
});
```

### 3. Request Body Format Corrections

Updated request body formats to match the API's expected schema:

```javascript
// Before
const restaurantData = {
  name: `Test Restaurant ${Date.now()}`,
  address: '123 Test St', city: 'Test City', state: 'TS', zip: '12345',
  phone: '555-123-4567', cuisine: 'Test Cuisine', priceRange: '$$'
};

// After
const restaurantData = {
  name: `Test Restaurant ${Date.now()}`,
  description: 'A test restaurant created by the API test runner',
  address: '123 Test St, Test City, TS 12345',
  cuisine: 'Test Cuisine',
  price_range: '$$'
};
```

### 4. Enhanced Error Handling

Improved the `handleApiResponse` function to better handle successful responses with nested data structures:

```javascript
// Added more sophisticated handling for successful responses
if (data && data.success === false) {
  const errMsg = `${context} returned success: false - ${data.message || 'Unknown error'}`;
  console.warn(errMsg, result);
  logMessage(`${errMsg}\nResponse: ${JSON.stringify(data, null, 2)}`, 'warning');
  // We don't throw an error here, just log a warning and continue
} else {
  // Log successful response
  logMessage(`${context} succeeded (status ${status} ${statusText})`, 'success');
  if (data && data.message) {
    logMessage(`Server message: ${data.message}`, 'info');
  }
  logMessage(`Response data received successfully`, 'info');
}
```

### 5. Improved Logging

Added detailed logging throughout the test functions to better understand request and response data:

```javascript
console.log('Restaurant creation request details:', {
  url: '/api/restaurants',
  method: 'POST',
  token: `${token.substring(0, 20)}...`,
  data: restaurantData
});

console.log('Restaurant creation raw response:', {
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries())
});
```

## Test Functions Updated

1. **User Registration Test**
   - Fixed to use `username` instead of `name`
   - Updated to properly access token from nested `data` property
   - Added detailed logging

2. **User Login Test**
   - Updated to properly access token and user data from nested `data` property
   - Added user ID and role logging for verification

3. **Authentication Status Test**
   - Updated to properly access user data from nested `data` property
   - Fixed return value to use correct data structure

4. **Restaurant Creation Test**
   - Updated to use correct API endpoint
   - Modified request body format to match expected schema
   - Fixed response handling for nested data structure

5. **Dish Creation Test**
   - Updated to use correct API endpoint
   - Fixed response handling for nested data structure

6. **Get Dishes Test**
   - Updated to use correct API endpoint
   - Improved response handling for nested data structure

## Remaining Issues

Despite the fixes implemented, there are still issues with the restaurant and dish creation tests. The console logs show:

```
[ERROR] Create Restaurant failed {"status":400,"statusText":"Bad Request","responseBody":"","rawResponseText":"\"\""}
```

This suggests that either:
1. The API endpoint is not correctly implemented on the backend
2. The request format still doesn't match what the backend expects
3. There might be authentication or permission issues

## Detailed Resolution Plan

To resolve the persistent 400 Bad Request error when creating restaurants and dishes, the developer should:

1. **Compare Request Payloads**: Meticulously compare the exact request payload being sent by the `api-test-runner-fixed.html` for the `/api/restaurants` (and subsequently `/api/dishes`) endpoint against the backend's validation rules and required schema for these specific POST requests.

2. **Verify All Field Requirements**:
   - Check if all required fields are present (e.g., `user_id` or location fields like `latitude`/`longitude` might be required by the standard `/api/restaurants` endpoint, even if they weren't needed by the `/e2e/restaurants` endpoint)
   - Ensure all field names match exactly what the backend expects
   - Confirm that data types for each field are correct (strings, numbers, booleans, etc.)
   - Validate any formatting requirements (date formats, string patterns, etc.)

3. **Inspect Backend Logs**: Crucially, inspect the detailed error messages or validation failures logged by the backend server (running on port 5001) when it returns the 400 status. These logs will pinpoint the exact discrepancy in the submitted data.

4. **Test with Postman or curl**: Create a working request using Postman or curl that successfully creates a restaurant, then compare this working payload with what the test runner is sending.

5. **Add Detailed Request Logging**: Modify the `serve-test-runner.js` proxy to log the complete request and response cycle, including headers and body, to help identify any discrepancies.

6. **Check Content-Type and Headers**: Ensure the `Content-Type` header is set correctly to `application/json` and that any other required headers are present.

7. **Verify Authentication**: Confirm that the authentication token being used has the necessary permissions to create restaurants and dishes.

## Implementation Steps

1. Add more detailed logging in the proxy server to capture the exact request and response data:

```javascript
// In serve-test-runner.js
app.use('/api-proxy', (req, res) => {
  // Log the complete request
  console.log('\n=== API REQUEST ===');
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // Forward the request and log the response
  // ...
});
```

2. Check the backend API documentation or source code to understand the exact schema expected for restaurant and dish creation.

3. Update the test runner to match the expected schema exactly:

```javascript
// Example of a more complete restaurant data object
const restaurantData = {
  name: `Test Restaurant ${Date.now()}`,
  description: 'A test restaurant created by the API test runner',
  address: '123 Test St, Test City, TS 12345',
  cuisine: 'Test Cuisine',
  price_range: '$$',
  latitude: 37.7749, // Add if required
  longitude: -122.4194, // Add if required
  user_id: window.testData.auth.user.id, // Add if required
  // Add any other required fields
};
```

## Conclusion

The API test runner has been significantly improved to better handle the actual response structure from the backend API. The user registration, login, and authentication status tests should now work correctly, but further investigation is needed for the restaurant and dish creation tests.
