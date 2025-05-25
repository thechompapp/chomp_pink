# CI/CD Setup and Testing Guide

This document provides an overview of the CI/CD pipeline setup and testing procedures for the Doof application.

## CI/CD Pipeline

The CI/CD pipeline is configured using GitHub Actions and is defined in `.github/workflows/ci.yml`. It includes the following jobs:

### Test Job
- Runs on: Ubuntu latest
- Services:
  - PostgreSQL 14 for testing
- Steps:
  1. Checkout code
  2. Set up Node.js 18
  3. Install dependencies
  4. Run unit tests
  5. Start the test server
  6. Run integration tests
  7. Stop the test server

### Deploy Job (Production)
- Runs after: Test job succeeds
- Trigger: Only on pushes to `main` branch
- Steps:
  1. Checkout code
  2. Set up Node.js 18
  3. Install production dependencies
  4. Build the application
  5. Deploy to production

## Running Tests Locally

### Prerequisites
- Node.js 18+
- PostgreSQL (for integration tests)

### Available Test Scripts

```bash
# Run all tests (unit + integration)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npm run test:health

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Environment Variables for Testing

Create a `.env.test` file in the project root with the following variables:

```env
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/testdb
PORT=5001
API_BASE_URL=http://localhost:5001/api
```

## Adding New Tests

### Integration Tests
1. Place new test files in the `tests/integration` directory
2. Use the `apiClient` from `../setup/test-config.js` for API requests
3. Follow the existing test structure
4. Use descriptive test names
5. Test both success and error cases

### Test Data
- Use the appropriate E2E testing endpoints when available:
  - Auth: `/api/auth/*`
  - E2E Testing: `/api/e2e/restaurants`, `/api/e2e/dishes`
  - Health: `/api/health`

## Troubleshooting

### Tests Failing in CI
1. Check the GitHub Actions logs for detailed error messages
2. Ensure all environment variables are properly set in the workflow file
3. Verify database connection settings
4. Check for port conflicts

### Local Test Failures
1. Make sure the test database is running
2. Run database migrations if needed
3. Clear any cached data
4. Check for environment variable conflicts

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Mocks**: Use mocks sparingly; prefer real API calls for integration tests
4. **Performance**: Keep tests fast and efficient
5. **Documentation**: Document any special setup required for tests
