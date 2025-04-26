-- migrations/add_notes_to_listitems.sql
ALTER TABLE public.listitems
ADD COLUMN notes TEXT;