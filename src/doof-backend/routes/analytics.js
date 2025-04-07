// src/doof-backend/routes/analytics.js
import express from 'express';
import db from '../db/index.js'; // Use global import alias '@/db/index.js' if configured, otherwise relative
import authMiddleware from '../middleware/auth.js'; // Use global import alias '@/middleware/auth.js' if configured, otherwise relative

const router = express.Router();

// --- Middleware (Duplicated from admin.js for simplicity) ---
// Middleware to check for superuser
const requireSuperuser = async (req, res, next) => {
  const currentDb = req.app?.get('db') || db;
  // Check if req.user exists and has an id (from authMiddleware)
  if (!req.user || typeof req.user.id === 'undefined') {
      console.warn('[Analytics RequireSuperuser] Auth middleware did not attach user or user ID.');
      return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
      const userCheck = await currentDb.query('SELECT account_type FROM Users WHERE id = $1', [req.user.id]);
      // Ensure user was found in DB and is a superuser
      if (userCheck.rows.length === 0 || userCheck.rows[0].account_type !== 'superuser') {
        console.warn(`[Analytics RequireSuperuser] Access denied for user ID ${req.user.id}. Account type: ${userCheck.rows[0]?.account_type}`);
        return res.status(403).json({ error: 'Forbidden: Superuser access required.' });
      }
      next(); // Proceed if superuser
  } catch(authErr) {
       console.error('[Analytics RequireSuperuser] Auth check error:', authErr);
       // Pass DB error to general handler
       return next(new Error('Failed to verify user permissions.'));
  }
};


// --- Routes ---

// GET /api/analytics/summary
// Fetches basic counts for key entities.
router.get(
    '/summary',
    authMiddleware,    // Ensure user is logged in
    requireSuperuser,  // Ensure user is a superuser
    async (req, res, next) => {
        const currentDb = req.app?.get('db') || db;
        console.log(`[Analytics GET /summary] Fetching summary counts.`);

        try {
            // Use Promise.all to fetch counts concurrently
            const [
                restaurantCountRes,
                dishCountRes,
                listCountRes,
                userCountRes,
                pendingSubmissionCountRes,
                totalEngagementCountRes // Added engagement count
            ] = await Promise.all([
                currentDb.query('SELECT COUNT(*) FROM Restaurants'),
                currentDb.query('SELECT COUNT(*) FROM Dishes'),
                currentDb.query('SELECT COUNT(*) FROM Lists'),
                currentDb.query('SELECT COUNT(*) FROM Users'),
                currentDb.query("SELECT COUNT(*) FROM Submissions WHERE status = 'pending'"),
                currentDb.query('SELECT COUNT(*) FROM Engagements') // Count total engagement events
            ]);

            // Helper to safely parse count results
            const parseCount = (result) => parseInt(result?.rows?.[0]?.count || '0', 10);

            const summaryData = {
                restaurants: parseCount(restaurantCountRes),
                dishes: parseCount(dishCountRes),
                lists: parseCount(listCountRes),
                users: parseCount(userCountRes),
                pendingSubmissions: parseCount(pendingSubmissionCountRes),
                totalEngagements: parseCount(totalEngagementCountRes) // Added engagement count
            };

            console.log(`[Analytics GET /summary] Counts fetched:`, summaryData);
            res.status(200).json(summaryData);

        } catch (err) {
            console.error(`[Analytics GET /summary] Error fetching summary counts:`, err);
            next(err); // Pass error to the global error handler
        }
    }
);

// --- Placeholder for future analytics endpoints ---

// GET /api/analytics/submissions
// router.get('/submissions', authMiddleware, requireSuperuser, async (req, res, next) => { /* ... */ });

// GET /api/analytics/content
// router.get('/content', authMiddleware, requireSuperuser, async (req, res, next) => { /* ... */ });

// GET /api/analytics/users
// router.get('/users', authMiddleware, requireSuperuser, async (req, res, next) => { /* ... */ });

// GET /api/analytics/engagement
// router.get('/engagement', authMiddleware, requireSuperuser, async (req, res, next) => { /* ... */ });


export default router;