# Doof Backend

This is the backend server for the Doof application. It provides API endpoints for managing lists, restaurants, dishes, and other features.

## Architecture Overview

The backend follows a modular architecture with the following components:

### Core Layers

- **Routes**: Define API endpoints and handle request routing
- **Controllers**: Process requests, validate inputs, and coordinate between services and models
- **Services**: Implement business logic and orchestrate operations
- **Models**: Handle database interactions and data transformation

### Supporting Components

- **Middleware**: Provide cross-cutting concerns like authentication, error handling, and logging
- **Utilities**: Shared helper functions and centralized patterns
- **Configuration**: Environment-specific settings and application constants

## Key Design Patterns

### Service Wrapper Pattern

Services are wrapped with standardized functionality:
- Consistent error handling
- Response formatting
- Performance tracking
- Caching for read operations
- Logging

Example:
```javascript
const listService = createService({
  name: 'ListService',
  methods: {
    getList: {
      fn: rawMethods.getList,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000 // 5 minutes
    }
  }
});
```

### Controller Wrapper Pattern

Controllers are wrapped with standardized functionality:
- Request validation
- Error handling
- Response formatting
- Performance monitoring
- Logging

Example:
```javascript
const listController = createController({
  name: 'ListController',
  methods: {
    getUserLists: { fn: rawMethods.getUserLists }
  }
});
```

### Error Handling

Centralized error handling with standardized error types:
- AppError as base class
- Specialized error types (BadRequestError, NotFoundError, etc.)
- Consistent error responses

Example:
```javascript
try {
  // Some operation
} catch (error) {
  throw new NotFoundError(`List with ID ${id} not found`);
}
```

### Database Connection Pooling

Optimized database connection handling:
- Connection pooling for performance
- Transaction support
- Query performance tracking
- Batch operations

Example:
```javascript
await db.transaction(async (client) => {
  // Perform multiple operations in a transaction
});
```

### Validation

Centralized validation rules:
- Reusable validation patterns
- Consistent error formats
- Domain-specific validation sets

Example:
```javascript
validate(validators.list.create)
```

### Performance Monitoring

System-wide performance tracking:
- Response time measurements
- Slow request identification
- Error rate tracking
- Per-route metrics

## Folder Structure

```
doof-backend/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── db/             # Database connection and utilities
├── middleware/     # Express middleware
├── models/         # Data access layer
├── routes/         # API endpoint definitions
├── services/       # Business logic
├── utils/          # Utility functions
└── server.js       # Application entry point
```

## Refactoring Strategy

The codebase was refactored with these principles:

1. **Consistency**: Standardize patterns across the application
2. **Maintainability**: Improve code organization and reduce duplication
3. **Performance**: Optimize database access and add caching
4. **Error Handling**: Centralize error processing for better debugging
5. **Scalability**: Prepare the application for future growth

Key improvements:

- Service wrapper for standardized service methods
- Controller wrapper for consistent request handling
- Enhanced database connection pooling
- Centralized validation utilities
- Performance metrics tracking
- Improved error handling and logging

## Development Guidelines

### Adding a New Feature

1. Define route in a routes file
2. Create controller with validation
3. Implement service with business logic
4. Add model methods for data access
5. Register route in server.js

### Error Handling Best Practices

- Use specific error types from errorHandler.js
- Include context in error messages
- Let errors bubble up to the wrapper layer

### Database Access

- Use the db utility for all database operations
- Leverage transactions for multi-step operations
- Consider using batch operations for bulk processing

### API Response Format

All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": [result data],
  "errors": [validation errors if applicable]
}
```

## Environment Configuration

The application uses the following environment variables:

- `PORT`: Server port (default: 5001)
- `NODE_ENV`: Environment (development, production)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_HOST`: Database host
- `DB_DATABASE`: Database name
- `DB_PORT`: Database port
- `JWT_SECRET`: Secret for JWT tokens
- `FRONTEND_URL`: Frontend application URL for CORS
- `LOG_LEVEL`: Logging level (error, warn, info, debug)
- `ADMIN_API_KEY`: API key for admin endpoints

## Available Scripts

- `npm start`: Start the server
- `npm run dev`: Start with nodemon for development 