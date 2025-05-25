# API Test Runner Handoff Document

## Overview

This document provides a comprehensive analysis of the API Test Runner issues in the Chomp/Doof application, detailing the problems encountered, fixes attempted, and recommendations for resolving the remaining issues. The API Test Runner is a critical component for validating the application's backend connectivity and ensuring that all API endpoints function correctly.

## Current Status

**Status: Not Functioning Correctly**

The API Test Runner (`/public/api-test-runner-fixed.html`) is currently failing with several critical errors:

1. **Authentication Token Issues**: Tests that depend on user authentication are failing with "No authentication token available" errors.
2. **Data Propagation Problems**: Tests like "Create Dish" are failing with "No restaurant data available" errors, indicating that data from previous tests is not being correctly passed to subsequent tests.
3. **Browser Loading Issues**: The API Test Runner page itself is not loading correctly in the browser, with JavaScript errors preventing proper execution.

## Technical Analysis

### 1. Authentication System Circular Dependency

A critical JavaScript error was identified in the browser console:

```
authService.js:244 Uncaught TypeError: Cannot read properties of undefined (reading 'request')
```

This error occurs because of a circular dependency between `authService.js` and `apiClient.js`:

- `authService.js` imports `apiClient` from `apiClient.js` and tries to add interceptors to it
- `apiClient.js` might directly or indirectly depend on `authService.js`
- This creates a situation where `apiClient.interceptors` is undefined when `authService.js` tries to access it

This error prevents the API Test Runner from loading properly and executing tests.

### 2. API Path Configuration Issues

The API Test Runner was previously using incorrect API paths:

- Using `/api-proxy/api` instead of the correct `/api` path
- Not aligning with the Vite proxy configuration which routes `/api` requests to the backend server

### 3. User Registration and Login Failures

The registration and login tests are failing, which causes cascading failures in subsequent tests that require authentication:

- Registration might be failing due to duplicate email addresses
- Login might be failing due to incorrect credentials or backend validation issues
- The error logs from these tests are not being properly captured or displayed

### 4. Vite Development Server Configuration

The Vite development server configuration may be causing issues with serving static files from the `public` directory:

- The API Test Runner HTML file exists in the `public` directory but isn't being served correctly
- When accessing `http://localhost:5173/public/api-test-runner-fixed.html`, the main application is displayed instead
- This suggests a routing or configuration issue in the Vite setup

## Fixes Attempted

### 1. Circular Dependency Resolution

We attempted to resolve the circular dependency between `authService.js` and `apiClient.js` by:

1. Refactoring `authService.js` to:
   - Use the correct API methods (`apiClient.post()`, `apiClient.get()`, etc.) instead of the incorrect format `apiClient({url: ..., method: ...})`
   - Move the interceptor setup logic into a separate exported function `setupAuthInterceptors(axiosInstance)`
   - Change references from `this.method()` to `AuthService.method()` where appropriate

2. Modifying `apiClient.js` to:
   - Import the `setupAuthInterceptors` function from `authService.js`
   - Call this function after the Axios instance is fully created and patched

This approach was designed to break the circular dependency by ensuring that `apiClient` is fully initialized before any interceptors are attached.

### 2. API Path Corrections

We updated the API Test Runner to:

- Use `/api` as the base path for all API requests
- Align with the Vite proxy configuration in `vite.config.js`
- Ensure consistent URL handling across all test cases

### 3. User Registration Uniqueness

We enhanced the registration process to:

- Generate unique email addresses for each test run by appending timestamps and random suffixes
- Improve error logging to capture and display backend responses
- Ensure proper propagation of authentication tokens to subsequent tests

### 4. React Router Issue Fix

We identified a potential issue with React Router intercepting requests to the API Test Runner HTML file. We attempted to fix this by:

- Commenting out problematic imports in `/src/pages/AuthTest/index.jsx` that were causing build errors
- This was intended to allow the Vite build to complete successfully and serve static files correctly

## Remaining Issues

