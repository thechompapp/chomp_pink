-- Comprehensive NYC Zipcode Population Script
-- Updates existing neighborhoods and adds new major NYC neighborhoods with zipcode data

-- Update existing NYC neighborhoods with proper names and zipcodes
UPDATE neighborhoods SET 
  name = CASE id
    WHEN 144 THEN 'West Village'
    WHEN 145 THEN 'East Village' 
    WHEN 146 THEN 'SoHo'
    WHEN 147 THEN 'Lower East Side'
    WHEN 148 THEN 'Midtown'
    WHEN 149 THEN 'Midtown East'
    WHEN 150 THEN 'Hell''s Kitchen'
    WHEN 151 THEN 'Chelsea'
    WHEN 152 THEN 'Harlem'
    WHEN 153 THEN 'Penn Station'
    WHEN 154 THEN 'Gramercy'
    WHEN 155 THEN 'Upper West Side'
    WHEN 156 THEN 'Upper East Side'
    WHEN 157 THEN 'Upper East Side'
    WHEN 158 THEN 'Greenwich Village'
    WHEN 159 THEN 'Upper East Side'
  END,
  zipcode_ranges = CASE id
    WHEN 144 THEN ARRAY['10014']
    WHEN 145 THEN ARRAY['10003', '10009']
    WHEN 146 THEN ARRAY['10012', '10013']
    WHEN 147 THEN ARRAY['10002', '10003']
    WHEN 148 THEN ARRAY['10018', '10019', '10036']
    WHEN 149 THEN ARRAY['10017', '10022']
    WHEN 150 THEN ARRAY['10019', '10036']
    WHEN 151 THEN ARRAY['10010', '10011']
    WHEN 152 THEN ARRAY['10027', '10030', '10037']
    WHEN 153 THEN ARRAY['10001', '10119']
    WHEN 154 THEN ARRAY['10022', '10016']
    WHEN 155 THEN ARRAY['10023', '10024', '10025']
    WHEN 156 THEN ARRAY['10065', '10028']
    WHEN 157 THEN ARRAY['10021', '10028']
    WHEN 158 THEN ARRAY['10011', '10014']
    WHEN 159 THEN ARRAY['10075', '10028']
  END,
  parent_id = 139,
  updated_at = NOW()
WHERE city_id = 10 AND id BETWEEN 144 AND 159;

