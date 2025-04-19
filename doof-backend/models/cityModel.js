/* src/doof-backend/models/cityModel.js */
import db from '../db/index.js';

// --- Helper Functions ---
const formatCity = (row) => {
    if (!row || row.id == null) return null;
    return {
        id: Number(row.id),
        name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

// --- Model Functions ---

export const findCityById = async (id) => {
    if (isNaN(id) || id <= 0) return null;
    const result = await db.query('SELECT * FROM cities WHERE id = $1', [id]);
    return formatCity(result.rows[0]);
};

export const getAllCities = async (/* Add params like limit, offset, sortBy, etc. if needed */) => {
    const query = `SELECT * FROM cities ORDER BY name ASC`; // Simple example
    const result = await db.query(query);
    return (result.rows || []).map(formatCity).filter(c => c !== null);
};


export const createCity = async (cityData) => {
    const { name } = cityData;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error("City name is required and cannot be empty.");
    }
    const query = `
        INSERT INTO cities (name, created_at, updated_at)
        VALUES ($1, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
        RETURNING *;
     `;
    try {
        const result = await db.query(query, [name.trim()]);
        if (result.rows.length === 0) {
            const existing = await db.query('SELECT * FROM cities WHERE name = $1', [name.trim()]);
            if (existing.rows.length > 0) {
                console.warn(`[CityModel createCity] City named "${name}" already exists.`);
                return formatCity(existing.rows[0]);
            } else {
                 throw new Error("City creation failed unexpectedly after conflict check.");
            }
        }
        return formatCity(result.rows[0]);
    } catch (error) {
        console.error(`[CityModel createCity] Error creating city "${name}":`, error);
        if (error.code === '23505') {
            throw new Error(`Create failed: City named "${name}" already exists.`);
        }
        throw error;
    }
};

export const updateCity = async (id, cityData) => {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
        console.warn(`[CityModel Update] Invalid ID: ${id}`);
        return null;
    }
    const { name } = cityData;
    if (name === undefined || typeof name !== 'string' || name.trim() === '') {
         console.warn(`[CityModel Update] No valid name provided for update on city ${numericId}`);
         return findCityById(numericId);
    }

    const query = `
        UPDATE cities
        SET name = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
    `;
    try {
        const result = await db.query(query, [name.trim(), numericId]);
        if (result.rowCount === 0) {
            console.warn(`[CityModel Update] City with ID ${numericId} not found or no rows updated.`);
            return null;
        }
        return formatCity(result.rows[0]);
    } catch (error) {
        console.error(`[CityModel updateCity] Error updating city ${numericId}:`, error);
        if (error.code === '23505') { // Unique violation
            throw new Error(`Update failed: City named "${name}" already exists.`);
        }
        throw error;
    }
};

export const deleteCity = async (id) => {
     const numericId = Number(id);
     if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[CityModel deleteCity] Invalid ID: ${id}`);
         return false;
     }
    const query = 'DELETE FROM cities WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [numericId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[CityModel deleteCity] Error deleting city ${numericId}:`, error);
        if (error.code === '23503') { // Foreign key violation
            throw new Error(`Cannot delete city: It is referenced by other items (e.g., neighborhoods, restaurants).`);
        }
        throw error;
    }
};