Despite these fixes, several issues remain:

1. **Browser Preview Redirection**: When attempting to access the API Test Runner at `http://localhost:5173/public/api-test-runner-fixed.html`, the browser still shows the main application instead of the API Test Runner.

2. **Authentication Flow**: We haven't been able to verify if the registration and login processes are working correctly because we can't access the API Test Runner's UI log panel.

3. **Data Propagation**: The issue of data not being correctly passed between tests (e.g., restaurant data to the dish creation test) remains unresolved.

## Root Causes Analysis

The API Test Runner issues stem from several interconnected problems:

1. **Architectural Issues**: The authentication system evolved organically with multiple developers adding features, leading to scattered logic and circular dependencies.

2. **Inconsistent API Client Usage**: Different parts of the application use different patterns for making API requests, leading to instability and errors.

3. **Vite Configuration Complexity**: The Vite setup includes custom plugins and proxy configurations that may be interfering with static file serving.

4. **React Router Catch-All Routes**: The application likely has catch-all routes that redirect unknown paths to the main application, preventing direct access to the API Test Runner.

## Recommendations

### Immediate Actions

1. **Serve API Test Runner Separately**:
   - Create a simple Express server to serve the API Test Runner HTML file outside of the Vite development server
   - This bypasses any issues with Vite configuration or React Router

2. **Verify API Endpoints Directly**:
   - Use curl or Postman to test each API endpoint directly
   - Confirm that the registration, login, and other endpoints are functioning correctly

3. **Enhance Error Logging**:
   - Add more comprehensive error logging to the API Test Runner
   - Ensure all request and response details are captured and displayed

### Long-Term Solutions

1. **Authentication System Refactoring**:
   - Implement the comprehensive authentication system rewrite plan
   - Create a unified AuthContext with clear separation of concerns
   - Standardize token management and error handling

2. **API Client Standardization**:
   - Consolidate all API request logic into a single, well-structured module
   - Implement consistent patterns for making API requests
   - Ensure proper error handling and retry logic

3. **Testing Strategy Enhancement**:
   - Develop a more robust testing strategy that doesn't rely on HTML-based test runners
   - Implement automated tests using Jest, Vitest, or similar frameworks
   - Ensure tests can run in CI/CD pipelines

## Technical Details

### Key Files Involved

1. `/public/api-test-runner-fixed.html`: The main API Test Runner file
2. `/src/services/authService.js`: Handles authentication-related API calls
3. `/src/services/apiClient.js`: Provides the API client functionality
4. `/vite.config.js`: Configures the Vite development server
5. `/src/pages/AuthTest/index.jsx`: Contains problematic imports causing build errors

### API Endpoints Used by the Test Runner

1. **Authentication Endpoints**:
   - `/api/auth/register`: Register a new user
   - `/api/auth/login`: Log in a user
   - `/api/auth/logout`: Log out a user
   - `/api/auth/status`: Check authentication status

2. **E2E Testing Endpoints**:
   - `/api/e2e/restaurants`: CRUD operations for restaurants
   - `/api/e2e/dishes`: CRUD operations for dishes

3. **Health Check Endpoint**:
   - `/api/health`: Verify backend connectivity

### Environment Configuration

The application uses the following environment variables:

- `VITE_API_BASE_URL=http://localhost:5001/api`: Base URL for API requests
- `VITE_GOOGLE_PLACES_API_KEY`: API key for Google Places (not directly relevant to the API Test Runner)

## Conclusion

The API Test Runner issues are symptoms of deeper architectural problems in the application, particularly in the authentication system and API client implementation. While we've made progress in identifying and addressing some of these issues, a more comprehensive refactoring is needed to fully resolve them.

The immediate priority should be to get the API Test Runner functioning correctly, either by fixing the current issues or by creating a simpler, standalone version that doesn't depend on the complex Vite and React Router setup. Once the API endpoints can be properly tested, the focus can shift to implementing the longer-term architectural improvements.

---

*Document prepared on: May 24, 2025*
