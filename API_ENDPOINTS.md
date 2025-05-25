Here's a list of API endpoints and their descriptions:

/api/auth/register: Creates a new user account.
/api/auth/login: Authenticates an existing user.
/api/auth/logout: Logs out the currently authenticated user.
/api/auth/refresh-token: Obtains a new access token using a refresh token.
/api/auth/status: Gets the current authentication status of the user.
/api/restaurants: Retrieves a list of all restaurants.
/api/restaurants/:id: Retrieves details for a specific restaurant by its ID.
/api/dishes: Retrieves a list of all dishes.
/api/dishes/:id: Retrieves details for a specific dish by its ID.
/api/lists: Retrieves lists, with optional authentication.
/api/lists (POST): Creates a new list.
/api/lists/:id: Retrieves details for a specific list.
/api/lists/:id/items: Retrieves items for a specific list.
/api/lists/:id/preview-items: Retrieves preview items for a specific list.
/api/lists/:id (PUT): Updates an existing list.
/api/lists/:id (DELETE): Deletes a specific list.
/api/lists/:id/items (POST): Adds an item to a specific list.
/api/lists/:id/items/:listItemId: Removes an item from a specific list.
/api/lists/:id/toggle-follow: Toggles the follow status of a list for the authenticated user.
/api/users/profile/:identifier: Retrieves the profile of a user by their identifier.
/api/filters/:type: Retrieves filter options for a specified type.
/api/hashtags/top: Retrieves the top hashtags.
/api/search: Performs a search based on query parameters.
/api/places/autocomplete: Proxies requests to a places autocomplete service.
/api/places/details: Proxies requests to a places details service.
/api/places/proxy/autocomplete: An alternative path for proxying autocomplete requests.
/api/places/proxy/details: An alternative path for proxying details requests.
/api/submissions: Retrieves submissions for the authenticated user.
/api/submissions (POST): Creates a new submission.
/api/admin/submissions: Retrieves all submissions for admin users.
/api/admin/submissions/approve/:id: Approves a specific submission.
/api/admin/submissions/reject/:id: Rejects a specific submission.
/api/admin/submissions/:id: Retrieves a specific submission by its ID for admin users.
/api/admin/restaurants: Retrieves all restaurants for admin users.
/api/admin/restaurants/:id: Retrieves a specific restaurant by ID for admin users.
/api/admin/restaurants (POST): Creates a new restaurant (admin only).
/api/admin/restaurants/:id (PUT): Updates an existing restaurant (admin only).
/api/admin/restaurants/:id (DELETE): Deletes a restaurant (admin only).
/api/admin/dishes: Retrieves all dishes for admin users.
/api/admin/dishes/:id: Retrieves a specific dish by ID for admin users.
/api/admin/dishes (POST): Creates a new dish (admin only).
/api/admin/dishes/:id (PUT): Updates an existing dish (admin only).
/api/admin/dishes/:id (DELETE): Deletes a dish (admin only).
/api/admin/users: Retrieves all users for admin users.
/api/admin/users/:id: Retrieves a specific user by ID for admin users.
/api/admin/users/:id (PUT): Updates user information (admin only).
/api/admin/users/:id (DELETE): Deletes a user (admin only).
/api/admin/users/promote/:id: Promotes a user to a higher access level (admin only).
/api/admin/cities: Retrieves all cities for admin users.
/api/admin/cities (POST): Creates a new city (admin only).
/api/admin/cities/:id (PUT): Updates an existing city (admin only).
/api/admin/cities/:id (DELETE): Deletes a city (admin only).
/api/admin/neighborhoods: Retrieves all neighborhoods for admin users, with pagination and filtering.
/api/admin/neighborhoods (POST): Creates a new neighborhood (admin only).
/api/admin/neighborhoods/:id (PUT): Updates an existing neighborhood (admin only).
/api/admin/neighborhoods/:id (DELETE): Deletes a neighborhood (admin only).
/api/admin/neighborhoods/cities: Retrieves a list of cities for use in dropdowns in the admin neighborhoods section.
/api/admin/neighborhoods/:id: Retrieves a single neighborhood by ID for admin users.
/api/admin/hashtags: Retrieves all hashtags for admin users.
/api/admin/hashtags (POST): Creates a new hashtag (admin only).
/api/admin/hashtags/:id (PUT): Updates an existing hashtag (admin only).
/api/admin/hashtags/:id (DELETE): Deletes a hashtag (admin only).
/api/admin/restaurant_chains: Retrieves all restaurant chains for admin users.
/api/admin/restaurant_chains (POST): Creates a new restaurant chain (admin only).
/api/admin/restaurant_chains/:id (PUT): Updates an existing restaurant chain (admin only).
/api/admin/restaurant_chains/:id (DELETE): Deletes a restaurant chain (admin only).
/api/admin/system/status: Retrieves the system status for admin users.
/api/admin/system/logs: Retrieves system logs for admin users.
/api/admin/system/clear-cache: Clears the system cache (admin only).
/api/admin/cleanup/health: Provides a health check for the admin cleanup service, accessible without superuser privileges.
/api/engage: Logs user engagement data.
/api/trending/:type: Retrieves trending items based on type.
/api/neighborhoods: Retrieves all neighborhoods.
/api/neighborhoods/by-zipcode/:zipcode: Retrieves neighborhoods by zipcode.
/api/analytics/summary: Retrieves a summary of analytics data.
/api/analytics/engagement: Retrieves engagement analytics data.
/api/e2e/restaurants: Retrieves all restaurants for E2E testing.
/api/e2e/restaurants/:id: Retrieves a specific restaurant by ID for E2E testing.
/api/e2e/restaurants (POST): Creates a new restaurant for E2E testing.
/api/e2e/restaurants/:id (PUT): Updates a restaurant for E2E testing.
/api/e2e/restaurants/:id (DELETE): Deletes a restaurant for E2E testing.
/api/e2e/dishes: Retrieves all dishes for E2E testing.
/api/e2e/dishes/:id: Retrieves a specific dish by ID for E2E testing.
/api/e2e/dishes (POST): Creates a new dish for E2E testing.
/api/e2e/dishes/:id (PUT): Updates a dish for E2E testing.
/api/e2e/dishes/:id (DELETE): Deletes a dish for E2E testing.
/api/db-test: Tests the database connection.
/api/health: Provides a health check for the backend.
/api/metrics: Retrieves performance metrics (admin only).
/api/metrics/reset: Resets performance metrics (admin only).

