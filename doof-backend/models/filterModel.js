// Filename: /root/doof-backend/models/filterModel.js
import db from '../db/index.js';
// Removed incorrect logger import: import * as logger from '../utils/logger.js';

const filterModel = {
    async getCities() {
        try {
            // Select only existing columns (id and name) and set a default has_boroughs value
            const query = 'SELECT id, name FROM public.cities ORDER BY name';
            const result = await db.query(query);
            // Add default has_boroughs: true for all cities
            return (result.rows || []).map(row => ({
                ...row,
                has_boroughs: true // Default to true for all cities
            }));
        } catch (error) {
            // Use console.error for backend logging
            console.error('[FilterModel getCities] Error:', error);
            throw new Error('Failed to fetch cities');
        }
    },

    // Keep getCuisines if needed elsewhere, but it's not used by FilterPanel
    async getCuisines() {
        try {
            // Note: This fetches ALL hashtags, FilterPanel uses /api/hashtags/top
            const query = 'SELECT id, name FROM public.hashtags ORDER BY name';
            const result = await db.query(query);
            return result.rows || [];
        } catch (error) {
             // Use console.error for backend logging
            console.error('[FilterModel getCuisines] Error:', error);
            throw new Error('Failed to fetch cuisines/hashtags');
        }
    },

    // Removed getNeighborhoodsByCity as it's superseded by neighborhoodModel logic
};

export default filterModel;