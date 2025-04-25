// Filename: /root/doof-backend/models/restaurantModel.js
/* REFACTORED: Optimize tag fetching using LEFT JOIN and GROUP BY */
/* REFACTORED: Ensure using ESM named exports */
import db from '../db/index.js';
import { formatRestaurant } from '../utils/formatters.js';
// Import DishModel functions directly if needed (ensure it's also ESM)
import * as DishModel from './dishModel.js'; // Use namespace import
import format from 'pg-format';

// Export functions individually using 'export const'
export const findAllRestaurants = async (options = {}) => { /* ... implementation (as provided before) ... */ };
export const findRestaurantById = async (id) => { /* ... implementation (as provided before) ... */ };
export const createRestaurant = async (restaurantData) => { /* ... implementation (as provided before) ... */ };
export const updateRestaurant = async (id, updateData) => { /* ... implementation (as provided before) ... */ };
export const deleteRestaurant = async (id) => { /* ... implementation (as provided before) ... */ };
export const addTagToRestaurant = async (restaurantId, hashtagId) => { /* ... implementation (as provided before) ... */ };
export const removeTagFromRestaurant = async (restaurantId, hashtagId) => { /* ... implementation (as provided before) ... */ };
export const findRestaurantsApproximate = async (name, cityId = null, limit = 5) => { /* ... implementation from fetched file... */ }; // Added from fetched file

// Export constants if needed
export const SIMILARITY_THRESHOLD = 0.2; // Added from fetched file
export const SINGLE_MATCH_THRESHOLD = 0.9; // Added from fetched file

// No need for default export if all functions are exported namedly
// const RestaurantModel = { ... };
// export default RestaurantModel;