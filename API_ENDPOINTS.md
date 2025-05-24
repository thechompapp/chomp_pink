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