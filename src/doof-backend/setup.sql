-- src/doof-backend/setup.sql (Refactored List Items)

-- Drop existing tables in reverse order of dependency
DROP TABLE IF EXISTS ListItems CASCADE; -- Drop new table first if re-running
DROP TABLE IF EXISTS RestaurantHashtags CASCADE;
DROP TABLE IF EXISTS DishVotes CASCADE;
DROP TABLE IF EXISTS DishHashtags CASCADE;
DROP TABLE IF EXISTS Submissions CASCADE;
DROP TABLE IF EXISTS Dishes CASCADE;
DROP TABLE IF EXISTS Restaurants CASCADE;
DROP TABLE IF EXISTS Neighborhoods CASCADE;
DROP TABLE IF EXISTS Cities CASCADE;
DROP TABLE IF EXISTS Hashtags CASCADE;
DROP TABLE IF EXISTS Lists CASCADE; -- Drop Lists to remove old columns cleanly

-- Placeholder for Users table
-- CREATE TABLE IF NOT EXISTS Users (...);

-- Create Cities, Neighborhoods, Hashtags tables (Keep as before)
CREATE TABLE IF NOT EXISTS Cities (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE);
CREATE INDEX IF NOT EXISTS idx_cities_name ON Cities(name);
CREATE TABLE IF NOT EXISTS Neighborhoods (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, city_id INTEGER NOT NULL, borough VARCHAR(100), CONSTRAINT fk_neighborhood_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE, UNIQUE(name, city_id));
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON Neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name ON Neighborhoods(name);
CREATE TABLE IF NOT EXISTS Hashtags (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, category VARCHAR(50));
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON Hashtags(name);

-- Create Restaurants table (Keep as before)
CREATE TABLE IF NOT EXISTS Restaurants (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, address TEXT, neighborhood_id INTEGER, city_id INTEGER NOT NULL, neighborhood_name VARCHAR(100), city_name VARCHAR(100), zip_code VARCHAR(10), borough VARCHAR(100), phone VARCHAR(20), website VARCHAR(255), google_place_id VARCHAR(255) UNIQUE, latitude DECIMAL(9, 6), longitude DECIMAL(9, 6), adds INTEGER DEFAULT 0 NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_restaurant_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE, CONSTRAINT fk_restaurant_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES Neighborhoods(id) ON DELETE SET NULL);
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON Restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_city_id_neighborhood_id ON Restaurants(city_id, neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_adds ON Restaurants(adds DESC);

-- Create RestaurantHashtags table (Keep as before)
CREATE TABLE IF NOT EXISTS RestaurantHashtags (restaurant_id INTEGER NOT NULL, hashtag_id INTEGER NOT NULL, PRIMARY KEY (restaurant_id, hashtag_id), CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE, CONSTRAINT fk_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_resthashtags_restaurant_id ON RestaurantHashtags(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_resthashtags_hashtag_id ON RestaurantHashtags(hashtag_id);

-- Create Dishes table (Keep as before)
CREATE TABLE IF NOT EXISTS Dishes (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, restaurant_id INTEGER NOT NULL, price VARCHAR(50), adds INTEGER DEFAULT 0 NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, is_common BOOLEAN DEFAULT FALSE, CONSTRAINT fk_dishes_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE, UNIQUE(name, restaurant_id));
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON Dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON Dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_adds ON Dishes(adds DESC);

-- Create DishHashtags table (Keep as before)
CREATE TABLE IF NOT EXISTS DishHashtags (dish_id INTEGER NOT NULL, hashtag_id INTEGER NOT NULL, PRIMARY KEY (dish_id, hashtag_id), CONSTRAINT fk_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE, CONSTRAINT fk_dish_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_dish_id ON DishHashtags(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_hashtag_id ON DishHashtags(hashtag_id);

-- Create Lists table (REMOVED items and item_count columns)
CREATE TABLE IF NOT EXISTS Lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- items JSONB DEFAULT '[]'::jsonb NOT NULL, -- REMOVED
  -- item_count INTEGER DEFAULT 0 NOT NULL, -- REMOVED (will be calculated dynamically or via trigger)
  saved_count INTEGER DEFAULT 0 NOT NULL,
  city_name VARCHAR(100),
  tags TEXT[],
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  created_by_user BOOLEAN DEFAULT FALSE NOT NULL,
  creator_handle VARCHAR(100),
  is_following BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  -- user_id INTEGER,
  -- CONSTRAINT fk_list_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
-- Indexes for Lists (remove item_count if it was indexed)
CREATE INDEX IF NOT EXISTS idx_lists_city_name ON Lists(city_name);
CREATE INDEX IF NOT EXISTS idx_lists_is_public_saved ON Lists(is_public, saved_count DESC);
CREATE INDEX IF NOT EXISTS idx_lists_tags ON Lists USING GIN (tags);

-- *** NEW: Create ListItems table ***
CREATE TABLE IF NOT EXISTS ListItems (
  id SERIAL PRIMARY KEY, -- Unique ID for each list item entry
  list_id INTEGER NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('dish', 'restaurant')),
  -- References either Dishes(id) or Restaurants(id) based on item_type
  item_id INTEGER NOT NULL,
  -- Optional: Store denormalized names/details for easier retrieval? Or join always? Let's join for now.
  -- item_name VARCHAR(255),
  -- item_restaurant_name VARCHAR(255), -- If item_type is 'dish'
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Optional: Add a position column for ordering within the list
  -- position INTEGER,
  CONSTRAINT fk_listitems_list FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE, -- Delete items if list is deleted
  UNIQUE (list_id, item_type, item_id) -- Prevent adding the exact same item to the same list twice
);
-- Indexes for ListItems
CREATE INDEX IF NOT EXISTS idx_listitems_list_id ON ListItems(list_id);
CREATE INDEX IF NOT EXISTS idx_listitems_item_type_item_id ON ListItems(item_type, item_id); -- To find which lists contain an item

-- Create DishVotes table (Keep as before)
CREATE TABLE IF NOT EXISTS DishVotes (id SERIAL PRIMARY KEY, dish_id INTEGER NOT NULL, user_id INTEGER, vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'neutral', 'down')), created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_vote_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_dishvotes_dish_id ON DishVotes(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishvotes_user_id ON DishVotes(user_id);

-- Create Submissions table (Keep as before)
CREATE TABLE IF NOT EXISTS Submissions (id SERIAL PRIMARY KEY, user_id INTEGER, type VARCHAR(50) NOT NULL CHECK (type IN ('restaurant', 'dish')), name VARCHAR(255) NOT NULL, location TEXT, tags TEXT[], place_id VARCHAR(255), city VARCHAR(100), neighborhood VARCHAR(100), status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')), created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, reviewed_at TIMESTAMP WITH TIME ZONE, reviewed_by INTEGER);
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON Submissions(status, created_at);

-- Function and Triggers for updated_at timestamp (Keep as before)
CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DO $$ BEGIN DROP TRIGGER IF EXISTS set_timestamp_restaurants ON restaurants; DROP TRIGGER IF EXISTS set_timestamp_dishes ON dishes; DROP TRIGGER IF EXISTS set_timestamp_lists ON lists; IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants') THEN CREATE TRIGGER set_timestamp_restaurants BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp(); END IF; IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes') THEN CREATE TRIGGER set_timestamp_dishes BEFORE UPDATE ON dishes FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp(); END IF; IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lists') THEN CREATE TRIGGER set_timestamp_lists BEFORE UPDATE ON lists FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp(); END IF; END $$;