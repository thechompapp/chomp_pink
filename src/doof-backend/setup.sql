/* Updated src/doof-backend/setup.sql - Data-Preserving Version */

-- First, let's create any missing tables without dropping existing ones

-- Check and create Users table if it doesn't exist
CREATE TABLE IF NOT EXISTS Users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to Users (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
    ALTER TABLE Users ADD COLUMN password_hash VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_type') THEN
    ALTER TABLE Users ADD COLUMN account_type VARCHAR(20) DEFAULT 'user';
    
    -- Add constraint if column was just added
    ALTER TABLE Users ADD CONSTRAINT users_account_type_check 
    CHECK (account_type IN ('user', 'contributor', 'superuser'));
  END IF;
END
$$;

-- Make columns NOT NULL if they need to be
ALTER TABLE Users 
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

-- Set NOT NULL for password_hash only if it has values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM Users WHERE password_hash IS NULL) THEN
    ALTER TABLE Users ALTER COLUMN password_hash SET NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM Users WHERE account_type IS NULL) THEN
    ALTER TABLE Users ALTER COLUMN account_type SET NOT NULL;
  END IF;
END
$$;

-- Create Refresh_Tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS Refresh_Tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Create Cities table if it doesn't exist
CREATE TABLE IF NOT EXISTS Cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add NOT NULL constraints if needed
ALTER TABLE Cities ALTER COLUMN name SET NOT NULL;

-- Create Neighborhoods table if it doesn't exist
CREATE TABLE IF NOT EXISTS Neighborhoods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  city_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add zipcode_ranges column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'neighborhoods' AND column_name = 'zipcode_ranges') THEN
    ALTER TABLE Neighborhoods ADD COLUMN zipcode_ranges TEXT[] DEFAULT '{}';
  END IF;
END
$$;

-- Add constraints if not already present
ALTER TABLE Neighborhoods 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN city_id SET NOT NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_neighborhood_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE;

-- Create Hashtags table if it doesn't exist
CREATE TABLE IF NOT EXISTS Hashtags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add NOT NULL constraints if needed
ALTER TABLE Hashtags ALTER COLUMN name SET NOT NULL;

-- Create Restaurants table if it doesn't exist
CREATE TABLE IF NOT EXISTS Restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  city_id INTEGER,
  city_name VARCHAR(100),
  neighborhood_id INTEGER,
  neighborhood_name VARCHAR(100),
  address TEXT,
  google_place_id VARCHAR(255) UNIQUE,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  adds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set NOT NULL constraints
ALTER TABLE Restaurants ALTER COLUMN name SET NOT NULL;

-- Add constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'uq_restaurant_name_city' 
    AND table_name = 'restaurants'
  ) THEN
    ALTER TABLE Restaurants ADD CONSTRAINT uq_restaurant_name_city UNIQUE (name, city_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_restaurant_city' 
    AND table_name = 'restaurants'
  ) THEN
    ALTER TABLE Restaurants ADD CONSTRAINT fk_restaurant_city 
    FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_restaurant_neighborhood' 
    AND table_name = 'restaurants'
  ) THEN
    ALTER TABLE Restaurants ADD CONSTRAINT fk_restaurant_neighborhood 
    FOREIGN KEY (neighborhood_id) REFERENCES Neighborhoods(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Create RestaurantHashtags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS RestaurantHashtags (
  restaurant_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (restaurant_id, hashtag_id),
  CONSTRAINT fk_resthashtag_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE,
  CONSTRAINT fk_resthashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);

-- Create Dishes table if it doesn't exist
CREATE TABLE IF NOT EXISTS Dishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  restaurant_id INTEGER,
  adds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set NOT NULL constraints
ALTER TABLE Dishes 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN restaurant_id SET NOT NULL;

-- Add constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_dish_restaurant' 
    AND table_name = 'dishes'
  ) THEN
    ALTER TABLE Dishes ADD CONSTRAINT fk_dish_restaurant 
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'dishes_name_restaurant_id_key' 
    AND table_name = 'dishes'
  ) THEN
    ALTER TABLE Dishes ADD CONSTRAINT dishes_name_restaurant_id_key 
    UNIQUE (name, restaurant_id);
  END IF;
END
$$;

-- Create DishHashtags junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS DishHashtags (
  dish_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (dish_id, hashtag_id),
  CONSTRAINT fk_dishhashtag_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE,
  CONSTRAINT fk_dishhashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);

-- Create Lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS Lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  list_type VARCHAR(20) DEFAULT 'mixed',
  saved_count INTEGER DEFAULT 0,
  city_name VARCHAR(100),
  tags TEXT[],
  is_public BOOLEAN DEFAULT TRUE,
  creator_handle VARCHAR(100),
  user_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set NOT NULL constraints and add check constraint
ALTER TABLE Lists 
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN list_type SET NOT NULL,
  ALTER COLUMN saved_count SET NOT NULL,
  ALTER COLUMN is_public SET NOT NULL;

-- Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'lists_list_type_check' 
    AND table_name = 'lists'
  ) THEN
    ALTER TABLE Lists ADD CONSTRAINT lists_list_type_check 
    CHECK (list_type IN ('restaurant', 'dish', 'mixed'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_list_creator' 
    AND table_name = 'lists'
  ) THEN
    ALTER TABLE Lists ADD CONSTRAINT fk_list_creator 
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Create ListFollows table if it doesn't exist
CREATE TABLE IF NOT EXISTS ListFollows (
  list_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, user_id),
  CONSTRAINT fk_follow_list FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_follow_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Create ListItems junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS ListItems (
  id SERIAL PRIMARY KEY,
  list_id INTEGER,
  item_type VARCHAR(50),
  item_id INTEGER,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set NOT NULL constraints and add check constraint
ALTER TABLE ListItems 
  ALTER COLUMN list_id SET NOT NULL,
  ALTER COLUMN item_type SET NOT NULL,
  ALTER COLUMN item_id SET NOT NULL;

-- Add constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'listitems_item_type_check' 
    AND table_name = 'listitems'
  ) THEN
    ALTER TABLE ListItems ADD CONSTRAINT listitems_item_type_check 
    CHECK (item_type IN ('restaurant', 'dish'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_listitem_list' 
    AND table_name = 'listitems'
  ) THEN
    ALTER TABLE ListItems ADD CONSTRAINT fk_listitem_list 
    FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'listitems_list_id_item_type_item_id_key' 
    AND table_name = 'listitems'
  ) THEN
    ALTER TABLE ListItems ADD CONSTRAINT listitems_list_id_item_type_item_id_key 
    UNIQUE (list_id, item_type, item_id);
  END IF;
END
$$;

-- Create DishVotes table if it doesn't exist
CREATE TABLE IF NOT EXISTS DishVotes (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER,
  user_id INTEGER,
  vote_type VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set NOT NULL constraints and add check constraint
ALTER TABLE DishVotes 
  ALTER COLUMN dish_id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN vote_type SET NOT NULL;

-- Add constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'dishvotes_vote_type_check' 
    AND table_name = 'dishvotes'
  ) THEN
    ALTER TABLE DishVotes ADD CONSTRAINT dishvotes_vote_type_check 
    CHECK (vote_type IN ('up', 'neutral', 'down'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_vote_dish' 
    AND table_name = 'dishvotes'
  ) THEN
    ALTER TABLE DishVotes ADD CONSTRAINT fk_vote_dish 
    FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_vote_user' 
    AND table_name = 'dishvotes'
  ) THEN
    ALTER TABLE DishVotes ADD CONSTRAINT fk_vote_user 
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'dishvotes_dish_id_user_id_key' 
    AND table_name = 'dishvotes'
  ) THEN
    ALTER TABLE DishVotes ADD CONSTRAINT dishvotes_dish_id_user_id_key 
    UNIQUE (dish_id, user_id);
  END IF;
END
$$;

-- Create Submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS Submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type VARCHAR(50),
  name VARCHAR(255),
  location TEXT,
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  tags TEXT[],
  place_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by INTEGER
);

-- Set NOT NULL constraints and add check constraints
ALTER TABLE Submissions 
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN status SET NOT NULL;

