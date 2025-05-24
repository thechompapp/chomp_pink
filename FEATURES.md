I. Major App Features to Prioritize for Functionality Verification:

Based on the project structure and the cleanup prompt you're working with, these are the core user-facing and backend-supporting functionalities that are likely critical. Ensuring these work is paramount before or alongside extensive cleanup.

User Authentication & Authorization:

Functionality: User registration, login, logout, session persistence, password handling (if applicable, e.g., reset), role-based access (regular user vs. admin).
Why Critical: Foundation of the application. Nothing else works correctly for logged-in users if this is broken. Admin panel access also depends on this.
Key Files Involved (Examples):
Frontend: src/pages/Login/index.jsx, src/pages/Register/index.jsx, src/stores/useAuthStore.js, src/services/authService.js, src/components/ProtectedRoute.jsx.
Backend: doof-backend/routes/auth.js, doof-backend/controllers/authController.js, doof-backend/models/userModel.js, doof-backend/middleware/auth.js.
Core List Management (CRUD Operations for Lists & List Items):

Functionality: Creating new lists, viewing lists (user's own and potentially public/followed lists), adding items (dishes/restaurants) to lists, removing items from lists, editing list details (name, description), deleting lists.
Why Critical: This is a primary purpose of the application.
Key Files Involved (Examples):
Frontend: src/pages/Lists/index.jsx, src/pages/Lists/ListDetail.jsx, src/pages/Lists/NewList.jsx, src/components/UI/ListPreviewCard.jsx, src/components/AddToListModal.jsx, src/services/listService.js, src/hooks/useListItems.js.
Backend: doof-backend/routes/lists.js, doof-backend/controllers/listController.js, doof-backend/models/listModel.js.
Content Discovery (Search & Basic Browsing):

Functionality: Searching for restaurants and dishes. Viewing basic search results. Viewing restaurant and dish detail pages.
Why Critical: Core to how users find content to add to lists.
Key Files Involved (Examples):
Frontend: src/pages/Home/index.jsx (if it has search), src/pages/Search/index.jsx, src/pages/RestaurantDetail/index.jsx, src/pages/DishDetail/index.jsx, src/components/UI/SearchBar.jsx, src/services/searchService.js, src/services/restaurantService.js, src/services/dishService.js.
Backend: doof-backend/routes/search.js, doof-backend/routes/restaurants.js, doof-backend/routes/dishes.js and their respective controllers/models.
Admin Panel - Core Data Management (at least for one entity):

Functionality: Ability for an admin to log in, access the admin panel, view, and perform basic CRUD operations on at least one key data type (e.g., Users or Submissions).
Why Critical: Essential for app maintenance, user support, and content moderation/approval. If all admin functions are broken, it's a major issue.
Key Files Involved (Examples):
Frontend: src/pages/AdminPanel/index.jsx, src/pages/AdminPanel/AdminTable.jsx, src/services/adminService.js.
Backend: doof-backend/routes/admin.js, doof-backend/controllers/adminController.js, and relevant models.
API Connectivity & Basic Error Handling:

Functionality: Ensuring the frontend can reliably communicate with the backend API for the features above. Basic client-side and server-side error messages for failures (e.g., "Could not load data," "Invalid input").
Why Critical: If the frontend and backend can't talk, or errors are silent/crash the app, no feature will work. The numerous Axios-fix files suggest this might be a sensitive area.
Key Files Involved (Examples):
Frontend: src/services/apiClient.js, error handling utilities in src/utils/, React Query setup in src/queryClient.js.
Backend: Core Express setup in doof-backend/server.js, error handling middleware, response handlers in doof-backend/utils/.
II. Systematic Approach to Work with the Developer to Fix Broken Features:

Given the state of flux, a structured, iterative approach is best.

Stabilize the Environment & Basic Connectivity (If Needed):

You & Developer: First, ensure both frontend and backend can start, connect to the database (for backend), and that basic API calls (e.g., a health check endpoint, or a simple unauthenticated GET) are working.
Focus: Resolve any fundamental Axios issues identified in the cleanup prompt (Category 2: Temporary Fix-Related Files) to ensure a stable communication layer. This might be a prerequisite for fixing anything else.
Prioritize Core Features for Fixing (Use the list above):

You: Based on the list, decide on the absolute most critical feature to tackle first (likely User Authentication).
Developer: Agrees on the priority.
Isolate and Diagnose the Feature:

You: Clearly define the broken user flow for the chosen feature. For example: "User attempts to register with valid email and password. Expected: successful registration and redirect. Actual: error message X / page crashes / nothing happens." Provide exact steps to reproduce.
Developer: Focuses solely on this one feature. Uses browser dev tools (network tab, console), backend logs, and debugging tools to trace the issue from frontend interaction to backend processing and back.
Collaborative Debugging Session (If Stuck):

You & Developer: If the developer is stuck, have a joint session. You can walk through the UI steps while the developer traces backend logs or debugs code in real-time. This helps bridge any communication gaps.
Fix and Unit/Integration Test:

Developer: Implements the fix. Writes targeted unit tests (for specific functions/modules) and/or integration tests (for the interaction between frontend services and backend controllers/models related to the fix) before claiming the feature is fixed. These tests should specifically cover the bug scenario.
Verification by You (Manual E2E):

You: Once the developer indicates a fix is ready (on a dev branch), you perform end-to-end manual testing of the entire user flow for that specific feature. Try valid inputs, invalid inputs, and edge cases you can think of.
Focus: Does it meet the "Expected" behavior defined in step 3? Are there any unintended side effects on other parts of this feature?
Iterate on the Feature Until Stable:

If bugs are found during your verification, provide clear, reproducible feedback to the developer.
The developer goes back to step 5.
Repeat until the single, prioritized feature is stable.
Move to the Next Prioritized Feature:

Once Feature 1 (e.g., Auth) is stable, move to Feature 2 (e.g., Core List Management).
Repeat steps 3-7.
Regression Testing (Ongoing):

You & Developer: As new features are fixed, periodically re-test previously fixed features to ensure no regressions have been introduced. This is where a growing automated E2E test suite (as per the other prompt) becomes invaluable.
Code Cleanup (Concurrent or Phased):

The codebase cleanup (removing obsolete files as per the Canvas prompt) can happen concurrently if the developer is comfortable and it doesn't destabilize ongoing fixes.
Alternatively, phase it: Stabilize a core set of features first, then do a focused cleanup sprint, then continue with more features/fixes.
Important: Any file removal during this fixing phase must be extremely cautious and double-verified not to impact the feature being worked on or already stabilized features.
Communication & Tools:

Issue Tracker: Use a simple issue tracker (even a shared document if nothing formal is set up) to list broken features, their priority, status, and steps to reproduce.
Version Control: All fixes must be done on separate branches and merged via Pull/Merge Requests, allowing for code review.
Clear Definitions of "Done": For each fix, "done" means: code implemented, unit/integration tests pass, and you have verified the E2E functionality.
This systematic, feature-by-feature approach, combined with clear communication and targeted testing, will be the most effective way to bring stability back to the application while working alongside the developer. Remember to tackle the most foundational features first.