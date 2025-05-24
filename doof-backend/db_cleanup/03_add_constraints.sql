-- Migration: 03_add_constraints.sql
-- Description: Add missing constraints to improve data integrity

-- Add unique constraints to users table
ALTER TABLE public.users
ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE public.users
ADD CONSTRAINT users_email_key UNIQUE (email);

-- Update role column in users table to be NOT NULL and include 'admin' in check constraint
ALTER TABLE public.users
ALTER COLUMN role SET NOT NULL;

-- Drop the existing check constraint on account_type
ALTER TABLE public.users
DROP CONSTRAINT users_account_type_check;

-- Add a new check constraint for role that includes 'admin'
ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (
  (role)::text = ANY (ARRAY['user'::text, 'contributor'::text, 'superuser'::text, 'admin'::text])
);

-- Add unique constraint on google_place_id in restaurants table (where not null)
ALTER TABLE public.restaurants
ADD CONSTRAINT restaurants_google_place_id_key UNIQUE (google_place_id)
WHERE google_place_id IS NOT NULL;

-- Add foreign key constraint from lists.user_id to users.id
ALTER TABLE public.lists
ADD CONSTRAINT fk_lists_user_id FOREIGN KEY (user_id)
REFERENCES public.users(id) ON DELETE SET NULL;

-- Rollback SQL (in case we need to revert these changes)
/*
ALTER TABLE public.users DROP CONSTRAINT users_username_key;
ALTER TABLE public.users DROP CONSTRAINT users_email_key;
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;
ALTER TABLE public.users DROP CONSTRAINT users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_account_type_check CHECK (
  (account_type)::text = ANY (ARRAY['user'::text, 'contributor'::text, 'superuser'::text])
);
ALTER TABLE public.restaurants DROP CONSTRAINT restaurants_google_place_id_key;
ALTER TABLE public.lists DROP CONSTRAINT fk_lists_user_id;
*/
