// src/doof-backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5001;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";

// PostgreSQL connection Pool
const pool = new Pool({
  user: process.env.DB_USER || 'doof_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'doof_db',
  password: process.env.DB_PASSWORD || 'doof',
  port: process.env.DB_PORT || 5432,
});

// Google Maps client (for Places API)
let googleMapsClient = null;
if (GOOGLE_API_KEY) {
    googleMapsClient = new Client({});
    console.log("Google Maps Client initialized (for Places API).");
} else {
    console.warn("GOOGLE_API_KEY not found. Google Places API features will be disabled.");
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// DB connection test
let dbAccessible = false;
const connectDb = async () => {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    dbAccessible = true;
    client.release();
  } catch (err) {
    console.error('Error connecting to PostgreSQL:', err.stack);
    dbAccessible = false;
  }
};
connectDb();

// Helper Function
const handleDbQuery = async (queryFn, fallbackData = []) => {
  if (!dbAccessible) {
    console.warn("Database unavailable, returning fallback/empty data.");
    return fallbackData;
  }
  try {
    const result = await queryFn();
    return result.rows;
  } catch (err) {
    console.error('Database query error:', err);
     if (fallbackData !== undefined) return fallbackData;
     else throw err;
  }
};

// =============================================
// == NEW/UPDATED API ENDPOINTS (IMPLEMENT TODOs) ==
// =============================================

// --- Filter Data Endpoints ---

// GET /api/cities
app.get('/api/cities', async (req, res) => {
  console.log("[API GET /api/cities] Request received.");
  try {
    const queryText = 'SELECT id, name, short_code FROM Cities ORDER BY name ASC';
    const cities = await handleDbQuery(async () => await pool.query(queryText), []);
    console.log(`[API GET /api/cities] Found ${cities.length} cities.`);
    res.json(cities);
  } catch (err) {
    console.error("[API GET /api/cities] Error:", err);
    res.status(500).json({ error: 'Failed to fetch cities', details: err.message });
  }
});

// GET /api/neighborhoods?cityId=...
app.get('/api/neighborhoods', async (req, res) => {
  const { cityId } = req.query;
  console.log(`[API GET /api/neighborhoods] Request for cityId: ${cityId}`);
  if (!cityId || isNaN(parseInt(cityId))) {
    return res.status(400).json({ error: 'Valid cityId query parameter is required' });
  }
  try {
    // *** TODO: Implement SQL query to fetch neighborhoods ***
    // This query assumes 'city_id' FK exists on Neighborhoods table. Adjust if needed.
    const queryText = `
        SELECT id, neighborhood as name
        FROM Neighborhoods
        WHERE city_id = $1 -- Adjust if your schema links cities differently
        ORDER BY neighborhood ASC
    `;
    const neighborhoods = await handleDbQuery(async () => await pool.query(queryText, [cityId]), []);
    console.log(`[API GET /api/neighborhoods] Found ${neighborhoods.length} for cityId: ${cityId}.`);
    res.json(neighborhoods); // Expecting [{id: 1, name: "Soho"}, ...]
  } catch (err) {
    console.error(`[API GET /api/neighborhoods] Error for cityId ${cityId}:`, err);
    res.status(500).json({ error: 'Failed to fetch neighborhoods', details: err.message });
  }
});

// GET /api/cuisines
app.get('/api/cuisines', async (req, res) => {
    console.log("[API GET /api/cuisines] Request received.");
    try {
        // *** TODO: Decide how cuisines are defined and implement query ***
        // Using a predefined list of tags from Hashtags table as example:
        const queryText = `
            SELECT id, name FROM Hashtags
            WHERE name IN ('italian', 'mexican', 'chinese', 'japanese', 'indian', 'thai', 'french', 'american', 'pizza', 'burger', 'sushi', 'ramen', 'tacos', 'vegetarian', 'vegan', 'seafood', 'bbq', 'korean', 'vietnamese', 'mediterranean', 'middle eastern')
            ORDER BY name ASC
        `;
        const cuisines = await handleDbQuery(async () => await pool.query(queryText), []);
        console.log(`[API GET /api/cuisines] Found ${cuisines.length} cuisines.`);
        res.json(cuisines); // Expecting [{id: 1, name: 'american'}, ...]
    } catch (err) {
        console.error("[API GET /api/cuisines] Error:", err);
        res.status(500).json({ error: 'Failed to fetch cuisines', details: err.message });
    }
});

