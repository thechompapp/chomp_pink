-- Migration: 04_add_indexes.sql
-- Description: Add missing indexes to improve query performance

-- Add index on restaurants.name for faster text search
CREATE INDEX idx_restaurants_name ON public.restaurants USING gin (name gin_trgm_ops);

-- Add index on dishes.name for faster text search
CREATE INDEX idx_dishes_name ON public.dishes USING gin (name gin_trgm_ops);

-- Add index on users.email for faster login lookups
CREATE INDEX idx_users_email ON public.users USING btree (email);

-- Add index on restaurants.city_id for faster filtering
CREATE INDEX idx_restaurants_city_id ON public.restaurants USING btree (city_id);

-- Add index on restaurants.neighborhood_id for faster filtering
CREATE INDEX idx_restaurants_neighborhood_id ON public.restaurants USING btree (neighborhood_id);

-- Add index on listitems.list_id for faster list item lookups
CREATE INDEX idx_listitems_list_id ON public.listitems USING btree (list_id);

-- Add index on listitems.item_id and item_type for faster lookups
CREATE INDEX idx_listitems_item ON public.listitems USING btree (item_id, item_type);

-- Rollback SQL (in case we need to revert these changes)
/*
DROP INDEX IF EXISTS public.idx_restaurants_name;
DROP INDEX IF EXISTS public.idx_dishes_name;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_restaurants_city_id;
DROP INDEX IF EXISTS public.idx_restaurants_neighborhood_id;
DROP INDEX IF EXISTS public.idx_listitems_list_id;
DROP INDEX IF EXISTS public.idx_listitems_item;
*/
