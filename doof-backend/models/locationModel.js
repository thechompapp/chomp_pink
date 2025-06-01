// Unified Location Model
// Handles both cities and neighborhoods in a hierarchical structure
// Resolves complex address cases like Brooklyn, NY

import db from '../db/index.js';
import { formatCity, formatNeighborhood } from '../utils/formatters.js';

// Get all locations in hierarchical structure
export const getLocationHierarchy = async () => {
    try {
        const query = `
            SELECT 
                c.id as city_id,
                c.name as city_name,
                c.state_code,
                c.country_code,
                c.is_metro_area,
                COALESCE(
                    json_agg(
                        CASE 
                            WHEN n.id IS NOT NULL THEN
                                json_build_object(
                                    'id', n.id,
                                    'name', n.name,
                                    'location_type', n.location_type,
                                    'is_borough', n.is_borough,
                                    'location_level', n.location_level
                                )
                            ELSE NULL
                        END
                    ) FILTER (WHERE n.id IS NOT NULL),
                    '[]'::json
                ) as locations
            FROM cities c
            LEFT JOIN neighborhoods n ON c.id = n.city_id AND n.parent_id IS NULL
            GROUP BY c.id, c.name, c.state_code, c.country_code, c.is_metro_area
            ORDER BY c.name
        `;
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('[LocationModel] Error fetching location hierarchy:', error);
        throw new Error('Failed to fetch location hierarchy');
    }
};

