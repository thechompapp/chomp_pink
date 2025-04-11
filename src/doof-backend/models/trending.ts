/* src/doof-backend/models/trending.ts */
import db from '../db/index.js'; // Corrected import path
import type { QueryResult } from 'pg';

// Define specific types for rows if possible, otherwise use generic any[]
interface EngagementCounts {
    item_id: number;
    recent_views: number;
    recent_clicks: number;
}

interface TrendingRestaurantRow {
    id: number;
    name: string;
    city_name: string | null;
    neighborhood_name: string | null;
    adds: number | null;
    city_id: number | null;
    neighborhood_id: number | null;
    recent_views: number;
    recent_clicks: number;
    trending_score: number;
    tags: string[];
    created_at: Date | string;
}

interface TrendingDishRow {
    id: number;
    name: string;
    adds: number | null;
    restaurant_id: number;
    created_at: Date | string;
    restaurant_name: string | null;
    city_name: string | null;
    city_id: number | null;
    neighborhood_name: string | null;
    neighborhood_id: number | null;
    recent_views: number;
    recent_clicks: number;
    trending_score: number;
    tags: string[];
}

interface TrendingListRow {
    id: number;
    name: string;
    description: string | null;
    saved_count: number | null;
    city_name: string | null;
    tags: string[];
    is_public: boolean;
    creator_handle: string | null;
    created_at: Date | string;
    updated_at: Date | string;
    user_id: number | null;
    list_type: string | null;
    item_count: number;
    is_following: boolean;
    created_by_user: boolean;
    recent_views: number;
    recent_clicks: number;
    trending_score: number;
}


// Helper function to get the date threshold (e.g., 7 days ago)
const getRecentTimestampThreshold = (): string => {
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
export const getTrendingRestaurants = async (limit: number): Promise<TrendingRestaurantRow[]> => {
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
                WHERE rh.restaurant_id = r.id AND h.name IS NOT NULL -- Ensure tags are not null
            ), ARRAY[]::TEXT[]) as tags,
            r.created_at -- Include created_at for potential sorting/display
        FROM Restaurants r
        LEFT JOIN RecentEngagements re ON r.id = re.item_id
        ORDER BY trending_score DESC, r.adds DESC NULLS LAST, r.created_at DESC, r.name ASC -- Added created_at tie-breaker
        LIMIT $5;
    `;
    // Ensure weights are passed as numbers if needed by DB driver (pg usually handles it)
    const params = [ recentThreshold, WEIGHTS.RECENT_VIEW, WEIGHTS.RECENT_CLICK, WEIGHTS.ADD_SAVE, limit ];
    const result: QueryResult<TrendingRestaurantRow> = await db.query(query, params);
    return result.rows || [];
};

/*
 * Fetches trending dishes based on a score combining recent engagement and total adds.
 * Performance considerations similar to getTrendingRestaurants apply.
 */
export const getTrendingDishes = async (limit: number): Promise<TrendingDishRow[]> => {
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
                WHERE dh.dish_id = d.id AND h.name IS NOT NULL -- Ensure tags are not null
            ), ARRAY[]::TEXT[]) as tags
        FROM Dishes d
        JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN RecentEngagements re ON d.id = re.item_id
        ORDER BY trending_score DESC, d.adds DESC NULLS LAST, d.created_at DESC, d.name ASC -- Added created_at tie-breaker
        LIMIT $5;
    `;
    const params = [ recentThreshold, WEIGHTS.RECENT_VIEW, WEIGHTS.RECENT_CLICK, WEIGHTS.ADD_SAVE, limit ];
    const result: QueryResult<TrendingDishRow> = await db.query(query, params);
    // Map restaurant name for consistency (or handle in frontend card)
    // The result rows should match TrendingDishRow structure
    return result.rows || [];
};

/*
 * Fetches trending lists based on a score combining recent engagement and total saves.
 * Performance considerations similar to getTrendingRestaurants apply.
 */
export const getTrendingLists = async (userId: number | null | undefined, limit: number): Promise<TrendingListRow[]> => {
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
    const result: QueryResult<TrendingListRow> = await db.query(query, params);
    // Map result for frontend consistency (or handle in frontend ListCard)
    // The result rows should mostly match TrendingListRow, ensure tags is an array
    return (result.rows || []).map(list => ({
        ...list,
        tags: Array.isArray(list.tags) ? list.tags.filter((t): t is string => typeof t === 'string' && t.length > 0) : []
    }));
};