-- Insert additional major NYC neighborhoods
INSERT INTO neighborhoods (name, city_id, parent_id, location_type, is_borough, location_level, zipcode_ranges, address_aliases) VALUES
-- Manhattan neighborhoods
('Financial District', 10, 139, 'neighborhood', false, 1, ARRAY['10004', '10005', '10006', '10007'], ARRAY[]::text[]),
('Tribeca', 10, 139, 'neighborhood', false, 1, ARRAY['10013', '10007'], ARRAY[]::text[]),
('Little Italy', 10, 139, 'neighborhood', false, 1, ARRAY['10013'], ARRAY[]::text[]),
('Chinatown', 10, 139, 'neighborhood', false, 1, ARRAY['10013', '10002'], ARRAY[]::text[]),
('Nolita', 10, 139, 'neighborhood', false, 1, ARRAY['10012'], ARRAY[]::text[]),
('NoHo', 10, 139, 'neighborhood', false, 1, ARRAY['10012'], ARRAY[]::text[]),
('Union Square', 10, 139, 'neighborhood', false, 1, ARRAY['10003', '10010'], ARRAY[]::text[]),
('Flatiron', 10, 139, 'neighborhood', false, 1, ARRAY['10010', '10011'], ARRAY[]::text[]),
('Murray Hill', 10, 139, 'neighborhood', false, 1, ARRAY['10016', '10017'], ARRAY[]::text[]),
('Kips Bay', 10, 139, 'neighborhood', false, 1, ARRAY['10010', '10016'], ARRAY[]::text[]),
('Stuyvesant Town', 10, 139, 'neighborhood', false, 1, ARRAY['10009', '10010'], ARRAY[]::text[]),
('Two Bridges', 10, 139, 'neighborhood', false, 1, ARRAY['10002'], ARRAY[]::text[]),
('Times Square', 10, 139, 'neighborhood', false, 1, ARRAY['10036', '10019'], ARRAY[]::text[]),
('Theater District', 10, 139, 'neighborhood', false, 1, ARRAY['10036', '10019'], ARRAY[]::text[]),
('Garment District', 10, 139, 'neighborhood', false, 1, ARRAY['10018', '10001'], ARRAY[]::text[]),
('Koreatown', 10, 139, 'neighborhood', false, 1, ARRAY['10001', '10018'], ARRAY[]::text[]),
('Rose Hill', 10, 139, 'neighborhood', false, 1, ARRAY['10016', '10010'], ARRAY[]::text[]),
('Turtle Bay', 10, 139, 'neighborhood', false, 1, ARRAY['10017', '10022'], ARRAY[]::text[]),
('Sutton Place', 10, 139, 'neighborhood', false, 1, ARRAY['10022'], ARRAY[]::text[]),
('Beekman Place', 10, 139, 'neighborhood', false, 1, ARRAY['10022'], ARRAY[]::text[]),
('Lincoln Square', 10, 139, 'neighborhood', false, 1, ARRAY['10023', '10019'], ARRAY[]::text[]),
('Columbus Circle', 10, 139, 'neighborhood', false, 1, ARRAY['10019', '10023'], ARRAY[]::text[]),
('Central Park South', 10, 139, 'neighborhood', false, 1, ARRAY['10019'], ARRAY[]::text[]),
('Lenox Hill', 10, 139, 'neighborhood', false, 1, ARRAY['10021', '10028'], ARRAY[]::text[]),
('Yorkville', 10, 139, 'neighborhood', false, 1, ARRAY['10028', '10128'], ARRAY[]::text[]),
('Carnegie Hill', 10, 139, 'neighborhood', false, 1, ARRAY['10128', '10029'], ARRAY[]::text[]),
('East Harlem', 10, 139, 'neighborhood', false, 1, ARRAY['10029', '10035'], ARRAY[]::text[]),
('Hamilton Heights', 10, 139, 'neighborhood', false, 1, ARRAY['10031', '10032'], ARRAY[]::text[]),
('Washington Heights', 10, 139, 'neighborhood', false, 1, ARRAY['10032', '10033', '10034'], ARRAY[]::text[]),
('Inwood', 10, 139, 'neighborhood', false, 1, ARRAY['10034', '10040'], ARRAY[]::text[]),
('Morningside Heights', 10, 139, 'neighborhood', false, 1, ARRAY['10025', '10027'], ARRAY[]::text[]),
('Manhattan Valley', 10, 139, 'neighborhood', false, 1, ARRAY['10025', '10026'], ARRAY[]::text[]),

-- Brooklyn neighborhoods  
('Williamsburg', 10, 140, 'neighborhood', false, 1, ARRAY['11211', '11206'], ARRAY[]::text[]),
('DUMBO', 10, 140, 'neighborhood', false, 1, ARRAY['11201'], ARRAY[]::text[]),
('Brooklyn Heights', 10, 140, 'neighborhood', false, 1, ARRAY['11201'], ARRAY[]::text[]),
('Park Slope', 10, 140, 'neighborhood', false, 1, ARRAY['11215', '11217'], ARRAY[]::text[]),
('Prospect Heights', 10, 140, 'neighborhood', false, 1, ARRAY['11238'], ARRAY[]::text[]),
('Fort Greene', 10, 140, 'neighborhood', false, 1, ARRAY['11217'], ARRAY[]::text[]),
('Boerum Hill', 10, 140, 'neighborhood', false, 1, ARRAY['11217', '11231'], ARRAY[]::text[]),
('Carroll Gardens', 10, 140, 'neighborhood', false, 1, ARRAY['11231'], ARRAY[]::text[]),
('Cobble Hill', 10, 140, 'neighborhood', false, 1, ARRAY['11201'], ARRAY[]::text[]),
('Red Hook', 10, 140, 'neighborhood', false, 1, ARRAY['11231'], ARRAY[]::text[]),
('Gowanus', 10, 140, 'neighborhood', false, 1, ARRAY['11215', '11217'], ARRAY[]::text[]),
('Bushwick', 10, 140, 'neighborhood', false, 1, ARRAY['11221', '11237'], ARRAY[]::text[]),
('Greenpoint', 10, 140, 'neighborhood', false, 1, ARRAY['11222'], ARRAY[]::text[]),
('Crown Heights', 10, 140, 'neighborhood', false, 1, ARRAY['11213', '11216', '11238'], ARRAY[]::text[]),
('Bedford-Stuyvesant', 10, 140, 'neighborhood', false, 1, ARRAY['11216', '11221', '11233'], ARRAY[]::text[]),
('Sunset Park', 10, 140, 'neighborhood', false, 1, ARRAY['11220', '11232'], ARRAY[]::text[]),
('Bay Ridge', 10, 140, 'neighborhood', false, 1, ARRAY['11209'], ARRAY[]::text[]),
('Bensonhurst', 10, 140, 'neighborhood', false, 1, ARRAY['11204', '11214'], ARRAY[]::text[]),
('Coney Island', 10, 140, 'neighborhood', false, 1, ARRAY['11224'], ARRAY[]::text[]),
('Brighton Beach', 10, 140, 'neighborhood', false, 1, ARRAY['11235'], ARRAY[]::text[]),

