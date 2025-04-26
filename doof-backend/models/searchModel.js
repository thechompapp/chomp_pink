// Filename: /root/doof-backend/models/searchModel.js
/* REFACTORED: Convert to ES Modules (named exports) */
/* REFACTORED: Simplify parameter handling in restaurant search */
import db from '../db/index.js';
import { formatRestaurant, formatDish, formatList } from '../utils/formatters.js';
import format from 'pg-format'; // pg-format might be useful for dynamic queries/IN clauses
// Ensure listModel is imported for list searching later
import { findListsByUser } from './listModel.js';


// Helper to build common filter conditions, returning named parameters for clarity
const buildFilterClauses = (filters, paramObj) => {
    const conditions = [];

    if (filters.cityId) {
        // Use || for OR conditions across different tables (restaurants direct vs via dish)
        conditions.push(`(r.city_id = :cityId OR r_dish.city_id = :cityId)`);
        paramObj.cityId = parseInt(filters.cityId, 10);
    }
    if (filters.neighborhoodId) {
        conditions.push(`(r.neighborhood_id = :neighborhoodId OR r_dish.neighborhood_id = :neighborhoodId)`);
        paramObj.neighborhoodId = parseInt(filters.neighborhoodId, 10);
    }

    // Hashtags filtering - assumes JOINs are handled in the calling query
    if (Array.isArray(filters.hashtags) && filters.hashtags.length > 0) {
        const cleanHashtags = filters.hashtags
            .filter(tag => typeof tag === 'string' && tag.trim())
            .map(tag => tag.trim().toLowerCase());
        if (cleanHashtags.length > 0) {
            // Using = ANY for array matching
            conditions.push(`h.name = ANY(:hashtags)`);
            paramObj.hashtags = cleanHashtags;
        }
    }

    return conditions; // Return only the condition strings
};


