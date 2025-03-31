// src/doof-backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Client } = require('@googlemaps/google-maps-services-js');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5001;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || "";

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'doof_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'doof_db',
  password: process.env.DB_PASSWORD || 'doof',
  port: process.env.DB_PORT || 5432,
});

// Google Maps client
let googleMapsClient = null;
if (GOOGLE_API_KEY) {
    googleMapsClient = new Client({});
    console.log("Google Maps Client initialized.");
} else {
    console.warn("GOOGLE_API_KEY not found. Google Places API features will be disabled.");
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from frontend
  credentials: true, // Allow cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Flag to determine if DB is accessible
let dbAccessible = false;

// Test database connection and set flag
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

// Mock data for fallback (keep as is)
const mockRestaurants = [
  { id: 1, name: "Joe's Pizza", neighborhood: "Greenwich Village", city: "New York", tags: ["pizza", "italian"], adds: 78, created_at: new Date() },
  { id: 2, name: "Shake Shack", neighborhood: "Midtown", city: "New York", tags: ["burger", "american"], adds: 52, created_at: new Date() },
];
const mockDishes = [
  { id: 1, name: "Margherita Pizza", restaurant: "Joe's Pizza", tags: ["pizza", "vegetarian"], price: "$$ • ", adds: 78, created_at: new Date() },
  { id: 2, name: "ShackBurger", restaurant: "Shake Shack", tags: ["burger", "beef"], price: "$$ • ", adds: 52, created_at: new Date() },
];
const mockLists = [
  { id: 1, name: "NYC Pizza Tour", items: [], item_count: 5, saved_count: 120, city: "New York", tags: ["pizza", "nyc"], is_following: false, created_by_user: false, creator_handle: "@foodie1", created_at: new Date(), is_public: true },
  { id: 2, name: "Best Burgers NYC", items: [], item_count: 8, saved_count: 150, city: "New York", tags: ["burgers", "nyc"], is_following: false, created_by_user: false, creator_handle: "@burgerlover", created_at: new Date(), is_public: true },
];


// Helper function to handle DB errors and fallback (keep as is)
const handleDbQuery = async (queryFn, fallbackData) => {
  if (!dbAccessible) {
    console.warn("Database unavailable, returning mock data.");
    return fallbackData;
  }
  try {
    const result = await queryFn();
    return result.rows;
  } catch (err) {
    console.error('Database query error:', err);
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message.includes('timeout')) {
      console.error('Database connection lost. Switching to fallback mode.');
      dbAccessible = false;
    }
    if (fallbackData !== undefined) {
      return fallbackData;
    } else {
      throw err;
    }
  }
};

// --- Admin Panel Endpoints --- (Keep as is)
app.get('/api/admin/restaurants', async (req, res) => {
  try {
    const rows = await handleDbQuery(async () => {
      const { sort = 'name_asc' } = req.query;
      let orderBy;
      switch (sort) {
        case 'name_desc': orderBy = 'name DESC'; break;
        case 'date_asc': orderBy = 'created_at ASC'; break;
        case 'date_desc': orderBy = 'created_at DESC'; break;
        default: orderBy = 'name ASC';
      }
      return await pool.query(`SELECT * FROM Restaurants ORDER BY ${orderBy}`);
    }, mockRestaurants);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin restaurants', details: err.message });
  }
});

