# Chomp Application Integration Testing

## Overview

This document provides context for the integration testing work performed on the Chomp application. The primary goal has been to implement comprehensive integration tests to ensure all components of the application interact correctly, reducing errors and improving overall application stability.

## Test Suite Structure

The integration test suite is organized into several modules, each focusing on a specific area of functionality:

1. **Authentication Tests** (`auth-integration-tests.js`)
   - Tests user and admin login flows
   - Verifies token persistence and refresh
   - Validates access to protected routes

2. **List Management Tests** (`list-integration-tests.js`)
   - Tests creation, retrieval, updating, and deletion of lists
   - Verifies list sharing functionality
   - Tests list item management

3. **Bulk Add Tests** (`bulk-add-integration-tests.js`)
   - Tests bulk addition of restaurants
   - Verifies Google Places API integration
   - Tests handling of ambiguous entries and user selection

4. **Hashtag Service Tests** (`hashtag-integration-tests.js`)
   - Tests trending hashtags retrieval
   - Verifies hashtag search functionality
   - Tests hashtag-list associations

5. **Offline Mode Tests** (`offline-integration-tests.js`)
   - Tests offline resilience
   - Verifies auto-reconnection functionality
   - Tests QuickAdd functionality in offline mode

6. **Admin Panel Tests** (`admin-integration-tests.js`)
   - Tests admin authentication
   - Verifies user management capabilities
   - Tests data management functions

7. **Neighborhood Lookup Tests** (`neighborhood-integration-tests.js`)
   - Tests neighborhood data retrieval by ZIP code
   - Verifies integration with restaurant entries

## Test Runner

The `app-wiring-test-runner.js` file serves as the main entry point for running all integration tests. It provides:

- Configuration management
- Parallel test execution in fast mode
- Comprehensive reporting
- Server availability checks
- Timeout and retry management

## Recent Changes and Fixes

### Authentication Parameter Fixes
- Updated authentication requests to use `email` instead of `username` to match backend expectations
- Fixed in auth-integration-tests.js, list-integration-tests.js, admin-integration-tests.js, and hashtag-integration-tests.js

### Timeout Configuration
- Increased global timeout configuration to handle slower API responses
- Standardized timeout usage across all test modules
- Removed hardcoded timeout values in individual test files

### Backend URL Configuration
- Updated backend URL from port 5000 to port 5001 to match the actual running server

## Running the Tests

To run the complete test suite:
```bash
node app-wiring-test-runner.js
```

To run in fast mode (parallel execution with shorter timeouts):
```bash
node app-wiring-test-runner.js --fast
```

To run a specific section:
```bash
node app-wiring-test-runner.js --section=Authentication
```

## Important Notes

1. **Real API Data**: The test suite is designed to use real API data rather than mock data, as per project requirements.

2. **Authentication**: The backend expects authentication requests with `email` and `password` parameters, not `username`.

3. **CORS Configuration**: The backend API expects connections from port 5173, while the frontend Vite server may run on port 5174 if 5173 is already in use, potentially causing CORS errors.

4. **Timeouts**: API calls may take longer than expected, especially for complex operations like bulk add with Google Places API integration.

5. **Test Dependencies**: Some tests depend on others (e.g., list tests create lists that are used by other test modules).

## Known Issues

1. **Authentication Timeouts**: The backend authentication endpoint may be slow to respond, causing timeout issues in tests.

2. **CORS Errors**: API calls may fail with CORS errors if the frontend is running on an unexpected port.

3. **403 Errors**: Some tests may encounter 403 Forbidden errors if authentication fails.

## Next Steps

1. **Complete Test Implementation**: Finish implementing remaining test modules (item management, search & discovery, UI components).

2. **Optimize Test Performance**: Further optimize test execution to reduce overall test runtime.

3. **Enhance Error Handling**: Improve error reporting and handling in test modules.

4. **CI/CD Integration**: Integrate tests with CI/CD pipeline to run on every pull request.

## Architecture Considerations

The Chomp application has several architectural considerations that affect testing:

1. **Authentication System**: The authentication system evolved organically with multiple developers adding features, leading to scattered logic and inconsistent error handling.

2. **Component Inconsistencies**: There are multiple implementations of similar components (e.g., ListCard, ModalListCard, FixedListPreviewCard) that should be standardized.

3. **API Client Implementation**: Services were passing string identifiers to apiClient instead of proper Axios configuration objects, causing errors.

4. **Offline Mode**: The application has complex offline mode handling with local storage persistence and operation queuing.

This README provides context for the ongoing work to improve the integration testing of the Chomp application, ensuring all components work together correctly and reliably.
