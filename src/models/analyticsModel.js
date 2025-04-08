/* src/doof-backend/models/analyticsModel.js */
import db from '../db/index.js';

// --- Helper ---
const getStartDate = (period = '30d') => {
     let interval;
     switch (period) {
         case '7d': interval = '7 days'; break;
         case '90d': interval = '90 days'; break;
         case '1y': interval = '1 year'; break;
         case '30d': default: interval = '30 days'; break;
     }
     return `NOW() - INTERVAL '${interval}'`;
};

// --- Model Functions ---

export const getSiteSummary = async () => {
    const queries = [
        db.query('SELECT COUNT(*) FROM restaurants'),
        db.query('SELECT COUNT(*) FROM dishes'),
        db.query('SELECT COUNT(*) FROM lists'),
        db.query('SELECT COUNT(*) FROM users'),
        db.query('SELECT COUNT(*) FROM submissions WHERE status = $1', ['pending']),
        db.query('SELECT COUNT(*) FROM engagements'), // Total engagements
    ];
    const results = await Promise.all(queries);
    return {
        restaurants: parseInt(results[0].rows[0].count, 10) || 0,
        dishes: parseInt(results[1].rows[0].count, 10) || 0,
        lists: parseInt(results[2].rows[0].count, 10) || 0,
        users: parseInt(results[3].rows[0].count, 10) || 0,
        pendingSubmissions: parseInt(results[4].rows[0].count, 10) || 0,
        totalEngagements: parseInt(results[5].rows[0].count, 10) || 0,
    };
};

export const getSubmissionStats = async () => {
    const query = `
        SELECT status, COUNT(*)
        FROM submissions
        GROUP BY status;
    `;
    const result = await db.query(query);
    const stats = { pending: 0, approved: 0, rejected: 0 };
    result.rows.forEach(row => {
        if (stats.hasOwnProperty(row.status)) {
            stats[row.status] = parseInt(row.count, 10);
        }
    });
    return stats;
};

export const getContentDistribution = async () => {
     // Example: Restaurants by City and Cuisine (Top 10)
     const cityQuery = `
         SELECT city_name as city, COUNT(*) as count
         FROM restaurants
         WHERE city_name IS NOT NULL
         GROUP BY city_name
         ORDER BY count DESC, city_name ASC
         LIMIT 10;
     `;
     const cuisineQuery = `
         SELECT h.name as cuisine, COUNT(DISTINCT rh.restaurant_id) as count
         FROM hashtags h
         JOIN restauranthashtags rh ON h.id = rh.hashtag_id
         WHERE h.category = 'cuisine'
         GROUP BY h.name
         ORDER BY count DESC, h.name ASC
         LIMIT 10;
     `;
     const [cityResult, cuisineResult] = await Promise.all([
         db.query(cityQuery),
         db.query(cuisineQuery)
     ]);
     return {
         byCity: cityResult.rows.map(r => ({ ...r, count: parseInt(r.count, 10) })) || [],
         byCuisine: cuisineResult.rows.map(r => ({ ...r, count: parseInt(r.count, 10) })) || [],
     };
};

export const getUserMetrics = async (period = '30d') => {
     const startDate = getStartDate(period);
     // Active Users: Count distinct users with any engagement in the period
     // New Users: Count users created within the period
     const activeUserQuery = `SELECT COUNT(DISTINCT user_id) FROM engagements WHERE engagement_timestamp >= ${startDate} AND user_id IS NOT NULL;`;
     const newUserQuery = `SELECT COUNT(*) FROM users WHERE created_at >= ${startDate};`;

     const [activeResult, newResult] = await Promise.all([
         db.query(activeUserQuery),
         db.query(newUserQuery)
     ]);
     return {
         activeUsers: parseInt(activeResult.rows[0].count, 10) || 0,
         newUsersLastPeriod: parseInt(newResult.rows[0].count, 10) || 0, // Renamed for clarity
         period: period
     };
};

export const getEngagementDetails = async () => {
     const query = `
         SELECT engagement_type, COUNT(*)
         FROM engagements
         GROUP BY engagement_type;
     `;
     const result = await db.query(query);
     const details = { views: 0, clicks: 0, adds_to_list: 0, shares: 0 }; // Match engagement_type values
     result.rows.forEach(row => {
          // Map DB type to response key if different (e.g., add_to_list vs adds)
          const key = row.engagement_type === 'add_to_list' ? 'adds' : row.engagement_type;
         if (details.hasOwnProperty(key)) {
             details[key] = parseInt(row.count, 10);
         }
     });
     return details;
};

export const getAggregateTrends = async (itemType, period = '30d') => {
     const startDate = getStartDate(period);
     const query = `
         SELECT
             date_trunc('day', engagement_timestamp)::date AS date,
             COUNT(*) AS total_engagements
         FROM engagements
         WHERE item_type = $1 AND engagement_timestamp >= ${startDate}
         GROUP BY date_trunc('day', engagement_timestamp)::date
         ORDER BY date ASC;
     `;
     const result = await db.query(query, [itemType]);
     // Format data for charting
     return result.rows.map(row => ({
         date: row.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
         total_engagements: parseInt(row.total_engagements, 10)
     }));
};