// performSearch function (uses named exports)
export const performSearch = async ({ query, limit = 10, offset = 0, type = 'all', cityId, neighborhoodId, hashtags = [], userId }) => {
    const numericUserId = userId ? parseInt(userId, 10) : null;
    const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

    const results = {
        restaurants: [],
        dishes: [],
        lists: [],
        totalRestaurants: 0,
        totalDishes: 0,
        totalLists: 0,
    };

    // Prepare base parameters object for named parameters if your DB driver supports it,
    // otherwise stick to positional ($1, $2) but manage index carefully.
    // Using positional for now as node-postgres commonly uses it.
    const baseParams = [];
    let paramIndex = 1;

    // Add userId first if needed for specific checks (like list following)
    baseParams.push(numericUserId); // $1 = userId (or null)

    // === RESTAURANT SEARCH ===
    if (type === 'all' || type === 'restaurants') {
        let restaurantParams = [];
        let currentParamIndex = 1; // Reset index for this specific query
        const conditions = ['TRUE']; // Start with a base condition

        let restaurantQuery = `
            SELECT DISTINCT -- Use DISTINCT due to potential hashtag joins
                r.*,
                COUNT(*) OVER() AS total_count
            FROM Restaurants r
            LEFT JOIN Neighborhoods n ON r.neighborhood_id = n.id
            LEFT JOIN Cities c ON r.city_id = c.id
            LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
            LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
        `; // WHERE clause built dynamically

        if (query) {
            conditions.push(`(r.name ILIKE $${currentParamIndex} OR r.description ILIKE $${currentParamIndex})`);
            restaurantParams.push(`%${query}%`);
            currentParamIndex++;
        }
        if (cityId) {
            conditions.push(`r.city_id = $${currentParamIndex}`);
            restaurantParams.push(parseInt(cityId, 10));
            currentParamIndex++;
        }
        if (neighborhoodId) {
            conditions.push(`r.neighborhood_id = $${currentParamIndex}`);
            restaurantParams.push(parseInt(neighborhoodId, 10));
            currentParamIndex++;
        }
        if (Array.isArray(hashtags) && hashtags.length > 0) {
            const cleanHashtags = hashtags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim().toLowerCase());
            if (cleanHashtags.length > 0) {
                conditions.push(`h.name = ANY($${currentParamIndex}::text[])`);
                restaurantParams.push(cleanHashtags);
                currentParamIndex++;
            }
        }

        restaurantQuery += ` WHERE ${conditions.join(' AND ')}`;
        restaurantQuery += ` ORDER BY r.name ASC `; // Or relevance score
        restaurantQuery += ` LIMIT $${currentParamIndex++} OFFSET $${currentParamIndex++}`;
        restaurantParams.push(safeLimit, safeOffset);

        try {
            // console.log("Restaurant Query:", restaurantQuery); // Debugging SQL
            // console.log("Restaurant Params:", restaurantParams); // Debugging Params
            const res = await db.query(restaurantQuery, restaurantParams);
            // Since we used DISTINCT, total_count applies correctly to unique restaurants found
             results.restaurants = (res.rows || []).map(formatRestaurant);
             results.totalRestaurants = res.rows.length > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
             // If DISTINCT prevents total_count OVER(), run a separate count query
             if (res.rows.length > 0 && results.totalRestaurants === 0) {
                 // This indicates total_count might not work with DISTINCT as expected in all PG versions/scenarios
                 // Fallback: Run a separate count query without LIMIT/OFFSET but with same WHERE
                 let countQuery = `SELECT COUNT(DISTINCT r.id) as total FROM Restaurants r LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id LEFT JOIN Hashtags h ON rh.hashtag_id = h.id WHERE ${conditions.join(' AND ')}`;
                 // Remove LIMIT/OFFSET params for count query
                 const countParams = restaurantParams.slice(0, -2);
                 const countRes = await db.query(countQuery, countParams);
                 results.totalRestaurants = parseInt(countRes.rows[0]?.total || '0', 10);
             }


        } catch (error) {
            console.error("[searchModel performSearch] Error searching restaurants:", error);
            console.error("Failed Query (Restaurants):", restaurantQuery);
            console.error("Failed Params (Restaurants):", restaurantParams);
            throw new Error(`DB error searching restaurants: ${error.message}`);
        }
    }

    // === DISH SEARCH ===
    if (type === 'all' || type === 'dishes') {
       let dishParams = [];
       let currentParamIndex = 1;
       const conditions = ['TRUE'];

        let dishQuery = `
            SELECT DISTINCT -- Use DISTINCT due to potential hashtag joins
                d.*,
                r_dish.id as restaurant_id,
                r_dish.name as restaurant_name,
                r_dish.city_id as city_id, -- Include for potential display/filtering
                r_dish.neighborhood_id as neighborhood_id, -- Include for potential display/filtering
                COUNT(*) OVER() AS total_count
            FROM Dishes d
            JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id -- Essential join for context/filtering
            LEFT JOIN Neighborhoods n ON r_dish.neighborhood_id = n.id
            LEFT JOIN Cities c ON r_dish.city_id = c.id
            LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
            LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        `; // WHERE clause built dynamically

        if (query) {
            conditions.push(`(d.name ILIKE $${currentParamIndex} OR d.description ILIKE $${currentParamIndex} OR r_dish.name ILIKE $${currentParamIndex})`);
            dishParams.push(`%${query}%`);
            currentParamIndex++;
        }
        if (cityId) {
             conditions.push(`r_dish.city_id = $${currentParamIndex}`);
            dishParams.push(parseInt(cityId, 10));
            currentParamIndex++;
        }
        if (neighborhoodId) {
            conditions.push(`r_dish.neighborhood_id = $${currentParamIndex}`);
            dishParams.push(parseInt(neighborhoodId, 10));
            currentParamIndex++;
        }
         if (Array.isArray(hashtags) && hashtags.length > 0) {
            const cleanHashtags = hashtags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim().toLowerCase());
            if (cleanHashtags.length > 0) {
                conditions.push(`h.name = ANY($${currentParamIndex}::text[])`);
                dishParams.push(cleanHashtags);
                currentParamIndex++;
            }
        }

        dishQuery += ` WHERE ${conditions.join(' AND ')}`;
        dishQuery += ` ORDER BY d.name ASC `; // Or relevance score
        dishQuery += ` LIMIT $${currentParamIndex++} OFFSET $${currentParamIndex++}`;
        dishParams.push(safeLimit, safeOffset);

        try {
            // console.log("Dish Query:", dishQuery); // Debugging SQL
            // console.log("Dish Params:", dishParams); // Debugging Params
            const res = await db.query(dishQuery, dishParams);
             results.dishes = (res.rows || []).map(formatDish);
             results.totalDishes = res.rows.length > 0 ? parseInt(res.rows[0].total_count, 10) : 0;
              // Fallback count query if needed (similar to restaurants)
             if (res.rows.length > 0 && results.totalDishes === 0) {
                  let countQuery = `SELECT COUNT(DISTINCT d.id) as total FROM Dishes d JOIN Restaurants r_dish ON d.restaurant_id = r_dish.id LEFT JOIN DishHashtags dh ON d.id = dh.dish_id LEFT JOIN Hashtags h ON dh.hashtag_id = h.id WHERE ${conditions.join(' AND ')}`;
                  const countParams = dishParams.slice(0, -2);
                  const countRes = await db.query(countQuery, countParams);
                  results.totalDishes = parseInt(countRes.rows[0]?.total || '0', 10);
             }

        } catch (error) {
            console.error("[searchModel performSearch] Error searching dishes:", error);
            console.error("Failed Query (Dishes):", dishQuery);
            console.error("Failed Params (Dishes):", dishParams);
            throw new Error(`DB error searching dishes: ${error.message}`);
        }
    }


    // === LIST SEARCH ===
    if (type === 'all' || type === 'lists') {
        try {
            const listOptions = {
                allLists: true, // Search public lists
                limit: safeLimit,
                offset: safeOffset,
                cityId,
                neighborhoodId,
                query,
                hashtags
            };
             // Call findListsByUser from the imported listModel
             const listResult = await findListsByUser(numericUserId, listOptions);
             results.lists = listResult.data || [];
             results.totalLists = listResult.total || 0;

        } catch (error) {
            console.error("[searchModel performSearch] Error searching lists via listModel:", error);
            // Don't throw, just report 0 results for lists in case of partial failure
            results.lists = [];
            results.totalLists = 0;
        }
    }

    return results;
};


// Optional default export if needed elsewhere, but named export is primary
// const SearchModel = { performSearch };
// export default SearchModel;