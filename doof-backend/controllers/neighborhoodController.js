// Filename: /root/doof-backend/controllers/neighborhoodController.js
/* REFACTORED: Convert to ES Modules */
import * as NeighborhoodModel from '../models/neighborhoodModel.js'; // Use namespace import
import { formatNeighborhood } from '../utils/formatters.js'; // Named import (if needed, model might format)
import { validationResult } from 'express-validator';
import config from '../config/config.js';
import { logDebug, logError } from '../utils/logger.js';
import db from '../db/index.js';

/**
 * Get all neighborhoods with basic information, structured hierarchically.
 */
export const getAllNeighborhoods = async (req, res, next) => {
  try {
    logDebug('[NeighborhoodController] Getting all neighborhoods with aggregated counts and hierarchical structure');
    
    const query = `
      SELECT 
        n.id,
        n.name,
        n.city_id,
        c.name as city_name,
        n.parent_id,
        n.zipcode_ranges,
        n.location_level,
        COALESCE(rc.restaurant_count, 0) as restaurant_count
      FROM 
        neighborhoods n
      LEFT JOIN 
        cities c ON n.city_id = c.id
      LEFT JOIN
        (SELECT neighborhood_id, COUNT(*) as restaurant_count FROM restaurants GROUP BY neighborhood_id) rc
      ON 
        n.id = rc.neighborhood_id
      WHERE 
        n.city_id = 10 -- NYC only
      ORDER BY 
        n.location_level, n.name ASC;
    `;
    
    const { rows } = await db.query(query);
    
    // Build the hierarchy
    const hierarchy = [];
    const map = new Map();

    // First pass: add all nodes to the map
    rows.forEach(row => {
      map.set(row.id, { ...row, children: [] });
    });

    // Second pass: build the hierarchy
    rows.forEach(row => {
      if (row.parent_id) {
        const parent = map.get(row.parent_id);
        if (parent) {
          parent.children.push(map.get(row.id));
        }
      } else {
        // This is a root node (a borough or top-level location)
        hierarchy.push(map.get(row.id));
      }
    });

    // Set Caching Headers to prevent 304 responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    res.status(200).json(hierarchy);

  } catch (error) {
    logError('Error in getAllNeighborhoods:', error);
    next(error); // Pass error to the centralized error handler
  }
};

/**
 * Get neighborhood details by ID
 */
export const getNeighborhoodById = async (req, res) => {
  try {
    const { id } = req.params;
    logDebug(`[NeighborhoodController] Getting neighborhood ${id}`);
    
    const query = `
      SELECT 
        n.id,
        n.name,
        n.city_id,
        c.name as city_name,
        COUNT(r.id) as restaurant_count
      FROM neighborhoods n
      LEFT JOIN cities c ON n.city_id = c.id
      LEFT JOIN restaurants r ON n.id = r.neighborhood_id
      WHERE n.id = $1
      GROUP BY n.id, n.name, n.city_id, c.name
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Neighborhood not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Neighborhood retrieved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logError('Error in getNeighborhoodById:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve neighborhood',
      error: error.message
    });
  }
};

/**
 * Get restaurants in a specific neighborhood
 */
export const getNeighborhoodRestaurants = async (req, res) => {
  try {
    const { neighborhoodId } = req.params; // Changed from id to neighborhoodId for clarity
    const { page = 1, limit = 50, cuisine, price } = req.query; // Added filters

    logDebug(`[NeighborhoodController] Getting restaurants for neighborhood ${neighborhoodId}`);

    const offset = (page - 1) * limit;

    // Base query
    let query = `
        SELECT 
            r.id,
            r.name,
            r.address,
            r.latitude,
            r.longitude,
            r.phone,
            r.website,
            r.created_at,
            r.updated_at,
            n.name AS neighborhood,
            c.name AS city
        FROM restaurants r
        JOIN neighborhoods n ON r.neighborhood_id = n.id
        JOIN cities c ON r.city_id = c.id
    `;
    
    let countQuery = `
        SELECT COUNT(*) as total
        FROM restaurants r
    `;
    
    // Recursive CTE to find all child neighborhood IDs
    const recursiveQueryPart = `
      WITH RECURSIVE sub_neighborhoods AS (
        SELECT id FROM neighborhoods WHERE id = $1
        UNION
        SELECT n.id FROM neighborhoods n INNER JOIN sub_neighborhoods s ON n.parent_id = s.id
      )
      SELECT id FROM sub_neighborhoods
    `;
    
    const neighborhoodIdsResult = await db.query(recursiveQueryPart, [neighborhoodId]);
    const neighborhoodIds = neighborhoodIdsResult.rows.map(row => row.id);

    // Dynamic WHERE clause
    const whereClauses = [`r.neighborhood_id = ANY($1)`];
    const queryParams = [neighborhoodIds];
    
    if (cuisine) {
        queryParams.push(cuisine);
        whereClauses.push(`r.cuisine_type = $${queryParams.length}`);
    }
    if (price) {
        queryParams.push(price);
        whereClauses.push(`r.price_range = $${queryParams.length}`);
    }

    const whereString = `WHERE ${whereClauses.join(' AND ')}`;
    query += ` ${whereString} ORDER BY r.name ASC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    countQuery += ` ${whereString}`;

    // Add limit and offset to main query params
    const mainQueryParams = [...queryParams, limit, offset];

    // Execute queries
    const [restaurantsResult, countResult] = await Promise.all([
      db.query(query, mainQueryParams),
      db.query(countQuery, queryParams)
    ]);
    
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
        success: true,
        message: 'Neighborhood restaurants retrieved successfully.',
        restaurants: restaurantsResult.rows,
        pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            totalPages
        }
    });

  } catch (error) {
    logError('Error in getNeighborhoodRestaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve neighborhood restaurants',
      error: error.message,
    });
  }
};

/**
 * Search neighborhoods by name
 */
export const searchNeighborhoods = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    logDebug(`[NeighborhoodController] Searching neighborhoods with query: ${q}`);
    
    const query = `
      SELECT 
        n.id,
        n.name,
        n.city_id,
        c.name as city_name,
        COUNT(r.id) as restaurant_count
      FROM neighborhoods n
      LEFT JOIN cities c ON n.city_id = c.id
      LEFT JOIN restaurants r ON n.id = r.neighborhood_id
      WHERE LOWER(n.name) LIKE LOWER($1)
      GROUP BY n.id, n.name, n.city_id, c.name
      ORDER BY n.name ASC
      LIMIT 20
    `;
    
    const result = await db.query(query, [`%${q.trim()}%`]);
    
    res.status(200).json({
      success: true,
      message: 'Neighborhood search completed',
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logError('Error in searchNeighborhoods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search neighborhoods',
      error: error.message
    });
  }
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