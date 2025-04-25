// Filename: /root/doof-backend/models/neighborhoodModel.js
/* REFACTORED: Convert to ES Modules (named exports) */
import db from '../db/index.js'; // Use default import from db
import { formatNeighborhood } from '../utils/formatters.js'; // Named import
import format from 'pg-format'; // Named import

// Helper function (keep local or move to utils)
const prepareZipcodeRanges = (zipcodesInput) => { /* ... implementation ... */ };

// Export functions individually
export const getAllNeighborhoods = async (limit = 1000, offset = 0, sortBy = 'n.name', sortOrder = 'ASC', search, cityId) => { /* ... implementation ... */ };
export const getNeighborhoodById = async (id) => { /* ... implementation ... */ };
export const createNeighborhood = async (data) => { /* ... implementation ... */ };
export const updateNeighborhood = async (id, data) => { /* ... implementation ... */ };
export const deleteNeighborhood = async (id) => { /* ... implementation ... */ };
export const findNeighborhoodByZipcode = async (zipcode) => { /* ... implementation ... */ };
export const getAllCitiesSimple = async () => { /* ... implementation ... */ };

// Optional default export
const NeighborhoodModel = { getAllNeighborhoods, getNeighborhoodById, createNeighborhood, updateNeighborhood, deleteNeighborhood, findNeighborhoodByZipcode, getAllCitiesSimple };
// export default NeighborhoodModel;