# Chomp/Doof Database Cleanup

This directory contains the database schema review report and migration scripts for cleaning up the Chomp/Doof application database.

## Overview

The database cleanup process addresses several issues identified in the current schema:

1. Redundant tables and columns
2. Inconsistent column naming and data types
3. Missing constraints and indexes
4. Unused or redundant columns
5. Orphaned records

## Files

- `database_review_report.md`: Comprehensive analysis of the database schema with identified issues and recommendations
- `01_add_missing_columns.sql`: Adds columns referenced in code but missing from schema
- `02_standardize_timestamps.sql`: Standardizes timestamp types across all tables
- `03_add_constraints.sql`: Adds missing constraints to improve data integrity
- `04_add_indexes.sql`: Adds missing indexes to improve query performance
- `05_migrate_redundant_data.sql`: Migrates data from redundant tables before dropping them
- `06_drop_redundant_columns.sql`: Drops redundant columns after data migration
- `07_drop_redundant_tables.sql`: Drops redundant tables after data migration
- `08_cleanup_orphaned_records.sql`: Identifies and cleans up orphaned records

## Implementation Plan

### Prerequisites

1. Create a full database backup before applying any changes:
   ```bash
   pg_dump -U doof_user -d doof_db -f doof_db_backup_$(date +%Y%m%d).sql
   ```

### Execution Steps

1. **Development Environment**:
   - Apply each migration script in sequence
   - Test application functionality after each script
   - Fix any issues before proceeding to the next script

2. **Staging Environment**:
   - Once verified in development, apply to staging
   - Perform comprehensive testing of all application features
   - Verify that no data loss or functionality issues occur

3. **Production Environment**:
   - Schedule a maintenance window
   - Create a full backup before applying changes
   - Apply the migration scripts in sequence
   - Verify application functionality after migration

### Applying Migrations

To apply a migration script:

```bash
psql -U doof_user -d doof_db -f /path/to/migration_script.sql
```

### Rollback

Each migration script includes commented rollback SQL that can be used to revert changes if necessary. To rollback:

1. Uncomment the rollback SQL section
2. Save to a new file (e.g., `rollback_01.sql`)
3. Apply the rollback script:
   ```bash
   psql -U doof_user -d doof_db -f /path/to/rollback_script.sql
   ```

## Model Updates Required

After applying these database changes, the following model files need to be updated:

1. `userModel.js`: Update to use only `role` column, not `account_type`
2. `listModel.js`: Ensure all queries use `listitems` table consistently
3. `dishModel.js`: Add support for the new `created_by` column
4. `restaurantModel.js`: Add support for the new `instagram_handle` column

## Verification

After applying all migrations, verify the database structure with:

```bash
pg_dump --schema-only -d doof_db > updated_schema_dump_after_cleanup.sql
```

Compare this with the expected schema to ensure all changes were applied correctly.
