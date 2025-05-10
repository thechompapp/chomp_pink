# API Client Standardization - Chomp App

This document outlines the standardization work done on the API client implementation to ensure consistent behavior across the application.

## Key Changes Made

### 1. API Client Implementation

- **Enhanced apiClient.js**: Updated with proper error handling, token refresh logic, and consistent request/response handling
- **New apiUtils.js**: Created centralized utilities for API error handling, logging, and base URL management
- **Standardized Service Patterns**: Updated service files to use consistent patterns with `handleApiResponse` and `createQueryParams`

### 2. Component Fixes

- **Added Label Component**: Created the missing `Label.jsx` component that was referenced in the Login page

### 3. CORS Issue Resolution

- **Enhanced dev-server.js**: Updated to detect and resolve port conflicts automatically
- **Added start-frontend.sh**: Created a shell script to ensure the frontend runs on port 5173 to match backend CORS expectations
- **Dynamic API Base URL**: Added logic to ensure the API client uses the correct port even if the frontend runs on a different port

## How to Use

### Starting the Application

To avoid CORS issues between frontend and backend:

```bash
# Option 1: Use the shell script (recommended)
./start-frontend.sh

# Option 2: Use the Node.js script
node dev-server.js
```

### Making API Calls

All service files should follow this standardized pattern:

```javascript
import apiClient from './apiClient.js';
import { handleApiResponse, createQueryParams } from '@/utils/serviceHelpers.js';

export const someService = {
  getData: async (params) => {
    // Use createQueryParams for consistent parameter handling
    const queryParams = createQueryParams(params);
    
    // Use handleApiResponse for standardized API handling
    return handleApiResponse(
      () => apiClient.get(`/endpoint${queryParams.toString() ? `?${queryParams.toString()}` : ''}`),
      'Service.Method',
      (data) => data // Optional transform function
    );
  }
};
```

## Troubleshooting

If you encounter CORS issues:

1. Make sure the frontend is running on port 5173 to match backend expectations
2. Check if another process is using port 5173 (use `lsof -i :5173` to check)
3. Use the provided scripts to automatically handle port conflicts

If you encounter authentication errors:

1. Make sure cookies are properly being sent (check `withCredentials` is true)
2. Check browser console for specific error messages
3. The token refresh mechanism should automatically handle expired tokens
