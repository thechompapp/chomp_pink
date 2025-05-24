-- Migration: 08_cleanup_orphaned_records.sql
-- Description: Identify and clean up orphaned records in the database

-- Begin transaction
BEGIN;

-- 1. Find and remove orphaned list items (referencing non-existent lists)
DELETE FROM public.listitems
WHERE list_id NOT IN (SELECT id FROM public.lists);

-- 2. Find and remove orphaned dishes (referencing non-existent restaurants)
DELETE FROM public.dishes
WHERE restaurant_id NOT IN (SELECT id FROM public.restaurants);

-- 3. Find and remove orphaned dishvotes (referencing non-existent dishes)
DELETE FROM public.dishvotes
WHERE dish_id NOT IN (SELECT id FROM public.dishes);

-- 4. Find and remove orphaned dishhashtags (referencing non-existent dishes or hashtags)
DELETE FROM public.dishhashtags
WHERE dish_id NOT IN (SELECT id FROM public.dishes)
   OR hashtag_id NOT IN (SELECT id FROM public.hashtags);

-- 5. Find and remove orphaned restauranthashtags (referencing non-existent restaurants or hashtags)
DELETE FROM public.restauranthashtags
WHERE restaurant_id NOT IN (SELECT id FROM public.restaurants)
   OR hashtag_id NOT IN (SELECT id FROM public.hashtags);

-- 6. Find and remove orphaned list_follows (referencing non-existent lists or users)
DELETE FROM public.list_follows
WHERE list_id NOT IN (SELECT id FROM public.lists)
   OR user_id NOT IN (SELECT id FROM public.users);

-- 7. Find and remove orphaned engagements (referencing non-existent items)
DELETE FROM public.engagements
WHERE (item_type = 'restaurant' AND item_id NOT IN (SELECT id FROM public.restaurants))
   OR (item_type = 'dish' AND item_id NOT IN (SELECT id FROM public.dishes))
   OR (item_type = 'list' AND item_id NOT IN (SELECT id FROM public.lists));

-- 8. Find and remove orphaned refresh_tokens (referencing non-existent users)
DELETE FROM public.refresh_tokens
WHERE user_id NOT IN (SELECT id FROM public.users);

-- Commit transaction
COMMIT;

-- Rollback SQL (in case we need to revert these changes)
-- Note: Rollback is not practical for data deletion operations without a backup
