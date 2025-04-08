/* src/doof-backend/models/trending.js */
import db from '../db/index.js'; // Assuming db/index.ts compiles to db/index.js

// Helper function to get the date threshold (e.g., 7 days ago)
const getRecentTimestampThreshold = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Configurable: Look back period for "recent"
    return date.toISOString();
};

// Define weights for scoring (can be adjusted)
const WEIGHTS = {
    RECENT_VIEW: 1,
    RECENT_CLICK: 3,
    ADD_SAVE: 5, // Weight for total adds (restaurants/dishes) or saves (lists)
};

/*
 * Fetches trending restaurants based on a score combining recent engagement and total adds.
 * Potential Performance Bottleneck: Relies on joining with an aggregation (CTE) on the Engagements table.
 * If the Engagements table becomes very large, this query might slow down.
 * Optimization Strategies:
 * 1. Ensure indexes on Engagements(item_type, engagement_timestamp) and Restaurants(adds) are effective (covered in setup.sql).
 * 2. Consider using Materialized Views for recent engagement counts if performance degrades significantly.
 * 3. Pre-calculate trending scores periodically via a background job.
 */
export const getTrendingRestaurants = async (limit) => {
    const recentThreshold = getRecentTimestampThreshold();
    const query = `
        WITH RecentEngagements AS (
            SELECT
                item_id,
                SUM(CASE WHEN engagement_type = 'view' THEN 1 ELSE 0 END)::INTEGER as recent_views,
                SUM(CASE WHEN engagement_type = 'click' THEN 1 ELSE 0 END)::INTEGER as recent_clicks
            FROM Engagements
            WHERE item_type = 'restaurant' AND engagement_timestamp >= $1 -- Use threshold parameter
            GROUP BY item_id
        )
        SELECT
            r.id, r.name, r.city_name, r.neighborhood_name, r.adds, r.city_id, r.neighborhood_id,
            COALESCE(re.recent_views, 0) as recent_views,
            COALESCE(re.recent_clicks, 0) as recent_clicks,
            -- Calculate trending score (ensure types are numeric)
            (COALESCE(re.recent_views, 0) * $2::INTEGER) +
            (COALESCE(re.recent_clicks, 0) * $3::INTEGER) +
            (COALESCE(r.adds, 0) * $4::INTEGER) as trending_score,
            COALESCE((
                SELECT ARRAY_AGG(h.name)
                FROM RestaurantHashtags rh
                JOIN Hashtags h ON rh.hashtag_id = h.id
                WHERE rh.restaurant_id = r.id
            ), ARRAY[]::TEXT[]) as tags,
            r.created_at -- Include created_at for potential sorting/display
        FROM Restaurants r
        LEFT JOIN RecentEngagements re ON r.id = re.item_id
        ORDER BY trending_score DESC, r.adds DESC NULLS LAST, r.created_at DESC, r.name ASC -- Added created_at tie-breaker
        LIMIT $5; -- Added semicolon
    `;
    // Ensure weights are passed as numbers if needed by DB driver (pg usually handles it)
    const params = [ recentThreshold, WEIGHTS.RECENT_VIEW, WEIGHTS.RECENT_CLICK, WEIGHTS.ADD_SAVE, limit ];
    const result = await db.query(query, params);
    return result.rows || [];
};

/*
 * Fetches trending dishes based on a score combining recent engagement and total adds.
 * Performance considerations similar to getTrendingRestaurants apply.
 */
