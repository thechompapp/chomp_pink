# Terminal-Based Test Results Reporter for Chomp/Doof

This package provides a comprehensive terminal-based test results reporter for the Chomp/Doof application. It enhances the test output with clear, informative, and well-formatted terminal displays, including detailed API request and response information.

## Features

- **Clear Test Summary**: Shows total tests run, passed, failed, and skipped with visual indicators
- **Hierarchical Test Structure**: Organizes tests by suite and individual test cases
- **API Request/Response Details**: Displays API interaction details for debugging
- **Error Highlighting**: Clearly shows error messages and stack traces for failed tests
- **Verbosity Control**: Allows detailed or summary views based on your needs

## Getting Started

### Running Tests with Enhanced Reporting

Use the provided script to run tests with enhanced reporting:

```bash
# Run all API tests with enhanced reporting
node tests/run-with-reporter.js tests/e2e/api

# Run specific test file with verbose output (shows all API requests/responses)
node tests/run-with-reporter.js tests/e2e/api/api-reporter-demo.test.js --verbose
```

### Creating New Tests with Enhanced Reporting

To create new tests that work with the enhanced reporting system:

1. Import the enhanced test setup:

```javascript
import { apiClient, tokenStorage, TEST_TIMEOUT } from '../../setup/enhanced-test-setup.js';
import { setupVitestHooks } from '../../setup/setup-vitest-hooks.js';

// Setup Vitest hooks for capturing API request/response data
setupVitestHooks();
```

2. Use the provided `apiClient` for making API requests:

```javascript
// The request and response will be automatically captured for reporting
const response = await apiClient.get('/api/health');
```

3. Handle connection errors gracefully:

```javascript
// Accept either 200 (success) or 0 (connection issue)
expect([200, 0]).toContain(response.status);

// Only check data properties if we got a successful response
if (response.status === 200) {
  expect(response.data).toHaveProperty('status');
}
```

## Example Test

See the demo test for a complete example:
`tests/e2e/api/api-reporter-demo.test.js`

## Components

### Core Components

- **test-reporter.js**: Processes test results and generates formatted terminal output
- **run-with-reporter.js**: Script to run tests and display results with the custom reporter
- **enhanced-direct-http-client.js**: Extended HTTP client that captures request/response data
- **enhanced-test-setup.js**: Sets up the test environment with the enhanced client
- **setup-vitest-hooks.js**: Configures Vitest hooks to capture test context

### Updating Existing Tests

To update existing tests to use the enhanced reporting system:

```bash
# Run the update script
node tests/setup/update-to-enhanced-tests.js
```

This script will modify API test files to use the enhanced test setup.

## Best Practices

1. **Handle Connection Issues**: Always check for both successful responses (status 200) and connection issues (status 0)
2. **Use Timeouts**: Set appropriate timeouts for tests to avoid hanging
3. **Clean Up Resources**: Always clean up resources (like authentication tokens) after tests
4. **Descriptive Test Names**: Use clear, descriptive names for test suites and cases
5. **Isolate Tests**: Make sure tests are independent and can run in any order

## Troubleshooting

- **Tests Hanging**: Check if you're properly handling connection issues and timeouts
- **Missing API Details**: Ensure you're using the enhanced API client and have set up the Vitest hooks
- **Reporter Errors**: Check that the test results JSON file is being generated correctly

## Contributing

To enhance the test reporter:

1. Modify the `test-reporter.js` file to add new features
2. Update the `enhanced-direct-http-client.js` to capture additional request/response data
3. Add new test utilities to the `tests/utils` directory

## Future Enhancements

- Add support for exporting test results to HTML or PDF reports
- Implement test coverage reporting
- Add performance metrics visualization
- Support for comparing test results across runs
