// Filename: /root/doof-backend/models/dishModel.js
/* REFACTORED: Convert to ES Modules (named exports) */
/* REFACTORED: Optimize tag fetching, Added pagination */
import db from '../db/index.js';
import { formatDish } from '../utils/formatters.js';
import format from 'pg-format';

// Export functions individually
export const findAllDishes = async (options = {}) => { /* ... implementation ... */ };
export const findDishesByRestaurantId = async (restaurantId, options = {}) => { /* ... implementation ... */ };
export const findDishById = async (id) => { /* ... implementation ... */ };
export const createDish = async (dishData) => { /* ... implementation ... */ };
export const updateDish = async (id, dishData) => { /* ... implementation ... */ };
export const deleteDish = async (id) => { /* ... implementation ... */ };
export const addTagToDish = async (dishId, hashtagId) => { /* ... implementation ... */ };
export const removeTagFromDish = async (dishId, hashtagId) => { /* ... implementation ... */ };
export const checkDishExistence = async (name, restaurantId) => { /* ... implementation ... */ };
// Export findDishesByName if it exists and is used
export const findDishesByName = async (name, limit = 20, offset = 0) => { /* ... implementation from fetched file ... */ };


// Export default object if needed (optional)
// const DishModel = { ... };
// export default DishModel;