// GET /api/hashtags/suggestions?query=...
app.get('/api/hashtags/suggestions', async (req, res) => {
    const { query } = req.query;
    console.log(`[API GET /api/hashtags/suggestions] Request query: "${query}"`);
    if (!query || query.length < 2) return res.json([]);
    try {
        // *** TODO: Implement suggestion logic (simple ILIKE shown) ***
        const queryText = `SELECT name FROM Hashtags WHERE name ILIKE $1 ORDER BY name ASC LIMIT 10;`;
        const suggestions = await handleDbQuery(async () => await pool.query(queryText, [`%${query}%`]), []);
        console.log(`[API GET /api/hashtags/suggestions] Found ${suggestions.length} for "${query}".`);
        res.json(suggestions.map(s => s.name));
    } catch (err) {
        console.error(`[API GET /api/hashtags/suggestions] Error for "${query}":`, err);
        res.status(500).json({ error: 'Failed hashtag suggestions', details: err.message });
    }
});

// --- Updated Data Endpoints ---

// GET /api/trending/restaurants (Corrected JOIN, includes filter structure)
app.get('/api/trending/restaurants', async (req, res) => {
  const { cityId, neighborhoodId, cuisine } = req.query;
  console.log(`[API GET /api/trending/restaurants] Filters:`, req.query);
  try {
    let queryText = ` SELECT r.id, r.name, r.neighborhood, r.city, r.adds, r.created_at FROM Restaurants r `;
    const joins = [];
    const conditions = ["1=1"];
    const queryParams = [];
    let paramIndex = 1;

    // *** TODO: Implement filtering logic based on your schema ***
    if (cityId && !isNaN(parseInt(cityId))) {
         // Example: Assumes Restaurants table has 'city_id' FK
         // conditions.push(`r.city_id = $${paramIndex++}`);
         // queryParams.push(cityId);
         // Fallback by name (less efficient):
         conditions.push(`r.city = (SELECT name FROM Cities WHERE id = $${paramIndex++})`); queryParams.push(cityId);
    }
    if (neighborhoodId && !isNaN(parseInt(neighborhoodId))) {
         // Example: Assumes Restaurants table has 'neighborhood_id' FK
         // conditions.push(`r.neighborhood_id = $${paramIndex++}`);
         // queryParams.push(neighborhoodId);
         // Fallback by name:
          conditions.push(`r.neighborhood = (SELECT neighborhood FROM Neighborhoods WHERE id = $${paramIndex++})`); queryParams.push(neighborhoodId);
    }
     if (cuisine) { // Assuming 'cuisine' is a tag name
         if (!joins.includes('hashtags')) {
             joins.push(`LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id`);
             joins.push(`LEFT JOIN Hashtags h ON rh.hashtag_id = h.id`);
         }
         conditions.push(`h.name ILIKE $${paramIndex++}`); queryParams.push(cuisine);
     }

    queryText += ` ${joins.join(' ')} WHERE ${conditions.join(' AND ')} `;
    queryText += ` GROUP BY r.id ORDER BY r.adds DESC LIMIT 15`;

    console.log("[API GET /api/trending/restaurants] Query:", queryText.replace(/\s+/g, ' '), queryParams);
    const restaurants = await handleDbQuery(async () => await pool.query(queryText, queryParams), []);
    console.log(`[API GET /api/trending/restaurants] Found ${restaurants.length}.`);
    res.json(restaurants);
  } catch (err) {
    console.error(`[API GET /api/trending/restaurants] DB Error:`, err);
    res.status(500).json({ error: 'Failed fetch trending restaurants', details: err.message, code: err.code });
  }
});

