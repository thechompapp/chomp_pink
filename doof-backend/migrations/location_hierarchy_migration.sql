-- Location Hierarchy Migration
-- This migration creates a unified location hierarchy to handle complex address cases
-- like Brooklyn, NY and consolidates cities/neighborhoods management

BEGIN;

-- 1. Add state and country columns to cities for proper hierarchy
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS state_code VARCHAR(2),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(3) DEFAULT 'USA',
ADD COLUMN IF NOT EXISTS is_metro_area BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Enhance neighborhoods table for better hierarchy
ALTER TABLE neighborhoods
ADD COLUMN IF NOT EXISTS location_type VARCHAR(20) DEFAULT 'neighborhood',
ADD COLUMN IF NOT EXISTS is_borough BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS address_aliases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Add constraint to ensure location_type values
ALTER TABLE neighborhoods 
DROP CONSTRAINT IF EXISTS neighborhoods_location_type_check;

ALTER TABLE neighborhoods 
ADD CONSTRAINT neighborhoods_location_type_check 
CHECK (location_type IN ('borough', 'district', 'neighborhood', 'area', 'zone'));

-- 4. Update existing NYC data to handle Brooklyn case
UPDATE cities 
SET state_code = 'NY', is_metro_area = true 
WHERE name = 'New York' AND state_code IS NULL;

-- 5. Handle Brooklyn borough case - create Brooklyn as a borough under NYC
INSERT INTO neighborhoods (name, city_id, location_type, is_borough, location_level, address_aliases)
SELECT 'Brooklyn', c.id, 'borough', true, 1, ARRAY['Brooklyn, NY']
FROM cities c 
WHERE c.name = 'New York'
AND NOT EXISTS (
    SELECT 1 FROM neighborhoods n 
    WHERE n.name = 'Brooklyn' AND n.city_id = c.id AND n.is_borough = true
);

-- 6. Similarly for other NYC boroughs
INSERT INTO neighborhoods (name, city_id, location_type, is_borough, location_level, address_aliases)
SELECT borough_name, c.id, 'borough', true, 1, ARRAY[borough_name || ', NY']
FROM cities c, (VALUES 
    ('Manhattan'),
    ('Queens'), 
    ('Bronx'),
    ('Staten Island')
) AS boroughs(borough_name)
WHERE c.name = 'New York'
AND NOT EXISTS (
    SELECT 1 FROM neighborhoods n 
    WHERE n.name = boroughs.borough_name AND n.city_id = c.id AND n.is_borough = true
);

-- 7. Update existing Brooklyn neighborhoods to have Brooklyn borough as parent
UPDATE neighborhoods 
SET parent_id = (
    SELECT id FROM neighborhoods 
    WHERE name = 'Brooklyn' AND is_borough = true 
    AND city_id = (SELECT id FROM cities WHERE name = 'New York')
), 
location_level = 2,
location_type = 'neighborhood'
WHERE borough = 'Brooklyn' 
AND parent_id IS NULL;

-- 8. Update other NYC borough neighborhoods
UPDATE neighborhoods n
SET parent_id = (
    SELECT id FROM neighborhoods borough_n 
    WHERE borough_n.name = n.borough 
    AND borough_n.is_borough = true 
    AND borough_n.city_id = n.city_id
),
location_level = 2,
location_type = 'neighborhood'
WHERE n.borough IS NOT NULL 
AND n.city_id = (SELECT id FROM cities WHERE name = 'New York')
AND n.parent_id IS NULL
AND n.is_borough = false;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_neighborhoods_location_type ON neighborhoods(location_type);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_is_borough ON neighborhoods(is_borough);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_address_aliases ON neighborhoods USING GIN(address_aliases);
CREATE INDEX IF NOT EXISTS idx_cities_state_code ON cities(state_code);
CREATE INDEX IF NOT EXISTS idx_cities_is_metro_area ON cities(is_metro_area);

-- 10. Create address resolution function
CREATE OR REPLACE FUNCTION resolve_address_location(
    address_city TEXT,
    address_state TEXT DEFAULT 'NY'
) RETURNS TABLE (
    resolved_city_id INTEGER,
    resolved_city_name TEXT,
    resolved_neighborhood_id INTEGER,
    resolved_neighborhood_name TEXT,
    resolution_type TEXT
) AS $$
BEGIN
    -- Case 1: Direct city match
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        NULL::INTEGER,
        NULL::TEXT,
        'direct_city'::TEXT
    FROM cities c
    WHERE LOWER(c.name) = LOWER(address_city)
    AND (address_state IS NULL OR c.state_code = UPPER(address_state))
    LIMIT 1;
    
    -- If found, return
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Case 2: Borough resolution (Brooklyn, NY -> NYC)
    RETURN QUERY
    SELECT 
        n.city_id,
        c.name,
        n.id,
        n.name,
        'borough_to_city'::TEXT
    FROM neighborhoods n
    JOIN cities c ON n.city_id = c.id
    WHERE LOWER(n.name) = LOWER(address_city)
    AND n.is_borough = true
    AND (address_state IS NULL OR c.state_code = UPPER(address_state))
    LIMIT 1;
    
    -- If found, return
    IF FOUND THEN
        RETURN;
    END IF;
    
    -- Case 3: Check address aliases
    RETURN QUERY
    SELECT 
        n.city_id,
        c.name,
        n.id,
        n.name,
        'alias_match'::TEXT
    FROM neighborhoods n
    JOIN cities c ON n.city_id = c.id
    WHERE LOWER(address_city) = ANY(
        SELECT LOWER(unnest(n.address_aliases))
    )
    AND (address_state IS NULL OR c.state_code = UPPER(address_state))
    LIMIT 1;
    
    -- If still nothing found, return null
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cities_updated_at ON cities;
CREATE TRIGGER trigger_cities_updated_at
    BEFORE UPDATE ON cities
    FOR EACH ROW
    EXECUTE FUNCTION update_location_timestamp();

DROP TRIGGER IF EXISTS trigger_neighborhoods_updated_at ON neighborhoods;
CREATE TRIGGER trigger_neighborhoods_updated_at
    BEFORE UPDATE ON neighborhoods
    FOR EACH ROW
    EXECUTE FUNCTION update_location_timestamp();

COMMIT; 