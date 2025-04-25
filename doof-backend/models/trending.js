// Filename: /root/doof-backend/models/trending.js
import db from '../db/index.js';

const getRecentTimestampThreshold = () => {
    const now = new Date();
    now.setDate(now.getDate() - 30);
    return now.toISOString();
};

const WEIGHTS = {
    view: 1,
    click: 3,
    add_to_list: 5,
};

export const getTrendingRestaurants = async (limit) => {
    try {
        const query = `
            SELECT r.*, COALESCE(SUM(e.score), 0) as trend_score
            FROM restaurants r
            LEFT JOIN (
                SELECT item_id, 
                    SUM(CASE WHEN engagement_type = 'view' THEN ${WEIGHTS.view}
                            WHEN engagement_type = 'click' THEN ${WEIGHTS.click}
                            ELSE 0 END) as score
                FROM engagements
                WHERE item_type = 'restaurant'
                AND engagement_timestamp >= $1
                GROUP BY item_id
            ) e ON r.id = e.item_id
            GROUP BY r.id
            ORDER BY trend_score DESC
            LIMIT $2
        `;
        const result = await db.query(query, [getRecentTimestampThreshold(), limit]);
        return result.rows || [];
    } catch (error) {
        console.error('Error fetching trending restaurants:', error);
        return [];
    }
};

export const getTrendingDishes = async (limit) => {
    try {
        const query = `
            SELECT d.*, r.name as restaurant_name, COALESCE(SUM(e.score), 0) as trend_score
            FROM dishes d
            LEFT JOIN restaurants r ON d.restaurant_id = r.id
            LEFT JOIN (
                SELECT item_id, 
                    SUM(CASE WHEN engagement_type = 'view' THEN ${WEIGHTS.view}
                            WHEN engagement_type = 'click' THEN ${WEIGHTS.click}
                            ELSE 0 END) as score
                FROM engagements
                WHERE item_type = 'dish'
                AND engagement_timestamp >= $1
                GROUP BY item_id
            ) e ON d.id = e.item_id
            GROUP BY d.id, r.name
            ORDER BY trend_score DESC, d.created_at DESC
            LIMIT $2
        `;
        const result = await db.query(query, [getRecentTimestampThreshold(), limit]);
        const dishes = result.rows || [];
        if (dishes.length === 0) {
            const fallbackQuery = `
                SELECT d.*, r.name as restaurant_name
                FROM dishes d
                LEFT JOIN restaurants r ON d.restaurant_id = r.id
                ORDER BY d.created_at DESC
                LIMIT $1
            `;
            const fallbackResult = await db.query(fallbackQuery, [limit]);
            return fallbackResult.rows || [];
        }
        return dishes;
    } catch (error) {
        console.error('Error fetching trending dishes:', error);
        return [];
    }
};

export const getTrendingLists = async (userId, limit) => {
    try {
        const query = `
            SELECT l.*, 
                   u.username as creator_handle,
                   COALESCE((
                       SELECT COUNT(*) 
                       FROM listitems li 
                       WHERE li.list_id = l.id
                   ), 0) as item_count,
                   COALESCE(SUM(e.score), 0) as trend_score
            FROM lists l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN (
                SELECT item_id, 
                    SUM(CASE WHEN engagement_type = 'view' THEN ${WEIGHTS.view}
                            WHEN engagement_type = 'add_to_list' THEN ${WEIGHTS.add_to_list}
                            ELSE 0 END) as score
                FROM engagements
                WHERE item_type = 'list'
                AND engagement_timestamp >= $1
                GROUP BY item_id
            ) e ON l.id = e.item_id
            WHERE l.is_public = true
            GROUP BY l.id, u.username
            ORDER BY trend_score DESC, l.updated_at DESC
            LIMIT $2
        `;
        const result = await db.query(query, [getRecentTimestampThreshold(), limit]);
        return result.rows || [];
    } catch (error) {
        console.error('Error fetching trending lists:', error);
        return [];
    }
};