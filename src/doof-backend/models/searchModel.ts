/* src/doof-backend/models/searchModel.ts */
import db from '../db/index.js'; // Corrected import path
import type { QueryResult, QueryResultRow } from 'pg';
// Corrected imports - Add .js extension back
import type { Restaurant } from './restaurantModel.js';
import type { Dish } from './dishModel.js';
import type { List } from './listModel.js';

export interface SearchResults {
    restaurants: Restaurant[];
    dishes: Dish[];
    lists: List[];
}

// Define Raw types using intersection for better compatibility
// Base Restaurant type already includes expected fields
type RawRestaurantSearchResult = Restaurant & QueryResultRow;

// Combine base Dish with additional fields from the search query result
type RawDishSearchResult = Dish & QueryResultRow & {
    restaurant_name?: string | null;
};

// Combine base List with additional fields from the search query result
type RawListSearchResult = List & QueryResultRow & {
    item_count: number | string; // From the COUNT(*) subquery
};


// --- Formatters ---

const formatDishSearchResult = (row: RawDishSearchResult | undefined): Dish | null => {
    if (!row || row.id == null) return null;
    try {
        return {
            id: Number(row.id),
            name: row.name || 'Unnamed Dish', // Use base type property
            adds: row.adds != null ? Number(row.adds) : 0, // Use base type property
            created_at: row.created_at, // Use base type property
            restaurant_id: Number(row.restaurant_id), // Use base type property
            restaurant_name: row.restaurant_name ?? undefined, // From intersection
            city_name: row.city_name || undefined, // From base type
            neighborhood_name: row.neighborhood_name || undefined, // From base type
            tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === 'string' && t !== null) : [], // Use base type property
            city: row.city_name ?? null, // Use base type property
            neighborhood: row.neighborhood_name ?? null, // Use base type property
        };
    } catch (e) {
        console.error(`[SearchModel formatDishSearchResult Error] Failed to format row:`, row, e);
        return null;
    }
};

const formatListSearchResult = (row: RawListSearchResult | undefined): List | null => {
     if (!row || row.id == null) return null;
     try {
        return {
            id: Number(row.id),
            user_id: row.user_id ? Number(row.user_id) : null, // From base type
            name: row.name || 'Unnamed List', // From base type
            description: row.description ?? null, // From base type
            tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === 'string' && t !== null) : [], // From base type
            is_public: row.is_public ?? true, // From base type
            is_following: !!row.is_following, // From base type
            created_by_user: !!row.created_by_user, // From base type
            item_count: row.item_count != null ? Number(row.item_count) : 0, // From intersection
            saved_count: row.saved_count != null ? Number(row.saved_count) : 0, // From base type
            type: (row.list_type || row.type || 'mixed') as List['type'], // From base type
            list_type: (row.list_type || row.type || 'mixed') as List['list_type'], // From base type
            creator_handle: row.creator_handle ?? null, // From base type
            created_at: row.created_at, // From base type
            updated_at: row.updated_at, // From base type
            city_name: row.city_name ?? null, // From base type
            city: row.city_name ?? null, // Alias from base type
        };
     } catch (e) {
        console.error(`[SearchModel formatListSearchResult Error] Failed to format row:`, row, e);
        return null;
    }
};

const formatRestaurantSearchResult = (row: RawRestaurantSearchResult | undefined): Restaurant | null => {
     if (!row || row.id == null) return null;
     try {
        return {
            ...row, // Spread base properties
            id: Number(row.id),
            adds: row.adds != null ? Number(row.adds) : 0,
            tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === 'string' && t !== null) : [],
            city_id: row.city_id ? Number(row.city_id) : null,
            neighborhood_id: row.neighborhood_id ? Number(row.neighborhood_id) : null,
            latitude: row.latitude != null ? Number(row.latitude) : null,
            longitude: row.longitude != null ? Number(row.longitude) : null,
        };
    } catch (e) {
        console.error(`[SearchModel formatRestaurantSearchResult Error] Failed to format row:`, row, e);
        return null;
    }
};

export const searchAll = async (
    searchTerm: string,
    limit: number = 10,
    offset: number = 0
): Promise<SearchResults> => {
    console.log(`[SearchModel] Searching for "${searchTerm}", Limit: ${limit}, Offset: ${offset}`);
    const searchPattern = `%${searchTerm}%`;

    // Queries remain the same
    const restaurantsQuery = `
        SELECT r.*,
               COALESCE((SELECT ARRAY_AGG(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = r.id), ARRAY[]::TEXT[]) as tags
        FROM Restaurants r
        WHERE r.name ILIKE $1
        ORDER BY r.adds DESC NULLS LAST, r.name ASC
        LIMIT $2 OFFSET $3
    `;

    const dishesQuery = `
        SELECT d.*,
               r.name as restaurant_name, r.city_name, r.neighborhood_name,
               COALESCE((SELECT ARRAY_AGG(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = d.id), ARRAY[]::TEXT[]) as tags
        FROM Dishes d
        JOIN Restaurants r ON d.restaurant_id = r.id
        WHERE d.name ILIKE $1
        ORDER BY d.adds DESC NULLS LAST, d.name ASC
        LIMIT $2 OFFSET $3
    `;

    const listsQuery = `
        SELECT l.*,
               COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count
        FROM Lists l
        WHERE l.name ILIKE $1 AND l.is_public = TRUE
        ORDER BY l.saved_count DESC NULLS LAST, l.name ASC
        LIMIT $2 OFFSET $3
    `;

    try {
        const [restaurantsResult, dishesResult, listsResult] = await Promise.all([
            // Use the Raw types which include QueryResultRow
            db.query<RawRestaurantSearchResult>(restaurantsQuery, [searchPattern, limit, offset]),
            db.query<RawDishSearchResult>(dishesQuery, [searchPattern, limit, offset]),
            db.query<RawListSearchResult>(listsQuery, [searchPattern, limit, offset]),
        ]);

        // Filter results where formatting didn't fail (returns null)
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
        throw error;
    }
};