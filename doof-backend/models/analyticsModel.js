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
                engagement_type,
                COUNT(*) as engagement_count,
                DATE(engagement_timestamp) as engagement_date -- Group by date
            FROM engagements
            WHERE engagement_type = $1
              AND engagement_timestamp >= $2
              AND engagement_timestamp <= $3
              AND item_type IS NOT NULL -- Exclude generic page views maybe? Or filter specifically?
            GROUP BY item_type, engagement_type, DATE(engagement_timestamp)
            ORDER BY engagement_date ASC, item_type ASC, engagement_type ASC;
        `;
        try {
            const result = await db.query(query, [engagementType, startDate, endDate]);
            // Process rows for easier frontend consumption (e.g., group by item_type)
            const trends = {};
             result.rows.forEach(row => {
                 const { item_type, engagement_type, engagement_count, engagement_date } = row;
                 if (!trends[item_type]) {
                     trends[item_type] = [];
                 }
                 trends[item_type].push({
                     date: engagement_date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
                     type: engagement_type,
                     count: parseInt(engagement_count, 10)
                 });
             });

            return trends; // Return structured trends data
        } catch (error) {
            console.error('Error fetching engagement analytics:', error);
            throw error;
        }
    },

    /**
     * Gets search-specific engagement analytics
     * Returns data on search-driven interactions
     */
    async getSearchAnalytics(params = {}) {
        // Default to last 30 days for search analytics
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);
        const startDate = params.startDate || defaultStartDate.toISOString();
        const endDate = params.endDate || new Date().toISOString();

        const query = `
            SELECT
                item_type,
                engagement_type,
                COUNT(*) as engagement_count,
                DATE(engagement_timestamp) as engagement_date
            FROM engagements
            WHERE engagement_type IN ('search_view', 'search_click', 'search_result_view', 'search_result_click')
              AND engagement_timestamp >= $1
              AND engagement_timestamp <= $2
              AND item_type IS NOT NULL
            GROUP BY item_type, engagement_type, DATE(engagement_timestamp)
            ORDER BY engagement_date ASC, item_type ASC, engagement_type ASC;
        `;
        
        try {
            const result = await db.query(query, [startDate, endDate]);
            
            // Process into structured format
            const searchTrends = {
                summary: {
                    total_search_views: 0,
                    total_search_clicks: 0,
                    total_search_result_views: 0,
                    total_search_result_clicks: 0
                },
                by_item_type: {},
                daily_trends: []
            };

            result.rows.forEach(row => {
                const { item_type, engagement_type, engagement_count, engagement_date } = row;
                const count = parseInt(engagement_count, 10);
                
                // Update summary totals
                if (engagement_type === 'search_view') searchTrends.summary.total_search_views += count;
                if (engagement_type === 'search_click') searchTrends.summary.total_search_clicks += count;
                if (engagement_type === 'search_result_view') searchTrends.summary.total_search_result_views += count;
                if (engagement_type === 'search_result_click') searchTrends.summary.total_search_result_clicks += count;
                
                // Group by item type
                if (!searchTrends.by_item_type[item_type]) {
                    searchTrends.by_item_type[item_type] = [];
                }
                searchTrends.by_item_type[item_type].push({
                    date: engagement_date.toISOString().split('T')[0],
                    type: engagement_type,
                    count: count
                });
            });

            return searchTrends;
        } catch (error) {
            console.error('Error fetching search analytics:', error);
            throw error;
        }
    },

    /**
     * Gets aggregate trends data for charts
     * Returns engagement data over time for a specific item type and time period
     */
    async getAggregateTrends(params = {}) {
        const { itemType, period } = params;
        
        // Determine date range based on period
        const days = period === '7d' ? 7 : 
                    period === '30d' ? 30 : 
                    period === '90d' ? 90 : 
                    period === '1y' ? 365 : 30; // Default to 30 days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const endDate = new Date();

        try {
            // Query for aggregated engagement data over the time period
            const query = `
                SELECT
                    DATE(engagement_timestamp) as date,
                    COUNT(*) as total_engagements
                FROM engagements
                WHERE item_type = $1
                  AND engagement_timestamp >= $2
                  AND engagement_timestamp <= $3
                GROUP BY DATE(engagement_timestamp)
                ORDER BY date ASC
            `;
            
            const result = await db.query(query, [itemType, startDate.toISOString(), endDate.toISOString()]);
            
            // Fill in missing dates with 0 values to ensure complete data series
            const trendData = [];
            const currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const existingData = result.rows.find(row => 
                    row.date.toISOString().split('T')[0] === dateStr
                );
                
                trendData.push({
                    date: dateStr,
                    total_engagements: existingData ? parseInt(existingData.total_engagements, 10) : 0
                });
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return trendData;
        } catch (error) {
            console.error('Error fetching aggregate trends:', error);
            throw error;
        }
    },

    // Add more analytics methods as needed
    // e.g., top viewed items, top contributing users, etc.
};

export default analyticsModel; // Use export default