# HTTP Service Refactoring - Migration Guide

This guide will help you migrate from the old `httpInterceptor.js` to the new modular HTTP service architecture.

## Overview

The HTTP service has been refactored into smaller, focused modules for better maintainability and testability. The new structure is organized as follows:

```
src/services/http/
├── index.js                  # Main entry point
├── interceptors/             # Individual interceptor implementations
│   ├── authInterceptor.js    # Authentication logic
│   ├── errorInterceptor.js   # Error handling
│   ├── loadingInterceptor.js # Loading state management
│   ├── loggingInterceptor.js # Request/response logging
│   └── offlineInterceptor.js # Offline mode handling
├── utils/                    # Shared utilities
│   ├── cache.js              # Caching utilities
│   ├── config.js             # Configuration constants
│   └── logger.js             # Logging utilities
└── hooks/                    # Custom hooks
    └── useHttpLoading.js     # Loading state hook
```

## Key Changes

### 1. Importing the API Client

**Before:**
```javascript
import apiClient from '@/services/httpInterceptor';
```

**After:**
```javascript
import apiClient from '@/services/http';
// or
import { apiClient } from '@/services/http';
```

### 2. Using the Loading State

**Before:**
```javascript
import { useLoading } from '@/contexts/LoadingContext';

function MyComponent() {
  const { isLoading } = useLoading();
  // ...
}
```

**After:**
```javascript
import { useHttpLoading } from '@/services/http/hooks';

function MyComponent() {
  const { isLoading, isLoadingUrl } = useHttpLoading();
  // Check if specific URL is loading
  const isUserDataLoading = isLoadingUrl('/api/users/me');
  // ...
}
```

### 3. Offline Mode

**Before:**
```javascript
import { checkOfflineMode } from '@/services/httpInterceptor';

if (checkOfflineMode()) {
  // Handle offline mode
}
```

**After:**
```javascript
import { checkOfflineMode, setOfflineMode } from '@/services/http';

// Check offline mode
if (checkOfflineMode()) {
  // Handle offline mode
}

// Set offline mode
setOfflineMode(true); // Enable offline mode
setOfflineMode(false); // Disable offline mode
```

### 4. Error Handling

Error handling is now more consistent and provides better error messages. The error interceptor now categorizes errors and provides more context.

**Before:**
```javascript
try {
  await apiClient.get('/some/endpoint');
} catch (error) {
  // Generic error handling
  console.error('Request failed:', error.message);
}
```

**After:**
```javascript
try {
  await apiClient.get('/some/endpoint');
} catch (error) {
  if (error.isNetworkError) {
    console.error('Network error:', error.message);
  } else if (error.isServerError) {
    console.error('Server error:', error.status, error.data);
  } else if (error.isValidationError) {
    console.error('Validation error:', error.data.errors);
  } else {
    console.error('Request failed:', error.message);
  }
}
```

### 5. Custom API Clients

You can now create custom API clients with specific configurations:

```javascript
import { createApiClient } from '@/services/http';

const customApiClient = createApiClient({
  baseURL: 'https://api.example.com/v2',
  timeout: 10000,
  headers: {
    'X-Custom-Header': 'value'
  }
});

// Use the custom client
const response = await customApiClient.get('/endpoint');
```

## New Features

### 1. URL-based Loading States

Check if a specific URL is currently loading:

```javascript
import { isUrlLoading } from '@/services/http';

// Check if a specific URL is loading
const isLoading = isUrlLoading('/api/users/me');
```

### 2. Subscribe to Loading State Changes

Subscribe to loading state changes:

```javascript
import { subscribeToLoadingState } from '@/services/http';

const unsubscribe = subscribeToLoadingState((state) => {
  console.log('Loading state changed:', state);
});

// Later, to unsubscribe
unsubscribe();
```

### 3. Offline Mode Management

More granular control over offline mode:

```javascript
import { checkOfflineMode, setOfflineMode } from '@/services/http';

// Enable offline mode (persists across page reloads)
setOfflineMode(true, true);

// Disable offline mode (temporary, won't persist)
setOfflineMode(false);
```

## Deprecations

The following features from the old `httpInterceptor.js` are deprecated:

1. Direct access to `localStorage` keys - Use the provided utility functions instead
2. Global `window` event listeners - These are now handled internally
3. Inline configuration - Use the `createApiClient` function for custom configurations

## Testing

Each interceptor is independently testable. See the test files for examples of how to test the HTTP service in isolation.

## Backward Compatibility

The new implementation maintains backward compatibility with the old API where possible. However, some edge cases may require updates to your code. Test thoroughly when upgrading.
