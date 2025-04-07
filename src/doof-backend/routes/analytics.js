// src/doof-backend/routes/analytics.js
import express from 'express';
import { query, validationResult } from 'express-validator';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// --- Middleware ---
const requireSuperuser = async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    if (!req.user || typeof req.user.id === 'undefined') {
        console.warn('[Analytics RequireSuperuser] Auth middleware did not attach user or user ID.');
        return res.status(401).json({ error: 'Authentication required or invalid token payload.' });
    }
    try {
        const userCheckQuery = 'SELECT account_type FROM users WHERE id = $1';
        console.log(`[Analytics RequireSuperuser] Checking permissions for user ID: ${req.user.id}`);
        const userCheck = await currentDb.query(userCheckQuery, [req.user.id]);
        if (userCheck.rows.length === 0) {
             console.warn(`[Analytics RequireSuperuser] User ID ${req.user.id} not found in database.`);
             return res.status(403).json({ error: 'Forbidden: User not found.' });
        }
        const accountType = userCheck.rows[0].account_type;
        if (accountType !== 'superuser') {
            console.warn(`[Analytics RequireSuperuser] Access denied for user ID ${req.user.id}. Account type: ${accountType}`);
            return res.status(403).json({ error: 'Forbidden: Superuser access required.' });
        }
        console.log(`[Analytics RequireSuperuser] User ID ${req.user.id} verified as superuser.`);
        next();
    } catch (authErr) {
        console.error('[Analytics RequireSuperuser] Database query error during permission check:', authErr);
        if (authErr.code === '42P01') {
             console.error('[Analytics RequireSuperuser] FATAL: "users" table does not exist or cannot be accessed.');
             return res.status(500).json({ error: 'Server configuration error: User table not found or inaccessible.' });
        }
        return next(new Error('Database error during permission verification.'));
    }
};

// --- Validation ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("[Analytics Validation Error]", req.path, errors.array());
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Validation for original /trends endpoint
const validateTrendsQuery = [
  query('itemType').isIn(['restaurant', 'dish', 'list']).withMessage('itemType must be restaurant, dish, or list.'),
  query('itemId').isInt({ gt: 0 }).withMessage('itemId must be a positive integer.'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period. Allowed: 7d, 30d, 90d, 1y.'),
];

// Validation for new /aggregate-trends endpoint
const validateAggregateTrendsQuery = [
  query('itemType').isIn(['restaurant', 'dish', 'list']).withMessage('itemType must be restaurant, dish, or list.'), // Allow list type aggregation too
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period. Allowed: 7d, 30d, 90d, 1y.'),
];

// Apply Common Middleware (Apply selectively if needed)
router.use(authMiddleware);
router.use(requireSuperuser); // Assuming all analytics require superuser for now

// --- Routes ---

// GET /api/analytics/summary (Uses lowercase table names)
router.get('/summary', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /summary] Fetching summary counts.`);
    try {
        const [ restaurantCountRes, dishCountRes, listCountRes, userCountRes, pendingSubmissionCountRes, totalEngagementCountRes ] = await Promise.all([
            currentDb.query('SELECT COUNT(*) FROM restaurants'),
            currentDb.query('SELECT COUNT(*) FROM dishes'),
            currentDb.query('SELECT COUNT(*) FROM lists'),
            currentDb.query('SELECT COUNT(*) FROM users'),
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'pending'"),
            currentDb.query('SELECT COUNT(*) FROM engagements')
        ]);
        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);
        const summaryData = { restaurants: parseCount(restaurantCountRes), dishes: parseCount(dishCountRes), lists: parseCount(listCountRes), users: parseCount(userCountRes), pendingSubmissions: parseCount(pendingSubmissionCountRes), totalEngagements: parseCount(totalEngagementCountRes) };
        console.log(`[Analytics GET /summary] Counts fetched:`, summaryData);
        res.status(200).json(summaryData);
    } catch (err) {
        console.error(`[Analytics GET /summary] Error fetching summary counts:`, err);
        if (err.code === '42P01') {
            const missingTable = err.message.match(/relation ["']?(.*?)["']? does not exist/)?.[1] || 'analytics table';
            console.error(`[Analytics GET /summary] Database Error: Table "${missingTable}" likely does not exist.`);
            return res.status(500).json({ error: `Database schema error: Table '${missingTable}' missing.` });
        }
        next(err);
    }
});

// GET /api/analytics/submissions (Uses lowercase table name)
router.get('/submissions', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /submissions] Fetching submission stats.`);
    try {
        const [ pendingRes, approvedRes, rejectedRes ] = await Promise.all([
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'pending'"),
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'approved'"),
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'rejected'")
        ]);
        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);
        const submissionStats = { pending: parseCount(pendingRes), approved: parseCount(approvedRes), rejected: parseCount(rejectedRes) };
        console.log(`[Analytics GET /submissions] Stats fetched:`, submissionStats);
        res.status(200).json(submissionStats);
    } catch (err) {
        console.error(`[Analytics GET /submissions] Error fetching submission stats:`, err);
        if (err.code === '42P01') { console.error(`[Analytics GET /submissions] Database Error: The 'submissions' table likely does not exist.`); return res.status(500).json({ error: 'Database schema error: Submissions table missing.' }); }
        next(err);
    }
});

