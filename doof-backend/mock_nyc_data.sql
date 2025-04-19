-- Insert city
INSERT INTO cities (id, name)
VALUES (1, 'New York')
ON CONFLICT DO NOTHING;

-- Insert neighborhoods
INSERT INTO neighborhoods (id, name, city_id)
VALUES
  (1, 'SoHo', 1),
  (2, 'Williamsburg', 1),
  (3, 'Astoria', 1),
  (4, 'NoHo', 1),
  (5, 'Harlem', 1),
  (6, 'Flatiron', 1),
  (7, 'East Village', 1),
  (8, 'West Village', 1),
  (9, 'Lower East Side', 1),
  (10, 'Crown Heights', 1),
  (11, 'Bushwick', 1),
  (12, 'Tribeca', 1),
  (13, 'Koreatown', 1),
  (14, 'Morningside Heights', 1),
  (15, 'Chinatown', 1),
  (16, 'Jackson Heights', 1),
  (17, 'Long Island City', 1),
  (18, 'Financial District', 1),
  (19, 'Upper West Side', 1),
  (20, 'DUMBO', 1)
ON CONFLICT DO NOTHING;

-- Insert 20 restaurants with full normalization
INSERT INTO restaurants (
  name, address, city_id, city_name, neighborhood_id, neighborhood_name,
  google_place_id, latitude, longitude, created_at, updated_at
)
VALUES
  ('Prince Street Smash', '27 Prince St', 1, 'New York', 1, 'SoHo', 'gplace_1001', 40.7230, -73.9940, NOW(), NOW()),
  ('Bk Brisket Club', '88 Grand St', 1, 'New York', 2, 'Williamsburg', 'gplace_1002', 40.7138, -73.9632, NOW(), NOW()),
  ('Astoria Dumpling House', '30-12 Broadway', 1, 'New York', 3, 'Astoria', 'gplace_1003', 40.7644, -73.9235, NOW(), NOW()),
  ('NoHo Noods', '59 Bond St', 1, 'New York', 4, 'NoHo', 'gplace_1004', 40.7275, -73.9926, NOW(), NOW()),
  ('Uptown Tap & Grill', '310 Lenox Ave', 1, 'New York', 5, 'Harlem', 'gplace_1005', 40.8090, -73.9442, NOW(), NOW()),
  ('Flatiron Fire Pizza', '15 E 23rd St', 1, 'New York', 6, 'Flatiron', 'gplace_1006', 40.7409, -73.9862, NOW(), NOW()),
  ('Ramen Republic', '213 E 10th St', 1, 'New York', 7, 'East Village', 'gplace_1007', 40.7289, -73.9830, NOW(), NOW()),
  ('Greenwich Graze', '117 Perry St', 1, 'New York', 8, 'West Village', 'gplace_1008', 40.7356, -74.0064, NOW(), NOW()),
  ('LES Torta Truck', '145 Rivington St', 1, 'New York', 9, 'Lower East Side', 'gplace_1009', 40.7200, -73.9854, NOW(), NOW()),
  ('Crown Heights Curry', '1216 Nostrand Ave', 1, 'New York', 10, 'Crown Heights', 'gplace_1010', 40.6614, -73.9505, NOW(), NOW()),
  ('Smash & Cheese', '12 Wyckoff Ave', 1, 'New York', 11, 'Bushwick', 'gplace_1011', 40.7034, -73.9235, NOW(), NOW()),
  ('Tribeca Thai Club', '67 Hudson St', 1, 'New York', 12, 'Tribeca', 'gplace_1012', 40.7163, -74.0086, NOW(), NOW()),
  ('K-Town Fried Seoul', '34 W 32nd St', 1, 'New York', 13, 'Koreatown', 'gplace_1013', 40.7486, -73.9884, NOW(), NOW()),
  ('Morningside Melt', '2954 Broadway', 1, 'New York', 14, 'Morningside Heights', 'gplace_1014', 40.8065, -73.9632, NOW(), NOW()),
  ('Chinatown BBQ Express', '56 Mott St', 1, 'New York', 15, 'Chinatown', 'gplace_1015', 40.7146, -73.9970, NOW(), NOW()),
  ('Jackson Jerk Shack', '74-15 37th Rd', 1, 'New York', 16, 'Jackson Heights', 'gplace_1016', 40.7472, -73.8882, NOW(), NOW()),
  ('LIC Bistro', '10-22 Jackson Ave', 1, 'New York', 17, 'Long Island City', 'gplace_1017', 40.7440, -73.9486, NOW(), NOW()),
  ('Fulton Fry House', '199 Fulton St', 1, 'New York', 18, 'Financial District', 'gplace_1018', 40.7106, -74.0090, NOW(), NOW()),
  ('Central Perk Pop-Up', '249 Columbus Ave', 1, 'New York', 19, 'Upper West Side', 'gplace_1019', 40.7813, -73.9742, NOW(), NOW()),
  ('East River Roll Bar', '15 Water St', 1, 'New York', 20, 'DUMBO', 'gplace_1020', 40.7033, -73.9903, NOW(), NOW());

-- Insert 1 dish per restaurant
INSERT INTO dishes (restaurant_id, name, created_at)
SELECT id, name || ' Special', NOW()
FROM restaurants
ORDER BY id
LIMIT 20;