export const getTrendingDishes = async (limit) => {
    const recentThreshold = getRecentTimestampThreshold();
    const query = `
        WITH RecentEngagements AS (
            SELECT
                item_id,
                SUM(CASE WHEN engagement_type = 'view' THEN 1 ELSE 0 END)::INTEGER as recent_views,
                SUM(CASE WHEN engagement_type = 'click' THEN 1 ELSE 0 END)::INTEGER as recent_clicks
            FROM Engagements
            WHERE item_type = 'dish' AND engagement_timestamp >= $1
            GROUP BY item_id
        )
        SELECT
            d.id, d.name, d.adds, d.restaurant_id, d.created_at, -- Include restaurant_id and created_at
            r.name as restaurant_name,
            r.city_name, r.city_id, r.neighborhood_name, r.neighborhood_id,
            COALESCE(re.recent_views, 0) as recent_views,
            COALESCE(re.recent_clicks, 0) as recent_clicks,
            -- Calculate trending score (ensure types are numeric)
            (COALESCE(re.recent_views, 0) * $2::INTEGER) +
            (COALESCE(re.recent_clicks, 0) * $3::INTEGER) +
            (COALESCE(d.adds, 0) * $4::INTEGER) as trending_score,
            COALESCE((
                SELECT ARRAY_AGG(h.name)
                FROM DishHashtags dh
                JOIN Hashtags h ON dh.hashtag_id = h.id
                WHERE dh.dish_id = d.id
            ), ARRAY[]::TEXT[]) as tags
        FROM Dishes d
        JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN RecentEngagements re ON d.id = re.item_id
        ORDER BY trending_score DESC, d.adds DESC NULLS LAST, d.created_at DESC, d.name ASC -- Added created_at tie-breaker
        LIMIT $5; -- Added semicolon
    `;
    const params = [ recentThreshold, WEIGHTS.RECENT_VIEW, WEIGHTS.RECENT_CLICK, WEIGHTS.ADD_SAVE, limit ];
    const result = await db.query(query, params);
    // Map restaurant name for consistency
    return (result.rows || []).map(dish => ({
        ...dish,
        restaurant: dish.restaurant_name, // Consistent key for frontend
    }));
};

/*
 * Fetches trending lists based on a score combining recent engagement and total saves.
 * Performance considerations similar to getTrendingRestaurants apply.
 */
export const getTrendingLists = async (userId, limit) => {
    const recentThreshold = getRecentTimestampThreshold();
    // Corrected query syntax, ensuring proper aliasing and casting
    const query = `
        WITH RecentEngagements AS (
            SELECT
                item_id,
                SUM(CASE WHEN engagement_type = 'view' THEN 1 ELSE 0 END)::INTEGER as recent_views,
                SUM(CASE WHEN engagement_type = 'click' THEN 1 ELSE 0 END)::INTEGER as recent_clicks
            FROM Engagements
            WHERE item_type = 'list' AND engagement_timestamp >= $1 -- Param $1: recentThreshold
            GROUP BY item_id
        )
        SELECT
            l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
            l.creator_handle, l.created_at, l.updated_at, l.user_id, l.list_type,
            COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
            -- Explicitly check if userId is provided before checking existence
            CASE
                WHEN $2::INTEGER IS NOT NULL THEN EXISTS (
                    SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $2::INTEGER
                )
                ELSE FALSE
            END as is_following,
            -- Explicitly check if userId is provided before checking ownership
            CASE
                WHEN $2::INTEGER IS NOT NULL THEN (l.user_id = $2::INTEGER)
                ELSE FALSE
            END as created_by_user,
            COALESCE(re.recent_views, 0) as recent_views,
            COALESCE(re.recent_clicks, 0) as recent_clicks,
            -- Calculate trending score (ensure types are numeric)
            (COALESCE(re.recent_views, 0) * $3::INTEGER) +      -- Param $3: WEIGHTS.RECENT_VIEW
            (COALESCE(re.recent_clicks, 0) * $4::INTEGER) +     -- Param $4: WEIGHTS.RECENT_CLICK
            (COALESCE(l.saved_count, 0) * $5::INTEGER) as trending_score -- Param $5: WEIGHTS.ADD_SAVE
        FROM Lists l
        LEFT JOIN RecentEngagements re ON l.id = re.item_id
        WHERE l.is_public = TRUE
        ORDER BY trending_score DESC, l.saved_count DESC NULLS LAST, l.created_at DESC, l.name ASC -- Added created_at tie-breaker
        LIMIT $6; -- Param $6: limit
    `;
    // Ensure userId is passed as null if undefined/falsy, weights are numbers
    const params = [
        recentThreshold,
        userId ? Number(userId) : null,
        WEIGHTS.RECENT_VIEW,
        WEIGHTS.RECENT_CLICK,
        WEIGHTS.ADD_SAVE,
        Number(limit)
    ];
    const result = await db.query(query, params);
    // Map result for frontend consistency
    return (result.rows || []).map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        type: list.list_type || 'mixed',
        saved_count: list.saved_count || 0,
        item_count: list.item_count || 0,
        city: list.city_name,
        tags: Array.isArray(list.tags) ? list.tags : [],
        is_public: list.is_public ?? true,
        is_following: list.is_following ?? false,
        created_by_user: list.created_by_user ?? false,
        user_id: list.user_id,
        creator_handle: list.creator_handle,
        created_at: list.created_at, // Keep timestamp if needed
    }));
};