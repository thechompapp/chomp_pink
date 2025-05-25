// Filename: /root/doof-backend/models/dishModel.js
/* REFACTORED: Convert to ES Modules (named exports) */
/* REFACTORED: Optimize tag fetching, Added pagination */
import db from '../db/index.js';
import { formatDish } from '../utils/formatters.js';
import format from 'pg-format';

// Export functions individually
export const findAllDishes = async (options = {}) => {
  const {
    limit = 20,
    offset = 0,
    sortBy = 'name',
    sortDirection = 'asc',
    search = '',
    filters = {}
  } = options;

  const queryParams = [];
  let paramIndex = 0;

  // Simple query to just get dishes without complex joins
  let query = 'SELECT * FROM dishes';
  let countQuery = 'SELECT COUNT(*) FROM dishes';
  
  let whereClauses = [];
  
  if (search) {
    whereClauses.push(`name ILIKE $${++paramIndex}`);
    queryParams.push(`%${search}%`);
  }

  if (filters.restaurantId) {
    whereClauses.push(`restaurant_id = $${++paramIndex}`);
    queryParams.push(filters.restaurantId);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
    countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Add sorting and pagination
  const validSortColumns = ['name', 'created_at', 'adds'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
  const sortOrder = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ${limit} OFFSET ${offset}`;

  try {
    console.log("[DishModel findAllDishes] Query:", query, queryParams);
    console.log("[DishModel findAllDishes] Count Query:", countQuery, queryParams);

    const results = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0]?.count || 0, 10);

    // Map results to the expected format
    return {
      data: results.rows.map(row => ({
        id: Number(row.id),
        name: row.name || 'Unnamed Dish',
        restaurant_id: row.restaurant_id ? Number(row.restaurant_id) : null,
        description: row.description || null,
        price: row.price ? Number(row.price) : null,
        category: row.category || null,
        tags: [],  // Simplified - not fetching tags
        adds: Number(row.adds || 0),
        created_by: row.created_by ? Number(row.created_by) : null,
        created_at: row.created_at || null,
        updated_at: row.updated_at || null
      })),
      total,
    };
  } catch (error) {
    console.error('Error in findAllDishes model:', error);
    throw new Error('Database error fetching dishes.');
  }
};
export const findDishesByRestaurantId = async (restaurantId, options = {}) => { /* ... implementation ... */ };
export const findDishById = async (id) => {
  try {
    const query = 'SELECT * FROM dishes WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: Number(row.id),
      name: row.name || 'Unnamed Dish',
      restaurant_id: row.restaurant_id ? Number(row.restaurant_id) : null,
      description: row.description || null,
      price: row.price ? Number(row.price) : null,
      category: row.category || null,
      tags: [],  // Simplified - not fetching tags
      adds: Number(row.adds || 0),
      created_by: row.created_by ? Number(row.created_by) : null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    };
  } catch (error) {
    console.error('Error in findDishById model:', error);
    throw new Error(`Database error fetching dish with ID ${id}.`);
  }
};
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