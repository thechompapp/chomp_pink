-- src/doof-backend/initial_data.sql

-- Clear existing data from tables that will be populated
-- (Optional but ensures a clean slate if run multiple times)
-- DELETE FROM Dishes;
-- DELETE FROM Restaurants;
-- DELETE FROM Lists;
-- Keep CommonDishes, Neighborhoods, Filters data as it's static lookup data

-- Populate CommonDishes table (Keep as is)
INSERT INTO CommonDishes (name) VALUES
('Margherita Pizza'), ('Pepperoni Pizza'), ('Cheeseburger'), ('French Fries'), ('Caesar Salad'),
('Spaghetti Carbonara'), ('Chicken Alfredo'), ('Lasagna'), ('Tacos'), ('Burrito'),
('Sushi Roll'), ('Sashimi'), ('Ramen'), ('Pad Thai'), ('Fried Rice'),
('Dumplings'), ('Spring Rolls'), ('Pho'), ('Biryani'), ('Butter Chicken'),
('Falafel'), ('Hummus'), ('Shawarma'), ('Paella'), ('Tapas'),
('Empanadas'), ('Ceviche'), ('Jerk Chicken'), ('Gumbo'), ('Jambalaya'),
('Fish and Chips'), ('Shepherd’s Pie'), ('Bangers and Mash'), ('Pierogi'), ('Borscht'),
('Schnitzel'), ('Bratwurst'), ('Fondue'), ('Raclette'), ('Waffles'),
('Frites'), ('Laksa'), ('Satay'), ('Rendang'), ('Nasi Goreng'),
('Feijoada'), ('Churros'), ('Baklava'), ('Samosas'), ('Naan')
ON CONFLICT (name) DO NOTHING;

