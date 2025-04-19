/* src/doof-backend/seeddata.sql */
-- ================================================
-- ✅ Insert 50 users with email, username, account_type, and password_hash
-- ================================================
DO $$
BEGIN
  FOR i IN 1..50 LOOP
    INSERT INTO users (username, email, password_hash, account_type, created_at)
    VALUES (
      'user_' || i,
      'user_' || i || '@chomp.local',
      -- IMPORTANT: Replace 'password_hash_placeholder' with securely generated hashes
      -- during the actual seeding process. Do NOT commit real password hashes.
      'password_hash_placeholder',
      'user',
      NOW()
    )
    ON CONFLICT (username) DO NOTHING;
  END LOOP;
END $$;

-- ================================================
-- ✅ Insert 50 restaurants across real neighborhoods
-- ================================================
DO $$
DECLARE
  nb RECORD;
  rest_id INT;
  rest_name TEXT;
  place_id TEXT;
  nbs INT[] := ARRAY(
    SELECT id FROM neighborhoods WHERE city_id = 1 ORDER BY random() LIMIT 50
  );
  names TEXT[] := ARRAY[
    'Prince Street Smash','Bk Brisket Club','Astoria Dumpling House','NoHo Noods',
    'Uptown Tap & Grill','Flatiron Fire Pizza','Ramen Republic','Greenwich Graze',
    'LES Torta Truck','Crown Heights Curry','Smash & Cheese','Tribeca Thai Club',
    'K-Town Fried Seoul','Morningside Melt','Chinatown BBQ Express','Roosevelt Roti',
    'LIC Bistro','Bronx Chop Shop','Union Square Shawarma','Taco Tempo',
    'Griddle Gospel','Fulton Fry House','Battery Brunch Café','Central Perk Pop-Up',
    'Flushing Feast House','East River Roll Bar','Canal Crepes','Sunset Sizzle',
    'Park Slope Pasta Co.','Midtown Melt Station','Meatpacking Melt','Hell’s Kitchen Hummus',
    'Canarsie Crunch','Greenpoint Greens','Red Hook Roast','Gramercy Gnocchi',
    'Chelsea Cheese Joint','Soho Soba Bar','Hudson Habanero','Roast Row',
    'Tompkins Tikka','Bushwick Bao House','Harlem Halal Cartel','Coney Island Bites',
    'Jackson Jerk Shack','Pelham Pizza Stop','Queens Quesabirria','Nomad Naan House',
    'FiDi Fish Fry','Broadway Brine Co.'
  ];
BEGIN
  FOR i IN 1..50 LOOP
    SELECT * INTO nb FROM neighborhoods WHERE id = nbs[i];
    rest_name := names[i];
    place_id := 'gplace_' || floor(random()*100000)::text;
    INSERT INTO restaurants (
      name, address, city_id, city_name, neighborhood_id, neighborhood_name,
      google_place_id, latitude, longitude, created_at, updated_at
    )
    VALUES (
      rest_name,
      rest_name || ' Address',
      1,
      'New York',
      nb.id,
      nb.name,
      place_id,
      40.6 + random()/5,
      -74.1 + random()/5,
      NOW(),
      NOW()
    )
    RETURNING id INTO rest_id;

    -- ✅ Insert 3 dishes per restaurant
    FOR j IN 1..3 LOOP
      INSERT INTO dishes (restaurant_id, name, created_at)
      VALUES (
        rest_id,
        rest_name || ' Dish ' || j,
        NOW()
      );
    END LOOP;
  END LOOP;
END $$;

-- ================================================
-- ✅ Insert 50 public lists (1 per user)
-- ================================================
INSERT INTO lists (name, user_id, is_public, created_at)
SELECT
  'Favorites by ' || username,
  id,
  TRUE,
  NOW()
FROM users
ORDER BY id
LIMIT 50;

-- ================================================
-- ✅ Add 200 dishvotes
-- ================================================
INSERT INTO dishvotes (dish_id, user_id, vote_type, created_at)
SELECT
  d.id,
  u.id,
  (ARRAY['up','neutral','down'])[floor(random()*3+1)::int],
  NOW()
FROM dishes d
JOIN users u ON true
ORDER BY random()
LIMIT 200;

-- ================================================
-- ✅ Add 100 listfollows
-- ================================================
INSERT INTO listfollows (list_id, user_id, followed_at)
SELECT
  l.id,
  u.id,
  NOW()
FROM lists l
JOIN users u ON l.user_id != u.id
ORDER BY random()
LIMIT 100;

-- ================================================
-- ✅ Add 200 dishes to lists as listitems (type = 'dish')
-- ================================================
INSERT INTO listitems (list_id, item_id, item_type, added_at)
SELECT
  l.id,
  d.id,
  'dish',
  NOW()
FROM lists l
JOIN dishes d ON true
ORDER BY random()
LIMIT 200;