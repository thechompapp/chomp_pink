// Filename: /root/doof-backend/controllers/neighborhoodController.js
/* REFACTORED: Convert to ES Modules */
import * as NeighborhoodModel from '../models/neighborhoodModel.js'; // Use namespace import
import { formatNeighborhood } from '../utils/formatters.js'; // Named import (if needed, model might format)
import { validationResult } from 'express-validator';
import config from '../config/config.js';

// Controller to get all neighborhoods
export const getAllNeighborhoods = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const { city_id, page = 1, limit = 1000, sort = 'name', order = 'asc' } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const offset = (pageNum - 1) * limitNum;
    try {
        // Assuming model function handles filtering/pagination
        const results = await NeighborhoodModel.getAllNeighborhoods(limitNum, offset, sort, order, null, city_id); // Pass city_id
        res.json({ success: true, message: 'Neighborhoods retrieved successfully.', data: results.neighborhoods, pagination: { total: results.total, page: pageNum, limit: limitNum } });
    } catch (error) { next(error); }
};

// Add other controllers (getById, create, update, delete) if needed for public API