-- Queens neighborhoods
('Long Island City', 10, 141, 'neighborhood', false, 1, ARRAY['11101', '11109'], ARRAY[]::text[]),
('Astoria', 10, 141, 'neighborhood', false, 1, ARRAY['11102', '11103', '11105'], ARRAY[]::text[]),
('Sunnyside', 10, 141, 'neighborhood', false, 1, ARRAY['11104'], ARRAY[]::text[]),
('Woodside', 10, 141, 'neighborhood', false, 1, ARRAY['11377'], ARRAY[]::text[]),
('Jackson Heights', 10, 141, 'neighborhood', false, 1, ARRAY['11372'], ARRAY[]::text[]),
('Elmhurst', 10, 141, 'neighborhood', false, 1, ARRAY['11373'], ARRAY[]::text[]),
('Corona', 10, 141, 'neighborhood', false, 1, ARRAY['11368'], ARRAY[]::text[]),
('Flushing', 10, 141, 'neighborhood', false, 1, ARRAY['11354', '11355', '11358'], ARRAY[]::text[]),
('Forest Hills', 10, 141, 'neighborhood', false, 1, ARRAY['11375'], ARRAY[]::text[]),
('Rego Park', 10, 141, 'neighborhood', false, 1, ARRAY['11374'], ARRAY[]::text[]),
('Kew Gardens', 10, 141, 'neighborhood', false, 1, ARRAY['11415'], ARRAY[]::text[]),
('Richmond Hill', 10, 141, 'neighborhood', false, 1, ARRAY['11418', '11419'], ARRAY[]::text[]),
('Jamaica', 10, 141, 'neighborhood', false, 1, ARRAY['11432', '11433', '11434'], ARRAY[]::text[]),
('Bayside', 10, 141, 'neighborhood', false, 1, ARRAY['11361'], ARRAY[]::text[]),
('Whitestone', 10, 141, 'neighborhood', false, 1, ARRAY['11357'], ARRAY[]::text[]),

-- Bronx neighborhoods
('Mott Haven', 10, 142, 'neighborhood', false, 1, ARRAY['10451'], ARRAY[]::text[]),
('Hunts Point', 10, 142, 'neighborhood', false, 1, ARRAY['10474'], ARRAY[]::text[]),
('Longwood', 10, 142, 'neighborhood', false, 1, ARRAY['10459'], ARRAY[]::text[]),
('Melrose', 10, 142, 'neighborhood', false, 1, ARRAY['10451', '10456'], ARRAY[]::text[]),
('Morrisania', 10, 142, 'neighborhood', false, 1, ARRAY['10456'], ARRAY[]::text[]),
('Fordham', 10, 142, 'neighborhood', false, 1, ARRAY['10458', '10468'], ARRAY[]::text[]),
('University Heights', 10, 142, 'neighborhood', false, 1, ARRAY['10453', '10468'], ARRAY[]::text[]),
('Kingsbridge', 10, 142, 'neighborhood', false, 1, ARRAY['10463'], ARRAY[]::text[]),
('Riverdale', 10, 142, 'neighborhood', false, 1, ARRAY['10463', '10471'], ARRAY[]::text[]),
('Tremont', 10, 142, 'neighborhood', false, 1, ARRAY['10457'], ARRAY[]::text[]),
('Belmont', 10, 142, 'neighborhood', false, 1, ARRAY['10457', '10458'], ARRAY[]::text[]),
('Morris Park', 10, 142, 'neighborhood', false, 1, ARRAY['10462'], ARRAY[]::text[]),
('Throggs Neck', 10, 142, 'neighborhood', false, 1, ARRAY['10465'], ARRAY[]::text[]),
('Soundview', 10, 142, 'neighborhood', false, 1, ARRAY['10473'], ARRAY[]::text[]),

