import db from '../db/index.js';

export const getTrendingRestaurants = async (limit) => {
    const query = `
        SELECT r.id, r.name, r.city_name, r.neighborhood_name, r.adds, r.city_id, r.neighborhood_id,
               COALESCE((
                   SELECT ARRAY_AGG(h.name)
                   FROM RestaurantHashtags rh
                   JOIN Hashtags h ON rh.hashtag_id = h.id
                   WHERE rh.restaurant_id = r.id
               ), ARRAY[]::TEXT[]) as tags
        FROM Restaurants r
        ORDER BY r.adds DESC NULLS LAST
        LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows || [];
};

export const getTrendingDishes = async (limit) => {
    const query = `
        SELECT d.id, d.name, d.adds,
               r.name as restaurant_name,
               r.city_name, r.city_id, r.neighborhood_name, r.neighborhood_id,
               COALESCE((
                   SELECT ARRAY_AGG(h.name)
                   FROM DishHashtags dh
                   JOIN Hashtags h ON dh.hashtag_id = h.id
                   WHERE dh.dish_id = d.id
               ), ARRAY[]::TEXT[]) as tags
        FROM Dishes d
        JOIN Restaurants r ON d.restaurant_id = r.id
        ORDER BY d.adds DESC NULLS LAST
        LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return (result.rows || []).map(dish => ({
        ...dish,
        restaurant: dish.restaurant_name,
    }));
};

export const getTrendingLists = async (userId, limit) => {
    const query = `
        SELECT
            l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
            l.creator_handle, l.created_at, l.updated_at, l.user_id,
            COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
            CASE WHEN $1::INTEGER IS NOT NULL THEN
                EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1::INTEGER)
            ELSE FALSE
            END as is_following,
            CASE WHEN $1::INTEGER IS NOT NULL THEN
                (l.user_id = $1::INTEGER)
            ELSE FALSE
            END as created_by_user
        FROM Lists l
        WHERE l.is_public = TRUE
        ORDER BY l.saved_count DESC NULLS LAST
        LIMIT $2
    `;
    const result = await db.query(query, [userId, limit]);
    return (result.rows || []).map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        saved_count: list.saved_count || 0,
        item_count: list.item_count || 0,
        city: list.city_name,
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: list.is_public ?? true,
        is_following: list.is_following ?? false,
        created_by_user: list.created_by_user ?? false,
        user_id: list.user_id,
        creator_handle: list.creator_handle,
    }));
};