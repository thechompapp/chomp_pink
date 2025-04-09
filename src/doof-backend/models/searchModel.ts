/* src/doof-backend/models/searchModel.ts */
import db from '../db/index.js'; // Keep .js for compiled import
import type { QueryResult } from 'pg';
// Import types - assuming these are defined in your types directory
// Use .js extension if importing compiled TS files from other models directly
// Or use central types if available
import type { Restaurant } from './restaurantModel.js'; // Example, adjust if needed
import type { Dish } from './dishModel.js';       // Example, adjust if needed
import type { List } from './listModel.js';       // Example, adjust if needed

// Define the structure of the search results
export interface SearchResults {
    restaurants: Restaurant[];
    dishes: Dish[];
    lists: List[];
}

// Define expected raw row structures from DB queries if different from final types
interface RawRestaurantSearchResult extends Restaurant { /* Add/adjust fields if needed */ }
interface RawDishSearchResult extends Dish {
    restaurant_name?: string | null; // From join
}
interface RawListSearchResult extends List {
    item_count: number | string; // Count might come as string
}


// Helper to format dish search results (example, adjust as needed)
const formatDishSearchResult = (row: RawDishSearchResult): Dish => ({
    ...row,
    id: parseInt(String(row.id), 10),
    adds: row.adds != null ? parseInt(String(row.adds), 10) : 0,
    restaurant_id: parseInt(String(row.restaurant_id), 10),
    // Use the joined restaurant_name if available
    restaurant_name: row.restaurant_name ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => t !== null) : [],
    // Add aliases or other transformations if Dish type requires them
    city: row.city_name ?? null,
    neighborhood: row.neighborhood_name ?? null,
});

// Helper to format list search results (example, adjust as needed)
const formatListSearchResult = (row: RawListSearchResult): List => ({
    ...row,
     id: parseInt(String(row.id), 10),
     saved_count: row.saved_count != null ? parseInt(String(row.saved_count), 10) : 0,
     item_count: row.item_count != null ? parseInt(String(row.item_count), 10) : 0,
     is_public: row.is_public ?? true, // Default to true if null
     is_following: !!row.is_following, // Ensure boolean
     created_by_user: !!row.created_by_user, // Ensure boolean
     tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => t !== null) : [],
     type: (row.list_type || row.type || 'mixed') as List['type'], // Ensure correct type
     list_type: (row.list_type || row.type || 'mixed') as List['list_type'],
     city: row.city_name ?? null, // Alias for consistency
});

// Helper to format restaurant search results (similar to restaurantModel)
const formatRestaurantSearchResult = (row: RawRestaurantSearchResult): Restaurant => ({
    ...row,
     id: parseInt(String(row.id), 10),
     adds: row.adds != null ? parseInt(String(row.adds), 10) : 0,
     tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => t !== null) : [],
     // Add other necessary fields from Restaurant type
     city_id: row.city_id ? parseInt(String(row.city_id), 10) : null,
     neighborhood_id: row.neighborhood_id ? parseInt(String(row.neighborhood_id), 10) : null,
     latitude: row.latitude != null ? parseFloat(String(row.latitude)) : null,
     longitude: row.longitude != null ? parseFloat(String(row.longitude)) : null,
});

export const searchAll = async (
    searchTerm: string,
    limit: number = 10,
    offset: number = 0
): Promise<SearchResults> => {
    console.log(`[SearchModel] Searching for "${searchTerm}", Limit: ${limit}, Offset: ${offset}`);
    const searchPattern = `%${searchTerm}%`;

    // Restaurant Query - Fetch necessary fields for Restaurant type
    const restaurantsQuery = `
      SELECT r.*, -- Select all restaurant columns
             COALESCE((SELECT ARRAY_AGG(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = r.id), ARRAY[]::TEXT[]) as tags
      FROM Restaurants r
      WHERE r.name ILIKE $1
      ORDER BY r.adds DESC NULLS LAST, r.name ASC -- Add secondary sort
      LIMIT $2 OFFSET $3
    `;

    // Dish Query - Fetch necessary fields for Dish type, including joined restaurant name/location
    const dishesQuery = `
      SELECT d.*, -- Select all dish columns
             r.name as restaurant_name, r.city_name, r.neighborhood_name, -- Joined data
             COALESCE((SELECT ARRAY_AGG(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = d.id), ARRAY[]::TEXT[]) as tags
      FROM Dishes d
      JOIN Restaurants r ON d.restaurant_id = r.id
      WHERE d.name ILIKE $1
      ORDER BY d.adds DESC NULLS LAST, d.name ASC -- Add secondary sort
      LIMIT $2 OFFSET $3
    `;

    // List Query - Fetch necessary fields for List type
    const listsQuery = `
        SELECT l.*, -- Select all list columns
               COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count
        FROM Lists l
        WHERE l.name ILIKE $1 AND l.is_public = TRUE -- Only search public lists
        ORDER BY l.saved_count DESC NULLS LAST, l.name ASC -- Add secondary sort
        LIMIT $2 OFFSET $3
    `;

    try {
        // Execute queries concurrently
        const [restaurantsResult, dishesResult, listsResult] = await Promise.all([
            db.query<RawRestaurantSearchResult>(restaurantsQuery, [searchPattern, limit, offset]),
            db.query<RawDishSearchResult>(dishesQuery, [searchPattern, limit, offset]),
            db.query<RawListSearchResult>(listsQuery, [searchPattern, limit, offset]),
        ]);

        // Format results using helper functions and filter out nulls from formatting errors
        const formattedRestaurants = (restaurantsResult.rows || [])
            .map(formatRestaurantSearchResult)
            .filter((r): r is Restaurant => r !== null);

        const formattedDishes = (dishesResult.rows || [])
            .map(formatDishSearchResult)
            .filter((d): d is Dish => d !== null);

        const formattedLists = (listsResult.rows || [])
            .map(formatListSearchResult)
            .filter((l): l is List => l !== null);

        return {
            restaurants: formattedRestaurants,
            dishes: formattedDishes,
            lists: formattedLists,
        };
    } catch (error) {
        console.error(`[SearchModel searchAll] Error executing search for "${searchTerm}":`, error);
        throw error; // Re-throw error for handler
    }
};