// Filename: /root/doof-backend/models/filterModel.js
import db from '../db/index.js';

const filterModel = {
    async getCities() {
        try {
            const query = 'SELECT id, name FROM cities ORDER BY name';
            const result = await db.query(query);
            return result.rows || [];
        } catch (error) {
            console.error('[FilterModel getCities] Error:', error);
            throw new Error('Failed to fetch cities');
        }
    },

    async getCuisines() {
        try {
            const query = 'SELECT id, name FROM hashtags ORDER BY name';
            const result = await db.query(query);
            return result.rows || [];
        } catch (error) {
            console.error('[FilterModel getCuisines] Error:', error);
            throw new Error('Failed to fetch cuisines');
        }
    },

    async getNeighborhoodsByCity(cityId) {
        const numericCityId = parseInt(cityId, 10);
        if (isNaN(numericCityId)) throw new Error('Invalid city ID');
        try {
            const query = `
                SELECT id, name, city_id 
                FROM neighborhoods 
                WHERE city_id = $1 
                ORDER BY name
            `;
            const result = await db.query(query, [numericCityId]);
            return result.rows || [];
        } catch (error) {
            console.error(`[FilterModel getNeighborhoodsByCity] Error for city ${numericCityId}:`, error);
            throw new Error('Failed to fetch neighborhoods');
        }
    },

    async findNeighborhoodByZipcode(zipcode) {
        if (!zipcode) throw new Error('Zipcode is required');
        try {
            const query = `
                SELECT n.id, n.name, n.city_id, c.name as city_name
                FROM neighborhoods n
                JOIN cities c ON n.city_id = c.id
                WHERE n.zipcode = $1
            `;
            const result = await db.query(query, [zipcode]);
            return result.rows[0] || null;
        } catch (error) {
            console.error(`[FilterModel findNeighborhoodByZipcode] Error for zipcode ${zipcode}:`, error);
            throw new Error('Failed to fetch neighborhood by zipcode');
        }
    },
};

export default filterModel;