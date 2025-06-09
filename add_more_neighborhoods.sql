-- =============================================
-- Add and Update NYC Neighborhoods and Boroughs
-- =============================================
-- This script is idempotent and can be run multiple times.

-- Set the City ID for New York City
-- This is assumed to be 10 based on previous analysis.
-- All neighborhoods will be associated with this city.
WITH city_ref AS (
  SELECT 10 AS id
),

-- Define NYC Boroughs
-- location_level 0 = Borough
boroughs AS (
  INSERT INTO neighborhoods (name, city_id, is_borough, location_level) VALUES
  ('Manhattan', (SELECT id FROM city_ref), TRUE, 0),
  ('Bronx', (SELECT id FROM city_ref), TRUE, 0),
  ('Brooklyn', (SELECT id FROM city_ref), TRUE, 0),
  ('Queens', (SELECT id FROM city_ref), TRUE, 0),
  ('Staten Island', (SELECT id FROM city_ref), TRUE, 0)
  ON CONFLICT (name, city_id) DO UPDATE SET is_borough = TRUE, location_level = 0
  RETURNING id, name
),

-- Define Parent Neighborhoods
-- location_level 1 = Parent Neighborhood
parent_neighborhoods AS (
  INSERT INTO neighborhoods (name, city_id, parent_id, location_level, zipcode_ranges) VALUES
  -- Manhattan
  ('Upper East Side', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Manhattan'), 1, '{10021,10065,10075,10028,10128}'),
  ('Upper West Side', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Manhattan'), 1, '{10023,10024,10025,10069}'),
  ('Midtown', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Manhattan'), 1, '{10017,10022,10019}'),
  ('Greenwich Village', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Manhattan'), 1, '{10011,10014,10012,10013}'),
  ('Lower East Side & East Village', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Manhattan'), 1, '{10002,10003}'),
  ('Chelsea & Midtown South', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Manhattan'), 1, '{10010,10016}'),
  ('Harlem & Washington Heights', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Manhattan'), 1, '{10026,10027,10029,10035,10031,10032,10033,10034,10040}'),
  -- Bronx
  ('South Bronx', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Bronx'), 1, '{10451,10452,10453,10454,10455,10456}'),
  -- Brooklyn
  ('Williamsburg', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 1, '{11211,11206,11249}'),
  -- Queens
  ('Long Island City', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Queens'), 1, '{11101,11109}')

  ON CONFLICT (name, city_id) DO UPDATE SET
    parent_id = EXCLUDED.parent_id,
    location_level = 1,
    zipcode_ranges = EXCLUDED.zipcode_ranges
  RETURNING id, name, parent_id
)

-- Define Sub-Neighborhoods (leaves of the hierarchy)
-- location_level 2 = Sub-Neighborhood
INSERT INTO neighborhoods (name, city_id, parent_id, location_level, zipcode_ranges) VALUES
-- Manhattan -> Upper East Side
('Lenox Hill', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Upper East Side'), 2, '{10021,10065,10075}'),
('Yorkville', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Upper East Side'), 2, '{10028,10128}'),
-- Manhattan -> Upper West Side
('UWS South', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Upper West Side'), 2, '{10023,10069}'),
('UWS Central', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Upper West Side'), 2, '{10024}'),
('UWS North', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Upper West Side'), 2, '{10025}'),
-- Manhattan -> Midtown
('Midtown East', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Midtown'), 2, '{10017}'),
('Turtle Bay', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Midtown'), 2, '{10022}'),
('Midtown West', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Midtown'), 2, '{10019}'),
-- Manhattan -> Greenwich Village
('Greenwich Village North', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Greenwich Village'), 2, '{10011}'),
('West Village', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Greenwich Village'), 2, '{10014}'),
('SoHo', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Greenwich Village'), 2, '{10012}'),
('NoLita', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Greenwich Village'), 2, '{10012}'),
('Tribeca', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Greenwich Village'), 2, '{10013}'),
-- Manhattan -> Lower East Side & East Village
('Lower East Side', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Lower East Side & East Village'), 2, '{10002}'),
('East Village', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Lower East Side & East Village'), 2, '{10003}'),
-- Manhattan -> Chelsea & Midtown South
('Madison Square', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Chelsea & Midtown South'), 2, '{10010}'),
('Gramercy', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Chelsea & Midtown South'), 2, '{10010}'),
('Murray Hill', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Chelsea & Midtown South'), 2, '{10016}'),
('Kips Bay', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Chelsea & Midtown South'), 2, '{10016}'),
-- Manhattan -> Harlem & Washington Heights
('Central Harlem', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Harlem & Washington Heights'), 2, '{10026,10027}'),
('East Harlem', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Harlem & Washington Heights'), 2, '{10029,10035}'),
('Hamilton Heights', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Harlem & Washington Heights'), 2, '{10031}'),
('Morningside Heights', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Harlem & Washington Heights'), 2, '{10032}'),
('Washington Heights', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Harlem & Washington Heights'), 2, '{10033,10034,10040}'),
('Inwood', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Harlem & Washington Heights'), 2, '{10034}'),
-- Bronx
('Mott Haven', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'South Bronx'), 2, '{10451,10454,10455}'),
('Melrose', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'South Bronx'), 2, '{10451,10456}'),
('Highbridge', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'South Bronx'), 2, '{10452}'),
('Concourse', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'South Bronx'), 2, '{10452}'),
('Fordham', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Bronx'), 2, '{10453,10458}'),
('Belmont', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Bronx'), 2, '{10457,10458}'),
('Kingsbridge', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Bronx'), 2, '{10463,10468}'),
('Parkchester', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Bronx'), 2, '{10472,10473}'),
-- Brooklyn
('Bedford-Stuyvesant', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11205,11206,11216,11221,11233,11238}'),
('Bushwick', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11206,11207,11221,11237}'),
('East New York', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11207,11208,11239}'),
('Sunset Park', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11220,11232}'),
('Coney Island', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11224,11235}'),
('Flatbush', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11226}'),
('Brownsville', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11212,11233}'),
('East Flatbush', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11203,11226}'),
('Flatlands', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11236}'),
('Canarsie', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Brooklyn'), 2, '{11236}'),
-- Queens
('Astoria', (SELECT id FROM city_ref), (SELECT id FROM parent_neighborhoods WHERE name = 'Long Island City'), 2, '{11101}'),
('Jackson Heights', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Queens'), 2, '{11368,11369}'),
('Elmhurst', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Queens'), 2, '{11368}'),
('Corona', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Queens'), 2, '{11368}'),
('Flushing', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Queens'), 2, '{11435}'),
('Jamaica', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Queens'), 2, '{11412,11423,11432,11433,11434,11435,11436}'),
('Rockaway', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Queens'), 2, '{11691,11692,11693,11694}'),
-- Staten Island
('St. George', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Staten Island'), 2, '{10301,10304,10305}'),
('Port Richmond', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Staten Island'), 2, '{10302,10303,10310}'),
('South Beach', (SELECT id FROM city_ref), (SELECT id FROM boroughs WHERE name = 'Staten Island'), 2, '{10306,10307,10308,10309,10312}')

ON CONFLICT (name, city_id) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  location_level = 2,
  zipcode_ranges = EXCLUDED.zipcode_ranges;

-- Note: Some neighborhoods from the user's list may not have a clear parent and are assigned directly to the borough.
-- This structure provides a solid foundation for hierarchical location-based features. 