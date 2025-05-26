# Authentication Store Refactoring

## Overview

This document describes the refactoring of the Chomp application's authentication system from a monolithic store to a modular architecture. The refactoring aims to improve maintainability, readability, and testability by breaking down the large `useAuthStore.js` file into smaller, focused modules.

## Motivation

The original `useAuthStore.js` had several issues:

1. **Low Cohesion**: The file handled multiple concerns including authentication, user profile management, session management, registration, and superuser status.
2. **Large File Size**: At over 600 lines, the file was difficult to navigate and understand.
3. **Complex State Management**: The store managed many pieces of state that were only loosely related.
4. **Testing Challenges**: The monolithic nature made it difficult to test individual pieces of functionality.

## New Architecture

The authentication system has been refactored into five specialized modules:

### 1. `useAuthenticationStore.js`

Handles core authentication functionality:
- Login/logout operations
- Token management
- Authentication status checking
- Basic user identity

### 2. `useUserProfileStore.js`

Manages user profile information:
- Profile fetching and updating
- User preferences
- Avatar management
- Profile-specific operations

### 3. `useAuthSessionStore.js`

Handles session management:
- Session initialization and tracking
- Activity monitoring
- Session expiration and refresh
- Timeout handling

### 4. `useRegistrationStore.js`

Manages user registration:
- Registration flow
- Email verification
- Username/email availability checking
- Registration data management

### 5. `useSuperuserStore.js`

Handles superuser/admin functionality:
- Superuser status determination
- Permission management
- Role-based access control

## Backward Compatibility

To ensure a smooth transition, a compatibility wrapper has been created:

- The original `useAuthStore.js` now serves as a wrapper around the new modular stores
- It maintains the same API as before, delegating to the appropriate specialized stores
- This allows for gradual migration without breaking existing components

## Migration Guide

### Using the New Stores

Instead of importing from the original store:

```javascript
import useAuthStore from '@/stores/useAuthStore';

function MyComponent() {
  const { user, isAuthenticated, login } = useAuthStore();
  // ...
}
```

You can now import the specific store you need:

```javascript
import { useAuthenticationStore } from '@/stores/auth';

function MyComponent() {
  const { user, isAuthenticated, login } = useAuthenticationStore();
  // ...
}
```

### Using Named Exports

For simpler use cases, you can use the named exports:

```javascript
import { getCurrentUser, getIsAuthenticated } from '@/stores/auth';

function MyComponent() {
  const user = getCurrentUser();
  const isAuthenticated = getIsAuthenticated();
  // ...
}
```

### Migrating Components

1. **Identify Dependencies**: Determine which parts of the auth store your component is using
2. **Choose Appropriate Store**: Select the specialized store that handles those concerns
3. **Update Imports**: Change imports to use the new store
4. **Update Hook Usage**: Adjust how the store is used in your component

### Example Migration

**Before:**

```javascript
import useAuthStore from '@/stores/useAuthStore';

function ProfileComponent() {
  const { user, isLoading, isSuperuser } = useAuthStore();
  
  // Check if user can edit
  const canEdit = isSuperuser || (user && user.id === profileId);
  
  // ...
}
```

**After:**

```javascript
import { useAuthenticationStore, useSuperuserStore } from '@/stores/auth';

function ProfileComponent() {
  const { user, isLoading } = useAuthenticationStore();
  const { isSuperuser } = useSuperuserStore();
  
  // Check if user can edit
  const canEdit = isSuperuser || (user && user.id === profileId);
  
  // ...
}
```

## Testing

Each store module now has dedicated unit tests, making it easier to verify functionality and catch regressions. Tests can be found in:

```
/tests/unit/stores/auth/
```

## Benefits of the New Architecture

1. **Improved Cohesion**: Each store has a clear, focused responsibility
2. **Better Separation of Concerns**: Authentication, profile management, and session handling are properly separated
3. **Enhanced Maintainability**: Smaller, focused modules are easier to understand and modify
4. **Better Testability**: Each module can be tested in isolation
5. **Clearer Dependencies**: The relationships between different aspects of authentication are more explicit

## Future Improvements

1. **Complete Test Coverage**: Add comprehensive tests for all store modules
2. **Component Migration**: Update all components to use the specialized stores directly
3. **Event System Standardization**: Standardize the event system used for cross-store communication
4. **Documentation**: Add JSDoc comments to all store methods for better IDE integration
