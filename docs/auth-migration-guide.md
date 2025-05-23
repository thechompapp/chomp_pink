# Authentication System Migration Guide

This document outlines the process for migrating from the old authentication system to the new one. The migration is designed to be incremental, allowing for a phased approach to minimize disruption.

## Overview of Changes

The new authentication system provides:

1. **Unified Authentication Context** - A centralized React Context for managing auth state
2. **Enhanced Token Management** - Secure token handling with automatic refresh
3. **Standardized Error Handling** - Consistent error formatting and user-friendly messages
4. **Improved HTTP Client** - Robust request/response handling with offline support
5. **Clean Admin Authentication** - Separate hook for admin-specific functionality
6. **Better Offline Support** - Seamless transitions between online and offline modes

## Migration Steps

### Phase 1: Setup New Architecture

1. **Install the new files**:
   - `/src/services/auth/tokenManager.js` - Token management
   - `/src/services/http/httpClient.js` - Enhanced HTTP client
   - `/src/utils/auth/errorHandler.js` - Standardized error handling
   - `/src/services/auth/authService.js` - Authentication service
   - `/src/contexts/auth/AuthContext.jsx` - Authentication context
   - `/src/hooks/auth/useAdminAuth.js` - Admin authentication hook

2. **Update import paths**:
   - The new system uses a more organized folder structure
   - Auth-related files are now in dedicated folders

### Phase 2: Component Migration

Migrate components one by one from the old system to the new one:

#### Old Authentication Usage:

```jsx
import useAuthStore from '@/stores/useAuthStore';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  // Component logic
}
```

#### New Authentication Usage:

```jsx
import { useAuth } from '@/contexts/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Component logic
}
```

#### For Admin Authentication:

```jsx
import { useAdminAuth } from '@/hooks/auth';

function AdminComponent() {
  const { isAdmin, hasPermission } = useAdminAuth();
  
  // Component logic
}
```

### Phase 3: App Integration

1. Replace the old `App.jsx` with `App.new.jsx`
2. Replace the old `ProtectedRoute.jsx` with `ProtectedRoute.new.jsx`
3. Update imports in affected components

### Phase 4: Testing

1. Test login functionality
2. Test token refresh
3. Test protected routes
4. Test admin-only routes
5. Test offline mode behavior

### Phase 5: Cleanup

Once all components have been migrated and tested:

1. Remove old authentication files:
   - `useAuthStore.js`
   - `authService.js` (old version)
   - `auth-fix.js`
   - Other deprecated auth utilities

## API Changes

### Authentication Context

```jsx
const {
  // State
  user,                // Current user object
  isAuthenticated,     // Authentication status
  isLoading,           // Loading state
  error,               // Error state
  isOffline,           // Offline mode status
  
  // Admin state
  isSuperuser,         // Superuser status
  superuserStatusReady, // Whether superuser status has been determined
  
  // Methods
  login,               // Log in a user
  register,            // Register a new user
  logout,              // Log out the current user
  updateProfile,       // Update user profile
  changePassword,      // Change user password
  checkAuthStatus,     // Check authentication status
  hasPermission,       // Check if user has permission
} = useAuth();
```

### Admin Authentication Hook

```jsx
const {
  isAdmin,             // Whether user is an admin
  hasPermission,       // Check if user has permission
  hasAllPermissions,   // Check if user has all permissions
  getUserPermissions,  // Get user's permissions
  isAdminStatusReady,  // Whether admin status has been determined
} = useAdminAuth();
```

### Authentication Service

```js
// Login
const result = await authService.login({ email, password });

// Register
const result = await authService.register({ name, email, password });

// Logout
await authService.logout();

// Check authentication
const isAuthenticated = await authService.isAuthenticated();

// Get current user
const user = await authService.getCurrentUser();

// Update profile
const updatedUser = await authService.updateProfile(userData);

// Change password
await authService.changePassword({ currentPassword, newPassword });

// Request password reset
await authService.requestPasswordReset(email);

// Reset password
await authService.resetPassword({ token, password });
```

## Troubleshooting

### Common Issues

1. **Authentication state not updating**:
   - Ensure you're using the new `useAuth` hook
   - Check that `AuthProvider` is properly wrapping your app

2. **Token refresh not working**:
   - Verify that the backend supports the refresh token endpoint
   - Check that tokens are being properly stored

3. **Admin routes not working**:
   - Ensure you're using `useAdminAuth` for admin checks
   - Verify that the user has the correct permissions

4. **Offline mode issues**:
   - Check that offline mode flags are being properly set
   - Verify that the app correctly detects network status changes

### Development Mode

In development mode, you can use the following flags:

- `localStorage.setItem('bypass_auth_check', 'true')` - Bypass authentication checks
- `localStorage.setItem('admin_access_enabled', 'true')` - Enable admin access
- `localStorage.setItem('superuser_override', 'true')` - Override superuser checks

## Support

For any issues or questions about the migration, please contact the development team.
