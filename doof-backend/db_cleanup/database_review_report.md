# Database Schema Review & Cleanup Report for Chomp/Doof Application

## Executive Summary

This report presents a comprehensive review of the Chomp/Doof application's PostgreSQL database schema. The review identifies several issues including redundant tables, inconsistent column naming, missing constraints, and opportunities for optimization. Recommendations for schema changes and data cleanup are provided, along with SQL migration scripts to implement these changes safely.

## 1. Schema Overview

The Chomp/Doof database consists of the following main tables:

- **Users**: Stores user account information
- **Restaurants**: Stores restaurant information
- **Dishes**: Stores dish information associated with restaurants
- **Lists**: Stores user-created lists of restaurants and dishes
- **List Items**: Two tables (`listitems` and `list_items`) store items in lists
- **Hashtags**: Stores tags for restaurants and dishes
- **Engagements**: Tracks user interactions with content
- **Cities/Neighborhoods**: Stores location information
- **Submissions**: Stores user-submitted content pending approval

## 2. Key Issues Identified

### 2.1 Redundant Tables

1. **Duplicate List Item Tables**: Both `listitems` and `list_items` exist with similar schemas, causing confusion and data duplication.

2. **Redundant Vote Tables**: Both `dishvotes` and `reviewvotes` exist with overlapping purposes.

### 2.2 Inconsistent Column Naming

1. **User Role Columns**: The `users` table has both `account_type` and `role` columns that serve the same purpose.

2. **Timestamp Formats**: Inconsistent use of `timestamp with time zone` and `timestamp without time zone` across tables.

### 2.3 Missing Constraints

1. **Foreign Key Constraints**: Several relationships lack proper foreign key constraints.

2. **Unique Constraints**: Missing unique constraints on columns that should be unique (e.g., `google_place_id` in restaurants).

### 2.4 Unused or Redundant Columns

1. **Instagram Handle**: The `instagram_handle` column in the restaurants table is referenced in code but missing from the schema.

2. **is_following**: The `is_following` column in the lists table appears to be a computed property rather than a stored value.

### 2.5 Schema Optimization Opportunities

1. **JSON/JSONB Usage**: No use of JSON/JSONB types for flexible data that might benefit from this approach.

2. **Indexing**: Missing indexes on frequently queried columns.

## 3. Table-by-Table Analysis

### 3.1 Users Table

```sql
CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_hash character varying(255),
    account_type character varying(20) DEFAULT 'user'::character varying NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    CONSTRAINT users_account_type_check CHECK (((account_type)::text = ANY ((ARRAY['user'::character varying, 'contributor'::character varying, 'superuser'::character varying])::text[])))
);
```

**Issues**:
- Duplicate role columns: `account_type` and `role` serve the same purpose
- Missing `updated_at` column for tracking changes
- Inconsistent timestamp type (without time zone)
- Missing unique constraints on `username` and `email`

**Model Usage**:
- The `userModel.js` uses `role` but the schema has both `role` and `account_type`
- The model references 'admin' as a role value but the check constraint doesn't include it

### 3.2 Lists and List Items Tables

**Lists Table**:
```sql
CREATE TABLE public.lists (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    saved_count integer DEFAULT 0 NOT NULL,
    city_name character varying(100),
    tags text[],
    is_public boolean DEFAULT true NOT NULL,
    created_by_user boolean DEFAULT false NOT NULL,
    creator_handle character varying(100),
    is_following boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer,
    list_type character varying(20) NOT NULL,
    CONSTRAINT lists_list_type_check CHECK (((list_type)::text = ANY ((ARRAY['restaurant'::character varying, 'dish'::character varying, 'mixed'::character varying])::text[])))
);
```

**List Items Tables**:
Two tables with similar purposes:
```sql
CREATE TABLE public.list_items (
    id integer NOT NULL,
    list_id integer NOT NULL,
    item_id integer NOT NULL,
    item_type character varying(50) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT list_items_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['dish'::character varying, 'restaurant'::character varying])::text[])))
);

CREATE TABLE public.listitems (
    id integer NOT NULL,
    list_id integer NOT NULL,
    item_type character varying(20) NOT NULL,
    item_id integer NOT NULL,
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    notes text,
    CONSTRAINT listitems_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['dish'::character varying, 'restaurant'::character varying])::text[])))
);
```

**Issues**:
- Redundant tables (`list_items` and `listitems`) with similar schemas
- `is_following` in lists should be a computed property, not stored
- Inconsistent timestamp types between tables
- Missing foreign key constraint from `lists.user_id` to `users.id`
- `created_by_user` is redundant with `user_id IS NOT NULL`

**Model Usage**:
- The `listModel.js` primarily uses `listitems` table, not `list_items`

### 3.3 Restaurants Table

```sql
CREATE TABLE public.restaurants (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    neighborhood_id integer,
    city_id integer NOT NULL,
    zip_code character varying(10),
    phone character varying(20),
    website character varying(255),
    google_place_id character varying(255),
    latitude numeric(9,6),
    longitude numeric(9,6),
    adds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    chain_id integer
);
```

