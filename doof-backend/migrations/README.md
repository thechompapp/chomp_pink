# Database Migrations

This directory contains database migration scripts for the Doof application.

## Schema Changes

### 20250526_fix_schema_issues.sql

This migration makes the following changes to the database schema:

1. **Users Table**
   - Renamed `account_type` column to `role`
   - Added `updated_at` timestamp column
   - Updated role check constraint to include valid roles: 'user', 'contributor', 'admin'

2. **Restaurants Table**
   - Added missing columns: `description`, `cuisine`, `price_range`, `created_by`, `updated_at`
   - Added foreign key constraint for `created_by` referencing `users(id)`
   - Set default values for optional fields

3. **Dishes Table**
   - Added missing columns: `category`, `created_by`, `updated_at`
   - Added foreign key constraint for `created_by` referencing `users(id)`
   - Set default values for optional fields

4. **Triggers**
   - Added trigger function to automatically update `updated_at` timestamps
   - Created triggers for all tables with `updated_at` columns

## Running Migrations

To run all pending migrations:

```bash
# Install dependencies if needed
npm install pg dotenv

# Run migrations
node scripts/run-migration.js
```

## Environment Variables

The migration script requires the following environment variables:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=doof_db
DB_PASSWORD=your_password
DB_PORT=5432
```

You can set these in a `.env` file in the project root or pass them directly when running the script.

## Migration Tracking

Migrations are tracked in the `migrations` table, which stores:
- `id`: Auto-incrementing ID
- `name`: Name of the migration file (without extension)
- `run_on`: Timestamp when the migration was applied

## Best Practices

1. Always create a new migration file for schema changes
2. Make migrations idempotent (can be run multiple times without errors)
3. Include both `up` and `down` migrations when possible
4. Test migrations in a development environment before running in production
5. Back up your database before running migrations in production
