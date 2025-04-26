// Filename: /root/doof-backend/models/filterModel.js
import db from '../db/index.js';
// Removed incorrect logger import: import * as logger from '../utils/logger.js';

const filterModel = {
    async getCities() {
        try {
            // Select id, name, and the new has_boroughs flag
            const query = 'SELECT id, name, has_boroughs FROM public.cities ORDER BY name';
            const result = await db.query(query);
            // Ensure boolean is returned correctly
            return (result.rows || []).map(row => ({
                ...row,
                has_boroughs: !!row.has_boroughs // Explicit boolean conversion
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