-- Populate Neighborhoods table (corrected)
INSERT INTO Neighborhoods (zip_code, neighborhood, city, borough) VALUES
('10032', 'Washington Heights', 'New York', 'Manhattan'),
('10033', 'Washington Heights', 'New York', 'Manhattan'),
('10040', 'Washington Heights', 'New York', 'Manhattan'),
('10034', 'Inwood', 'New York', 'Manhattan'),
('10026', 'Harlem', 'New York', 'Manhattan'),
('10027', 'Harlem', 'New York', 'Manhattan'),
('10030', 'Harlem', 'New York', 'Manhattan'),
('10037', 'Harlem', 'New York', 'Manhattan'),
('10039', 'Harlem', 'New York', 'Manhattan'),
('10029', 'East Harlem', 'New York', 'Manhattan'),
('10035', 'East Harlem', 'New York', 'Manhattan'),
('10031', 'Hamilton Heights', 'New York', 'Manhattan'),
('10027', 'Manhattanville', 'New York', 'Manhattan'),
('10025', 'Morningside Heights', 'New York', 'Manhattan'),
('10027', 'Morningside Heights', 'New York', 'Manhattan'),
('10018', 'Hell''s Kitchen', 'New York', 'Manhattan'), -- Corrected quote
('10019', 'Hell''s Kitchen', 'New York', 'Manhattan'), -- Corrected quote
('10036', 'Hell''s Kitchen', 'New York', 'Manhattan'), -- Corrected quote
('10001', 'Chelsea', 'New York', 'Manhattan'),
('10011', 'Chelsea', 'New York', 'Manhattan'),
('10022', 'Midtown East', 'New York', 'Manhattan'),
('10016', 'Murray Hill', 'New York', 'Manhattan'),
('10001', 'Koreatown', 'New York', 'Manhattan'),
('10017', 'Turtle Bay', 'New York', 'Manhattan'),
('10022', 'Turtle Bay', 'New York', 'Manhattan'),
('10022', 'Sutton Place', 'New York', 'Manhattan'),
('10036', 'Theater District', 'New York', 'Manhattan'),
('10018', 'Garment District', 'New York', 'Manhattan'),
('10001', 'Hudson Yards', 'New York', 'Manhattan'),
('10010', 'Flatiron District', 'New York', 'Manhattan'),
('10010', 'Gramercy Park', 'New York', 'Manhattan'),
('10016', 'Kips Bay', 'New York', 'Manhattan'),
('10001', 'NoMad', 'New York', 'Manhattan'),
('10016', 'NoMad', 'New York', 'Manhattan'),
('10010', 'Rose Hill', 'New York', 'Manhattan'),
('10016', 'Rose Hill', 'New York', 'Manhattan'),
('10012', 'Greenwich Village', 'New York', 'Manhattan'),
('10014', 'Greenwich Village', 'New York', 'Manhattan'),
('10014', 'West Village', 'New York', 'Manhattan'),
('10009', 'East Village', 'New York', 'Manhattan'),
('10002', 'Lower East Side', 'New York', 'Manhattan'),
('10012', 'SoHo', 'New York', 'Manhattan'),
('10013', 'SoHo', 'New York', 'Manhattan'),
('10012', 'NoHo', 'New York', 'Manhattan'),
('10007', 'Tribeca', 'New York', 'Manhattan'),
('10013', 'Tribeca', 'New York', 'Manhattan'),
('10004', 'Financial District', 'New York', 'Manhattan'),
('10005', 'Financial District', 'New York', 'Manhattan'),
('10006', 'Financial District', 'New York', 'Manhattan'),
('10007', 'Financial District', 'New York', 'Manhattan'),
('10038', 'Financial District', 'New York', 'Manhattan'),
('10013', 'Chinatown', 'New York', 'Manhattan'),
('10013', 'Little Italy', 'New York', 'Manhattan'),
('10002', 'Two Bridges', 'New York', 'Manhattan'),
('10280', 'Battery Park City', 'New York', 'Manhattan'),
('10007', 'Civic Center', 'New York', 'Manhattan'),
('10002', 'Bowery', 'New York', 'Manhattan'),
('10003', 'Bowery', 'New York', 'Manhattan'),
('10012', 'Bowery', 'New York', 'Manhattan'),
('10012', 'Nolita', 'New York', 'Manhattan'),
('10038', 'Seaport District', 'New York', 'Manhattan'),
('11201', 'Brooklyn Heights', 'New York', 'Brooklyn'),
('11201', 'DUMBO', 'New York', 'Brooklyn'),
('11201', 'Downtown Brooklyn', 'New York', 'Brooklyn'),
('11201', 'Cobble Hill', 'New York', 'Brooklyn'),
('11231', 'Carroll Gardens', 'New York', 'Brooklyn'),
('11217', 'Boerum Hill', 'New York', 'Brooklyn'),
('11231', 'Red Hook', 'New York', 'Brooklyn'),
('11217', 'Gowanus', 'New York', 'Brooklyn'),
('11231', 'Gowanus', 'New York', 'Brooklyn'),
('11215', 'Park Slope', 'New York', 'Brooklyn'),
('11238', 'Prospect Heights', 'New York', 'Brooklyn'),
('11205', 'Fort Greene', 'New York', 'Brooklyn'),
('11205', 'Clinton Hill', 'New York', 'Brooklyn'),
('11201', 'Vinegar Hill', 'New York', 'Brooklyn'),
('11222', 'Greenpoint', 'New York', 'Brooklyn'),
('11206', 'Williamsburg', 'New York', 'Brooklyn'),
('11211', 'Williamsburg', 'New York', 'Brooklyn'),
('11249', 'Williamsburg', 'New York', 'Brooklyn'),
('11206', 'East Williamsburg', 'New York', 'Brooklyn'),
('11211', 'East Williamsburg', 'New York', 'Brooklyn'),
('11205', 'Bedford-Stuyvesant', 'New York', 'Brooklyn'),
('11206', 'Bedford-Stuyvesant', 'New York', 'Brooklyn'),
('11216', 'Bedford-Stuyvesant', 'New York', 'Brooklyn'),
('11221', 'Bedford-Stuyvesant', 'New York', 'Brooklyn'),
('11233', 'Bedford-Stuyvesant', 'New York', 'Brooklyn'),
('11238', 'Bedford-Stuyvesant', 'New York', 'Brooklyn'),
('11213', 'Crown Heights', 'New York', 'Brooklyn'),
('11216', 'Crown Heights', 'New York', 'Brooklyn'),
('11225', 'Crown Heights', 'New York', 'Brooklyn'),
('11233', 'Crown Heights', 'New York', 'Brooklyn'),
('11238', 'Crown Heights', 'New York', 'Brooklyn'),
('11225', 'Prospect Lefferts Gardens', 'New York', 'Brooklyn'),
('11210', 'Flatbush', 'New York', 'Brooklyn'),
('11225', 'Flatbush', 'New York', 'Brooklyn'),
('11226', 'Flatbush', 'New York', 'Brooklyn'),
('11218', 'Ditmas Park', 'New York', 'Brooklyn'),
('11226', 'Ditmas Park', 'New York', 'Brooklyn'),
('11218', 'Kensington', 'New York', 'Brooklyn'),
('11215', 'Windsor Terrace', 'New York', 'Brooklyn'),
('11233', 'Ocean Hill', 'New York', 'Brooklyn'),
('11233', 'Weeksville', 'New York', 'Brooklyn'),
('11212', 'Brownsville', 'New York', 'Brooklyn'),
('11207', 'East New York', 'New York', 'Brooklyn'),
('11208', 'East New York', 'New York', 'Brooklyn'),
('11208', 'Cypress Hills', 'New York', 'Brooklyn'),
('11239', 'Starrett City', 'New York', 'Brooklyn'),
('11220', 'Sunset Park', 'New York', 'Brooklyn'),
('11232', 'Sunset Park', 'New York', 'Brooklyn'),
('11204', 'Borough Park', 'New York', 'Brooklyn'),
('11218', 'Borough Park', 'New York', 'Brooklyn'),
('11219', 'Borough Park', 'New York', 'Brooklyn'),
('11228', 'Dyker Heights', 'New York', 'Brooklyn'),
('11209', 'Bay Ridge', 'New York', 'Brooklyn'),
('11204', 'Bensonhurst', 'New York', 'Brooklyn'),
('11214', 'Bensonhurst', 'New York', 'Brooklyn'),
('11214', 'Bath Beach', 'New York', 'Brooklyn'),
('11223', 'Gravesend', 'New York', 'Brooklyn'),
('11235', 'Sheepshead Bay', 'New York', 'Brooklyn'),
('11235', 'Manhattan Beach', 'New York', 'Brooklyn'),
('11235', 'Brighton Beach', 'New York', 'Brooklyn'),
('11224', 'Coney Island', 'New York', 'Brooklyn'),
('11224', 'Sea Gate', 'New York', 'Brooklyn'),
('11229', 'Gerritsen Beach', 'New York', 'Brooklyn'),
('11234', 'Marine Park', 'New York', 'Brooklyn'),
('11234', 'Mill Basin', 'New York', 'Brooklyn'),
('11234', 'Flatlands', 'New York', 'Brooklyn'),
('11230', 'Midwood', 'New York', 'Brooklyn'),
('11229', 'Homecrest', 'New York', 'Brooklyn'),
('11229', 'Madison', 'New York', 'Brooklyn'),
('11236', 'Canarsie', 'New York', 'Brooklyn'),
('11203', 'East Flatbush', 'New York', 'Brooklyn'),
('11212', 'East Flatbush', 'New York', 'Brooklyn'),
('11236', 'Remsen Village', 'New York', 'Brooklyn'),
('11210', 'Farragut', 'New York', 'Brooklyn'),
('11203', 'Rugby', 'New York', 'Brooklyn'),
('11236', 'Paerdegat Basin', 'New York', 'Brooklyn')
ON CONFLICT (zip_code, city) DO NOTHING;

