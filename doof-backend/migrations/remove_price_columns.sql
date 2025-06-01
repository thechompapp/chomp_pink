-- Remove price columns migration
-- Created: 2025-06-01
-- Description: Remove all price-related columns from the database

-- Remove price column from dishes table
ALTER TABLE dishes DROP COLUMN IF EXISTS price;

-- Remove price_range column from restaurants table  
ALTER TABLE restaurants DROP COLUMN IF EXISTS price_range; 