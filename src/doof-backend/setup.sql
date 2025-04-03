-- Drop existing tables in reverse order of dependency
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
DROP TABLE IF EXISTS Users CASCADE;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);

-- Create Cities table
CREATE TABLE IF NOT EXISTS Cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
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
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON Hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_category ON Hashtags(category);

-- Create Restaurants table
CREATE TABLE IF NOT EXISTS Restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city_id INTEGER NOT NULL,
  city_name VARCHAR(100),
  neighborhood_id INTEGER,
  neighborhood_name VARCHAR(100),
  adds INTEGER DEFAULT 0,
  google_place_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_restaurant_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE SET NULL,
  CONSTRAINT fk_restaurant_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES Neighborhoods(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_restaurants_name ON Restaurants(name);
CREATE INDEX IF NOT EXISTS idx_restaurants_city_id_neighborhood_id ON Restaurants(city_id, neighborhood_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_adds ON Restaurants(adds DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id ON Restaurants(google_place_id);

-- Create RestaurantHashtags junction table
CREATE TABLE IF NOT EXISTS RestaurantHashtags (
  restaurant_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (restaurant_id, hashtag_id),
  CONSTRAINT fk_resthashtag_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE,
  CONSTRAINT fk_resthashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);
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
  CONSTRAINT fk_dish_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON Dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON Dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_adds ON Dishes(adds DESC);

-- Create DishHashtags junction table
CREATE TABLE IF NOT EXISTS DishHashtags (
  dish_id INTEGER NOT NULL,
  hashtag_id INTEGER NOT NULL,
  PRIMARY KEY (dish_id, hashtag_id),
  CONSTRAINT fk_dishhashtag_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE,
  CONSTRAINT fk_dishhashtag_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE,
  UNIQUE (dish_id, hashtag_id) -- Added to support ON CONFLICT
);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_dish_id ON DishHashtags(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_hashtag_id ON DishHashtags(hashtag_id);

-- Create Lists table
CREATE TABLE IF NOT EXISTS Lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  saved_count INTEGER DEFAULT 0 NOT NULL,
  city_name VARCHAR(100),
  tags TEXT[],
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  creator_handle VARCHAR(100),
  user_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_list_creator FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON Lists(user_id);
CREATE INDEX IF NOT EXISTS idx_lists_city_name ON Lists(city_name);
CREATE INDEX IF NOT EXISTS idx_lists_is_public_saved ON Lists(is_public, saved_count DESC);
CREATE INDEX IF NOT EXISTS idx_lists_tags ON Lists USING GIN (tags);

-- Create ListFollows table
CREATE TABLE IF NOT EXISTS ListFollows (
  list_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, user_id),
  CONSTRAINT fk_follow_list FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE,
  CONSTRAINT fk_follow_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
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
  UNIQUE (list_id, item_type, item_id) -- Added to support ON CONFLICT
);
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
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON Submissions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON Submissions(user_id);

-- Function and Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_restaurants') THEN
    DROP TRIGGER set_timestamp_restaurants ON Restaurants;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_dishes') THEN
    DROP TRIGGER set_timestamp_dishes ON Dishes;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_lists') THEN
    DROP TRIGGER set_timestamp_lists ON Lists;
  END IF;
END $$;

-- Create triggers
DO $$ BEGIN
  CREATE TRIGGER set_timestamp_restaurants
    BEFORE UPDATE ON Restaurants
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

  CREATE TRIGGER set_timestamp_dishes
    BEFORE UPDATE ON Dishes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

  CREATE TRIGGER set_timestamp_lists
    BEFORE UPDATE ON Lists
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
END $$;