-- Populate Filters table
INSERT INTO Filters (category, name) VALUES
('Cuisines', 'Italian'), ('Cuisines', 'Mexican'), ('Cuisines', 'Chinese'), ('Cuisines', 'Japanese'), ('Cuisines', 'Indian'),
('Cuisines', 'Thai'), ('Cuisines', 'French'), ('Cuisines', 'Greek'), ('Cuisines', 'Spanish'), ('Cuisines', 'Korean'),
('Cuisines', 'Vietnamese'), ('Cuisines', 'American'), ('Cuisines', 'Mediterranean'), ('Cuisines', 'Lebanese'), ('Cuisines', 'Turkish'),
('Cuisines', 'Brazilian'), ('Cuisines', 'Peruvian'), ('Cuisines', 'Cuban'), ('Cuisines', 'Ethiopian'), ('Cuisines', 'Moroccan'),
('Cuisines', 'Russian'), ('Cuisines', 'German'), ('Cuisines', 'British'), ('Cuisines', 'Irish'), ('Cuisines', 'Caribbean'),
('Cuisines', 'Jamaican'), ('Cuisines', 'Haitian'), ('Cuisines', 'Southern'), ('Cuisines', 'Cajun'), ('Cuisines', 'Creole'),
('Cuisines', 'Middle Eastern'), ('Cuisines', 'Persian'), ('Cuisines', 'Afghan'), ('Cuisines', 'Pakistani'), ('Cuisines', 'Bangladeshi'),
('Cuisines', 'Filipino'), ('Cuisines', 'Malaysian'), ('Cuisines', 'Indonesian'), ('Cuisines', 'Singaporean'), ('Cuisines', 'Australian'),
('Cuisines', 'Argentinian'), ('Cuisines', 'Colombian'), ('Cuisines', 'Venezuelan'), ('Cuisines', 'Chilean'), ('Cuisines', 'Portuguese'),
('Cuisines', 'Belgian'), ('Cuisines', 'Swiss'), ('Cuisines', 'Austrian'), ('Cuisines', 'Scandinavian'), ('Cuisines', 'Polish'),
('Specific Foods', 'Fried Chicken'), ('Specific Foods', 'Steak'), ('Specific Foods', 'Sushi'), ('Specific Foods', 'Pizza'), ('Specific Foods', 'Burger'),
('Specific Foods', 'Tacos'), ('Specific Foods', 'Pasta'), ('Specific Foods', 'Ramen'), ('Specific Foods', 'Dumplings'), ('Specific Foods', 'Pad Thai'),
('Specific Foods', 'Biryani'), ('Specific Foods', 'Falafel'), ('Specific Foods', 'Shawarma'), ('Specific Foods', 'Pho'), ('Specific Foods', 'Curry'),
('Specific Foods', 'Sashimi'), ('Specific Foods', 'Dim Sum'), ('Specific Foods', 'Enchiladas'), ('Specific Foods', 'Tamales'), ('Specific Foods', 'Churros'),
('Specific Foods', 'Gyoza'), ('Specific Foods', 'Spring Rolls'), ('Specific Foods', 'Naan'), ('Specific Foods', 'Samosas'), ('Specific Foods', 'Hummus'),
('Specific Foods', 'Baklava'), ('Specific Foods', 'Paella'), ('Specific Foods', 'Tapas'), ('Specific Foods', 'Empanadas'), ('Specific Foods', 'Ceviche'),
('Specific Foods', 'Jerk Chicken'), ('Specific Foods', 'Gumbo'), ('Specific Foods', 'Jambalaya'), ('Specific Foods', 'Poutine'), ('Specific Foods', 'Fish and Chips'),
('Specific Foods', 'Shepherd’s Pie'), ('Specific Foods', 'Bangers and Mash'), ('Specific Foods', 'Pierogi'), ('Specific Foods', 'Borscht'), ('Specific Foods', 'Schnitzel'),
('Specific Foods', 'Bratwurst'), ('Specific Foods', 'Fondue'), ('Specific Foods', 'Raclette'), ('Specific Foods', 'Waffles'), ('Specific Foods', 'Frites'),
('Specific Foods', 'Laksa'), ('Specific Foods', 'Satay'), ('Specific Foods', 'Rendang'), ('Specific Foods', 'Nasi Goreng'), ('Specific Foods', 'Feijoada'),
('Courses', 'Appetizers'), ('Courses', 'Desserts'), ('Courses', 'Main Course'), ('Courses', 'Salads'), ('Courses', 'Soups'),
('Courses', 'Sides'), ('Courses', 'Brunch'), ('Courses', 'Breakfast'), ('Courses', 'Lunch'), ('Courses', 'Dinner'),
('Courses', 'Snacks'), ('Courses', 'Beverages'), ('Courses', 'Cocktails'), ('Courses', 'Starters'), ('Courses', 'Entrees'),
('Courses', 'Pastries'), ('Courses', 'Cakes'), ('Courses', 'Pies'), ('Courses', 'Ice Cream'), ('Courses', 'Sorbets'),
('Courses', 'Charcuterie'), ('Courses', 'Cheese Plates'), ('Courses', 'Tapas'), ('Courses', 'Mezze'), ('Courses', 'Antipasti'),
('Courses', 'Amuse-Bouche'), ('Courses', 'Bread'), ('Courses', 'Dips'), ('Courses', 'Spreads'), ('Courses', 'Canapés'),
('Courses', 'Finger Foods'), ('Courses', 'Small Plates'), ('Courses', 'Tasting Menu'), ('Courses', 'Prix Fixe'), ('Courses', 'Buffet'),
('Courses', 'Barbecue'), ('Courses', 'Grilled'), ('Courses', 'Roasted'), ('Courses', 'Steamed'), ('Courses', 'Fried'),
('Courses', 'Raw Bar'), ('Courses', 'Oysters'), ('Courses', 'Sushi Rolls'), ('Courses', 'Nigiri'), ('Courses', 'Sashimi'),
('Courses', 'Cold Cuts'), ('Courses', 'Fruit Platters'), ('Courses', 'Vegetable Platters'), ('Courses', 'Charred'), ('Courses', 'Pickled')
ON CONFLICT (category, name) DO NOTHING;

