-- scripts/populate_restaurants_and_dishes.sql
-- This script first cleans up the restaurants and dishes tables and then populates them with a curated list of 50 diverse NYC restaurants and their dishes.

-- To execute this script, run the following command from the project root:
-- psql -U your_username -d your_database -a -f scripts/populate_restaurants_and_dishes.sql

-- Step 1: Clean up existing data
-- Use TRUNCATE for efficiency and to reset SERIAL sequences
TRUNCATE TABLE dishes, restaurants RESTART IDENTITY CASCADE;

-- Step 2: Add 50 diverse NYC restaurants
-- This list includes a variety of cuisines and neighborhoods across different boroughs.
INSERT INTO restaurants (id, name, description, address, cuisine, neighborhood_id, city_id) VALUES
-- Manhattan
(1, 'Katz''s Delicatessen', 'Iconic Jewish deli serving towering pastrami sandwiches since 1888.', '205 E Houston St, New York, NY 10002', 'Deli', (SELECT id FROM neighborhoods WHERE name = 'Lower East Side'), 10),
(2, 'Joe''s Pizza', 'A Greenwich Village institution for classic, no-frills New York-style pizza.', '7 Carmine St, New York, NY 10014', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Greenwich Village'), 10),
(3, 'Gramercy Tavern', 'Upscale American cuisine in a rustic-chic setting, with a seasonal menu.', '42 E 20th St, New York, NY 10003', 'American', (SELECT id FROM neighborhoods WHERE name = 'Gramercy'), 10),
(4, 'Xi''an Famous Foods', 'Counter-serve spot for spicy, authentic Chinese street food from the Xi''an region.', '81 St Marks Pl, New York, NY 10003', 'Chinese', (SELECT id FROM neighborhoods WHERE name = 'East Village'), 10),
(5, 'Los Tacos No. 1', 'Bustling Chelsea Market stand for authentic Mexican tacos and quesadillas.', '75 9th Ave, New York, NY 10011', 'Mexican', (SELECT id FROM neighborhoods WHERE name = 'Chelsea'), 10),
(6, 'Balthazar', 'Grand, bustling French brasserie in SoHo, known for its seafood platters and classic dishes.', '80 Spring St, New York, NY 10012', 'French', (SELECT id FROM neighborhoods WHERE name = 'SoHo'), 10),
(7, 'Ippudo NY', 'Popular Japanese ramen spot with rich, flavorful broth and a lively atmosphere.', '65 4th Ave, New York, NY 10003', 'Ramen', (SELECT id FROM neighborhoods WHERE name = 'East Village'), 10),
(8, 'Shake Shack', 'Modern roadside burger stand serving classic American fare.', 'Madison Square Park, New York, NY 10010', 'Burgers', (SELECT id FROM neighborhoods WHERE name = 'Flatiron District'), 10),
(9, 'Peter Luger Steak House', 'Legendary, no-frills steakhouse in Williamsburg, known for its dry-aged porterhouse.', '178 Broadway, Brooklyn, NY 11211', 'Steakhouse', (SELECT id FROM neighborhoods WHERE name = 'Williamsburg'), 10),
(10, 'Mamoun''s Falafel', 'Venerable Middle Eastern spot for falafel, shawarma, and other cheap eats.', '119 MacDougal St, New York, NY 10012', 'Middle Eastern', (SELECT id FROM neighborhoods WHERE name = 'Greenwich Village'), 10),
(11, 'Red Rooster Harlem', 'Comfort food celebrating the roots of American cuisine, with live music.', '310 Lenox Ave, New York, NY 10027', 'Southern', (SELECT id FROM neighborhoods WHERE name = 'Harlem'), 10),
(12, 'Sylvia''s Restaurant', 'A Harlem landmark for classic soul food dishes in a warm, welcoming space.', '328 Malcolm X Blvd, New York, NY 10027', 'Soul Food', (SELECT id FROM neighborhoods WHERE name = 'Harlem'), 10),
(13, 'Keens Steakhouse', 'Historic steakhouse with classic decor and an impressive collection of churchwarden pipes.', '72 W 36th St, New York, NY 10018', 'Steakhouse', (SELECT id FROM neighborhoods WHERE name = 'Midtown'), 10),
(14, 'Levain Bakery', 'Famous for its massive, gooey cookies, this tiny bakery has a cult following.', '167 W 74th St, New York, NY 10023', 'Bakery', (SELECT id FROM neighborhoods WHERE name = 'Upper West Side'), 10),
(15, 'Drunken Dumpling', 'Tiny East Village spot for massive soup dumplings (xiao long bao).', '137 1st Avenue, New York, NY 10003', 'Chinese', (SELECT id FROM neighborhoods WHERE name = 'East Village'), 10),
(16, 'The Halal Guys', 'Famous street cart serving gyros and chicken over rice with their iconic white sauce.', 'W 53rd St & 6th Ave, New York, NY 10019', 'Halal', (SELECT id FROM neighborhoods WHERE name = 'Midtown'), 10),
(17, 'Nobu Downtown', 'High-end, scene-y Japanese-Peruvian restaurant from celebrity chef Nobu Matsuhisa.', '195 Broadway, New York, NY 10007', 'Japanese', (SELECT id FROM neighborhoods WHERE name = 'Financial District'), 10),
(18, 'Panna II Garden', 'Known for its over-the-top, year-round Christmas light decorations and solid Indian food.', '93 1st Ave, New York, NY 10003', 'Indian', (SELECT id FROM neighborhoods WHERE name = 'East Village'), 10),
(19, 'John''s of Bleecker Street', 'Old-school pizzeria serving coal-fired, thin-crust pies in a classic setting.', '278 Bleecker St, New York, NY 10014', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Greenwich Village'), 10),
(20, 'Don Angie', 'Modern, upscale Italian-American restaurant with creative, acclaimed dishes.', '103 Greenwich Ave, New York, NY 10014', 'Italian', (SELECT id FROM neighborhoods WHERE name = 'West Village'), 10),
(21, 'Gray''s Papaya', 'Iconic NYC spot for cheap, tasty hot dogs and tropical fruit drinks.', '2090 Broadway, New York, NY 10023', 'Hot Dogs', (SELECT id FROM neighborhoods WHERE name = 'Upper West Side'), 10),
(22, 'Russ & Daughters Cafe', 'A sit-down cafe version of the iconic appetizing shop, serving classic Jewish fare.', '127 Orchard St, New York, NY 10002', 'Jewish', (SELECT id FROM neighborhoods WHERE name = 'Lower East Side'), 10),
(23, 'Emily', 'Popular spot for Detroit-style pizza with unique toppings and a famous burger.', '919 Fulton St, Brooklyn, NY 11238', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Clinton Hill'), 10),
(24, 'Carbone', 'An homage to the Italian-American restaurants of the mid-20th century.', '181 Thompson St, New York, NY 10012', 'Italian', (SELECT id FROM neighborhoods WHERE name = 'Greenwich Village'), 10),
(25, 'The Spotted Pig', 'Cozy gastropub with a British & Italian-influenced menu and a cult-favorite burger.', '314 W 11th St, New York, NY 10014', 'Gastropub', (SELECT id FROM neighborhoods WHERE name = 'West Village'), 10),

-- Brooklyn
(26, 'Di Fara Pizza', 'Legendary Midwood pizzeria where Dom DeMarco has been making pies since 1965.', '1424 Avenue J, Brooklyn, NY 11230', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Midwood'), 10),
(27, 'L&B Spumoni Gardens', 'A Bensonhurst institution famous for its Sicilian square pizza and spumoni.', '2725 86th St, Brooklyn, NY 11223', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Bensonhurst'), 10),
(28, 'Juliana''s Pizza', 'Classic coal-fired pizzeria under the Brooklyn Bridge, from pizza legend Patsy Grimaldi.', '19 Old Fulton St, Brooklyn, NY 11201', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'DUMBO'), 10),
(29, 'Roberta''s', 'Hip, trend-setting pizzeria in a warehouse-like space in Bushwick.', '261 Moore St, Brooklyn, NY 11206', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Bushwick'), 10),
(30, 'Frankies 457 Spuntino', 'Charming Carroll Gardens spot for rustic, high-quality Italian food.', '457 Court St, Brooklyn, NY 11231', 'Italian', (SELECT id FROM neighborhoods WHERE name = 'Carroll Gardens'), 10),
(31, 'The River Café', 'Romantic, waterfront restaurant with stunning views of the Manhattan skyline.', '1 Water St, Brooklyn, NY 11201', 'American', (SELECT id FROM neighborhoods WHERE name = 'DUMBO'), 10),
(32, 'Tanoreen', 'Acclaimed Bay Ridge restaurant serving Middle Eastern cuisine with a modern twist.', '7523 3rd Ave, Brooklyn, NY 11209', 'Middle Eastern', (SELECT id FROM neighborhoods WHERE name = 'Bay Ridge'), 10),
(33, 'Paulie Gee''s', 'Greenpoint pizzeria known for its creative wood-fired pies and lively atmosphere.', '60 Greenpoint Ave, Brooklyn, NY 11222', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Greenpoint'), 10),

-- Queens
(34, 'SriPraPhai', 'Authentic, spicy Thai food in a large, bustling Woodside restaurant.', '64-13 39th Ave, Woodside, NY 11377', 'Thai', (SELECT id FROM neighborhoods WHERE name = 'Woodside'), 10),
(35, 'Jackson Diner', 'Long-standing spot in Jackson Heights for classic, home-style Indian cuisine.', '37-47 74th St, Jackson Heights, NY 11372', 'Indian', (SELECT id FROM neighborhoods WHERE name = 'Jackson Heights'), 10),
(36, 'John Brown Smokehouse', 'Kansas City-style barbecue, including lauded burnt ends, in a casual setting.', '10-43 44th Dr, Long Island City, NY 11101', 'BBQ', (SELECT id FROM neighborhoods WHERE name = 'Long Island City'), 10),
(37, 'Casa Enrique', 'Michelin-starred Mexican food from Chiapas in a stylish Long Island City space.', '5-48 49th Ave, Long Island City, NY 11101', 'Mexican', (SELECT id FROM neighborhoods WHERE name = 'Long Island City'), 10),
(38, 'Arepa Lady', 'Beloved street-cart-turned-restaurant serving Colombian arepas in Jackson Heights.', '77-02 Roosevelt Ave, Jackson Heights, NY 11372', 'Colombian', (SELECT id FROM neighborhoods WHERE name = 'Jackson Heights'), 10),
(39, 'Nan Xiang Xiao Long Bao', 'Flushing institution famous for its soup dumplings and other Shanghainese dishes.', '39-16 Prince St #104, Queens, NY 11354', 'Chinese', (SELECT id FROM neighborhoods WHERE name = 'Flushing'), 10),
(40, 'Bohemian Hall & Beer Garden', 'Historic beer garden in Astoria with Czech & Slovak food and a large outdoor space.', '29-19 24th Ave, Astoria, NY 11102', 'Czech', (SELECT id FROM neighborhoods WHERE name = 'Astoria'), 10),

-- Bronx
(41, 'Arthur Avenue Retail Market', 'An indoor market with various vendors, including the Bronx Beer Hall and Mike''s Deli.', '2344 Arthur Ave, Bronx, NY 10458', 'Italian', (SELECT id FROM neighborhoods WHERE name = 'Belmont'), 10),
(42, 'Travesias Latin Fusion', 'Creative Latin fusion cuisine in a vibrant, colorful setting.', '3834 E Tremont Ave, Bronx, NY 10465', 'Latin Fusion', (SELECT id FROM neighborhoods WHERE name = 'Throgs Neck'), 10),
(43, 'Louie & Ernie''s Pizza', 'A beloved neighborhood spot for thin-crust pizza in a no-frills setting.', '1300 Crosby Ave, Bronx, NY 10461', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Schuylerville'), 10),
(44, 'The Bronx Brewery', 'Craft brewery with a lively taproom and backyard, often featuring food pop-ups.', '856 E 136th St, Bronx, NY 10454', 'Brewery', (SELECT id FROM neighborhoods WHERE name = 'Port Morris'), 10),
(45, 'City Island Lobster House', 'Waterfront restaurant on City Island known for its seafood, especially lobster.', '691 Bridge St, Bronx, NY 10464', 'Seafood', (SELECT id FROM neighborhoods WHERE name = 'City Island'), 10),

-- Staten Island
(46, 'Denino''s Pizzeria & Tavern', 'A Staten Island classic, serving thin-crust pizza and Italian-American fare since 1937.', '524 Port Richmond Ave, Staten Island, NY 10302', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Port Richmond'), 10),
(47, 'Lee''s Tavern', 'A local, cash-only pub known for its exceptional bar-style pizza.', '60 Hancock St, Staten Island, NY 10305', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Dongan Hills'), 10),
(48, 'Enoteca Maria', 'A unique restaurant where a rotating team of "nonnas" from around the world cook their home recipes.', '27 Hyatt St, Staten Island, NY 10301', 'International', (SELECT id FROM neighborhoods WHERE name = 'St. George'), 10),
(49, 'Ralph''s Famous Italian Ices', 'The original location of the iconic Italian ice chain, a Staten Island institution.', '501 Port Richmond Ave, Staten Island, NY 10302', 'Dessert', (SELECT id FROM neighborhoods WHERE name = 'Port Richmond'), 10),
(50, 'Joe & Pat''s', 'Another legendary Staten Island pizzeria, famous for its ultra-thin, crispy crust.', '1758 Victory Blvd, Staten Island, NY 10314', 'Pizza', (SELECT id FROM neighborhoods WHERE name = 'Castleton Corners'), 10);

-- Step 3: Add dishes for each restaurant
-- Add a variety of dishes, ensuring they are linked to the correct restaurant.
INSERT INTO dishes (restaurant_id, name, description, category) VALUES
-- Katz's Delicatessen
(1, 'Pastrami on Rye', 'The quintessential Katz''s sandwich, piled high with hand-carved pastrami.', 'Sandwiches'),
(1, 'Matzo Ball Soup', 'A classic Jewish comfort food, with a light, fluffy matzo ball in a rich chicken broth.', 'Soups'),
-- Joe's Pizza
(2, 'Cheese Slice', 'A perfect, classic New York slice with a thin, crisp crust.', 'Pizza'),
(2, 'Fresh Mozzarella Slice', 'A slice topped with fresh, milky mozzarella.', 'Pizza'),
-- Gramercy Tavern
(3, 'Tavern Burger', 'An upscale burger with smoked bacon and cheddar, served with fries.', 'Main Courses'),
(3, 'Duck Liver Mousse', 'Creamy duck liver mousse served with pickles and grilled bread.', 'Appetizers'),
-- Xi'an Famous Foods
(4, 'Spicy Cumin Lamb Noodles', 'Hand-pulled noodles with spicy cumin lamb, a signature dish.', 'Noodles'),
(4, 'Liang Pi Cold Skin Noodles', 'Chilled, chewy noodles in a tangy, spicy sauce.', 'Noodles'),
-- Los Tacos No. 1
(5, 'Adobada Taco', 'Spit-roasted marinated pork taco, a fan favorite.', 'Tacos'),
(5, 'Nopal Taco', 'Grilled cactus taco, a delicious vegetarian option.', 'Tacos'),
-- Balthazar
(6, 'Steak Frites', 'Classic French steak and fries, perfectly executed.', 'Main Courses'),
(6, 'Le Grand Seafood Platter', 'An impressive tower of fresh oysters, clams, shrimp, and more.', 'Seafood'),
-- Ippudo NY
(7, 'Akamaru Modern Ramen', 'The original tonkotsu broth with a modern twist, enhanced with special blended miso paste and fragrant garlic oil.', 'Ramen'),
(7, 'Pork Buns', 'Steamed buns filled with tender braised pork belly.', 'Appetizers'),
-- Shake Shack
(8, 'ShackBurger', 'A classic cheeseburger with lettuce, tomato, and ShackSauce.', 'Burgers'),
(8, 'Crinkle Cut Fries', 'Crispy, crinkle-cut fries, perfect for dipping.', 'Sides'),
-- Peter Luger Steak House
(9, 'Porterhouse for Two', 'The legendary dry-aged porterhouse steak, served sizzling.', 'Steak'),
(9, 'Thick Cut Bacon', 'Extra-thick slices of bacon, a must-try appetizer.', 'Appetizers'),
-- Mamoun's Falafel
(10, 'Falafel Sandwich', 'A pita stuffed with crispy falafel, tahini, and salad.', 'Sandwiches'),
(10, 'Shawarma Sandwich', 'Thinly sliced lamb in a pita.', 'Sandwiches'),
-- Red Rooster Harlem
(11, 'Yardbird', 'Fried chicken served with waffles, a Southern classic.', 'Main Courses'),
(11, 'Shrimp & Grits', 'Creamy grits topped with succulent shrimp.', 'Main Courses'),
-- Sylvia's Restaurant
(12, 'Fried Chicken & Waffles', 'The definitive soul food combination.', 'Main Courses'),
(12, 'Bar-B-Que Ribs', 'Tender, slow-cooked ribs with Sylvia''s special sauce.', 'Main Courses'),
-- Keens Steakhouse
(13, 'Mutton Chop', 'The legendary, massive mutton chop.', 'Main Courses'),
(13, 'Prime Porterhouse for Two', 'A classic, perfectly cooked porterhouse steak.', 'Steak'),
-- Levain Bakery
(14, 'Chocolate Chip Walnut Cookie', 'The famous, giant, and gooey cookie.', 'Desserts'),
(14, 'Dark Chocolate Peanut Butter Chip Cookie', 'A rich, decadent cookie for chocolate lovers.', 'Desserts'),
-- Drunken Dumpling
(15, 'XL Soup Dumpling', 'A massive soup dumpling served with a straw.', 'Dumplings'),
(15, 'Pan Fried Pork Buns', 'Crispy-bottomed pork buns.', 'Dumplings'),
-- The Halal Guys
(16, 'Chicken & Gyro Combo Platter', 'A platter of chicken and gyro meat over rice with their famous white and red sauces.', 'Platters'),
(16, 'Falafel Platter', 'A vegetarian platter with falafel over rice.', 'Platters'),
-- Nobu Downtown
(17, 'Black Cod with Miso', 'The signature dish, a perfectly flaky and flavorful black cod.', 'Main Courses'),
(17, 'Yellowtail Jalapeño', 'Thinly sliced yellowtail with jalapeño and a yuzu soy sauce.', 'Appetizers'),
-- Panna II Garden
(18, 'Chicken Tikka Masala', 'A classic, creamy chicken tikka masala.', 'Main Courses'),
(18, 'Saag Paneer', 'Spinach and cheese curry.', 'Main Courses'),
-- John's of Bleecker Street
(19, 'Large Cheese Pizza', 'A classic, coal-fired thin-crust pizza.', 'Pizza'),
(19, 'The "Boom-Pie"', 'A specialty pie with sausage, peppers, onions, and mushrooms.', 'Pizza'),
-- Don Angie
(20, 'Lasagna for Two', 'A unique, pinwheeled lasagna that has become an Instagram star.', 'Main Courses'),
(20, 'Chrysanthemum Salad', 'A refreshing and unique salad.', 'Appetizers'),
-- Gray's Papaya
(21, 'Recession Special', 'Two hot dogs and a tropical drink.', 'Hot Dogs'),
(21, 'Papaya Drink', 'The famous, refreshing papaya drink.', 'Drinks'),
-- Russ & Daughters Cafe
(22, 'The Classic Board', 'Smoked salmon, cream cheese, tomato, onion, and capers served with a bagel or bialy.', 'Boards'),
(22, 'Potato Latkes', 'Crispy potato pancakes served with sour cream or applesauce.', 'Appetizers'),
-- Emily
(23, 'The Emmy Burger', 'A dry-aged beef burger with Emmy sauce, caramelized onion, and cheddar on a pretzel bun.', 'Burgers'),
(23, 'The Colony Pizza', 'A Detroit-style pizza with pepperoni, pickled jalapeños, and honey.', 'Pizza'),
-- Carbone
(24, 'Spicy Rigatoni Vodka', 'A now-iconic, perfectly executed spicy rigatoni.', 'Pasta'),
(24, 'Veal Parmesan', 'A massive, bone-in veal parmesan.', 'Main Courses'),
-- The Spotted Pig
(25, 'Chargrilled Burger with Roquefort Cheese', 'The famous burger served with shoestring fries.', 'Burgers'),
(25, 'Sheep''s Ricotta Gnudi', 'Light, fluffy gnudi with brown butter and sage.', 'Pasta'),
-- Di Fara Pizza
(26, 'Regular Pie', 'A classic, legendary pizza made by Dom DeMarco himself.', 'Pizza'),
(26, 'Square Pie', 'A Sicilian-style square pizza.', 'Pizza'),
-- L&B Spumoni Gardens
(27, 'L&B Sicilian Pie', 'The famous square pie with a thick, focaccia-like crust, sauce on top of the cheese.', 'Pizza'),
(27, 'Spumoni', 'A layered ice cream dessert of cherry, pistachio, and chocolate.', 'Desserts'),
-- Juliana's Pizza
(28, 'Margherita Pizza', 'A classic Neapolitan-style pizza with tomato, mozzarella, and basil.', 'Pizza'),
(28, 'No. 1 Special', 'A white pizza with mozzarella, scamorza, pancetta, scallions, and white truffles.', 'Pizza'),
-- Roberta's
(29, 'Bee Sting Pizza', 'A creative pizza with soppressata, chili, and honey.', 'Pizza'),
(29, 'Millennium Falco Pizza', 'A white pizza with sausage, basil, and red onion.', 'Pizza'),
-- Frankies 457 Spuntino
(30, 'Cavatelli with Faicco''s Hot Sausage & Browned Sage Butter', 'A beloved, rustic pasta dish.', 'Pasta'),
(30, 'Meatballs', 'Classic, tender meatballs in a simple tomato sauce.', 'Appetizers'),
-- The River Café
(31, 'Chocolate Brooklyn Bridge', 'A signature dessert, a chocolate replica of the Brooklyn Bridge.', 'Desserts'),
(31, 'Wagyu Steak', 'A high-end Wagyu steak with stunning views.', 'Main Courses'),
-- Tanoreen
(32, 'Kibbeh Nayeh', 'A Middle Eastern-style steak tartare.', 'Appetizers'),
(32, 'Fattoush', 'A refreshing salad with toasted pita bread.', 'Salads'),
-- Paulie Gee's
(33, 'Hellboy Pizza', 'A spicy pizza with soppressata, mozzarella, and Mike''s Hot Honey.', 'Pizza'),
(33, 'Greenpointer Pizza', 'A white pizza with arugula, prosciutto, and lemon.', 'Pizza'),
-- SriPraPhai
(34, 'Green Curry', 'A spicy, authentic green curry with bamboo shoots and basil.', 'Curries'),
(34, 'Drunken Noodles', 'Spicy, wide rice noodles with chili and basil.', 'Noodles'),
-- Jackson Diner
(35, 'Butter Chicken', 'A creamy, flavorful butter chicken curry.', 'Main Courses'),
(35, 'Garlic Naan', 'A classic Indian flatbread with garlic.', 'Breads'),
-- John Brown Smokehouse
(36, 'Burnt Ends', 'Smoky, flavorful burnt ends, a Kansas City specialty.', 'BBQ'),
(36, 'Pulled Pork Sandwich', 'A classic pulled pork sandwich.', 'Sandwiches'),
-- Casa Enrique
(37, 'Cochinita Pibil Tacos', 'Slow-roasted pork tacos from the Yucatan.', 'Tacos'),
(37, 'Mole de Piaxtla', 'A complex, flavorful chicken mole.', 'Main Courses'),
-- Arepa Lady
(38, 'Arepa de Choclo', 'A sweet corn arepa with cheese.', 'Arepas'),
(38, 'Arepa con Queso', 'A classic cheese-stuffed arepa.', 'Arepas'),
-- Nan Xiang Xiao Long Bao
(39, 'Crab & Pork Soup Dumplings', 'The famous soup dumplings, filled with crab and pork.', 'Dumplings'),
(39, 'Scallion Pancakes', 'Crispy, flaky scallion pancakes.', 'Appetizers'),
-- Bohemian Hall & Beer Garden
(40, 'Pierogies', 'Classic potato and cheese pierogies.', 'Appetizers'),
(40, 'Bratwurst', 'A grilled bratwurst with sauerkraut.', 'Main Courses'),
-- Arthur Avenue Retail Market
(41, 'The "Godfather" Sandwich (Mike''s Deli)', 'A massive Italian combo sandwich.', 'Sandwiches'),
(41, 'Craft Beer (Bronx Beer Hall)', 'A rotating selection of local craft beers.', 'Drinks'),
-- Travesias Latin Fusion
(42, 'Churrasco', 'A grilled skirt steak with chimichurri sauce.', 'Main Courses'),
(42, 'Mofongo', 'A Puerto Rican dish of mashed plantains with garlic.', 'Main Courses'),
-- Louie & Ernie's Pizza
(43, 'Sausage Pizza', 'A classic thin-crust pizza with sausage.', 'Pizza'),
(43, 'White Pizza', 'A pizza with mozzarella and ricotta, no tomato sauce.', 'Pizza'),
-- The Bronx Brewery
(44, 'World Gone Hazy IPA', 'A hazy, juicy IPA from the brewery.', 'Drinks'),
(44, 'Taco Pop-up', 'A rotating selection of tacos from a local pop-up vendor.', 'Food Pop-up'),
-- City Island Lobster House
(45, 'Steamed Lobster', 'A whole steamed lobster with drawn butter.', 'Seafood'),
(45, 'Fried Calamari', 'Crispy fried calamari.', 'Appetizers'),
-- Denino's Pizzeria & Tavern
(46, 'M.O.R.E. Pizza', 'A specialty pie with meatballs, onions, ricotta, and extra cheese.', 'Pizza'),
(46, 'Garbage Pie', 'A pie with sausage, meatballs, pepperoni, onions, and mushrooms.', 'Pizza'),
-- Lee's Tavern
(47, 'Clam Pie', 'A unique white pizza with clams and garlic.', 'Pizza'),
(47, 'Fried Calamari', 'A classic appetizer to go with your pizza.', 'Appetizers'),
-- Enoteca Maria
(48, 'Nonna''s Daily Special', 'A rotating dish from one of the guest "nonnas".', 'Main Courses'),
(48, 'Handmade Pasta', 'Fresh, handmade pasta with a traditional sauce.', 'Pasta'),
-- Ralph's Famous Italian Ices
(49, 'Lemon Ice', 'A classic, refreshing lemon Italian ice.', 'Desserts'),
(49, 'Creme Ice', 'A creamier, richer style of Italian ice.', 'Desserts'),
-- Joe & Pat's
(50, 'Vodka Pizza', 'A thin-crust pizza with vodka sauce.', 'Pizza'),
(50, 'Tri-Pie', 'A pizza with tomato, pesto, and vodka sauces.', 'Pizza');

-- Notify user of completion
-- The \echo command is a psql meta-command, so it will be printed to the console when the script is run.
\echo 'Successfully truncated restaurants and dishes tables.'
\echo 'Populated the database with 50 new restaurants and their corresponding dishes.' 