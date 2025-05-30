// Filename: /root/doof-backend/models/cityModel.js
/* REFACTORED: Convert to ES Modules (named exports) */
import db from '../db/index.js';

// Helper function to format city data
const formatCity = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    has_boroughs: row.has_boroughs || false,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

// Find city by ID
export const findCityById = async (id) => {
  try {
    const result = await db.query('SELECT * FROM cities WHERE id = $1', [id]);
    return result.rows.length > 0 ? formatCity(result.rows[0]) : null;
  } catch (error) {
    console.error('Error finding city by ID:', error);
    throw error;
  }
};

// Get all cities
export const getAllCities = async () => {
  try {
    const result = await db.query('SELECT * FROM cities ORDER BY name ASC');
    return result.rows.map(formatCity);
  } catch (error) {
    console.error('Error getting all cities:', error);
    throw error;
  }
};

// Search cities with optional search term and limit
export const searchCities = async (searchTerm = '', limit = 10) => {
  try {
    let query;
    let params;
    
    if (searchTerm && searchTerm.trim()) {
      // Search cities by name (case-insensitive)
      query = `
        SELECT * FROM cities 
        WHERE LOWER(name) LIKE LOWER($1)
        ORDER BY name ASC 
        LIMIT $2
      `;
      params = [`%${searchTerm.trim()}%`, limit];
    } else {
      // Return top cities by name
      query = `
        SELECT * FROM cities 
        ORDER BY name ASC 
        LIMIT $1
      `;
      params = [limit];
    }
    
    const result = await db.query(query, params);
    return result.rows.map(formatCity);
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
};

// Create new city
export const createCity = async (cityData) => {
  try {
    const { name, has_boroughs = false } = cityData;
    
    const result = await db.query(
      'INSERT INTO cities (name, has_boroughs) VALUES ($1, $2) RETURNING *',
      [name, has_boroughs]
    );
    
    return formatCity(result.rows[0]);
  } catch (error) {
    console.error('Error creating city:', error);
    throw error;
  }
};

// Update city
export const updateCity = async (id, cityData) => {
  try {
    const { name, has_boroughs } = cityData;
    
    const result = await db.query(
      'UPDATE cities SET name = $1, has_boroughs = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, has_boroughs, id]
    );
    
    return result.rows.length > 0 ? formatCity(result.rows[0]) : null;
  } catch (error) {
    console.error('Error updating city:', error);
    throw error;
  }
};

// Delete city
export const deleteCity = async (id) => {
  try {
    const result = await db.query('DELETE FROM cities WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0 ? formatCity(result.rows[0]) : null;
  } catch (error) {
    console.error('Error deleting city:', error);
    throw error;
  }
};

// Optional default export
const CityModel = { 
  findCityById, 
  getAllCities, 
  searchCities,
  createCity, 
  updateCity, 
  deleteCity 
};

export default CityModel;