# Comprehensive Application Summary for API Test Runner Configuration

This document provides a detailed overview of the Chomp/Doof application's components, focusing on aspects relevant to the `api-test-runner-fixed.html` and its interaction with the backend.

## 1. Core Setup & Environment

* **Backend API Server**:
    * Expected to run on: `http://localhost:5001`
    * Base API path: `/api` (e.g., `http://localhost:5001/api/auth/login`)
    * Source: `doof-backend/server.js` sets up Express routes.
* **Frontend Vite Dev Server (Main Application)**:
    * Runs on: `http://localhost:5173` (typical Vite port)
    * Proxies `/api` to `http://localhost:5001/api` via `vite.config.js`. This is for the main app, not the standalone test runner.
* **API Test Runner Server (`serve-test-runner.js`)**:
    * Runs on: `http://localhost:8080`
    * Serves: `public/api-test-runner-fixed.html` at its root (`http://localhost:8080/`).
    * Proxies: Requests from the test runner HTML made to `/api-proxy/...` are forwarded to the backend. For example, a fetch to `/api-proxy/api/auth/login` in the test runner HTML will be proxied by `serve-test-runner.js` to `http://localhost:5001/api/auth/login`.
    * Provides:
        * `/health` endpoint to check its own status and connectivity to the backend.
        * `/db-schema` endpoint to fetch database schema information (proxies to backend's `/api/db-test` and `/api-proxy/db-query`).

## 2. API Test Runner Internals

**File**: `public/api-test-runner-fixed.html`

* **Client-Side API Interaction**:
    * `PROXY_BASE_URL = '/api-proxy/api'`: All API calls within the tests (e.g., for auth, restaurants, dishes) are prefixed with this. This means a call to `/auth/register` in a test function becomes `/api-proxy/api/auth/register`.
    * `TEST_RUNNER_SERVER_BASE_URL = ''`: Used for calls directly to the test runner server itself (e.g., `/health`, `/db-schema`).
    * `apiRequest(endpoint, options)`: Helper function that prepends `PROXY_BASE_URL` to the relative `endpoint` and makes the `fetch` call.
    * `handleApiResponse(response, context)`: Processes the `fetch` response, parses JSON, and handles errors. It returns an object like `{ status, statusText, responseBody, rawResponseText }`.
* **Test Definitions (`tests` array)**:
    * Each test object has `id`, `name`, `description`, and a `run` async function.
    * The `run` function:
        * Makes API calls using `apiRequest`.
        * Processes responses using `handleApiResponse`.
        * Stores/retrieves shared data using `window.testData`.
        * Returns an object like `{ message, status (HTTP status), data (parsed response body) }` on success.
        * Throws an error on failure, which is caught by `runTest`. The error object may have `status`, `responseBody`, etc., attached by `handleApiResponse`.
* **Shared Data Between Tests (`window.testData`)**:
    * Initialized as:
        ```javascript
        window.testData = {
          auth: { token: null, user: null },
          userData: null, // Stores { email, password, name } from registration
          restaurant: null, // Stores created restaurant object { id, ... }
          dish: null // Stores created dish object { id, ... }
        };
        ```
    * **User Registration Test**: Stores `userData` (credentials) and `auth` (token, user object) in `window.testData`.
    * **User Login Test**: Uses `window.testData.userData` for credentials and updates `window.testData.auth` with the new token/user.
    * **Authenticated Tests**: Retrieve `window.testData.auth.token` to set the `Authorization: Bearer <token>` header.
    * **Create Restaurant Test**: Stores the created restaurant object (containing its ID) in `window.testData.restaurant`.
    * **Create Dish Test**: Retrieves `window.testData.restaurant.id` to associate the dish with the restaurant and stores the created dish in `window.testData.dish`.
* **UI Logging**:
    * `updateTestItem(id, status, details)`: Updates the UI for each test.
        * `status`: 'passed' or 'failed'.
        * `details`: An object containing `message`, HTTP `status`, `data` (parsed response body), and `stack` (for errors).
        * Displays HTTP status and the full response body in the "details" section of each test.

## 3. Backend API Endpoints & Corresponding Code

The backend uses Express. Routes are typically defined in `doof-backend/routes/` and use controllers from `doof-backend/controllers/` which in turn use models from `doof-backend/models/`.

**Base Path for all backend APIs**: `/api` (e.g., `http://localhost:5001/api`)

### 3.1. Health Check

* **Endpoint**: `GET /api/health`
* **Purpose**: Basic backend health check.
* **Backend Route File**: `doof-backend/server.js` (directly defined)
    ```javascript
    app.get('/api/health', (req, res) => {
      // ... checks DB connection ...
      res.json({ status: 'UP', message: 'Backend is healthy', dbTime: result.rows[0].now });
    });
    ```
* **Test Runner Path**: The test runner server (`serve-test-runner.js`) has its own `/health` endpoint which internally calls the backend's `/api/health`. The `api-test-runner-fixed.html` calls `/health` on the test runner server.

### 3.2. Authentication Endpoints

* **Backend Route File**: `doof-backend/routes/auth.js`
* **Backend Controller**: `doof-backend/controllers/authController.js`
* **Backend Model**: `doof-backend/models/userModel.js` (for user creation, finding)

* **Register User**:
    * **Endpoint**: `POST /api/auth/register`
    * **Controller Function**: `authController.register`
    * **Model Functions**: `userModel.createUser`, `userModel.findByEmail`
    * **Test Runner Path**: `/auth/register` (proxied to `/api-proxy/api/auth/register`)
* **Login User**:
    * **Endpoint**: `POST /api/auth/login`
    * **Controller Function**: `authController.login`
    * **Model Functions**: `userModel.findByEmail`
    * **Test Runner Path**: `/auth/login`
* **Logout User**:
    * **Endpoint**: `POST /api/auth/logout`
    * **Controller Function**: `authController.logout` (primarily clears cookie if session-based, or could invalidate token if using a denylist)
    * **Test Runner Path**: `/auth/logout`
* **Authentication Status**:
    * **Endpoint**: `GET /api/auth/status` (also seen as `/api/auth/me` in some frontend services)
    * **Middleware**: `authMiddleware` (from `doof-backend/middleware/auth.js`) to verify token.
    * **Controller Function**: `authController.getStatus` or `authController.getMe`
    * **Test Runner Path**: `/auth/status`
* **Refresh Token**:
    * **Endpoint**: `POST /api/auth/refresh-token`
    * **Controller Function**: `authController.refreshToken`
* **Forgot/Reset Password, Verify Email**:
    * Endpoints: `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/verify-email`
    * Controller Functions: `authController.forgotPassword`, `authController.resetPassword`, `authController.verifyEmail`

### 3.3. E2E Testing Endpoints (used by Test Runner)

These endpoints seem to be specifically for testing or simplified CRUD, often bypassing complex business logic. The test runner uses `/api/e2e/...` for creating restaurants and dishes.

* **Backend Route File**: `doof-backend/routes/simplified-routes.js` (likely, or a dedicated E2E route file if it exists). The `API_TEST_RUNNER_HANDOFF.md` mentions `/api/e2e/restaurants` and `/api/e2e/dishes`.
* **Backend Controllers**:
    * `doof-backend/controllers/simplified-restaurantController.js`
    * `doof-backend/controllers/simplified-dishController.js`
* **Backend Models**:
    * `doof-backend/models/simplified-restaurantModel.js`
    * `doof-backend/models/simplified-dishModel.js`

* **Create Restaurant (E2E)**:
    * **Endpoint**: `POST /api/e2e/restaurants`
    * **Controller**: `simplifiedRestaurantController.createRestaurant`
    * **Test Runner Path**: `/e2e/restaurants`
* **Get Restaurants (E2E)**:
    * **Endpoint**: `GET /api/e2e/restaurants`
    * **Controller**: `simplifiedRestaurantController.getRestaurants`
    * **Test Runner Path**: `/e2e/restaurants`
* **Create Dish (E2E)**:
    * **Endpoint**: `POST /api/e2e/dishes`
    * **Controller**: `simplifiedDishController.createDish`
    * **Test Runner Path**: `/e2e/dishes`
* **Get Dishes (E2E)**:
    * **Endpoint**: `GET /api/e2e/dishes`
    * **Controller**: `simplifiedDishController.getDishes`
    * **Test Runner Path**: `/e2e/dishes`

### 3.4. Standard CRUD Endpoints (Main Application)

These are the primary endpoints the main frontend application would use. The test runner might not hit all of these, but they are part of the overall API surface.

* **Restaurants**:
    * **Route File**: `doof-backend/routes/restaurants.js`
    * **Controller**: `doof-backend/controllers/restaurantController.js`
    * **Model**: `doof-backend/models/restaurantModel.js`
    * **Common Paths**: `GET /api/restaurants`, `GET /api/restaurants/:id`, `POST /api/restaurants`, `PUT /api/restaurants/:id`, `DELETE /api/restaurants/:id`
* **Dishes**:
    * **Route File**: `doof-backend/routes/dishes.js`
    * **Controller**: `doof-backend/controllers/dishController.js`
    * **Model**: `doof-backend/models/dishModel.js`
    * **Common Paths**: `GET /api/dishes`, `GET /api/dishes/:id`, `POST /api/dishes`, `PUT /api/dishes/:id`, `DELETE /api/dishes/:id`, `GET /api/restaurants/:restaurantId/dishes`
* **Lists**:
    * **Route File**: `doof-backend/routes/lists.js`
    * **Controller**: `doof-backend/controllers/listController.js`
    * **Model**: `doof-backend/models/listModel.js`
* **Users, Search, Submissions, Places, Neighborhoods, Hashtags, Filters, Engage, Analytics, Admin**: Each has corresponding route, controller, and model files in the `doof-backend` directory.

### 3.5. Database Schema & Query Endpoints (for Test Runner Server)

* **`serve-test-runner.js` Endpoint**: `GET /db-schema`
    * Internally calls backend: `GET /api/db-test` (seems to be a health/connectivity check for DB) and then `POST /api-proxy/db-query` to fetch table and column information.
    * The backend endpoint `/api-proxy/db-query` (which is actually `/api/db-query` on the backend itself, proxied) likely executes raw SQL. This is generally risky and should be secured.
* **`serve-test-runner.js` Endpoint**: `POST /db-query`
    * Proxies to backend's `/api-proxy/db-query` (i.e., `http://localhost:5001/api/db-query`).

## 4. Frontend Services & API Client (`src/`)

* **`src/config/api.js` or `src/config.js`**:
    * Defines `API_BASE_URL` (e.g., `http://localhost:5001/api` or `/api` for Vite proxy).
    * The test runner (`api-test-runner-fixed.html`) does *not* use this directly; it has its own `PROXY_BASE_URL`.
* **`src/services/apiClient.js` (also referred to as `apiUtils.js`)**:
    * Creates an Axios instance.
    * **Base URL**: Configured using `getApiBaseUrl()`, which typically points to `http://localhost:5001/api` or `/api` (for Vite proxy).
    * **Interceptor Setup**:
        * Calls `setupAuthInterceptors(apiClient)` from `authService.js` *after* the Axios instance is created and patched. This is crucial for avoiding circular dependencies.
        * The `setupAuthInterceptors` function adds request interceptors (to attach Bearer token) and response interceptors (to handle 401 errors and attempt token refresh).
    * **Methods**: Provides `get`, `post`, `put`, `patch`, `delete` methods that wrap Axios calls. These methods use `performRequestWithRetry`.
    * **Error Handling**: Uses `ErrorHandler` and includes retry logic.
    * **Caching**: Uses `CacheManager`.
    * **Offline Mode**: `isOfflineMode`, `setOfflineMode`.
    * **Axios Fixes**: Includes `patchGlobalAxios`, `patchAxiosInstance`, `applyXhrFixes`, and `customAdapter` to address potential Axios issues.
* **`src/services/authService.js`**:
    * Uses the `apiClient` (imported from `@/services/apiClient`) to make calls to `/auth/*` endpoints.
    * Functions: `login`, `register`, `logout`, `refreshToken`, `getCurrentUser`, `requestPasswordReset`, `resetPassword`, `verifyEmail`.
    * Manages tokens in `localStorage` (`token`, `refreshToken`).
    * Exports `setupAuthInterceptors(axiosInstance)` which is called by `apiClient.js`.
* **Other Services** (e.g., `restaurantService.js`, `dishService.js`, `listService.js`):
    * Import and use `apiClient` from `@/services/apiClient` to interact with their respective backend API endpoints (e.g., `/restaurants`, `/dishes`).

## 5. Frontend Components and Hooks (React)

While the API test runner is plain HTML/JS, understanding how the main React app consumes these services provides context.

* **State Management**:
    * `src/stores/useAuthStore.js`: Zustand store for authentication state (user, token, isAuthenticated). Likely interacts with `authService.js`.
    * Other stores for different features (e.g., `useUserListStore`, `useSubmissionStore`).
* **React Query**:
    * `src/queryClient.js`: Sets up `QueryClient`.
    * Services often use `useQuery` and `useMutation` (or wrappers around them) for data fetching and updates, which internally use the `apiClient`.
* **Components/Pages**:
    * Pages in `src/pages/` (e.g., `Login`, `Register`, `RestaurantDetail`) use hooks or directly call service functions to interact with the API.
    * Example: `src/pages/Login/index.jsx` would call `authService.login`.
* **Hooks**:
    * Custom hooks in `src/hooks/` might encapsulate API logic (e.g., `useSearch`, `useListItems`).
    * `useApiErrorHandler` for handling API errors globally or locally.

## 6. Key Configuration for API Test Runner Success

1.  **`serve-test-runner.js` (Port 8080)**:
    * Must be running (`node serve-test-runner.js`).
    * `BACKEND_URL` inside it must correctly point to the backend (default `http://localhost:5001`).
    * Its proxy for `/api-proxy` must correctly strip `/api-proxy` and forward the rest of the path to `BACKEND_URL`. (e.g., `/api-proxy/api/auth/login` -> `http://localhost:5001/api/auth/login`).
2.  **`public/api-test-runner-fixed.html` (Served by `serve-test-runner.js`)**:
    * `PROXY_BASE_URL` must be `/api-proxy/api`.
    * `TEST_RUNNER_SERVER_BASE_URL` should be `''` (empty string for relative paths to the server it's hosted on, i.e., `http://localhost:8080`).
    * All API endpoints within the `tests` array must be relative to `PROXY_BASE_URL` (e.g., `/auth/register`, `/e2e/restaurants`).
3.  **Backend Server (Port 5001)**:
    * Must be running.
    * Must have all the routes (`/api/auth/*`, `/api/e2e/*`, `/api/health`, `/api/db-test`, `/api/db-query`) correctly defined and functional.
    * Database must be accessible and schema must match what controllers/models expect.
    * CORS should ideally be configured on the backend to allow requests from `http://localhost:8080` (though the proxy in `serve-test-runner.js` mitigates direct browser CORS issues).
4.  **Data Propagation (`window.testData`)**:
    * Ensure each test correctly saves necessary data (like tokens, IDs) to `window.testData`.
    * Ensure subsequent tests correctly retrieve and use this data. Pay close attention to the structure of the data being stored and retrieved (e.g., `window.testData.restaurant.id` vs `window.testData.restaurant.restaurant.id`). This depends on the exact structure of the API responses from the E2E endpoints.

By reviewing these areas, the developer should be able to pinpoint configuration issues or discrepancies in how the API test runner expects to interact with the backend versus how the backend is actually set up. The most common issues are incorrect paths, proxy misconfigurations, or problems with how authentication tokens or entity IDs are passed between tests.
I hope this detailed summary helps the developer correctly configure and debug the API test runner. Let me know if you need specific parts elaborated further!