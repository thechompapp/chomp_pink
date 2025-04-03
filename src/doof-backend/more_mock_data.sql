-- Add Restaurants in Los Angeles (City ID: 2)
INSERT INTO Restaurants (id, name, city_id, city_name, neighborhood_id, neighborhood_name, adds) VALUES
(8, 'Sqirl', 2, 'Los Angeles', 11, 'Silver Lake', 180),
(9, 'Bestia', 2, 'Los Angeles', 12, 'Arts District', 250),
(10, 'Republique', 2, 'Los Angeles', 13, 'La Brea', 220),
(11, 'Gjelina', 2, 'Los Angeles', 14, 'Venice', 200),
(12, 'Kogi BBQ Truck', 2, 'Los Angeles', 15, 'Various', 300),
(13, 'Marugame Monzo', 2, 'Los Angeles', 16, 'Little Tokyo', 170),
(14, 'Philippe The Original', 2, 'Los Angeles', 17, 'Chinatown', 155)
ON CONFLICT (id) DO UPDATE SET
name=EXCLUDED.name, city_id=EXCLUDED.city_id, city_name=EXCLUDED.city_name,
neighborhood_id=EXCLUDED.neighborhood_id, neighborhood_name=EXCLUDED.neighborhood_name, adds=EXCLUDED.adds;

-- Add Restaurants in Chicago (City ID: 3)
INSERT INTO Restaurants (id, name, city_id, city_name, neighborhood_id, neighborhood_name, adds) VALUES
(15, 'Alinea', 3, 'Chicago', 8, 'Lincoln Park', 280),
(16, 'Au Cheval', 3, 'Chicago', 9, 'West Loop', 260),
(17, 'Lou Malnati''s Pizzeria', 3, 'Chicago', 7, 'River North', 240),
(18, 'Portillo''s Hot Dogs', 3, 'Chicago', 7, 'River North', 190),
(19, 'Girl & The Goat', 3, 'Chicago', 9, 'West Loop', 230),
(20, 'Pequod''s Pizza', 3, 'Chicago', 8, 'Lincoln Park', 215),
(21, 'Gibsons Bar & Steakhouse', 3, 'Chicago', 10, 'Gold Coast', 205)
ON CONFLICT (id) DO UPDATE SET
name=EXCLUDED.name, city_id=EXCLUDED.city_id, city_name=EXCLUDED.city_name,
neighborhood_id=EXCLUDED.neighborhood_id, neighborhood_name=EXCLUDED.neighborhood_name, adds=EXCLUDED.adds;
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM Restaurants), 1), 22));

-- Populate RestaurantHashtags for LA & Chicago Restaurants
INSERT INTO RestaurantHashtags (restaurant_id, hashtag_id) VALUES
(8, 40), (8, 50), (8, 58), (8, 37), (8, 68), (8, 15), -- Sqirl: brunch, breakfast, bakery, healthy, organic, casual
(9, 2), (9, 1), (9, 17), (9, 65), (9, 61), -- Bestia: italian, pizza, pasta, fine dining, cocktails
(10, 58), (10, 40), (10, 50), (10, 59), (10, 61), -- Republique: bakery, brunch, breakfast, pastries, cocktails
(11, 2), (11, 1), (11, 69), (11, 41), (11, 15), -- Gjelina: italian, pizza, outdoor seating, celebrity spot, casual
(12, 66), (12, 42), (12, 14), (12, 44), (12, 43), -- Kogi BBQ Truck: food truck, korean, mexican, fusion, bbq
(13, 21), (13, 22), (13, 15), -- Marugame Monzo: japanese, noodles, casual
(14, 6), (14, 11), (14, 3), (14, 26), -- Philippe The Original: american, sandwiches, classic, cheap eats
(15, 65), (15, 6), (15, 70), -- Alinea: fine dining, american, small plates
(16, 5), (16, 6), (16, 67), (16, 35), (16, 29), -- Au Cheval: burger, american, late night, must try, beef
(17, 1), (17, 2), (17, 45), (17, 15), -- Lou Malnati's Pizzeria: pizza, italian, deep dish, casual
(18, 6), (18, 46), (18, 11), (18, 26), (18, 47), -- Portillo's Hot Dogs: american, hot dog, sandwiches, cheap eats, midwest
(19, 6), (19, 70), (19, 61), (19, 15), (19, 35), -- Girl & The Goat: american, small plates, cocktails, casual, must try
(20, 1), (20, 45), (20, 15), -- Pequod's Pizza: pizza, deep dish, casual
(21, 48), (21, 6), (21, 49), (21, 65) -- Gibsons Bar & Steakhouse: steakhouse, american, seafood, fine dining
ON CONFLICT (restaurant_id, hashtag_id) DO NOTHING;

