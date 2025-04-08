/* src/doof-backend/models/searchModel.js */
import db from '../db/index.js';

export const searchAll = async (searchTerm, limit = 10, offset = 0) => {
    const searchPattern = `%${searchTerm}%`;

    // Restaurant Query
    const restaurantsQuery = `
      SELECT r.id, r.name, r.city_name, r.neighborhood_name, r.adds, r.city_id, r.neighborhood_id,
             COALESCE((SELECT ARRAY_AGG(h.name) FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id WHERE rh.restaurant_id = r.id), ARRAY[]::TEXT[]) as tags
      FROM Restaurants r
      WHERE r.name ILIKE $1
      ORDER BY r.adds DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `;
    // Dish Query
    const dishesQuery = `
      SELECT d.id, d.name, d.adds, r.name as restaurant_name,
             r.city_name, r.city_id, r.neighborhood_id, r.neighborhood_name,
             COALESCE((SELECT ARRAY_AGG(h.name) FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id WHERE dh.dish_id = d.id), ARRAY[]::TEXT[]) as tags
      FROM Dishes d
      JOIN Restaurants r ON d.restaurant_id = r.id
      WHERE d.name ILIKE $1
      ORDER BY d.adds DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `;
    // List Query
    const listsQuery = `
        SELECT l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
               l.creator_handle, l.user_id, l.list_type,
               COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count
        FROM Lists l
        WHERE l.name ILIKE $1 AND l.is_public = TRUE
        ORDER BY l.saved_count DESC NULLS LAST
        LIMIT $2 OFFSET $3
    `;

    // Execute queries concurrently
    const [restaurantsResult, dishesResult, listsResult] = await Promise.all([
      db.query(restaurantsQuery, [searchPattern, limit, offset]),
      db.query(dishesQuery, [searchPattern, limit, offset]),
      db.query(listsQuery, [searchPattern, limit, offset]),
    ]);

    return {
        restaurants: restaurantsResult.rows || [],
        dishes: dishesResult.rows || [],
        lists: listsResult.rows || [],
    };
};