
Update: Tool calls no longer cost credits after April 21.
Status: Loading
Running terminal command
~/Downloads/doof $ npm test


> chomp-clean@0.0.0 test
> npm run test:unit && npm run test:integration


> chomp-clean@0.0.0 test:unit
> vitest --config vitest.config.js

 Vitest  "deps.inline" is deprecated. If you rely on vite-node directly, use "server.deps.inline" instead. Otherwise, consider using "deps.optimizer.web.include"

 RUN  v3.1.4 /Users/naf/Downloads/doof

stdout | tests/unit/stores/auth/useRegistrationStore.test.js
Test environment variables configured

stdout | tests/integration/simplified-health.test.js
Test environment variables configured

stdout | tests/unit/services/dish/index.test.js
Test environment variables configured

stdout | tests/unit/services/dish/DishReviewService.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js
Test environment variables configured

stdout | tests/integration/stores/auth/authStoresIntegration.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/useUserProfileStore.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/useUserProfileStore.test.js
[DEBUG][2025-05-26T23:15:54.682Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:54.682Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:54.682Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.682Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.682Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.682Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:54.682Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/stores/auth/useRegistrationStore.test.js
[DEBUG][2025-05-26T23:15:54.682Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:54.682Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:54.682Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.682Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.682Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.682Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:54.682Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/integration/stores/auth/authStoresIntegration.test.js
[DEBUG][2025-05-26T23:15:54.682Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:54.683Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:54.683Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.683Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.683Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.683Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:54.683Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js
[DEBUG][2025-05-26T23:15:54.683Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:54.683Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:54.683Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.683Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.683Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:54.684Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:54.684Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/stores/auth/useRegistrationStore.test.js
[DEBUG][2025-05-26T23:15:54.726Z] [DevelopmentModeHandler] Initialized

stdout | tests/integration/stores/auth/authStoresIntegration.test.js
[DEBUG][2025-05-26T23:15:54.726Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/stores/auth/useUserProfileStore.test.js
[DEBUG][2025-05-26T23:15:54.726Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js
[DEBUG][2025-05-26T23:15:54.726Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/stores/auth/useAuthenticationStore.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/useRegistrationStore.test.js
[DEBUG][2025-05-26T23:15:54.762Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:54.762Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:54.762Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:54.763Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:54.763Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:54.763Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/integration/stores/auth/authStoresIntegration.test.js
[DEBUG][2025-05-26T23:15:54.762Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:54.762Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:54.762Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:54.764Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:54.764Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:54.764Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/stores/auth/useAuthSessionStore.test.js
[DEBUG][2025-05-26T23:15:54.761Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:54.762Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:54.762Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:54.763Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:54.763Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:54.764Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/stores/auth/useUserProfileStore.test.js
[DEBUG][2025-05-26T23:15:54.765Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:54.765Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:54.766Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:54.768Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:54.769Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:54.769Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

 ❯ tests/unit/stores/auth/useAuthenticationStore.test.js (13 tests | 13 failed) 21ms
   × useAuthenticationStore > checkAuthStatus > should return true when user is already authenticated and cache is valid 15ms
     → Target container is not a DOM element.
   × useAuthenticationStore > checkAuthStatus > should call API when cache is expired 1ms
     → Target container is not a DOM element.
   × useAuthenticationStore > checkAuthStatus > should handle API error and set unauthenticated state 1ms
     → Target container is not a DOM element.
   × useAuthenticationStore > checkAuthStatus > should handle network error and keep existing session if authenticated 1ms
     → Target container is not a DOM element.
   × useAuthenticationStore > login > should successfully login and update state 1ms
     → Target container is not a DOM element.
   × useAuthenticationStore > login > should handle login failure and set error state 0ms
     → Target container is not a DOM element.
   × useAuthenticationStore > login > should handle API errors during login 0ms
     → Target container is not a DOM element.
   × useAuthenticationStore > logout > should clear authentication state and storage on logout 0ms
     → Target container is not a DOM element.
   × useAuthenticationStore > logout > should clear state even if logout API call fails 1ms
     → Target container is not a DOM element.
   × useAuthenticationStore > getters > should return current user 0ms
     → Target container is not a DOM element.
   × useAuthenticationStore > getters > should return authentication status 0ms
     → Target container is not a DOM element.
   × useAuthenticationStore > getters > should return loading status 0ms
     → Target container is not a DOM element.
   × useAuthenticationStore > getters > should return token 0ms
     → Target container is not a DOM element.
stdout | tests/integration/restaurants/bulkAdd.test.jsx
Test environment variables configured

stdout | tests/unit/services/dish/DishSearchService.test.js
Test environment variables configured

stdout | tests/integration/dishes.test.js
Test environment variables configured

stdout | tests/integration/restaurants.test.js
Test environment variables configured

stdout | tests/unit/services/dish/DishCrudService.test.js
Test environment variables configured

stdout | tests/unit/services/dish/DishIngredientService.test.js
Test environment variables configured

stdout | tests/unit/auth/services/authService.test.js
Test environment variables configured

stdout | tests/unit/auth/services/authService.test.js
[DEBUG][2025-05-26T23:15:56.149Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:56.149Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:56.149Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.149Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.149Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.149Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:56.149Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/auth/services/authService.test.js
[DEBUG][2025-05-26T23:15:56.169Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/auth/services/authService.test.js
[DEBUG][2025-05-26T23:15:56.180Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:56.180Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:56.180Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:56.181Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:56.181Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:56.181Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/auth/services/authService.test.js
[DEBUG][2025-05-26T23:15:56.232Z] [tokenRefresher] Token refresh interceptor initialized

stdout | tests/unit/stores/auth/useSuperuserStore.test.js
Test environment variables configured

stdout | tests/integration/auth/authFlow.test.jsx
Test environment variables configured

stdout | tests/integration/search.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/useSuperuserStore.test.js
[DEBUG][2025-05-26T23:15:56.653Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:56.653Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:56.653Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.653Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.653Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.653Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:56.654Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/stores/auth/useSuperuserStore.test.js
[DEBUG][2025-05-26T23:15:56.664Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/auth/context/AuthContext.test.jsx
Test environment variables configured

stdout | tests/unit/stores/auth/useSuperuserStore.test.js
[DEBUG][2025-05-26T23:15:56.674Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:56.674Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:56.674Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:56.675Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:56.676Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:56.676Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/services/http/OfflineModeHandler.test.js
Test environment variables configured

stdout | tests/integration/auth/offline/offlineAuth.test.jsx
Test environment variables configured

stdout | tests/integration/auth/authFlow.test.jsx
[DEBUG][2025-05-26T23:15:56.921Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:56.922Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:56.922Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.922Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.922Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:56.922Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:56.922Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/integration/auth/authFlow.test.jsx
[DEBUG][2025-05-26T23:15:56.932Z] [DevelopmentModeHandler] Initialized

stdout | tests/integration/auth/authFlow.test.jsx
[DEBUG][2025-05-26T23:15:56.941Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:56.942Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:56.942Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:56.942Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:56.942Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:56.942Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/integration/auth/authFlow.test.jsx
[DEBUG][2025-05-26T23:15:56.951Z] [tokenRefresher] Token refresh interceptor initialized

stdout | tests/unit/auth/context/AuthContext.test.jsx
[DEBUG][2025-05-26T23:15:57.004Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:57.004Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:57.004Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:57.004Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:57.004Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:57.004Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:57.004Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/auth/context/AuthContext.test.jsx
[DEBUG][2025-05-26T23:15:57.020Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/auth/context/AuthContext.test.jsx
[DEBUG][2025-05-26T23:15:57.026Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:57.026Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:57.026Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:57.027Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:57.027Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:57.027Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/auth/context/AuthContext.test.jsx
[DEBUG][2025-05-26T23:15:57.039Z] [tokenRefresher] Token refresh interceptor initialized

stdout | tests/unit/services/http/LoadingStateManager.test.js
Test environment variables configured

stdout | tests/integration/quick-adds.test.js
Test environment variables configured

stdout | tests/unit/auth/hooks/useAuthRedirect.test.jsx
Test environment variables configured

stdout | tests/unit/auth/components/ProtectedRoute.test.jsx
Test environment variables configured

stdout | tests/integration/quick-adds.test.js > Quick Adds Integration Tests
API Request: POST http://localhost:5001/api/auth/login

stdout | tests/unit/services/http/ApiClientFactory.test.js
Test environment variables configured

stdout | tests/integration/health-check.test.js
Test environment variables configured

 ❯ tests/integration/quick-adds.test.js (10 tests | 10 skipped) 25ms
   ↓ Quick Adds Integration Tests > Creating Quick Adds > should create a new quick add
   ↓ Quick Adds Integration Tests > Creating Quick Adds > should require a valid list ID
   ↓ Quick Adds Integration Tests > Creating Quick Adds > should validate required fields
   ↓ Quick Adds Integration Tests > Retrieving Quick Adds > should retrieve quick adds for a list
   ↓ Quick Adds Integration Tests > Retrieving Quick Adds > should filter quick adds by tag
   ↓ Quick Adds Integration Tests > Updating Quick Adds > should update a quick add
   ↓ Quick Adds Integration Tests > Updating Quick Adds > should validate updates
   ↓ Quick Adds Integration Tests > Deleting Quick Adds > should delete a quick add
   ↓ Quick Adds Integration Tests > Deleting Quick Adds > should handle deleting non-existent quick adds
   ↓ Quick Adds Integration Tests > Quick Add Limits > should enforce the maximum number of quick adds (50) per list
stdout | tests/unit/auth/hooks/useAuthRedirect.test.jsx
[DEBUG][2025-05-26T23:15:58.104Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:58.104Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:58.105Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.105Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.105Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.105Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:58.105Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/auth/hooks/useAuthRedirect.test.jsx
[DEBUG][2025-05-26T23:15:58.125Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/auth/components/ProtectedRoute.test.jsx
[DEBUG][2025-05-26T23:15:58.128Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:58.129Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:58.129Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.129Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.129Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.129Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:58.129Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/auth/hooks/useAuthRedirect.test.jsx
[DEBUG][2025-05-26T23:15:58.135Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:58.135Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:58.135Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:58.137Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:58.137Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:58.138Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/auth/components/ProtectedRoute.test.jsx
[DEBUG][2025-05-26T23:15:58.152Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/auth/hooks/useAuthRedirect.test.jsx
[DEBUG][2025-05-26T23:15:58.154Z] [tokenRefresher] Token refresh interceptor initialized

stdout | tests/unit/auth/components/ProtectedRoute.test.jsx
[DEBUG][2025-05-26T23:15:58.155Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:58.155Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:58.155Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:58.156Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:58.156Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:58.156Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/services/http/ApiClientFactory.test.js
[DEBUG][2025-05-26T23:15:58.160Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:58.160Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:58.160Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.160Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.160Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:58.160Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:58.160Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/auth/components/ProtectedRoute.test.jsx
[DEBUG][2025-05-26T23:15:58.164Z] [tokenRefresher] Token refresh interceptor initialized

stdout | tests/unit/services/http/ApiClientFactory.test.js
[DEBUG][2025-05-26T23:15:58.174Z] [DevelopmentModeHandler] Initialized

stdout | tests/integration/list-follows.test.js
Test environment variables configured

stdout | tests/integration/neighborhoods.test.js
Test environment variables configured

stdout | tests/unit/services/http/ErrorInterceptor.test.js
Test environment variables configured

stdout | tests/integration/list-follows.test.js > List Follows/Unfollows Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ❯ tests/integration/list-follows.test.js (10 tests | 10 skipped) 19ms
   ↓ List Follows/Unfollows Integration Tests > Following Lists > should follow a public list
   ↓ List Follows/Unfollows Integration Tests > Following Lists > should not allow following the same list twice
   ↓ List Follows/Unfollows Integration Tests > Following Lists > should appear in user's followed lists
   ↓ List Follows/Unfollows Integration Tests > Unfollowing Lists > should unfollow a list
   ↓ List Follows/Unfollows Integration Tests > Unfollowing Lists > should not be in user's followed lists after unfollowing
   ↓ List Follows/Unfollows Integration Tests > Unfollowing Lists > should handle unfollowing a not-followed list gracefully
   ↓ List Follows/Unfollows Integration Tests > List Followers > should get list of followers
   ↓ List Follows/Unfollows Integration Tests > List Followers > should return empty array for list with no followers
   ↓ List Follows/Unfollows Integration Tests > Private Lists > should not allow following a private list without permission
   ↓ List Follows/Unfollows Integration Tests > Follow Counts > should update follow count when following/unfollowing
stdout | tests/integration/neighborhoods.test.js > Neighborhoods and Zip Codes Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ❯ tests/integration/neighborhoods.test.js (8 tests | 8 skipped) 25ms
   ↓ Neighborhoods and Zip Codes Integration Tests > Zip Code Lookup > should find neighborhood by zip code
   ↓ Neighborhoods and Zip Codes Integration Tests > Zip Code Lookup > should handle invalid zip code
   ↓ Neighborhoods and Zip Codes Integration Tests > Zip Code Lookup > should handle zip codes with leading zeros
   ↓ Neighborhoods and Zip Codes Integration Tests > Neighborhood Search > should find neighborhoods by name
   ↓ Neighborhoods and Zip Codes Integration Tests > Neighborhood Search > should filter neighborhoods by city and state
   ↓ Neighborhoods and Zip Codes Integration Tests > Neighborhood Boundary Validation > should validate coordinates within neighborhood boundaries
   ↓ Neighborhoods and Zip Codes Integration Tests > Zip Code to Multiple Neighborhoods > should handle zip codes that span multiple neighborhoods
   ↓ Neighborhoods and Zip Codes Integration Tests > Neighborhood Metadata > should return neighborhood metadata
stdout | tests/unit/services/httpService.test.js
Test environment variables configured

stdout | tests/unit/hooks/useBulkSubmitter.test.jsx
Test environment variables configured

stdout | tests/unit/hooks/useInputParser.test.jsx
Test environment variables configured

 ✓ tests/unit/services/httpService.test.js (7 tests) 5ms
stdout | tests/unit/hooks/useBulkSubmitter.test.jsx
[DEBUG][2025-05-26T23:15:59.909Z] Application is running in development mode
[DEBUG][2025-05-26T23:15:59.910Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:15:59.910Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:15:59.910Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:15:59.910Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:15:59.910Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:15:59.910Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/hooks/useBulkSubmitter.test.jsx
[DEBUG][2025-05-26T23:15:59.920Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/hooks/useBulkSubmitter.test.jsx
[DEBUG][2025-05-26T23:15:59.926Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:15:59.926Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:15:59.926Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:15:59.927Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:15:59.927Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:15:59.928Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/hooks/useBulkSubmitter.test.jsx
[DEBUG][2025-05-26T23:16:00.028Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:16:00.028Z] [AxiosFix] Successfully patched global axios

stdout | tests/unit/hooks/useBulkSubmitter.test.jsx
[DEBUG][2025-05-26T23:16:00.028Z] [RestaurantService] Using modular restaurant service architecture

stdout | tests/integration/simplified-restaurants.test.js
Test environment variables configured

stdout | tests/integration/places-api.test.js
Test environment variables configured

stdout | tests/integration/auth-basic.test.js
Test environment variables configured

stdout | tests/unit/components/common/forms/Input.test.jsx
Test environment variables configured

stdout | tests/integration/simplified-restaurants.test.js > Restaurant Endpoints
API Request: POST http://localhost:5001/api/auth/login

 ❯ tests/integration/simplified-restaurants.test.js (4 tests | 2 failed) 16ms
   × Restaurant Endpoints > Restaurant Listing > should list restaurants 1ms
     → undefined
   × Restaurant Endpoints > Restaurant Listing > should support pagination for restaurants 0ms
     → undefined
   ✓ Restaurant Endpoints > Restaurant Creation > should attempt to create a restaurant 0ms
   ✓ Restaurant Endpoints > Restaurant Details > should get details for a specific restaurant 0ms
stdout | tests/unit/hooks/usePlaceResolver.test.jsx
Test environment variables configured

stdout | tests/integration/places-api.test.js > Google Places API Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ❯ tests/integration/places-api.test.js (7 tests | 7 skipped) 21ms
   ↓ Google Places API Integration Tests > Place Search > should find places by search query
   ↓ Google Places API Integration Tests > Place Search > should handle empty search results
   ↓ Google Places API Integration Tests > Place Details > should retrieve place details by place ID
   ↓ Google Places API Integration Tests > Place Details > should handle invalid place ID
   ↓ Google Places API Integration Tests > Place Autocomplete > should return autocomplete predictions
   ↓ Google Places API Integration Tests > Nearby Search > should find places near a location
   ↓ Google Places API Integration Tests > Text Search > should find places by text query
stdout | tests/integration/simplified-dishes.test.js
Test environment variables configured

stdout | tests/unit/hooks/usePlaceResolver.test.jsx
[DEBUG][2025-05-26T23:16:00.827Z] Application is running in development mode
[DEBUG][2025-05-26T23:16:00.827Z] API Base URL: http://localhost:5001/api
[DEBUG][2025-05-26T23:16:00.827Z] Mock API Enabled: [33mfalse[39m
[DEBUG][2025-05-26T23:16:00.827Z] Feature Trending Page: [33mfalse[39m
[DEBUG][2025-05-26T23:16:00.827Z] Feature Bulk Add: [33mfalse[39m
[DEBUG][2025-05-26T23:16:00.827Z] Max API Retries: [33m3[39m
[DEBUG][2025-05-26T23:16:00.827Z] API Retry Delay (ms): [33m1000[39m

stdout | tests/unit/hooks/usePlaceResolver.test.jsx
[DEBUG][2025-05-26T23:16:00.838Z] [DevelopmentModeHandler] Initialized

stdout | tests/unit/hooks/usePlaceResolver.test.jsx
[DEBUG][2025-05-26T23:16:00.845Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:16:00.845Z] [AxiosFix] Successfully patched global axios
[INFO][2025-05-26T23:16:00.845Z] [HTTP] Initializing HTTP service with modular architecture
[DEBUG][2025-05-26T23:16:00.846Z] [AxiosFix] Successfully patched axios instance
[INFO][2025-05-26T23:16:00.846Z] [LoggingInterceptor] Verbosity set to normal
[DEBUG][2025-05-26T23:16:00.846Z] [ApiClientFactory] Created API client with options: {
  baseURL: [32m'http://localhost:5001/api'[39m,
  enableAuth: [33mtrue[39m,
  enableLoading: [33mtrue[39m,
  enableErrorHandling: [33mtrue[39m,
  enableOfflineMode: [33mtrue[39m,
  enableLogging: [33mtrue[39m,
  enableDevMode: [33mtrue[39m
}

stdout | tests/unit/hooks/usePlaceResolver.test.jsx
[DEBUG][2025-05-26T23:16:00.846Z] [AxiosFix] Successfully patched axios instance
[DEBUG][2025-05-26T23:16:00.847Z] [AxiosFix] Successfully patched global axios

stdout | tests/integration/simplified-auth.test.js
Test environment variables configured

stdout | tests/integration/auth/authenticationFlow.test.js
Test environment variables configured

stdout | tests/integration/simplified-dishes.test.js > Dish Endpoints
API Request: POST http://localhost:5001/api/auth/login

 ❯ tests/integration/simplified-dishes.test.js (4 tests | 2 failed) 16ms
   × Dish Endpoints > Dish Listing > should list dishes 1ms
     → undefined
   × Dish Endpoints > Dish Listing > should support pagination for dishes 0ms
     → undefined
   ✓ Dish Endpoints > Dish Creation > should attempt to create a dish 1ms
   ✓ Dish Endpoints > Dish Details > should get details for a specific dish 0ms
stdout | tests/unit/stores/auth/authStore.test.js
Test environment variables configured

stdout | tests/integration/simplified-lists.test.js
Test environment variables configured

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with admin credentials
Admin login result: { success: [33mfalse[39m, status: [90mundefined[39m, hasToken: [33mfalse[39m }

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should successfully login with regular user credentials
Regular user login result: { success: [33mfalse[39m, status: [90mundefined[39m, hasToken: [33mfalse[39m }

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
API Request: POST http://localhost:5001/api/auth/login

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Login > should fail login with invalid credentials
Invalid login result: {
  success: [33mfalse[39m,
  status: [90mundefined[39m,
  error: [32m"Cannot read properties of undefined (reading 'match')"[39m
}

stdout | tests/integration/simplified-auth.test.js > Authentication Endpoints > Logout > should attempt to logout after login
API Request: POST http://localhost:5001/api/auth/login

 ❯ tests/integration/simplified-auth.test.js (5 tests | 1 failed) 16ms
   ✓ Authentication Endpoints > Login > should successfully login with admin credentials 10ms
   ✓ Authentication Endpoints > Login > should successfully login with regular user credentials 2ms
   ✓ Authentication Endpoints > Login > should fail login with invalid credentials 2ms
   × Authentication Endpoints > Registration > should attempt to register a new user 0ms
     → undefined
   ✓ Authentication Endpoints > Logout > should attempt to logout after login 1ms
 ❯ tests/unit/stores/auth/authStore.test.js (5 tests | 5 failed) 11ms
   × Authentication Store > Initial State > should have correct initial state 7ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store > Authentication > should set user on login 1ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store > Authentication > should handle login errors 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store > Logout > should clear user data on logout 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store > Check Authentication Status > should check auth status when cache is valid 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
stdout | tests/integration/auth/authenticationFlow.test.js
[DEBUG] Creating API client with baseURL: http://localhost:5001/api

stdout | tests/unit/services/http/AuthInterceptor.test.js
Test environment variables configured

 ❯ tests/integration/auth/authenticationFlow.test.js (5 tests | 4 failed) 30ms
   × Authentication Flow Integration > Login Flow > should successfully log in with valid credentials 21ms
     → expected false to be true // Object.is equality
   ✓ Authentication Flow Integration > Login Flow > should fail to log in with invalid credentials 1ms
   × Authentication Flow Integration > Session Management > should maintain session after login 1ms
     → expected false to be true // Object.is equality
   × Authentication Flow Integration > Logout Flow > should successfully log out 1ms
     → expected false to be true // Object.is equality
   × Authentication Flow Integration > Registration Flow > should register a new user 3ms
     → expected false to be true // Object.is equality
stdout | tests/integration/simplified-lists.test.js > Lists API Integration Tests
API Request: POST http://localhost:5001/api/auth/login

 ❯ tests/integration/simplified-lists.test.js (6 tests | 6 skipped) 13ms
   ↓ Lists API Integration Tests > should create a new list
   ↓ Lists API Integration Tests > should get all lists
   ↓ Lists API Integration Tests > should get a specific list
   ↓ Lists API Integration Tests > should update a list
   ↓ Lists API Integration Tests > should delete a list
   ↓ Lists API Integration Tests > should handle non-existent list
stdout | tests/integration/restaurants-direct.test.js
Test environment variables configured

stdout | tests/unit/components/common/buttons/Button.test.jsx
Test environment variables configured

stdout | tests/unit/components/common/feedback/Alert.test.jsx
Test environment variables configured

stdout | tests/integration/http-service.test.js
Test environment variables configured

stdout | tests/unit/components/common/forms/Form.test.jsx
Test environment variables configured

stdout | tests/integration/auth-direct.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/storeLogic.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/directStore.test.js
Test environment variables configured

stdout | tests/integration/simple-restaurant.test.js
Test environment variables configured

stdout | tests/unit/components/common/buttons/IconButton.test.jsx
Test environment variables configured

 ❯ tests/unit/stores/auth/directStore.test.js (5 tests | 5 failed) 7ms
   × Authentication Store - Direct Tests > Basic State Management > should initialize with default values 5ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store - Direct Tests > Basic State Management > should update user state 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store - Direct Tests > Basic State Management > should clear user on logout 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store - Direct Tests > Token Management > should set and get token 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × Authentication Store - Direct Tests > Error Handling > should set and clear errors 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
 ❯ tests/unit/stores/auth/storeLogic.test.js (5 tests | 5 failed) 6ms
   × Authentication Store Logic > Initial State > should initialize with default values 4ms
     → create is not a function
   × Authentication Store Logic > User Management > should set and get user 0ms
     → create is not a function
   × Authentication Store Logic > User Management > should clear user on logout 0ms
     → create is not a function
   × Authentication Store Logic > Token Management > should set and get token 0ms
     → create is not a function
   × Authentication Store Logic > Error Handling > should set and clear error 0ms
     → create is not a function
stdout | tests/unit/services/dishService.test.js
Test environment variables configured

stdout | tests/unit/utils/bulkAddUtils.test.js
Test environment variables configured

stdout | tests/unit/stores/auth/simpleStore.test.js
Test environment variables configured

 ✓ tests/unit/stores/auth/simpleStore.test.js (5 tests) 3ms
stdout | tests/unit/utils/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should parse semicolon-delimited input with hashtags
[INFO][2025-05-26T23:16:03.919Z] [parseInputText] Processing 5 lines of input

 ✓ tests/unit/services/dishService.test.js (4 tests) 4ms
stdout | tests/unit/utils/bulkAddUtils.test.js > bulkAddUtils > parseInputText > should handle malformed input
[INFO][2025-05-26T23:16:03.922Z] [parseInputText] Processing 1 lines of input

 ✓ tests/unit/utils/bulkAddUtils.test.js (3 tests) 4ms
stdout | tests/unit/stores/auth/useAuthenticationStore.simple.test.js
Test environment variables configured

 ❯ tests/unit/stores/auth/useAuthenticationStore.simple.test.js (3 tests | 3 failed) 8ms
   × useAuthenticationStore > checkAuthStatus > should initialize with default values 6ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × useAuthenticationStore > checkAuthStatus > should set user on login 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
   × useAuthenticationStore > checkAuthStatus > should clear user on logout 0ms
     → Cannot read properties of null (reading 'useSyncExternalStore')
stdout | tests/unit/health.test.js
Test environment variables configured

stdout | tests/unit/simple-health.test.js
Test environment variables configured

stdout | tests/integration/health-check-direct.test.js
Test environment variables configured

stdout | tests/unit/health.test.js
Test configuration loaded

stdout | tests/integration/health-check-direct.test.js > Health Check Endpoint > should return 200 and healthy status
Health check passed: {
  status: [32m'UP'[39m,
  message: [32m'Backend is healthy and running!'[39m,
  timestamp: [32m'2025-05-26T23:16:04.617Z'[39m,
  databasePool: { total: [33m0[39m, idle: [33m0[39m, waiting: [33m0[39m },
  memoryUsage: {
    rss: [33m118341632[39m,
    heapTotal: [33m62455808[39m,
    heapUsed: [33m31728008[39m,
    external: [33m3666535[39m,
    arrayBuffers: [33m4284713[39m
  }
}

 ✓ tests/integration/health-check-direct.test.js (1 test) 46ms
stdout | tests/unit/health.test.js > API health check
Running health check test...
API Base URL: http://localhost:5001/api

stdout | tests/unit/simple-health.test.js > Direct API health check
Testing API health at: http://localhost:5001/api/health

 ❯ tests/unit/health.test.js (1 test | 1 failed) 9ms
   × API health check 9ms
     → Cannot read properties of undefined (reading 'match')
 ❯ tests/unit/simple-health.test.js (1 test | 1 failed) 11ms
   × Direct API health check 10ms
     → Cannot read properties of undefined (reading 'match')
 ❯ tests/integration/dishes.test.js (9 tests | 9 skipped) 10006ms
   ↓ Dish Endpoints > Dish Listing > should list dishes
   ↓ Dish Endpoints > Dish Listing > should list dishes for a specific restaurant
   ↓ Dish Endpoints > Dish Listing > should support filtering dishes by category
   ↓ Dish Endpoints > Dish Creation > should create a new dish when authenticated
   ↓ Dish Endpoints > Dish Creation > should fail to create a dish without authentication
   ↓ Dish Endpoints > Dish Details > should get details for a specific dish
   ↓ Dish Endpoints > Dish Update > should update a dish when authenticated
   ↓ Dish Endpoints > Dish Update > should fail to update a dish without authentication
   ↓ Dish Endpoints > Dish Deletion > should fail to delete a dish without authentication
 ❯ tests/integration/restaurants-direct.test.js (4 tests | 4 skipped) 10005ms
   ↓ Restaurant API > should fetch all restaurants
   ↓ Restaurant API > should fetch a single restaurant by ID
   ↓ Restaurant API > should search for restaurants
   ↓ Restaurant API > should fetch dishes for a restaurant