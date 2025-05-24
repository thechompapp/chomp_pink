-- Migration: 06_drop_redundant_columns.sql
-- Description: Drop redundant columns after data migration

-- Begin transaction
BEGIN;

-- 1. Drop account_type column from users table (role is now the standard)
ALTER TABLE public.users
DROP COLUMN account_type;

-- 2. Drop is_following column from lists table (should be computed, not stored)
ALTER TABLE public.lists
DROP COLUMN is_following;

-- 3. Drop created_by_user column from lists table (redundant with user_id)
ALTER TABLE public.lists
DROP COLUMN created_by_user;

-- 4. Modify dishes.price to use numeric type instead of varchar
-- First, create a new column with the correct type
ALTER TABLE public.dishes
ADD COLUMN price_numeric numeric(10,2);

-- Update the new column with converted values from the old column
UPDATE public.dishes
SET price_numeric = 
    CASE 
        WHEN price ~ '^[0-9]+(\.[0-9]+)?$' THEN price::numeric(10,2)
        WHEN price ~ '^\$[0-9]+(\.[0-9]+)?$' THEN substring(price from 2)::numeric(10,2)
        ELSE NULL
    END;

-- Drop the old column and rename the new one
ALTER TABLE public.dishes
DROP COLUMN price;

ALTER TABLE public.dishes
RENAME COLUMN price_numeric TO price;

-- Commit transaction
COMMIT;

-- Rollback SQL (in case we need to revert these changes)
/*
-- Add back the dropped columns
ALTER TABLE public.users
ADD COLUMN account_type character varying(20) DEFAULT 'user'::character varying NOT NULL;

UPDATE public.users
SET account_type = role;

ALTER TABLE public.lists
ADD COLUMN is_following boolean DEFAULT false NOT NULL;

ALTER TABLE public.lists
ADD COLUMN created_by_user boolean DEFAULT false NOT NULL;

UPDATE public.lists
SET created_by_user = (user_id IS NOT NULL);

-- Revert price column change
ALTER TABLE public.dishes
ADD COLUMN price_varchar character varying(50);

UPDATE public.dishes
SET price_varchar = price::text;

ALTER TABLE public.dishes
DROP COLUMN price;

ALTER TABLE public.dishes
RENAME COLUMN price_varchar TO price;
*/
