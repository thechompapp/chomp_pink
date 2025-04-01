-- src/doof-backend/initial_data.sql (Corrected)

-- Clear existing data if needed (use with caution)
-- DELETE FROM DishHashtags;
-- DELETE FROM Hashtags;
-- DELETE FROM Dishes;
-- DELETE FROM Restaurants;
-- DELETE FROM Lists; -- Keep list data if desired

-- Populate Hashtags table first (define the tags used)
INSERT INTO Hashtags (id, name, category) VALUES
(1, 'pizza', 'Cuisines'), (2, 'italian', 'Cuisines'), (3, 'classic', 'Attributes'),
(4, 'slice', 'Attributes'), (5, 'burger', 'Cuisines'), (6, 'american', 'Cuisines'),
(7, 'fast-food', 'Attributes'), (8, 'fries', 'Specific Foods'), (9, 'shakes', 'Beverages'),
(10, 'deli', 'Cuisines'), (11, 'sandwiches', 'Specific Foods'), (12, 'pastrami', 'Specific Foods'),
(13, 'tacos', 'Cuisines'), (14, 'mexican', 'Cuisines'), (15, 'casual', 'Attributes'),
(16, 'quick', 'Attributes'), (17, 'pasta', 'Cuisines'), (18, 'cozy', 'Attributes'),
(19, 'romantic', 'Attributes'), (20, 'ramen', 'Cuisines'), (21, 'japanese', 'Cuisines'),
(22, 'noodles', 'Specific Foods'), (23, 'pork buns', 'Specific Foods'), (24, 'falafel', 'Specific Foods'),
(25, 'middle eastern', 'Cuisines'), (26, 'cheap eats', 'Attributes'), (27, 'vegetarian', 'Dietary'),
(28, 'meat', 'Dietary'), (29, 'beef', 'Dietary'), (30, 'pork', 'Dietary'),
(31, 'spicy', 'Attributes'), (32, 'cactus', 'Specific Foods'), (33, 'cheese', 'Ingredients'),
(34, 'nyc', 'Location'), (35, 'must try', 'Attributes')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
-- Reset sequence for Hashtags if needed after specifying IDs
SELECT setval(pg_get_serial_sequence('hashtags', 'id'), COALESCE((SELECT MAX(id)+1 FROM Hashtags), 1), false);


-- Populate Restaurants table (REMOVED 'tags' column from INSERT)
INSERT INTO Restaurants (id, name, neighborhood, city, adds) VALUES
(1, 'Joe''s Pizza', 'Greenwich Village', 'New York', 150),
(2, 'Shake Shack', 'Midtown', 'New York', 210),
(3, 'Katz''s Delicatessen', 'Lower East Side', 'New York', 180),
(4, 'Los Tacos No. 1', 'Chelsea', 'New York', 250),
(5, 'Via Carota', 'West Village', 'New York', 195),
(6, 'Ippudo NY', 'East Village', 'New York', 220),
(7, 'Mamoun''s Falafel', 'Greenwich Village', 'New York', 160)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
neighborhood = EXCLUDED.neighborhood,
city = EXCLUDED.city,
adds = EXCLUDED.adds;
-- Reset sequence for Restaurants if needed after specifying IDs
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), COALESCE((SELECT MAX(id)+1 FROM Restaurants), 1), false);


-- Populate Dishes table (REMOVED 'tags' column from INSERT)
-- Note: Ensure restaurant_id values match the Restaurants inserted above
INSERT INTO Dishes (id, name, restaurant_id, adds) VALUES
(1, 'Margherita Pizza', 1, 100),
(2, 'Pepperoni Pizza', 1, 95),
(3, 'ShackBurger', 2, 150),
(4, 'Crinkle Cut Fries', 2, 120),
(5, 'Pastrami on Rye', 3, 140),
(6, 'Adobada Taco', 4, 180),
(7, 'Nopal Taco', 4, 110),
(8, 'Cacio e Pepe', 5, 165),
(9, 'Akamaru Modern Ramen', 6, 170),
(10, 'Falafel Sandwich', 7, 130)
ON CONFLICT (id) DO UPDATE SET -- Using ID as conflict target now
name = EXCLUDED.name,
restaurant_id = EXCLUDED.restaurant_id,
adds = EXCLUDED.adds;
-- Reset sequence for Dishes if needed after specifying IDs
SELECT setval(pg_get_serial_sequence('dishes', 'id'), COALESCE((SELECT MAX(id)+1 FROM Dishes), 1), false);


