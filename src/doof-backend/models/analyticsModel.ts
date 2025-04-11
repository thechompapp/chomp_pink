/* src/doof-backend/models/analyticsModel.ts */
import db from '../db/index.js'; // Corrected import path

// --- Helper ---
const getStartDate = (period: string = '30d'): string => {
    let interval: string;
    switch (period) {
        case '7d': interval = '7 days'; break;
        case '90d': interval = '90 days'; break;
        case '1y': interval = '1 year'; break;
        case '30d':
        default: interval = '30 days'; break;
    }
    // Use SQL interval directly in the query, no need for `NOW() - INTERVAL ...` string here
    return interval;
};

// --- Model Functions ---

export const getSiteSummary = async (): Promise<{
    restaurants: number;
    dishes: number;
    lists: number;
    users: number;
    pendingSubmissions: number;
    totalEngagements: number;
}> => {
    const queries = [
        db.query<{ count: string }>('SELECT COUNT(*) FROM restaurants'),
        db.query<{ count: string }>('SELECT COUNT(*) FROM dishes'),
        db.query<{ count: string }>('SELECT COUNT(*) FROM lists'),
        db.query<{ count: string }>('SELECT COUNT(*) FROM users'),
        db.query<{ count: string }>('SELECT COUNT(*) FROM submissions WHERE status = $1', ['pending']),
        db.query<{ count: string }>('SELECT COUNT(*) FROM engagements'),
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

export const getSubmissionStats = async (): Promise<{ [key: string]: number }> => {
    const query = `
        SELECT status, COUNT(*)::int
        FROM submissions
        GROUP BY status;
    `;
    const result = await db.query<{ status: string; count: number }>(query);
    const stats: { [key: string]: number } = { pending: 0, approved: 0, rejected: 0 };
    result.rows.forEach((row: { status: string; count: number }) => { // Added explicit type for row
        if (stats.hasOwnProperty(row.status)) {
            stats[row.status] = row.count;
        }
    });
    return stats;
};

export const getContentDistribution = async (): Promise<{
    byCity: Array<{ city: string; count: number }>;
    byCuisine: Array<{ cuisine: string; count: number }>;
}> => {
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
        WHERE h.category ILIKE 'cuisine' -- Case-insensitive match
        GROUP BY h.name
        ORDER BY count DESC, h.name ASC
        LIMIT 10;
    `;
    // Ensure Promise.all returns the expected structure
    const [cityResult, cuisineResult] = await Promise.all([
        db.query<{ city: string; count: number }>(cityQuery),
        db.query<{ cuisine: string; count: number }>(cuisineQuery)
    ]);

    // Correctly return the structured data
    return {
        byCity: cityResult.rows || [],
        byCuisine: cuisineResult.rows || []
    };
};


export const getUserMetrics = async (period: string = '30d'): Promise<{
    activeUsers: number;
    newUsersLastPeriod: number;
    period: string;
}> => {
    const startDate = getStartDate(period);
    const activeUsersQuery = `SELECT COUNT(DISTINCT user_id) FROM engagements WHERE engagement_timestamp >= NOW() - INTERVAL '${startDate}'`;
    const newUsersQuery = `SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '${startDate}'`;

    const [activeResult, newResult] = await Promise.all([
        db.query<{ count: string }>(activeUsersQuery),
        db.query<{ count: string }>(newUsersQuery),
    ]);

    return {
        activeUsers: parseInt(activeResult.rows[0]?.count || '0', 10),
        newUsersLastPeriod: parseInt(newResult.rows[0]?.count || '0', 10),
        period: period,
    };
};


export const getEngagementDetails = async (): Promise<{
    views: number;
    clicks: number;
    adds: number;
    shares: number;
}> => {
    const query = `
        SELECT engagement_type, COUNT(*)::int as count
        FROM engagements
        GROUP BY engagement_type;
    `;
    const result = await db.query<{ engagement_type: string; count: number }>(query);
    const details: { [key: string]: number } = { views: 0, clicks: 0, adds: 0, shares: 0 };
    result.rows.forEach((row: { engagement_type: string; count: number }) => { // Added explicit type for row
        const key = row.engagement_type === 'add_to_list' ? 'adds' : row.engagement_type;
        if (details.hasOwnProperty(key)) {
            details[key] = row.count;
        }
    });
    // Explicitly cast to the return type
    return details as { views: number; clicks: number; adds: number; shares: number; };
};


export const getAggregateTrends = async (itemType: string, period: string = '30d'): Promise<Array<{ date: string; total_engagements: number }>> => {
    const allowedTypes = ['restaurant', 'dish', 'list'];
    if (!allowedTypes.includes(itemType)) {
        throw new Error(`Invalid itemType for aggregate trends: ${itemType}`);
    }
    const startDate = getStartDate(period); // Use helper to get interval string

    const query = `
        SELECT
            date_trunc('day', engagement_timestamp)::date::text as date,
            COUNT(*)::int as total_engagements
        FROM engagements
        WHERE item_type = $1 AND engagement_timestamp >= NOW() - INTERVAL '${startDate}'
        GROUP BY date
        ORDER BY date ASC;
      `;

    const result = await db.query<{ date: string; total_engagements: number }>(query, [itemType]);
    return result.rows || [];
};


export const getRecentEvents = async (limit: number = 100): Promise<any[]> => {
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


export const getPopularItems = async (type: string = 'all', period: string = '30d', limit: number = 10): Promise<any[]> => {
    const startDate = getStartDate(period);
    // This is a simplified example; a real implementation would need more complex queries
    // depending on the definition of "popular" (e.g., views, adds, saves).
    // This example just gets highly engaged items.
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
    // You would likely need to join with the respective item tables here to get names etc.
    return result.rows;
};


export const logEvent = async (
    eventType: string,
    itemId?: number | null,
    itemType?: string | null,
    userId?: number | null,
    data?: object | null
): Promise<void> => {
    // Placeholder for a more generic event logging if needed later.
    // For now, specific engagement logging is handled by logEngagement in engageModel.
    console.log('[AnalyticsModel logEvent] Logging generic event (currently placeholder):',
        { eventType, itemId, itemType, userId, data: JSON.stringify(data) }
    );
    // Example: Insert into a generic 'events' table if you create one.
    // const query = `INSERT INTO events (event_type, item_id, item_type, user_id, data, timestamp)
    //                VALUES ($1, $2, $3, $4, $5, NOW())`;
    // await db.query(query, [eventType, itemId, itemType, userId, data ? JSON.stringify(data) : null]);
};