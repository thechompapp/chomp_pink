// Filename: /root/doof-backend/controllers/trendingController.js
/* REFACTORED: Convert to ES Modules */
import * as TrendingModel from '../models/trending.js';
import { formatRestaurant, formatDish, formatList } from '../utils/formatters.js';
import config from '../config/config.js';

export const getTrendingItems = async (req, res, next) => {
    const { type } = req.params;
    const { limit = 5 } = req.query;
    const userId = req.user?.id;
    const limitNum = parseInt(String(limit), 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return res.status(400).json({ success: false, message: 'Invalid limit parameter.' });
    }
    try {
        let trendingItems;
        let formattedItems;
        switch (type) {
            case 'restaurants':
                trendingItems = await TrendingModel.getTrendingRestaurants(limitNum);
                formattedItems = Array.isArray(trendingItems) ? trendingItems.map(formatRestaurant) : [];
                break;
            case 'dishes':
                trendingItems = await TrendingModel.getTrendingDishes(limitNum);
                formattedItems = Array.isArray(trendingItems) ? trendingItems.map(formatDish) : [];
                break;
            case 'lists':
                trendingItems = await TrendingModel.getTrendingLists(userId, limitNum);
                formattedItems = Array.isArray(trendingItems) ? trendingItems.map(formatList) : [];
                break;
            default:
                return res.status(400).json({ success: false, message: `Invalid trending type: ${type}` });
        }
        res.json({ success: true, message: `Trending ${type} retrieved successfully.`, data: formattedItems });
    } catch (error) {
        next(error);
    }
};