// GET /api/analytics/content-distribution (Uses lowercase table names)
router.get('/content-distribution', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /content-distribution] Fetching content distribution.`);
    try {
        const [ byCityRes, byCuisineRes ] = await Promise.all([
            currentDb.query(`SELECT city_name, COUNT(*) as count FROM restaurants WHERE city_name IS NOT NULL GROUP BY city_name ORDER BY count DESC LIMIT 10`),
            currentDb.query(`SELECT h.name as cuisine, COUNT(rh.restaurant_id) as count FROM restauranthashtags rh JOIN hashtags h ON rh.hashtag_id = h.id WHERE h.category = 'cuisine' GROUP BY h.name ORDER BY count DESC LIMIT 10`)
        ]);
        const contentDistribution = {
            byCity: byCityRes.rows.map(row => ({ city: row.city_name, count: parseInt(row.count) })),
            byCuisine: byCuisineRes.rows.map(row => ({ cuisine: row.cuisine, count: parseInt(row.count) }))
        };
        console.log(`[Analytics GET /content-distribution] Distribution fetched:`, contentDistribution);
        res.status(200).json(contentDistribution);
    } catch (err) {
        console.error(`[Analytics GET /content-distribution] Error fetching content distribution:`, err);
        if (err.code === '42P01') { const missingTable = err.message.match(/relation ["']?(.*?)["']? does not exist/)?.[1] || 'table'; console.error(`[Analytics GET /content-distribution] Database Error: Table "${missingTable}" likely does not exist.`); return res.status(500).json({ error: `Database schema error: Table missing for content distribution ('${missingTable}').` }); }
        next(err);
    }
});

// GET /api/analytics/users (Uses lowercase table names)
router.get('/users', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /users] Fetching user metrics.`);
    try {
        const [ activeUsersRes, newUsersRes ] = await Promise.all([
            currentDb.query(`SELECT COUNT(DISTINCT user_id) FROM engagements WHERE engagement_timestamp >= NOW() - INTERVAL '30 days' AND user_id IS NOT NULL`),
            currentDb.query(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`)
        ]);
        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);
        const userMetrics = { activeUsers: parseCount(activeUsersRes), newUsersLast30Days: parseCount(newUsersRes) };
        console.log(`[Analytics GET /users] Metrics fetched:`, userMetrics);
        res.status(200).json(userMetrics);
    } catch (err) {
        console.error(`[Analytics GET /users] Error fetching user metrics:`, err);
        if (err.code === '42P01') { const missingTable = err.message.match(/relation ["']?(.*?)["']? does not exist/)?.[1] || 'analytics table'; console.error(`[Analytics GET /users] Database Error: Table "${missingTable}" likely does not exist.`); return res.status(500).json({ error: `Database schema error: Analytics table missing ('${missingTable}').` }); }
        next(err);
    }
});

// GET /api/analytics/engagements (Uses lowercase table name)
router.get('/engagements', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /engagements] Fetching engagement details.`);
    try {
        const [ viewsRes, clicksRes, addsRes, sharesRes ] = await Promise.all([
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'view'"),
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'click'"),
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'add_to_list'"),
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'share'")
        ]);
        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);
        const engagementDetails = { views: parseCount(viewsRes), clicks: parseCount(clicksRes), adds: parseCount(addsRes), shares: parseCount(sharesRes) };
        console.log(`[Analytics GET /engagements] Details fetched:`, engagementDetails);
        res.status(200).json(engagementDetails);
    } catch (err) {
        console.error(`[Analytics GET /engagements] Error fetching engagement details:`, err);
         if (err.code === '42P01') { console.error(`[Analytics GET /engagements] Database Error: The 'engagements' table likely does not exist.`); return res.status(500).json({ error: 'Database schema error: Engagements table missing.' }); }
        next(err);
    }
});

