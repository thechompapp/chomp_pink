# DOOF Application E2E Test Suite

This directory contains end-to-end (E2E) tests for the DOOF application using Playwright. These tests validate complete user flows through the actual UI, backend APIs, and state management systems with **no mocking**.

## 🎯 **Test Coverage**

### Core Flows (`core-flows.spec.js`)
- ✅ Application loading and basic UI elements
- ✅ Navigation between main pages
- ✅ Login/logout authentication flow
- ✅ Backend API connectivity verification
- ✅ Protected route access
- ✅ Search functionality
- ✅ Session state management

### Complete Flows (`doof-e2e-test-suite.spec.js`)
- 🔐 User registration with unique accounts
- 🔑 Login/logout with cross-tab synchronization
- 📝 List creation and management
- ❤️ Follow/unfollow functionality
- ➕ Quick add items to lists
- 🧭 Complete navigation testing
- 🔍 Search with result navigation
- ⏰ Session expiry handling
- 🔗 Cross-tab logout verification

## 🚀 **Getting Started**

### Prerequisites
1. **Backend running** on `http://localhost:5001`
2. **Frontend running** on `http://localhost:5174`
3. **Database** accessible and seeded with test data

### Installation
```bash
# Install Playwright (already done)
npm install --save-dev @playwright/test

# Install browsers
npx playwright install chromium

# Or install all browsers
npx playwright install
```

### Running Tests

#### Quick Start
```bash
# Run core functionality tests
npm run e2e:core

# Run all E2E tests
npm run e2e

# Run with browser UI visible
npm run e2e:headed

# Debug mode with pause/step through
npm run e2e:debug

# Interactive UI mode
npm run e2e:ui
```

#### Incremental Testing (NEW!)
Progressive test levels that build upon each other:

```bash
# Run all incremental tests
npm run e2e:incremental

# Level 1: Basic User Interactions
npm run e2e:level1

# Level 2: Content Discovery & Navigation  
npm run e2e:level2

# Level 3: User Registration & Profile
npm run e2e:level3

# Level 4: Authenticated Features
npm run e2e:level4

# Level 5: Advanced Interactions
npm run e2e:level5

# Progressive testing (Level 1-3 in sequence)
npm run e2e:progressive
```

#### Full Test Suites
```bash
# Complete comprehensive test suite
npm run e2e:full
```

## �� **Configuration**

### Test Environment
- **Frontend URL**: `http://localhost:5174`
- **Backend URL**: `http://localhost:5001`
- **Test User**: `admin@example.com` / `doof123`

## 📁 **File Structure**

```
e2e/
├── README.md                    # This file
├── global-setup.js             # Pre-test environment setup
├── global-teardown.js          # Post-test cleanup
├── auth-helpers.js             # Authentication utilities
├── core-flows.spec.js          # Essential tests (recommended)
└── doof-e2e-test-suite.spec.js # Complete test suite
```

## 🧪 **Test Philosophy**

### Real Integration Testing
- **No mocking** - tests run against live APIs
- **Actual browser** automation with real user interactions
- **Real database** operations
- **Complete state management** testing including localStorage

## 🔍 **Debugging Tests**

### Visual Debugging
```bash
# Run with browser visible
npm run e2e:headed

# Debug mode with pause
npm run e2e:debug

# Interactive UI
npm run e2e:ui
```

### Troubleshooting Common Issues

#### "Backend not accessible"
```bash
# Check backend is running
curl http://localhost:5001/api/health

# Start backend
cd doof-backend && npm run dev
```

#### "Frontend not accessible"
```bash
# Check frontend is running
curl http://localhost:5174

# Start frontend
npm run dev
```

## 💡 **Quick Test Run**

```bash
# Make sure both servers are running
cd doof-backend && npm run dev &
npm run dev &

# Run the core E2E tests
npm run e2e:core
```

Happy testing! 🎉
