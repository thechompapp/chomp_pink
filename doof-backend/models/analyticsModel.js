/* src/doof-backend/models/analyticsModel.js */
import db from '../db/index.js';

// --- Helper ---
const getStartDate = (period = '30d') => {
    let interval;
    switch (period) {
        case '7d': interval = '7 days'; break;
        case '90d': interval = '90 days'; break;
        case '1y': interval = '1 year'; break;
        case '30d':
        default: interval = '30 days'; break;
    }
    return interval;
};

// --- Model Functions ---
export const getSiteSummary = async () => {
    const queries = [
        db.query('SELECT COUNT(*) FROM restaurants'),
        db.query('SELECT COUNT(*) FROM dishes'),
        db.query('SELECT COUNT(*) FROM lists'),
        db.query('SELECT COUNT(*) FROM users'),
        db.query('SELECT COUNT(*) FROM submissions WHERE status = $1', ['pending']),
        db.query('SELECT COUNT(*) FROM engagements'),
    ];
    const results = await Promise.all(queries);
    return {
        restaurants: parseInt(results[0].rows[0]?.count || '0', 10),
        dishes: parseInt(results[1].rows[0]?.count || '0', 10),
        lists: parseInt(results[2].rows[0]?.count || '0', 10),
        users: parseInt(results[3].rows[0]?.count || '0', 10),
        pendingSubmissions: parseInt(results[4].rows[0]?.count || '0', 10),
        totalEngagements: parseInt(results[5].rows[0]?.count || '0', 10),
    };
};

export const getSubmissionStats = async () => {
    const query = `
        SELECT status, COUNT(*)::int
        FROM submissions
        GROUP BY status;
    `;
    const result = await db.query(query);
    const stats = { pending: 0, approved: 0, rejected: 0 };
    result.rows.forEach((row) => {
        if (stats.hasOwnProperty(row.status)) {
            stats[row.status] = row.count;
        }
    });
    return stats;
};

export const getContentDistribution = async () => {
    const cityQuery = `
        SELECT city_name as city, COUNT(*)::int as count
        FROM restaurants
        WHERE city_name IS NOT NULL
        GROUP BY city_name
        ORDER BY count DESC, city_name ASC
        LIMIT 10;
    `;
    const cuisineQuery = `
        SELECT h.name as cuisine, COUNT(DISTINCT rh.restaurant_id)::int as count
        FROM hashtags h
        JOIN restauranthashtags rh ON h.id = rh.hashtag_id
        WHERE h.category ILIKE 'cuisine'
        GROUP BY h.name
        ORDER BY count DESC, h.name ASC
        LIMIT 10;
    `;
    const [cityResult, cuisineResult] = await Promise.all([
        db.query(cityQuery),
        db.query(cuisineQuery)
    ]);
    return {
        byCity: cityResult.rows || [],
        byCuisine: cuisineResult.rows || []
    };
};

export const getUserMetrics = async (period = '30d') => {
    const startDate = getStartDate(period);
    // Use SQL interval directly
    const activeUsersQuery = `SELECT COUNT(DISTINCT user_id) FROM engagements WHERE engagement_timestamp >= NOW() - INTERVAL '${startDate}'`;
    const newUsersQuery = `SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '${startDate}'`;
    const [activeResult, newResult] = await Promise.all([
        db.query(activeUsersQuery),
        db.query(newUsersQuery),
    ]);
    return {
        activeUsers: parseInt(activeResult.rows[0]?.count || '0', 10),
        newUsersLastPeriod: parseInt(newResult.rows[0]?.count || '0', 10),
        period: period,
    };
};

export const getEngagementDetails = async () => {
    const query = `
        SELECT engagement_type, COUNT(*)::int as count
        FROM engagements
        GROUP BY engagement_type;
    `;
    const result = await db.query(query);
    const details = { views: 0, clicks: 0, adds: 0, shares: 0 };
    result.rows.forEach((row) => {
        const key = row.engagement_type === 'add_to_list' ? 'adds' : row.engagement_type;
        if (details.hasOwnProperty(key)) {
            details[key] = row.count;
        }
    });
    return details;
};

export const getAggregateTrends = async (itemType, period = '30d') => {
    const allowedTypes = ['restaurant', 'dish', 'list'];
    if (!allowedTypes.includes(itemType)) {
        throw new Error(`Invalid itemType for aggregate trends: ${itemType}`);
    }
    const startDate = getStartDate(period);
    const query = `
        SELECT
            date_trunc('day', engagement_timestamp)::date::text as date,
            COUNT(*)::int as total_engagements
        FROM engagements
        WHERE item_type = $1 AND engagement_timestamp >= NOW() - INTERVAL '${startDate}'
        GROUP BY date
        ORDER BY date ASC;
      `;
    const result = await db.query(query, [itemType]);
    return result.rows || [];
};

export const getRecentEvents = async (limit = 100) => {
    const query = `
      SELECT e.*, u.username
      FROM engagements e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.engagement_timestamp DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
};

export const getPopularItems = async (type = 'all', period = '30d', limit = 10) => {
    const startDate = getStartDate(period);
    const query = `
        SELECT item_type, item_id, COUNT(*) as engagement_count
        FROM engagements
        WHERE engagement_timestamp >= NOW() - INTERVAL '${startDate}'
        ${type !== 'all' ? 'AND item_type = $1' : ''}
        GROUP BY item_type, item_id
        ORDER BY engagement_count DESC
        LIMIT $2;
    `;
    const params = type !== 'all' ? [type, limit] : [limit];
    const result = await db.query(query, params);
    // Note: This returns raw data, join with item tables might be needed for names etc.
    return result.rows;
};

export const logEvent = async (eventType, itemId, itemType, userId, data) => {
    console.log('[AnalyticsModel logEvent] Logging generic event (currently placeholder):',
        { eventType, itemId, itemType, userId, data: JSON.stringify(data) }
    );
    // Placeholder - No DB interaction
};