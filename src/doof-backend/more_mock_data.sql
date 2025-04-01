-- src/doof-backend/more_mock_data.sql
-- Adds more mock data for robust filter testing across multiple cities.

-- Add more Hashtags (using ON CONFLICT DO NOTHING)
-- Assuming IDs 1-35 were used previously
INSERT INTO Hashtags (id, name, category) VALUES
(36, 'california', 'Location'), (37, 'healthy', 'Dietary'), (38, 'sushi', 'Cuisines'),
(39, 'vegan', 'Dietary'), (40, 'brunch', 'Meal'), (41, 'celebrity spot', 'Attributes'),
(42, 'korean', 'Cuisines'), (43, 'bbq', 'Cuisines'), (44, 'fusion', 'Cuisines'),
(45, 'deep dish', 'Specific Foods'), (46, 'hot dog', 'Specific Foods'), (47, 'midwest', 'Location'),
(48, 'steakhouse', 'Cuisines'), (49, 'seafood', 'Cuisines'), (50, 'breakfast', 'Meal'),
(51, 'thai', 'Cuisines'), (52, 'vietnamese', 'Cuisines'), (53, 'pho', 'Specific Foods'),
(54, 'indian', 'Cuisines'), (55, 'curry', 'Specific Foods'), (56, 'mediterranean', 'Cuisines'),
(57, 'greek', 'Cuisines'), (58, 'bakery', 'Attributes'), (59, 'pastries', 'Specific Foods'),
(60, 'coffee', 'Beverages'), (61, 'cocktails', 'Beverages'), (62, 'wine bar', 'Attributes'),
(63, 'brewery', 'Attributes'), (64, 'comfort food', 'Attributes'), (65, 'fine dining', 'Attributes'),
(66, 'food truck', 'Attributes'), (67, 'late night', 'Attributes'), (68, 'organic', 'Attributes'),
(69, 'outdoor seating', 'Attributes'), (70, 'small plates', 'Attributes')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
-- Update sequence if manual IDs were used extensively
SELECT setval(pg_get_serial_sequence('hashtags', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM Hashtags), 1), 71));


-- Add Restaurants in Los Angeles
-- Assuming previous IDs were 1-7
INSERT INTO Restaurants (id, name, neighborhood, city, adds) VALUES
(8, 'Sqirl', 'Silver Lake', 'Los Angeles', 180),
(9, 'Bestia', 'Arts District', 'Los Angeles', 250),
(10, 'Republique', 'La Brea', 'Los Angeles', 220),
(11, 'Gjelina', 'Venice', 'Los Angeles', 200),
(12, 'Kogi BBQ Truck', 'Various', 'Los Angeles', 300),
(13, 'Marugame Monzo', 'Little Tokyo', 'Los Angeles', 170),
(14, 'Philippe The Original', 'Chinatown', 'Los Angeles', 155)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, neighborhood=EXCLUDED.neighborhood, city=EXCLUDED.city, adds=EXCLUDED.adds;

-- Add Restaurants in Chicago
INSERT INTO Restaurants (id, name, neighborhood, city, adds) VALUES
(15, 'Alinea', 'Lincoln Park', 'Chicago', 280),
(16, 'Au Cheval', 'West Loop', 'Chicago', 260),
(17, 'Lou Malnati''s Pizzeria', 'River North', 'Chicago', 240),
(18, 'Portillo''s Hot Dogs', 'River North', 'Chicago', 190),
(19, 'Girl & The Goat', 'West Loop', 'Chicago', 230),
(20, 'Pequod''s Pizza', 'Lincoln Park', 'Chicago', 215),
(21, 'Gibsons Bar & Steakhouse', 'Gold Coast', 'Chicago', 205)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, neighborhood=EXCLUDED.neighborhood, city=EXCLUDED.city, adds=EXCLUDED.adds;
-- Update sequence for Restaurants
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM Restaurants), 1), 22));


