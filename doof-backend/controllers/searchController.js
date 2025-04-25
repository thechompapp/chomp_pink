// Filename: /root/doof-backend/controllers/searchController.js
/* REFACTORED: Convert to ES Modules */
import * as SearchModel from '../models/searchModel.js'; // Use namespace import
import { formatRestaurant, formatDish, formatList } from '../utils/formatters.js'; // Named import

// Controller to perform a general search
export const performSearch = async (req, res, next) => {
    const { q = '', type = 'all', limit = 10, city, neighborhood, cuisine } = req.query;
    const userId = req.user?.id;
    const limitNum = parseInt(String(limit), 10);
    if (isNaN(limitNum) || limitNum < 1) { return res.status(400).json({ success: false, message: 'Invalid limit parameter.' }); }

    try {
        const searchParams = { query: q, type, limit: limitNum, city, neighborhood, cuisine, userId, };
        const searchResults = await SearchModel.performSearch(searchParams); // Call via namespace

        // Formatting should be handled by the model now, just return results
        res.json({ success: true, message: 'Search completed successfully.', data: searchResults });
    } catch (error) { next(error); }
};