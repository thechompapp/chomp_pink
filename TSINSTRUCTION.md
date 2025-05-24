Objective: Create a robust, end-to-end (E2E) testing suite for the Chomp/Doof application that validates all critical user flows and API integrations using real API calls against a dedicated test environment populated with representative (but non-production) data. The primary goal is to ensure application stability, identify regressions early, verify correct data handling, and confirm adherence to coding and API protocols. Mocking should be strictly avoided for core API interactions and business logic validation.

Testing Framework: Utilize the established testing framework (Vitest, as per vitest.internal.config.js) and React Testing Library for frontend component interactions where necessary to trigger user flows. For direct API testing or backend-focused integration tests, a suitable Node.js testing framework (like Jest or Vitest if configured for backend) should be used, making actual HTTP requests to the backend.

Guiding Principles:

Real Data, Real APIs: All tests must interact with a live (test environment) backend. No mocking of API responses for validating core CRUD operations or business logic.

User-Centric Scenarios: Tests should simulate actual user journeys through the application.

Comprehensive Coverage: Aim to cover all major features and functionalities outlined in the project summary (document chomp_doof_project_summary).

Data Integrity: Verify that data is correctly created, read, updated, and deleted through API interactions and reflected accurately in the UI.

Error Handling & Validation: Test for expected error responses from the API (e.g., 400 for bad input, 401 for unauthorized, 404 for not found) and ensure the frontend handles these gracefully. Verify input validation on both frontend and backend.

Idempotency & Cleanup: Design tests to be runnable multiple times without negative side effects. This means:

Tests that create data should also clean up that data (e.g., delete a user created for a test).

Use unique identifiers for test data to avoid collisions.

Clarity and Maintainability: Write clear, well-documented tests that are easy to understand and maintain.

Efficiency: While comprehensive, strive for efficient tests. Avoid unnecessary UI interactions if an API call can directly set up a state or verify an outcome more effectively for certain integration points.

Specific Test Areas and Scenarios (Examples - Expand based on full feature set):

I. User Authentication & Authorization (Frontend & Backend Integration)

Test Case 1.1: Successful User Registration

Action: Programmatically (via UI interaction or direct API call if testing backend route directly) attempt to register a new unique user using POST /api/auth/register with valid data (e.g., email, password, username).

Expected:

Backend: User is created in the database. API returns a success response (e.g., 201 Created) and user details/token.

Frontend: User is redirected to the login page or dashboard, and authentication state (useAuthStore) is updated.

Test Case 1.2: User Registration - Duplicate Email/Username

Action: Attempt to register with an email/username that already exists.

Expected: API returns an appropriate error (e.g., 409 Conflict or 400 Bad Request) with a clear message. Frontend displays this error.

Test Case 1.3: Successful User Login

Action: Log in with valid credentials of a pre-existing test user using POST /api/auth/login.

Expected: API returns a JWT. Frontend stores the token, updates auth state, and navigates to the dashboard/home page.

Test Case 1.4: User Login - Invalid Credentials

Action: Attempt login with incorrect password or non-existent email.

Expected: API returns a 401 Unauthorized (or similar) error. Frontend displays an appropriate error message.

Test Case 1.5: Accessing Protected Routes (Frontend & Backend)

Setup: Ensure a user is logged out.

Action: Attempt to navigate to a protected frontend route (e.g., /profile, /lists). Attempt to make an API call to a protected backend endpoint (e.g., GET /api/users/me without a token, or POST /api/lists).

Expected:

Frontend: User is redirected to the login page.

Backend: API returns a 401 Unauthorized error.

Test Case 1.6: Admin User Access to Admin Panel

Setup: Log in as a pre-existing admin user.

Action: Navigate to the Admin Panel (/admin). Attempt to fetch admin-specific data (e.g., GET /api/admin/data/users).

Expected: Admin Panel loads successfully. API returns data.

Test Case 1.7: Non-Admin User Denied Access to Admin Panel/Routes

Setup: Log in as a pre-existing non-admin user.

Action: Attempt to navigate to /admin. Attempt to call an admin API endpoint (e.g., GET /api/admin/data/users).

Expected: Frontend redirects or shows an error. Backend API returns 403 Forbidden or 401 Unauthorized.

II. List Management (Full CRUD Cycle)

Test Case 2.1: Create a New List

Setup: Authenticated user.

Action: User creates a new list (e.g., "My Test Wishlist") via UI or direct POST /api/lists call with name, description.

Expected: List appears in the user's list of lists (GET /api/lists or GET /api/users/:userId/lists). API returns 201 Created with list details.

Test Case 2.2: View List Details

Setup: A list created in a previous step or a known test list.

Action: Fetch list details using GET /api/lists/:listId.

Expected: API returns correct list details (name, description, items if any).

Test Case 2.3: Add Items (Dishes/Restaurants) to a List

Setup: Authenticated user, existing list, existing dish/restaurant IDs.

Action: Add a dish to the list using POST /api/lists/:listId/items with payload like { itemId: 'dish_id_123', itemType: 'dish', notes: 'Heard good things!' }.

Expected: Item is associated with the list. GET /api/lists/:listId/items reflects the new item.

Test Case 2.4: Update List Details

Setup: Authenticated user, existing list.

Action: Update the list's name/description using PUT /api/lists/:listId.

Expected: API returns 200 OK. Subsequent GET /api/lists/:listId shows updated details.

Test Case 2.5: Remove Item from List

Setup: Authenticated user, list with an item.

Action: Remove an item using DELETE /api/lists/:listId/items/:itemId.

