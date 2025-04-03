-- src/doof-backend/setup.sql (Complete and Corrected)

-- Drop existing tables in reverse order of dependency
-- Make sure ListFollows is dropped before Lists
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
DROP TABLE IF EXISTS Lists CASCADE; -- Drop Lists last among these main tables


-- Placeholder for Users table (Define if/when needed)
-- CREATE TABLE IF NOT EXISTS Users (
--   id SERIAL PRIMARY KEY,
--   username VARCHAR(100) UNIQUE NOT NULL,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   password_hash VARCHAR(255) NOT NULL, -- Store hashed passwords only
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );
-- CREATE INDEX IF NOT EXISTS idx_users_username ON Users(username);

-- Create Cities, Neighborhoods, Hashtags tables
CREATE TABLE IF NOT EXISTS Cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_cities_name ON Cities(name);

CREATE TABLE IF NOT EXISTS Neighborhoods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL,
    borough VARCHAR(100),
    CONSTRAINT fk_neighborhood_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE,
    UNIQUE(name, city_id)
);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city_id ON Neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_name ON Neighborhoods(name);

CREATE TABLE IF NOT EXISTS Hashtags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) -- e.g., 'Cuisine', 'Attribute', 'Dietary', 'Location', 'Meal'
);
CREATE INDEX IF NOT EXISTS idx_hashtags_name ON Hashtags(name);
CREATE INDEX IF NOT EXISTS idx_hashtags_category ON Hashtags(category);

-- Create Restaurants table
CREATE TABLE IF NOT EXISTS Restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    neighborhood_id INTEGER,
    city_id INTEGER NOT NULL,
    neighborhood_name VARCHAR(100), -- Denormalized for easier lookup/filtering
    city_name VARCHAR(100),         -- Denormalized for easier lookup/filtering
    zip_code VARCHAR(10),
    borough VARCHAR(100),
    phone VARCHAR(20),
    website VARCHAR(255),
    google_place_id VARCHAR(255) UNIQUE, -- For linking with Google Places
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    adds INTEGER DEFAULT 0 NOT NULL, -- Counter for how many times added to lists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_restaurant_city FOREIGN KEY (city_id) REFERENCES Cities(id) ON DELETE CASCADE,
    CONSTRAINT fk_restaurant_neighborhood FOREIGN KEY (neighborhood_id) REFERENCES Neighborhoods(id) ON DELETE SET NULL -- Allow neighborhood deletion without deleting restaurant
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
    CONSTRAINT fk_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_resthashtags_restaurant_id ON RestaurantHashtags(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_resthashtags_hashtag_id ON RestaurantHashtags(hashtag_id);

-- Create Dishes table
CREATE TABLE IF NOT EXISTS Dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    restaurant_id INTEGER NOT NULL,
    price VARCHAR(50), -- Using VARCHAR for flexibility (e.g., "$10-15", "MP")
    adds INTEGER DEFAULT 0 NOT NULL, -- Counter for how many times added to lists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_common BOOLEAN DEFAULT FALSE, -- Flag for very common dishes if needed later
    CONSTRAINT fk_dishes_restaurant FOREIGN KEY (restaurant_id) REFERENCES Restaurants(id) ON DELETE CASCADE,
    UNIQUE(name, restaurant_id) -- A dish name should be unique within a specific restaurant
);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON Dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON Dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_adds ON Dishes(adds DESC);

