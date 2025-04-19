/* src/doof-backend/models/searchModel.js */
import db from '../db/index.js';

// --- Formatters ---
const formatDishSearchResult = (row) => {
    if (!row || row.id == null) return null;
    try {
        return {
            id: Number(row.id),
            name: row.name || 'Unnamed Dish',
            adds: row.adds != null ? Number(row.adds) : 0,
            created_at: row.created_at,
            restaurant_id: Number(row.restaurant_id),
            restaurant_name: row.restaurant_name ?? undefined,
            city_name: row.city_name || undefined,
            neighborhood_name: row.neighborhood_name || undefined,
            tags: Array.isArray(row.tags) ? row.tags.filter((t) => typeof t === 'string' && t !== null) : [],
            city: row.city_name ?? null,
            neighborhood: row.neighborhood_name ?? null,
        };
    } catch (e) {
        console.error(`[SearchModel formatDishSearchResult Error] Failed to format row:`, row, e);
        return null;
    }
};

const formatListSearchResult = (row) => {
     if (!row || row.id == null) return null;
     try {
        const listType = row.list_type || row.type; // Default handled by DB or schema
        // Basic check if needed
        if (listType !== 'restaurant' && listType !== 'dish' && listType !== 'mixed') {
             console.warn(`[SearchModel FormatList] Invalid list type '${listType}' found for list ID ${row.id}.`);
             // Decide how to handle - skip or default? Assuming skip for now.
             // return null;
        }
        return {
            id: Number(row.id),
            user_id: row.user_id ? Number(row.user_id) : null,
            name: row.name || 'Unnamed List',
            description: row.description ?? null,
            tags: Array.isArray(row.tags) ? row.tags.filter((t) => typeof t === 'string' && t !== null) : [],
            is_public: row.is_public ?? true,
            is_following: !!row.is_following,
            created_by_user: !!row.created_by_user,
            item_count: row.item_count != null ? Number(row.item_count) : 0,
            saved_count: row.saved_count != null ? Number(row.saved_count) : 0,
            type: listType,
            list_type: listType,
            creator_handle: row.creator_handle ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at,
            city_name: row.city_name ?? null,
            city: row.city_name ?? null,
        };
     } catch (e) {
        console.error(`[SearchModel formatListSearchResult Error] Failed to format row:`, row, e);
        return null;
    }
};

const formatRestaurantSearchResult = (row) => {
     if (!row || row.id == null) return null;
     try {
        return {
            // Spread carefully, list needed fields explicitly
            id: Number(row.id),
            name: row.name || 'Unnamed Restaurant',
            city_id: row.city_id ? Number(row.city_id) : null,
            city_name: row.city_name || null,
            neighborhood_id: row.neighborhood_id ? Number(row.neighborhood_id) : null,
            neighborhood_name: row.neighborhood_name || null,
            address: row.address || null,
            google_place_id: row.google_place_id || null,
            latitude: row.latitude != null ? Number(row.latitude) : null,
            longitude: row.longitude != null ? Number(row.longitude) : null,
            adds: row.adds != null ? Number(row.adds) : 0,
            created_at: row.created_at,
            updated_at: row.updated_at,
            tags: Array.isArray(row.tags) ? row.tags.filter((t) => typeof t === 'string' && t !== null) : [],
             // Add other fields if they exist in the query result and are expected
             phone_number: row.phone_number || null,
             website: row.website || null,
             instagram_handle: row.instagram_handle || null,
             photo_url: row.photo_url || null,
        };
    } catch (e) {
        console.error(`[SearchModel formatRestaurantSearchResult Error] Failed to format row:`, row, e);
        return null;
    }
};


export const searchAll = async (searchTerm, limit = 10, offset = 0) => {
    // console.log(`[SearchModel] Searching for "${searchTerm}", Limit: ${limit}, Offset: ${offset}`); // Optional
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
            db.query(restaurantsQuery, [searchPattern, limit, offset]),
            db.query(dishesQuery, [searchPattern, limit, offset]),
            db.query(listsQuery, [searchPattern, limit, offset]),
        ]);

        const formattedRestaurants = (restaurantsResult.rows || [])
            .map(formatRestaurantSearchResult)
            .filter((r) => r !== null);

        const formattedDishes = (dishesResult.rows || [])
            .map(formatDishSearchResult)
            .filter((d) => d !== null);

        const formattedLists = (listsResult.rows || [])
            .map(formatListSearchResult)
            .filter((l) => l !== null);

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