-- Staten Island neighborhoods  
('St. George', 10, 143, 'neighborhood', false, 1, ARRAY['10301'], ARRAY[]::text[]),
('Stapleton', 10, 143, 'neighborhood', false, 1, ARRAY['10304'], ARRAY[]::text[]),
('Port Richmond', 10, 143, 'neighborhood', false, 1, ARRAY['10302'], ARRAY[]::text[]),
('New Brighton', 10, 143, 'neighborhood', false, 1, ARRAY['10301'], ARRAY[]::text[]),
('West Brighton', 10, 143, 'neighborhood', false, 1, ARRAY['10310'], ARRAY[]::text[]),
('Mariners Harbor', 10, 143, 'neighborhood', false, 1, ARRAY['10303'], ARRAY[]::text[]),
('Dongan Hills', 10, 143, 'neighborhood', false, 1, ARRAY['10305'], ARRAY[]::text[]),
('New Dorp', 10, 143, 'neighborhood', false, 1, ARRAY['10306'], ARRAY[]::text[]),
('Oakwood', 10, 143, 'neighborhood', false, 1, ARRAY['10306', '10308'], ARRAY[]::text[]),
('Tottenville', 10, 143, 'neighborhood', false, 1, ARRAY['10307'], ARRAY[]::text[])

ON CONFLICT (name, city_id) DO NOTHING;

-- Update borough zipcode ranges to include major codes
UPDATE neighborhoods SET 
  zipcode_ranges = CASE id
    WHEN 139 THEN ARRAY['10001', '10002', '10003', '10004', '10005', '10006', '10007', '10009', '10010', '10011', '10012', '10013', '10014', '10016', '10017', '10018', '10019', '10020', '10021', '10022', '10023', '10024', '10025', '10026', '10027', '10028', '10029', '10030', '10031', '10032', '10033', '10034', '10035', '10036', '10037', '10038', '10039', '10040', '10128']
    WHEN 140 THEN ARRAY['11201', '11202', '11203', '11204', '11205', '11206', '11207', '11208', '11209', '11210', '11211', '11212', '11213', '11214', '11215', '11216', '11217', '11218', '11219', '11220', '11221', '11222', '11223', '11224', '11225', '11226', '11228', '11229', '11230', '11231', '11232', '11233', '11234', '11235', '11236', '11237', '11238', '11239']
    WHEN 141 THEN ARRAY['11101', '11102', '11103', '11104', '11105', '11106', '11109', '11354', '11355', '11356', '11357', '11358', '11359', '11360', '11361', '11362', '11363', '11364', '11365', '11366', '11367', '11368', '11369', '11370', '11371', '11372', '11373', '11374', '11375', '11376', '11377', '11378', '11379', '11385', '11411', '11412', '11413', '11414', '11415', '11416', '11417', '11418', '11419', '11420', '11421', '11422', '11423', '11426', '11427', '11428', '11429', '11432', '11433', '11434', '11435', '11436', '11693', '11694', '11695', '11697']
    WHEN 142 THEN ARRAY['10451', '10452', '10453', '10454', '10455', '10456', '10457', '10458', '10459', '10460', '10461', '10462', '10463', '10464', '10465', '10466', '10467', '10468', '10469', '10470', '10471', '10472', '10473', '10474', '10475']
    WHEN 143 THEN ARRAY['10301', '10302', '10303', '10304', '10305', '10306', '10307', '10308', '10309', '10310', '10311', '10312', '10313', '10314']
  END,
  updated_at = NOW()
WHERE id IN (139, 140, 141, 142, 143);

-- Final result message
SELECT 'NYC zipcode data populated successfully - Added comprehensive zipcode coverage for all 5 boroughs' as result; 