// GET /api/trending/dishes (Needs filter & tag JOIN)
app.get('/api/trending/dishes', async (req, res) => {
    const { cityId, neighborhoodId, cuisine } = req.query;
    console.log(`[API GET /api/trending/dishes] Filters:`, req.query);
    try {
        // *** TODO: Implement filtering & JOIN for tags ***
        let queryText = ` SELECT d.id, d.name, d.adds, d.created_at, r.id as restaurant_id, r.name as restaurant_name, r.neighborhood, r.city FROM Dishes d LEFT JOIN Restaurants r ON d.restaurant_id = r.id `;
        const joins = []; const conditions = ["1=1"]; const queryParams = []; let paramIndex = 1;

        // Add filter conditions here (e.g., WHERE r.city_id = $1, JOIN DishHashtags/Hashtags WHERE h.name = $2 etc.)

        queryText += ` ${joins.join(' ')} WHERE ${conditions.join(' AND ')} GROUP BY d.id, r.id ORDER BY d.adds DESC LIMIT 15`;

        console.log("[API GET /api/trending/dishes] Query:", queryText.replace(/\s+/g, ' '), queryParams);
        const dishes = await handleDbQuery(async() => await pool.query(queryText, queryParams), []);
        console.log(`[API GET /api/trending/dishes] Found ${dishes.length}.`);
        res.json(dishes);
    } catch (err) { console.error(`[API GET /api/trending/dishes] DB Error:`, err); res.status(500).json({ error: 'Failed fetch trending dishes', details: err.message }); }
});

// GET /api/popular/lists (Needs filter & tag JOIN)
app.get('/api/popular/lists', async (req, res) => {
    const { cityId, cuisine } = req.query;
    console.log(`[API GET /api/popular/lists] Filters:`, req.query);
    try {
        // *** TODO: Implement filtering & JOIN for tags (ListHashtags?) ***
        let queryText = ` SELECT l.* FROM Lists l `;
        const joins = []; const conditions = ["l.is_public = TRUE"]; const queryParams = []; let paramIndex = 1;

        // Add filter conditions here (e.g., WHERE l.city_id = $1, JOIN ListHashtags/Hashtags WHERE h.name = $2 etc.)

        queryText += ` ${joins.join(' ')} WHERE ${conditions.join(' AND ')} GROUP BY l.id ORDER BY l.saved_count DESC LIMIT 15`;

        console.log("[API GET /api/popular/lists] Query:", queryText.replace(/\s+/g, ' '), queryParams);
        const lists = await handleDbQuery(async() => await pool.query(queryText, queryParams), []);
        console.log(`[API GET /api/popular/lists] Found ${lists.length}.`);
        res.json(lists);
    } catch (err) { console.error(`[API GET /api/popular/lists] DB Error:`, err); res.status(500).json({ error: 'Failed fetch popular lists', details: err.message }); }
});

// GET /api/lists (User's lists - Needs tag JOIN if displaying tags)
app.get('/api/lists', async (req, res) => {
    console.log(`[API GET /api/lists] Request received.`);
    try {
        // *** TODO: Add JOIN for tags if needed by frontend list cards ***
        const queryText = ` SELECT l.*, COALESCE(l.is_public, true) as is_public, COALESCE(l.created_by_user, false) as created_by_user, COALESCE(l.is_following, false) as is_following
                            -- Optional tag aggregation: ,array_agg(h.name) FILTER (WHERE h.id IS NOT NULL) as tags
                            FROM Lists l
                            -- Optional JOINs: LEFT JOIN ListHashtags lh ON l.id = lh.list_id LEFT JOIN Hashtags h ON lh.hashtag_id = h.id
                            -- WHERE l.user_id = $1 -- Add user filtering later
                            GROUP BY l.id ORDER BY l.name ASC `;
        const lists = await handleDbQuery(async () => await pool.query(queryText), []);
        console.log(`[API GET /api/lists] Sending ${lists.length}.`);
        res.json(lists);
    } catch (err) { console.error(`[API GET /api/lists] Error:`, err); res.status(500).json({ error: 'Failed fetch user lists', details: err.message }); }
});