Expected: Item is disassociated. GET /api/lists/:listId/items no longer shows the item.

Test Case 2.6: Delete a List

Setup: Authenticated user, existing list (preferably created by this test run).

Action: Delete the list using DELETE /api/lists/:listId.

Expected: API returns 200 OK or 204 No Content. List no longer appears in user's lists. Associated list items (junction table entries) are cleaned up.

III. Search and Filtering

Test Case 3.1: Global Search for Restaurant

Action: Perform a search for a known restaurant name using GET /api/search?query=[restaurant_name].

Expected: API returns results including the target restaurant.

Test Case 3.2: Global Search for Dish

Action: Perform a search for a known dish name using GET /api/search?query=[dish_name].

Expected: API returns results including the target dish.

Test Case 3.3: Filter Restaurants by Cuisine

Action: Fetch restaurants applying a cuisine filter, e.g., GET /api/restaurants?cuisine=Italian.

Expected: API returns only restaurants matching the "Italian" cuisine.

Test Case 3.4: Filter Dishes by Neighborhood and Price Range (if applicable)

Action: Fetch dishes applying multiple filters, e.g., GET /api/dishes?neighborhood=[neighborhood_id]&priceRange=$$.

Expected: API returns dishes matching all specified criteria.

Test Case 3.5: Autocomplete Search

Action: Call GET /api/search/autocomplete?query=[partial_query].

Expected: API returns relevant suggestions.

IV. Content Viewing (Restaurants & Dishes)

Test Case 4.1: View Restaurant Details

Action: Fetch details for a known restaurant ID using GET /api/restaurants/:restaurantId.

Expected: API returns comprehensive details (name, address, dishes, etc.).

Test Case 4.2: View Dish Details

Action: Fetch details for a known dish ID using GET /api/dishes/:dishId.

Expected: API returns comprehensive details (name, description, restaurant it belongs to, etc.).

V. Submissions

Test Case 5.1: User Submits a New Dish

Setup: Authenticated user.

Action: Submit a new dish proposal via POST /api/submissions with relevant dish data.

Expected: API returns 201 Created. A new submission record is created in the database with a 'pending' status.

Test Case 5.2: Admin Approves a Submission

Setup: Authenticated admin user, existing pending submission.

Action: Admin approves the submission using PUT /api/submissions/:submissionId/approve.

Expected: Submission status changes to 'approved'. The corresponding dish/restaurant is created in the main tables.

Test Case 5.3: Admin Rejects a Submission

Setup: Authenticated admin user, existing pending submission.

Action: Admin rejects the submission using PUT /api/submissions/:submissionId/reject.

Expected: Submission status changes to 'rejected'. No new dish/restaurant is created.

VI. Bulk Add Operations

Test Case 6.1: Bulk Add Multiple Dishes to a New List

Setup: Authenticated user.

Action: Use the Bulk Add feature UI flow (or simulate its API calls if targeting backend directly) to input several dish names, associate them with restaurants (potentially new or existing), and add them to a newly created list. This will involve calls like POST /api/lists then multiple POST /api/lists/:listId/items or a dedicated bulk endpoint if it exists.

Expected: New list is created. All specified dishes are correctly associated with their restaurants and added to the list. Verify counts and details.

VII. Admin Panel CRUD Operations (for each manageable entity: Users, Restaurants, Dishes, Neighborhoods, etc.)

Example for Users (repeat pattern for other entities):

Test Case 7.1.1: Admin Views Users

Action: GET /api/admin/data/users.

Expected: Paginated list of users returned.

Test Case 7.1.2: Admin Creates a New User

Action: POST /api/admin/data/users with user details.

Expected: User created, success response.

Test Case 7.1.3: Admin Updates an Existing User

Action: PUT /api/admin/data/users/:id with updated details.

Expected: User details updated, success response.

Test Case 7.1.4: Admin Deletes a User

Action: DELETE /api/admin/data/users/:id.

Expected: User deleted, success response.

VIII. API Protocol and Error Handling

For each endpoint:

Verify correct HTTP status codes for success (200, 201, 204).

Verify correct HTTP status codes for client errors (400, 401, 403, 404, 409).

Verify consistent error response structure (e.g., { "error": "message" }).

Test with invalid/missing parameters to ensure robust input validation.

Test with malformed JWTs or tokens for different users to check authorization logic.

Test Environment Setup:

A dedicated test database, seeded with a known, consistent dataset. This dataset should include:

Regular users and admin users.

A variety of restaurants, dishes, cuisines, and neighborhoods.

Pre-existing lists with items.

Pending submissions.

The backend API should be running and accessible.

Frontend should be configured to point to this test backend API.

Credentials for test users (regular and admin) must be available to the test suite.

Execution and Reporting:

Tests should be runnable via an npm script (e.g., npm run test:e2e).

Test results should clearly indicate passes, failures, and reasons for failure.

Integrate these tests into the CI/CD pipeline to run automatically on new commits/PRs.

Coding Protocol for Tests:

Follow existing project linting and formatting rules (ESLint, Prettier).

Use descriptive names for test files, suites (describe blocks), and individual tests (it or test blocks).

Organize test files logically, mirroring the application structure where appropriate (e.g., auth.e2e.test.js, lists.e2e.test.js).

Ensure proper setup (beforeEach, beforeAll) and teardown (afterEach, afterAll) for tests, especially for managing test data and authentication states.

By following these guidelines, the developer will create a testing suite that thoroughly validates the Chomp/Doof application, ensuring its reliability and adherence to quality standards.