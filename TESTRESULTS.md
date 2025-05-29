
> chomp-clean@0.0.0 test
> dotenv -e .env.test -- vitest --config vitest.real.config.js --run --reporter verbose


 RUN  v3.1.4 /Users/naf/Downloads/doof

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should successfully register a user and auto-login
[INFO][2025-05-27T23:45:26.817Z] [RegistrationStore register] Attempting registration with userData: {
  email: [32m'test@example.com'[39m,
  password: [32m'password123'[39m,
  username: [32m'testuser'[39m
}

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should successfully register a user and auto-login
[INFO][2025-05-27T23:45:26.821Z] [RegistrationStore register] Registration successful

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should not auto-login if autoLogin is false
[INFO][2025-05-27T23:45:26.826Z] [RegistrationStore register] Attempting registration with userData: {
  email: [32m'test@example.com'[39m,
  password: [32m'password123'[39m,
  username: [32m'testuser'[39m,
  autoLogin: [33mfalse[39m
}

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should not auto-login if autoLogin is false
[INFO][2025-05-27T23:45:26.827Z] [RegistrationStore register] Registration successful

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should handle registration failure
[INFO][2025-05-27T23:45:26.830Z] [RegistrationStore register] Attempting registration with userData: { email: [32m'existing@example.com'[39m, password: [32m'password123'[39m }

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should handle API errors during registration
[INFO][2025-05-27T23:45:26.853Z] [RegistrationStore register] Attempting registration with userData: { email: [32m'test@example.com'[39m, password: [32m'password123'[39m }

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > startEmailVerification > should successfully start email verification
[INFO][2025-05-27T23:45:26.859Z] [RegistrationStore startEmailVerification] Email verification initiated

stdout | tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > completeEmailVerification > should successfully complete email verification
[INFO][2025-05-27T23:45:26.862Z] [RegistrationStore completeEmailVerification] Email verification completed

 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should successfully register a user and auto-login 15ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should not auto-login if autoLogin is false 2ms
 × tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should handle registration failure 24ms
   → Cannot read properties of undefined (reading 'message')
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > register > should handle API errors during registration 7ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > startEmailVerification > should successfully start email verification 2ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > startEmailVerification > should handle API errors during email verification start 1ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > completeEmailVerification > should successfully complete email verification 1ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > completeEmailVerification > should handle API errors during email verification completion 6ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > checkUsernameAvailability > should return true when username is available 4ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > checkUsernameAvailability > should return false when username is not available 7ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > checkUsernameAvailability > should handle API errors during username availability check 4ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > checkEmailAvailability > should return true when email is available 3ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > checkEmailAvailability > should return false when email is not available 6ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > updateRegistrationData > should update registration data 3ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > setRegistrationStep > should set registration step 6ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > resetRegistration > should reset registration state 2ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > getters > should return registration step 2ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > getters > should return registration data 1ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > getters > should return loading state 0ms
 ✓ tests/unit/stores/auth/useRegistrationStore.test.js > useRegistrationStore > getters > should return error 0ms
stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when user logs in
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore login] Attempting login with formData: { email: [32m'test@example.com'[39m, password: [32m'password123'[39m }

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when user logs in
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore login] Response.data: {
  success: [33mtrue[39m,
  data: {
    id: [33m1[39m,
    username: [32m'testuser'[39m,
    email: [32m'test@example.com'[39m,
    account_type: [32m'regular'[39m,
    role: [32m'user'[39m
  },
  token: [32m'test-token'[39m
}
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore login] Login successful

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when user logs in
[INFO][2025-05-27T23:45:26.905Z] [AuthSessionStore] Session initialized

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when user logs in
[INFO][2025-05-27T23:45:26.905Z] [UserProfileStore] Profile fetched successfully

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when admin user logs in
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore login] Attempting login with formData: { email: [32m'admin@example.com'[39m, password: [32m'admin123'[39m }

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when admin user logs in
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore login] Response.data: {
  success: [33mtrue[39m,
  data: {
    id: [33m1[39m,
    username: [32m'admin'[39m,
    email: [32m'admin@example.com'[39m,
    account_type: [32m'superuser'[39m,
    role: [32m'admin'[39m,
    permissions: [ [32m'admin'[39m, [32m'superuser'[39m, [32m'manage_users'[39m ]
  },
  token: [32m'admin-token'[39m
}
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore login] Login successful

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Logout Flow > should update all relevant stores when user logs out
[DEBUG][2025-05-27T23:45:26.905Z] [AuthService] Using modular auth service architecture

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Logout Flow > should update all relevant stores when user logs out
[DEBUG][2025-05-27T23:45:26.905Z] [UserAuthService] Attempting logout
[DEBUG][2025-05-27T23:45:26.905Z] [TokenService] All tokens cleared
[DEBUG][2025-05-27T23:45:26.905Z] [UserAuthService] Logout successful

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Logout Flow > should update all relevant stores when user logs out
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore logout] Logout successful.
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore logout] Clearing all auth storage and cookies
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore logout] All auth storage and cookies cleared

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Logout Flow > should update all relevant stores when user logs out
[INFO][2025-05-27T23:45:26.905Z] [AuthSessionStore] Session ended

 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when user logs in 35ms
 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Login Flow > should update all relevant stores when admin user logs in 7ms
stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Registration Flow > should register user and auto-login
[INFO][2025-05-27T23:45:26.905Z] [RegistrationStore register] Attempting registration with userData: {
  username: [32m'newuser'[39m,
  email: [32m'new@example.com'[39m,
  password: [32m'password123'[39m
}

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Registration Flow > should register user and auto-login
[INFO][2025-05-27T23:45:26.905Z] [RegistrationStore register] Registration successful

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should refresh session when close to expiry
[INFO][2025-05-27T23:45:26.905Z] [AuthSessionStore] Refreshing session due to recent activity
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore checkAuthStatus] Initializing, current state: {
  token: [32m'test-token'[39m,
  isAuthenticated: [33mtrue[39m,
  user: { id: [33m1[39m, username: [32m'testuser'[39m },
  isLoading: [33mfalse[39m,
  error: [1mnull[22m,
  lastAuthCheck: [33m1625097360000[39m,
  set: [36m[Function (anonymous)][39m,
  checkAuthStatus: [36m[AsyncFunction: checkAuthStatus][39m,
  login: [36m[AsyncFunction: login][39m,
  logout: [36m[AsyncFunction: logout][39m,
  getCurrentUser: [36m[Function: getCurrentUser][39m,
  getIsAuthenticated: [36m[Function: getIsAuthenticated][39m,
  getIsLoading: [36m[Function: getIsLoading][39m,
  getToken: [36m[Function: getToken][39m
}

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should refresh session when close to expiry
[INFO][2025-05-27T23:45:26.905Z] [AuthenticationStore checkAuthStatus] API responded quickly, using actual response

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should refresh session when close to expiry
[INFO][2025-05-27T23:45:26.905Z] [AuthSessionStore] Session refreshed successfully

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should refresh session when close to expiry
[INFO][2025-05-27T23:45:27.005Z] [AuthenticationStore checkAuthStatus] Initializing, current state: {
  token: [32m'test-token'[39m,
  isAuthenticated: [33mtrue[39m,
  user: { id: [33m1[39m, username: [32m'testuser'[39m },
  isLoading: [33mtrue[39m,
  error: [1mnull[22m,
  lastAuthCheck: [33m1625097360000[39m,
  set: [36m[Function (anonymous)][39m,
  checkAuthStatus: [36m[AsyncFunction: checkAuthStatus][39m,
  login: [36m[AsyncFunction: login][39m,
  logout: [36m[AsyncFunction: logout][39m,
  getCurrentUser: [36m[Function: getCurrentUser][39m,
  getIsAuthenticated: [36m[Function: getIsAuthenticated][39m,
  getIsLoading: [36m[Function: getIsLoading][39m,
  getToken: [36m[Function: getToken][39m
}

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should refresh session when close to expiry
[INFO][2025-05-27T23:45:27.005Z] [AuthenticationStore checkAuthStatus] API responded quickly, using actual response

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should end session when expired
[INFO][2025-05-27T23:45:27.005Z] [AuthSessionStore] Session expired
[INFO][2025-05-27T23:45:27.005Z] [AuthSessionStore] Session ended

stdout | tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > User Profile Management > should update user profile and notify authentication store
[INFO][2025-05-27T23:45:27.005Z] [UserProfileStore] Profile updated successfully

 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Logout Flow > should update all relevant stores when user logs out 127ms
 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Registration Flow > should register user and auto-login 2ms
 × tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should refresh session when close to expiry 11ms
   → [vitest] No "default" export is defined on the "../../../../src/utils/ErrorHandler" mock. Did you forget to return it from "vi.mock"?
If you need to partially mock a module, you can use "importOriginal" helper inside:

 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Session Management > should end session when expired 3ms
 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > User Profile Management > should update user profile and notify authentication store 1ms
 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Superuser Status > should determine superuser status from user data 2ms
 ✓ tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Superuser Status > should check permissions correctly 1ms
 × tests/integration/stores/auth/authStoresIntegration.test.js > Auth Stores Integration > Compatibility Wrapper > should provide backward compatibility through useAuthStore 3ms
   → Directory import '/Users/naf/Downloads/doof/src/stores/auth' is not supported resolving ES modules imported from /Users/naf/Downloads/doof/src/stores/useAuthStore.js
stdout | test/services/listService.test.js
[DEBUG][2025-05-27T23:45:27.563Z] Application is running in development mode
[DEBUG][2025-05-27T23:45:27.564Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:45:27.564Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:45:27.564Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:45:27.564Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:45:27.564Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:45:27.564Z] API Retry Delay (ms): [33m1000[39m

stdout | backup_20250525_155901/test/services/listService.test.js
[DEBUG][2025-05-27T23:45:27.569Z] Application is running in development mode
[DEBUG][2025-05-27T23:45:27.569Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:45:27.570Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:45:27.570Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:45:27.570Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:45:27.570Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:45:27.570Z] API Retry Delay (ms): [33m1000[39m

stdout | test/services/listService.test.js
[DEBUG][2025-05-27T23:45:27.628Z] [OfflineModeHandler] Initialized

stdout | backup_20250525_155901/test/services/listService.test.js
[DEBUG][2025-05-27T23:45:27.797Z] [OfflineModeHandler] Initialized

stdout | tests/integration/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes for a specific restaurant
No test restaurant, skipping restaurant dishes test

stdout | tests/integration/dishes.test.js > Dish Endpoints > Dish Creation > should create a new dish when authenticated
No authenticated user, skipping dish creation test

stdout | tests/integration/dishes.test.js > Dish Endpoints > Dish Creation > should fail to create a dish without authentication
No test restaurant, skipping unauthenticated dish creation test

stdout | tests/integration/dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish
No dish created, skipping dish details test

stdout | tests/integration/dishes.test.js > Dish Endpoints > Dish Update > should update a dish when authenticated
No authenticated user or dish, skipping dish update test

stdout | tests/integration/dishes.test.js > Dish Endpoints > Dish Update > should fail to update a dish without authentication
No dish created, skipping unauthenticated dish update test

stdout | tests/integration/dishes.test.js > Dish Endpoints > Dish Deletion > should fail to delete a dish without authentication
No dish created, skipping unauthenticated dish deletion test

 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes 110ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes for a specific restaurant 1ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Listing > should support filtering dishes by category 12ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Creation > should create a new dish when authenticated 0ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Creation > should fail to create a dish without authentication 0ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish 0ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Update > should update a dish when authenticated 0ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Update > should fail to update a dish without authentication 0ms
 ✓ tests/integration/dishes.test.js > Dish Endpoints > Dish Deletion > should fail to delete a dish without authentication 0ms
stdout | tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > initSession > should initialize session when user is authenticated
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Session initialized

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should end session when user is not authenticated
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Session ended

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should initialize session when not active but user is authenticated
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Session initialized

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should end session when it has expired
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Session expired
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Session ended

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should refresh session when close to expiry with recent activity
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Refreshing session due to recent activity

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > refreshSession > should refresh session when auth check succeeds
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Session refreshed successfully

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > endSession > should end session and clear interval
[INFO][2025-05-27T23:45:29.020Z] [AuthSessionStore] Session ended

 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > initSession > should not initialize session when user is not authenticated 11ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > initSession > should initialize session when user is authenticated 3ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > updateActivity > should not update activity when session is not active 1ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > updateActivity > should update activity when session is active 6ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should end session when user is not authenticated 5ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should initialize session when not active but user is authenticated 1ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should end session when it has expired 4ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > checkSession > should refresh session when close to expiry with recent activity 1ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > refreshSession > should not refresh when user is not authenticated 10ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > refreshSession > should refresh session when auth check succeeds 7ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > refreshSession > should handle auth check failure 2ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > refreshSession > should handle auth check error 2ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > endSession > should end session and clear interval 2ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > getters > should return session status 3ms
 ✓ tests/unit/stores/auth/useAuthSessionStore.test.js > useAuthSessionStore > getters > should return session active status 1ms
stdout | tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should return cached profile if available and not forced to refresh
[INFO][2025-05-27T23:45:29.134Z] [UserProfileStore] Using cached profile (60s old)

stdout | tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should fetch profile from API when cache is expired
[INFO][2025-05-27T23:45:29.139Z] [UserProfileStore] Profile fetched successfully

stdout | tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should force fetch profile when forceRefresh is true
[INFO][2025-05-27T23:45:29.143Z] [UserProfileStore] Profile fetched successfully

stdout | tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > updateUserPreferences > should successfully update preferences
[INFO][2025-05-27T23:45:29.171Z] [UserProfileStore] Preferences updated successfully

 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should return null when user is not authenticated 11ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should return cached profile if available and not forced to refresh 2ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should fetch profile from API when cache is expired 6ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should force fetch profile when forceRefresh is true 2ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > fetchUserProfile > should handle API error when fetching profile 10ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > updateUserProfile > should return null when user is not authenticated 4ms
 × tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > updateUserProfile > should successfully update profile 8ms
   → Cannot read properties of undefined (reading 'message')
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > updateUserProfile > should handle API error when updating profile 3ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > updateUserPreferences > should successfully update preferences 3ms
 × tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > updateUserAvatar > should successfully update avatar 4ms
   → Cannot read properties of undefined (reading 'message')
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > getters > should return profile 1ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > getters > should return preferences 3ms
 ✓ tests/unit/stores/auth/useUserProfileStore.test.js > useUserProfileStore > clearProfile > should reset profile state 1ms
stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes without authentication
Retrieved 0 dishes

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes for a specific restaurant
No test restaurant, skipping restaurant dishes test

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Listing > should support filtering dishes by category
Retrieved 0 main course dishes

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Creation > should create a new dish when authenticated
No authenticated user or restaurant, skipping dish creation test

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Creation > should fail to create a dish without authentication
No test restaurant, skipping unauthenticated dish creation test

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish
No dish created, skipping dish details test

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Update > should update a dish when authenticated
No authenticated user or dish, skipping dish update test

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Update > should fail to update a dish without authentication
No dish created, skipping unauthenticated dish update test

stdout | backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Deletion > should fail to delete a dish without authentication
No dish created, skipping unauthenticated dish deletion test

 × backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes without authentication 383ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes for a specific restaurant 1ms
 × backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Listing > should support filtering dishes by category 31ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Creation > should create a new dish when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Creation > should fail to create a dish without authentication 0ms
 ✓ backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish 0ms
 ✓ backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Update > should update a dish when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Update > should fail to update a dish without authentication 0ms
 ✓ backup_20250525_155901/_tests_backup/integration/dishes.test.js > Dish Endpoints > Dish Deletion > should fail to delete a dish without authentication 1ms
stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes without authentication
Retrieved 0 dishes

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes for a specific restaurant
No test restaurant, skipping restaurant dishes test

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Listing > should support filtering dishes by category
Retrieved 0 main course dishes

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Creation > should create a new dish when authenticated
No authenticated user or restaurant, skipping dish creation test

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Creation > should fail to create a dish without authentication
No test restaurant, skipping unauthenticated dish creation test

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish
No dish created, skipping dish details test

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Update > should update a dish when authenticated
No authenticated user or dish, skipping dish update test

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Update > should fail to update a dish without authentication
No dish created, skipping unauthenticated dish update test

stdout | backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Deletion > should fail to delete a dish without authentication
No dish created, skipping unauthenticated dish deletion test

 × backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes without authentication 74ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Listing > should list dishes for a specific restaurant 0ms
 × backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Listing > should support filtering dishes by category 14ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Creation > should create a new dish when authenticated 1ms
 ✓ backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Creation > should fail to create a dish without authentication 0ms
 ✓ backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish 0ms
 ✓ backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Update > should update a dish when authenticated 0ms
 ✓ backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Update > should fail to update a dish without authentication 0ms
 ✓ backup_20250525_155901/e2e/tests/dishes.test.js > Dish Endpoints > Dish Deletion > should fail to delete a dish without authentication 0ms
stdout | tests/unit/stores/auth/useAuthenticationStore.test.jsx
[DEBUG][2025-05-27T23:45:31.855Z] Application is running in development mode
[DEBUG][2025-05-27T23:45:31.855Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:45:31.855Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:45:31.855Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:45:31.855Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:45:31.855Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:45:31.855Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/stores/auth/useAuthenticationStore.test.jsx
[DEBUG][2025-05-27T23:45:31.877Z] [OfflineModeHandler] Initialized

stdout | backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Create List > should create a new list when authenticated
Skipping test due to missing authentication token

stdout | backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Get Lists > should get user's own lists when authenticated
Skipping test due to missing authentication token

stdout | backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Get Lists > should get a specific list by ID
Skipping test due to missing list ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Update List > should update a list when authenticated
Skipping test due to missing authentication token or list ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Follow List > should follow a list when authenticated
Skipping test due to missing authentication token or list ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Follow List > should unfollow a list when authenticated
Skipping test due to missing authentication token or list ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Delete List > should delete a list when authenticated
Skipping test due to missing authentication token or list ID

 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Create List > should create a new list when authenticated 2ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Create List > should fail to create a list when not authenticated 4ms
 × backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Get Lists > should get all public lists 14ms
   → expected [ 200, +0 ] to include 400
 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Get Lists > should get user's own lists when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Get Lists > should get a specific list by ID 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Update List > should update a list when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Follow List > should follow a list when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Follow List > should unfollow a list when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/list-endpoints.test.js > List Endpoints > Delete List > should delete a list when authenticated 0ms
stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants without authentication
Retrieved 0 restaurants

stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination and filtering
Retrieved 0 restaurants with pagination

stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants without authentication
Retrieved 0 restaurants

stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should create a new restaurant when authenticated
No authenticated user, skipping restaurant creation test

stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should fail to create a restaurant without authentication
Expected restaurant creation error: {
  status: [33m404[39m,
  data: {
    success: [33mfalse[39m,
    message: [32m'Route not found: POST /api/restaurants'[39m,
    error: { type: [32m'Error'[39m }
  }
}
Restaurant creation endpoint not found, skipping test

stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant
No restaurant created, skipping restaurant details test

stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should update a restaurant when authenticated
No authenticated user or restaurant, skipping restaurant update test

stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should fail to update a restaurant without authentication
No restaurant created, skipping restaurant update test

stdout | backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Deletion > should fail to delete a restaurant without admin authentication
No restaurant created, skipping restaurant deletion test

stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination and filtering
Retrieved 0 restaurants with pagination

stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should create a new restaurant when authenticated
No authenticated user, skipping restaurant creation test

 × backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants without authentication 424ms
   → expected false to be true // Object.is equality
 × backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination and filtering 10ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should create a new restaurant when authenticated 1ms
 ✓ backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should fail to create a restaurant without authentication 8ms
 ✓ backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant 0ms
 ✓ backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should update a restaurant when authenticated 1ms
 ✓ backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should fail to update a restaurant without authentication 0ms
 ✓ backup_20250525_155901/_tests_backup/integration/restaurants.test.js > Restaurant Endpoints > Restaurant Deletion > should fail to delete a restaurant without admin authentication 0ms
stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should fail to create a restaurant without authentication
Expected restaurant creation error: {
  status: [33m404[39m,
  data: {
    success: [33mfalse[39m,
    message: [32m'Route not found: POST /api/restaurants'[39m,
    error: { type: [32m'Error'[39m }
  }
}
Restaurant creation endpoint not found, skipping test

stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant
No restaurant created, skipping restaurant details test

stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should update a restaurant when authenticated
No authenticated user or restaurant, skipping restaurant update test

stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should fail to update a restaurant without authentication
No restaurant created, skipping restaurant update test

stdout | backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Deletion > should fail to delete a restaurant without admin authentication
No restaurant created, skipping restaurant deletion test

 × backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants without authentication 20ms
   → expected false to be true // Object.is equality
 × backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination and filtering 8ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should create a new restaurant when authenticated 0ms
 ✓ backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should fail to create a restaurant without authentication 9ms
 ✓ backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant 1ms
 ✓ backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should update a restaurant when authenticated 1ms
 ✓ backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Update > should fail to update a restaurant without authentication 0ms
 ✓ backup_20250525_155901/e2e/tests/restaurants.test.js > Restaurant Endpoints > Restaurant Deletion > should fail to delete a restaurant without admin authentication 0ms
stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints
Verifying backend server...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints
Starting authentication endpoint tests with backend server connected

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Registration > should register a new user
Verifying backend server...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Registration > should register a new user
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Registration > should register a new user
Attempting to register a new user...

stdout | backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin
Initializing test database...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout
Verifying backend server...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout
Verifying backend server...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout
Logging in to get a token for logout test...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for authenticated user
Verifying backend server...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for authenticated user
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for authenticated user
Logging in to get a token for auth status test...

stdout | backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin
Cleaning up test database...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Verifying backend server...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Verifying backend server...

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Checking auth status without token...

stdout | backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin
Test database cleaned up successfully

stdout | backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Unauthenticated status response: { status: [33m200[39m, isAuthenticated: [90mundefined[39m }

stdout | backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > User Management > should get all users
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > User Management > should get a specific user by ID
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > User Management > should create a new user
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > User Management > should update a user
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > User Management > should disable a user account
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > Submission Management > should get all pending submissions
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > Submission Management > should approve a submission
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > Submission Management > should reject a submission
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > System Configuration > should get system configuration
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > System Configuration > should update system configuration
 ↓ backup_20250525_155901/e2e/tests/admin.e2e.test.js > Admin > Access Control > should verify admin-only endpoints are protected
 × backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Registration > should register a new user 133ms
   → Request failed with status code 500
 ↓ backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Registration > should fail registration with invalid data
 ↓ backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Login > should successfully login with valid credentials
 ↓ backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
 × backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout 25ms
   → Request failed with status code 401
 × backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for authenticated user 53ms
   → Request failed with status code 401
 × backup_20250525_155901/_tests_backup/e2e/api/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user 24ms
   → expected { success: true, …(2) } to have property "isAuthenticated" with value false
stdout | backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Create Dish > should create a new dish when authenticated
Skipping test due to missing authentication token or restaurant ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Create Dish > should fail to create a dish when not authenticated
Skipping test due to missing restaurant ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Get Dishes > should get all dishes for a restaurant
Skipping test due to missing restaurant ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Get Dishes > should get a specific dish by ID
Skipping test due to missing restaurant ID or dish ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Update Dish > should update a dish when authenticated
Skipping test due to missing authentication token, restaurant ID, or dish ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Delete Dish > should delete a dish when authenticated
Skipping test due to missing authentication token, restaurant ID, or dish ID

 ✓ backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Create Dish > should create a new dish when authenticated 1ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Create Dish > should fail to create a dish when not authenticated 2ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Get Dishes > should get all dishes for a restaurant 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Get Dishes > should get a specific dish by ID 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Update Dish > should update a dish when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/dish-endpoints.test.js > Dish Endpoints > Delete Dish > should delete a dish when authenticated 0ms
stdout | backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement
Initializing test database...

stdout | backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Restaurant Engagement > should like a restaurant
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Restaurant Engagement > should unlike a restaurant
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Restaurant Engagement > should favorite a restaurant
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Restaurant Engagement > should unfavorite a restaurant
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Dish Engagement > should like a dish
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Dish Engagement > should unlike a dish
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Dish Engagement > should favorite a dish
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > Dish Engagement > should unfavorite a dish
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > List Engagement > should like a list
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > List Engagement > should unlike a list
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > List Engagement > should favorite a list
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > List Engagement > should unfavorite a list
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > User Engagement Summary > should get user's liked restaurants
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > User Engagement Summary > should get user's liked dishes
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > User Engagement Summary > should get user's liked lists
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > User Engagement Summary > should get user's favorited restaurants
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > User Engagement Summary > should get user's favorited dishes
 ↓ backup_20250525_155901/e2e/tests/engagement.e2e.test.js > Engagement > User Engagement Summary > should get user's favorited lists
stdout | backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations
Initializing test database...

stdout | backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Cities > should retrieve all cities
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Cities > should retrieve a specific city by ID
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Cities > should fail to retrieve a non-existent city
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Neighborhoods > should retrieve all neighborhoods
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Neighborhoods > should retrieve neighborhoods by city
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Neighborhoods > should retrieve a specific neighborhood by ID
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Neighborhoods > should fail to retrieve a non-existent neighborhood
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Location-Based Filtering > should filter restaurants by city
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Location-Based Filtering > should filter restaurants by neighborhood
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Location-Based Filtering > should filter restaurants by city and neighborhood
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Admin Location Management > should allow admin to create a new city
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Admin Location Management > should allow admin to create a new neighborhood
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Admin Location Management > should allow admin to update a city
 ↓ backup_20250525_155901/e2e/tests/locations.e2e.test.js > Locations > Admin Location Management > should allow admin to update a neighborhood
stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > General Search > should search across all content types
Search results for "pizza": { total: [33m0[39m, types: [] }

stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > General Search > should search across all content types
Search results for "pizza": { total: [33m0[39m, types: [] }

stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > General Search > should support pagination in search results
Paginated search results for "restaurant": { total: [33m0[39m, page: [33m1[39m, limit: [33m5[39m }

stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > General Search > should support pagination in search results
Paginated search results for "restaurant": { total: [33m0[39m, page: [33m1[39m, limit: [33m5[39m }

stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Restaurant Search > should search specifically for restaurants
Restaurant search endpoint not found, skipping test

 × backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > General Search > should search across all content types 84ms
   → expected { success: true, …(2) } to have property "results"
stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Restaurant Search > should search specifically for restaurants
Restaurant search endpoint not found, skipping test

stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Restaurant Search > should filter restaurant search by cuisine
Restaurant search endpoint not found, skipping test

stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Restaurant Search > should filter restaurant search by cuisine
Restaurant search endpoint not found, skipping test

stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Dish Search > should search specifically for dishes
Dish search endpoint not found, skipping test

stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Dish Search > should search specifically for dishes
Dish search endpoint not found, skipping test

stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Dish Search > should filter dish search by price range
Dish search endpoint not found, skipping test

stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Dish Search > should filter dish search by price range
Dish search endpoint not found, skipping test

stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Location-Based Search > should search for restaurants near a location
Nearby search endpoint not found, skipping test

stdout | backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Authenticated Search > should include user-specific data in search results when authenticated
No authenticated user, skipping authenticated search test

 × backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > General Search > should search across all content types 165ms
   → expected { success: true, …(2) } to have property "results"
 × backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > General Search > should support pagination in search results 34ms
   → expected { success: true, …(2) } to have property "results"
 ✓ backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Restaurant Search > should search specifically for restaurants 9ms
 ✓ backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Restaurant Search > should filter restaurant search by cuisine 17ms
 ✓ backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Dish Search > should search specifically for dishes 17ms
 ✓ backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Dish Search > should filter dish search by price range 8ms
 ✓ backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Location-Based Search > should search for restaurants near a location 10ms
 ✓ backup_20250525_155901/_tests_backup/integration/search.test.js > Search Endpoints > Authenticated Search > should include user-specific data in search results when authenticated 0ms
stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Location-Based Search > should search for restaurants near a location
Nearby search endpoint not found, skipping test

stdout | backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Authenticated Search > should include user-specific data in search results when authenticated
No authenticated user, skipping authenticated search test

 × backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > General Search > should support pagination in search results 35ms
   → expected { success: true, …(2) } to have property "results"
 ✓ backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Restaurant Search > should search specifically for restaurants 7ms
 ✓ backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Restaurant Search > should filter restaurant search by cuisine 12ms
 ✓ backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Dish Search > should search specifically for dishes 10ms
 ✓ backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Dish Search > should filter dish search by price range 16ms
 ✓ backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Location-Based Search > should search for restaurants near a location 13ms
 ✓ backup_20250525_155901/e2e/tests/search.test.js > Search Endpoints > Authenticated Search > should include user-specific data in search results when authenticated 0ms
 ✓ tests/unit/auth/context/AuthContext.test.jsx > AuthContext > provides initial authentication state 30ms
 ✓ tests/unit/auth/context/AuthContext.test.jsx > AuthContext > handles login success 12ms
 ✓ tests/unit/auth/context/AuthContext.test.jsx > AuthContext > handles login failure 12ms
 ✓ tests/unit/auth/context/AuthContext.test.jsx > AuthContext > handles logout 8ms
 ✓ tests/unit/auth/context/AuthContext.test.jsx > AuthContext > handles registration 10ms
 ✓ tests/unit/auth/context/AuthContext.test.jsx > AuthContext > handles profile update 10ms
 ✓ tests/unit/auth/context/AuthContext.test.jsx > AuthContext > handles auth initialization error 2ms
stdout | backup_20250525_155901/e2e/tests/search.e2e.test.js > Search
Initializing test database...

stdout | backup_20250525_155901/e2e/tests/search.e2e.test.js > Search
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/search.e2e.test.js > Search
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/search.e2e.test.js > Search
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Basic Search > should search for restaurants with a query string
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Basic Search > should search for dishes with a query string
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Basic Search > should search for lists with a query string
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Basic Search > should search across all types with a query string
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Filtered Search > should search for restaurants with city filter
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Filtered Search > should search for restaurants with neighborhood filter
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Filtered Search > should search for dishes with cuisine filter
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Filtered Search > should search for lists with list_type filter
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Pagination > should paginate search results
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Hashtag Search > should search with hashtag filter
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Error Handling > should handle invalid search type
 ↓ backup_20250525_155901/e2e/tests/search.e2e.test.js > Search > Error Handling > should handle invalid pagination parameters
stdout | src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should successfully register a new user
Attempting to register a new user...

stdout | backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Registration > should successfully register a new user
Attempting to register a new user...

stdout | backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Registration > should fail registration with invalid data
Expected registration error: {
  status: [33m400[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'VALIDATION_ERROR'[39m,
      message: [32m'Validation failed.'[39m,
      details: [32m'username is required., username must be a string., Username must be 3-50 characters., Invalid email format., Password must be between 8 and 100 characters.'[39m
    }
  }
}

stdout | src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should fail registration with invalid data
Expected registration error: {
  status: [33m400[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'VALIDATION_ERROR'[39m,
      message: [32m'Validation failed.'[39m,
      details: [32m'username is required., username must be a string., Username must be 3-50 characters., Invalid email format., Password must be between 8 and 100 characters.'[39m
    }
  }
}

stdout | src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should successfully login with valid credentials
Attempting to login...

stdout | backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Login > should successfully login with valid credentials
Attempting to login...

stdout | backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Expected login error: {
  status: [33m401[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  }
}

stdout | src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Expected login error: {
  status: [33m401[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  }
}

stdout | backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Unauthenticated auth status response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'User is not authenticated.'[39m,
    data: { isAuthenticated: [33mfalse[39m }
  }
}

stdout | src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Unauthenticated auth status response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'User is not authenticated.'[39m,
    data: { isAuthenticated: [33mfalse[39m }
  }
}

 × backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Registration > should successfully register a new user 296ms
   → Request failed with status code 500
 ✓ backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Registration > should fail registration with invalid data 17ms
 × backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Login > should successfully login with valid credentials 60ms
   → Request failed with status code 401
 ✓ backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Login > should fail login with invalid credentials 6ms
 × backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout 7ms
   → Request failed with status code 401
 × backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for authenticated user 5ms
   → Request failed with status code 401
 × src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should successfully register a new user 446ms
   → Request failed with status code 500
 ✓ src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should fail registration with invalid data 10ms
 × src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should successfully login with valid credentials 56ms
   → Request failed with status code 401
 ✓ src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should fail login with invalid credentials 9ms
 × src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout 8ms
   → Request failed with status code 401
 × src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for authenticated user 9ms
   → Request failed with status code 401
 × backup_20250525_155901/e2e/tests/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user 9ms
   → expected { success: true, …(2) } to have property "isAuthenticated" with value false
 × src/__tests__/e2e/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user 11ms
   → expected { success: true, …(2) } to have property "isAuthenticated" with value false
stdout | tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should successfully register a new user
Attempting to register a new user...

stdout | backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Create Restaurant > should create a new restaurant when authenticated
Skipping test due to missing authentication token

stdout | backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Create Restaurant > should fail to create a restaurant when not authenticated
Expected error when creating restaurant without auth: expected [ 401, 403, +0 ] to include 404

stdout | tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should fail registration with invalid data
Expected registration error: {
  status: [33m400[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'VALIDATION_ERROR'[39m,
      message: [32m'Validation failed.'[39m,
      details: [32m'username is required., username must be a string., Username must be 3-50 characters., Invalid email format., Password must be between 8 and 100 characters.'[39m
    }
  }
}

stdout | tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should successfully login with valid credentials
Attempting to login...

stdout | backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Get Restaurants > should get a specific restaurant by ID
Skipping test due to missing restaurant ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Update Restaurant > should update a restaurant when authenticated
Skipping test due to missing authentication token or restaurant ID

stdout | backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Delete Restaurant > should delete a restaurant when authenticated
Skipping test due to missing authentication token or restaurant ID

 ✓ backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Create Restaurant > should create a new restaurant when authenticated 2ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Create Restaurant > should fail to create a restaurant when not authenticated 3ms
 × backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Get Restaurants > should get a list of restaurants 53ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Get Restaurants > should get a specific restaurant by ID 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Update Restaurant > should update a restaurant when authenticated 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/restaurant-endpoints.test.js > Restaurant Endpoints > Delete Restaurant > should delete a restaurant when authenticated 0ms
stdout | tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Expected login error: {
  status: [33m401[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  }
}

stdout | tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user
Unauthenticated auth status response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'User is not authenticated.'[39m,
    data: { isAuthenticated: [33mfalse[39m }
  }
}

 × tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should successfully register a new user 188ms
   → Request failed with status code 500
 ✓ tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Registration > should fail registration with invalid data 9ms
 × tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should successfully login with valid credentials 22ms
   → Request failed with status code 401
 ✓ tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Login > should fail login with invalid credentials 8ms
 × tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Logout > should successfully logout 14ms
   → Request failed with status code 401
 × tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for authenticated user 9ms
   → Request failed with status code 401
 × tests/consolidated/e2e/auth-endpoints.test.js > Authentication Endpoints > Auth Status > should return auth status for unauthenticated user 13ms
   → expected { success: true, …(2) } to have property "isAuthenticated" with value false
 × tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > initialize > should add event listeners for online/offline events 26ms
   → expected "spy" to be called with arguments: [ 'online', Any<Function> ][90m

Number of calls: [1m0[22m
[39m
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > checkOfflineMode > should return false when navigator.onLine is true and no stored value 2ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > checkOfflineMode > should return true when navigator.onLine is false 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > checkOfflineMode > should return stored value when available (boolean format) 1ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > checkOfflineMode > should return stored value when available (object format) 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > checkOfflineMode > should use cached value when not forcing refresh 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > setOfflineMode > should update offline mode state (non-persistent) 1ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > setOfflineMode > should update offline mode state (persistent) 0ms
 × tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > handleOnlineEvent and handleOfflineEvent > should update offline mode when online event is triggered 2ms
   → expected true to be false // Object.is equality
 × tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > handleOnlineEvent and handleOfflineEvent > should update offline mode when offline event is triggered 2ms
   → expected false to be true // Object.is equality
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > shouldAllowRequestInOfflineMode > should allow GET requests in offline mode 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > shouldAllowRequestInOfflineMode > should allow requests with allowOffline flag 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > shouldAllowRequestInOfflineMode > should not allow non-GET requests without allowOffline flag 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > shouldAllowRequestInOfflineMode > should handle missing config 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > setupRequestInterceptor > should add offline flag to request in offline mode 0ms
 ✓ tests/unit/services/http/OfflineModeHandler.test.js > OfflineModeHandler > setupRequestInterceptor > should not modify request when not in offline mode 0ms
 ✓ tests/services/list/index.test.js > Unified List Service > CRUD operations > should delegate getLists to listCrudService 5ms
 ✓ tests/services/list/index.test.js > Unified List Service > CRUD operations > should delegate getList to listCrudService 1ms
 ✓ tests/services/list/index.test.js > Unified List Service > CRUD operations > should delegate createList to listCrudService 1ms
 ✓ tests/services/list/index.test.js > Unified List Service > Item operations > should delegate addItemToList to listItemService 1ms
 ✓ tests/services/list/index.test.js > Unified List Service > Item operations > should delegate getListItems to listItemService 0ms
 ✓ tests/services/list/index.test.js > Unified List Service > Item operations > should delegate addItemsToListBulk to listItemService 0ms
 ✓ tests/services/list/index.test.js > Unified List Service > Sharing operations > should delegate followList to listSharingService 1ms
 ✓ tests/services/list/index.test.js > Unified List Service > Sharing operations > should delegate unfollowList to listSharingService 0ms
 ✓ tests/services/list/index.test.js > Unified List Service > Sharing operations > should delegate handleFollowList to listSharingService.toggleFollowList 1ms
 ✓ tests/services/list/index.test.js > Unified List Service > Search operations > should delegate searchLists to listSearchService 0ms
 ✓ tests/services/list/index.test.js > Unified List Service > Search operations > should delegate getUserLists to listSearchService 0ms
 ✓ tests/services/list/index.test.js > Unified List Service > Search operations > should delegate getListSuggestions to listSearchService 0ms
stdout | backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants
Initializing test database...

stdout | backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Get Restaurants > should retrieve all restaurants
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Get Restaurants > should retrieve a specific restaurant by ID
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Get Restaurants > should fail to retrieve a non-existent restaurant
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Filter Restaurants > should filter restaurants by city
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Filter Restaurants > should filter restaurants by neighborhood
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Filter Restaurants > should filter restaurants by cuisine
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Restaurant Submissions > should submit a new restaurant
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Restaurant Submissions > should fail to submit a restaurant with invalid data
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Admin Restaurant Management > should allow admin to approve a restaurant submission
 ↓ backup_20250525_155901/e2e/tests/restaurants.e2e.test.js > Restaurants > Admin Restaurant Management > should allow admin to reject a restaurant submission
stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints
API Request: POST http://localhost:5001/api/auth/login

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes
Attempting to list dishes...
[Get Dishes] Attempt 1 of 3...

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes
API Request: GET http://localhost:5001/api/dishes

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes
API Response: 200 GET /dishes

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes
Dish listing API response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Dishes retrieved successfully.'[39m,
    dataLength: [33m12[39m,
    hasPagination: [33mtrue[39m
  }
}
First dish: {
  "id": 9,
  "name": "Akamaru Modern Ramen",
  "description": "",
  "price": "0.00",
  "category": "main",
  "isCommon": false,
  "adds": 170,
  "restaurant": {
    "id": 6,
    "name": "Ippudo NY",
    "address": null,
    "city": "New York",
    "neighborhood": null
  },
  "tags": [
    "broth",
    "egg",
    "japanese",
    "noodles",
    "pork",
    "ramen"
  ],
  "createdBy": null,
  "createdAt": "2025-04-07T14:39:46.451Z",
  "updatedAt": "2025-04-07T14:39:46.451Z"
}
Pagination data: { currentPage: [33m1[39m, totalPages: [33m13[39m, totalItems: [33m154[39m, itemsPerPage: [33m12[39m }

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes
Attempting to list dishes with pagination...
[Get Dishes] Attempt 1 of 3...

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes
API Request: GET http://localhost:5001/api/dishes

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes
API Response: 200 GET /dishes

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes
Paginated dish listing API response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Dishes retrieved successfully.'[39m,
    dataLength: [33m5[39m,
    hasPagination: [33mtrue[39m
  }
}
First paginated dish: {
  "id": 9,
  "name": "Akamaru Modern Ramen",
  "description": "",
  "price": "0.00",
  "category": "main",
  "isCommon": false,
  "adds": 170,
  "restaurant": {
    "id": 6,
    "name": "Ippudo NY",
    "address": null,
    "city": "New York",
    "neighborhood": null
  },
  "tags": [
    "broth",
    "egg",
    "japanese",
    "noodles",
    "pork",
    "ramen"
  ],
  "createdBy": null,
  "createdAt": "2025-04-07T14:39:46.451Z",
  "updatedAt": "2025-04-07T14:39:46.451Z"
}

 ✓ tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes 44ms
 ✓ tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes 24ms
 ✓ tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Creation > should attempt to create a dish 0ms
 ✓ tests/integration/simplified-dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish 0ms
stdout | tests/integration/quick-adds.test.js > Quick Adds Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Creating Quick Adds > should create a new quick add
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Creating Quick Adds > should require a valid list ID
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Creating Quick Adds > should validate required fields
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Retrieving Quick Adds > should retrieve quick adds for a list
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Retrieving Quick Adds > should filter quick adds by tag
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Updating Quick Adds > should update a quick add
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Updating Quick Adds > should validate updates
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Deleting Quick Adds > should delete a quick add
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Deleting Quick Adds > should handle deleting non-existent quick adds
 ↓ tests/integration/quick-adds.test.js > Quick Adds Integration Tests > Quick Add Limits > should enforce the maximum number of quick adds (50) per list
stdout | backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists
Initializing test database...

stdout | backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Create List > should create a new list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Create List > should fail to create a list with invalid data
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Get Lists > should retrieve all lists for the user
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Get Lists > should retrieve a specific list by ID
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Get Lists > should fail to retrieve a non-existent list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Update List > should update an existing list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Update List > should fail to update a non-existent list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > List Items > should add an item to a list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > List Items > should retrieve items in a list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > List Items > should update a list item
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > List Items > should remove an item from a list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Delete List > should delete an existing list
 ↓ backup_20250525_155901/e2e/tests/lists.e2e.test.js > Lists > Delete List > should fail to delete a non-existent list
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > CRUD operations > should delegate getRestaurantDetails to restaurantCrudService 6ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > CRUD operations > should delegate getRestaurantById to restaurantCrudService 1ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > CRUD operations > should delegate createRestaurant to restaurantCrudService 1ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > CRUD operations > should delegate getFeaturedRestaurants to restaurantCrudService 0ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > Search operations > should delegate searchRestaurants to restaurantSearchService 0ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > Search operations > should delegate getRestaurantSuggestions to restaurantSearchService 0ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > Search operations > should delegate getSimilarRestaurants to restaurantSearchService 0ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > Review operations > should delegate getRestaurantReviews to restaurantReviewService 0ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > Review operations > should delegate addRestaurantReview to restaurantReviewService 1ms
 ✓ tests/services/restaurant/index.test.js > Unified Restaurant Service > Review operations > should delegate getRestaurantRatingSummary to restaurantReviewService 0ms
stdout | backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags
Initializing test database...

stdout | backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Get Hashtags > should retrieve all hashtags
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Get Hashtags > should retrieve top hashtags
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Get Hashtags > should retrieve trending hashtags
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Filter by Hashtags > should filter restaurants by hashtag
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Filter by Hashtags > should filter dishes by hashtag
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Filter by Hashtags > should filter by multiple hashtags
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Search Hashtags > should search for hashtags by partial name
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Hashtag Associations > should get restaurants associated with a hashtag
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Hashtag Associations > should get dishes associated with a hashtag
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Admin Hashtag Management > should allow admin to create a new hashtag
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Admin Hashtag Management > should allow admin to update a hashtag
 ↓ backup_20250525_155901/e2e/tests/hashtags.e2e.test.js > Hashtags > Admin Hashtag Management > should allow admin to delete a hashtag
stdout | backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes
Initializing test database...

stdout | backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes
Database connections closed

 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Get Dishes > should retrieve all dishes
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Get Dishes > should retrieve a specific dish by ID
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Get Dishes > should fail to retrieve a non-existent dish
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Filter Dishes > should filter dishes by restaurant
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Filter Dishes > should filter dishes by price range
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Filter Dishes > should filter dishes by hashtags
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Dish Submissions > should submit a new dish
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Dish Submissions > should fail to submit a dish with invalid data
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Admin Dish Management > should allow admin to approve a dish submission
 ↓ backup_20250525_155901/e2e/tests/dishes.e2e.test.js > Dishes > Admin Dish Management > should allow admin to reject a dish submission
stdout | src/hooks/useBulkSubmitter.test.jsx
[DEBUG][2025-05-27T23:45:49.563Z] Application is running in development mode
[DEBUG][2025-05-27T23:45:49.564Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:45:49.564Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:45:49.564Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:45:49.564Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:45:49.564Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:45:49.564Z] API Retry Delay (ms): [33m1000[39m

stdout | src/hooks/useBulkSubmitter.test.jsx
[DEBUG][2025-05-27T23:45:49.597Z] [OfflineModeHandler] Initialized

 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > startLoading and stopLoading > should track loading state for a request 2ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > startLoading and stopLoading > should handle multiple concurrent requests 1ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > startLoading and stopLoading > should handle missing config or URL 0ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > subscribeToLoadingState > should notify subscribers when loading state changes 3ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > subscribeToLoadingState > should handle invalid callbacks 0ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > setupRequestInterceptor > should start loading when request is made 0ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > setupResponseInterceptor > should stop loading on successful response 0ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > setupResponseInterceptor > should stop loading on error response 0ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > setupResponseInterceptor > should handle errors without config 0ms
 ✓ tests/unit/services/http/LoadingStateManager.test.js > LoadingStateManager > resetLoadingStates > should reset all loading states 0ms
 ✓ tests/unit/auth/hooks/useAuthRedirect.test.jsx > useAuthRedirect Hook > allows access when no auth is required 43ms
 ✓ tests/unit/auth/hooks/useAuthRedirect.test.jsx > useAuthRedirect Hook > redirects unauthenticated users from protected routes 11ms
 ✓ tests/unit/auth/hooks/useAuthRedirect.test.jsx > useAuthRedirect Hook > redirects authenticated users from login page 11ms
 ✓ tests/unit/auth/hooks/useAuthRedirect.test.jsx > useAuthRedirect Hook > redirects users without required role 14ms
 ✓ tests/unit/auth/hooks/useAuthRedirect.test.jsx > useAuthRedirect Hook > allows access with required role 5ms
 ✓ tests/unit/auth/hooks/useAuthRedirect.test.jsx > useAuthRedirect Hook > allows access with one of multiple required roles 4ms
 ✓ tests/unit/auth/hooks/useAuthRedirect.test.jsx > useAuthRedirect Hook > does not redirect while auth is loading 15ms
 ✓ tests/unit/auth/components/ProtectedRoute.test.jsx > ProtectedRoute Component > renders children when no auth is required 31ms
 ✓ tests/unit/auth/components/ProtectedRoute.test.jsx > ProtectedRoute Component > redirects unauthenticated users 10ms
 ✓ tests/unit/auth/components/ProtectedRoute.test.jsx > ProtectedRoute Component > allows access to authenticated users 7ms
 ✓ tests/unit/auth/components/ProtectedRoute.test.jsx > ProtectedRoute Component > redirects users without required role 10ms
 ✓ tests/unit/auth/components/ProtectedRoute.test.jsx > ProtectedRoute Component > allows access with required role 8ms
 ✓ tests/unit/auth/components/ProtectedRoute.test.jsx > ProtectedRoute Component > allows access with one of multiple required roles 3ms
 ✓ tests/unit/auth/components/ProtectedRoute.test.jsx > ProtectedRoute Component > renders nothing while auth is loading 6ms
stdout | backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling
Initializing test database...

 × backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling > Token Validation > should accept requests with valid token 4ms
   → expected false to be true // Object.is equality
stdout | backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling
Database connections closed

 × backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling > Token Validation > should reject requests with malformed token 60ms
   → expected true to be false // Object.is equality
 × backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling > Token Validation > should reject requests with token having wrong signature 14ms
   → expected true to be false // Object.is equality
 ✓ backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling > Token Validation > should reject requests with expired token 0ms
 × backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling > Token Refresh > should refresh an expiring token 0ms
   → expected false to be true // Object.is equality
 ✓ backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling > Token Refresh > should reject refresh with invalid refresh token 12ms
 × backup_20250525_155901/e2e/tests/jwt.e2e.test.js > JWT Token Handling > User-Specific Tokens > should restrict access to user-specific resources with another user's token 1ms
   → expected false to be true // Object.is equality
stdout | backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication
Initializing test database...

 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Login > should successfully login with valid regular user credentials 6ms
   → expected false to be true // Object.is equality
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Login > should successfully login with valid admin credentials 1ms
   → expected false to be true // Object.is equality
stdout | backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication
Cleaning up test database...

stdout | backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication
Test database cleaned up successfully

stdout | backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication
Database connections closed

 ✓ backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Login > should fail login with invalid credentials 171ms
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Login > should fail login with malformed credentials 2ms
   → expected [ 400, 422 ] to include undefined
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Token Handling > should access protected routes with valid token 1ms
   → expected false to be true // Object.is equality
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Token Handling > should fail to access protected routes without token 13ms
   → expected true to be false // Object.is equality
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Token Handling > should fail to access protected routes with malformed token 30ms
   → expected true to be false // Object.is equality
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Token Handling > should fail to access protected routes with token having wrong signature 20ms
   → expected true to be false // Object.is equality
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Authorization > should allow admin to access admin-only routes 0ms
   → expected false to be true // Object.is equality
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Authorization > should prevent regular user from accessing admin-only routes 0ms
   → expected false to be true // Object.is equality
 × backup_20250525_155901/e2e/tests/auth.e2e.test.js > Authentication > Logout > should successfully logout 5ms
   → expected false to be true // Object.is equality
stdout | tests/integration/auth/login.test.js
[DEBUG] Creating API client with baseURL: http://localhost:5001/api

stdout | tests/integration/auth/login.test.js > Login Flow
Attempting logout

stdout | tests/integration/auth/login.test.js > Login Flow
[TEST] POST /auth/logout {
  data: [90mundefined[39m,
  headers: Object [AxiosHeaders] {
    Accept: [32m'application/json'[39m,
    [32m'Content-Type'[39m: [32m'application/json'[39m,
    [32m'X-Requested-With'[39m: [32m'XMLHttpRequest'[39m,
    [32m'X-Test-Mode'[39m: [32m'true'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow
[TEST] Response 200 POST /auth/logout {
  data: {
    success: [33mtrue[39m,
    message: [32m'No token provided. User already logged out.'[39m,
    data: {}
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389552138-tyln7hfr6'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'82'[39m,
    etag: [32m'W/"52-iF6D9wMio35XOp7wKxkr5bF8eJw"'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:52 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow
Logout response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'No token provided. User already logged out.'[39m,
    data: {}
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389552138-tyln7hfr6'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'82'[39m,
    etag: [32m'W/"52-iF6D9wMio35XOp7wKxkr5bF8eJw"'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:52 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log in with valid credentials

--- Starting login test with valid credentials ---
Attempting to log in with: { email: [32m'test@example.com'[39m, password: [32m'********'[39m, passwordLength: [33m15[39m }
Login request data: {
  "email": "test@example.com",
  "password": "***"
}
Sending login request to /auth/login

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log in with valid credentials
[TEST] POST /auth/login {
  data: { email: [32m'test@example.com'[39m, password: [32m'testpassword123'[39m },
  headers: Object [AxiosHeaders] {
    Accept: [32m'application/json'[39m,
    [32m'Content-Type'[39m: [32m'application/json'[39m,
    [32m'X-Requested-With'[39m: [32m'XMLHttpRequest'[39m,
    [32m'X-Test-Mode'[39m: [32m'true'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log in with valid credentials
[TEST] Response 401 POST /auth/login {
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389552164-zwifdzop8'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'105'[39m,
    etag: [32m'W/"69-8GzST53nRfHLanPyfvlDJGNut/8"'[39m,
    [32m'x-response-time'[39m: [32m'12ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:52 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log in with valid credentials
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  },
  headers: [
    [32m'content-security-policy'[39m,
    [32m'cross-origin-opener-policy'[39m,
    [32m'cross-origin-resource-policy'[39m,
    [32m'origin-agent-cluster'[39m,
    [32m'referrer-policy'[39m,
    [32m'strict-transport-security'[39m,
    [32m'x-content-type-options'[39m,
    [32m'x-dns-prefetch-control'[39m,
    [32m'x-download-options'[39m,
    [32m'x-frame-options'[39m,
    [32m'x-permitted-cross-domain-policies'[39m,
    [32m'x-xss-protection'[39m,
    [32m'x-request-id'[39m,
    [32m'vary'[39m,
    [32m'access-control-allow-credentials'[39m,
    [32m'content-type'[39m,
    [32m'content-length'[39m,
    [32m'etag'[39m,
    [32m'x-response-time'[39m,
    [32m'date'[39m,
    [32m'connection'[39m,
    [32m'keep-alive'[39m
  ]
}
Processed login result: {
  "success": false,
  "hasToken": false,
  "hasUser": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials: User not found."
  },
  "status": 401
}

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log in with valid credentials
Login result: {
  "success": false,
  "status": 401,
  "hasToken": false,
  "hasUser": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials: User not found."
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log out the user

--- Starting logout test ---
Login request data: {
  "email": "test@example.com",
  "password": "***"
}
Sending login request to /auth/login

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log out the user
[TEST] POST /auth/login {
  data: { email: [32m'test@example.com'[39m, password: [32m'testpassword123'[39m },
  headers: Object [AxiosHeaders] {
    Accept: [32m'application/json'[39m,
    [32m'Content-Type'[39m: [32m'application/json'[39m,
    [32m'X-Requested-With'[39m: [32m'XMLHttpRequest'[39m,
    [32m'X-Test-Mode'[39m: [32m'true'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log out the user
[TEST] Response 401 POST /auth/login {
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389552192-22sqd2jkh'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'105'[39m,
    etag: [32m'W/"69-8GzST53nRfHLanPyfvlDJGNut/8"'[39m,
    [32m'x-response-time'[39m: [32m'1ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:52 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow > should successfully log out the user
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  },
  headers: [
    [32m'content-security-policy'[39m,
    [32m'cross-origin-opener-policy'[39m,
    [32m'cross-origin-resource-policy'[39m,
    [32m'origin-agent-cluster'[39m,
    [32m'referrer-policy'[39m,
    [32m'strict-transport-security'[39m,
    [32m'x-content-type-options'[39m,
    [32m'x-dns-prefetch-control'[39m,
    [32m'x-download-options'[39m,
    [32m'x-frame-options'[39m,
    [32m'x-permitted-cross-domain-policies'[39m,
    [32m'x-xss-protection'[39m,
    [32m'x-request-id'[39m,
    [32m'vary'[39m,
    [32m'access-control-allow-credentials'[39m,
    [32m'content-type'[39m,
    [32m'content-length'[39m,
    [32m'etag'[39m,
    [32m'x-response-time'[39m,
    [32m'date'[39m,
    [32m'connection'[39m,
    [32m'keep-alive'[39m
  ]
}
Processed login result: {
  "success": false,
  "hasToken": false,
  "hasUser": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials: User not found."
  },
  "status": 401
}

stdout | tests/integration/auth/login.test.js > Login Flow
Attempting logout

stdout | tests/integration/auth/login.test.js > Login Flow
[TEST] POST /auth/logout {
  data: [90mundefined[39m,
  headers: Object [AxiosHeaders] {
    Accept: [32m'application/json'[39m,
    [32m'Content-Type'[39m: [32m'application/json'[39m,
    [32m'X-Requested-With'[39m: [32m'XMLHttpRequest'[39m,
    [32m'X-Test-Mode'[39m: [32m'true'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow
[TEST] Response 200 POST /auth/logout {
  data: {
    success: [33mtrue[39m,
    message: [32m'No token provided. User already logged out.'[39m,
    data: {}
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389552206-ozkve3cpo'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'82'[39m,
    etag: [32m'W/"52-iF6D9wMio35XOp7wKxkr5bF8eJw"'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:52 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/integration/auth/login.test.js > Login Flow
Logout response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'No token provided. User already logged out.'[39m,
    data: {}
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389552206-ozkve3cpo'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'82'[39m,
    etag: [32m'W/"52-iF6D9wMio35XOp7wKxkr5bF8eJw"'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:52 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

 × tests/integration/auth/login.test.js > Login Flow > should successfully log in with valid credentials 32ms
   → Invalid credentials: User not found.
 × tests/integration/auth/login.test.js > Login Flow > should successfully log out the user 14ms
   → Login should be successful: expected false to be true // Object.is equality
stdout | src/hooks/usePlaceResolver.test.jsx
[DEBUG][2025-05-27T23:45:52.767Z] Application is running in development mode
[DEBUG][2025-05-27T23:45:52.767Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:45:52.768Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:45:52.768Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:45:52.768Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:45:52.768Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:45:52.768Z] API Retry Delay (ms): [33m1000[39m

stdout | src/hooks/usePlaceResolver.test.jsx
[DEBUG][2025-05-27T23:45:52.838Z] [OfflineModeHandler] Initialized

stdout | tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Following Lists > should follow a public list
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Following Lists > should not allow following the same list twice
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Following Lists > should appear in user's followed lists
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Unfollowing Lists > should unfollow a list
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Unfollowing Lists > should not be in user's followed lists after unfollowing
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Unfollowing Lists > should handle unfollowing a not-followed list gracefully
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > List Followers > should get list of followers
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > List Followers > should return empty array for list with no followers
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Private Lists > should not allow following a private list without permission
 ↓ tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests > Follow Counts > should update follow count when following/unfollowing
stdout | src/__tests__/integration/simplified-auth.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/integration/simplified-auth.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389553278-9sjxj7lpa'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'122ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:53 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints
Attempting login with: {
  email: [32m'newtest@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'newtest@example.com'[39m, password: [32m'***'[39m }
}

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389553290-knd0h0tyh'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'208ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:53 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints
Attempting login with: {
  email: [32m'newtest@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'newtest@example.com'[39m, password: [32m'***'[39m }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints
Login response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Login successful.'[39m,
    data: {
      token: [32m'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4Mzg5NTUzLCJleHAiOjE3NDgzOTMxNTN9.0oBeRQZaHvqruO6uhfpBqeNMnnvx8czgrjKlxk3nT6c'[39m,
      user: [36m[Object][39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389553498-e674wth5z'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'426'[39m,
    etag: [32m'W/"1aa-djVDUFdAUw4bYwjv1rrX87X8RHA"'[39m,
    [32m'x-response-time'[39m: [32m'91ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:53 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

stdout | tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests
API Request: POST http://localhost:5001/api/auth/login

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints
Login response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Login successful.'[39m,
    data: {
      token: [32m'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4Mzg5NTUzLCJleHAiOjE3NDgzOTMxNTN9.0oBeRQZaHvqruO6uhfpBqeNMnnvx8czgrjKlxk3nT6c'[39m,
      user: [36m[Object][39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389553590-j7rvvvp2w'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'426'[39m,
    etag: [32m'W/"1aa-djVDUFdAUw4bYwjv1rrX87X8RHA"'[39m,
    [32m'x-response-time'[39m: [32m'108ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:53 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Zip Code Lookup > should find neighborhood by zip code
 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Zip Code Lookup > should handle invalid zip code
 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Zip Code Lookup > should handle zip codes with leading zeros
 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Neighborhood Search > should find neighborhoods by name
 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Neighborhood Search > should filter neighborhoods by city and state
 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Neighborhood Boundary Validation > should validate coordinates within neighborhood boundaries
 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Zip Code to Multiple Neighborhoods > should handle zip codes that span multiple neighborhoods
 ↓ tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests > Neighborhood Metadata > should return neighborhood metadata
stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389553698-n3shwr38t'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'135ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:53 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Admin login result: { success: [33mfalse[39m, status: [33m401[39m, hasToken: [33mfalse[39m }

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Attempting login with: {
  email: [32m'newtest@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'newtest@example.com'[39m, password: [32m'***'[39m }
}

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389553834-thkgblm9f'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'213ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:53 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Admin login result: { success: [33mfalse[39m, status: [33m401[39m, hasToken: [33mfalse[39m }

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Attempting login with: {
  email: [32m'newtest@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'newtest@example.com'[39m, password: [32m'***'[39m }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Login response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Login successful.'[39m,
    data: {
      token: [32m'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4Mzg5NTU0LCJleHAiOjE3NDgzOTMxNTR9.lipaB0nsSol3LgPaOM-AvNiHUpibuo81cxQVip_bc9c'[39m,
      user: [36m[Object][39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389553842-jlkrk6jt6'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'426'[39m,
    etag: [32m'W/"1aa-HshUk3/eKKTAOo3csiHLwv3nwNo"'[39m,
    [32m'x-response-time'[39m: [32m'206ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:53 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Regular user login result: { success: [33mfalse[39m, status: [33m200[39m, hasToken: [33mfalse[39m }

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Attempting login with: {
  email: [32m'invalid@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'invalid@example.com'[39m, password: [32m'***'[39m }
}

 ✓ tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials 244ms
stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389554061-8zm63w98p'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'105'[39m,
    etag: [32m'W/"69-8GzST53nRfHLanPyfvlDJGNut/8"'[39m,
    [32m'x-response-time'[39m: [32m'108ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:54 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js
Verifying backend server...

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Login response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Login successful.'[39m,
    data: {
      token: [32m'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4Mzg5NTU0LCJleHAiOjE3NDgzOTMxNTR9.lipaB0nsSol3LgPaOM-AvNiHUpibuo81cxQVip_bc9c'[39m,
      user: [36m[Object][39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389554056-xg9xv8gbn'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'426'[39m,
    etag: [32m'W/"1aa-HshUk3/eKKTAOo3csiHLwv3nwNo"'[39m,
    [32m'x-response-time'[39m: [32m'113ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:54 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Invalid login result: {
  success: [33mfalse[39m,
  status: [33m401[39m,
  error: {
    code: [32m'INVALID_CREDENTIALS'[39m,
    message: [32m'Invalid credentials: User not found.'[39m
  }
}

 ✓ tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials 217ms
stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user
Attempting registration with: { email: [32m'test1748389553240@example.com'[39m, endpoint: [32m'/auth/register'[39m }

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Regular user login result: { success: [33mfalse[39m, status: [33m200[39m, hasToken: [33mfalse[39m }

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Attempting login with: {
  email: [32m'invalid@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'invalid@example.com'[39m, password: [32m'***'[39m }
}

 ✓ src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials 349ms
stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js
Backend server is running: Backend is healthy and running!

stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js
Starting E2E endpoint tests with backend server connected

stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Restaurant Endpoints > should get a list of restaurants
Fetching restaurants...

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: User not found.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389554187-npqea7jdj'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'105'[39m,
    etag: [32m'W/"69-8GzST53nRfHLanPyfvlDJGNut/8"'[39m,
    [32m'x-response-time'[39m: [32m'102ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:54 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Invalid login result: {
  success: [33mfalse[39m,
  status: [33m401[39m,
  error: {
    code: [32m'INVALID_CREDENTIALS'[39m,
    message: [32m'Invalid credentials: User not found.'[39m
  }
}

 ✓ src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials 123ms
stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user
Attempting registration with: { email: [32m'test1748389553238@example.com'[39m, endpoint: [32m'/auth/register'[39m }

stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Restaurant Endpoints > should create a new restaurant
Creating new restaurant: Test Restaurant 1748389554426

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
Attempting login with: {
  email: [32m'newtest@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'newtest@example.com'[39m, password: [32m'***'[39m }
}

 ✓ tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials 120ms
stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Restaurant Endpoints > should get a restaurant by ID
Creating restaurant for get by ID test...

stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
Attempting login with: {
  email: [32m'newtest@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'newtest@example.com'[39m, password: [32m'***'[39m }
}

 ✓ src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials 166ms
 × backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Restaurant Endpoints > should get a list of restaurants 226ms
   → Request failed with status code 404
 × backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Restaurant Endpoints > should create a new restaurant 95ms
   → Request failed with status code 404
stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Dish Endpoints > should get a list of dishes
Fetching dishes...

stdout | backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Dish Endpoints > should create a new dish
Creating restaurant for dish test...

 × backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Restaurant Endpoints > should get a restaurant by ID 19ms
   → Request failed with status code 404
 × backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Dish Endpoints > should get a list of dishes 15ms
   → Request failed with status code 404
 × backup_20250525_155901/_tests_backup/e2e/api/e2e-endpoints.test.js > E2E API Endpoints > Dish Endpoints > should create a new dish 7ms
   → Request failed with status code 404
stdout | src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
Login response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Login successful.'[39m,
    data: {
      token: [32m'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4Mzg5NTU0LCJleHAiOjE3NDgzOTMxNTR9.lipaB0nsSol3LgPaOM-AvNiHUpibuo81cxQVip_bc9c'[39m,
      user: [36m[Object][39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389554550-x2uebxyfu'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'426'[39m,
    etag: [32m'W/"1aa-HshUk3/eKKTAOo3csiHLwv3nwNo"'[39m,
    [32m'x-response-time'[39m: [32m'235ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:54 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
Login response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Login successful.'[39m,
    data: {
      token: [32m'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxNDYsInVzZXJuYW1lIjoibmV3dGVzdHVzZXIiLCJlbWFpbCI6Im5ld3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFjY291bnRfdHlwZSI6InVzZXIifSwiaWF0IjoxNzQ4Mzg5NTU0LCJleHAiOjE3NDgzOTMxNTR9.lipaB0nsSol3LgPaOM-AvNiHUpibuo81cxQVip_bc9c'[39m,
      user: [36m[Object][39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389554515-maro6ra08'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'426'[39m,
    etag: [32m'W/"1aa-HshUk3/eKKTAOo3csiHLwv3nwNo"'[39m,
    [32m'x-response-time'[39m: [32m'272ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:54 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

 × tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user 258ms
   → Request failed with status code 500
 × src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user 188ms
   → Request failed with status code 500
 ✓ tests/consolidated/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login 358ms
 ✓ src/__tests__/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login 262ms
stdout | src/pages/Login/Login.test.jsx
[DEBUG][2025-05-27T23:45:55.235Z] Application is running in development mode
[DEBUG][2025-05-27T23:45:55.236Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:45:55.236Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:45:55.236Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:45:55.236Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:45:55.236Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:45:55.236Z] API Retry Delay (ms): [33m1000[39m

stdout | src/pages/Login/Login.test.jsx
[DEBUG][2025-05-27T23:45:55.270Z] [OfflineModeHandler] Initialized

stdout | backup_20250525_155901/src/pages/Login/Login.test.jsx
[DEBUG][2025-05-27T23:45:55.540Z] Application is running in development mode
[DEBUG][2025-05-27T23:45:55.541Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:45:55.541Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:45:55.541Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:45:55.541Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:45:55.541Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:45:55.541Z] API Retry Delay (ms): [33m1000[39m

stdout | backup_20250525_155901/src/pages/Login/Login.test.jsx
[DEBUG][2025-05-27T23:45:55.566Z] [OfflineModeHandler] Initialized

 ✓ tests/unit/hooks/useInputParser.test.jsx > useInputParser > should initialize with default values 13ms
 ✓ tests/unit/hooks/useInputParser.test.jsx > useInputParser > should handle empty input 3ms
 ✓ tests/unit/hooks/useInputParser.test.jsx > useInputParser > should parse valid input 3ms
 ✓ tests/unit/hooks/useInputParser.test.jsx > useInputParser > should parse semicolon-delimited input with hashtags 2ms
 ✓ tests/unit/hooks/useInputParser.test.jsx > useInputParser > should handle parsing errors 6ms
 ✓ tests/unit/hooks/useInputParser.test.jsx > useInputParser > should handle empty result from parser 5ms
 ✓ tests/unit/hooks/useInputParser.test.jsx > useInputParser > should reset state correctly 3ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders with default props 81ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders with label 13ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders required indicator when required is true 3ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders with placeholder 1ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders with value 8ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > calls onChange handler when input changes 7ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > calls onBlur handler when input loses focus 12ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders as disabled when disabled is true 4ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders as read-only when readOnly is true 4ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders error message when error is provided 3ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders helper text when helperText is provided 1ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > does not render helper text when error is provided 4ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > renders with different input types 7ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > applies custom className 2ms
 ✓ tests/unit/components/common/forms/Input.test.jsx > Input Component > passes inputProps to input element 1ms
stdout | tests/integration/simplified-restaurants.test.js > Restaurant Endpoints
API Request: POST http://localhost:5001/api/auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints
API Request: POST http://localhost:5001/api/auth/login

 × tests/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants 3ms
   → [API Request] Failed after Get Restaurants attempts: Unknown error
 × tests/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination for restaurants 1ms
   → [API Request] Failed after Get Restaurants attempts: Unknown error
 ✓ tests/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should attempt to create a restaurant 1ms
 ✓ tests/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant 1ms
stdout | backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants
API Request: GET http://localhost:5001/api/e2e/restaurants

stdout | backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants
Restaurant listing result: { success: [33mfalse[39m, status: [33m404[39m, count: [32m'N/A'[39m }

stdout | backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination for restaurants
API Request: GET http://localhost:5001/api/e2e/restaurants

stdout | backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination for restaurants
Paginated restaurant listing result: { success: [33mfalse[39m, status: [33m404[39m, count: [32m'N/A'[39m }

 ✓ backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants 25ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination for restaurants 13ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should attempt to create a restaurant 1ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant 1ms
stdout | src/__tests__/e2e/simplified-restaurants.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | src/__tests__/integration/simplified-restaurants.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | src/__tests__/integration/simplified-restaurants.test.js > Restaurant Endpoints
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

stdout | src/__tests__/integration/simplified-restaurants.test.js > Restaurant Endpoints
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389558347-9xvv9ocb4'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'130ms'[39m,
    date: [32m'Tue, 27 May 2025 23:45:58 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

 × src/__tests__/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants 7ms
   → (0 , getRestaurants) is not a function
 × src/__tests__/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination for restaurants 1ms
   → (0 , getRestaurants) is not a function
 ✓ src/__tests__/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should attempt to create a restaurant 1ms
 ✓ src/__tests__/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant 1ms
stdout | tests/consolidated/e2e/simplified-restaurants.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/integration/simplified-restaurants.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/integration/simplified-restaurants.test.js > Restaurant Endpoints
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

stdout | tests/consolidated/integration/simplified-restaurants.test.js > Restaurant Endpoints
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389559932-6fkjisbra'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'110ms'[39m,
    date: [32m'Tue, 27 May 2025 23:46:00 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

 × tests/consolidated/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should list restaurants 5ms
   → (0 , getRestaurants) is not a function
 × tests/consolidated/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Listing > should support pagination for restaurants 0ms
   → (0 , getRestaurants) is not a function
 ✓ tests/consolidated/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Creation > should attempt to create a restaurant 0ms
 ✓ tests/consolidated/integration/simplified-restaurants.test.js > Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant 0ms
stdout | tests/integration/places-api.test.js > Google Places API Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ↓ tests/integration/places-api.test.js > Google Places API Integration Tests > Place Search > should find places by search query
 ↓ tests/integration/places-api.test.js > Google Places API Integration Tests > Place Search > should handle empty search results
 ↓ tests/integration/places-api.test.js > Google Places API Integration Tests > Place Details > should retrieve place details by place ID
 ↓ tests/integration/places-api.test.js > Google Places API Integration Tests > Place Details > should handle invalid place ID
 ↓ tests/integration/places-api.test.js > Google Places API Integration Tests > Place Autocomplete > should return autocomplete predictions
 ↓ tests/integration/places-api.test.js > Google Places API Integration Tests > Nearby Search > should find places near a location
 ↓ tests/integration/places-api.test.js > Google Places API Integration Tests > Text Search > should find places by text query
stdout | backup_20250525_155901/_tests_backup/integration/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials
Attempting to login...

stdout | backup_20250525_155901/_tests_backup/integration/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials
Expected login error: { status: [90mundefined[39m, data: [90mundefined[39m }

 × backup_20250525_155901/_tests_backup/integration/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials 35ms
   → Network Error
 × backup_20250525_155901/_tests_backup/integration/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials 10ms
   → expected undefined to be 401 // Object.is equality
 × backup_20250525_155901/_tests_backup/integration/auth-basic.test.js > Basic Authentication > Token Validation > should access protected routes with valid token 8ms
   → Network Error
 × backup_20250525_155901/_tests_backup/integration/auth-basic.test.js > Basic Authentication > Logout > should successfully logout 10ms
   → Network Error
stdout | backup_20250525_155901/e2e/tests/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials
Attempting to login...

stdout | backup_20250525_155901/e2e/tests/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials
Expected login error: { status: [90mundefined[39m, data: [90mundefined[39m }

stdout | src/__tests__/e2e/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials
Attempting to login...

 × backup_20250525_155901/e2e/tests/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials 42ms
   → Network Error
 × backup_20250525_155901/e2e/tests/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials 8ms
   → expected undefined to be 401 // Object.is equality
 × backup_20250525_155901/e2e/tests/auth-basic.test.js > Basic Authentication > Token Validation > should access protected routes with valid token 4ms
   → Network Error
 × backup_20250525_155901/e2e/tests/auth-basic.test.js > Basic Authentication > Logout > should successfully logout 4ms
   → Network Error
stdout | src/__tests__/e2e/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials
Expected login error: { status: [90mundefined[39m, data: [90mundefined[39m }

 × src/__tests__/e2e/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials 39ms
   → Network Error
 × src/__tests__/e2e/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials 12ms
   → expected undefined to be 401 // Object.is equality
 × src/__tests__/e2e/auth-basic.test.js > Basic Authentication > Token Validation > should access protected routes with valid token 4ms
   → Network Error
 × src/__tests__/e2e/auth-basic.test.js > Basic Authentication > Logout > should successfully logout 6ms
   → Network Error
 × tests/unit/hooks/usePlaceResolver.test.jsx > usePlaceResolver > should initialize with default values 17ms
   → expected undefined to deeply equal []
stdout | src/__tests__/integration/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials
Attempting to login...

stdout | tests/consolidated/e2e/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials
Attempting to login...

stdout | src/__tests__/integration/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials
Expected login error: { status: [90mundefined[39m, data: [90mundefined[39m }

stdout | tests/consolidated/e2e/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials
Expected login error: { status: [90mundefined[39m, data: [90mundefined[39m }

 × src/__tests__/integration/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials 47ms
   → Network Error
 × src/__tests__/integration/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials 12ms
   → expected undefined to be 401 // Object.is equality
 × src/__tests__/integration/auth-basic.test.js > Basic Authentication > Token Validation > should access protected routes with valid token 5ms
   → Network Error
 × src/__tests__/integration/auth-basic.test.js > Basic Authentication > Logout > should successfully logout 4ms
   → Network Error
 × tests/consolidated/e2e/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials 41ms
   → Network Error
 × tests/consolidated/e2e/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials 8ms
   → expected undefined to be 401 // Object.is equality
 × tests/consolidated/e2e/auth-basic.test.js > Basic Authentication > Token Validation > should access protected routes with valid token 5ms
   → Network Error
 × tests/consolidated/e2e/auth-basic.test.js > Basic Authentication > Logout > should successfully logout 6ms
   → Network Error
stdout | tests/consolidated/integration/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials
Attempting to login...

stdout | tests/consolidated/integration/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials
Expected login error: { status: [90mundefined[39m, data: [90mundefined[39m }

 × tests/consolidated/integration/auth-basic.test.js > Basic Authentication > Login > should successfully login with valid credentials 55ms
   → Network Error
 × tests/consolidated/integration/auth-basic.test.js > Basic Authentication > Login > should fail login with invalid credentials 7ms
   → expected undefined to be 401 // Object.is equality
 × tests/consolidated/integration/auth-basic.test.js > Basic Authentication > Token Validation > should access protected routes with valid token 4ms
   → Network Error
 × tests/consolidated/integration/auth-basic.test.js > Basic Authentication > Logout > should successfully logout 6ms
   → Network Error
stdout | backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints
API Request: POST http://localhost:5001/api/auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes
API Request: GET http://localhost:5001/api/e2e/dishes

stdout | backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes
Dish listing result: { success: [33mfalse[39m, status: [33m404[39m, count: [32m'N/A'[39m }

stdout | backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes
API Request: GET http://localhost:5001/api/e2e/dishes

stdout | backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes
Paginated dish listing result: { success: [33mfalse[39m, status: [33m404[39m, count: [32m'N/A'[39m }

 ✓ backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes 12ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes 11ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Creation > should attempt to create a dish 1ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish 0ms
 × tests/unit/hooks/usePlaceResolver.test.jsx > usePlaceResolver > should resolve places for semicolon-delimited format items 1023ms
   → Timed out in waitForNextUpdate after 1000ms.
 × tests/unit/hooks/usePlaceResolver.test.jsx > usePlaceResolver > should handle multiple place options for semicolon-delimited format 1014ms
   → Timed out in waitForNextUpdate after 1000ms.
 × tests/unit/hooks/usePlaceResolver.test.jsx > usePlaceResolver > should handle place selection from multiple options for semicolon-delimited format 5ms
   → result.current.setMultipleOptions is not a function
stdout | src/__tests__/e2e/simplified-dishes.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/e2e/simplified-dishes.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | src/__tests__/integration/simplified-dishes.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | src/__tests__/integration/simplified-dishes.test.js > Dish Endpoints
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

stdout | src/__tests__/integration/simplified-dishes.test.js > Dish Endpoints
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389563264-zrrnvu3ad'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'107ms'[39m,
    date: [32m'Tue, 27 May 2025 23:46:03 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

 × src/__tests__/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes 10ms
   → (0 , getDishes) is not a function
 × src/__tests__/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes 1ms
   → (0 , getDishes) is not a function
 ✓ src/__tests__/integration/simplified-dishes.test.js > Dish Endpoints > Dish Creation > should attempt to create a dish 1ms
 ✓ src/__tests__/integration/simplified-dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish 1ms
stdout | tests/consolidated/integration/simplified-dishes.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/integration/simplified-dishes.test.js > Dish Endpoints
Attempting login with: {
  email: [32m'admin@example.com'[39m,
  endpoint: [32m'/auth/login'[39m,
  requestBody: { email: [32m'admin@example.com'[39m, password: [32m'***'[39m }
}

stdout | tests/consolidated/integration/simplified-dishes.test.js > Dish Endpoints
Login response: {
  status: [33m401[39m,
  statusText: [32m'Unauthorized'[39m,
  data: {
    success: [33mfalse[39m,
    error: {
      code: [32m'INVALID_CREDENTIALS'[39m,
      message: [32m'Invalid credentials: Password incorrect.'[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389563603-w9hem6ddf'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'109'[39m,
    etag: [32m'W/"6d-zBKKe1xdaqdNyYC2FOuF/zX0n/Y"'[39m,
    [32m'x-response-time'[39m: [32m'109ms'[39m,
    date: [32m'Tue, 27 May 2025 23:46:03 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

 × tests/consolidated/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should list dishes 6ms
   → (0 , getDishes) is not a function
 × tests/consolidated/integration/simplified-dishes.test.js > Dish Endpoints > Dish Listing > should support pagination for dishes 0ms
   → (0 , getDishes) is not a function
 ✓ tests/consolidated/integration/simplified-dishes.test.js > Dish Endpoints > Dish Creation > should attempt to create a dish 0ms
 ✓ tests/consolidated/integration/simplified-dishes.test.js > Dish Endpoints > Dish Details > should get details for a specific dish 0ms
stdout | src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Performance > should respond within 200ms
Health endpoint response time: 5ms

stdout | backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Performance > should respond within 200ms
Health endpoint response time: 7ms

 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should return a 200 status code 2ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have the correct content type header 1ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a status field with value "UP" 1ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a message field with a non-empty string 1ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a timestamp field with a valid ISO date string 1ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Database Pool Information > should include database pool information 0ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Database Pool Information > should have numeric values for database pool metrics 0ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should include memory usage information 0ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should have numeric values for memory usage metrics 0ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should have reasonable memory usage values 0ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Performance > should respond within 200ms 5ms
 ✓ src/__tests__/e2e/health-detailed.test.js > Detailed API Health Tests > Performance > should handle 10 consecutive requests 36ms
stdout | tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Performance > should respond within 200ms
Health endpoint response time: 16ms

 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Response Structure > should return a 200 status code 2ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have the correct content type header 1ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a status field with value "UP" 1ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a message field with a non-empty string 0ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a timestamp field with a valid ISO date string 0ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Database Pool Information > should include database pool information 0ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Database Pool Information > should have numeric values for database pool metrics 0ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should include memory usage information 0ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should have numeric values for memory usage metrics 0ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should have reasonable memory usage values 0ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Performance > should respond within 200ms 10ms
 ✓ backup_20250525_155901/e2e/tests/health-detailed.test.js > Detailed API Health Tests > Performance > should handle 10 consecutive requests 45ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should return a 200 status code 1ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have the correct content type header 0ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a status field with value "UP" 1ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a message field with a non-empty string 0ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Response Structure > should have a timestamp field with a valid ISO date string 0ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Database Pool Information > should include database pool information 1ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Database Pool Information > should have numeric values for database pool metrics 0ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should include memory usage information 0ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should have numeric values for memory usage metrics 0ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Memory Usage Information > should have reasonable memory usage values 0ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Performance > should respond within 200ms 17ms
 ✓ tests/consolidated/e2e/health-detailed.test.js > Detailed API Health Tests > Performance > should handle 10 consecutive requests 40ms
 × tests/integration/auth.test.js > Authentication API > User Registration > should register a new user 346ms
   → Request failed with status code 500
 × tests/integration/auth.test.js > Authentication API > User Login > should log in an existing user with email 161ms
   → Request failed with status code 401
stdout | tests/e2e/features/bulk-add-semicolon-format.test.js
API Client configured with baseURL: http://localhost:5001/api

 × tests/integration/auth.test.js > Authentication API > User Login > should log in an existing admin user 158ms
   → Request failed with status code 401
 × tests/integration/auth.test.js > Authentication API > User Login > should fail with invalid credentials 7ms
   → expected { success: false, error: { …(2) } } to have property "message"
 ↓ tests/integration/auth.test.js > Authentication API > Token Refresh > should refresh an access token with a valid refresh token
 ↓ tests/integration/auth.test.js > Authentication API > Token Refresh > should fail with an invalid refresh token
 × tests/integration/auth.test.js > Authentication API > Protected Routes > should allow access to protected route with valid token 145ms
   → Request failed with status code 404
 × tests/integration/auth.test.js > Authentication API > Protected Routes > should deny access to protected route without token 9ms
   → expected 404 to be 401 // Object.is equality
stdout | src/__tests__/e2e/features/bulk-add-semicolon-format.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | src/__tests__/e2e/simplified-auth.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Admin login result: { success: [33mfalse[39m, status: [33m401[39m, hasToken: [33mfalse[39m }

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Admin login result: { success: [33mfalse[39m, status: [33m401[39m, hasToken: [33mfalse[39m }

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
API Response: 200 POST /auth/login

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Regular user login result: { success: [33mtrue[39m, status: [33m200[39m, hasToken: [33mtrue[39m }

 ✓ tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials 188ms
stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
API Response: 200 POST /auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Regular user login result: { success: [33mtrue[39m, status: [33m200[39m, hasToken: [33mtrue[39m }

 ✓ backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials 225ms
stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Invalid login result: {
  success: [33mfalse[39m,
  status: [33m401[39m,
  error: [32m'Invalid credentials: User not found.'[39m
}

 ✓ tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials 317ms
stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
API Request: POST http://localhost:5001/api/auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Invalid login result: {
  success: [33mfalse[39m,
  status: [33m401[39m,
  error: [32m'Invalid credentials: User not found.'[39m
}

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user
API Request: POST http://localhost:5001/api/auth/register

stdout | tests/consolidated/e2e/simplified-auth.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/e2e/features/bulk-add-semicolon-format.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
API Response: 200 POST /auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user
Registration result: {
  success: [33mfalse[39m,
  status: [33m500[39m,
  error: [32m'Request failed with status code 500'[39m
}

 ✓ backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials 335ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials 12ms
 ✓ tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials 141ms
 × tests/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user 1ms
   → [API Request] Failed after User Registration attempts: Unknown error
stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
API Request: POST http://localhost:5001/api/auth/login

 × tests/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login 231ms
   → [API Request] Failed after User Logout attempts: Unknown error
stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
API Response: 200 POST /auth/login

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
API Request: POST http://localhost:5001/api/auth/logout

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
API Response: 200 POST /auth/logout

stdout | backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
Logout result: { success: [33mtrue[39m, status: [33m200[39m, error: [90mundefined[39m }

 ✓ backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Registration > should attempt to register a new user 222ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login 215ms
stdout | tests/unit/services/httpService.test.js
[DEBUG][2025-05-27T23:46:06.878Z] Application is running in development mode
[DEBUG][2025-05-27T23:46:06.878Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:46:06.879Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:46:06.879Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:46:06.879Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:46:06.879Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:46:06.879Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/services/httpService.test.js
[DEBUG][2025-05-27T23:46:06.919Z] [OfflineModeHandler] Initialized

stdout | tests/integration/simplified-lists.test.js > Lists API Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ↓ tests/integration/simplified-lists.test.js > Lists API Integration Tests > should create a new list
 ↓ tests/integration/simplified-lists.test.js > Lists API Integration Tests > should get all lists
 ↓ tests/integration/simplified-lists.test.js > Lists API Integration Tests > should get a specific list
 ↓ tests/integration/simplified-lists.test.js > Lists API Integration Tests > should update a list
 ↓ tests/integration/simplified-lists.test.js > Lists API Integration Tests > should delete a list
 ↓ tests/integration/simplified-lists.test.js > Lists API Integration Tests > should handle non-existent list
 ↓ tests/integration/restaurants-direct.test.js > Restaurant API > should fetch all restaurants
 ↓ tests/integration/restaurants-direct.test.js > Restaurant API > should fetch a single restaurant by ID
 ↓ tests/integration/restaurants-direct.test.js > Restaurant API > should search for restaurants
 ↓ tests/integration/restaurants-direct.test.js > Restaurant API > should fetch dishes for a restaurant
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > renders with default props 137ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > renders with custom variant and size 24ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > renders as full width when fullWidth is true 19ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > renders in loading state when isLoading is true 28ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > renders as disabled when disabled is true 27ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > applies custom className 8ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > calls onClick handler when clicked 9ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > does not call onClick handler when disabled 9ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > does not call onClick handler when loading 17ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > renders with correct button type 8ms
 ✓ tests/unit/components/common/buttons/Button.test.jsx > Button Component > passes additional props to button element 17ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-reporter-demo.test.js > API Reporter Demo Tests > Successful API Requests > should demonstrate successful API request reporting 20ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-reporter-demo.test.js > API Reporter Demo Tests > Failed API Requests > should demonstrate failed API request reporting 3ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-reporter-demo.test.js > API Reporter Demo Tests > Authentication Flow > should demonstrate authentication flow reporting 5ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > renders with default props 108ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > renders with different variants 24ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > renders with title 5ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > renders dismissible alert with close button 64ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > calls onDismiss handler when close button is clicked 17ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > hides alert when dismissed 9ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > renders appropriate icon based on variant 12ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > applies custom className 5ms
 ✓ tests/unit/components/common/feedback/Alert.test.jsx > Alert Component > passes additional props to alert element 4ms
 ✓ tests/unit/components/common/forms/Form.test.jsx > Form Component > renders with children 83ms
 ✓ tests/unit/components/common/forms/Form.test.jsx > Form Component > calls onSubmit handler when form is submitted 30ms
 × tests/unit/components/common/forms/Form.test.jsx > Form Component > prevents default form submission behavior 9ms
   → Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.
 × tests/unit/components/common/forms/Form.test.jsx > Form Component > does not call onSubmit when form is disabled 4ms
   → Failed to execute 'dispatchEvent' on 'EventTarget': parameter 1 is not of type 'Event'.
 ✓ tests/unit/components/common/forms/Form.test.jsx > Form Component > applies disabled class when disabled is true 7ms
 ✓ tests/unit/components/common/forms/Form.test.jsx > Form Component > applies custom className 3ms
 ✓ tests/unit/components/common/forms/Form.test.jsx > Form Component > passes additional props to form element 1ms
 ✓ tests/unit/components/common/forms/Form.test.jsx > Form Component > has noValidate attribute 2ms
stdout | tests/integration/auth-flow.test.js > Authentication Flow > should login with admin credentials
Attempting to login with admin credentials...

stdout | tests/integration/auth-flow.test.js > Authentication Flow > should login with admin credentials
Login response: {
  status: [33m200[39m,
  data: {
    success: [33mtrue[39m,
    message: [32m'Login successful.'[39m,
    data: {
      token: [32m'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxMDQsInVzZXJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJhY2NvdW50X3R5cGUiOiJ1c2VyIn0sImlhdCI6MTc0ODM4OTU3MCwiZXhwIjoxNzQ4MzkzMTcwfQ.ADQCI8dKsy7nKUpQkEQ-xwZMRYOXQGvj1wwv_c1VLto'[39m,
      user: [36m[Object][39m
    }
  }
}
Successfully obtained auth token

 ✓ tests/integration/auth-flow.test.js > Authentication Flow > should verify admin credentials 2ms
stdout | tests/integration/auth-flow.test.js > Authentication Flow > should get current user with valid token
Using auth token to fetch current user...

 ✓ tests/integration/auth-flow.test.js > Authentication Flow > should login with admin credentials 170ms
 ✓ tests/integration/auth-flow.test.js > Authentication Flow > should get current user with valid token 10ms
stdout | tests/integration/auth-direct.test.js > Authentication Flow > should handle user registration
Register response: {
  success: [33mfalse[39m,
  error: {
    code: [32m'USERNAME_ALREADY_EXISTS'[39m,
    message: [32m'User already exists with this username.'[39m
  }
}

stdout | tests/integration/auth-direct.test.js > Authentication Flow > should login with existing user
Login response: {
  success: [33mfalse[39m,
  error: {
    code: [32m'INVALID_CREDENTIALS'[39m,
    message: [32m'Invalid credentials: User not found.'[39m
  }
}

stdout | tests/integration/auth-direct.test.js > Authentication Flow > should get current user with valid token
Status response: {
  success: [33mtrue[39m,
  message: [32m'User is not authenticated.'[39m,
  data: { isAuthenticated: [33mfalse[39m }
}

stdout | tests/integration/auth-direct.test.js > Authentication Flow > should logout the user
Logout response: { success: [33mfalse[39m, message: [32m'Authentication token is missing.'[39m }

stdout | tests/integration/auth-direct.test.js > Authentication Flow > should handle invalid token gracefully
Invalid token response: {
  success: [33mtrue[39m,
  message: [32m'User is not authenticated.'[39m,
  data: { isAuthenticated: [33mfalse[39m }
}

 × tests/integration/auth-direct.test.js > Authentication Flow > should handle user registration 33ms
   → expected { …(2) } to have property "code" with value 'USER_ALREADY_EXISTS'
 × tests/integration/auth-direct.test.js > Authentication Flow > should login with existing user 7ms
   → expected 401 to be 200 // Object.is equality
 × tests/integration/auth-direct.test.js > Authentication Flow > should get current user with valid token 6ms
   → expected { isAuthenticated: false } to have property "email" with value 'test@example.com'
 × tests/integration/auth-direct.test.js > Authentication Flow > should logout the user 5ms
   → expected 401 to be 200 // Object.is equality
 ✓ tests/integration/auth-direct.test.js > Authentication Flow > should handle invalid token gracefully 5ms
 × tests/unit/stores/auth/directStore.test.js > Authentication Store - Direct Tests > Basic State Management > should initialize with default values 16ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/directStore.test.js > Authentication Store - Direct Tests > Basic State Management > should update user state 1ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/directStore.test.js > Authentication Store - Direct Tests > Basic State Management > should clear user on logout 0ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/directStore.test.js > Authentication Store - Direct Tests > Token Management > should set and get token 1ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/directStore.test.js > Authentication Store - Direct Tests > Error Handling > should set and clear errors 1ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
stdout | backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint
Health check result: {
  success: [33mfalse[39m,
  status: [90mundefined[39m,
  error: [32m'Network Error'[39m,
  data: [90mundefined[39m,
  context: [32m'Health check'[39m
}

stdout | backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root
API root check result: {
  success: [33mfalse[39m,
  status: [90mundefined[39m,
  error: [32m'Network Error'[39m,
  data: [90mundefined[39m,
  context: [32m'API root check'[39m
}

stdout | backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists
Login endpoint error: { status: [90mundefined[39m, data: [90mundefined[39m, message: [32m'Network Error'[39m }

stdout | backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists
Restaurants endpoint error: { status: [90mundefined[39m, data: [90mundefined[39m, message: [32m'Network Error'[39m }

stdout | backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists
Dishes endpoint error: { status: [90mundefined[39m, data: [90mundefined[39m, message: [32m'Network Error'[39m }

 ✓ backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint 33ms
 ✓ backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root 5ms
 ✓ backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists 5ms
 ✓ backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists 5ms
 ✓ backup_20250525_155901/e2e/tests/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists 12ms
stdout | backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint
Health check result: {
  success: [33mfalse[39m,
  status: [90mundefined[39m,
  error: [32m'__vite_ssr_import_1__.default.get is not a function'[39m,
  data: [90mundefined[39m,
  code: [90mundefined[39m,
  isAxiosError: [90mundefined[39m,
  config: [1mnull[22m
}

stdout | backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root
API root check result: {
  success: [33mfalse[39m,
  status: [90mundefined[39m,
  error: [32m'__vite_ssr_import_1__.default.get is not a function'[39m,
  data: [90mundefined[39m,
  code: [90mundefined[39m,
  isAxiosError: [90mundefined[39m,
  config: [1mnull[22m
}

stdout | backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists
Login endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.post is not a function'[39m
}

stdout | backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists
Restaurants endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.get is not a function'[39m
}

stdout | backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists
Dishes endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.get is not a function'[39m
}

 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint 4ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root 1ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists 1ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists 0ms
 ✓ backup_20250525_155901/_tests_backup/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists 0ms
stdout | src/__tests__/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint
Starting: Health check

stdout | src/__tests__/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root
Starting: API root check

stdout | src/__tests__/e2e/api/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists
Login endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.post is not a function'[39m
}

stdout | src/__tests__/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists
Restaurants endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.get is not a function'[39m
}

stdout | src/__tests__/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists
Dishes endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.get is not a function'[39m
}

 × src/__tests__/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint 9ms
   → API Request Failed: Health check - default.get is not a function
 × src/__tests__/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root 1ms
   → API Request Failed: API root check - default.get is not a function
 ✓ src/__tests__/e2e/api/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists 0ms
 ✓ src/__tests__/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists 0ms
 ✓ src/__tests__/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists 0ms
stdout | tests/consolidated/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint
Starting: Health check

stdout | tests/consolidated/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root
Starting: API root check

stdout | tests/consolidated/e2e/api/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists
Login endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.post is not a function'[39m
}

stdout | tests/consolidated/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists
Restaurants endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.get is not a function'[39m
}

stdout | tests/consolidated/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists
Dishes endpoint error: {
  status: [90mundefined[39m,
  data: [90mundefined[39m,
  message: [32m'__vite_ssr_import_1__.default.get is not a function'[39m
}

 × tests/consolidated/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API health endpoint 6ms
   → API Request Failed: Health check - default.get is not a function
 × tests/consolidated/e2e/api/api-connection.test.js > API Connection > Health Check > should be able to connect to the API root 1ms
   → API Request Failed: API root check - default.get is not a function
 ✓ tests/consolidated/e2e/api/api-connection.test.js > API Connection > Auth Endpoints > should check if login endpoint exists 0ms
 ✓ tests/consolidated/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if restaurants endpoint exists 0ms
 ✓ tests/consolidated/e2e/api/api-connection.test.js > API Connection > Other Endpoints > should check if dishes endpoint exists 0ms
 × tests/unit/stores/auth/storeLogic.test.js > Authentication Store Logic > Initial State > should initialize with default values 8ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/storeLogic.test.js > Authentication Store Logic > User Management > should set and get user 1ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/storeLogic.test.js > Authentication Store Logic > User Management > should clear user on logout 0ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/storeLogic.test.js > Authentication Store Logic > Token Management > should set and get token 1ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/storeLogic.test.js > Authentication Store Logic > Error Handling > should set and clear error 0ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 ✓ tests/unit/components/common/buttons/IconButton.test.jsx > IconButton Component > renders with icon and text 78ms
 ✓ tests/unit/components/common/buttons/IconButton.test.jsx > IconButton Component > renders with icon on the right 10ms
 ✓ tests/unit/components/common/buttons/IconButton.test.jsx > IconButton Component > renders icon-only button 7ms
 ✓ tests/unit/components/common/buttons/IconButton.test.jsx > IconButton Component > renders with tooltip 9ms
 ✓ tests/unit/components/common/buttons/IconButton.test.jsx > IconButton Component > uses text as tooltip for icon-only buttons 4ms
 ✓ tests/unit/components/common/buttons/IconButton.test.jsx > IconButton Component > passes additional props to Button component 4ms
 ✓ tests/unit/components/common/buttons/IconButton.test.jsx > IconButton Component > applies custom className 3ms
 × src/__tests__/integration/simple-restaurant.test.js > Restaurant API Tests > should get a list of restaurants 14ms
   → Request failed with status code 404
 × src/__tests__/integration/simple-restaurant.test.js > Restaurant API Tests > should create a new restaurant 8ms
   → Request failed with status code 404
 × src/__tests__/e2e/simple-restaurant.test.js > Restaurant API Tests > should get a list of restaurants 13ms
   → Request failed with status code 404
 × src/__tests__/e2e/simple-restaurant.test.js > Restaurant API Tests > should create a new restaurant 10ms
   → Request failed with status code 404
 × backup_20250525_155901/_tests_backup/integration/simple-restaurant.test.js > Restaurant API Tests > should get a list of restaurants 21ms
   → Request failed with status code 404
 × backup_20250525_155901/_tests_backup/integration/simple-restaurant.test.js > Restaurant API Tests > should create a new restaurant 7ms
   → Request failed with status code 404
 × backup_20250525_155901/e2e/tests/simple-restaurant.test.js > Restaurant API Tests > should get a list of restaurants 96ms
   → Request failed with status code 404
 × backup_20250525_155901/e2e/tests/simple-restaurant.test.js > Restaurant API Tests > should create a new restaurant 9ms
   → Request failed with status code 404
 × tests/consolidated/e2e/simple-restaurant.test.js > Restaurant API Tests > should get a list of restaurants 10ms
   → Request failed with status code 404
 × tests/consolidated/e2e/simple-restaurant.test.js > Restaurant API Tests > should create a new restaurant 9ms
   → Request failed with status code 404
 ✓ tests/unit/services/dishService.test.js > Dish Service Backward Compatibility > should delegate getDishDetails to the modular dish service 4ms
 ✓ tests/unit/services/dishService.test.js > Dish Service Backward Compatibility > should delegate searchDishes to the modular dish service 1ms
 ✓ tests/unit/services/dishService.test.js > Dish Service Backward Compatibility > should delegate getDishesByRestaurantId to the modular dish service 0ms
 ✓ tests/unit/services/dishService.test.js > Dish Service Backward Compatibility > should export the dishService as both named and default export 0ms
stdout | src/__tests__/unit/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should parse semicolon-delimited input with hashtags
[INFO][2025-05-27T23:46:14.442Z] [parseInputText] Processing 5 lines of input

stdout | src/__tests__/unit/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should handle malformed input
[INFO][2025-05-27T23:46:14.445Z] [parseInputText] Processing 1 lines of input

 ✓ src/__tests__/unit/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should parse semicolon-delimited input with hashtags 3ms
 ✓ src/__tests__/unit/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should handle empty input 0ms
 ✓ src/__tests__/unit/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should handle malformed input 0ms
stdout | tests/unit/utils/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should parse semicolon-delimited input with hashtags
[INFO][2025-05-27T23:46:14.519Z] [parseInputText] Processing 5 lines of input

stdout | tests/unit/utils/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should handle malformed input
[INFO][2025-05-27T23:46:14.524Z] [parseInputText] Processing 1 lines of input

 ✓ tests/unit/utils/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should parse semicolon-delimited input with hashtags 6ms
 ✓ tests/unit/utils/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should handle empty input 0ms
 ✓ tests/unit/utils/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should handle malformed input 0ms
 × tests/consolidated/integration/simple-restaurant.test.js > Restaurant API Tests > should get a list of restaurants 14ms
   → Request failed with status code 404
 × tests/consolidated/integration/simple-restaurant.test.js > Restaurant API Tests > should create a new restaurant 10ms
   → Request failed with status code 404
 ✓ tests/unit/stores/auth/simpleStore.test.js > Simple Store Test > should initialize with default values 5ms
 ✓ tests/unit/stores/auth/simpleStore.test.js > Simple Store Test > should set and get user 5ms
 ✓ tests/unit/stores/auth/simpleStore.test.js > Simple Store Test > should clear user on logout 0ms
 ✓ tests/unit/stores/auth/simpleStore.test.js > Simple Store Test > should set and get token 0ms
 ✓ tests/unit/stores/auth/simpleStore.test.js > Simple Store Test > should set and clear errors 0ms
stdout | src/components/QuickAddFlow.test.jsx
[DEBUG][2025-05-27T23:46:16.360Z] Application is running in development mode
[DEBUG][2025-05-27T23:46:16.361Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:46:16.361Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:46:16.361Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:46:16.361Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:46:16.361Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:46:16.361Z] API Retry Delay (ms): [33m1000[39m

stdout | src/components/QuickAddFlow.test.jsx
[DEBUG][2025-05-27T23:46:16.391Z] [OfflineModeHandler] Initialized

stdout | backup_20250525_155901/src/components/QuickAddFlow.test.jsx
[DEBUG][2025-05-27T23:46:16.840Z] Application is running in development mode
[DEBUG][2025-05-27T23:46:16.841Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-27T23:46:16.841Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-27T23:46:16.841Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-27T23:46:16.841Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-27T23:46:16.841Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-27T23:46:16.841Z] API Retry Delay (ms): [33m1000[39m

stdout | backup_20250525_155901/src/components/QuickAddFlow.test.jsx
[DEBUG][2025-05-27T23:46:16.870Z] [OfflineModeHandler] Initialized

 × tests/unit/stores/auth/useAuthenticationStore.simple.test.js > useAuthenticationStore > checkAuthStatus > should initialize with default values 9ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/useAuthenticationStore.simple.test.js > useAuthenticationStore > checkAuthStatus > should set user on login 1ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
 × tests/unit/stores/auth/useAuthenticationStore.simple.test.js > useAuthenticationStore > checkAuthStatus > should clear user on logout 0ms
   → Cannot read properties of null (reading 'useSyncExternalStore')
stdout | src/__tests__/integration/simplified-health.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status
API Request: GET http://localhost:5001/api/health

stdout | tests/consolidated/integration/simplified-health.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | src/__tests__/integration/simplified-health.test.js > Health Endpoint
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:17.330Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76513280[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27282584[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4390088[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:17 GMT'[39m,
    etag: [32m'W/"104-EDgmqJmwwHAJYOZQckOuT4AerHc"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389577330-y3lte9w7z'[39m,
    [32m'x-response-time'[39m: [32m'1ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | src/__tests__/integration/simplified-health.test.js > Health Endpoint
Health check result: {
  success: [33mtrue[39m,
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:17.330Z'[39m,
  databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m76513280[39m,
    heapTotal: [33m31784960[39m,
    heapUsed: [33m27282584[39m,
    external: [33m3765475[39m,
    arrayBuffers: [33m4390088[39m
  }
}

 ✓ src/__tests__/integration/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status 3ms
 ✓ src/__tests__/integration/simplified-health.test.js > Health Endpoint > should include database pool information 1ms
 ✓ src/__tests__/integration/simplified-health.test.js > Health Endpoint > should include memory usage information 1ms
 ✓ src/__tests__/integration/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms) 0ms
stdout | tests/consolidated/integration/simplified-health.test.js > Health Endpoint
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:17.349Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76529664[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27449024[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4390088[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:17 GMT'[39m,
    etag: [32m'W/"104-+4mkmpoe0NJKaJG9R1ROXjjsFwc"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389577349-ey0yhfw8s'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | tests/consolidated/integration/simplified-health.test.js > Health Endpoint
Health check result: {
  success: [33mtrue[39m,
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:17.349Z'[39m,
  databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m76529664[39m,
    heapTotal: [33m31784960[39m,
    heapUsed: [33m27449024[39m,
    external: [33m3765475[39m,
    arrayBuffers: [33m4390088[39m
  }
}

 ✓ tests/consolidated/integration/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status 2ms
 ✓ tests/consolidated/integration/simplified-health.test.js > Health Endpoint > should include database pool information 1ms
 ✓ tests/consolidated/integration/simplified-health.test.js > Health Endpoint > should include memory usage information 1ms
 ✓ tests/consolidated/integration/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms) 0ms
stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status
API Response: 200 GET /health

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status
Health check result: {
  success: [33mtrue[39m,
  status: [33m200[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:17.348Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76529664[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27369664[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4390088[39m
    }
  },
  headers: Object [AxiosHeaders] {
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389577317-5fsfw11mo'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    etag: [32m'W/"104-79kU8md64i9SHtGE8Elz4+k8bdY"'[39m,
    [32m'x-response-time'[39m: [32m'1ms'[39m,
    date: [32m'Tue, 27 May 2025 23:46:17 GMT'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m
  }
}

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should include database pool information
API Request: GET http://localhost:5001/api/health

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should include database pool information
API Response: 200 GET /health

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should include memory usage information
API Request: GET http://localhost:5001/api/health

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should include memory usage information
API Response: 200 GET /health

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms)
API Request: GET http://localhost:5001/api/health

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms)
API Response: 200 GET /health

stdout | backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms)
Health endpoint response time: 6ms

 ✓ backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status 58ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should include database pool information 11ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should include memory usage information 6ms
 ✓ backup_20250525_155901/_tests_backup/integration/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms) 6ms
stdout | src/__tests__/e2e/simplified-health.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:17.762Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76775424[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27285592[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:17 GMT'[39m,
    etag: [32m'W/"104-5X9f/gZbVLF8FjlKLFZUDdRlhFg"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389577762-xf56k7qyk'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status
Health check result: {
  success: [33mtrue[39m,
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:17.762Z'[39m,
  databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m76775424[39m,
    heapTotal: [33m31784960[39m,
    heapUsed: [33m27285592[39m,
    external: [33m3765475[39m,
    arrayBuffers: [33m4384785[39m
  }
}

stdout | src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should include database pool information
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:17.778Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76775424[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27369200[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:17 GMT'[39m,
    etag: [32m'W/"104-b8UkGcnjqiUALZXz/pQPKyDi3Dw"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389577778-u8et6v0d6'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should include memory usage information
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:17.783Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76791808[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27448288[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:17 GMT'[39m,
    etag: [32m'W/"104-/TMSiZCLSCC1/hLzSokdHhANmCw"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389577783-5uyqxpn2j'[39m,
    [32m'x-response-time'[39m: [32m'1ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms)
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:17.788Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76791808[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27527592[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:17 GMT'[39m,
    etag: [32m'W/"104-cU0zBPa50J7MM8P4h7TrSZlK9tQ"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389577787-2gw6q4e7s'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms)
Health endpoint response time: 3ms

 × src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status 26ms
   → expected 'UP' to be 200 // Object.is equality
 × src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should include database pool information 7ms
   → Cannot convert undefined or null to object
 × src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should include memory usage information 4ms
   → Cannot convert undefined or null to object
 ✓ src/__tests__/e2e/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms) 3ms
stdout | tests/consolidated/e2e/simplified-health.test.js
API Client configured with baseURL: http://localhost:5001/api

stdout | tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:18.260Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m76808192[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27614528[39m,
      external: [33m3765475[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:18 GMT'[39m,
    etag: [32m'W/"104-mJ/+fpnkucOmklJ1764mfYzyCYA"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389578260-h6qd9qia8'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status
Health check result: {
  success: [33mtrue[39m,
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:18.260Z'[39m,
  databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m76808192[39m,
    heapTotal: [33m31784960[39m,
    heapUsed: [33m27614528[39m,
    external: [33m3765475[39m,
    arrayBuffers: [33m4384785[39m
  }
}

stdout | tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should include database pool information
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:18.301Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m77037568[39m,
      heapTotal: [33m32833536[39m,
      heapUsed: [33m27345400[39m,
      external: [33m3760172[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:18 GMT'[39m,
    etag: [32m'W/"104-TQkVogSvSDG6XuOjH41/T5NVyjg"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389578301-092wk1g6l'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should include memory usage information
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:18.310Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m77053952[39m,
      heapTotal: [33m32833536[39m,
      heapUsed: [33m27424552[39m,
      external: [33m3760172[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:18 GMT'[39m,
    etag: [32m'W/"104-4KRvMD+bkFpWFDM0ajIlIPS3r9M"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389578310-uatdt84u7'[39m,
    [32m'x-response-time'[39m: [32m'0ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms)
Health check response: {
  status: [33m200[39m,
  statusText: [32m'OK'[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:18.315Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m77053952[39m,
      heapTotal: [33m32833536[39m,
      heapUsed: [33m27503904[39m,
      external: [33m3760172[39m,
      arrayBuffers: [33m4384785[39m
    }
  },
  headers: {
    [32m'access-control-allow-credentials'[39m: [32m'true'[39m,
    connection: [32m'keep-alive'[39m,
    [32m'content-length'[39m: [32m'260'[39m,
    [32m'content-security-policy'[39m: [32m"default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"[39m,
    [32m'content-type'[39m: [32m'application/json; charset=utf-8'[39m,
    [32m'cross-origin-opener-policy'[39m: [32m'same-origin'[39m,
    [32m'cross-origin-resource-policy'[39m: [32m'same-origin'[39m,
    date: [32m'Tue, 27 May 2025 23:46:18 GMT'[39m,
    etag: [32m'W/"104-kYRytPPpMGHQlUmUMqwjsZSg8hQ"'[39m,
    [32m'keep-alive'[39m: [32m'timeout=5'[39m,
    [32m'origin-agent-cluster'[39m: [32m'?1'[39m,
    [32m'referrer-policy'[39m: [32m'no-referrer'[39m,
    [32m'strict-transport-security'[39m: [32m'max-age=31536000; includeSubDomains'[39m,
    vary: [32m'Origin, Accept-Encoding'[39m,
    [32m'x-content-type-options'[39m: [32m'nosniff'[39m,
    [32m'x-dns-prefetch-control'[39m: [32m'off'[39m,
    [32m'x-download-options'[39m: [32m'noopen'[39m,
    [32m'x-frame-options'[39m: [32m'SAMEORIGIN'[39m,
    [32m'x-permitted-cross-domain-policies'[39m: [32m'none'[39m,
    [32m'x-request-id'[39m: [32m'req-1748389578315-ci0j3z96g'[39m,
    [32m'x-response-time'[39m: [32m'1ms'[39m,
    [32m'x-xss-protection'[39m: [32m'0'[39m
  }
}

stdout | tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms)
Health endpoint response time: 4ms

 × tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should return a 200 status code and UP status 64ms
   → expected 'UP' to be 200 // Object.is equality
 × tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should include database pool information 11ms
   → Cannot convert undefined or null to object
 × tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should include memory usage information 4ms
   → Cannot convert undefined or null to object
 ✓ tests/consolidated/e2e/simplified-health.test.js > Health Endpoint > should respond quickly (under 200ms) 5ms
 × backup_20250525_155901/e2e/tests/api-health.test.js > API Health > Health Endpoint > should return a 200 status code and UP status 60ms
   → Network Error
 × backup_20250525_155901/e2e/tests/api-health.test.js > API Health > Health Endpoint > should include database pool information 11ms
   → Network Error
 × backup_20250525_155901/e2e/tests/api-health.test.js > API Health > Health Endpoint > should include memory usage information 13ms
   → Network Error
 × src/__tests__/e2e/api-health.test.js > API Health > Health Endpoint > should return a 200 status code and UP status 43ms
   → Network Error
 × src/__tests__/e2e/api-health.test.js > API Health > Health Endpoint > should include database pool information 9ms
   → Network Error
 × src/__tests__/e2e/api-health.test.js > API Health > Health Endpoint > should include memory usage information 5ms
   → Network Error
stdout | tests/unit/health.test.js
Test configuration loaded

stdout | tests/unit/health.test.js > API health check
Running health check test...
API Base URL: http://localhost:5001/api

stdout | tests/unit/health.test.js > API health check
Health check response status: [33m200[39m
Health check response data: {
  "status": "UP",
  "message": "Backend is healthy and running!",
  "timestamp": "2025-05-27T23:46:18.804Z",
  "databasePool": {
    "total": 0,
    "idle": 0,
    "waiting": 0
  },
  "memoryUsage": {
    "rss": 77070336,
    "heapTotal": 32833536,
    "heapUsed": 27591288,
    "external": 3768364,
    "arrayBuffers": 4392977
  }
}
Database pool stats: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m }
Memory usage: {
  rss: [33m77070336[39m,
  heapTotal: [33m32833536[39m,
  heapUsed: [33m27591288[39m,
  external: [33m3768364[39m,
  arrayBuffers: [33m4392977[39m
}

 ✓ tests/unit/health.test.js > API health check 46ms
 × tests/consolidated/e2e/api-health.test.js > API Health > Health Endpoint > should return a 200 status code and UP status 46ms
   → Network Error
 × tests/consolidated/e2e/api-health.test.js > API Health > Health Endpoint > should include database pool information 10ms
   → Network Error
 × tests/consolidated/e2e/api-health.test.js > API Health > Health Endpoint > should include memory usage information 4ms
   → Network Error
stdout | backup_20250525_155901/_tests_backup/e2e/api/health-check.test.js > Health Check > should be able to connect to the API health endpoint
Attempting to connect to health endpoint...

stdout | backup_20250525_155901/_tests_backup/e2e/api/health-check.test.js > Health Check > should be able to connect to the API health endpoint
Health endpoint response status: 200

 ✓ backup_20250525_155901/_tests_backup/e2e/api/health-check.test.js > Health Check > should be able to connect to the API health endpoint 73ms
 ✓ tests/unit/api/health.test.js > API Health Check (Vitest) > should return 200 and server status 54ms
 ✓ tests/unit/api/health.test.js > API Health Check (Vitest) > should return database connection status 6ms
 ✓ tests/unit/api/health.test.js > API Health Check (Vitest) > should include memory usage information 5ms
 ✓ tests/api/health.test.js > API Health Check > should return 200 and server status 54ms
 ✓ tests/api/health.test.js > API Health Check > should return database connection status 9ms
 ✓ tests/api/health.test.js > API Health Check > should include memory usage information 7ms
stdout | tests/integration/basic-health.test.js > Basic Health Check > should return 200 from /health endpoint
Health check response: {
  status: [33m200[39m,
  data: {
    status: [32m'UP'[39m,
    message: [32m'Backend is healthy and running!'[39m,
    timestamp: [32m'2025-05-27T23:46:20.818Z'[39m,
    databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
    memoryUsage: {
      rss: [33m77447168[39m,
      heapTotal: [33m31784960[39m,
      heapUsed: [33m27969088[39m,
      external: [33m3768364[39m,
      arrayBuffers: [33m4392977[39m
    }
  }
}

 ✓ tests/integration/basic-health.test.js > Basic Health Check > should return 200 from /health endpoint 56ms
 ↓ tests/integration/basic-health.test.js > Basic Health Check > should handle non-existent endpoint
stdout | backup_20250525_155901/e2e/tests/basic-health.test.js > Basic Health Check > should be able to connect to the API health endpoint
Attempting to connect to health endpoint...

 × backup_20250525_155901/e2e/tests/basic-health.test.js > Basic Health Check > should be able to connect to the API health endpoint 40ms
   → Network Error
stdout | src/__tests__/e2e/basic-health.test.js > Basic Health Check > should be able to connect to the API health endpoint
Attempting to connect to health endpoint...

 × src/__tests__/e2e/basic-health.test.js > Basic Health Check > should be able to connect to the API health endpoint 55ms
   → Network Error
stdout | tests/consolidated/e2e/basic-health.test.js > Basic Health Check > should be able to connect to the API health endpoint
Attempting to connect to health endpoint...

 × tests/consolidated/e2e/basic-health.test.js > Basic Health Check > should be able to connect to the API health endpoint 44ms
   → Network Error
 × tests/integration/health.test.js > API Health Check > should return a successful health check response 17ms
   → expected { status: 'UP', …(4) } to have property "status" with value 'ok'
 × tests/integration/health.test.js > API Health Check > should return the current server time 20ms
   → Request failed with status code 404
stdout | backup_20250525_155901/e2e/tests/health-check.test.js > Health Check > should be able to connect to the API health endpoint
Attempting to connect to health endpoint...

 × backup_20250525_155901/e2e/tests/health-check.test.js > Health Check > should be able to connect to the API health endpoint 60ms
   → Network Error
stdout | src/__tests__/e2e/health-check.test.js > Health Check > should be able to connect to the API health endpoint
Attempting to connect to health endpoint...

 × src/__tests__/e2e/health-check.test.js > Health Check > should be able to connect to the API health endpoint 44ms
   → Network Error
stdout | tests/consolidated/e2e/health-check.test.js > Health Check > should be able to connect to the API health endpoint
Attempting to connect to health endpoint...

 × tests/consolidated/e2e/health-check.test.js > Health Check > should be able to connect to the API health endpoint 47ms
   → Network Error
stdout | tests/simple-health-check.test.js > Direct API health check
Testing API health at: http://localhost:5001/api/health

stdout | tests/simple-health-check.test.js > Direct API health check
Response status: [33m200[39m
Response data: {
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:22.712Z'[39m,
  databasePool: { total: [33m1[39m, idle: [33m1[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m77742080[39m,
    heapTotal: [33m31784960[39m,
    heapUsed: [33m28067728[39m,
    external: [33m3773375[39m,
    arrayBuffers: [33m4397495[39m
  }
}

 ✓ tests/simple-health-check.test.js > Direct API health check 55ms
stdout | tests/unit/simple-health.test.js > Direct API health check
Testing API health at: http://localhost:5001/api/health

stdout | tests/unit/simple-health.test.js > Direct API health check
Response status: [33m200[39m
Response data: {
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:22.808Z'[39m,
  databasePool: { total: [33m1[39m, idle: [33m1[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m77758464[39m,
    heapTotal: [33m31784960[39m,
    heapUsed: [33m28152312[39m,
    external: [33m3773375[39m,
    arrayBuffers: [33m4397495[39m
  }
}

 ✓ tests/unit/simple-health.test.js > Direct API health check 46ms
stdout | tests/integration/health-check-direct.test.js > Health Check Endpoint > should return 200 and healthy status
Health check passed: {
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:23.296Z'[39m,
  databasePool: { total: [33m1[39m, idle: [33m1[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m77758464[39m,
    heapTotal: [33m31784960[39m,
    heapUsed: [33m28238128[39m,
    external: [33m3773375[39m,
    arrayBuffers: [33m4397495[39m
  }
}

 ✓ tests/integration/health-check-direct.test.js > Health Check Endpoint > should return 200 and healthy status 90ms
 ✓ tests/unit/stores/auth/basic.test.js > Basic Zustand Store > should create a store with initial state 1ms
 × src/test/health.test.js > API Health Check > should return 200 and server status 39ms
   → expected { status: 'UP', …(4) } to have property "status" with value 'ok'
 × src/test/health.test.js > API Health Check > should return database connection status 5ms
   → expected { status: 'UP', …(4) } to have property "database"
stdout | tests/quick-health-check.test.ts > API health check
Health check response: {
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-27T23:46:23.589Z'[39m,
  databasePool: { total: [33m1[39m, idle: [33m1[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m78970880[39m,
    heapTotal: [33m32833536[39m,
    heapUsed: [33m28168816[39m,
    external: [33m3772882[39m,
    arrayBuffers: [33m4393327[39m
  }
}

 ✓ tests/quick-health-check.test.ts > API health check 33ms

 Test Files  218 failed | 42 passed (260)
      Tests  171 failed | 389 passed | 151 skipped (711)
   Start at  19:45:25
   Duration  58.57s (transform 2.79s, setup 96.54s, collect 18.86s, tests 25.22s, environment 174.01s, prepare 26.68s)