**Issues**:
- Missing unique constraint on `google_place_id`
- `instagram_handle` is referenced in code but missing from schema
- Missing index on `name` which is frequently searched
- No validation for phone number format

**Model Usage**:
- `restaurantModel.js` references `instagram_handle` which isn't in the schema

### 3.4 Dishes Table

```sql
CREATE TABLE public.dishes (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    restaurant_id integer NOT NULL,
    price character varying(50),
    adds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_common boolean DEFAULT false
);
```

**Issues**:
- `price` as character varying instead of numeric type
- Missing `created_by` column referenced in the model
- No index on `name` which is frequently searched

**Model Usage**:
- `simplified-dishModel.js` references `created_by` column which isn't in the schema

### 3.5 Vote Tables

Two tables with overlapping purposes:
```sql
CREATE TABLE public.dishvotes (
    id integer NOT NULL,
    dish_id integer NOT NULL,
    user_id integer NOT NULL,
    vote_type character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dishvotes_vote_type_check CHECK (((vote_type)::text = ANY ((ARRAY['up'::character varying, 'neutral'::character varying, 'down'::character varying])::text[])))
);

CREATE TABLE public.reviewvotes (
    id integer NOT NULL,
    dish_id integer,
    vote_type text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviewvotes_vote_type_check CHECK ((vote_type = ANY (ARRAY['up'::text, 'neutral'::text, 'down'::text])))
);
```

**Issues**:
- Redundant tables with similar purposes
- `reviewvotes` lacks `user_id` column
- Inconsistent column types (`vote_type` as varchar vs text)
- Inconsistent timestamp types
- `dish_id` is NOT NULL in `dishvotes` but nullable in `reviewvotes`

## 4. Proposed Schema Changes

### 4.1 Tables to Drop

1. **list_items**: Redundant with `listitems` which is the primary table used in the models.

2. **reviewvotes**: Redundant with `dishvotes` which has a more complete schema.

### 4.2 Columns to Drop

1. **users.account_type**: Redundant with `users.role`.

2. **lists.is_following**: Should be a computed property, not stored.

3. **lists.created_by_user**: Redundant with `user_id IS NOT NULL`.

### 4.3 Columns to Add

1. **restaurants.instagram_handle**: Add to match code references.

2. **dishes.created_by**: Add to match model references.

3. **users.updated_at**: Add for consistency with other tables.

### 4.4 Columns to Modify

1. **dishes.price**: Change from `character varying(50)` to `numeric(10,2)`.

2. **users.role**: Add NOT NULL constraint and update check constraint to include 'admin'.

3. **Standardize timestamps**: Use `timestamp with time zone` consistently.

### 4.5 Constraints to Add

1. **Unique constraints**:
   - `users.username`
   - `users.email`
   - `restaurants.google_place_id` (where not null)

2. **Foreign key constraints**:
   - `lists.user_id` → `users.id`
   - `dishes.created_by` → `users.id`

### 4.6 Indexes to Add

1. **restaurants.name**: For faster text search.

2. **dishes.name**: For faster text search.

3. **users.email**: For faster login lookups.

## 5. Data Cleanup Actions

### 5.1 Orphaned Records

1. **Orphaned list items**: Remove list items referencing non-existent lists.

2. **Orphaned dishes**: Remove dishes referencing non-existent restaurants.

### 5.2 Redundant Data

1. **Migrate list_items to listitems**: Transfer any unique data from `list_items` to `listitems`.

2. **Migrate reviewvotes to dishvotes**: Transfer any unique data from `reviewvotes` to `dishvotes`.

### 5.3 Inconsistent Data

1. **Standardize role values**: Ensure all users have a valid role value.

2. **Fix null values**: Add appropriate default values where nulls exist in NOT NULL columns.

## 6. Migration Scripts

The following migration scripts will implement the proposed changes safely:

1. **01_add_missing_columns.sql**: Add missing columns to tables.
2. **02_standardize_timestamps.sql**: Standardize timestamp types.
3. **03_add_constraints.sql**: Add missing constraints.
4. **04_add_indexes.sql**: Add missing indexes.
5. **05_migrate_redundant_data.sql**: Migrate data from redundant tables.
6. **06_drop_redundant_columns.sql**: Drop redundant columns.
7. **07_drop_redundant_tables.sql**: Drop redundant tables.

## 7. Execution Plan

1. **Backup**: Create a full database backup before any changes.
2. **Development**: Apply migrations to development environment first.
3. **Testing**: Verify application functionality after each migration.
4. **Staging**: Apply verified migrations to staging environment.
5. **Production**: Schedule maintenance window for production deployment.

## 8. Recommendations for Backend Models

1. **Update userModel.js**: Use only `role` column, not `account_type`.
2. **Update listModel.js**: Ensure all queries use `listitems` table consistently.
3. **Update dishModel.js**: Add support for the new `created_by` column.
4. **Update restaurantModel.js**: Add support for the new `instagram_handle` column.

## Conclusion

This database review has identified several opportunities to improve the Chomp/Doof database schema. Implementing the proposed changes will reduce technical debt, improve data integrity, and optimize performance. The migration scripts provided ensure a safe transition to the improved schema.
