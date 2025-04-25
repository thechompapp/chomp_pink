-- verify_and_fix_listitems.sql
-- Verifies and completes database changes for listitems, restaurant_chains, and photo_url
BEGIN;

-- Ensure restaurant_chains table exists
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