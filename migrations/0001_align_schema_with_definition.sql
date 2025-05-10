-- Migration: Align database schema with schema_definition.sql
-- Date: May 10, 2025

-- Add missing columns and constraints as identified in the handover document

-- 1. Add missing columns to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city_name VARCHAR(100);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS neighborhood_name VARCHAR(100);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS borough VARCHAR(100);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS submitted_by_user_id INTEGER REFERENCES users(id);

-- Make sure all tables have created_at and updated_at columns
-- Check and add to hashtags
ALTER TABLE hashtags ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE hashtags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Check and add to cities
ALTER TABLE cities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE cities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Check and add to neighborhoods
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add missing columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add missing columns to submissions
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS dish_id INTEGER REFERENCES dishes(id) ON DELETE SET NULL;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 4. Add unique constraint to refresh_tokens to support ON CONFLICT
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_user_id_key'
  ) THEN
    ALTER TABLE refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

-- 5. Create any missing timestamps triggers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_hashtags'
  ) THEN
    CREATE TRIGGER set_timestamp_hashtags
    BEFORE UPDATE ON hashtags
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_cities'
  ) THEN
    CREATE TRIGGER set_timestamp_cities
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_neighborhoods'
  ) THEN
    CREATE TRIGGER set_timestamp_neighborhoods
    BEFORE UPDATE ON neighborhoods
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_users'
  ) THEN
    CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;
