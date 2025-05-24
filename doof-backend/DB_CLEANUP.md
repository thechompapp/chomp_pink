Prompt: Comprehensive Database Schema and Data Review & Cleanup for Chomp/Doof Backend
Objective: Conduct a thorough review of the "Chomp/Doof" application's PostgreSQL database schema and existing data (on a development or staging environment). The goals are to identify and rectify any obsolete or redundant columns and data, ensure data integrity, optimize schema design where necessary, and prepare for any required schema migrations. This is a critical step in reducing technical debt and improving data management efficiency.

Prerequisite Information (to be sourced from the "Project Handoff Summary" - ID: chomp_doof_refined_project_summary_prompt and codebase):

Current Database Schema (from doof-backend/schema_dump.sql, migrations/*, or by inspecting a development database).

Backend Models (doof-backend/models/*): To understand how the application currently interacts with each table and column.

API Documentation (Section 6 of Project Summary): To understand what data fields are exposed or expected by the API.

Program Flow Mapping (Section 10 of Project Summary): To understand how data is used in various application features.

Target Audience: A developer or database administrator tasked with this review and cleanup.

Core Tasks and Instructions:

Obtain Current Schema Dump:

Action: Generate an up-to-date schema dump (pg_dump --schema-only) from the primary development or staging database. This will serve as the baseline for review.

File to Reference: doof-backend/schema_dump.sql (if up-to-date) and migrations/* files.

Schema Review - Table by Table, Column by Column:

For each table in the database:

Verify Table Purpose: Confirm the table's overall necessity based on current application features and backend models. Are there any tables that seem entirely unused by doof-backend/models/* or any API endpoint?

For each column in the table:

Data Type Appropriateness: Is the data type (e.g., VARCHAR, INTEGER, BOOLEAN, TIMESTAMP, JSONB) appropriate for the data it stores? Could it be more specific or optimized (e.g., using TEXT instead of VARCHAR(255) if length is highly variable and potentially long, or SMALLINT instead of INTEGER if values are always small)?

Constraints Review:

NOT NULL: Is it correctly applied? Are there columns that should be NOT NULL but aren't, or vice-versa?

UNIQUE: Are unique constraints correctly defined for columns that require unique values (e.g., users.email)?

DEFAULT: Are default values appropriate?

CHECK: Are there opportunities to use check constraints for simple data validation at the database level?

Indexing Review:

Are there appropriate indexes on columns frequently used in WHERE clauses, JOIN conditions, or ORDER BY clauses (review queries in doof-backend/models/*)?

Are there redundant or unused indexes that can be dropped?

Foreign Keys:

Are all relationships between tables correctly defined with foreign key constraints?

Are ON DELETE / ON UPDATE cascade/set null/restrict behaviors appropriate for each relationship?

Column Usage Analysis (Crucial for Obsolescence):

Backend Models: Is this column actively selected, inserted, or updated by any function in the corresponding doof-backend/models/[entity]Model.js file?

API Layer: Is this column's data exposed via any API endpoint (check API documentation and doof-backend/controllers/*)? Is it accepted as input in any POST/PUT request?

Application Logic: If not directly in models or API responses, is there any evidence it's used for internal backend logic, calculations, or reporting (this might require deeper code review in controllers or services)?

Flag for Obsolescence: If a column is not used by models, not exposed by APIs, and not involved in any discernible backend logic, flag it as potentially obsolete.

Data Review (on a non-production environment):

Identify Orphaned Records: For tables with foreign key relationships, are there records in child tables that point to non-existent parent records (if FK constraints were missing or disabled at some point)?

Identify Redundant/Test/Junk Data:

Are there large swathes of clearly identifiable test data (e.g., records with names like "Test User," "Sample Dish") that are no longer needed and can be cleaned up from development/staging environments?

Are there duplicated records that violate intended uniqueness (even if no DB constraint exists)?

Analyze Data in Potentially Obsolete Columns:

For columns flagged as potentially obsolete in Step 2:

What kind of data do they contain? Is it all NULL? Does it look like legacy data from a previous feature?

If they contain data, assess the risk/impact of losing this data if the column is dropped. Is there any historical value or edge-case scenario where it might be needed?

Propose Schema Changes & Data Cleanup Actions:

Based on the review, compile a list of proposed changes:

Columns to Drop: List each column identified as obsolete, the table it belongs to, and a brief justification.

Tables to Drop (if any): List any tables deemed entirely unused, with justification.

Columns to Modify: (e.g., change data type, add/remove NOT NULL).

Indexes to Add/Drop/Modify.

Constraints to Add/Drop/Modify.

Data Cleanup Scripts/Strategies: (e.g., SQL queries to delete orphaned records, remove specific test data).

Prioritize Changes: Categorize proposed changes by impact and risk (low-risk changes like dropping a clearly unused column with all NULL values vs. higher-risk changes like altering a data type on a populated column).

Develop Migration Scripts:

For all schema changes (dropping/adding/modifying columns, tables, indexes, constraints), create new SQL migration scripts (e.g., in the migrations/ directory, following the existing naming convention).

These scripts must be reversible where possible (i.e., include logic to undo the change).

Test these migration scripts thoroughly on a local development database that mirrors the structure of the target environment.

Execution Plan (for applying changes):

Outline the steps to apply these changes to development, staging, and eventually production environments (the latter requiring extreme caution, backups, and potential downtime planning).

Backup First: Emphasize that a full database backup is mandatory before applying any schema-altering or data-deleting scripts to any environment, especially staging and production.

Specific Questions to Guide the Review:

Are there any columns that were part of a feature that has since been removed or significantly refactored?

Are there columns that seem to duplicate information available in other columns or tables (potential denormalization that might not be optimal)?

Looking at the migrations/ history, can you trace when certain columns were added and if their original purpose is still valid?

Does the data in timestamp columns (e.g., created_at, updated_at) look consistently populated and correct?

Are enums (if used via ENUM types or check constraints) comprehensive and still accurate?

For JSON or JSONB columns, is the stored JSON structure consistent and are all its fields actively used by the application?

Deliverables:

A Database Review Report detailing:

Findings for each table and column.

A list of all identified obsolete columns/tables with justifications.

A list of proposed schema optimizations (data types, indexes, constraints).

A summary of data integrity issues found (orphaned records, junk data).

A set of SQL Migration Scripts for all proposed schema changes, tested on a development database.

A Data Cleanup Plan/Scripts for removing unnecessary data from non-production environments.

Recommendations for any necessary updates to backend models (doof-backend/models/*) to reflect schema changes.

Caution: Direct modification or deletion of data/schema in a production environment must be approached with extreme caution, thorough planning, and after successful application and verification in staging environments. Always prioritize data integrity and application stability.