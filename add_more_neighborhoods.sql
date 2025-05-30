-- Add more neighborhoods to reach exactly 25 per city

DO $$
DECLARE
    dallas_id INTEGER;
    houston_id INTEGER;
    philly_id INTEGER;
    phoenix_id INTEGER;
    san_antonio_id INTEGER;
    san_diego_id INTEGER;
    san_jose_id INTEGER;
BEGIN
    -- Get city IDs
    SELECT id INTO dallas_id FROM cities WHERE name = 'Dallas';
    SELECT id INTO houston_id FROM cities WHERE name = 'Houston';
    SELECT id INTO philly_id FROM cities WHERE name = 'Philadelphia';
    SELECT id INTO phoenix_id FROM cities WHERE name = 'Phoenix';
    SELECT id INTO san_antonio_id FROM cities WHERE name = 'San Antonio';
    SELECT id INTO san_diego_id FROM cities WHERE name = 'San Diego';
    SELECT id INTO san_jose_id FROM cities WHERE name = 'San Jose';

    -- Add 5 more neighborhoods to Dallas (to reach 25)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Farmers Branch', dallas_id),
    ('Grand Prairie', dallas_id),
    ('Carrollton', dallas_id),
    ('Lewisville', dallas_id),
    ('Frisco', dallas_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Add 5 more neighborhoods to Houston (to reach 25)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Pasadena', houston_id),
    ('Spring', houston_id),
    ('Cypress', houston_id),
    ('Humble', houston_id),
    ('Atascocita', houston_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Add 5 more neighborhoods to Philadelphia (to reach 25)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Northern Liberties', philly_id),
    ('Port Richmond', philly_id),
    ('Kensington', philly_id),
    ('Francisville', philly_id),
    ('Spring Garden', philly_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Add 10 more neighborhoods to Phoenix (to reach 25)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Ahwatukee', phoenix_id),
    ('Arcadia', phoenix_id),
    ('Biltmore', phoenix_id),
    ('Camelback East', phoenix_id),
    ('Desert Ridge', phoenix_id),
    ('Laveen', phoenix_id),
    ('Maryvale', phoenix_id),
    ('Paradise Valley', phoenix_id),
    ('South Mountain', phoenix_id),
    ('Deer Valley', phoenix_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Add 10 more neighborhoods to San Antonio (to reach 25)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Castle Hills', san_antonio_id),
    ('Converse', san_antonio_id),
    ('Helotes', san_antonio_id),
    ('Hollywood Park', san_antonio_id),
    ('Kirby', san_antonio_id),
    ('Live Oak', san_antonio_id),
    ('Olmos Park', san_antonio_id),
    ('Selma', san_antonio_id),
    ('Shavano Park', san_antonio_id),
    ('Universal City', san_antonio_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Add 5 more neighborhoods to San Diego (to reach 25)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Carlsbad', san_diego_id),
    ('Solana Beach', san_diego_id),
    ('Imperial Beach', san_diego_id),
    ('National City', san_diego_id),
    ('Chula Vista', san_diego_id)
    ON CONFLICT (name, city_id) DO NOTHING;

    -- Add 10 more neighborhoods to San Jose (to reach 25)
    INSERT INTO neighborhoods (name, city_id) VALUES 
    ('Milpitas', san_jose_id),
    ('Mountain View', san_jose_id),
    ('Palo Alto', san_jose_id),
    ('Sunnyvale', san_jose_id),
    ('Santa Clara', san_jose_id),
    ('Fremont', san_jose_id),
    ('Union City', san_jose_id),
    ('Newark', san_jose_id),
    ('Menlo Park', san_jose_id),
    ('Redwood City', san_jose_id)
    ON CONFLICT (name, city_id) DO NOTHING;

END $$; 