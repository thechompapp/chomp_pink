# Test Runners

This directory contains the consolidated test runners for the application. The test infrastructure has been refactored to provide a more maintainable and consistent testing experience.

## Structure

```
test-runners/
├── consolidated/           # Consolidated test runners
│   ├── e2e-test-runner.js    # E2E test runner
│   ├── integration-test-runner.js  # Integration test runner
│   ├── unit-test-runner.js   # Unit test runner
│   ├── run-tests.js          # Main test runner
│   └── setup/                # Test setup files
│       └── test-setup.js     # Global test setup
└── README.md                # This file
```

## Available Commands

Run tests using npm scripts defined in `package.json`:

```bash
# Run all tests
npm test

# Run specific test types
npm test -- --unit
npm test -- --integration
npm test -- --e2e

# Run with watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage

# Run specific tests matching a pattern
npm test -- --grep "auth"

# Run with verbose output
npm test -- --verbose
```

## Test Organization

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between components and services
- **E2E Tests**: Test complete user flows in a real browser environment

## Writing Tests

### Unit Tests

Place unit test files next to the code they test with a `.test.js` or `.spec.js` suffix, or in a `__tests__` directory.

### Integration Tests

Place integration tests in the `tests/integration` directory with a `.test.js` or `.spec.js` suffix.

### E2E Tests

Place E2E tests in the `tests/e2e` directory. These tests should use a testing framework like Playwright or Cypress.

## Configuration

Test configuration is managed in `test-runners/consolidated/run-tests.js`. You can customize:

- Test environment settings
- File patterns for test discovery
- Coverage reporting
- Global test setup and teardown

## Debugging Tests

To debug tests, you can use the `--inspect-brk` flag with Node.js:

```bash
node --inspect-brk test-runners/consolidated/run-tests.js --unit
```

Then open Chrome DevTools and click on the Node.js icon to debug.
