-- src/doof-backend/more_mock_data.sql
-- Adds more mock data using the new schema with city_id and neighborhood_id

-- Assume Cities (1: NY, 2: LA, 3: Chicago) and Neighborhoods (1-17) are populated by initial_data.sql

-- Add Restaurants in Los Angeles (City ID: 2)
INSERT INTO Restaurants (id, name, city_id, city_name, neighborhood_id, neighborhood_name, adds) VALUES
(8, 'Sqirl', 2, 'Los Angeles', 11, 'Silver Lake', 180),
(9, 'Bestia', 2, 'Los Angeles', 12, 'Arts District', 250),
(10, 'Republique', 2, 'Los Angeles', 13, 'La Brea', 220),
(11, 'Gjelina', 2, 'Los Angeles', 14, 'Venice', 200),
(12, 'Kogi BBQ Truck', 2, 'Los Angeles', 15, 'Various', 300), -- Assumes 'Various' is ID 15
(13, 'Marugame Monzo', 2, 'Los Angeles', 16, 'Little Tokyo', 170),
(14, 'Philippe The Original', 2, 'Los Angeles', 17, 'Chinatown', 155)
ON CONFLICT (id) DO UPDATE SET
name=EXCLUDED.name, city_id=EXCLUDED.city_id, city_name=EXCLUDED.city_name,
neighborhood_id=EXCLUDED.neighborhood_id, neighborhood_name=EXCLUDED.neighborhood_name, adds=EXCLUDED.adds;

-- Add Restaurants in Chicago (City ID: 3)
INSERT INTO Restaurants (id, name, city_id, city_name, neighborhood_id, neighborhood_name, adds) VALUES
(15, 'Alinea', 3, 'Chicago', 8, 'Lincoln Park', 280), -- Lincoln Park ID 8
(16, 'Au Cheval', 3, 'Chicago', 9, 'West Loop', 260), -- West Loop ID 9
(17, 'Lou Malnati''s Pizzeria', 3, 'Chicago', 7, 'River North', 240), -- River North ID 7
(18, 'Portillo''s Hot Dogs', 3, 'Chicago', 7, 'River North', 190), -- River North ID 7
(19, 'Girl & The Goat', 3, 'Chicago', 9, 'West Loop', 230), -- West Loop ID 9
(20, 'Pequod''s Pizza', 3, 'Chicago', 8, 'Lincoln Park', 215), -- Lincoln Park ID 8
(21, 'Gibsons Bar & Steakhouse', 3, 'Chicago', 10, 'Gold Coast', 205) -- Gold Coast ID 10
ON CONFLICT (id) DO UPDATE SET
name=EXCLUDED.name, city_id=EXCLUDED.city_id, city_name=EXCLUDED.city_name,
neighborhood_id=EXCLUDED.neighborhood_id, neighborhood_name=EXCLUDED.neighborhood_name, adds=EXCLUDED.adds;
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM Restaurants), 1), 22));


-- Populate RestaurantHashtags for LA & Chicago Restaurants (Same as previous step)
INSERT INTO RestaurantHashtags (restaurant_id, hashtag_id) VALUES
(8, 40), (8, 50), (8, 58), (8, 37), (8, 68), (8, 15), (9, 2), (9, 1), (9, 17), (9, 65), (9, 61),
(10, 58), (10, 40), (10, 50), (10, 59), (10, 61), (11, 2), (11, 1), (11, 69), (11, 41), (11, 15),
(12, 66), (12, 42), (12, 14), (12, 44), (12, 43), (13, 21), (13, 22), (13, 15), (14, 6), (14, 11), (14, 3), (14, 26),
(15, 65), (15, 6), (15, 70), (16, 5), (16, 6), (16, 67), (16, 35), (16, 29), (17, 1), (17, 2), (17, 45), (17, 15),
(18, 6), (18, 46), (18, 11), (18, 26), (18, 47), (19, 6), (19, 70), (19, 61), (19, 15), (19, 35),
(20, 1), (20, 45), (20, 15), (21, 48), (21, 6), (21, 49), (21, 65)
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


-- Add DishHashtags links for new dishes (IDs 11-29 - Same as previous step)
INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES
(11, 40), (11, 50), (11, 37), (11, 58), (11, 59), (12, 37), (12, 40), (12, 68), (12, 80), (13, 17), (13, 2), (13, 30), (13, 64),
(14, 1), (14, 2), (14, 27), (14, 33), (15, 42), (15, 44), (15, 40), (15, 80), (15, 83), (16, 40), (16, 27), (16, 58),
(17, 13), (17, 42), (17, 14), (17, 44), (17, 66), (17, 29), (18, 14), (18, 42), (18, 44), (18, 66), (18, 33),
(19, 22), (19, 21), (19, 49), (20, 22), (20, 21), (21, 11), (21, 6), (21, 3), (21, 29), (22, 65), (22, 6), (22, 70),
(23, 5), (23, 29), (23, 6), (23, 67), (23, 35), (23, 83), (24, 45), (24, 1), (24, 2), (24, 33), (25, 46), (25, 6), (25, 47), (25, 29),
(26, 11), (26, 29), (26, 6), (26, 47), (27, 30), (27, 70), (27, 6), (27, 35), (28, 45), (28, 1), (28, 33), (29, 48), (29, 29), (29, 6)
ON CONFLICT (dish_id, hashtag_id) DO NOTHING;