// GET /api/restaurants/:id (Updated structure - Needs field implementation)
app.get('/api/restaurants/:id', async (req, res) => {
     const { id } = req.params; if (isNaN(parseInt(id))) return res.status(400).json({ message: 'Invalid ID' });
     console.log(`[API GET /api/restaurants/:id] Request ID: ${id}`);
     try {
         // *** TODO: Ensure your Restaurants table has columns like website, address, phone etc. ***
         const restaurantQuery = 'SELECT * FROM Restaurants WHERE id = $1'; // Fetch all columns for now
         const dishesQuery = 'SELECT * FROM Dishes WHERE restaurant_id = $1 ORDER BY adds DESC';
         const tagsQuery = `SELECT h.name FROM Hashtags h JOIN RestaurantHashtags rh ON h.id = rh.hashtag_id WHERE rh.restaurant_id = $1;`;
         const [restRes, dishRes, tagRes] = await Promise.all([ pool.query(restaurantQuery, [id]), pool.query(dishesQuery, [id]), pool.query(tagsQuery, [id]) ]);
         if (restRes.rows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
         const restaurant = restRes.rows[0]; restaurant.dishes = dishRes.rows; restaurant.tags = tagRes.rows.map(t => t.name);
         // Provide defaults/placeholders if DB columns don't exist yet
         restaurant.website = restaurant.website || null; restaurant.address = restaurant.address || "Address TBD"; restaurant.phone = restaurant.phone || null; /* etc. */
         console.log(`[API GET /api/restaurants/:id] Found details ID: ${id}`);
         res.json(restaurant);
     } catch (err) { console.error(`[API GET /api/restaurants/:id] Error ID ${id}:`, err); res.status(500).json({ error: 'Failed fetch restaurant details', details: err.message }); }
});

// GET /api/dishes/:id (Needs tag JOIN)
app.get('/api/dishes/:id', async (req, res) => {
    const { id } = req.params; if (isNaN(parseInt(id))) return res.status(400).json({ message: 'Invalid ID' });
    console.log(`[API GET /api/dishes/:id] Request ID: ${id}`);
    try {
        // *** TODO: Implement query JOINing for tags ***
        const dishQuery = ` SELECT d.*, r.name as restaurant_name, r.id as restaurant_id FROM Dishes d LEFT JOIN Restaurants r ON d.restaurant_id = r.id WHERE d.id = $1 `;
        const tagsQuery = ` SELECT h.name FROM Hashtags h JOIN DishHashtags dh ON h.id = dh.hashtag_id WHERE dh.dish_id = $1; `;
        const [dishRes, tagRes] = await Promise.all([ pool.query(dishQuery, [id]), pool.query(tagsQuery, [id]) ]);
        if (dishRes.rows.length === 0) return res.status(404).json({ message: 'Dish not found' });
        const dish = dishRes.rows[0]; dish.tags = tagRes.rows.map(t => t.name);
        console.log(`[API GET /api/dishes/:id] Found details ID: ${id}`);
        res.json(dish);
    } catch(err) { console.error(`[API GET /api/dishes/:id] Error ID ${id}:`, err); res.status(500).json({ error: 'Failed fetch dish details', details: err.message }); }
});

// --- Submission & List Creation (Needs Tag Handling Implementation) ---

// Helper function to find or insert a tag and return its ID
const findOrInsertTag = async (client, tagName) => {
    if (!tagName || typeof tagName !== 'string' || tagName.trim() === '') return null;
    const cleanTagName = tagName.trim().toLowerCase();
    let tagResult = await client.query('SELECT id FROM Hashtags WHERE LOWER(name) = $1', [cleanTagName]);
    if (tagResult.rows.length > 0) {
        return tagResult.rows[0].id;
    } else {
        try {
            tagResult = await client.query('INSERT INTO Hashtags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [cleanTagName]);
             // The ON CONFLICT part handles race conditions more gracefully than checking first
             return tagResult.rows[0].id;
        } catch (insertErr) {
            console.error(`Error inserting tag '${cleanTagName}':`, insertErr);
            // Optionally re-query in case of specific race condition errors if needed, but ON CONFLICT should handle most cases
            return null; // Indicate tag could not be processed
        }
    }
};

// POST /api/lists (Handles tag linking)
app.post('/api/lists', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'DB unavailable' });
  const { name, items, is_public, city, tags /* Array of tag names */ } = req.body; // Assuming user context isn't implemented yet
  if (!name) return res.status(400).json({ error: 'List name required' });
  console.log(`[API POST /api/lists] New list: ${name}`);
  let client;
  try {
    client = await pool.connect(); await client.query('BEGIN');
    // Insert base list info
    const listResult = await client.query( `INSERT INTO Lists (name, items, item_count, saved_count, city, is_public, created_by_user, creator_handle, is_following, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW()) RETURNING *`, [ name, JSON.stringify(items || []), (items || []).length, 0, city || null, is_public !== false, true, 'current_user_placeholder', ] );
    const newList = listResult.rows[0];

    // Handle tags
    if (Array.isArray(tags) && tags.length > 0) {
        console.log(`[API POST /api/lists] Processing ${tags.length} tags for list ${newList.id}...`);
        // *** TODO: Create ListHashtags table if not done yet ***
        // Assuming ListHashtags (list_id, hashtag_id) exists
        for (const tagName of tags) {
           const tagId = await findOrInsertTag(client, tagName); // Use helper function
           if (tagId) {
               await client.query('INSERT INTO ListHashtags (list_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newList.id, tagId]);
           }
        }
    }
    await client.query('COMMIT');
    console.log(`[API POST /api/lists] List ${newList.id} created.`);
    // Fetch the list again with tags to return? Or just return base list? Returning base list for now.
    res.status(201).json(newList);
  } catch (err) { if (client) await client.query('ROLLBACK'); console.error('List creation err:', err); res.status(500).json({ error: 'DB error', details: err.message });
  } finally { if (client) client.release(); }
});

