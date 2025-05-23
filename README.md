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

### Test Suite Architecture

The integration test suite has evolved through multiple phases:

#### Phase 1-2: Basic Integration Testing (Weeks 1-6) ✅ COMPLETED
- **Frontend Services Integration**: Validates service layer interactions and data flow patterns
- **React Hooks Integration**: Tests hook interactions with services and state management
- **Status**: ✅ 28/28 tests passing (100% success rate)

#### Phase 3: Real Data Rendering Diagnostics ✅ ACTIVE
- **Real Data Diagnostics**: Comprehensive system health checks for online data rendering
- **Purpose**: Diagnose why app isn't rendering real online components from database
- **Status**: 🔍 Backend connectivity issues identified - backend server not running

### Current Development Status (2025-05-23)

#### ✅ Completed Infrastructure
1. **Integration Testing Framework**
   - Internal test runner with Vitest integration
   - Configuration for JS/JSX test files
   - Comprehensive reporting and progress tracking
   - Pattern validation for architectural integrity

2. **Service Layer Validation**
   - All frontend services tested for integration patterns
   - Authentication flow patterns validated
   - Data flow integration patterns verified
   - Cross-service error propagation tested

3. **Hook Integration Validation**
   - Hook-service integration patterns tested
   - React Query integration patterns validated
   - Multi-hook state coordination verified
   - Performance optimization patterns confirmed

#### 🔍 Current Issue: Real Data Rendering
**Problem**: App not displaying real online components (lists, restaurants, dishes) from database

**Root Cause Identified**: Backend server not running on port 5001

**Diagnostic Results**:
- ❌ Backend server connectivity: Failed (timeout)
- ❌ API endpoints: Not accessible 
- ❌ Authentication flow: Cannot connect
- ❌ Network connectivity: Backend unreachable
- ✅ Online mode: App correctly configured for online mode

**Immediate Solution**:
```bash
cd doof-backend
npm install
npm start
```

### Test Suite Structure

The integration test suite is located in the `/tests` directory and is coordinated by the main test runner at `/internal-integration-test-runner.js`. The test modules are organized as follows:

1. **Frontend Services Tests** (`service-integration-tests.js`) ✅
   - Service architecture validation
   - Authentication flow patterns
   - Data flow integration patterns
   - Cross-service error propagation
   - Performance and caching coordination

2. **React Hooks Tests** (`hook-integration-tests.jsx`) ✅
   - Hook-service integration patterns
   - React Query integration patterns  
   - Multi-hook state coordination
   - Error boundary integration
   - Performance optimization patterns

3. **Real Data Diagnostics** (`real-data-integration-tests.js`) 🔍
   - Backend server connectivity verification
   - Database connection and sample data checks
   - Authentication flow validation
   - API endpoint accessibility testing
   - Online/offline mode verification
   - End-to-end data flow diagnostics

4. **Component Integration Tests** (`component-integration-tests.js`) 📋 PLANNED
   - Component and hook integration
   - UI component rendering with real data
   - User interaction flows

5. **Backend Integration Tests** (`backend-integration-tests.js`) 📋 PLANNED
   - Controller, service, and middleware interactions
   - Database operations
   - API response validation

### Running the Tests

#### Quick Diagnostics (Recommended First Step)
```bash
npm run test:integration:diagnostics
```
This comprehensive diagnostic suite will identify infrastructure issues preventing real data rendering.

#### Individual Test Suites
```bash
npm run test:integration:services    # Frontend service validation
npm run test:integration:hooks       # React hooks integration
npm run test:integration:components  # Component integration (when ready)
npm run test:integration:backend     # Backend integration (when ready)
```

#### Complete Test Suite
```bash
npm run test:integration              # All integration tests
npm run test:integration:fast         # Parallel execution with shorter timeouts
npm run test:integration:coverage     # With coverage reporting
```

#### Specific Sections
```bash
npm run test:integration --section="Frontend Services"
npm run test:integration --section="Real Data Diagnostics"
```

### Development Workflow for Real Data Issues

#### Step 1: Run Diagnostics
```bash
npm run test:integration:diagnostics
```

#### Step 2: Fix Infrastructure Issues
Based on diagnostic results:
- **Backend not running**: `cd doof-backend && npm start`
- **Database issues**: Check database connection and sample data
- **Authentication problems**: Verify admin user exists
- **CORS issues**: Check backend CORS configuration

#### Step 3: Verify Fix
```bash
npm run test:integration:diagnostics
```
All diagnostic tests should pass before proceeding.

#### Step 4: Test Application
```bash
npm run dev
```
Open browser and verify real data is loading.

### Important Notes

1. **Real Data Focus**: The test suite is designed to work with real API data rather than mock data to identify actual integration issues.

2. **Progressive Debugging**: Start with diagnostic tests to identify infrastructure problems before testing higher-level integration.

3. **Backend Dependency**: The application requires the backend server running on port 5001 for all real data functionality.

4. **Authentication**: The backend expects authentication requests with `email` and `password` parameters.

5. **CORS Configuration**: The backend API expects connections from port 5173, while the frontend Vite server may run on port 5174 if 5173 is already in use.

### Recent Development Progress

#### Integration Testing Infrastructure (2025-05-22 to 2025-05-23)
1. **Phase 1-2 Implementation**: Successfully implemented and validated weeks 1-6 of integration testing
   - Created comprehensive service integration tests
   - Implemented React hooks integration validation
   - Achieved 100% test success rate for architectural patterns

2. **Real Data Rendering Diagnostic System**: Developed comprehensive diagnostic framework
   - Backend connectivity verification
   - Authentication flow validation
   - Online/offline mode detection
   - End-to-end data flow testing

3. **Test Infrastructure Improvements**:
   - Vitest configuration for both JS and JSX files
   - Internal test runner with progress tracking
   - Detailed JSON reporting with recommendations
   - Pattern validation approach avoiding complex mocks

### Troubleshooting Guide

#### Backend Server Issues
**Symptoms**: Diagnostic tests show backend connectivity failures
**Solution**: 
```bash
cd doof-backend
npm install
npm start
# Verify server starts on port 5001
```

#### Authentication Problems  
**Symptoms**: Login tests fail, authentication endpoint unreachable
**Solutions**:
- Ensure backend server is running
- Verify admin user exists in database
- Check backend authentication configuration

#### Real Data Not Displaying
**Symptoms**: Frontend loads but shows empty/cached data
**Diagnostic Steps**:
1. Run `npm run test:integration:diagnostics`
2. Check browser console for JavaScript errors
3. Verify network requests in browser dev tools
4. Clear browser storage and reload

#### Offline Mode Stuck
**Symptoms**: App shows cached data despite online connectivity
**Solution**:
```javascript
// Clear in browser console
localStorage.removeItem('offline-mode');
localStorage.removeItem('offline_mode'); 
localStorage.setItem('force_online', 'true');
location.reload();
```

### Future Development Roadmap

#### Immediate (Next 1-2 hours)
- Fix backend server connectivity
- Verify real data rendering works
- Complete component integration tests

#### Short-term (Next 1-2 weeks)  
- Implement backend integration tests
- Add performance monitoring
- Enhance error tracking

#### Long-term (Next 1-2 months)
- Full end-to-end testing suite
- Automated CI/CD integration
- Production monitoring integration