-- Create DishHashtags junction table
CREATE TABLE IF NOT EXISTS DishHashtags (
    dish_id INTEGER NOT NULL,
    hashtag_id INTEGER NOT NULL,
    PRIMARY KEY (dish_id, hashtag_id),
    CONSTRAINT fk_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE,
    CONSTRAINT fk_dish_hashtag FOREIGN KEY (hashtag_id) REFERENCES Hashtags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_dish_id ON DishHashtags(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishhashtags_hashtag_id ON DishHashtags(hashtag_id);

-- Create Lists table (Removed user_id column for now, uses created_by_user flag)
CREATE TABLE IF NOT EXISTS Lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  saved_count INTEGER DEFAULT 0 NOT NULL, -- Counter for follows/saves
  city_name VARCHAR(100), -- Denormalized city for filtering popular lists
  tags TEXT[], -- Array of text tags associated with the list
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  created_by_user BOOLEAN DEFAULT FALSE NOT NULL, -- Flag if created by a logged-in user vs. seeded/admin
  creator_handle VARCHAR(100), -- Display handle (optional)
  -- user_id INTEGER, -- Optional: Foreign key to Users table if implementing full auth
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  -- Add user foreign key constraint when Users table exists and user_id column is added:
  -- , CONSTRAINT fk_list_creator FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL -- Or CASCADE?
);
-- Add a unique constraint on name if list names should be unique globally or per-user
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_name_unique ON Lists(name); -- Example global unique constraint
CREATE INDEX IF NOT EXISTS idx_lists_city_name ON Lists(city_name);
CREATE INDEX IF NOT EXISTS idx_lists_is_public_saved ON Lists(is_public, saved_count DESC);
CREATE INDEX IF NOT EXISTS idx_lists_tags ON Lists USING GIN (tags); -- GIN index for array searching

-- *** ADDED: ListFollows table ***
CREATE TABLE IF NOT EXISTS ListFollows (
    list_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL, -- Placeholder for user ID, replace with FK when Users table exists
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id, user_id), -- Ensures a user follows a list only once
    CONSTRAINT fk_follow_list FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE
    -- Add user foreign key constraint when Users table exists:
    -- , CONSTRAINT fk_follow_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_listfollows_list_id ON ListFollows(list_id);
CREATE INDEX IF NOT EXISTS idx_listfollows_user_id ON ListFollows(user_id);

-- Create ListItems junction table (Links Lists to Dishes/Restaurants)
CREATE TABLE IF NOT EXISTS ListItems (
  id SERIAL PRIMARY KEY, -- Unique ID for each list item entry itself
  list_id INTEGER NOT NULL,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('dish', 'restaurant')),
  item_id INTEGER NOT NULL, -- References either Dishes(id) or Restaurants(id) based on item_type
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Optional: Add a position column for ordering within the list if needed
  -- position INTEGER,
  CONSTRAINT fk_listitems_list FOREIGN KEY (list_id) REFERENCES Lists(id) ON DELETE CASCADE, -- Delete items if list is deleted
  UNIQUE (list_id, item_type, item_id) -- Prevent adding the exact same item to the same list twice
);
CREATE INDEX IF NOT EXISTS idx_listitems_list_id ON ListItems(list_id);
CREATE INDEX IF NOT EXISTS idx_listitems_item_type_item_id ON ListItems(item_type, item_id); -- To find which lists contain an item

-- Create DishVotes table
CREATE TABLE IF NOT EXISTS DishVotes (
    id SERIAL PRIMARY KEY,
    dish_id INTEGER NOT NULL,
    user_id INTEGER, -- Nullable for now, or require Users table FK
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'neutral', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vote_dish FOREIGN KEY (dish_id) REFERENCES Dishes(id) ON DELETE CASCADE
    -- UNIQUE (dish_id, user_id) -- Ensure user votes only once per dish
    -- Add user foreign key constraint when Users table exists:
    -- , CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dishvotes_dish_id ON DishVotes(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishvotes_user_id ON DishVotes(user_id);

-- Create Submissions table
CREATE TABLE IF NOT EXISTS Submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER, -- Nullable for now, or require Users table FK
    type VARCHAR(50) NOT NULL CHECK (type IN ('restaurant', 'dish')),
    name VARCHAR(255) NOT NULL,
    location TEXT, -- Can store restaurant name for a dish submission, or address for restaurant
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    tags TEXT[],
    place_id VARCHAR(255), -- Google Place ID if submitted
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by INTEGER -- Optional FK to an AdminUsers table
    -- Add user foreign key constraint when Users table exists:
    -- , CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON Submissions(status, created_at);


-- Function and Triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers before creating new ones (handles rerunning the script)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_restaurants') THEN DROP TRIGGER set_timestamp_restaurants ON restaurants; END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_dishes') THEN DROP TRIGGER set_timestamp_dishes ON dishes; END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_lists') THEN DROP TRIGGER set_timestamp_lists ON lists; END IF;
END $$;

-- Create triggers only if the tables exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurants') THEN
        CREATE TRIGGER set_timestamp_restaurants
        BEFORE UPDATE ON restaurants
        FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dishes') THEN
        CREATE TRIGGER set_timestamp_dishes
        BEFORE UPDATE ON dishes
        FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lists') THEN
        CREATE TRIGGER set_timestamp_lists
        BEFORE UPDATE ON lists
        FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
END $$;