-- Add Dishes for LA Restaurants (References Restaurants.id 8-14)
INSERT INTO Dishes (id, name, restaurant_id, adds) VALUES
(11, 'Ricotta Toast', 8, 160), (12, 'Sorrel Pesto Rice Bowl', 8, 150), (13, 'Cavatelli alla Norcina', 9, 230),
(14, 'Margherita Pizza (Bestia)', 9, 200), (15, 'Kimchi Fried Rice', 10, 190), (16, 'Mushroom Toast', 10, 185),
(17, 'Short Rib Taco', 12, 280), (18, 'Blackjack Quesadilla', 12, 250), (19, 'Uni Udon', 13, 165),
(20, 'Mentai Butter Udon', 13, 160), (21, 'French Dip Sandwich', 14, 140)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, restaurant_id=EXCLUDED.restaurant_id, adds=EXCLUDED.adds;

-- Add Dishes for Chicago Restaurants (References Restaurants.id 15-21)
INSERT INTO Dishes (id, name, restaurant_id, adds) VALUES
(22, 'The Alinea Experience', 15, 270), (23, 'Single Cheeseburger w/ Egg', 16, 245), (24, 'Deep Dish Buttercrust Pizza', 17, 220),
(25, 'Chicago Style Hot Dog', 18, 175), (26, 'Italian Beef Sandwich', 18, 170), (27, 'Wood Oven Roasted Pig Face', 19, 210),
(28, 'Pan Pizza w/ Caramelized Crust', 20, 200), (29, 'WR Chicago Cut Steak', 21, 195)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, restaurant_id=EXCLUDED.restaurant_id, adds=EXCLUDED.adds;
SELECT setval(pg_get_serial_sequence('dishes', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM Dishes), 1), 30));

-- Add DishHashtags links for new dishes (IDs 11-29)
INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES
(11, 40), (11, 50), (11, 37), (11, 58), (11, 59), -- Ricotta Toast: brunch, breakfast, healthy, bakery, pastries
(12, 37), (12, 40), (12, 68), (12, 80), -- Sorrel Pesto Rice Bowl: healthy, brunch, organic, rice
(13, 17), (13, 2), (13, 30), (13, 64), -- Cavatelli alla Norcina: pasta, italian, pork, comfort food
(14, 1), (14, 2), (14, 27), (14, 33), -- Margherita Pizza (Bestia): pizza, italian, vegetarian, cheese
(15, 42), (15, 44), (15, 40), (15, 80), (15, 83), -- Kimchi Fried Rice: korean, fusion, brunch, rice, egg
(16, 40), (16, 27), (16, 58), -- Mushroom Toast: brunch, vegetarian, bakery
(17, 13), (17, 42), (17, 14), (17, 44), (17, 66), (17, 29), -- Short Rib Taco: tacos, korean, mexican, fusion, food truck, beef
(18, 14), (18, 42), (18, 44), (18, 66), (18, 33), -- Blackjack Quesadilla: mexican, korean, fusion, food truck, cheese
(19, 22), (19, 21), (19, 49), -- Uni Udon: noodles, japanese, seafood
(20, 22), (20, 21), -- Mentai Butter Udon: noodles, japanese
(21, 11), (21, 6), (21, 3), (21, 29), -- French Dip Sandwich: sandwiches, american, classic, beef
(22, 65), (22, 6), (22, 70), -- The Alinea Experience: fine dining, american, small plates
(23, 5), (23, 29), (23, 6), (23, 67), (23, 35), (23, 83), -- Single Cheeseburger w/ Egg: burger, beef, american, late night, must try, egg
(24, 45), (24, 1), (24, 2), (24, 33), -- Deep Dish Buttercrust Pizza: deep dish, pizza, italian, cheese
(25, 46), (25, 6), (25, 47), (25, 29), -- Chicago Style Hot Dog: hot dog, american, midwest, beef
(26, 11), (26, 29), (26, 6), (26, 47), -- Italian Beef Sandwich: sandwiches, beef, american, midwest
(27, 30), (27, 70), (27, 6), (27, 35), -- Wood Oven Roasted Pig Face: pork, small plates, american, must try
(28, 45), (28, 1), (28, 33), -- Pan Pizza w/ Caramelized Crust: deep dish, pizza, cheese
(29, 48), (29, 29), (29, 6) -- WR Chicago Cut Steak: steakhouse, beef, american
ON CONFLICT (dish_id, hashtag_id) DO NOTHING;

-- Add a List for 'testnfg' (seen in the screenshot as a Popular List)
INSERT INTO Lists (id, name, description, saved_count, city_name, tags, is_public, creator_handle, user_id) VALUES
(3, 'testnfg', 'A test list for NFG', 50, 'New York', ARRAY['test', 'misc'], true, '@testuser', 1)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, description = EXCLUDED.description, saved_count = EXCLUDED.saved_count, city_name = EXCLUDED.city_name,
tags = EXCLUDED.tags, is_public = EXCLUDED.is_public, creator_handle = EXCLUDED.creator_handle, user_id = EXCLUDED.user_id;

-- Populate ListItems for 'testnfg' list (ID: 3)
INSERT INTO ListItems (list_id, item_type, item_id) VALUES
(3, 'restaurant', 1), -- Joe's Pizza (Restaurant ID 1)
(3, 'dish', 1)         -- Margherita Pizza (Dish ID 1)
ON CONFLICT (list_id, item_type, item_id) DO NOTHING;