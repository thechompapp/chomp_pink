#!/bin/bash

# Script to apply all database migration scripts in sequence
# This script will create a backup first, then apply each migration

# Configuration
DB_USER="doof_user"
DB_NAME="doof_db"
BACKUP_DIR="./backups"
MIGRATIONS_DIR="."
DATE_STAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Creating database backup before migrations..."
pg_dump -U $DB_USER -d $DB_NAME -f "$BACKUP_DIR/doof_db_backup_$DATE_STAMP.sql"

if [ $? -ne 0 ]; then
    echo "Error creating database backup. Aborting migrations."
    exit 1
fi

echo "Backup created successfully at $BACKUP_DIR/doof_db_backup_$DATE_STAMP.sql"

# Function to apply a migration script
apply_migration() {
    local script=$1
    echo "Applying migration: $script"
    psql -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/$script"
    
    if [ $? -ne 0 ]; then
        echo "Error applying migration $script. Aborting."
        exit 1
    fi
    
    echo "Migration $script applied successfully."
}

# Apply migrations in sequence
echo "Starting database migrations..."

apply_migration "01_add_missing_columns.sql"
apply_migration "02_standardize_timestamps.sql"
apply_migration "03_add_constraints.sql"
apply_migration "04_add_indexes.sql"
apply_migration "05_migrate_redundant_data.sql"
apply_migration "06_drop_redundant_columns.sql"
apply_migration "07_drop_redundant_tables.sql"
apply_migration "08_cleanup_orphaned_records.sql"

echo "All migrations completed successfully!"
echo "Database schema has been updated and optimized."
