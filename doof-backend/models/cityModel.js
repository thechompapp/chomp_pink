// Filename: /root/doof-backend/models/cityModel.js
/* REFACTORED: Convert to ES Modules (named exports) */
import db from '../db/index.js';

// Helper function (keep local or move to formatters.js)
const formatCity = (row) => { /* ... */ };

// Export functions individually
export const findCityById = async (id) => { /* ... */ };
export const getAllCities = async () => { /* ... */ };
export const createCity = async (cityData) => { /* ... */ };
export const updateCity = async (id, cityData) => { /* ... */ };
export const deleteCity = async (id) => { /* ... */ };

// Optional default export
// const CityModel = { findCityById, getAllCities, createCity, updateCity, deleteCity };
// export default CityModel;