// Filename: /root/doof-backend/models/analyticsModel.js
/* REFACTORED: Convert to ES Modules */
import db from '../db/index.js'; // Use import, add .js

const analyticsModel = {
    /**
     * Gets a summary of key counts (restaurants, dishes, users, lists, submissions).
     */
    async getSummary() {
        const queries = [
            db.query('SELECT COUNT(*) FROM Restaurants'),
            db.query('SELECT COUNT(*) FROM Dishes'),
            db.query('SELECT COUNT(*) FROM Users'),
            db.query('SELECT COUNT(*) FROM Lists'),
            db.query('SELECT COUNT(*) FROM Submissions WHERE status = $1', ['pending']) // Count pending submissions
        ];
        try {
            const results = await Promise.all(queries);
            return {
                restaurants: parseInt(results[0].rows[0].count, 10),
                dishes: parseInt(results[1].rows[0].count, 10),
                users: parseInt(results[2].rows[0].count, 10),
                lists: parseInt(results[3].rows[0].count, 10),
                pendingSubmissions: parseInt(results[4].rows[0].count, 10)
            };
        } catch (error) {
            console.error('Error fetching analytics summary:', error);
            throw error; // Re-throw DB errors
        }
    },

    /**
     * Gets engagement data, potentially filtered by time range or type.
     * Example: Counts views per item type over the last 7 days.
     */
    async getEngagement(params = {}) {
        // Default to last 7 days if no time range specified
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 7);
        const startDate = params.startDate || defaultStartDate.toISOString();
        const endDate = params.endDate || new Date().toISOString();
        const engagementType = params.engagementType || 'view'; // Default to 'view'

        const query = `
            SELECT
                item_type,
                COUNT(*) as engagement_count,
                DATE(engagement_timestamp) as engagement_date -- Group by date
            FROM engagements
            WHERE engagement_type = $1
              AND engagement_timestamp >= $2
              AND engagement_timestamp <= $3
              AND item_type IS NOT NULL -- Exclude generic page views maybe? Or filter specifically?
            GROUP BY item_type, DATE(engagement_timestamp)
            ORDER BY engagement_date ASC, item_type ASC;
        `;
        try {
            const result = await db.query(query, [engagementType, startDate, endDate]);
            // Process rows for easier frontend consumption (e.g., group by item_type)
            const trends = {};
             result.rows.forEach(row => {
                 const { item_type, engagement_count, engagement_date } = row;
                 if (!trends[item_type]) {
                     trends[item_type] = [];
                 }
                 trends[item_type].push({
                     date: engagement_date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
                     count: parseInt(engagement_count, 10)
                 });
             });

            return trends; // Return structured trends data
        } catch (error) {
            console.error('Error fetching engagement analytics:', error);
            throw error;
        }
    },

    // Add more analytics methods as needed
    // e.g., top viewed items, top contributing users, etc.
};

export default analyticsModel; // Use export default