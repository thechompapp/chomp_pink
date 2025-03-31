-- Create Submissions table
CREATE TABLE IF NOT EXISTS Submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  type VARCHAR(50),
  name VARCHAR(255),
  location TEXT,
  tags TEXT[],
  place_id VARCHAR(255),
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending'
);

-- Create Neighborhoods table
CREATE TABLE IF NOT EXISTS Neighborhoods (
  id SERIAL PRIMARY KEY,
  zip_code VARCHAR(10) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  borough VARCHAR(100),
  UNIQUE(zip_code, city)
);

-- Create Filters table
CREATE TABLE IF NOT EXISTS Filters (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  UNIQUE(category, name)
);

-- Create Restaurants table
CREATE TABLE IF NOT EXISTS Restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  neighborhood VARCHAR(100),
  city VARCHAR(100),
  tags TEXT[],
  adds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Dishes table
CREATE TABLE IF NOT EXISTS Dishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  restaurant_id INTEGER,
  tags TEXT[],
  adds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

-- Create CommonDishes table
CREATE TABLE IF NOT EXISTS CommonDishes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  UNIQUE(name)
);

-- Create Lists table with creator_handle
CREATE TABLE IF NOT EXISTS Lists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  items JSONB DEFAULT '[]',
  item_count INTEGER DEFAULT 0,
  saved_count INTEGER DEFAULT 0,
  city VARCHAR(100),
  tags TEXT[],
  is_public BOOLEAN DEFAULT TRUE,
  created_by_user BOOLEAN DEFAULT FALSE,
  creator_handle VARCHAR(100),
  is_following BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE Restaurants TO doof_user;
GRANT ALL PRIVILEGES ON TABLE Dishes TO doof_user;
GRANT ALL PRIVILEGES ON TABLE Lists TO doof_user;
GRANT ALL PRIVILEGES ON TABLE Submissions TO doof_user;
GRANT ALL PRIVILEGES ON TABLE Users TO doof_user;
GRANT ALL PRIVILEGES ON TABLE Neighborhoods TO doof_user;
GRANT ALL PRIVILEGES ON TABLE Filters TO doof_user;
GRANT ALL PRIVILEGES ON TABLE CommonDishes TO doof_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO doof_user;