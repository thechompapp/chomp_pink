-- 
-- CHOMP/DOOF Application
-- Definitive Database Schema Definition
-- Last updated: May 10, 2025
--
-- Based on schema_dump.sql with fixes for inconsistencies identified in the handover document
--

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Timestamp function for automatic updating of updated_at columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Cities Table
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'USA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_cities
BEFORE UPDATE ON cities
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Neighborhoods Table
CREATE TABLE neighborhoods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    borough VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, city_id)
);

CREATE TRIGGER set_timestamp_neighborhoods
BEFORE UPDATE ON neighborhoods
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Hashtags Table
CREATE TABLE hashtags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_hashtags
BEFORE UPDATE ON hashtags
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Restaurants Table
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    neighborhood_id INTEGER REFERENCES neighborhoods(id),
    city_id INTEGER REFERENCES cities(id),
    phone VARCHAR(20),
    website VARCHAR(255),
    price_range SMALLINT,
    lat NUMERIC(10,6),
    lng NUMERIC(10,6),
    city_name VARCHAR(100),
    neighborhood_name VARCHAR(100),
    borough VARCHAR(100),
    description TEXT,
    admin_approved BOOLEAN DEFAULT FALSE,
    submitted_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_restaurants
BEFORE UPDATE ON restaurants
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Restaurant Hashtags Join Table
CREATE TABLE restauranthashtags (
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (restaurant_id, hashtag_id)
);

-- Dishes Table
CREATE TABLE dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    admin_approved BOOLEAN DEFAULT FALSE,
    submitted_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_dishes
BEFORE UPDATE ON dishes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Dish Hashtags Join Table
CREATE TABLE dishhashtags (
    dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
    hashtag_id INTEGER REFERENCES hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (dish_id, hashtag_id)
);

-- Dish Votes Table
CREATE TABLE dishvotes (
    id SERIAL PRIMARY KEY,
    dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dish_id, user_id)
);

-- Lists Table
CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    saved_count INTEGER DEFAULT 0 NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    list_type VARCHAR(20) DEFAULT 'restaurant' CHECK (list_type IN ('restaurant', 'dish', 'mixed')),
    city_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_lists
BEFORE UPDATE ON lists
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- List Items Table
CREATE TABLE listitems (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('restaurant', 'dish')),
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_item_id CHECK (
        (item_type = 'restaurant' AND EXISTS (SELECT 1 FROM restaurants WHERE id = item_id)) OR
        (item_type = 'dish' AND EXISTS (SELECT 1 FROM dishes WHERE id = item_id))
    )
);

CREATE TRIGGER set_timestamp_listitems
BEFORE UPDATE ON listitems
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- List Follows Table
CREATE TABLE list_follows (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, list_id)
);

-- Submissions Table
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('restaurant', 'dish', 'correction')),
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
    dish_id INTEGER REFERENCES dishes(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    data JSONB NOT NULL,
    reviewed_by INTEGER REFERENCES users(id),
    review_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_submissions
BEFORE UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Engagements Table for Analytics
CREATE TABLE engagements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    engagement_type VARCHAR(30) NOT NULL,
    item_id INTEGER,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('restaurant', 'dish', 'list', 'user')),
    engagement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create index for engagement analysis
CREATE INDEX idx_engagements_type_time ON engagements (engagement_type, engagement_timestamp DESC);
CREATE INDEX idx_engagements_user_id ON engagements (user_id);
CREATE INDEX idx_engagements_item ON engagements (item_type, item_id);

-- Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Indexes for performance
CREATE INDEX idx_dishes_restaurant_id ON dishes (restaurant_id);
CREATE INDEX idx_listitems_list_id ON listitems (list_id);
CREATE INDEX idx_listitems_item ON listitems (item_type, item_id);
CREATE INDEX idx_restaurants_city_id ON restaurants (city_id);
CREATE INDEX idx_restaurants_neighborhood_id ON restaurants (neighborhood_id);
CREATE INDEX idx_restaurants_name_trgm ON restaurants USING gin (name gin_trgm_ops);
CREATE INDEX idx_restaurants_city_name ON restaurants USING btree (city_name);
CREATE INDEX idx_dishes_name_trgm ON dishes USING gin (name gin_trgm_ops);
CREATE INDEX idx_lists_user_id ON lists (user_id);
CREATE INDEX idx_lists_city_name ON lists (city_name);
