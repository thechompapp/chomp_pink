-- src/doof-backend/initial_data.sql (Updated for ListItems table)

-- Populate Cities, Neighborhoods, Hashtags (Keep as before)
INSERT INTO Cities (id, name) VALUES (1, 'New York'), (2, 'Los Angeles'), (3, 'Chicago') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
SELECT setval(pg_get_serial_sequence('cities', 'id'), COALESCE((SELECT MAX(id)+1 FROM Cities), 1), false);
INSERT INTO Neighborhoods (id, name, city_id) VALUES (1, 'Greenwich Village', 1), (2, 'Midtown', 1), (3, 'Lower East Side', 1), (4, 'Chelsea', 1), (5, 'West Village', 1), (6, 'East Village', 1), (7, 'River North', 3), (8, 'Lincoln Park', 3), (9, 'West Loop', 3), (10, 'Gold Coast', 3), (11, 'Silver Lake', 2), (12, 'Arts District', 2), (13, 'La Brea', 2), (14, 'Venice', 2), (15, 'Various', 2), (16, 'Little Tokyo', 2), (17, 'Chinatown', 2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city_id = EXCLUDED.city_id;
SELECT setval(pg_get_serial_sequence('neighborhoods', 'id'), COALESCE((SELECT MAX(id)+1 FROM Neighborhoods), 1), false);
INSERT INTO Hashtags (id, name, category) VALUES (1,'pizza','Cuisines'),(2,'italian','Cuisines'),(3,'classic','Attributes'),(4,'slice','Attributes'),(5,'burger','Cuisines'),(6,'american','Cuisines'),(7,'fast-food','Attributes'),(8,'fries','Specific Foods'),(9,'shakes','Beverages'),(10,'deli','Cuisines'),(11,'sandwiches','Specific Foods'),(12,'pastrami','Specific Foods'),(13,'tacos','Cuisines'),(14,'mexican','Cuisines'),(15,'casual','Attributes'),(16,'quick','Attributes'),(17,'pasta','Cuisines'),(18,'cozy','Attributes'),(19,'romantic','Attributes'),(20,'ramen','Cuisines'),(21,'japanese','Cuisines'),(22,'noodles','Specific Foods'),(23,'pork buns','Specific Foods'),(24,'falafel','Specific Foods'),(25,'middle eastern','Cuisines'),(26,'cheap eats','Attributes'),(27,'vegetarian','Dietary'),(28,'meat','Dietary'),(29,'beef','Dietary'),(30,'pork','Dietary'),(31,'spicy','Attributes'),(32,'cactus','Specific Foods'),(33,'cheese','Ingredients'),(34,'nyc','Location'),(35,'must try','Attributes'),(36,'california','Location'),(37,'healthy','Dietary'),(38,'sushi','Cuisines'),(39,'vegan','Dietary'),(40,'brunch','Meal'),(41,'celebrity spot','Attributes'),(42,'korean','Cuisines'),(43,'bbq','Cuisines'),(44,'fusion','Cuisines'),(45,'deep dish','Specific Foods'),(46,'hot dog','Specific Foods'),(47,'midwest','Location'),(48,'steakhouse','Cuisines'),(49,'seafood','Cuisines'),(50,'breakfast','Meal'),(51,'thai','Cuisines'),(52,'vietnamese','Cuisines'),(53,'pho','Specific Foods'),(54,'indian','Cuisines'),(55,'curry','Specific Foods'),(56,'mediterranean','Cuisines'),(57,'greek','Cuisines'),(58,'bakery','Attributes'),(59,'pastries','Specific Foods'),(60,'coffee','Beverages'),(61,'cocktails','Beverages'),(62,'wine bar','Attributes'),(63,'brewery','Attributes'),(64,'comfort food','Attributes'),(65,'fine dining','Attributes'),(66,'food truck','Attributes'),(67,'late night','Attributes'),(68,'organic','Attributes'),(69,'outdoor seating','Attributes'),(70,'small plates','Attributes'),(71,'tomato','Ingredients'),(72,'basil','Ingredients'),(73,'onion','Ingredients'),(74,'lettuce','Ingredients'),(75,'corn','Ingredients'),(76,'cilantro','Ingredients'),(77,'street food','Attributes'),(78,'fish','Ingredients'),(79,'raw','Dietary'),(80,'rice','Ingredients'),(81,'wasabi','Ingredients'),(82,'broth','Ingredients'),(83,'egg','Ingredients'),(84,'greens','Ingredients'),(85,'lunch','Meal'),(86,'light','Attributes'),(87,'baked','Attributes') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category;
SELECT setval(pg_get_serial_sequence('hashtags', 'id'), COALESCE((SELECT MAX(id)+1 FROM Hashtags), 1), false);


-- Populate Restaurants table (Keep as before)
INSERT INTO Restaurants (id, name, city_id, city_name, neighborhood_id, neighborhood_name, adds) VALUES (1,'Joe''s Pizza',1,'New York',1,'Greenwich Village',150),(2,'Shake Shack',1,'New York',2,'Midtown',210),(3,'Katz''s Delicatessen',1,'New York',3,'Lower East Side',180),(4,'Los Tacos No. 1',1,'New York',4,'Chelsea',250),(5,'Via Carota',1,'New York',5,'West Village',195),(6,'Ippudo NY',1,'New York',6,'East Village',220),(7,'Mamoun''s Falafel',1,'New York',1,'Greenwich Village',160) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city_id = EXCLUDED.city_id, city_name = EXCLUDED.city_name, neighborhood_id = EXCLUDED.neighborhood_id, neighborhood_name = EXCLUDED.neighborhood_name, adds = EXCLUDED.adds;
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), COALESCE((SELECT MAX(id)+1 FROM Restaurants), 1), false);

