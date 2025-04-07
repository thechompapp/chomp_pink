// src/doof-backend/routes/analytics.js
import express from 'express';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// --- Middleware ---
// requireSuperuser middleware (using lowercase 'users' table)
const requireSuperuser = async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    if (!req.user || typeof req.user.id === 'undefined') {
        console.warn('[Analytics RequireSuperuser] Auth middleware did not attach user or user ID.');
        return res.status(401).json({ error: 'Authentication required or invalid token payload.' });
    }
    try {
        // Use lowercase unquoted table and column names
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
        if (authErr.code === '42P01') { // Undefined table
             console.error('[Analytics RequireSuperuser] FATAL: "users" table does not exist or cannot be accessed.');
             return res.status(500).json({ error: 'Server configuration error: User table not found or inaccessible.' });
        }
        return next(new Error('Database error during permission verification.'));
    }
};

// Apply common middleware
router.use(authMiddleware);
router.use(requireSuperuser);


// --- Routes ---

// GET /api/analytics/summary
router.get('/summary', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /summary] Fetching summary counts.`);
    try {
        // *** USE LOWERCASE, UNQUOTED TABLE NAMES ***
        const [
            restaurantCountRes,
            dishCountRes,
            listCountRes,
            userCountRes,
            pendingSubmissionCountRes,
            totalEngagementCountRes
        ] = await Promise.all([
            currentDb.query('SELECT COUNT(*) FROM restaurants'),
            currentDb.query('SELECT COUNT(*) FROM dishes'),
            currentDb.query('SELECT COUNT(*) FROM lists'),
            currentDb.query('SELECT COUNT(*) FROM users'),
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'pending'"),
            currentDb.query('SELECT COUNT(*) FROM engagements')
        ]);

        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);

        const summaryData = {
            restaurants: parseCount(restaurantCountRes),
            dishes: parseCount(dishCountRes),
            lists: parseCount(listCountRes),
            users: parseCount(userCountRes),
            pendingSubmissions: parseCount(pendingSubmissionCountRes),
            totalEngagements: parseCount(totalEngagementCountRes)
        };

        console.log(`[Analytics GET /summary] Counts fetched:`, summaryData);
        res.status(200).json(summaryData);
    } catch (err) {
        console.error(`[Analytics GET /summary] Error fetching summary counts:`, err);
        if (err.code === '42P01') { // Undefined table
            const missingTable = err.message.match(/relation "(.*?)" does not exist/)?.[1] || err.message.match(/relation (.*?) does not exist/)?.[1] || 'analytics table';
            console.error(`[Analytics GET /summary] Database Error: Table "${missingTable}" likely does not exist. Ensure setup.sql ran successfully.`);
             return res.status(500).json({ error: `Database schema error: Table '${missingTable}' missing.` });
        }
        next(err);
    }
});

// GET /api/analytics/submissions
router.get('/submissions', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /submissions] Fetching submission stats.`);
    try {
        // *** Use lowercase unquoted table name ***
        const [
            pendingRes,
            approvedRes,
            rejectedRes
        ] = await Promise.all([
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'pending'"),
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'approved'"),
            currentDb.query("SELECT COUNT(*) FROM submissions WHERE status = 'rejected'")
        ]);

        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);

        const submissionStats = {
            pending: parseCount(pendingRes),
            approved: parseCount(approvedRes),
            rejected: parseCount(rejectedRes)
        };

        console.log(`[Analytics GET /submissions] Stats fetched:`, submissionStats);
        res.status(200).json(submissionStats);
    } catch (err) {
        console.error(`[Analytics GET /submissions] Error fetching submission stats:`, err);
         if (err.code === '42P01') { // Undefined table
            console.error(`[Analytics GET /submissions] Database Error: The 'submissions' table likely does not exist.`);
            return res.status(500).json({ error: 'Database schema error: Submissions table missing.' });
         }
        next(err);
    }
});

