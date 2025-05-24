-- Migration: 01_add_missing_columns.sql
-- Description: Add missing columns to tables that are referenced in code but missing from schema

-- Add instagram_handle to restaurants table
ALTER TABLE public.restaurants
ADD COLUMN instagram_handle character varying(255);

-- Add created_by to dishes table
ALTER TABLE public.dishes
ADD COLUMN created_by integer REFERENCES public.users(id);

-- Add updated_at to users table
ALTER TABLE public.users
ADD COLUMN updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP;

-- Add trigger to automatically update the updated_at timestamp for users
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Rollback SQL (in case we need to revert these changes)
/*
ALTER TABLE public.restaurants DROP COLUMN instagram_handle;
ALTER TABLE public.dishes DROP COLUMN created_by;
ALTER TABLE public.users DROP COLUMN updated_at;
DROP TRIGGER IF EXISTS set_timestamp_users ON public.users;
*/