// GET /api/analytics/trends (Original endpoint for single item)
router.get(
    '/trends',
    validateTrendsQuery,
    handleValidationErrors,
    async (req, res, next) => { /* ... existing single-item trend logic ... */ }
);

// --- NEW: Aggregate Trend Data Endpoint ---
router.get(
    '/aggregate-trends',
    validateAggregateTrendsQuery, // Apply validation rules
    handleValidationErrors, // Handle validation errors
    async (req, res, next) => {
        const { itemType, period = '30d' } = req.query; // Default period to 30 days
        const currentDb = req.app?.get('db') || db;
        console.log(`[Analytics GET /aggregate-trends] Fetching aggregate trends for itemType=${itemType}, period=${period}`);

        // Map period string to a SQL interval
        let interval;
        switch (period) {
            case '7d': interval = '7 days'; break;
            case '90d': interval = '90 days'; break;
            case '1y': interval = '1 year'; break;
            case '30d':
            default: interval = '30 days'; break;
        }
        const startDate = `NOW() - INTERVAL '${interval}'`;

        try {
            // Query to aggregate engagement counts per day for the specified itemType
            // Uses lowercase table/column names
            const query = `
                SELECT
                    date_trunc('day', engagement_timestamp)::date AS date,
                    engagement_type,
                    COUNT(*) AS count
                FROM engagements
                WHERE
                    item_type = $1 AND      -- Filter by itemType
                    engagement_timestamp >= ${startDate}
                GROUP BY date_trunc('day', engagement_timestamp)::date, engagement_type
                ORDER BY date ASC;
            `;

            console.log(`[Analytics GET /aggregate-trends] Executing query with params: [${itemType}]`);
            const result = await currentDb.query(query, [itemType]);

            // Process results into the desired format: [{ date: 'YYYY-MM-DD', views: N, clicks: N, adds: N, shares: N }, ...]
            const trends = {};
            result.rows.forEach(row => {
                const dateStr = row.date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
                if (!trends[dateStr]) {
                    trends[dateStr] = { date: dateStr, views: 0, clicks: 0, adds: 0, shares: 0 };
                }
                const count = parseInt(row.count, 10);
                switch (row.engagement_type) {
                    case 'view': trends[dateStr].views += count; break;
                    case 'click': trends[dateStr].clicks += count; break;
                    case 'add_to_list': trends[dateStr].adds += count; break;
                    case 'share': trends[dateStr].shares += count; break;
                }
            });

            // Convert the trends object into a sorted array
            const formattedTrends = Object.values(trends).sort((a, b) => new Date(a.date) - new Date(b.date));

            console.log(`[Analytics GET /aggregate-trends] Found ${formattedTrends.length} data points for ${itemType}.`);
            res.status(200).json(formattedTrends);

        } catch (err) {
            console.error(`[Analytics GET /aggregate-trends] Error fetching aggregate trends for ${itemType}:`, err);
             if (err.code === '42P01') { // Undefined table
                 console.error(`[Analytics GET /aggregate-trends] Database Error: The 'engagements' table likely does not exist.`);
                 return res.status(500).json({ error: 'Database schema error: Engagements table missing.' });
             }
            next(err); // Pass to global error handler
        }
    }
);


export default router;