// POST /api/submissions (Keep tags for review dashboard)
app.post('/api/submissions', async (req, res) => { /* ... same as before ... */ });

// POST /api/submissions/:id/approve (Handles tag linking)
app.post('/api/submissions/:id/approve', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'DB unavailable' });
  const { id } = req.params; const submissionId = parseInt(id); if (isNaN(submissionId)) return res.status(400).json({ message: 'Invalid ID' });
  let client;
  try {
    client = await pool.connect(); await client.query('BEGIN');
    const subRes = await client.query('SELECT * FROM Submissions WHERE id = $1 AND status = $2', [submissionId, 'pending']);
    if (subRes.rows.length === 0) { await client.query('ROLLBACK'); client.release(); return res.status(404).json({ message: 'Submission not found/processed' }); }
    const submission = subRes.rows[0]; const submittedTagNames = submission.tags || [];

    let approvedItemId; let itemTypeForTags; let approvedItemData;

    if (submission.type === 'restaurant') {
      const restRes = await client.query( 'INSERT INTO Restaurants (name, neighborhood, city, adds, created_at /* Add new cols */) VALUES ($1, $2, $3, 0, NOW()) RETURNING *', [submission.name, submission.neighborhood, submission.city] );
      approvedItemData = restRes.rows[0]; approvedItemId = approvedItemData.id; itemTypeForTags = 'restaurant';
    } else if (submission.type === 'dish') {
       let restaurantId = null; /* ... logic to find/create restaurantId ... */
       const dishRes = await client.query( 'INSERT INTO Dishes (name, restaurant_id, adds, created_at /* Add new cols */) VALUES ($1, $2, 0, NOW()) RETURNING *', [submission.name, restaurantId] );
       approvedItemData = dishRes.rows[0]; approvedItemId = approvedItemData.id; itemTypeForTags = 'dish';
    } else { await client.query('ROLLBACK'); client.release(); return res.status(400).json({ message: 'Invalid type' }); }

    // Handle tags linking
    if (Array.isArray(submittedTagNames) && submittedTagNames.length > 0) {
        console.log(`[Approval] Linking ${submittedTagNames.length} tags for ${itemTypeForTags} ${approvedItemId}...`);
        const linkTable = itemTypeForTags === 'restaurant' ? 'RestaurantHashtags' : 'DishHashtags';
        const idCol = itemTypeForTags === 'restaurant' ? 'restaurant_id' : 'dish_id';
        for (const tagName of submittedTagNames) {
             const tagId = await findOrInsertTag(client, tagName); // Use helper
             if (tagId) { await client.query(`INSERT INTO ${linkTable} (${idCol}, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [approvedItemId, tagId]); }
        }
    }
    await client.query('UPDATE Submissions SET status = $1 WHERE id = $2', ['approved', submissionId]);
    await client.query('COMMIT');
    console.log(`[Approval] Submission ${submissionId} approved. ${itemTypeForTags} ID ${approvedItemId}.`);
    res.json({ message: 'Submission approved', item: approvedItemData });
  } catch (err) { if (client) await client.query('ROLLBACK'); console.error(`[Approve Sub ${id}] Error:`, err); res.status(500).json({ error: 'DB approval error', details: err.message });
  } finally { if (client) client.release(); }
});

// --- Other Existing Endpoints (Review and Update Tag Logic) ---
app.post('/api/lists/:id/follow', async (req, res) => { /* ... as before ... */ });
app.delete('/api/lists/:id/follow', async (req, res) => { /* ... as before ... */ });
app.put('/api/lists/:id/visibility', async (req, res) => { /* ... as before ... */ });
app.post('/api/submissions/:id/reject', async (req, res) => { /* ... as before ... */ });
app.get('/api/submissions', async (req, res) => { /* ... as before ... */ });
app.get('/api/common-dishes', async (req, res) => { /* ... as before ... */ });

// --- Admin Panel (NEEDS MAJOR TAG UPDATES for GET/PUT/DELETE) ---
// Placeholder: Needs significant work to use JOINs and handle tag updates via linking tables
app.get('/api/admin/restaurants', async (req, res) => { try { const r = await handleDbQuery(async()=> await pool.query('SELECT * FROM Restaurants ORDER BY name ASC LIMIT 50')); res.json(r); } catch(e){ res.status(500).json({error: e.message}); }});
app.put('/api/admin/restaurants/:id', async (req, res) => { /* ... needs tag update logic ... */ res.status(501).json({message: "Tag update not implemented"}); });
app.delete('/api/admin/restaurants/:id', async (req, res) => { /* ... CASCADE should handle links ... */ try { await pool.query('DELETE FROM Restaurants WHERE id=$1', [req.params.id]); res.json({message: "Deleted"}); } catch(e){ res.status(500).json({error: e.message}); }});
app.get('/api/admin/dishes', async (req, res) => { try { const d = await handleDbQuery(async()=> await pool.query('SELECT d.*, r.name as restaurant_name FROM Dishes d LEFT JOIN Restaurants r ON d.restaurant_id = r.id ORDER BY d.name ASC LIMIT 50')); res.json(d); } catch(e){ res.status(500).json({error: e.message}); }});
app.put('/api/admin/dishes/:id', async (req, res) => { /* ... needs tag update logic ... */ res.status(501).json({message: "Tag update not implemented"}); });
app.delete('/api/admin/dishes/:id', async (req, res) => { /* ... CASCADE should handle links ... */ try { await pool.query('DELETE FROM Dishes WHERE id=$1', [req.params.id]); res.json({message: "Deleted"}); } catch(e){ res.status(500).json({error: e.message}); }});
app.get('/api/admin/lists', async (req, res) => { try { const l = await handleDbQuery(async()=> await pool.query('SELECT * FROM Lists ORDER BY name ASC LIMIT 50')); res.json(l); } catch(e){ res.status(500).json({error: e.message}); }});
app.put('/api/admin/lists/:id', async (req, res) => { /* ... needs tag update logic ... */ res.status(501).json({message: "Tag update not implemented"}); });
app.delete('/api/admin/lists/:id', async (req, res) => { /* ... CASCADE should handle links? Needs ListHashtags ... */ try { await pool.query('DELETE FROM Lists WHERE id=$1', [req.params.id]); res.json({message: "Deleted"}); } catch(e){ res.status(500).json({error: e.message}); }});

// Google Places Endpoints (Unchanged)
app.get('/api/places/autocomplete', async (req, res) => { /* ... as before ... */ });
app.get('/api/places/details', async (req, res) => { /* ... as before ... */ });

// Catch-all & Error Handler
app.use((req, res) => { res.status(404).json({ error: 'Not Found' }); });
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: err.message || 'Server Error' }); });

// Start Server
app.listen(PORT, () => { console.log(`Server on ${PORT}. DB accessible: ${dbAccessible}. Google Key: ${!!GOOGLE_API_KEY}`); });