-- *** ADD SAMPLE DATA FOR Restaurants, Dishes, Lists ***

-- Sample Restaurants
INSERT INTO Restaurants (id, name, neighborhood, city, tags, adds) VALUES
(1, 'Joe''s Pizza', 'Greenwich Village', 'New York', ARRAY['pizza', 'italian', 'classic', 'slice'], 150),
(2, 'Shake Shack', 'Midtown', 'New York', ARRAY['burger', 'american', 'fast-food', 'fries', 'shakes'], 210),
(3, 'Katz''s Delicatessen', 'Lower East Side', 'New York', ARRAY['deli', 'sandwiches', 'pastrami', 'classic'], 180),
(4, 'Los Tacos No. 1', 'Chelsea', 'New York', ARRAY['tacos', 'mexican', 'casual', 'quick'], 250),
(5, 'Via Carota', 'West Village', 'New York', ARRAY['italian', 'pasta', 'cozy', 'romantic'], 195),
(6, 'Ippudo NY', 'East Village', 'New York', ARRAY['ramen', 'japanese', 'noodles', 'pork buns'], 220),
(7, 'Mamoun''s Falafel', 'Greenwich Village', 'New York', ARRAY['falafel', 'middle eastern', 'cheap eats', 'vegetarian'], 160)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
neighborhood = EXCLUDED.neighborhood,
city = EXCLUDED.city,
tags = EXCLUDED.tags,
adds = EXCLUDED.adds;

