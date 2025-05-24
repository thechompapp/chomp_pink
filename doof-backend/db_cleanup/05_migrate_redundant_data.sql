-- Migration: 05_migrate_redundant_data.sql
-- Description: Migrate data from redundant tables before dropping them

-- Begin transaction
BEGIN;

-- 1. Migrate data from list_items to listitems if not already present
INSERT INTO public.listitems (list_id, item_type, item_id, notes)
SELECT li.list_id, li.item_type, li.item_id, li.notes
FROM public.list_items li
WHERE NOT EXISTS (
    SELECT 1 
    FROM public.listitems 
    WHERE list_id = li.list_id 
    AND item_type = li.item_type 
    AND item_id = li.item_id
);

-- 2. Migrate data from reviewvotes to dishvotes if not already present
-- Note: reviewvotes lacks user_id, so we'll use a default value (1) for admin user
-- This is not ideal but preserves the data. In production, you might want to handle this differently.
INSERT INTO public.dishvotes (dish_id, user_id, vote_type, created_at)
SELECT rv.dish_id, 1, rv.vote_type::character varying(10), rv.created_at
FROM public.reviewvotes rv
WHERE rv.dish_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 
    FROM public.dishvotes 
    WHERE dish_id = rv.dish_id 
    AND vote_type = rv.vote_type::character varying(10)
);

-- 3. Update users table to use role instead of account_type
UPDATE public.users
SET role = account_type
WHERE role IS NULL OR role = '';

-- Commit transaction
COMMIT;

-- Rollback SQL (in case we need to revert these changes)
/*
-- This rollback is complex and would require careful consideration in a real scenario
-- as it involves data that may have been modified after migration.
-- A proper rollback would require a backup of the original data.
*/