-- Add Dishes for LA Restaurants
-- Assuming previous IDs were 1-10
INSERT INTO Dishes (id, name, restaurant_id, adds) VALUES
(11, 'Ricotta Toast', 8, 160), -- Sqirl
(12, 'Sorrel Pesto Rice Bowl', 8, 150), -- Sqirl
(13, 'Cavatelli alla Norcina', 9, 230), -- Bestia
(14, 'Margherita Pizza (Bestia)', 9, 200), -- Bestia (Different from Joe's)
(15, 'Kimchi Fried Rice', 10, 190), -- Republique
(16, 'Mushroom Toast', 10, 185), -- Republique
(17, 'Short Rib Taco', 12, 280), -- Kogi
(18, 'Blackjack Quesadilla', 12, 250), -- Kogi
(19, 'Uni Udon', 13, 165), -- Marugame Monzo
(20, 'Mentai Butter Udon', 13, 160), -- Marugame Monzo
(21, 'French Dip Sandwich', 14, 140) -- Philippe
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, restaurant_id=EXCLUDED.restaurant_id, adds=EXCLUDED.adds;

-- Add Dishes for Chicago Restaurants
INSERT INTO Dishes (id, name, restaurant_id, adds) VALUES
(22, 'The Alinea Experience', 15, 270), -- Alinea
(23, 'Single Cheeseburger w/ Egg', 16, 245), -- Au Cheval
(24, 'Deep Dish Buttercrust Pizza', 17, 220), -- Lou Malnati's
(25, 'Chicago Style Hot Dog', 18, 175), -- Portillo's
(26, 'Italian Beef Sandwich', 18, 170), -- Portillo's
(27, 'Wood Oven Roasted Pig Face', 19, 210), -- Girl & The Goat
(28, 'Pan Pizza w/ Caramelized Crust', 20, 200), -- Pequod's
(29, 'WR Chicago Cut Steak', 21, 195) -- Gibsons
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, restaurant_id=EXCLUDED.restaurant_id, adds=EXCLUDED.adds;
-- Update sequence for Dishes
SELECT setval(pg_get_serial_sequence('dishes', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM Dishes), 1), 30));


-- Add DishHashtags links for new dishes
INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES
-- LA Dishes
(11, 40), (11, 50), (11, 37), (11, 58), -- Ricotta Toast: brunch, breakfast, healthy, bakery
(12, 37), (12, 40), (12, 68), -- Sorrel Pesto Rice Bowl: healthy, brunch, organic
(13, 17), (13, 2), (13, 30), (13, 64), -- Cavatelli alla Norcina: pasta, italian, pork, comfort food
(14, 1), (14, 2), (14, 27), -- Margherita Pizza (Bestia): pizza, italian, vegetarian
(15, 42), (15, 44), (15, 40), -- Kimchi Fried Rice: korean, fusion, brunch
(16, 40), (16, 27), (16, 58), -- Mushroom Toast: brunch, vegetarian, bakery
(17, 13), (17, 42), (17, 14), (17, 44), (17, 66), -- Short Rib Taco: taco, korean, mexican, fusion, food truck
(18, 14), (18, 42), (18, 44), (18, 66), -- Blackjack Quesadilla: mexican, korean, fusion, food truck
(19, 22), (19, 21), (19, 49), -- Uni Udon: noodles, japanese, seafood
(20, 22), (20, 21), -- Mentai Butter Udon: noodles, japanese
(21, 11), (21, 6), (21, 3), -- French Dip Sandwich: sandwich, american, classic
-- Chicago Dishes
(22, 65), (22, 6), -- The Alinea Experience: fine dining, american
(23, 5), (23, 29), (23, 6), (23, 67), -- Single Cheeseburger w/ Egg: burger, beef, american, late night
(24, 45), (24, 1), (24, 2), -- Deep Dish Buttercrust Pizza: deep dish, pizza, italian
(25, 46), (25, 6), (25, 47), -- Chicago Style Hot Dog: hot dog, american, midwest
(26, 11), (26, 29), (26, 6), (26, 47), -- Italian Beef Sandwich: sandwich, beef, american, midwest
(27, 30), (27, 70), (27, 6), -- Wood Oven Roasted Pig Face: pork, small plates, american
(28, 45), (28, 1), -- Pan Pizza w/ Caramelized Crust: deep dish, pizza
(29, 48), (29, 29) -- WR Chicago Cut Steak: steakhouse, beef
ON CONFLICT (dish_id, hashtag_id) DO NOTHING;

-- Note: No need to insert into Lists or CommonDishes unless desired.

-- Final Check: Log counts from tables
-- SELECT 'Restaurants' as table_name, COUNT(*) FROM Restaurants UNION ALL
-- SELECT 'Dishes', COUNT(*) FROM Dishes UNION ALL
-- SELECT 'Hashtags', COUNT(*) FROM Hashtags UNION ALL
-- SELECT 'DishHashtags', COUNT(*) FROM DishHashtags;