-- Populate DishHashtags table (Link dishes to tags using IDs from above)
INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES
(1, 1), (1, 27), (1, 3), -- Margherita Pizza: pizza, vegetarian, classic
(2, 1), (2, 28), (2, 3), -- Pepperoni Pizza: pizza, meat, classic
(3, 5), (3, 29), (3, 33), -- ShackBurger: burger, beef, cheeseburger (cheese is 33)
(4, 8), (4, 7), -- Crinkle Cut Fries: fries, fast-food
(5, 11), (5, 12), (5, 10), (5, 3), -- Pastrami on Rye: sandwich, pastrami, deli, classic
(6, 13), (6, 30), (6, 14), (6, 31), -- Adobada Taco: taco, pork, mexican, spicy
(7, 13), (7, 32), (7, 14), (7, 27), -- Nopal Taco: taco, cactus, mexican, vegetarian
(8, 17), (8, 2), (8, 27), (8, 3), (8, 33), -- Cacio e Pepe: pasta, italian, vegetarian, classic, cheese
(9, 20), (9, 30), (9, 21), (9, 22), -- Akamaru Modern Ramen: ramen, pork, japanese, noodles
(10, 11), (10, 24), (10, 27), (10, 25), (10, 26) -- Falafel Sandwich: sandwich, falafel, vegetarian, middle eastern, cheap eats
ON CONFLICT (dish_id, hashtag_id) DO NOTHING;


-- Populate Lists table (Ensure tags array matches Hashtags defined above)
INSERT INTO Lists (id, name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following) VALUES
(1, 'NYC Pizza Tour', '[{"id": 1, "name": "Joe''s Pizza", "type": "restaurant"}, {"id": 1, "name": "Margherita Pizza", "restaurant": "Joe''s Pizza", "type": "dish"}]', 2, 245, 'New York', ARRAY['pizza', 'italian', 'nyc', 'slice'], true, false, '@pizzalover', false),
(2, 'Iconic NYC Eats', '[{"id": 3, "name": "Katz''s Delicatessen", "type": "restaurant"}, {"id": 3, "name": "Pastrami on Rye", "restaurant": "Katz''s Delicatessen", "type": "dish"}, {"id": 7, "name": "Mamoun''s Falafel", "type": "restaurant"}]', 3, 187, 'New York', ARRAY['classic', 'deli', 'sandwiches', 'cheap eats', 'must try'], true, true, '@nycfoodie', false)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
items = EXCLUDED.items,
item_count = EXCLUDED.item_count,
saved_count = EXCLUDED.saved_count,
city = EXCLUDED.city,
tags = EXCLUDED.tags,
is_public = EXCLUDED.is_public,
created_by_user = EXCLUDED.created_by_user,
creator_handle = EXCLUDED.creator_handle,
is_following = EXCLUDED.is_following;
-- Reset sequence for Lists if needed after specifying IDs
SELECT setval(pg_get_serial_sequence('lists', 'id'), COALESCE((SELECT MAX(id)+1 FROM Lists), 1), false);

-- Keep CommonDishes insert if still desired (though maybe redundant now)
INSERT INTO CommonDishes (name) VALUES
('Margherita Pizza'), ('Pepperoni Pizza'), ('Cheeseburger'), ('French Fries'), ('Caesar Salad'),
('Spaghetti Carbonara'), ('Chicken Alfredo'), ('Lasagna'), ('Tacos'), ('Burrito'),
('Sushi Roll'), ('Sashimi'), ('Ramen'), ('Pad Thai'), ('Fried Rice'),
('Dumplings'), ('Spring Rolls'), ('Pho'), ('Biryani'), ('Butter Chicken')
-- Add more as needed...
ON CONFLICT (name) DO NOTHING;
-- Reset sequence for CommonDishes if needed
-- SELECT setval(pg_get_serial_sequence('commondishes', 'id'), COALESCE((SELECT MAX(id)+1 FROM CommonDishes), 1), false);