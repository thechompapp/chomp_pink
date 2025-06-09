// Filename: /root/doof-backend/controllers/searchController.js
/* REFACTORED: Convert to ES Modules */
import { query, validationResult } from 'express-validator'; // Import validator tools
import * as SearchModel from '../models/searchModel.js';
import { formatRestaurant, formatDish, formatList } from '../utils/formatters.js'; // Kept for potential future use
import config from '../config/config.js'; // Import config for defaults

// Validation middleware for performSearch
// Matches frontend FilterPanel and Results component parameters
export const validatePerformSearch = [
  query('q').optional().isString().trim().withMessage('Search query must be a string.'),
  query('type').optional().isIn(['all', 'restaurants', 'dishes', 'lists']).withMessage('Invalid search type specified.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100.'),
  query('offset').optional().isInt({ min: 0 }).toInt().withMessage('Offset must be a non-negative integer.'),
  query('cityId').optional().isInt({ min: 1 }).toInt().withMessage('City ID must be a positive integer.'),
  query('boroughId').optional().isInt({ min: 1 }).toInt().withMessage('Borough ID must be a positive integer.'),
  query('neighborhoodId').optional().isInt({ min: 1 }).toInt().withMessage('Neighborhood ID must be a positive integer.'),
  // Validate hashtags as an array of strings (sent as repeated query params)
  query('hashtags').optional().toArray().isArray().withMessage('Hashtags must be provided as an array (e.g., hashtags=tag1&hashtags=tag2).'),
  query('hashtags.*').optional().isString().trim().toLowerCase().withMessage('Each hashtag must be a string.'),
];


// Controller to perform a general search
export const performSearch = async (req, res, next) => {
    // Run validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Extract validated and sanitized parameters
    const {
        q: query, // Rename q to query for model clarity
        type = 'all',
        limit = config.DEFAULT_PAGE_LIMIT ?? 10, // Use config default
        offset = 0,
        cityId,
        boroughId,
        neighborhoodId,
        hashtags = [], // Default to empty array if not provided
    } = req.query;

    const userId = req.user?.id; // Get userId from optionalAuth middleware

    try {
        const searchParams = {
            query,
            type,
            limit,
            offset,
            cityId,
            boroughId,
            neighborhoodId,
            hashtags, // Pass validated array
            userId,
        };

        console.log('[searchController] Performing search with params:', searchParams); // Debug log

        const searchResults = await SearchModel.performSearch(searchParams);

        // The model now returns the final structure with totals
        // { restaurants: [], dishes: [], lists: [], totalRestaurants: X, totalDishes: Y, totalLists: Z }
        res.json({
            success: true,
            message: 'Search completed successfully.',
            // Directly pass the structured data from the model
            data: searchResults
        });
    } catch (error) {
        console.error('[searchController] Search Error:', error);
        // Pass error to the global error handler
        next(error);
    }
};