// Resolve address to proper location (handles Brooklyn, NY case)
export const resolveAddress = async (addressCity, addressState = 'NY') => {
    try {
        const query = `SELECT * FROM resolve_address_location($1, $2)`;
        const result = await db.query(query, [addressCity, addressState]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('[LocationModel] Error resolving address:', error);
        throw new Error('Failed to resolve address');
    }
};

// Get cities with enhanced info
export const getCitiesEnhanced = async () => {
    try {
        const query = `
            SELECT 
                c.*,
                COUNT(n.id) as neighborhood_count,
                COUNT(CASE WHEN n.is_borough = true THEN n.id END) as borough_count
            FROM cities c
            LEFT JOIN neighborhoods n ON c.id = n.city_id
            GROUP BY c.id, c.name, c.state_code, c.country_code, c.is_metro_area, c.has_boroughs, c.created_at, c.updated_at
            ORDER BY c.name
        `;
        
        const result = await db.query(query);
        return result.rows.map(formatCity);
    } catch (error) {
        console.error('[LocationModel] Error fetching enhanced cities:', error);
        throw new Error('Failed to fetch enhanced cities');
    }
};

// Get neighborhoods by city with hierarchy
export const getNeighborhoodsByCity = async (cityId, includeChildren = true) => {
    try {
        let query;
        if (includeChildren) {
            query = `
                WITH RECURSIVE location_tree AS (
                    -- Base case: top-level locations (boroughs or direct neighborhoods)
                    SELECT 
                        n.*,
                        c.name as city_name,
                        0 as depth,
                        ARRAY[n.id] as path
                    FROM neighborhoods n
                    JOIN cities c ON n.city_id = c.id
                    WHERE n.city_id = $1 AND n.parent_id IS NULL
                    
                    UNION ALL
                    
                    -- Recursive case: children of current level
                    SELECT 
                        n.*,
                        lt.city_name,
                        lt.depth + 1,
                        lt.path || n.id
                    FROM neighborhoods n
                    JOIN location_tree lt ON n.parent_id = lt.id
                )
                SELECT *, 
                    CASE 
                        WHEN parent_id IS NULL THEN 'root'
                        WHEN location_type = 'borough' THEN 'borough'
                        ELSE 'child'
                    END as hierarchy_role
                FROM location_tree
                ORDER BY depth, name
            `;
        } else {
            query = `
                SELECT n.*, c.name as city_name
                FROM neighborhoods n
                JOIN cities c ON n.city_id = c.id
                WHERE n.city_id = $1
                ORDER BY n.location_level, n.name
            `;
        }
        
        const result = await db.query(query, [cityId]);
        return result.rows.map(formatNeighborhood);
    } catch (error) {
        console.error('[LocationModel] Error fetching neighborhoods by city:', error);
        throw new Error('Failed to fetch neighborhoods by city');
    }
};

// Search locations (unified search across cities and neighborhoods)
export const searchLocations = async (searchTerm, limit = 25) => {
    try {
        const query = `
            (
                SELECT 
                    'city' as type,
                    c.id,
                    c.name,
                    c.state_code,
                    NULL as city_name,
                    NULL as location_type,
                    NULL as parent_id,
                    1 as relevance_score
                FROM cities c
                WHERE LOWER(c.name) ILIKE LOWER($1)
            )
            UNION ALL
            (
                SELECT 
                    'location' as type,
                    n.id,
                    n.name,
                    NULL as state_code,
                    c.name as city_name,
                    n.location_type,
                    n.parent_id,
                    CASE 
                        WHEN LOWER(n.name) = LOWER($2) THEN 3
                        WHEN LOWER(n.name) ILIKE LOWER($2 || '%') THEN 2
                        ELSE 1
                    END as relevance_score
                FROM neighborhoods n
                JOIN cities c ON n.city_id = c.id
                WHERE LOWER(n.name) ILIKE LOWER($1)
                   OR LOWER($2) = ANY(SELECT LOWER(unnest(n.address_aliases)))
            )
            ORDER BY relevance_score DESC, name
            LIMIT $3
        `;
        
        const searchPattern = `%${searchTerm}%`;
        const result = await db.query(query, [searchPattern, searchTerm, limit]);
        return result.rows;
    } catch (error) {
        console.error('[LocationModel] Error searching locations:', error);
        throw new Error('Failed to search locations');
    }
};

// Create new location (city or neighborhood)
export const createLocation = async (locationType, locationData) => {
    try {
        if (locationType === 'city') {
            const query = `
                INSERT INTO cities (name, state_code, country_code, is_metro_area, has_boroughs)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `;
            const result = await db.query(query, [
                locationData.name,
                locationData.state_code,
                locationData.country_code || 'USA',
                locationData.is_metro_area || false,
                locationData.has_boroughs || false
            ]);
            return formatCity(result.rows[0]);
        } else {
            const query = `
                INSERT INTO neighborhoods (name, city_id, location_type, is_borough, parent_id, location_level, zipcode_ranges, address_aliases)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `;
            const result = await db.query(query, [
                locationData.name,
                locationData.city_id,
                locationData.location_type || 'neighborhood',
                locationData.is_borough || false,
                locationData.parent_id || null,
                locationData.location_level || 1,
                locationData.zipcode_ranges || [],
                locationData.address_aliases || []
            ]);
            return formatNeighborhood(result.rows[0]);
        }
    } catch (error) {
        console.error('[LocationModel] Error creating location:', error);
        
        // Handle specific database constraint violations
        if (error.code === '23505') { // Unique constraint violation
            if (error.constraint === 'cities_name_key') {
                const customError = new Error(`A city with the name "${locationData.name}" already exists`);
                customError.code = 'DUPLICATE_CITY_NAME';
                customError.statusCode = 409;
                throw customError;
            } else if (error.constraint && error.constraint.includes('neighborhoods')) {
                const customError = new Error(`A neighborhood with that name already exists in this location`);
                customError.code = 'DUPLICATE_NEIGHBORHOOD_NAME';
                customError.statusCode = 409;
                throw customError;
            }
        }
        
        if (error.code === '23503') { // Foreign key constraint violation
            const customError = new Error(`Invalid city ID provided for neighborhood`);
            customError.code = 'INVALID_CITY_ID';
            customError.statusCode = 400;
            throw customError;
        }
        
        // Re-throw with more context but preserve original structure if it's not a constraint violation
        const customError = new Error(`Failed to create ${locationType}: ${error.message}`);
        customError.originalError = error;
        throw customError;
    }
};

// Update location
export const updateLocation = async (locationType, id, updateData) => {
    try {
        if (locationType === 'city') {
            const setClauses = [];
            const values = [];
            let paramCount = 1;
            
            Object.entries(updateData).forEach(([key, value]) => {
                if (['name', 'state_code', 'country_code', 'is_metro_area', 'has_boroughs'].includes(key)) {
                    setClauses.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            });
            
            if (setClauses.length === 0) {
                throw new Error('No valid fields to update');
            }
            
            setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            
            const query = `
                UPDATE cities 
                SET ${setClauses.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;
            
            const result = await db.query(query, values);
            return formatCity(result.rows[0]);
        } else {
            const setClauses = [];
            const values = [];
            let paramCount = 1;
            
            Object.entries(updateData).forEach(([key, value]) => {
                if (['name', 'city_id', 'location_type', 'is_borough', 'parent_id', 'location_level', 'zipcode_ranges', 'address_aliases'].includes(key)) {
                    setClauses.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            });
            
            if (setClauses.length === 0) {
                throw new Error('No valid fields to update');
            }
            
            setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(id);
            
            const query = `
                UPDATE neighborhoods 
                SET ${setClauses.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;
            
            const result = await db.query(query, values);
            return formatNeighborhood(result.rows[0]);
        }
    } catch (error) {
        console.error('[LocationModel] Error updating location:', error);
        throw new Error(`Failed to update ${locationType}`);
    }
};

// Delete location
export const deleteLocation = async (locationType, id) => {
    try {
        const tableName = locationType === 'city' ? 'cities' : 'neighborhoods';
        const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    } catch (error) {
        console.error('[LocationModel] Error deleting location:', error);
        throw new Error(`Failed to delete ${locationType}`);
    }
};

export default {
    getLocationHierarchy,
    resolveAddress,
    getCitiesEnhanced,
    getNeighborhoodsByCity,
    searchLocations,
    createLocation,
    updateLocation,
    deleteLocation
}; 