-- Populate RestaurantHashtags (Keep as before)
INSERT INTO RestaurantHashtags (restaurant_id, hashtag_id) VALUES (1,1),(1,2),(1,3),(1,4),(1,34),(1,15),(2,5),(2,6),(2,7),(2,8),(2,9),(2,15),(3,10),(3,11),(3,12),(3,3),(3,34),(3,35),(4,13),(4,14),(4,15),(4,16),(4,34),(5,2),(5,17),(5,18),(5,19),(5,62),(6,20),(6,21),(6,22),(6,23),(6,15),(6,67),(7,24),(7,25),(7,26),(7,27),(7,15),(7,67) ON CONFLICT (restaurant_id, hashtag_id) DO NOTHING;

-- Populate Dishes table (Keep as before)
INSERT INTO Dishes (id, name, restaurant_id, adds) VALUES (1,'Margherita Pizza',1,100),(2,'Pepperoni Pizza',1,95),(3,'ShackBurger',2,150),(4,'Crinkle Cut Fries',2,120),(5,'Pastrami on Rye',3,140),(6,'Adobada Taco',4,180),(7,'Nopal Taco (Cactus)',4,110),(8,'Cacio e Pepe',5,165),(9,'Akamaru Modern Ramen',6,170),(10,'Falafel Sandwich',7,130) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, restaurant_id = EXCLUDED.restaurant_id, adds = EXCLUDED.adds;
SELECT setval(pg_get_serial_sequence('dishes', 'id'), COALESCE((SELECT MAX(id)+1 FROM Dishes), 1), false);

-- Populate DishHashtags (Keep as before)
INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES (1,1),(1,2),(1,27),(1,3),(1,33),(1,71),(1,72),(2,1),(2,2),(2,28),(2,3),(2,33),(2,30),(3,5),(3,6),(3,29),(3,33),(3,3),(4,8),(4,7),(5,11),(5,12),(5,10),(5,3),(5,28),(5,29),(6,13),(6,30),(6,14),(6,31),(6,75),(6,76),(7,13),(7,32),(7,14),(7,27),(7,75),(7,76),(8,17),(8,2),(8,27),(8,3),(8,33),(9,20),(9,30),(9,21),(9,22),(9,82),(9,83),(10,11),(10,24),(10,27),(10,25),(10,26),(10,16) ON CONFLICT (dish_id, hashtag_id) DO NOTHING;

-- Populate Lists table (REMOVED items and item_count)
-- item_count will need to be calculated/updated by backend logic or a trigger later
INSERT INTO Lists (id, name, description, saved_count, city_name, tags, is_public, created_by_user, creator_handle, is_following) VALUES
(1, 'NYC Pizza Tour', 'Best slices in the city', 245, 'New York', ARRAY['pizza', 'italian', 'nyc', 'slice'], true, false, '@pizzalover', false),
(2, 'Iconic NYC Eats', 'Must-try classic spots', 187, 'New York', ARRAY['classic', 'deli', 'sandwiches', 'cheap eats', 'must try'], true, true, '@nycfoodie', false)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name, description = EXCLUDED.description, saved_count = EXCLUDED.saved_count, city_name = EXCLUDED.city_name,
tags = EXCLUDED.tags, is_public = EXCLUDED.is_public, created_by_user = EXCLUDED.created_by_user,
creator_handle = EXCLUDED.creator_handle, is_following = EXCLUDED.is_following;
SELECT setval(pg_get_serial_sequence('lists', 'id'), COALESCE((SELECT MAX(id)+1 FROM Lists), 1), false);

-- *** NEW: Populate ListItems table based on old JSONB data ***
-- List 1: NYC Pizza Tour (ID: 1)
-- Items: {"id": 1, "name": "Joe's Pizza", "type": "restaurant"}, {"id": 1, "name": "Margherita Pizza", "restaurant": "Joe's Pizza", "type": "dish"}
INSERT INTO ListItems (list_id, item_type, item_id) VALUES
(1, 'restaurant', 1), -- Joe's Pizza (Restaurant ID 1)
(1, 'dish', 1)         -- Margherita Pizza (Dish ID 1)
ON CONFLICT (list_id, item_type, item_id) DO NOTHING;

-- List 2: Iconic NYC Eats (ID: 2)
-- Items: {"id": 3, "name": "Katz's Delicatessen", "type": "restaurant"}, {"id": 5, "name": "Pastrami on Rye", "restaurant": "Katz's Delicatessen", "type": "dish"}, {"id": 7, "name": "Mamoun's Falafel", "type": "restaurant"}, {"id": 10, "name": "Falafel Sandwich", "restaurant": "Mamoun's Falafel", "type": "dish"}
INSERT INTO ListItems (list_id, item_type, item_id) VALUES
(2, 'restaurant', 3), -- Katz's Delicatessen (Restaurant ID 3)
(2, 'dish', 5),         -- Pastrami on Rye (Dish ID 5)
(2, 'restaurant', 7), -- Mamoun's Falafel (Restaurant ID 7)
(2, 'dish', 10)        -- Falafel Sandwich (Dish ID 10)
ON CONFLICT (list_id, item_type, item_id) DO NOTHING;
-- Reset sequence for ListItems
SELECT setval(pg_get_serial_sequence('listitems', 'id'), COALESCE((SELECT MAX(id)+1 FROM ListItems), 1), false);


-- Optional: Update Lists.item_count based on ListItems (if not handled by trigger/backend)
-- UPDATE Lists SET item_count = (SELECT COUNT(*) FROM ListItems WHERE list_id = Lists.id);