-- Reset sequence for Restaurants if needed after specifying IDs
SELECT setval(pg_get_serial_sequence('restaurants', 'id'), COALESCE((SELECT MAX(id)+1 FROM Restaurants), 1), false);


-- Sample Dishes (Ensure restaurant_id matches above)
-- Need to handle potential duplicate dish names if UNIQUE constraint exists
INSERT INTO Dishes (name, restaurant_id, tags, adds) VALUES
('Margherita Pizza', 1, ARRAY['pizza', 'vegetarian', 'classic'], 100),
('Pepperoni Pizza', 1, ARRAY['pizza', 'meat', 'classic'], 95),
('ShackBurger', 2, ARRAY['burger', 'beef', 'cheeseburger'], 150),
('Crinkle Cut Fries', 2, ARRAY['fries', 'side', 'fast-food'], 120),
('Pastrami on Rye', 3, ARRAY['sandwich', 'pastrami', 'deli', 'classic'], 140),
('Adobada Taco', 4, ARRAY['taco', 'pork', 'mexican', 'spicy'], 180),
('Nopal Taco', 4, ARRAY['taco', 'cactus', 'mexican', 'vegetarian'], 110),
('Cacio e Pepe', 5, ARRAY['pasta', 'italian', 'vegetarian', 'classic', 'cheese'], 165),
('Akamaru Modern Ramen', 6, ARRAY['ramen', 'pork', 'japanese', 'noodles'], 170),
('Falafel Sandwich', 7, ARRAY['sandwich', 'falafel', 'vegetarian', 'middle eastern', 'cheap eats'], 130)
ON CONFLICT (name) DO NOTHING; -- Or specify UPDATE if needed, but might cause issues if dish exists at different restaurant

-- Sample Lists
-- Creating sample list items (JSONB array)
-- Note: Adjust IDs/names if Dish/Restaurant IDs/Names change
-- Creating sample list items (JSONB array)
INSERT INTO Lists (id, name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following) VALUES
(1, 'NYC Pizza Tour', '[{"id": 1, "name": "Joe''s Pizza", "type": "restaurant"}, {"id": 1, "name": "Margherita Pizza", "restaurant": "Joe''s Pizza", "type": "dish"}]', 2, 245, 'New York', ARRAY['pizza', 'italian', 'nyc'], true, false, '@pizzalover', false),
(2, 'Iconic NYC Eats', '[{"id": 3, "name": "Katz''s Delicatessen", "type": "restaurant"}, {"id": 3, "name": "Pastrami on Rye", "restaurant": "Katz''s Delicatessen", "type": "dish"}, {"id": 7, "name": "Mamoun''s Falafel", "type": "restaurant"}]', 3, 187, 'New York', ARRAY['classic', 'deli', 'sandwiches', 'cheap eats'], true, true, '@nycfoodie', false) -- Example user-created list
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