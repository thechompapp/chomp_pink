-- src/doof-backend/setup.sql

-- Drop existing tables if they exist (optional, ensures clean slate)
DROP TABLE IF EXISTS Submissions CASCADE;
DROP TABLE IF EXISTS Neighborhoods CASCADE;
DROP TABLE IF EXISTS Filters CASCADE;
DROP TABLE IF EXISTS Restaurants CASCADE;
DROP TABLE IF EXISTS Dishes CASCADE;
DROP TABLE IF EXISTS CommonDishes CASCADE;
DROP TABLE IF EXISTS Lists CASCADE;
DROP TABLE IF EXISTS ListItems CASCADE; -- Added just in case it exists/was missed
DROP TABLE IF EXISTS DishHashtags CASCADE; -- Added just in case it exists/was missed
DROP TABLE IF EXISTS Hashtags CASCADE; -- Added just in case it exists/was missed
DROP TABLE IF EXISTS DishVotes CASCADE; -- Added just in case it exists/was missed
-- DROP TABLE IF EXISTS Users CASCADE;

-- Create Submissions table
CREATE TABLE IF NOT EXISTS Submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER, -- Link to Users table eventually
  type VARCHAR(50) NOT NULL CHECK (type IN ('restaurant', 'dish')),
  name VARCHAR(255) NOT NULL,
  location TEXT, -- Could be address for restaurant, or restaurant name for dish
  tags TEXT[],
  place_id VARCHAR(255), -- Google Place ID, if applicable
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER -- Link to admin user ID
);

-- Create Neighborhoods table (Lookup)
CREATE TABLE IF NOT EXISTS Neighborhoods (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(10),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  borough VARCHAR(100), -- e.g., Manhattan, Brooklyn
  UNIQUE(neighborhood, city) -- Ensure unique neighborhood per city
);

-- Create Filters table (OBSOLETE - Use Hashtags)
-- DROP TABLE IF EXISTS Filters CASCADE; -- Consider removing if not used

-- Create Hashtags table (For Cuisines, Tags, etc.)
CREATE TABLE IF NOT EXISTS Hashtags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'italian', 'pizza', 'spicy', 'vegetarian'
  category VARCHAR(50) -- Optional: 'cuisine', 'dietary', 'vibe', etc.
);

-- Create Restaurants table
CREATE TABLE IF NOT EXISTS Restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT, -- Full address
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  zip_code VARCHAR(10),
  borough VARCHAR(100),
  phone VARCHAR(20),
  website VARCHAR(255),
  google_place_id VARCHAR(255) UNIQUE,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  tags TEXT[], -- DEPRECATED? Consider linking via many-to-many if needed
  adds INTEGER DEFAULT 0, -- How many times added to lists / saved?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- Consider adding foreign key to Neighborhoods if useful
  -- FOREIGN KEY (neighborhood, city) REFERENCES Neighborhoods(neighborhood, city)
);

-- Create Dishes table
CREATE TABLE IF NOT EXISTS Dishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  restaurant_id INTEGER NOT NULL,
  price VARCHAR(50), -- Or use DECIMAL if accuracy needed
  adds INTEGER DEFAULT 0, -- How many times added to lists / saved?
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_common BOOLEAN DEFAULT FALSE, -- Flag if it's a widely known dish
  -- FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE, -- Ensure restaurant exists
  UNIQUE(name, restaurant_id) -- A dish name should be unique per restaurant
);

-- Create DishHashtags table (Many-to-Many linking Dishes and Hashtags)
CREATE TABLE IF NOT EXISTS DishHashtags (
  dish_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (dish_id, hashtag_id)
  -- FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE,
  -- FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);


-- Create CommonDishes table (OBSOLETE - Use is_common flag in Dishes and Hashtags)
-- DROP TABLE IF EXISTS CommonDishes CASCADE;

-- Create Lists table
CREATE TABLE IF NOT EXISTS Lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  items JSONB DEFAULT '[]'::jsonb, -- Store array of {id, type, name, restaurant?}
  item_count INTEGER DEFAULT 0,
  saved_count INTEGER DEFAULT 0, -- How many users follow/saved this list
  city VARCHAR(100),
  tags TEXT[], -- *** ADDED THIS MISSING COLUMN ***
  is_public BOOLEAN DEFAULT TRUE,
  created_by_user BOOLEAN DEFAULT FALSE, -- Or link to user ID
  creator_handle VARCHAR(100), -- Denormalized for display?
  is_following BOOLEAN DEFAULT FALSE, -- Specific to the *viewing* user (needs user context)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- user_id INTEGER -- Link to Users table eventually
);

-- Create ListItems table (Alternative to JSONB storage in Lists.items)
-- Decide if you want JSONB in Lists OR this separate table. Don't use both for same purpose.
-- CREATE TABLE IF NOT EXISTS ListItems (
--   id SERIAL PRIMARY KEY,
--   list_id INTEGER NOT NULL,
--   item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('dish', 'restaurant')),
--   item_id INTEGER NOT NULL, -- Refers to Dishes.id or Restaurants.id
--   added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   notes TEXT,
--   -- FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE,
--   UNIQUE (list_id, item_type, item_id)
-- );


-- Create DishVotes table
CREATE TABLE IF NOT EXISTS DishVotes (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER NOT NULL,
  user_id INTEGER, -- Nullable for anonymous voting? Link to Users later.
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'neutral', 'down')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE,
  UNIQUE (dish_id, user_id) -- Prevent user voting multiple times (if user_id used)
);


-- Grant permissions (Ensure user exists first)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO doof_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO doof_user;

-- Add Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON Dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_dish_id ON DishHashtags(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_hashtag_id ON DishHashtags(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_lists_city ON Lists(city);
CREATE INDEX IF NOT EXISTS idx_lists_is_public ON Lists(is_public);
CREATE INDEX IF NOT EXISTS idx_dishvotes_dish_id ON DishVotes(dish_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON Submissions(status);
CREATE INDEX IF NOT EXISTS idx_restaurants_name_city_neighborhood ON Restaurants(name, city, neighborhood);