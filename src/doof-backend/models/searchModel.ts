/* src/doof-backend/models/searchModel.ts */
import db from '../db/index.js';
import type { QueryResult } from 'pg';
import type { Restaurant } from './restaurantModel'; // Use .ts assuming TS context
import type { Dish } from './dishModel';
import type { List } from './listModel';

export interface SearchResults {
    restaurants: Restaurant[];
    dishes: Dish[];
    lists: List[];
}

interface RawRestaurantSearchResult extends Restaurant {}
interface RawDishSearchResult extends Dish {
    restaurant_name?: string | null;
}
interface RawListSearchResult extends List {
    item_count: number | string;
}

const formatDishSearchResult = (row: RawDishSearchResult): Dish => ({
    ...row,
    id: Number(row.id),
    adds: row.adds != null ? Number(row.adds) : 0,
    restaurant_id: Number(row.restaurant_id),
    restaurant_name: row.restaurant_name ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => t !== null) : [],
    city: row.city_name ?? null,
    neighborhood: row.neighborhood_name ?? null,
});

const formatListSearchResult = (row: RawListSearchResult): List => ({
    ...row,
    id: Number(row.id),
    saved_count: row.saved_count != null ? Number(row.saved_count) : 0,
    item_count: row.item_count != null ? Number(row.item_count) : 0,
    is_public: row.is_public ?? true,
    is_following: !!row.is_following,
    created_by_user: !!row.created_by_user,
    tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => t !== null) : [],
    type: (row.list_type || row.type || 'mixed') as List['type'],
    list_type: (row.list_type || row.type || 'mixed') as List['list_type'],
    city: row.city_name ?? null,
});

const formatRestaurantSearchResult = (row: RawRestaurantSearchResult): Restaurant => ({
    ...row,
    id: Number(row.id),
    adds: row.adds != null ? Number(row.adds) : 0,
    tags: Array.isArray(row.tags) ? row.tags.filter((t): t is string => t !== null) : [],
    city_id: row.city_id ? Number(row.city_id) : null,
    neighborhood_id: row.neighborhood_id ? Number(row.neighborhood_id) : null,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
});

export const searchAll = async (
    searchTerm: string,
    limit: number = 10,
    offset: number = 0
): Promise<SearchResults> => {
    console.log(`[SearchModel] Searching for "${searchTerm}", Limit: ${limit}, Offset: ${offset}`);
    const searchPattern = `%${searchTerm}%`;

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
            db.query<RawRestaurantSearchResult>(restaurantsQuery, [searchPattern, limit, offset]),
            db.query<RawDishSearchResult>(dishesQuery, [searchPattern, limit, offset]),
            db.query<RawListSearchResult>(listsQuery, [searchPattern, limit, offset]),
        ]);

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