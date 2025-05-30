-- Populate cities and neighborhoods for autosuggest functionality

-- Get city IDs for reference
DO $$
DECLARE
    nyc_id INTEGER;
    la_id INTEGER;
    chicago_id INTEGER;
    houston_id INTEGER;
    phoenix_id INTEGER;
    philly_id INTEGER;
    san_antonio_id INTEGER;
    san_diego_id INTEGER;
    dallas_id INTEGER;
    san_jose_id INTEGER;
BEGIN
    -- Get city IDs
    SELECT id INTO nyc_id FROM cities WHERE name = 'New York';
    SELECT id INTO la_id FROM cities WHERE name = 'Los Angeles';
    SELECT id INTO chicago_id FROM cities WHERE name = 'Chicago';
    SELECT id INTO houston_id FROM cities WHERE name = 'Houston';
    SELECT id INTO phoenix_id FROM cities WHERE name = 'Phoenix';
    SELECT id INTO philly_id FROM cities WHERE name = 'Philadelphia';
    SELECT id INTO san_antonio_id FROM cities WHERE name = 'San Antonio';
    SELECT id INTO san_diego_id FROM cities WHERE name = 'San Diego';
    SELECT id INTO dallas_id FROM cities WHERE name = 'Dallas';
    SELECT id INTO san_jose_id FROM cities WHERE name = 'San Jose';

    -- New York neighborhoods (25 popular ones)
    INSERT INTO neighborhoods (name, city_id, borough) VALUES 
    ('Upper East Side', nyc_id, 'Manhattan'),
    ('Upper West Side', nyc_id, 'Manhattan'),
    ('Greenwich Village', nyc_id, 'Manhattan'),
    ('SoHo', nyc_id, 'Manhattan'),
    ('Tribeca', nyc_id, 'Manhattan'),
    ('East Village', nyc_id, 'Manhattan'),
    ('Chelsea', nyc_id, 'Manhattan'),
    ('Midtown', nyc_id, 'Manhattan'),
    ('Lower East Side', nyc_id, 'Manhattan'),
    ('Williamsburg', nyc_id, 'Brooklyn'),
    ('DUMBO', nyc_id, 'Brooklyn'),
    ('Park Slope', nyc_id, 'Brooklyn'),
    ('Brooklyn Heights', nyc_id, 'Brooklyn'),
    ('Red Hook', nyc_id, 'Brooklyn'),
    ('Astoria', nyc_id, 'Queens'),
    ('Long Island City', nyc_id, 'Queens'),
    ('Flushing', nyc_id, 'Queens'),
    ('Forest Hills', nyc_id, 'Queens'),
    ('Bronx', nyc_id, 'Bronx'),
    ('Mott Haven', nyc_id, 'Bronx'),
    ('Staten Island', nyc_id, 'Staten Island'),
    ('St. George', nyc_id, 'Staten Island'),
    ('Financial District', nyc_id, 'Manhattan'),
    ('Nolita', nyc_id, 'Manhattan'),
    ('NoMad', nyc_id, 'Manhattan')
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Los Angeles neighborhoods (25 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Hollywood', la_id),
    ('West Hollywood', la_id),
    ('Beverly Hills', la_id),
    ('Santa Monica', la_id),
    ('Venice', la_id),
    ('Manhattan Beach', la_id),
    ('Redondo Beach', la_id),
    ('Culver City', la_id),
    ('Marina del Rey', la_id),
    ('Brentwood', la_id),
    ('Westwood', la_id),
    ('Century City', la_id),
    ('Downtown LA', la_id),
    ('Los Feliz', la_id),
    ('Silver Lake', la_id),
    ('Echo Park', la_id),
    ('Koreatown', la_id),
    ('Mid-Wilshire', la_id),
    ('Melrose', la_id),
    ('West Side', la_id),
    ('Pasadena', la_id),
    ('Burbank', la_id),
    ('Glendale', la_id),
    ('Hermosa Beach', la_id),
    ('El Segundo', la_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Chicago neighborhoods (25 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Downtown', chicago_id),
    ('The Loop', chicago_id),
    ('River North', chicago_id),
    ('Gold Coast', chicago_id),
    ('Lincoln Park', chicago_id),
    ('Lakeview', chicago_id),
    ('Wicker Park', chicago_id),
    ('Bucktown', chicago_id),
    ('Logan Square', chicago_id),
    ('Old Town', chicago_id),
    ('Streeterville', chicago_id),
    ('West Loop', chicago_id),
    ('South Loop', chicago_id),
    ('Near North Side', chicago_id),
    ('Lincoln Square', chicago_id),
    ('Andersonville', chicago_id),
    ('Ukrainian Village', chicago_id),
    ('West Town', chicago_id),
    ('Fulton Market', chicago_id),
    ('Chinatown', chicago_id),
    ('Little Italy', chicago_id),
    ('Pilsen', chicago_id),
    ('Bridgeport', chicago_id),
    ('Hyde Park', chicago_id),
    ('Woodlawn', chicago_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Houston neighborhoods (20 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Downtown', houston_id),
    ('Midtown', houston_id),
    ('River Oaks', houston_id),
    ('The Heights', houston_id),
    ('Montrose', houston_id),
    ('Memorial', houston_id),
    ('Galleria', houston_id),
    ('Medical Center', houston_id),
    ('Museum District', houston_id),
    ('Rice Village', houston_id),
    ('Westchase', houston_id),
    ('Energy Corridor', houston_id),
    ('Katy', houston_id),
    ('Sugar Land', houston_id),
    ('The Woodlands', houston_id),
    ('Pearland', houston_id),
    ('Clear Lake', houston_id),
    ('Bellaire', houston_id),
    ('West University', houston_id),
    ('Kingwood', houston_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Phoenix neighborhoods (15 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Downtown', phoenix_id),
    ('Scottsdale', phoenix_id),
    ('Tempe', phoenix_id),
    ('Mesa', phoenix_id),
    ('Chandler', phoenix_id),
    ('Glendale', phoenix_id),
    ('Peoria', phoenix_id),
    ('Surprise', phoenix_id),
    ('Goodyear', phoenix_id),
    ('Avondale', phoenix_id),
    ('Central Phoenix', phoenix_id),
    ('North Phoenix', phoenix_id),
    ('South Phoenix', phoenix_id),
    ('West Phoenix', phoenix_id),
    ('East Phoenix', phoenix_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Philadelphia neighborhoods (20 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Center City', philly_id),
    ('Old City', philly_id),
    ('Society Hill', philly_id),
    ('Rittenhouse Square', philly_id),
    ('Fishtown', philly_id),
    ('Northern Liberties', philly_id),
    ('South Street', philly_id),
    ('University City', philly_id),
    ('Manayunk', philly_id),
    ('Chestnut Hill', philly_id),
    ('Germantown', philly_id),
    ('Queen Village', philly_id),
    ('Bella Vista', philly_id),
    ('Washington Square', philly_id),
    ('Fairmount', philly_id),
    ('Brewerytown', philly_id),
    ('Point Breeze', philly_id),
    ('Graduate Hospital', philly_id),
    ('Passyunk Square', philly_id),
    ('East Passyunk', philly_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- San Antonio neighborhoods (15 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Downtown', san_antonio_id),
    ('Southtown', san_antonio_id),
    ('Pearl District', san_antonio_id),
    ('King William', san_antonio_id),
    ('Alamo Heights', san_antonio_id),
    ('Stone Oak', san_antonio_id),
    ('The Dominion', san_antonio_id),
    ('Westover Hills', san_antonio_id),
    ('Terrell Hills', san_antonio_id),
    ('Monte Vista', san_antonio_id),
    ('Mahncke Park', san_antonio_id),
    ('River Walk', san_antonio_id),
    ('Medical Center', san_antonio_id),
    ('Leon Valley', san_antonio_id),
    ('Brackenridge Park', san_antonio_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- San Diego neighborhoods (20 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Downtown', san_diego_id),
    ('Gaslamp Quarter', san_diego_id),
    ('Little Italy', san_diego_id),
    ('Balboa Park', san_diego_id),
    ('La Jolla', san_diego_id),
    ('Pacific Beach', san_diego_id),
    ('Mission Beach', san_diego_id),
    ('Ocean Beach', san_diego_id),
    ('Mission Valley', san_diego_id),
    ('Hillcrest', san_diego_id),
    ('North Park', san_diego_id),
    ('South Park', san_diego_id),
    ('Normal Heights', san_diego_id),
    ('University Heights', san_diego_id),
    ('Kensington', san_diego_id),
    ('Coronado', san_diego_id),
    ('Point Loma', san_diego_id),
    ('Sunset Cliffs', san_diego_id),
    ('Del Mar', san_diego_id),
    ('Encinitas', san_diego_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Dallas neighborhoods (20 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Downtown', dallas_id),
    ('Deep Ellum', dallas_id),
    ('Uptown', dallas_id),
    ('Bishop Arts District', dallas_id),
    ('Design District', dallas_id),
    ('Knox-Henderson', dallas_id),
    ('Lower Greenville', dallas_id),
    ('M Streets', dallas_id),
    ('Lakewood', dallas_id),
    ('Oak Lawn', dallas_id),
    ('Turtle Creek', dallas_id),
    ('Victory Park', dallas_id),
    ('Cityplace', dallas_id),
    ('Addison', dallas_id),
    ('Plano', dallas_id),
    ('Richardson', dallas_id),
    ('Irving', dallas_id),
    ('Garland', dallas_id),
    ('Mesquite', dallas_id),
    ('Highland Park', dallas_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- San Jose neighborhoods (15 popular ones)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Downtown', san_jose_id),
    ('Santana Row', san_jose_id),
    ('Willow Glen', san_jose_id),
    ('Almaden Valley', san_jose_id),
    ('Silver Creek', san_jose_id),
    ('Evergreen', san_jose_id),
    ('Berryessa', san_jose_id),
    ('North San Jose', san_jose_id),
    ('West San Jose', san_jose_id),
    ('East San Jose', san_jose_id),
    ('South San Jose', san_jose_id),
    ('Campbell', san_jose_id),
    ('Los Gatos', san_jose_id),
    ('Saratoga', san_jose_id),
    ('Cupertino', san_jose_id)
    ON CONFLICT (name, city_id) DO NOTHING;

END $$; 