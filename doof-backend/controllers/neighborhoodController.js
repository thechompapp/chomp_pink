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

// Controller to get neighborhoods by zipcode
export const getNeighborhoodsByZipcode = async (req, res, next) => {
    const { zipcode } = req.params;
    
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid zipcode format. Must be 5 digits.' 
        });
    }
    
    try {
        const neighborhoods = await NeighborhoodModel.getNeighborhoodsByZipcode(zipcode);
        
        if (!neighborhoods || neighborhoods.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `No neighborhoods found for zipcode: ${zipcode}` 
            });
        }
        
        // Format neighborhoods if needed
        const formattedNeighborhoods = neighborhoods.map(formatNeighborhood);
        
        res.json(formattedNeighborhoods);
    } catch (error) {
        console.error(`Error finding neighborhoods by zipcode ${zipcode}:`, error);
        next(error);
    }
};

// Controller to get boroughs by city
export const getBoroughsByCity = async (req, res, next) => {
    const { city_id } = req.params;
    
    if (!city_id || isNaN(city_id)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid city_id. Must be a number.' 
        });
    }
    
    try {
        const boroughs = await NeighborhoodModel.getBoroughsByCity(parseInt(city_id, 10));
        
        if (!boroughs || boroughs.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `No boroughs found for city_id: ${city_id}` 
            });
        }
        
        res.json({
            success: true,
            data: boroughs
        });
    } catch (error) {
        console.error(`Error finding boroughs by city ${city_id}:`, error);
        next(error);
    }
};

// Controller to get neighborhoods by parent
export const getNeighborhoodsByParent = async (req, res, next) => {
    const { parent_id } = req.params;
    
    if (!parent_id || isNaN(parent_id)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid parent_id. Must be a number.' 
        });
    }
    
    try {
        const neighborhoods = await NeighborhoodModel.getNeighborhoodsByParent(parseInt(parent_id, 10));
        
        if (!neighborhoods || neighborhoods.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `No neighborhoods found for parent_id: ${parent_id}` 
            });
        }
        
        res.json({
            success: true,
            data: neighborhoods
        });
    } catch (error) {
        console.error(`Error finding neighborhoods by parent ${parent_id}:`, error);
        next(error);
    }
};