-- Add constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'submissions_type_check' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE Submissions ADD CONSTRAINT submissions_type_check 
    CHECK (type IN ('restaurant', 'dish'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'submissions_status_check' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE Submissions ADD CONSTRAINT submissions_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_submission_user' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE Submissions ADD CONSTRAINT fk_submission_user 
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_submission_reviewer' 
    AND table_name = 'submissions'
  ) THEN
    ALTER TABLE Submissions ADD CONSTRAINT fk_submission_reviewer 
    FOREIGN KEY (reviewed_by) REFERENCES Users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Create Engagements table if it doesn't exist
CREATE TABLE IF NOT EXISTS Engagements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  item_id INTEGER,
  item_type VARCHAR(50),
  engagement_type VARCHAR(20),
  engagement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Set NOT NULL constraints and add check constraints
ALTER TABLE Engagements 
  ALTER COLUMN item_id SET NOT NULL,
  ALTER COLUMN item_type SET NOT NULL,
  ALTER COLUMN engagement_type SET NOT NULL;

-- Add constraints if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'engagements_item_type_check' 
    AND table_name = 'engagements'
  ) THEN
    ALTER TABLE Engagements ADD CONSTRAINT engagements_item_type_check 
    CHECK (item_type IN ('restaurant', 'dish', 'list'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'engagements_engagement_type_check' 
    AND table_name = 'engagements'
  ) THEN
    ALTER TABLE Engagements ADD CONSTRAINT engagements_engagement_type_check 
    CHECK (engagement_type IN ('view', 'click', 'add_to_list', 'share'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_engagement_user' 
    AND table_name = 'engagements'
  ) THEN
    ALTER TABLE Engagements ADD CONSTRAINT fk_engagement_user 
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL;
  END IF;
END
$$;

-- Create indexes (only if they don't exist)

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON Users(account_type);

-- Refresh_Tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON Refresh_Tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON Refresh_Tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON Refresh_Tokens(expires_at);

-- Cities indexes
CREATE INDEX IF NOT EXISTS idx_cities_name ON Cities(name);

-- Neighborhoods indexes
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON Neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name ON Neighborhoods(name);

-- Hashtags indexes
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON Hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_category ON Hashtags(category);
CREATE INDEX IF NOT EXISTS idx_hashtags_category_filter ON Hashtags(category);

-- Restaurants indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON Restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_city_id_neighborhood_id ON Restaurants(city_id, neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_adds ON Restaurants(adds DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_city_name ON Restaurants(city_name);
CREATE INDEX IF NOT EXISTS idx_restaurants_neighborhood_name ON Restaurants(neighborhood_name);
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at ON Restaurants(created_at DESC);

-- RestaurantHashtags indexes
CREATE INDEX IF NOT EXISTS idx_resthashtags_restaurant_id ON RestaurantHashtags(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_resthashtags_hashtag_id ON RestaurantHashtags(hashtag_id);

-- Dishes indexes
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON Dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON Dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_adds ON Dishes(adds DESC);
CREATE INDEX IF NOT EXISTS idx_dishes_created_at ON Dishes(created_at DESC);

-- DishHashtags indexes
CREATE INDEX IF NOT EXISTS idx_dishhashtags_dish_id ON DishHashtags(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_hashtag_id ON DishHashtags(hashtag_id);

-- Lists indexes
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON Lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_city_name ON Lists(city_name);
CREATE INDEX IF NOT EXISTS idx_lists_is_public_saved ON Lists(is_public, saved_count DESC);
CREATE INDEX IF NOT EXISTS idx_lists_tags ON Lists USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_lists_list_type ON Lists(list_type);
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON Lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lists_name ON Lists(name);
CREATE INDEX IF NOT EXISTS idx_lists_public_saved_created ON Lists(is_public, saved_count DESC NULLS LAST, created_at DESC);

-- ListFollows indexes
CREATE INDEX IF NOT EXISTS idx_listfollows_list_id ON ListFollows(list_id);
CREATE INDEX IF NOT EXISTS idx_listfollows_user_id ON ListFollows(user_id);

-- ListItems indexes
CREATE INDEX IF NOT EXISTS idx_listitems_list_id ON ListItems(list_id);
CREATE INDEX IF NOT EXISTS idx_listitems_item_type_item_id ON ListItems(item_type, item_id);

-- DishVotes indexes
CREATE INDEX IF NOT EXISTS idx_dishvotes_dish_id ON DishVotes(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishvotes_user_id ON DishVotes(user_id);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON Submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON Submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_place_id ON Submissions(place_id);
CREATE INDEX IF NOT EXISTS idx_submissions_name ON Submissions(name);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON Submissions(type);

-- Engagements indexes
CREATE INDEX IF NOT EXISTS idx_engagements_item ON Engagements(item_type, item_id, engagement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_engagements_user ON Engagements(user_id, engagement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_engagements_type_time ON Engagements(engagement_type, engagement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_engagements_type_time_item ON Engagements(item_type, engagement_timestamp DESC, item_id);

-- Function and Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_cities') THEN
    CREATE TRIGGER set_timestamp_cities BEFORE UPDATE ON Cities FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_neighborhoods') THEN
    CREATE TRIGGER set_timestamp_neighborhoods BEFORE UPDATE ON Neighborhoods FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_hashtags') THEN
    CREATE TRIGGER set_timestamp_hashtags BEFORE UPDATE ON Hashtags FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_restaurants') THEN
    CREATE TRIGGER set_timestamp_restaurants BEFORE UPDATE ON Restaurants FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_dishes') THEN
    CREATE TRIGGER set_timestamp_dishes BEFORE UPDATE ON Dishes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_lists') THEN
    CREATE TRIGGER set_timestamp_lists BEFORE UPDATE ON Lists FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Update existing user with temporary password if password_hash is NULL
DO $$
BEGIN
  UPDATE Users
  SET 
    password_hash = '$2a$10$6UMoKj8hWO7cmuYyqfDsz.QrKzZty33wOAX/oMEQAQQE9Jd1z5vIK', -- Bcrypt hash for 'temporary123'
    account_type = 'superuser'
  WHERE 
    password_hash IS NULL OR account_type IS NULL;
END
$$;

-- Final check to notify about still-missing required fields
DO $$
DECLARE
  users_missing_pw BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM Users WHERE password_hash IS NULL) INTO users_missing_pw;
  
  IF users_missing_pw THEN
    RAISE NOTICE 'WARNING: Some users still have NULL password_hash values! Fix these before setting NOT NULL constraint.';
  END IF;
END
$$;