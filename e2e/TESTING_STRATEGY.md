# Doof E2E Testing Strategy

_Last updated: May 28, 2025_

## Philosophy & Principles

- **All tests use real API endpoints.** No mocks, stubs, or fake servers are permitted for core flows.
- **Multi-level coverage:** API contract, service integration, and full user journey E2E tests.
- **Idempotency:** Each test is self-contained, cleans up after itself, and uses unique data.
- **Performance:** Tests are fast (under 5s per E2E test) and run in parallel where possible.
- **Reliability:** Tests run against a dedicated PostgreSQL test database and real backend server.
- **No functional regressions:** Refactors and test improvements must not change app behavior.

## Test Environment

- **Backend:** Runs on port 5001 (test mode)
- **Frontend:** Vite dev server forced to port 5173 (matches backend CORS config)
- **Database:** PostgreSQL (`doof_test`, user: `naf`), configured in `.env.test`
- **Test runner:** [Vitest](https://vitest.dev/) (all tests migrated from Jest)
- **API base URL:** `http://localhost:5001/api/`

## Test Data & Cleanup

- Each test suite creates its own users, lists, restaurants, and other entities as needed
- Data is seeded at test start and deleted/rolled back after
- No shared global state between tests
- Authentication uses real flows (admin: `admin@example.com` / `doof123`)

## Testing Levels

### 1. API Contract & Backend Integration
- Health check, CRUD for users/restaurants/dishes/lists
- Auth endpoints (register, login, token refresh, role checks)
- Error handling and response validation

### 2. Frontend Service/API Integration
- Service layer calls (apiClient, serviceHelpers)
- Parameter and error handling (e.g., `createQueryParams`, `handleApiResponse`)
- CORS and port mismatch tests
- Quick add, bulk add, and offline mode flows

### 3. End-to-End (E2E) User Flows
- Full user journeys: login, create/list/follow, admin actions
- Bulk add with Google Places integration (real API)
- Offline mode: reconnection, sync, quick add retry
- UI-driven flows (via browser automation or direct API + UI checks)

## Coverage Summary

- **Authentication:** Registration, login, token, admin/user roles, error cases
- **CRUD:** Users, restaurants, dishes, lists (create, update, delete, search)
- **Bulk Add:** Google Places integration, ambiguous entry handling, ZIP/neighborhood lookup, validation
- **Quick Add:** Retry logic, offline storage, sync after reconnect
- **Offline Mode:** Simulated disconnect/reconnect, state sync, local storage
- **CORS/Port:** Ensures frontend and backend ports match (5173), CORS errors surfaced if not
- **Admin:** Admin-only endpoints, role-based access
- **Error Handling:** Invalid input, expired tokens, permission denied, 404/500s

## Notable Technical Standards

- **No mocks:** All API calls hit real endpoints. No MSW, Mirage, or similar allowed.
- **No mock data:** All test data is created via real API calls or DB seed scripts.
- **Test duration:**
  - Unit: ≤30 lines, pure logic only
  - Integration: ≤50 lines, real endpoints, ≤2s per test
  - E2E: ≤75 lines, full stack, ≤5s per test
- **Cleanup:** All tests must clean up test data and restore state

## Recent Improvements

- Unified service layer with standardized helpers (`handleApiResponse`, `validateId`)
- Consolidated axios fixes into `axios-fix.js`
- Refactored all service files for consistency and error handling
- Migrated all tests to Vitest; removed all Jest/mocks
- Test DB and backend health checks automated
- CORS/port mismatch detection and dev-server script

## Known Gaps & Next Steps

- Expand coverage for offline mode and quick add edge cases
- Add more admin and role-based tests
- Improve teardown for flaky DB state
- Add browser automation for full UI E2E flows (currently mostly API-driven)
- Continue to enforce "no mocks" policy and review for accidental mock usage

## References

- See `MULTI_COMM.md` for detailed multi-level test philosophy
- See `.env.test` for DB config
- Admin credentials: `admin@example.com` / `doof123`

---

_This document is updated as testing practices evolve. For questions or to propose changes, contact the core team._

- ✅ Create basic authentication endpoint tests
- 🔄 Debug and fix authentication issues
- 🔄 Implement token management and validation tests

### Phase 3: Core Feature Testing (Pending)

- 📝 Implement restaurant management tests
- 📝 Implement dish management tests
- 📝 Implement user profile tests
- 📝 Implement search functionality tests

### Phase 4: Advanced Feature Testing (Pending)

- 📝 Implement list management tests
- 📝 Implement hashtag functionality tests
- 📝 Implement engagement feature tests
- 📝 Implement location-based filtering tests

### Phase 5: Admin and Analytics Testing (Pending)

- 📝 Implement admin operation tests
- 📝 Implement analytics endpoint tests
- 📝 Implement trending data tests

## Known Issues and Next Steps

1. **Authentication Issues**:
   - Registration endpoint returns 500 error - Need to check server logs for details
   - Login endpoint returns 401 error - Need to verify correct credentials
   - Auth status endpoint doesn't return expected structure

2. **Database Connection**:
   - Need to ensure test database is properly configured and accessible

3. **Test User Creation**:
   - Need to implement a reliable way to create and manage test users

## Next Steps

1. Debug authentication issues by examining server logs
2. Create a database setup script for test data
3. Implement more robust error handling in tests
4. Expand test coverage to other endpoints

## Conclusion

This testing strategy provides a comprehensive approach to ensuring the quality and reliability of the Doof application. By following this structured approach, we can identify and fix issues early in the development process and ensure a high-quality user experience.
