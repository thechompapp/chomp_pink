# Doof E2E Testing Suite

This directory contains end-to-end (E2E) tests for the Doof application. These tests verify that the entire system works correctly from the user's perspective by simulating real user interactions with the API.

## Overview

The E2E tests are designed to run against the real backend API, ensuring that all functionalities are thoroughly tested in an environment that closely resembles production. The tests cover authentication, restaurant management, dish management, search functionality, and more.

## Test Structure

The E2E test suite is organized as follows:

```
e2e/
├── setup/                 # Test setup utilities
│   ├── api-client.js      # API client for making requests
│   ├── config.js          # Test configuration
│   ├── db-utils.js        # Database utilities
│   └── global-setup.js    # Global setup/teardown
├── tests/                 # Test files
│   ├── admin.e2e.test.js  # Admin functionality tests
│   ├── auth.e2e.test.js   # Authentication tests
│   ├── dishes.e2e.test.js # Dish-related tests
│   └── ...                # Other test files
├── vitest.config.js       # Vitest configuration
└── run-e2e-tests.js       # Test runner script
```

## Test Coverage

The E2E tests cover the following areas:

1. **Authentication**
   - Login/logout flows
   - JWT token handling
   - Authorization checks

2. **Restaurants**
   - Fetching restaurant details
   - Filtering restaurants
   - Restaurant submissions

3. **Dishes**
   - Fetching dish details
   - Filtering dishes
   - Dish submissions

4. **Lists**
   - Creating and managing lists
   - Adding items to lists
   - Sharing lists

5. **Search**
   - Searching for restaurants, dishes, and lists
   - Search filters and sorting

6. **Admin**
   - User management
   - Content moderation
   - System configuration

7. **Engagement**
   - Likes and favorites
   - User interactions

8. **Locations**
   - City and neighborhood functionality
   - Location-based filtering

9. **Hashtags**
   - Hashtag retrieval and filtering
   - Trending hashtags

## Running the Tests

### Prerequisites

Before running the tests, make sure you have:

1. Node.js installed (v14 or higher)
2. The Doof API server running
3. A test database configured

### Installation

Install the required dependencies:

```bash
npm install
```

### Configuration

Update the configuration in `setup/config.js` with your test environment details:

- API base URL
- Test user credentials
- Test data

### Running All Tests

To run all E2E tests:

```bash
node e2e/run-e2e-tests.js
```

Or using npm script (if configured):

```bash
npm run test:e2e
```

### Running Specific Tests

To run specific test files:

```bash
npx vitest run e2e/tests/auth.e2e.test.js
```

## Test Reports

After running the tests, a JSON report will be generated in `e2e/test-results.json`. This report contains detailed information about test results, including:

- Test status (passed/failed)
- Execution time
- Error details for failed tests

## Extending the Tests

To add new tests:

1. Create a new test file in the `tests` directory following the naming convention `*.e2e.test.js`
2. Import the necessary utilities from the `setup` directory
3. Use the standard Vitest test structure with `describe` and `it` blocks
4. Use the `handleApiRequest` function for making API requests

Example:

```javascript
import { describe, it, expect } from 'vitest';
import apiClient, { handleApiRequest } from '../setup/api-client.js';

describe('My Feature', () => {
  it('should do something', async () => {
    const result = await handleApiRequest(
      () => apiClient.get('/my-endpoint'),
      'Get my data'
    );
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('expectedProperty');
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Clean up**: Always clean up resources created during tests
3. **Error handling**: Use the `handleApiRequest` function to standardize error handling
4. **Timeouts**: Set appropriate timeouts for long-running tests
5. **Descriptive names**: Use clear and descriptive test names
6. **Assertions**: Make specific assertions about the expected behavior
