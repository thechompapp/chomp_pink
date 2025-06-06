Prompt: Developing a Multi-Level Communication Testing Suite for Chomp/Doof
Objective: Create a comprehensive testing suite for the "Chomp/Doof" application to rigorously verify the communication and data integrity across all layers: frontend UI interactions, frontend service calls to the backend API, backend API request handling, backend business logic, and database interactions. This suite must use real API calls against a dedicated test environment and ensure that every part of the application (services, hooks, controllers, UI elements, etc., as will be detailed in the "Project Handoff Summary") is functioning and interconnected correctly. Strictly avoid mocking for core API interactions and business logic validation.

Prerequisite Document: This testing suite development will heavily rely on the detailed information generated by the "Refined Prompt: Generating a Comprehensive Project Handoff Summary" (ID: chomp_doof_refined_project_summary_prompt). Specifically, the generated:
* Comprehensive API Documentation (Section 6)
* Software Architecture & Flow Diagrams (Section 9)
* Program Flow Mapping & Unused Code Identification (Section 10)

Target Audience: A developer or QA engineer tasked with creating this testing suite.

Core Requirements for the Testing Suite:

Multi-Level Testing Strategy:

Level 1: API Contract & Backend Integration Tests (Backend Focused):

Goal: Verify that each backend API endpoint (as defined in the API Documentation from the Project Summary) behaves correctly in isolation and in integration with the database.

Method: Use a testing framework (e.g., Jest, Vitest, or Supertest for Node.js) to make direct HTTP requests to each backend API endpoint deployed in a test environment.

Assertions:

Correct HTTP status codes for valid and invalid requests (2xx, 4xx, 5xx).

Accurate response payloads (structure and data types) for successful requests, matching the API documentation.

Correct error messages and structures for failed requests.

Data persistence and correctness in the test database after CRUD operations.

Proper handling of authentication and authorization (e.g., JWT validation, role-based access control for admin routes).

Level 2: Frontend Service - API Integration Tests (Frontend Focused):

Goal: Verify that frontend services (e.g., in src/services/) correctly call backend API endpoints and handle responses (data and errors).

Method: Write tests (e.g., using Vitest) that invoke functions within your frontend service modules (e.g., authService.login(), listService.createList()). These service functions should make real calls to the test backend via the configured apiClient.js.

Assertions:

Correct API endpoint is called with the correct method, headers (including auth tokens), and payload.

Successful API responses are correctly processed and returned by the service function.

API error responses are caught and handled appropriately by the service function (e.g., transforming error messages, returning specific error objects).

Level 3: End-to-End (E2E) User Flow Tests (UI Focused):

Goal: Verify complete user workflows from UI interaction through the frontend, backend API, database, and back to UI updates.

Method: Use an E2E testing framework (e.g., Playwright, Cypress, or Vitest with appropriate browser environment setup and React Testing Library for interactions) to simulate user actions on the deployed frontend (pointing to the test backend).

Assertions:

UI elements are present and interactive.

User actions trigger the correct frontend logic (hooks, state updates in stores like useAuthStore).

Correct API calls are made as a result of UI interactions (can be spied on if necessary, but primary validation is the end result).

Data created/updated via UI is correctly persisted in the backend/database (can be verified via subsequent UI actions or direct API calls within the test if needed for setup/teardown).

UI reflects changes from backend operations accurately (e.g., new list appears, item is removed, profile updates).

Navigation and conditional rendering based on application state (e.g., auth status) work as expected.

Test Environment & Data Management:

All tests must run against a dedicated, isolated test environment (separate frontend deployment, backend deployment, and PostgreSQL database).

The test database must be seeded with a consistent, representative dataset before test runs, or tests must be responsible for creating their own prerequisite data in a controlled manner.

Tests must be idempotent: they should be runnable multiple times without altering the outcome of subsequent runs. This means:

Data Cleanup: Tests that create/modify data must clean up after themselves (e.g., delete a user created during a registration test, remove a list created). Use afterEach or afterAll hooks.

Unique Identifiers: Use unique identifiers (e.g., timestamps, UUIDs combined with a test run ID) for data created during tests to avoid collisions if parallel testing or interrupted runs occur.

Comprehensive Coverage (Leverage Project Summary):

Refer to the "Major Features Completed" (Section 4) and "Program Flow Mapping" (Section 10) from the Project Summary to ensure all critical user flows and functionalities are covered.

Prioritize tests for:

User Authentication & Authorization (all roles).

Full CRUD operations for all major entities (Lists, List Items, Restaurants, Dishes, User Profiles, Submissions).

Search and Filtering functionality with various parameter combinations.

Admin Panel operations (viewing data, CRUD on entities, analytics if testable).

Bulk Add feature.

Key interactions involving state management (Zustand stores, React Contexts).

Validation & Assertions:

Data Integrity: Verify that data passed from frontend to backend is stored correctly and that data retrieved from the backend is displayed correctly in the frontend.

Business Logic: Ensure backend business rules are enforced (e.g., validation logic in controllers/models).

State Consistency: In E2E tests, verify that frontend state (Zustand stores, React Query cache) is updated correctly in response to API calls and user actions.

Error Handling: Test for graceful error handling at all levels – API errors, network errors, frontend processing errors. Ensure user-facing error messages are appropriate.

Test Structure & Maintainability:

Organize test files logically, mirroring the application structure (e.g., auth.api.test.js, lists.service.test.js, user-registration.e2e.test.js).

Use descriptive names for test suites and individual test cases.

Follow established coding standards and linting rules for the project.

Write helper functions for common test setups or assertions to keep tests DRY.

Specific Scenarios to Test (Examples - Expand based on the full Project Summary):

User Registration & Login Flow (E2E):

Navigate to registration page.

Fill and submit registration form with unique, valid data.

API Check (Level 1/2): Verify POST /api/auth/register was called and successful; new user in DB.

Verify redirection to login or dashboard.

Perform login with the new credentials.

API Check (Level 1/2): Verify POST /api/auth/login was called, JWT returned.

Verify dashboard access and correct user information displayed.

Perform logout.

Verify session termination and redirection.

Creating a List and Adding an Item (E2E):

Login as a test user.

Navigate to "Create List" page/modal.

Enter list details and submit.

API Check (Level 1/2): Verify POST /api/lists was successful; list in DB.

Verify new list appears in UI.

Navigate to the new list's detail page.

Find a dish/restaurant (e.g., via search or a known item).

Add the item to the list with notes.

API Check (Level 1/2): Verify POST /api/lists/:listId/items was successful; item association in DB.

Verify item appears in the list UI with correct notes.

Admin Approving a Submission (E2E & API):

Setup (API/DB): Ensure a 'pending' submission exists for a test dish.

Login as an admin user.

Navigate to the Admin Panel -> Submissions tab.

Find the pending submission.

Click "Approve."

API Check (Level 1/2): Verify PUT /api/submissions/:submissionId/approve was successful.

Verify submission status is 'approved' in DB and (if UI updates) in Admin Panel.

Verify the new dish now exists in the public dishes table/API (GET /api/dishes/:newDishId).

Deliverables:

A suite of automated tests covering API contract, frontend service integration, and end-to-end user flows.

Clear documentation on how to set up the test environment and run the tests.

Tests integrated into the CI/CD pipeline to run automatically on code changes.

This comprehensive testing approach will ensure that all levels of "talking" within the Chomp/Doof application are robust, reliable, and function as intended, providing high confidence in code quality and stability.