# Doof Application Test Suite

This directory contains all tests for the Doof application, organized by test type and functionality.

## Test Structure

The tests are organized into the following structure:

```
tests/
├── e2e/                  # End-to-end tests
│   ├── api/              # API-focused E2E tests
│   └── features/         # Feature-focused E2E tests
├── integration/          # Integration tests
├── unit/                 # Unit tests
│   └── services/         # Service-specific unit tests
├── setup/                # Test setup and configuration
├── runners/              # Test runner scripts
└── run-tests.js          # Main test runner
```

## Test Types

### E2E Tests

End-to-end tests verify the entire application stack, including frontend, backend, and database interactions. These tests are further divided into:

- **API Tests**: Focus on testing API endpoints and their responses
- **Feature Tests**: Focus on testing complete user flows and features

### Integration Tests

Integration tests verify that multiple components work together correctly. These tests typically focus on a subset of the application.

### Unit Tests

Unit tests verify that individual components (functions, classes, etc.) work correctly in isolation.

## Running Tests

### Running All Tests

```bash
node tests/run-tests.js
```

### Running Specific Test Types

```bash
# Run all E2E tests
node tests/run-tests.js e2e

# Run only E2E API tests
node tests/run-tests.js e2e-api

# Run only E2E feature tests
node tests/run-tests.js e2e-features

# Run integration tests
node tests/run-tests.js integration

# Run unit tests
node tests/run-tests.js unit
```

### Running a Specific Test

```bash
# Run a specific test by name (searches in all test directories)
node tests/run-tests.js auth

# Run a specific test within a specific test type
node tests/run-tests.js e2e auth
node tests/run-tests.js integration simplified-auth
node tests/run-tests.js unit dataCleanupService
```

### Using the Single Test Runner

For more control over running a specific test, you can use the single test runner:

```bash
# Run a specific test with auto-detection of test type
node tests/runners/run-test.js auth-e2e-test.js

# Run a specific test with explicit test type
node tests/runners/run-test.js auth-e2e-test.js e2e-features
```

## Adding New Tests

When adding new tests, please follow these guidelines:

1. Place the test in the appropriate directory based on its type
2. Use consistent naming conventions:
   - E2E tests: `feature-name-e2e-test.js` or `feature-name.e2e.test.js`
   - Integration tests: `feature-name.test.js`
   - Unit tests: `component-name.test.js`
3. Import setup utilities from the `setup` directory
4. Use the appropriate test runner to run your tests

## Test Setup

The `setup` directory contains utilities for setting up test environments, including:

- Database initialization
- API clients
- Test users
- Global setup and teardown

Please refer to these utilities when writing new tests to ensure consistency.
