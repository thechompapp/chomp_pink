// Filename: /root/doof-backend/controllers/dishController.js
/* REFACTORED: Convert to ES Modules (named exports) */
import * as DishModel from '../models/dishModel.js'; // Use namespace import
import { formatDish } from '../utils/formatters.js'; // Use named import
import { validationResult } from 'express-validator';
import config from '../config/config.js';

// Controller to get all dishes
export const getAllDishes = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return; } // Middleware sent response

    const {
        page = 1, limit = config.DEFAULT_PAGE_LIMIT ?? 20, sort = 'name', order = 'asc', search = '', restaurant_id, cuisine,
    } = req.query;

    const options = {
        limit: Number(limit), offset: (Number(page) - 1) * Number(limit), sortBy: sort, sortDirection: order, search: search, filters: {}
    };
    if (restaurant_id) { const numRestId = parseInt(String(restaurant_id), 10); if (!isNaN(numRestId)) options.filters.restaurantId = numRestId; else return res.status(400).json({ success: false, message: 'Invalid restaurant_id filter.' }); }
    if (cuisine) options.filters.cuisine = cuisine;

    try {
        const results = await DishModel.findAllDishes(options); // Call via namespace
        // Assuming model now returns formatted data
        const totalItems = results.total || 0;
        const totalPages = Math.ceil(totalItems / options.limit);
        res.json({
            success: true, message: 'Dishes retrieved successfully.', data: results.data,
            pagination: { currentPage: Number(page), totalPages: totalPages, totalItems: totalItems, itemsPerPage: options.limit, },
        });
    } catch (error) { next(error); }
};

// Controller to get a single dish by ID
export const getDishById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return; }

    const { id } = req.params;
    const dishId = parseInt(id, 10);

    try {
        const dish = await DishModel.findDishById(dishId); // Call via namespace
        if (!dish) { return res.status(404).json({ success: false, message: `Dish with ID ${dishId} not found.` }); }
        res.json({ success: true, message: 'Dish details retrieved successfully.', data: dish });
    } catch (error) { next(error); }
};

// Add other controller functions using named exports
// export const createDish = async (req, res, next) => { ... };
// export const updateDish = async (req, res, next) => { ... };
// export const deleteDish = async (req, res, next) => { ... };