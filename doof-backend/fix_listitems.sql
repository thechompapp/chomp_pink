-- fix_listitems.sql
-- Applies database changes for listitems validation, list_items removal, restaurant_chains, and photo_url
BEGIN;

-- Drop invalid trigger if it exists
DROP TRIGGER IF EXISTS trigger_validate_listitem_item_id ON listitems;

-- Create or replace validate_listitem_item_id function
CREATE OR REPLACE FUNCTION validate_listitem_item_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_type = 'restaurant' THEN
    IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = NEW.item_id) THEN
      RAISE EXCEPTION 'Invalid restaurant ID % for item_type ''restaurant''.', NEW.item_id;
    END IF;
  ELSIF NEW.item_type = 'dish' THEN
    IF NOT EXISTS (SELECT 1 FROM dishes WHERE id = NEW.item_id) THEN
      RAISE EXCEPTION 'Invalid dish ID % for item_type ''dish''.', NEW.item_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid item_type %. Must be ''restaurant'' or ''dish''.', NEW.item_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_validate_listitem_item_id'
    AND tgrelid = 'listitems'::regclass
  ) THEN
    CREATE TRIGGER trigger_validate_listitem_item_id
    BEFORE INSERT OR UPDATE ON listitems
    FOR EACH ROW
    EXECUTE FUNCTION validate_listitem_item_id();
  END IF;
END
$$;

-- Remove list_items table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'list_items') THEN
    DROP TABLE list_items CASCADE;
  END IF;
END
$$;

-- Create restaurant_chains table
CREATE TABLE IF NOT EXISTS restaurant_chains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  website VARCHAR(2048),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add restaurant_chains trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_timestamp_restaurant_chains'
    AND tgrelid = 'restaurant_chains'::regclass
  ) THEN
    CREATE TRIGGER set_timestamp_restaurant_chains
    BEFORE UPDATE ON restaurant_chains
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Add restaurant_chains index
CREATE INDEX IF NOT EXISTS idx_restaurant_chains_name ON restaurant_chains(name);

-- Remove photo_url from restaurants
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE restaurants DROP COLUMN photo_url;
  END IF;
END
$$;

COMMIT;
