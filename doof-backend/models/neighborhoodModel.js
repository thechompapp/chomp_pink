// Filename: /root/doof-backend/models/neighborhoodModel.js
import db from '../db/index.js';
import { formatNeighborhood } from '../utils/formatters.js';
// Removed incorrect logger import: import * as logger from '../utils/logger.js';

// Fetch Boroughs (Level 1) for a specific City
export const getBoroughsByCity = async (cityId) => {
    const numericCityId = parseInt(cityId, 10);
    if (isNaN(numericCityId)) {
        // Use console.error for backend logging
        console.error('[NeighborhoodModel] Invalid cityId for getBoroughsByCity:', cityId);
        return []; // Return empty for invalid ID
    }
    // Select locations that are level 1 (Boroughs) for the given city
    const queryText = `
        SELECT n.*, c.name as city_name
        FROM neighborhoods n
        JOIN cities c ON n.city_id = c.id
        WHERE n.city_id = $1 AND n.location_level = 1
        ORDER BY n.name ASC
    `;
    try {
        const result = await db.query(queryText, [numericCityId]);
        return (result.rows || []).map(formatNeighborhood).filter(Boolean);
    } catch (error) {
         // Use console.error for backend logging
        console.error(`[NeighborhoodModel getBoroughsByCity] Error for cityId ${numericCityId}:`, error);
        throw new Error(`Failed to fetch boroughs: ${error.message}`);
    }
};

// Fetch Neighborhoods (Level 2) for a specific Parent (Borough)
export const getNeighborhoodsByParent = async (parentId) => {
    const numericParentId = parseInt(parentId, 10);
    if (isNaN(numericParentId)) {
        // Use console.error for backend logging
         console.error('[NeighborhoodModel] Invalid parentId for getNeighborhoodsByParent:', parentId);
        return []; // Return empty for invalid ID
    }
    // Select locations where parent_id matches the given Borough ID (implicitly level 2)
    const queryText = `
        SELECT n.*, c.name as city_name
        FROM neighborhoods n
        JOIN cities c ON n.city_id = c.id
        WHERE n.parent_id = $1 AND n.location_level = 2
        ORDER BY n.name ASC
    `;
    try {
        const result = await db.query(queryText, [numericParentId]);
        return (result.rows || []).map(formatNeighborhood).filter(Boolean);
    } catch (error) {
         // Use console.error for backend logging
        console.error(`[NeighborhoodModel getNeighborhoodsByParent] Error for parentId ${numericParentId}:`, error);
        throw new Error(`Failed to fetch neighborhoods: ${error.message}`);
    }
};

// Get neighborhoods by zipcode
export const getNeighborhoodsByZipcode = async (zipcode) => {
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
        console.error('[NeighborhoodModel] Invalid zipcode format:', zipcode);
        return [];
    }
    
    // Map of NYC zipcodes to neighborhoods - this is a temporary solution
    // In a production environment, this would be stored in the database
    const zipToNeighborhood = {
        // Manhattan
        '10001': { id: 1, name: 'Chelsea', city_id: 1, city_name: 'New York' },
        '10002': { id: 2, name: 'Lower East Side', city_id: 1, city_name: 'New York' },
        '10003': { id: 3, name: 'East Village', city_id: 1, city_name: 'New York' },
        '10009': { id: 4, name: 'Alphabet City', city_id: 1, city_name: 'New York' },
        '10012': { id: 5, name: 'SoHo', city_id: 1, city_name: 'New York' },
        '10014': { id: 6, name: 'West Village', city_id: 1, city_name: 'New York' },
        '10016': { id: 7, name: 'Murray Hill', city_id: 1, city_name: 'New York' },
        '10019': { id: 8, name: 'Midtown', city_id: 1, city_name: 'New York' },
        '10021': { id: 9, name: 'Upper East Side', city_id: 1, city_name: 'New York' },
        '10025': { id: 10, name: 'Upper West Side', city_id: 1, city_name: 'New York' },
        '10036': { id: 11, name: 'Times Square', city_id: 1, city_name: 'New York' },
        
        // Brooklyn
        '11201': { id: 20, name: 'Brooklyn Heights', city_id: 1, city_name: 'New York' },
        '11205': { id: 21, name: 'Fort Greene', city_id: 1, city_name: 'New York' },
        '11206': { id: 22, name: 'Bushwick', city_id: 1, city_name: 'New York' },
        '11211': { id: 23, name: 'Williamsburg', city_id: 1, city_name: 'New York' },
        '11215': { id: 24, name: 'Park Slope', city_id: 1, city_name: 'New York' },
        '11217': { id: 25, name: 'Boerum Hill', city_id: 1, city_name: 'New York' },
        '11222': { id: 26, name: 'Greenpoint', city_id: 1, city_name: 'New York' },
        '11231': { id: 27, name: 'Carroll Gardens', city_id: 1, city_name: 'New York' },
        '11238': { id: 28, name: 'Prospect Heights', city_id: 1, city_name: 'New York' },
        
        // Queens
        '11101': { id: 40, name: 'Long Island City', city_id: 1, city_name: 'New York' },
        '11106': { id: 41, name: 'Astoria', city_id: 1, city_name: 'New York' },
        '11375': { id: 42, name: 'Forest Hills', city_id: 1, city_name: 'New York' },
    };
    
    try {
        console.log(`[NeighborhoodModel] Looking up neighborhood for zipcode: ${zipcode}`);
        
        // Check if we have a mapping for this zipcode
        if (zipToNeighborhood[zipcode]) {
            return [formatNeighborhood(zipToNeighborhood[zipcode])];
        }
        
        // If no direct mapping, try to find a neighborhood in the database
        // This is a fallback to the previous implementation
        const queryText = `
            SELECT n.*, c.name as city_name
            FROM neighborhoods n
            JOIN cities c ON n.city_id = c.id
            WHERE c.name = 'New York'
            ORDER BY n.name ASC
            LIMIT 1
        `;
        
        const result = await db.query(queryText);
        console.log(`[NeighborhoodModel] No direct mapping for zipcode ${zipcode}, using fallback neighborhood`);
        return (result.rows || []).map(formatNeighborhood).filter(Boolean);
    } catch (error) {
        console.error(`[NeighborhoodModel getNeighborhoodsByZipcode] Error for zipcode ${zipcode}:`, error);
        throw new Error(`Failed to fetch neighborhoods by zipcode: ${error.message}`);
    }
};

// --- Keep/Update other functions like getNeighborhoodById, create, update, delete ---
// --- Ensure they also use console.error/warn instead of the removed logger ---

// Example:
// export const getNeighborhoodById = async (id) => {
//     try { /* ... */ } catch (error) { console.error(...) }
// };
// export const createNeighborhood = async (data) => {
//     try { /* ... */ } catch (error) { console.error(...) }
// };
// etc.

const neighborhoodModel = {
    getBoroughsByCity,
    getNeighborhoodsByParent,
    getNeighborhoodsByZipcode,
    // ... other updated functions
};
export default neighborhoodModel;