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
    // ... other updated functions
};
export default neighborhoodModel;