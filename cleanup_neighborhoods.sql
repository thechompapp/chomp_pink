DELETE FROM neighborhoods WHERE name LIKE 'NY %';
UPDATE neighborhoods SET zipcode_ranges = '{10001,10011,10018}' WHERE name = 'Chelsea';
UPDATE neighborhoods SET zipcode_ranges = '{10012}' WHERE name = 'Soho';
UPDATE neighborhoods SET zipcode_ranges = '{10014}' WHERE name = 'West Village';
UPDATE neighborhoods SET zipcode_ranges = '{10003}' WHERE name = 'East Village';
UPDATE neighborhoods SET zipcode_ranges = '{10013}' WHERE name = 'Tribeca';
UPDATE neighborhoods SET zipcode_ranges = '{10002}' WHERE name = 'Lower East Side';