app.put('/api/admin/restaurants/:id', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  const { name, neighborhood, city, tags, adds } = req.body;
  try {
    const listId = parseInt(id, 10); // Parse ID
    if (isNaN(listId)) return res.status(400).json({ message: 'Invalid ID format' });
    const result = await pool.query(
      'UPDATE Restaurants SET name = $1, neighborhood = $2, city = $3, tags = $4, adds = $5 WHERE id = $6 RETURNING *',
      [name, neighborhood, city, Array.isArray(tags) ? tags : [], adds, listId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating restaurant:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});

app.delete('/api/admin/restaurants/:id', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  let client;
  try {
    const listId = parseInt(id, 10); // Parse ID
    if (isNaN(listId)) return res.status(400).json({ message: 'Invalid ID format' });

    client = await pool.connect();
    await client.query('BEGIN');
    await client.query('DELETE FROM Dishes WHERE restaurant_id = $1', [listId]);
    const result = await client.query('DELETE FROM Restaurants WHERE id = $1 RETURNING *', [listId]);
    await client.query('COMMIT');
    if (result.rows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
    res.json({ message: 'Restaurant deleted' });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Error deleting restaurant:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/admin/dishes', async (req, res) => {
  try {
    const rows = await handleDbQuery(async () => {
      const { sort = 'name_asc' } = req.query;
      let orderBy;
      switch (sort) {
        case 'name_desc': orderBy = 'd.name DESC'; break;
        case 'date_asc': orderBy = 'd.created_at ASC'; break;
        case 'date_desc': orderBy = 'd.created_at DESC'; break;
        default: orderBy = 'd.name ASC';
      }
      return await pool.query(`
        SELECT d.*, r.name AS restaurant_name FROM Dishes d
        LEFT JOIN Restaurants r ON d.restaurant_id = r.id ORDER BY ${orderBy}
      `);
    }, mockDishes.map(d => ({ ...d, restaurant_name: d.restaurant })));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin dishes', details: err.message });
  }
});

app.put('/api/admin/dishes/:id', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  const { name, restaurant_id, tags, adds } = req.body;
  try {
    const listId = parseInt(id, 10); // Parse ID
    if (isNaN(listId)) return res.status(400).json({ message: 'Invalid ID format' });
    const result = await pool.query(
      'UPDATE Dishes SET name = $1, restaurant_id = $2, tags = $3, adds = $4 WHERE id = $5 RETURNING *',
      [name, restaurant_id, Array.isArray(tags) ? tags : [], adds, listId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Dish not found' });
    const restaurantResult = await pool.query('SELECT name FROM Restaurants WHERE id = $1', [result.rows[0].restaurant_id]);
    const responseData = { ...result.rows[0], restaurant_name: restaurantResult.rows[0]?.name || 'Unknown Restaurant' };
    res.json(responseData);
  } catch (err) {
    console.error('Error updating dish:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});

app.delete('/api/admin/dishes/:id', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  try {
    const listId = parseInt(id, 10); // Parse ID
    if (isNaN(listId)) return res.status(400).json({ message: 'Invalid ID format' });
    const result = await pool.query('DELETE FROM Dishes WHERE id = $1 RETURNING *', [listId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Dish not found' });
    res.json({ message: 'Dish deleted' });
  } catch (err) {
    console.error('Error deleting dish:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});

app.get('/api/admin/lists', async (req, res) => {
  try {
    const rows = await handleDbQuery(async () => {
      const { sort = 'name_asc' } = req.query;
      let orderBy;
      switch (sort) {
        case 'name_desc': orderBy = 'name DESC'; break;
        case 'date_asc': orderBy = 'created_at ASC'; break;
        case 'date_desc': orderBy = 'created_at DESC'; break;
        default: orderBy = 'name ASC';
      }
      return await pool.query(`SELECT * FROM Lists ORDER BY ${orderBy}`);
    }, mockLists);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin lists', details: err.message });
  }
});

app.put('/api/admin/lists/:id', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  const updates = req.body;

  const listId = parseInt(id, 10); // Parse ID
  if (isNaN(listId)) return res.status(400).json({ message: 'Invalid ID format' });


  const setClauses = [];
  const values = [];
  let valueIndex = 1;
  const allowedColumns = ['name', 'items', 'item_count', 'saved_count', 'city', 'tags', 'is_public', 'created_by_user', 'creator_handle', 'is_following'];

  Object.keys(updates).forEach(key => {
    if (allowedColumns.includes(key)) {
      setClauses.push(`${key} = $${valueIndex++}`);
      let value = updates[key];
      if (key === 'items') value = JSON.stringify(value);
      if (key === 'tags' && !Array.isArray(value)) value = [];
      if (['is_public', 'created_by_user', 'is_following'].includes(key)) value = Boolean(value);
      if (['item_count', 'saved_count'].includes(key)) value = parseInt(value) || 0;
      values.push(value);
    } else {
      console.warn(`Admin update attempt rejected for unknown column: ${key}`);
    }
  });

  if (setClauses.length === 0) return res.status(400).json({ message: 'No valid update fields provided' });

  values.push(listId); // Use parsed ID
  const queryText = `UPDATE Lists SET ${setClauses.join(', ')} WHERE id = $${valueIndex} RETURNING *`;

  try {
    const result = await pool.query(queryText, values);
    if (result.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating list via admin:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});

app.delete('/api/admin/lists/:id', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  try {
    const listId = parseInt(id, 10); // Parse ID
    if (isNaN(listId)) return res.status(400).json({ message: 'Invalid ID format' });

    const result = await pool.query('DELETE FROM Lists WHERE id = $1 RETURNING *', [listId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'List not found' });
    res.json({ message: 'List deleted' });
  } catch (err) {
    console.error('Error deleting list:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});


// --- User-Facing Endpoints --- (Keep as is)
app.get('/api/common-dishes', async (req, res) => {
  const { input = '' } = req.query;
  try {
    const rows = await handleDbQuery(async () => {
      return await pool.query('SELECT name FROM CommonDishes WHERE name ILIKE $1 LIMIT 10', [`%${input}%`]);
    }, []);
    res.json(rows.map(row => row.name));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch common dishes', details: err.message });
  }
});

app.get('/api/filters', async (req, res) => {
  const { category = '', relatedTag = '' } = req.query;
  try {
    const rows = await handleDbQuery(async () => {
      let query = 'SELECT name FROM Filters WHERE category = $1';
      const params = [category];
      if (relatedTag) {
        query += ' AND name ILIKE $2';
        params.push(`%${relatedTag}%`);
      }
      query += ' LIMIT 15';
      return await pool.query(query, params);
    }, []);
    res.json(rows.map(row => row.name));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch filters', details: err.message });
  }
});

app.get('/api/trending/restaurants', async (req, res) => {
  console.log(`[API GET /api/trending/restaurants] Request received.`);
  try {
    console.log(`[API GET /api/trending/restaurants] Executing DB query: SELECT * FROM Restaurants ORDER BY adds DESC LIMIT 15`);
    const result = await pool.query('SELECT * FROM Restaurants ORDER BY adds DESC LIMIT 15');
    console.log(`[API GET /api/trending/restaurants] DB query successful. RowCount: ${result.rowCount}`);
    if (result.rowCount > 0) {
      console.log(`[API GET /api/trending/restaurants] First result:`, result.rows[0]);
    }
    console.log(`[API GET /api/trending/restaurants] Sending ${result.rowCount} items.`);
    res.json(result.rows);
  } catch (err) {
    console.error(`[API GET /api/trending/restaurants] DB Error:`, err);
    if (!dbAccessible || err.code === 'ECONNREFUSED') {
      console.warn("[API GET /api/trending/restaurants] DB inaccessible, returning mock data.");
      res.json(mockRestaurants);
    } else {
      res.status(500).json({ error: 'Failed to fetch trending restaurants', details: err.message });
    }
  }
});

app.get('/api/trending/dishes', async (req, res) => {
  console.log(`[API GET /api/trending/dishes] Request received.`);
  try {
    const queryText = `
      SELECT d.*, r.name AS restaurant_name FROM Dishes d
      LEFT JOIN Restaurants r ON d.restaurant_id = r.id ORDER BY d.adds DESC LIMIT 15
    `;
    console.log(`[API GET /api/trending/dishes] Executing DB query:`, queryText.replace(/\s+/g, ' ').trim());
    const result = await pool.query(queryText);
    console.log(`[API GET /api/trending/dishes] DB query successful. RowCount: ${result.rowCount}`);
    if (result.rowCount > 0) {
      console.log(`[API GET /api/trending/dishes] First result:`, result.rows[0]);
    }
    console.log(`[API GET /api/trending/dishes] Sending ${result.rowCount} items.`);
    res.json(result.rows);
  } catch (err) {
    console.error(`[API GET /api/trending/dishes] DB Error:`, err);
    if (!dbAccessible || err.code === 'ECONNREFUSED') {
      console.warn("[API GET /api/trending/dishes] DB inaccessible, returning mock data.");
      res.json(mockDishes.map(d => ({ ...d, restaurant_name: d.restaurant })));
    } else {
      res.status(500).json({ error: 'Failed to fetch trending dishes', details: err.message });
    }
  }
});

app.get('/api/popular/lists', async (req, res) => {
  console.log(`[API GET /api/popular/lists] Request received.`);
  try {
    const queryText = 'SELECT * FROM Lists WHERE is_public = TRUE ORDER BY saved_count DESC LIMIT 15';
    console.log(`[API GET /api/popular/lists] Executing DB query:`, queryText);
    const result = await pool.query(queryText);
    console.log(`[API GET /api/popular/lists] DB query successful. RowCount: ${result.rowCount}`);
    if (result.rowCount > 0) {
      console.log(`[API GET /api/popular/lists] First result:`, result.rows[0]);
    }
    console.log(`[API GET /api/popular/lists] Sending ${result.rowCount} items.`);
    res.json(result.rows);
  } catch (err) {
    console.error(`[API GET /api/popular/lists] DB Error:`, err);
    if (!dbAccessible || err.code === 'ECONNREFUSED') {
      console.warn("[API GET /api/popular/lists] DB inaccessible, returning mock data.");
      res.json(mockLists);
    } else {
      res.status(500).json({ error: 'Failed to fetch popular lists', details: err.message });
    }
  }
});

app.get('/api/lists', async (req, res) => {
  console.log(`[API GET /api/lists] Request received.`);
  try {
    const rows = await handleDbQuery(async () => {
      console.log(`[API GET /api/lists] Executing DB query: SELECT * FROM Lists ORDER BY name ASC`);
      // Ensure is_following is selected and defaulted if null
      return await pool.query('SELECT id, name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, COALESCE(is_following, false) as is_following, created_at FROM Lists ORDER BY name ASC');
    }, mockLists.map(l => ({ ...l, is_following: l.is_following ?? false }))); // Add default in fallback too
    console.log(`[API GET /api/lists] Sending ${rows.length} lists.`);
    res.json(rows);
  } catch (err) {
    console.error(`[API GET /api/lists] Error:`, err);
    res.status(500).json({ error: 'Failed to fetch user lists', details: err.message });
  }
});

app.post('/api/lists', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { name, items, is_public, created_by_user, creator_handle, city, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'List name is required' });
  console.log(`[API POST /api/lists] Request received for new list: ${name}`);
  try {
    const result = await pool.query(
      `INSERT INTO Lists (name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *`,
      [
        name,
        JSON.stringify(Array.isArray(items) ? items : []),
        Array.isArray(items) ? items.length : 0,
        0,
        city || null,
        Array.isArray(tags) ? tags : [],
        is_public !== undefined ? Boolean(is_public) : true,
        created_by_user !== undefined ? Boolean(created_by_user) : true, // Default new lists to created_by_user=true
        creator_handle || 'anonymous',
        false
      ]
    );
    console.log(`[API POST /api/lists] List created successfully with ID: ${result.rows[0]?.id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[API POST /api/lists] Error creating list:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});

app.put('/api/lists/:id/visibility', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  const { is_public } = req.body;

  const listId = parseInt(id, 10); // Parse ID
  if (isNaN(listId)) return res.status(400).json({ message: 'Invalid ID format' });

  if (is_public === undefined) return res.status(400).json({ message: 'is_public field is required' });
  try {
    console.log(`[API PUT /api/lists/${id}/visibility] Attempting to set is_public=${is_public}`);
    const result = await pool.query(
      'UPDATE Lists SET is_public = $1 WHERE id = $2 RETURNING id, is_public',
      [Boolean(is_public), listId]
    );
    if (result.rows.length === 0) {
      console.warn(`[API PUT /api/lists/${id}/visibility] List not found.`);
      return res.status(404).json({ message: 'List not found' });
    }
    console.log(`[API PUT /api/lists/${id}/visibility] Update successful.`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`[API PUT /api/lists/${id}/visibility] Database error during update:`, err); // Log full error
    res.status(500).json({
      error: 'Database error occurred during list update.',
      details: err.message, code: err.code
    });
  }
});

// *** UPDATED FOLLOW/UNFOLLOW Endpoints ***
app.post('/api/lists/:id/follow', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  const listId = parseInt(id, 10); // Parse the ID to integer

  if (isNaN(listId)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  try {
    console.log(`[API POST /api/lists/${listId}/follow] Following list.`);
    const result = await pool.query(
      'UPDATE Lists SET is_following = TRUE WHERE id = $1 RETURNING id, is_following',
      [listId] // Use the parsed integer ID
    );
    if (result.rows.length === 0) {
        return res.status(404).json({ message: 'List not found' });
    }
    console.log(`[API POST /api/lists/${listId}/follow] Success.`);
    res.json(result.rows[0]);
  } catch(err) {
    // Log detailed error
    console.error(`[API POST /api/lists/${listId}/follow] Error:`, {
        message: err.message,
        code: err.code,
        detail: err.detail, // Often contains specifics for DB errors
        stack: err.stack // Optional: full stack trace
    });
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});

app.delete('/api/lists/:id/follow', async (req, res) => {
    if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
    const { id } = req.params;
    const listId = parseInt(id, 10); // Parse the ID to integer

    if (isNaN(listId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    try {
      console.log(`[API DELETE /api/lists/${listId}/follow] Unfollowing list.`);
      const result = await pool.query(
        'UPDATE Lists SET is_following = FALSE WHERE id = $1 RETURNING id, is_following',
        [listId] // Use the parsed integer ID
      );
      if (result.rows.length === 0) {
          return res.status(404).json({ message: 'List not found' });
      }
      console.log(`[API DELETE /api/lists/${listId}/follow] Success.`);
      res.json(result.rows[0]);
    } catch(err) {
      // Log detailed error
      console.error(`[API DELETE /api/lists/${listId}/follow] Error:`, {
        message: err.message,
        code: err.code,
        detail: err.detail, // Often contains specifics for DB errors
        stack: err.stack // Optional: full stack trace
    });
      res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
    }
  });

// --- Submissions Endpoints --- (Keep as is)
app.post('/api/submissions', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { user_id, type, name, location, tags, place_id, city, neighborhood } = req.body;
  if (!type || !name) return res.status(400).json({ error: 'Submission type and name are required' });
  console.log(`[API POST /api/submissions] Received submission: ${type} - ${name}`);
  try {
    const finalNeighborhood = neighborhood || 'Unknown';
    const result = await pool.query(
      'INSERT INTO Submissions (user_id, type, name, location, tags, place_id, city, neighborhood, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [user_id || 1, type, name, location, Array.isArray(tags) ? tags : [], place_id, city, finalNeighborhood, 'pending']
    );
    console.log(`[API POST /api/submissions] Submission saved with ID: ${result.rows[0]?.id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[API POST /api/submissions] Error adding submission:', err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});

app.get('/api/submissions', async (req, res) => {
  console.log(`[API GET /api/submissions] Request received for pending.`);
  try {
    const rows = await handleDbQuery(async () => {
      console.log(`[API GET /api/submissions] Executing DB query: SELECT * FROM Submissions WHERE status = 'pending'`);
      return await pool.query('SELECT * FROM Submissions WHERE status = $1', ['pending']);
    }, []);
    console.log(`[API GET /api/submissions] Sending ${rows.length} pending submissions.`);
    res.json(rows);
  } catch (err) {
    console.error(`[API GET /api/submissions] Error:`, err);
    res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
  }
});

app.post('/api/submissions/:id/approve', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  const submissionId = parseInt(id, 10); // Parse ID
  if (isNaN(submissionId)) return res.status(400).json({ message: 'Invalid ID format' });
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const submissionResult = await client.query('SELECT * FROM Submissions WHERE id = $1 AND status = $2', [submissionId, 'pending']);
    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Submission not found or already processed' });
    }
    const submission = submissionResult.rows[0];
    let approvedItem;
    if (submission.type === 'restaurant') {
      const restaurantResult = await client.query(
        'INSERT INTO Restaurants (name, neighborhood, city, tags, adds, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [submission.name, submission.neighborhood, submission.city, submission.tags, 0]
      );
      approvedItem = restaurantResult.rows[0];
    } else if (submission.type === 'dish') {
      const restaurantResult = await client.query('SELECT id FROM Restaurants WHERE name = $1 LIMIT 1', [submission.location]);
      let restaurantId = restaurantResult.rows[0]?.id;
      if (!restaurantId) {
        const newRestaurant = await client.query(
          'INSERT INTO Restaurants (name, neighborhood, city, tags, adds, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
          [submission.location, submission.neighborhood, submission.city, [], 0]
        );
        restaurantId = newRestaurant.rows[0].id;
      }
      const dishResult = await client.query(
        'INSERT INTO Dishes (name, restaurant_id, tags, adds, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [submission.name, restaurantId, submission.tags, 0]
      );
      approvedItem = dishResult.rows[0];
    }
    await client.query('UPDATE Submissions SET status = $1 WHERE id = $2', ['approved', submissionId]);
    await client.query('COMMIT');
    res.json(approvedItem);
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(`[API POST /api/submissions/${id}/approve] Error:`, err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  } finally {
    if (client) client.release();
  }
});

app.post('/api/submissions/:id/reject', async (req, res) => {
  if (!dbAccessible) return res.status(503).json({ error: 'Database unavailable' });
  const { id } = req.params;
  const submissionId = parseInt(id, 10); // Parse ID
  if (isNaN(submissionId)) return res.status(400).json({ message: 'Invalid ID format' });
  try {
    const result = await pool.query('UPDATE Submissions SET status = $1 WHERE id = $2 RETURNING *', ['rejected', submissionId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Submission not found' });
    res.json({ message: 'Submission rejected' });
  } catch (err) {
    console.error(`[API POST /api/submissions/${id}/reject] Error:`, err); // Log full error
    res.status(500).json({ error: 'Database error', details: err.message, code: err.code });
  }
});


// --- Google Places API Endpoints --- (Keep as is)
app.get('/api/places/autocomplete', async (req, res) => {
  if (!googleMapsClient) return res.status(503).json({ error: 'Google Places API unavailable' });
  const { input } = req.query;
  if (!input) return res.status(400).json({ error: 'Input query is required' });
  try {
    const response = await googleMapsClient.placeAutocomplete({
      params: { input, key: GOOGLE_API_KEY, types: 'establishment' },
    });
    res.json(response.data.predictions);
  } catch (err) {
    console.error('[API GET /api/places/autocomplete] Error:', err);
    res.status(500).json({ error: 'Failed to fetch place autocomplete', details: err.message });
  }
});

app.get('/api/places/details', async (req, res) => {
  if (!googleMapsClient) return res.status(503).json({ error: 'Google Places API unavailable' });
  const { placeId } = req.query;
  if (!placeId) return res.status(400).json({ error: 'Place ID is required' });
  try {
    const response = await googleMapsClient.placeDetails({
      params: { place_id: placeId, key: GOOGLE_API_KEY, fields: ['name', 'formatted_address', 'address_components'] },
    });
    const place = response.data.result;
    const cityComponent = place.address_components.find(comp => comp.types.includes('locality'));
    const neighborhoodComponent = place.address_components.find(comp => comp.types.includes('neighborhood'));
    res.json({
      name: place.name,
      formattedAddress: place.formatted_address,
      city: cityComponent ? cityComponent.long_name : 'Unknown',
      neighborhood: neighborhoodComponent ? neighborhoodComponent.long_name : 'Unknown',
    });
  } catch (err) {
    console.error('[API GET /api/places/details] Error:', err);
    res.status(500).json({ error: 'Failed to fetch place details', details: err.message });
  }
});


// --- Catch-all & Error Handler --- (Keep as is)
app.use((req, res) => {
  console.log(`[404 Not Found] ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error("[Unhandled Error]", req.method, req.originalUrl, err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database Accessible: ${dbAccessible}`);
  console.log(`Google API Key Loaded: ${!!GOOGLE_API_KEY}`);
});