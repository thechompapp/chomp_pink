/* src/doof-backend/models/filterModel.js */
import db from '../db/index.js';

export const getCities = async () => {
    const query = `SELECT id, name FROM Cities ORDER BY name`;
    const result = await db.query(query);
    // Ensure id is integer (Belt-and-suspenders, might be redundant if DB/pg handles it)
    return (result.rows || []).map(city => ({ ...city, id: parseInt(city.id, 10) }));
};

export const getCuisines = async () => {
    const query = `SELECT id, name FROM Hashtags WHERE category = 'cuisine' ORDER BY name`;
    const result = await db.query(query);
    return result.rows || [];
};

export const getNeighborhoodsByCity = async (cityId) => {
    // Input validation (ensure cityId is a number) should ideally happen before calling this model
    const query = `SELECT id, name FROM Neighborhoods WHERE city_id = $1 ORDER BY name`;
    const result = await db.query(query, [cityId]);
    return result.rows || [];
};