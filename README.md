# Chomp Application

Chomp is a food playlist application that allows users to create, share, and discover lists of restaurants and food establishments.

## Tech Stack

- **Frontend**: React + Vite with HMR and ESLint
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Authentication**: JWT-based authentication
- **API Integration**: Google Places API, Google Maps API

Currently, two official Vite plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Environment Variables

This project uses environment variables to manage configuration and sensitive information. Below is a list of the key environment variables used:

- `NODE_ENV`: Specifies the environment mode (development or production).
- `DB_USER`: Database username.
- `DB_PASSWORD`: Database password.
- `DB_HOST`: Database host address.
- `DB_DATABASE`: Database name.
- `JWT_SECRET`: Secret key for JWT authentication.
- `GOOGLE_MAPS_API_KEY`: API key for Google Maps services.

### Setup Instructions

1. Create a `.env` file in the root directory of the project.
2. Add the necessary environment variables to the `.env` file, following the format `KEY=VALUE`.
3. Ensure the `.env` file is included in the `.gitignore` to prevent it from being committed to version control.

## Integration Testing

### Overview

The Chomp application includes a comprehensive integration testing suite to ensure all components interact correctly, reduce errors, and improve overall application stability.

### Test Suite Structure

The integration test suite is located in the `/tests` directory and is coordinated by the main test runner at `/app-wiring-test-runner.js`. The test modules are organized as follows:

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

### Running the Tests

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

### Important Notes

1. **Real API Data**: The test suite is designed to use real API data rather than mock data.

2. **Authentication**: The backend expects authentication requests with `email` and `password` parameters.

3. **CORS Configuration**: The backend API expects connections from port 5173, while the frontend Vite server may run on port 5174 if 5173 is already in use.

4. **Timeouts**: API calls may take longer than expected, especially for complex operations.

5. **Test Dependencies**: Some tests depend on others (e.g., list tests create lists that are used by other test modules).

### Recent Fixes

1. **Authentication Parameter Fixes**: Updated authentication requests to use `email` instead of `username` to match backend expectations
2. **Timeout Configuration**: Increased and standardized timeout values across all test modules
3. **Backend URL Configuration**: Updated backend URL to connect to the correct port (5001)
4. **API Reference Fixes**: Corrected API references in test modules to use instance variables consistently

### Known Issues

1. **Authentication Timeouts**: The backend authentication endpoint may be slow to respond, causing timeout issues in tests
2. **CORS Errors**: API calls may fail with CORS errors if the frontend is running on an unexpected port (backend expects port 5173)
3. **403 Errors**: Some tests may encounter 403 Forbidden errors if authentication fails

### Architectural Considerations

1. **Authentication System**: The authentication system evolved organically with multiple developers adding features, leading to scattered logic and inconsistent error handling
2. **Component Inconsistencies**: There are multiple implementations of similar components (e.g., ListCard, ModalListCard, FixedListPreviewCard) that should be standardized
3. **Offline Mode**: The application has complex offline mode handling with local storage persistence and operation queuing
4. **API Client Implementation**: Services should use proper Axios configuration objects for consistency

## Project Structure

### Testing Infrastructure

```
/
├── app-wiring-test-runner.js     # Main test runner and coordinator
├── integration-test-strategy.md  # Strategic approach to integration testing
├── test-reports/                 # Directory for test execution reports
└── tests/                        # Test modules directory
    ├── auth-integration-tests.js       # Authentication tests
    ├── list-integration-tests.js       # List management tests
    ├── item-integration-tests.js       # Item management tests
    ├── bulk-add-integration-tests.js   # Bulk add functionality tests
    ├── offline-integration-tests.js    # Offline mode tests
    ├── hashtag-integration-tests.js    # Hashtag service tests
    ├── admin-integration-tests.js      # Admin panel tests
    ├── neighborhood-integration-tests.js # Neighborhood lookup tests
    ├── search-integration-tests.js     # Search functionality tests
    └── ui-integration-tests.js         # UI component tests
```

### Test Configuration

The main test configuration is defined in `app-wiring-test-runner.js` and includes:

- Backend and frontend URLs
- Authentication credentials
- Timeout settings
- Retry mechanisms
- Reporting configuration

Each test module follows a consistent pattern:

1. **Setup**: Initialize API client, configure timeouts
2. **Authentication**: Authenticate with the backend
3. **Test Execution**: Run individual test cases
4. **Cleanup**: Remove test data and logout

### Test Reports

Test reports are generated in JSON format and saved to the `/test-reports` directory with timestamps. These reports include:

- Overall test summary
- Individual test results
- Error details
- Performance metrics
- Recommendations for fixing issues

### Troubleshooting Common Issues

#### Authentication Problems

1. **403 Forbidden Errors**:
   - Verify that authentication requests use `email` instead of `username` parameter
   - Check that the correct credentials are configured in `app-wiring-test-runner.js`
   - Ensure the backend server is properly initialized with the correct user accounts

2. **Timeout Issues**:
   - Increase the `TIMEOUT_MS` value in `app-wiring-test-runner.js`
   - Check that test modules aren't using hardcoded timeout values that override the global configuration
   - Verify the backend server is responsive and not overloaded

3. **CORS Errors**:
   - Ensure the frontend is running on port 5173 (use `dev-server.js` to force this port)
   - Check that the backend CORS configuration includes all necessary origins
   - Use the `vite-axios-fix-plugin.js` to handle CORS issues with Axios

#### Test Execution Problems

1. **Dependency Failures**:
   - Tests may fail if they depend on data created by other tests that failed
   - Run tests in sequence (without `--fast` flag) to identify dependency issues
   - Use the `--section` flag to run specific test sections in isolation

2. **API Response Validation**:
   - Check for changes in API response structures that might break tests
   - Verify that test assertions match the current API behavior
   - Look for inconsistent data handling across different test modules

3. **State Management**:
   - Tests may fail due to leftover state from previous test runs
   - Use the cleanup functions in each test module to ensure proper state reset
   - Consider implementing a global reset function to clear all test data

### Recent Development History

The integration test suite has undergone several recent improvements:

1. **Authentication Parameter Standardization** (May 2025):
   - Updated all test modules to use `email` parameter consistently
   - Fixed authentication token handling in all test modules
   - Standardized error handling for authentication failures

2. **Timeout Configuration Improvements** (May 2025):
   - Removed hardcoded timeout values from individual test modules
   - Implemented a global timeout configuration
   - Added adaptive timeouts based on test mode (fast vs. regular)

3. **Test Module Expansion** (May 2025):
   - Added new test modules for hashtag service, admin panel, and neighborhood lookup
   - Enhanced existing tests for offline mode and bulk add functionality
   - Implemented parallel test execution for faster feedback

4. **Reporting Enhancements** (May 2025):
   - Added detailed JSON reports with timestamps
   - Implemented color-coded console output
   - Added recommendations for fixing common issues
