/**
 * Simplified Restaurant Controller
 * 
 * This is a simplified version of the restaurant controller that works with
 * our database schema for E2E testing.
 */

import * as RestaurantModel from '../models/simplified-restaurantModel.js';

/**
 * Get all restaurants with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllRestaurants = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      order,
      search
    };
    
    const result = await RestaurantModel.findAllRestaurants(options);
    
    res.status(200).json({
      success: true,
      data: {
        restaurants: result.restaurants,
        pagination: {
          total: result.total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(result.total / options.limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getAllRestaurants controller:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Get a restaurant by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID'
      });
    }
    
    const restaurant = await RestaurantModel.findRestaurantById(parseInt(id, 10));
    
    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error(`Error in getRestaurantById controller for ID ${req.params.id}:`, error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Create a new restaurant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createRestaurant = async (req, res) => {
  try {
    const { name, description, address, cuisine, price_range } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant name is required'
      });
    }
    
    // Get user ID from authenticated user if available
    const created_by = req.user ? req.user.id : null;
    
    const restaurantData = {
      name,
      description,
      address,
      cuisine,
      price_range,
      created_by
    };
    
    const restaurant = await RestaurantModel.createRestaurant(restaurantData);
    
    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant
    });
  } catch (error) {
    console.error('Error in createRestaurant controller:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Update a restaurant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, cuisine, price_range } = req.body;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID'
      });
    }
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (cuisine !== undefined) updateData.cuisine = cuisine;
    if (price_range !== undefined) updateData.price_range = price_range;
    
    const restaurant = await RestaurantModel.updateRestaurant(parseInt(id, 10), updateData);
    
    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: restaurant
    });
  } catch (error) {
    console.error(`Error in updateRestaurant controller for ID ${req.params.id}:`, error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};

/**
 * Delete a restaurant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID'
      });
    }
    
    await RestaurantModel.deleteRestaurant(parseInt(id, 10));
    
    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error(`Error in deleteRestaurant controller for ID ${req.params.id}:`, error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      error: {
        type: error.constructor.name,
        stack: error.stack
      }
    });
  }
};