// GET /api/analytics/content-distribution
router.get('/content-distribution', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /content-distribution] Fetching content distribution.`);
    try {
         // *** Use lowercase unquoted table/column names ***
        const [
            byCityRes,
            byCuisineRes
        ] = await Promise.all([
            currentDb.query(`
                SELECT city_name, COUNT(*) as count
                FROM restaurants
                WHERE city_name IS NOT NULL
                GROUP BY city_name
                ORDER BY count DESC
                LIMIT 10
            `),
            currentDb.query(`
                SELECT h.name as cuisine, COUNT(rh.restaurant_id) as count
                FROM restauranthashtags rh
                JOIN hashtags h ON rh.hashtag_id = h.id
                WHERE h.category = 'cuisine'
                GROUP BY h.name
                ORDER BY count DESC
                LIMIT 10
            `)
        ]);

        const contentDistribution = {
            byCity: byCityRes.rows.map(row => ({ city: row.city_name, count: parseInt(row.count) })),
            byCuisine: byCuisineRes.rows.map(row => ({ cuisine: row.cuisine, count: parseInt(row.count) }))
        };

        console.log(`[Analytics GET /content-distribution] Distribution fetched:`, contentDistribution);
        res.status(200).json(contentDistribution);
    } catch (err) {
        console.error(`[Analytics GET /content-distribution] Error fetching content distribution:`, err);
         if (err.code === '42P01') { // Undefined table
            const missingTable = err.message.match(/relation "(.*?)" does not exist/)?.[1] || err.message.match(/relation (.*?) does not exist/)?.[1] || 'table';
            console.error(`[Analytics GET /content-distribution] Database Error: Table "${missingTable}" likely does not exist.`);
            return res.status(500).json({ error: `Database schema error: Table missing for content distribution ('${missingTable}').` });
         }
        next(err);
    }
});

// GET /api/analytics/users
router.get('/users', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /users] Fetching user metrics.`);
    try {
         // *** Use lowercase unquoted table names ***
        const [
            activeUsersRes,
            newUsersRes
        ] = await Promise.all([
            currentDb.query(`
                SELECT COUNT(DISTINCT user_id)
                FROM engagements
                WHERE engagement_timestamp >= NOW() - INTERVAL '30 days'
                AND user_id IS NOT NULL
            `),
            currentDb.query(`
                SELECT COUNT(*)
                FROM users
                WHERE created_at >= NOW() - INTERVAL '30 days'
            `)
        ]);

        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);

        const userMetrics = {
            activeUsers: parseCount(activeUsersRes),
            newUsersLast30Days: parseCount(newUsersRes)
        };

        console.log(`[Analytics GET /users] Metrics fetched:`, userMetrics);
        res.status(200).json(userMetrics);
    } catch (err) {
        console.error(`[Analytics GET /users] Error fetching user metrics:`, err);
        if (err.code === '42P01') { // Undefined table
            const missingTable = err.message.match(/relation "(.*?)" does not exist/)?.[1] || err.message.match(/relation (.*?) does not exist/)?.[1] || 'analytics table';
            console.error(`[Analytics GET /users] Database Error: Table "${missingTable}" likely does not exist.`);
            return res.status(500).json({ error: `Database schema error: Analytics table missing ('${missingTable}').` });
        }
        next(err);
    }
});

// GET /api/analytics/engagements
router.get('/engagements', async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    console.log(`[Analytics GET /engagements] Fetching engagement details.`);
    try {
         // *** Use lowercase unquoted table name ***
        const [
            viewsRes,
            clicksRes,
            addsRes,
            sharesRes
        ] = await Promise.all([
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'view'"),
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'click'"),
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'add_to_list'"),
            currentDb.query("SELECT COUNT(*) FROM engagements WHERE engagement_type = 'share'")
        ]);

        const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);

        const engagementDetails = {
            views: parseCount(viewsRes),
            clicks: parseCount(clicksRes),
            adds: parseCount(addsRes),
            shares: parseCount(sharesRes)
        };

        console.log(`[Analytics GET /engagements] Details fetched:`, engagementDetails);
        res.status(200).json(engagementDetails);
    } catch (err) {
        console.error(`[Analytics GET /engagements] Error fetching engagement details:`, err);
         if (err.code === '42P01') { // Undefined table
             console.error(`[Analytics GET /engagements] Database Error: The 'engagements' table likely does not exist. Please ensure setup.sql has been run successfully.`);
             return res.status(500).json({ error: 'Database schema error: Engagements table missing.' });
         }
        next(err);
    }
});

export default router;