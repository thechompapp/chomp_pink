-- Migration: 07_drop_redundant_tables.sql
-- Description: Drop redundant tables after data migration

-- Begin transaction
BEGIN;

-- 1. Drop list_items table (redundant with listitems)
DROP TABLE IF EXISTS public.list_items;

-- 2. Drop reviewvotes table (redundant with dishvotes)
DROP TABLE IF EXISTS public.reviewvotes;

-- Commit transaction
COMMIT;

-- Rollback SQL (in case we need to revert these changes)
/*
-- Recreate the dropped tables
CREATE TABLE public.list_items (
    id integer NOT NULL,
    list_id integer NOT NULL,
    item_id integer NOT NULL,
    item_type character varying(50) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT list_items_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['dish'::character varying, 'restaurant'::character varying])::text[])))
);

CREATE SEQUENCE public.list_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.list_items_id_seq OWNED BY public.list_items.id;
ALTER TABLE ONLY public.list_items ALTER COLUMN id SET DEFAULT nextval('public.list_items_id_seq'::regclass);
ALTER TABLE ONLY public.list_items ADD CONSTRAINT list_items_pkey PRIMARY KEY (id);

CREATE TABLE public.reviewvotes (
    id integer NOT NULL,
    dish_id integer,
    vote_type text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviewvotes_vote_type_check CHECK ((vote_type = ANY (ARRAY['up'::text, 'neutral'::text, 'down'::text])))
);

CREATE SEQUENCE public.reviewvotes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.reviewvotes_id_seq OWNED BY public.reviewvotes.id;
ALTER TABLE ONLY public.reviewvotes ALTER COLUMN id SET DEFAULT nextval('public.reviewvotes_id_seq'::regclass);
ALTER TABLE ONLY public.reviewvotes ADD CONSTRAINT reviewvotes_pkey PRIMARY KEY (id);
*/
