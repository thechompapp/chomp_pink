// Filename: /root/doof-backend/controllers/restaurantController.js
/* REFACTORED: Convert to ES Modules (named exports) */
import * as RestaurantModel from '../models/restaurantModel.js'; // Use namespace import for model functions
import { formatRestaurant, formatDish, formatList } from '../utils/formatters.js'; // Named imports
import config from '../config/config.js'; // Default import
import { validationResult } from 'express-validator'; // Named import

// Placeholder logger if logger utility isn't converted yet
const logToDatabase = (level, message, details) => {
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
};

const handleControllerError = (res, error, message, statusCode = 500) => {
    logToDatabase('error', `${message}: ${error.message || error}`, { error });
    console.error(message, error);
    let userMessage = error.message || 'Unknown server error.';
     if (error.message?.includes('not found') || error?.status === 404) { // Check status if available
         statusCode = 404;
         userMessage = error.message;
     } else if (error.message?.includes('Invalid reference') || error.code === '23503') {
          statusCode = 400;
          userMessage = error.message;
     } else if (error.message?.includes('already exists') || error.code === '23505') {
         statusCode = 409; // Conflict
         userMessage = error.message;
     }
    res.status(statusCode).json({ success: false, message: userMessage });
};


// Controller to get all restaurants
export const getAllRestaurants = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return; } // Middleware sent response

    const {
        page = 1, limit = config.DEFAULT_PAGE_LIMIT ?? 20, sort = 'name', order = 'asc', search = '', city_id, neighborhood_id, cuisine,
    } = req.query;

    const options = {
        limit: Number(limit), offset: (Number(page) - 1) * Number(limit), sortBy: sort, sortDirection: order, search: search, filters: {}
    };
    if (city_id) options.filters.cityId = Number(city_id);
    if (neighborhood_id) options.filters.neighborhoodId = Number(neighborhood_id);
    if (cuisine) options.filters.cuisine = cuisine;

    try {
        const results = await RestaurantModel.findAllRestaurants(options); // Use model function via namespace
        const totalItems = results.total || 0;
        const totalPages = Math.ceil(totalItems / options.limit);
        res.json({
            success: true, message: 'Restaurants retrieved successfully.', data: results.data,
            pagination: { currentPage: Number(page), totalPages: totalPages, totalItems: totalItems, itemsPerPage: options.limit, },
        });
    } catch (error) { next(error); } // Pass to global handler
};

// Controller to get a single restaurant by ID
export const getRestaurantById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return; }

    const { id } = req.params;
    const restaurantId = parseInt(id, 10);

    try {
        const restaurant = await RestaurantModel.findRestaurantById(restaurantId); // Use model function via namespace
        if (!restaurant) { return res.status(404).json({ success: false, message: `Restaurant with ID ${restaurantId} not found.` }); }
        res.json({ success: true, message: 'Restaurant details retrieved successfully.', data: restaurant });
    } catch (error) { next(error); }
};

// Add other controller functions using named exports
export const createRestaurant = async (req, res, next) => {
    // Add validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    try {
        const newRestaurant = await RestaurantModel.createRestaurant(req.body);
        res.status(201).json({ success: true, data: newRestaurant });
    } catch (error) { handleControllerError(res, error, 'Error creating restaurant'); } // Use helper
};

export const updateRestaurant = async (req, res, next) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
     const { id } = req.params;
     try {
         const updatedRestaurant = await RestaurantModel.updateRestaurant(id, req.body);
         if (!updatedRestaurant) return res.status(404).json({ success: false, message: `Restaurant with ID ${id} not found.` });
         res.json({ success: true, data: updatedRestaurant });
     } catch (error) { handleControllerError(res, error, `Error updating restaurant ${id}`); }
};

export const deleteRestaurant = async (req, res, next) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
     const { id } = req.params;
     try {
         const deleted = await RestaurantModel.deleteRestaurant(id);
         if (!deleted) return res.status(404).json({ success: false, message: `Restaurant with ID ${id} not found.` });
         res.status(200).json({ success: true, message: 'Restaurant deleted successfully.' }); // Send success message instead of 204
     } catch (error) { handleControllerError(res, error, `Error deleting restaurant ${id}`); }
};