-- Migration: 02_standardize_timestamps.sql
-- Description: Standardize timestamp types across all tables to use timestamp with time zone

-- Standardize users.created_at
ALTER TABLE public.users 
ALTER COLUMN created_at TYPE timestamp with time zone 
USING created_at AT TIME ZONE 'UTC';

-- Standardize list_items.created_at and updated_at
ALTER TABLE public.list_items 
ALTER COLUMN created_at TYPE timestamp with time zone 
USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.list_items 
ALTER COLUMN updated_at TYPE timestamp with time zone 
USING updated_at AT TIME ZONE 'UTC';

-- Standardize reviewvotes.created_at
ALTER TABLE public.reviewvotes 
ALTER COLUMN created_at TYPE timestamp with time zone 
USING created_at AT TIME ZONE 'UTC';

-- Rollback SQL (in case we need to revert these changes)
/*
ALTER TABLE public.users 
ALTER COLUMN created_at TYPE timestamp without time zone;

ALTER TABLE public.list_items 
ALTER COLUMN created_at TYPE timestamp without time zone,
ALTER COLUMN updated_at TYPE timestamp without time zone;

ALTER TABLE public.reviewvotes 
ALTER COLUMN created_at TYPE timestamp without time zone;
*/
