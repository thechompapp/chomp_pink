-- Migration to fix schema inconsistencies
-- Each operation is in its own transaction for better error handling

-- 1. Users table updates
BEGIN;
  -- Rename account_type to role if it exists
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'account_type') THEN
      ALTER TABLE users RENAME COLUMN account_type TO role;
    END IF;
  END $$;

  
  -- Add updated_at if it doesn't exist
  ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  
  -- Update role check constraint
  DO $$
  BEGIN
    -- Drop old constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_account_type_check') THEN
      ALTER TABLE users DROP CONSTRAINT users_account_type_check;
    END IF;
    
    -- Add new constraint only if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
      ALTER TABLE users
        ADD CONSTRAINT users_role_check 
        CHECK ((role)::text = ANY (ARRAY['user'::text, 'contributor'::text, 'admin'::text]));
    END IF;
  END $$;
COMMIT;

-- 2. Restaurants table updates
BEGIN;
  ALTER TABLE restaurants
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS cuisine VARCHAR(100) DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS price_range VARCHAR(10) DEFAULT '$$$$',
    ADD COLUMN IF NOT EXISTS created_by INTEGER,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
  -- Add foreign key constraint separately
  ALTER TABLE restaurants 
    ADD CONSTRAINT fk_restaurants_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) 
    ON DELETE SET NULL;
    
  -- Update existing rows with default values
  UPDATE restaurants 
  SET 
    description = COALESCE(description, ''),
    cuisine = COALESCE(cuisine, 'other'),
    price_range = COALESCE(price_range, '$$$$'),
    updated_at = CURRENT_TIMESTAMP
  WHERE updated_at IS NULL;
COMMIT;

-- 3. Dishes table updates
BEGIN;
  ALTER TABLE dishes
    ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'main',
    ADD COLUMN IF NOT EXISTS created_by INTEGER,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    
  -- Add foreign key constraint separately
  ALTER TABLE dishes 
    ADD CONSTRAINT fk_dishes_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) 
    ON DELETE SET NULL;
    
  -- Update existing rows with default values
  UPDATE dishes 
  SET 
    category = COALESCE(category, 'main'),
    updated_at = CURRENT_TIMESTAMP
  WHERE updated_at IS NULL;
COMMIT;

-- 4. Create trigger function
BEGIN;
  CREATE OR REPLACE FUNCTION update_modified_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
COMMIT;

-- 5. Create triggers for all tables with updated_at
BEGIN;
  DO $$
  DECLARE
    t text;
  BEGIN
    FOR t IN 
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'updated_at' 
      AND table_schema = 'public'
      AND table_name IN ('users', 'restaurants', 'dishes')
    LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', t, t);
      EXECUTE format('CREATE TRIGGER update_%s_updated_at
                      BEFORE UPDATE ON %I
                      FOR EACH ROW EXECUTE FUNCTION update_modified_column()',
                     t, t);
    END LOOP;
  END $$;
COMMIT;
