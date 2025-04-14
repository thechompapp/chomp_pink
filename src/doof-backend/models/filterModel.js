/* src/doof-backend/models/filterModel.js */
import db from '../db/index.js';

export const getCities = async () => {
    const query = `SELECT id, name FROM Cities ORDER BY name`;
    const result = await db.query(query);
    return (result.rows || []).map((city) => ({
        ...city,
        id: Number(city.id)
    }));
};

export const getCuisines = async () => {
    const query = `SELECT id, name, category FROM Hashtags WHERE category ILIKE 'cuisine' ORDER BY name`; // Use ILIKE for case-insensitivity
    const result = await db.query(query);
     return (result.rows || []).map(c => ({...c, id: Number(c.id)}));
};

export const getNeighborhoodsByCity = async (cityId) => {
    const cityIdNum = Number(cityId);
    if (isNaN(cityIdNum) || cityIdNum <= 0) {
        console.warn(`[FilterModel] Invalid cityId provided: ${cityId}`);
        return [];
    }

    const query = `SELECT id, name, city_id FROM Neighborhoods WHERE city_id = $1 ORDER BY name`;
    const result = await db.query(query, [cityIdNum]);
     return (result.rows || []).map(n => ({
         ...n,
         id: Number(n.id),
         city_id: Number(n.city_id)
     }));
};