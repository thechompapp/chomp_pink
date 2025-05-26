# Service Layer Architecture

## Overview

The service layer in the Chomp application has been refactored to follow a modular, maintainable architecture. This document outlines the key patterns, components, and best practices for working with the service layer.

## Core Principles

1. **Single Responsibility**: Each service focuses on a specific domain or functionality
2. **Standardized API**: Consistent patterns for method signatures, error handling, and responses
3. **Modularity**: Services are organized into logical modules that can be imported individually
4. **Testability**: Services are designed to be easily testable with minimal mocking
5. **Error Handling**: Consistent approach to error handling and logging

## Base Service

All services extend the `BaseService` class, which provides:

- Standardized API request methods (get, post, put, patch, delete)
- Consistent error handling and logging
- Response normalization
- Request retry logic

```javascript
// Example of BaseService usage
import BaseService from '../utils/BaseService';

class MyService extends BaseService {
  constructor() {
    super('/api/endpoint');
  }
  
  async getItems(params) {
    return this.get('', { params });
  }
}
```

## Service Organization

Services are organized by domain and functionality:

```
src/
  services/
    utils/
      BaseService.js
      serviceHelpers.js
    list/
      index.js             // Unified export
      ListCrudService.js   // CRUD operations
      ListItemService.js   // Item management
      ListSharingService.js // Sharing & collaboration
      ListSearchService.js  // Search & discovery
    user/
      UserProfileService.js
      UserPreferencesService.js
    auth/
      TokenService.js
      UserAuthService.js
      AdminAuthService.js
      OfflineAuthService.js
```

## Response Format

All services return responses in a consistent format:

```javascript
{
  success: boolean,       // Whether the operation succeeded
  message: string,        // Human-readable message
  data: any,              // Response data (if any)
  pagination?: {          // Pagination info (if applicable)
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

## Error Handling

Services handle errors consistently:

1. Errors are logged with appropriate severity
2. Services return error responses rather than throwing exceptions
3. Error responses include helpful messages for debugging
4. Network errors are automatically retried when appropriate

## Authentication Integration

Services that require authentication:

1. Automatically handle token refresh
2. Support offline mode when applicable
3. Include appropriate authorization headers
4. Handle authentication errors consistently

## Backward Compatibility

The refactored service layer maintains backward compatibility through:

1. Unified exports that preserve the original API
2. Method signature compatibility
3. Response format normalization

For example, the list service maintains the original API while using the new modular services internally:

```javascript
// src/services/list/index.js
export const listService = {
  // Original methods mapped to new implementations
  getLists: listCrudService.getLists.bind(listCrudService),
  addItemToList: listItemService.addItemToList.bind(listItemService),
  // ...
};
```

## Testing

Services should be tested at multiple levels:

1. **Unit tests**: Test individual service methods in isolation
2. **Integration tests**: Test service interactions with the API
3. **E2E tests**: Test services in the context of the full application

See the [MULTI_COMM.md](./MULTI_COMM.md) document for the comprehensive testing strategy.

## Best Practices

1. **Use the appropriate service**: Import the most specific service for your needs
2. **Handle errors gracefully**: Always check the `success` property of responses
3. **Avoid direct API calls**: Use services instead of calling the API directly
4. **Respect pagination**: Use pagination parameters when fetching lists of items
5. **Log appropriately**: Use the logging utilities for debugging and monitoring
6. **Validate inputs**: Ensure inputs are valid before making service calls
7. **Use React Query**: Pair services with React Query for optimal state management

## Example Usage

```javascript
import { listCrudService, listItemService } from '@/services/list';
import { useQuery, useMutation } from '@tanstack/react-query';

// In a React component
const MyComponent = () => {
  // Fetch lists
  const { data: listsData } = useQuery(
    ['lists'],
    () => listCrudService.getLists(),
    {
      staleTime: 60000,
      onError: (error) => console.error('Failed to fetch lists:', error)
    }
  );

  // Add item mutation
  const addItemMutation = useMutation(
    (data) => listItemService.addItemToList(data.listId, data.item),
    {
      onSuccess: () => {
        // Handle success
      },
      onError: (error) => {
        // Handle error
      }
    }
  );

  // Usage
  const handleAddItem = (listId, item) => {
    addItemMutation.mutate({ listId, item });
  };

  return (
    // Component JSX
  );
};
```
