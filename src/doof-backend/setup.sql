/* src/doof-backend/setup.sql */
-- Drop existing tables in reverse order of dependency
DROP TABLE IF EXISTS Engagements CASCADE;
DROP TABLE IF EXISTS ListFollows CASCADE;
DROP TABLE IF EXISTS ListItems CASCADE;
DROP TABLE IF EXISTS RestaurantHashtags CASCADE;
DROP TABLE IF EXISTS DishVotes CASCADE;
DROP TABLE IF EXISTS DishHashtags CASCADE;
DROP TABLE IF EXISTS Submissions CASCADE;
DROP TABLE IF EXISTS Dishes CASCADE;
DROP TABLE IF EXISTS Restaurants CASCADE;
DROP TABLE IF EXISTS Neighborhoods CASCADE;
DROP TABLE IF EXISTS Cities CASCADE;
DROP TABLE IF EXISTS Hashtags CASCADE;
DROP TABLE IF EXISTS Lists CASCADE;
DROP TABLE IF EXISTS Refresh_Tokens CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (account_type IN ('user', 'contributor', 'superuser')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON Users(account_type);

-- Create Refresh_Tokens table
CREATE TABLE IF NOT EXISTS Refresh_Tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON Refresh_Tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON Refresh_Tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON Refresh_Tokens(expires_at);


-- Create Cities table
CREATE TABLE IF NOT EXISTS Cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_cities_name ON Cities(name);

-- Create Neighborhoods table
CREATE TABLE IF NOT EXISTS Neighborhoods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_neighborhood_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON Neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name ON Neighborhoods(name);

-- Create Hashtags table
CREATE TABLE IF NOT EXISTS Hashtags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON Hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_category ON Hashtags(category);
-- *** NEW: Index on category for admin filtering/sorting ***
CREATE INDEX IF NOT EXISTS idx_hashtags_category_filter ON Hashtags(category);


-- Create Restaurants table
CREATE TABLE IF NOT EXISTS Restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_restaurant_name_city UNIQUE (name, city_id),
  CONSTRAINT fk_restaurant_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE SET NULL,
  CONSTRAINT fk_restaurant_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES Neighborhoods(id) ON DELETE SET NULL
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON Restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_city_id_neighborhood_id ON Restaurants(city_id, neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_adds ON Restaurants(adds DESC);
-- *** NEW: Indexes for potential admin search/sort on denormalized names ***
CREATE INDEX IF NOT EXISTS idx_restaurants_city_name ON Restaurants(city_name);
CREATE INDEX IF NOT EXISTS idx_restaurants_neighborhood_name ON Restaurants(neighborhood_name);
-- *** NEW: Index for creation timestamp sorting ***
CREATE INDEX IF NOT EXISTS idx_restaurants_created_at ON Restaurants(created_at DESC);


-- Create RestaurantHashtags junction table
CREATE TABLE IF NOT EXISTS RestaurantHashtags (
  restaurant_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (restaurant_id, hashtag_id),
  CONSTRAINT fk_resthashtag_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE,
  CONSTRAINT fk_resthashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_resthashtags_restaurant_id ON RestaurantHashtags(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_resthashtags_hashtag_id ON RestaurantHashtags(hashtag_id);

-- Create Dishes table
CREATE TABLE IF NOT EXISTS Dishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  restaurant_id INTEGER NOT NULL,
  adds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dish_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE,
  UNIQUE (name, restaurant_id)
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON Dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON Dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_adds ON Dishes(adds DESC);
-- *** NEW: Index for creation timestamp sorting ***
CREATE INDEX IF NOT EXISTS idx_dishes_created_at ON Dishes(created_at DESC);


-- Create DishHashtags junction table
CREATE TABLE IF NOT EXISTS DishHashtags (
  dish_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (dish_id, hashtag_id),
  CONSTRAINT fk_dishhashtag_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE,
  CONSTRAINT fk_dishhashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_dishhashtags_dish_id ON DishHashtags(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_hashtag_id ON DishHashtags(hashtag_id);

-- Create Lists table
CREATE TABLE IF NOT EXISTS Lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  list_type VARCHAR(20) DEFAULT 'mixed' NOT NULL CHECK (list_type IN ('restaurant', 'dish', 'mixed')),
  saved_count INTEGER DEFAULT 0 NOT NULL,
  city_name VARCHAR(100),
  tags TEXT[],
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  creator_handle VARCHAR(100),
  user_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- NOTE: ON DELETE SET NULL means if a user is deleted, their lists remain but user_id becomes NULL.
  -- Consider ON DELETE CASCADE (delete lists) or ON DELETE RESTRICT (prevent user deletion) if needed.
  CONSTRAINT fk_list_creator FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON Lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_city_name ON Lists(city_name);
CREATE INDEX IF NOT EXISTS idx_lists_is_public_saved ON Lists(is_public, saved_count DESC);
CREATE INDEX IF NOT EXISTS idx_lists_tags ON Lists USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_lists_list_type ON Lists(list_type);
-- *** NEW: Index for creation timestamp sorting ***
CREATE INDEX IF NOT EXISTS idx_lists_created_at ON Lists(created_at DESC);
-- *** NEW: Index for name sorting ***
CREATE INDEX IF NOT EXISTS idx_lists_name ON Lists(name);


-- Create ListFollows table
CREATE TABLE IF NOT EXISTS ListFollows (
  list_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, user_id),
  CONSTRAINT fk_follow_list FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_follow_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_listfollows_list_id ON ListFollows(list_id);
CREATE INDEX IF NOT EXISTS idx_listfollows_user_id ON ListFollows(user_id);

-- Create ListItems junction table
CREATE TABLE IF NOT EXISTS ListItems (
  id SERIAL PRIMARY KEY,
  list_id INTEGER NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('restaurant', 'dish')),
  item_id INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_listitem_list FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE,
  UNIQUE (list_id, item_type, item_id)
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_listitems_list_id ON ListItems(list_id);
CREATE INDEX IF NOT EXISTS idx_listitems_item_type_item_id ON ListItems(item_type, item_id);

-- Create DishVotes table
CREATE TABLE IF NOT EXISTS DishVotes (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'neutral', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vote_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE,
  CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE (dish_id, user_id)
);
-- Existing Indexes
CREATE INDEX IF NOT EXISTS idx_dishvotes_dish_id ON DishVotes(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishvotes_user_id ON DishVotes(user_id);

-- Create Submissions table
CREATE TABLE IF NOT EXISTS Submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type VARCHAR(50) NOT NULL CHECK (type IN ('restaurant', 'dish')),
  name VARCHAR(255) NOT NULL,
  location TEXT,
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  tags TEXT[],
  place_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by INTEGER,
  -- NOTE: ON DELETE SET NULL for user_id means submission remains if user deleted.
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL,
  -- NOTE: ON DELETE SET NULL for reviewed_by means reviewer link is lost if reviewer deleted.
  CONSTRAINT fk_submission_reviewer FOREIGN KEY (reviewed_by) REFERENCES Users(id) ON DELETE SET NULL
);
-- Existing Indexes (idx_submissions_status_created covers default sort)
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON Submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON Submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_place_id ON Submissions(place_id);
-- *** NEW: Index for sorting/searching by name ***
CREATE INDEX IF NOT EXISTS idx_submissions_name ON Submissions(name);
-- *** NEW: Index for sorting/searching by type ***
CREATE INDEX IF NOT EXISTS idx_submissions_type ON Submissions(type);


-- Create Engagements table
CREATE TABLE IF NOT EXISTS Engagements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  item_id INTEGER NOT NULL,
  item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('restaurant', 'dish', 'list')),
  engagement_type VARCHAR(20) NOT NULL CHECK (engagement_type IN ('view', 'click', 'add_to_list', 'share')),
  engagement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- NOTE: ON DELETE SET NULL for user_id means engagement record remains if user deleted.
  CONSTRAINT fk_engagement_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
-- Existing Indexes (These seem sufficient for current trending queries)
CREATE INDEX IF NOT EXISTS idx_engagements_item ON Engagements(item_type, item_id, engagement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_engagements_user ON Engagements(user_id, engagement_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_engagements_type_time ON Engagements(engagement_type, engagement_timestamp DESC);


-- Function and Triggers for updated_at timestamp (Keep as is)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers before recreating
-- (Keep existing DROP/CREATE TRIGGER statements as they are)
DROP TRIGGER IF EXISTS set_timestamp_cities ON Cities;
-- ... other drops ...
DROP TRIGGER IF EXISTS set_timestamp_lists ON Lists;

-- Create triggers for relevant tables
CREATE TRIGGER set_timestamp_cities BEFORE UPDATE ON Cities FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
-- ... other creates ...
CREATE TRIGGER set_timestamp_lists BEFORE UPDATE ON Lists FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();