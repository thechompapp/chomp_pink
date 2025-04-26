-- migrations/update_lists_list_type.sql
ALTER TABLE public.lists
DROP CONSTRAINT lists_list_type_check;

ALTER TABLE public.lists
ADD CONSTRAINT lists_list_type_check
CHECK (list_type IN ('restaurant', 'dish', 'mixed'));