# Integration Testing Issues in Doof Application

## Overview
This document outlines the issues encountered while setting up and running integration tests for the Doof application, specifically focusing on the health endpoint tests. The primary challenges revolve around CORS (Cross-Origin Resource Sharing) configuration, test environment setup, and API endpoint accessibility.

## Current State

### Test Configuration
- **Test Framework**: Vitest
- **HTTP Client**: Axios
- **Test Environment**: Node.js with JSDOM
- **Backend Server**: Running on port 5001
- **Test File**: `tests/integration/simplified-health.test.js`

### Observed Issues

1. **CORS Configuration Problems**
   - The test environment is running in a Node.js context with JSDOM
   - Browser-like CORS restrictions are being enforced
   - Custom headers (like `X-Test-Request`) are being rejected by the test environment

2. **Endpoint Accessibility**
   - Backend server is running on port 5001 (`http://localhost:5001`)
   - Health endpoint is accessible at `/api/health`
   - Initial tests were failing due to incorrect port configuration (3000 instead of 5001)

3. **Test Environment Limitations**
   - JSDOM's implementation of XMLHttpRequest has limitations with CORS
   - Certain headers that are normally allowed in browsers are rejected in the test environment
   - The test environment is more restrictive than actual browser behavior

## Error Analysis

### Error 1: CORS Headers Rejection
```
Error: Headers Access-Control-Allow-Origin,Access-Control-Allow-Methods,Access-Control-Allow-Headers forbidden
```
**Cause**: The test environment is rejecting CORS-related headers that are typically set by the server.

### Error 2: Network Errors
```
AxiosError: Network Error
```
**Cause**: The test environment is unable to establish a connection to the API endpoint, often due to CORS preflight request failures.

## Attempted Solutions

1. **Simplified Headers**
   - Removed all non-essential headers from test requests
   - Kept only the `Accept: application/json` header

2. **Direct API Testing**
   - Verified API accessibility using `curl`
   - Confirmed the API is running and accessible on port 5001

3. **Test Environment Configuration**
   - Updated base URL to use the correct port (5001)
   - Simplified axios instance configuration
   - Added comprehensive logging for debugging

## Recommended Solutions

### Short-term Fixes
1. **Update Test Configuration**
   - Continue with minimal headers in test requests
   - Ensure all tests use the correct base URL (`http://localhost:5001/api`)

2. **Mock API Responses for Tests**
   - Consider using mocks for API responses in unit tests
   - Reserve real API calls for end-to-end tests

3. **Test Environment Setup**
   - Ensure the backend server is running before tests
   - Add health check before running tests

### Long-term Improvements
1. **Dedicated Test Endpoints**
   - Create test-specific API endpoints that don't enforce CORS
   - Use environment variables to switch between test and production endpoints

2. **Dockerized Test Environment**
   - Containerize the application and tests
   - Run tests in an isolated environment with proper networking

3. **API Contract Testing**
   - Implement contract tests to verify API behavior
   - Use tools like Pact for consumer-driven contract testing

## Next Steps

1. [ ] Verify API accessibility with minimal headers
2. [ ] Update test configuration to use correct endpoints
3. [ ] Implement proper error handling for test failures
4. [ ] Add documentation for running tests
5. [ ] Consider adding CI/CD pipeline for automated testing

## References
- [Vitest Documentation](https://vitest.dev/)
- [Axios GitHub](https://github.com/axios/axios)
- [JSDOM Known Limitations](https://github.com/jsdom/jsdom#known-issues)
