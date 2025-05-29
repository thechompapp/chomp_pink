# 🛠️ Scripts Directory

This directory contains utility scripts and tools for the Doof project, organized by category for better maintainability.

## 📁 Directory Structure

### `auth/`
Authentication and user management utilities:
- `test-password-hash.js` - Test password hashing functionality
- `update-test-user-password-api.js` - Update test user password via API
- `update-test-user-password.js` - Update test user password directly
- `update-user-password-api.js` - Update user password via API

### `database/`
Database management and inspection tools:
- `check-db.js` - Database connectivity and health checker
- `check-schema.js` - Database schema validation
- `list-users.js` - List all users in the database
- `schema_dump_20250525.sql` - Database schema dump from May 25, 2025

### `testing/`
Testing utilities and test runners:
- `api-connectivity-tests.cjs` - API connectivity integration tests
- `bulk-add-processor-tests.cjs` - Bulk add processor test suite
- `check-duplicates.sh` - Check for duplicate entries
- `places-api-integration-tests.cjs` - Places API integration tests
- `run-e2e-tests.sh` - End-to-end test runner
- `test-api.js` - API testing script
- `test-create-list.js` - List creation testing
- `test-list-api.sh` - List API shell tests
- `test-list-creation.sh` - List creation shell tests
- `test-login.js` - Login functionality tests
- `test-registration.js` - Registration functionality tests
- `test-results.json` - Test results data

### Root Scripts
- `start-frontend.sh` - Frontend development server startup script

## 🚀 Usage

Most scripts can be run directly with Node.js or as shell scripts:

```bash
# Database utilities
node scripts/database/check-db.js
node scripts/database/list-users.js

# Authentication utilities
node scripts/auth/update-user-password-api.js

# Testing utilities
./scripts/testing/run-e2e-tests.sh
node scripts/testing/test-api.js

# Development
./scripts/start-frontend.sh
```

## 📝 Notes

- Scripts in `auth/` may require environment variables for database connection
- Database scripts require the backend server to be running
- Testing scripts may require specific test data setup
- Always review script contents before running in production environments

## 🔧 Maintenance

When adding new utility scripts:
1. Place them in the appropriate category directory
2. Update this README with a brief description
3. Ensure scripts have proper error handling
4. Add usage examples if the script has complex parameters
