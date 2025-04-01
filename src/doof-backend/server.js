// FULL FINAL server.js (Enhanced Logging for List Endpoints)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const { Client } = require("@googlemaps/google-maps-services-js");
const path = require("path");
require("dotenv").config();

const app = express();
const port = 5001;

// Allow requests from your frontend development server
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

// Database connection pool
const pool = new Pool({
  user: "doof_user",
  host: "localhost",
  database: "doof_db",
  password: "password", // Make sure this is secure / from environment variables
  port: 5432,
});

// Google Maps Client (ensure API Key is set in .env)
const googleMapsClient = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Load key from .env

// === Health Check ===
app.get("/api/health", (req, res) => res.status(200).send("API healthy"));

// === Trending Data ===
app.get("/api/trending/dishes", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id, d.name, d.description, d.adds, d.created_at,
         r.id as restaurant_id, r.name as restaurant_name, r.neighborhood, r.city,
         COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
       FROM Dishes d
       LEFT JOIN Restaurants r ON d.restaurant_id = r.id
       LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
       LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
       GROUP BY d.id, r.id
       ORDER BY d.adds DESC, d.created_at DESC
       LIMIT 15`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/trending/dishes error:", err); // Log basic error
    res.status(500).json({ error: "Error fetching trending dishes" });
  }
});

app.get("/api/trending/restaurants", async (req, res) => {
  try {
    // Query assumes 'tags' are stored directly in Restaurants table
    const result = await pool.query(
      `SELECT r.*, COUNT(d.id) AS dish_count
       FROM Restaurants r
       LEFT JOIN Dishes d ON d.restaurant_id = r.id
       GROUP BY r.id
       ORDER BY r.adds DESC, r.created_at DESC -- Using adds from restaurant table
       LIMIT 15`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/trending/restaurants error:", err); // Log basic error
    res.status(500).json({ error: "Error fetching trending restaurants" });
  }
});

// === Popular Lists ===
app.get("/api/popular/lists", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following, created_at
       FROM Lists
       WHERE is_public = TRUE
       ORDER BY saved_count DESC, created_at DESC
       LIMIT 15`
    );
    // Ensure is_following defaults to false if null from DB
    const lists = (result.rows || []).map(list => ({
        ...list,
        is_following: list.is_following ?? false
    }));
    res.json(lists);
  } catch (err) {
    // *** ENHANCED LOGGING ***
    console.error("--- ERROR Fetching /api/popular/lists ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    console.error("Error Detail:", err.detail); // Often contains useful PG info
    console.error("Stack Trace:", err.stack);
    console.error("-----------------------------------------");
    res.status(500).json({ error: "Error fetching popular lists" });
  }
});


// === Filter Options (Corrected Endpoints) ===

// Corrected: Returns [{ id, name }, ...]
app.get("/api/cities", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT city AS name,
             ROW_NUMBER() OVER (ORDER BY city) as id
      FROM Restaurants
      WHERE city IS NOT NULL AND city <> ''
      ORDER BY city ASC
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/cities error:", err);
    res.status(500).json({ error: "Error fetching cities" });
  }
});

// Corrected: Returns [{ id, name }, ...] based on selected cityId
app.get("/api/neighborhoods", async (req, res) => {
  const { cityId } = req.query;
  let cityName = null;
  if (cityId) {
      try {
          const cityResult = await pool.query(`
              WITH NumberedCities AS (
                  SELECT DISTINCT city, ROW_NUMBER() OVER (ORDER BY city) as id
                  FROM Restaurants WHERE city IS NOT NULL AND city <> ''
              )
              SELECT city FROM NumberedCities WHERE id = $1
          `, [cityId]);
          if (cityResult.rows.length > 0) {
              cityName = cityResult.rows[0].city;
          } else {
              return res.json([]);
          }
      } catch (err) {
          console.error("Error finding city name for neighborhood filter:", err);
          return res.status(500).json({ error: "Error processing city filter" });
      }
  } else {
      return res.json([]);
  }

  try {
    const result = await pool.query(`
      SELECT DISTINCT neighborhood AS name,
             ROW_NUMBER() OVER (ORDER BY neighborhood) as id
      FROM Restaurants
      WHERE city = $1 AND neighborhood IS NOT NULL AND neighborhood <> ''
      ORDER BY neighborhood ASC
    `, [cityName]);
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/neighborhoods error:", err);
    res.status(500).json({ error: "Error fetching neighborhoods" });
  }
});


// Corrected: Returns [{ id, name }, ...]
app.get("/api/cuisines", async (req, res) => {
  try {
    const result = await pool.query(
        `SELECT id, name
         FROM Hashtags
         ORDER BY name ASC`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/cuisines error:", err);
    res.status(500).json({ error: "Error fetching cuisines" });
  }
});

// Corrected: Combined endpoint also returns objects with IDs
app.get("/api/filters", async (req, res) => {
  try {
    const citiesPromise = pool.query(`
        SELECT DISTINCT city AS name, ROW_NUMBER() OVER (ORDER BY city) as id
        FROM Restaurants WHERE city IS NOT NULL AND city <> '' ORDER BY city ASC
    `);
    const neighborhoodsPromise = pool.query(`
        SELECT DISTINCT neighborhood AS name, ROW_NUMBER() OVER (ORDER BY neighborhood) as id
        FROM Restaurants WHERE neighborhood IS NOT NULL AND neighborhood <> '' ORDER BY neighborhood ASC
    `);
    const hashtagsPromise = pool.query("SELECT id, name FROM Hashtags ORDER BY name ASC");

    const [citiesResult, neighborhoodsResult, hashtagsResult] = await Promise.all([
        citiesPromise, neighborhoodsPromise, hashtagsPromise
    ]);

    res.json({
      cities: citiesResult.rows || [],
      neighborhoods: neighborhoodsResult.rows || [],
      hashtags: hashtagsResult.rows || [],
    });
  } catch (err) {
    console.error("/api/filters error:", err);
    res.status(500).json({ error: "Error fetching all filters" });
  }
});


// === List Management ===

// GET all user-relevant lists (created or followed)
app.get("/api/lists", async (req, res) => {
  try {
    // In a real app, you'd filter by logged-in user_id
    const result = await pool.query(`
        SELECT id, name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following, created_at
        FROM Lists
        ORDER BY created_at DESC
    `);
    const lists = (result.rows || []).map(list => ({
        ...list,
        is_following: list.is_following ?? false
    }));
    res.json(lists);
  } catch (err) {
     // *** ENHANCED LOGGING ***
    console.error("--- ERROR Fetching /api/lists (All) ---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    console.error("Error Detail:", err.detail);
    console.error("Stack Trace:", err.stack);
    console.error("---------------------------------------");
    res.status(500).json({ error: "Error loading lists" });
  }
});

// GET specific list details
app.get("/api/lists/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const listResult = await pool.query("SELECT * FROM Lists WHERE id = $1", [id]);
    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }
    const list = listResult.rows[0];
    res.json({ ...list, is_following: list.is_following ?? false });

  } catch (err) {
    // *** ENHANCED LOGGING ***
    const listId = req.params.id || 'UNKNOWN';
    console.error(`--- ERROR Fetching /api/lists/${listId} (Detail) ---`);
    console.error("Timestamp:", new Date().toISOString());
    console.error("Error Code:", err.code);
    console.error("Error Message:", err.message);
    console.error("Error Detail:", err.detail);
    console.error("Stack Trace:", err.stack);
    console.error("--------------------------------------------------");
    res.status(500).json({ error: "Error loading list details" });
  }
});

// POST: Create a new list
app.post("/api/lists", async (req, res) => {
    const { name, is_public = true, created_by_user = true, creator_handle = "@default_user" } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "List name is required" });
    }
    try {
        const result = await pool.query(
            `INSERT INTO Lists (name, is_public, created_by_user, creator_handle, items, item_count, is_following)
             VALUES ($1, $2, $3, $4, '[]', 0, FALSE)
             RETURNING id, name, items, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following, created_at`,
            [name.trim(), !!is_public, !!created_by_user, creator_handle]
        );
        const newList = result.rows[0];
        res.status(201).json({...newList, is_following: newList.is_following ?? false});
    } catch (err) {
        console.error("/api/lists (POST Create) error:", err);
        res.status(500).json({ error: "Error creating list" });
    }
});


// PUT: Add item to existing list
app.put("/api/lists/:id/items", async (req, res) => {
    const { id } = req.params;
    const { item } = req.body;
    if (!item || !item.id || !item.type || !item.name) {
        return res.status(400).json({ error: "Invalid item data provided" });
    }
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const updateResult = await client.query(
                `UPDATE Lists
                 SET items = items || $1::jsonb,
                     item_count = COALESCE(jsonb_array_length(items || $1::jsonb), 0)
                 WHERE id = $2
                 RETURNING *`,
                [JSON.stringify(item), id]
            );
            if (updateResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: "List not found" });
            }
            await client.query('COMMIT');
            const updatedList = updateResult.rows[0];
            res.json({...updatedList, is_following: updatedList.is_following ?? false});
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(`/api/lists/${id}/items (PUT) error:`, err);
        res.status(500).json({ error: "Error adding item to list" });
    }
});


// POST / DELETE: Follow / Unfollow a list
app.post("/api/lists/:id/follow", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE Lists SET is_following = TRUE, saved_count = saved_count + 1 WHERE id = $1 RETURNING is_following",
            [id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: "List not found" });
        res.json({ listId: id, is_following: true });
    } catch (err) {
        console.error("Follow list error:", err);
        res.status(500).json({ error: "Error following list" });
    }
});

app.delete("/api/lists/:id/follow", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE Lists SET is_following = FALSE, saved_count = GREATEST(0, saved_count - 1) WHERE id = $1 RETURNING is_following",
            [id]
        );
         if (result.rowCount === 0) return res.status(404).json({ error: "List not found" });
        res.json({ listId: id, is_following: false });
    } catch (err) {
        console.error("Unfollow list error:", err);
        res.status(500).json({ error: "Error unfollowing list" });
    }
});


// === Restaurant Detail ===
app.get("/api/restaurants/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const restaurantResult = await pool.query("SELECT * FROM Restaurants WHERE id = $1", [id]);
    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    const restaurant = restaurantResult.rows[0];
    const dishesResult = await pool.query(
       `SELECT
            d.id, d.name, d.description, d.adds, d.created_at,
            COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
        FROM Dishes d
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.restaurant_id = $1
        GROUP BY d.id
        ORDER BY d.adds DESC, d.name ASC`,
        [id]
    );
    res.json({ ...restaurant, dishes: dishesResult.rows || [] });
  } catch (err) {
    console.error(`/api/restaurants/${id} error:`, err);
    res.status(500).json({ error: "Error loading restaurant details" });
  }
});

// === Dish Detail ===
app.get("/api/dishes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const dishQuery = `
      SELECT d.id, d.name, d.description, d.adds, d.created_at,
             r.id AS restaurant_id, r.name AS restaurant_name, r.city, r.neighborhood,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
      FROM Dishes d
      LEFT JOIN Restaurants r ON d.restaurant_id = r.id
      LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
      LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
      WHERE d.id = $1
      GROUP BY d.id, r.id
    `;
    const dishResult = await pool.query(dishQuery, [id]);
    if (dishResult.rows.length === 0) {
      return res.status(404).json({ error: "Dish not found" });
    }
    res.json(dishResult.rows[0]);
  } catch (err) {
    console.error(`/api/dishes/${id} error:`, err);
    res.status(500).json({ error: "Error loading dish details" });
  }
});

// === Voting ===
app.post("/api/dishes/:id/votes", async (req, res) => {
  const { id } = req.params;
  const { vote_type } = req.body;
  if (!['up', 'neutral', 'down'].includes(vote_type)) {
    return res.status(400).json({ error: "Invalid vote type specified" });
  }
  try {
    await pool.query(
      "INSERT INTO DishVotes (dish_id, vote_type) VALUES ($1, $2)",
      [id, vote_type]
    );
    let voteValue = 0;
    if (vote_type === 'up') voteValue = 1;
    if (voteValue !== 0) {
         await pool.query("UPDATE Dishes SET adds = adds + $1 WHERE id = $2", [voteValue, id]);
    }
    res.status(201).json({ message: "Vote recorded successfully" });
  } catch (err) {
    if (err.code === '23503') {
        return res.status(404).json({ error: "Dish not found" });
    }
    console.error(`Vote save error for dish ${id}:`, err);
    res.status(500).json({ error: "Failed to record vote due to server error" });
  }
});

app.get("/api/dishes/:id/votes", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE vote_type = 'up') AS upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'neutral') AS neutrals,
            COUNT(*) FILTER (WHERE vote_type = 'down') AS downvotes
         FROM DishVotes
         WHERE dish_id = $1`,
        [id]
        );
        res.json(result.rows[0] || { upvotes: 0, neutrals: 0, downvotes: 0 });
    } catch (err) {
        console.error(`Vote fetch error for dish ${id}:`, err);
        res.status(500).json({ error: "Failed to fetch votes" });
    }
});


// === Submissions (for Admin Approval) ===

// POST new submission
app.post("/api/submissions", async (req, res) => {
    const { type, name, location, tags, place_id, city, neighborhood, user_id } = req.body;
    if (!type || !name) return res.status(400).json({ error: "Submission type and name are required" });
    if (!['dish', 'restaurant'].includes(type)) return res.status(400).json({ error: "Invalid submission type" });
    try {
        const result = await pool.query(
            `INSERT INTO Submissions (type, name, location, tags, place_id, city, neighborhood, user_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
            [type, name, location, tags, place_id, city, neighborhood, user_id /* Placeholder */]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating submission:", err);
        res.status(500).json({ error: "Failed to create submission" });
    }
});

// GET pending submissions (for admin dashboard)
app.get("/api/submissions", async (req, res) => {
  try {
    const result = await pool.query(
        `SELECT * FROM Submissions WHERE status = 'pending' ORDER BY created_at ASC`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/submissions (GET Pending) error:", err);
    res.status(500).json({ error: "Error loading pending submissions" });
  }
});

// POST approve submission
app.post("/api/submissions/:id/approve", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const submissionResult = await client.query("SELECT * FROM Submissions WHERE id = $1 AND status = 'pending'", [id]);
    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Pending submission not found" });
    }
    const sub = submissionResult.rows[0];
    let approvedItemData = {};

    if (sub.type === 'restaurant') {
      const existingRest = await client.query("SELECT id FROM Restaurants WHERE name = $1 AND city = $2 AND (neighborhood = $3 OR ($3 IS NULL AND neighborhood IS NULL))", [sub.name, sub.city, sub.neighborhood]);
      if (existingRest.rows.length > 0) {
           console.log(`Restaurant "${sub.name}" already exists, marking submission as approved.`);
           approvedItemData = { id: existingRest.rows[0].id, ...sub };
      } else {
          const restResult = await client.query(`INSERT INTO Restaurants (name, neighborhood, city, tags, adds) VALUES ($1, $2, $3, $4, 1) RETURNING *`, [sub.name, sub.neighborhood, sub.city, sub.tags]);
          approvedItemData = restResult.rows[0];
      }
    } else if (sub.type === 'dish') {
      const restQueryResult = await client.query("SELECT id FROM Restaurants WHERE name = $1 LIMIT 1", [sub.location]);
      let restaurantId = null;
      if (restQueryResult.rows.length > 0) {
          restaurantId = restQueryResult.rows[0].id;
      } else {
           await client.query('ROLLBACK');
           return res.status(400).json({ error: `Restaurant "${sub.location}" not found for dish submission.` });
      }
       const existingDish = await client.query("SELECT id FROM Dishes WHERE name = $1 AND restaurant_id = $2", [sub.name, restaurantId]);
        if (existingDish.rows.length > 0) {
             console.log(`Dish "${sub.name}" at restaurant ID ${restaurantId} already exists.`);
             approvedItemData = { id: existingDish.rows[0].id, ...sub, restaurant_id: restaurantId };
        } else {
            const dishResult = await client.query(`INSERT INTO Dishes (name, restaurant_id, tags, adds) VALUES ($1, $2, $3, 1) RETURNING *`, [sub.name, restaurantId, sub.tags]);
            approvedItemData = dishResult.rows[0];
            if (sub.tags && sub.tags.length > 0) {
                for (const tagName of sub.tags) {
                    let tagIdRes = await client.query("SELECT id FROM Hashtags WHERE name = $1", [tagName]);
                    let tagId;
                    if (tagIdRes.rows.length === 0) {
                        tagIdRes = await client.query("INSERT INTO Hashtags (name) VALUES ($1) RETURNING id", [tagName]);
                    }
                    tagId = tagIdRes.rows[0].id;
                    await client.query("INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [approvedItemData.id, tagId]);
                }
            }
        }
    }
    await client.query("UPDATE Submissions SET status = 'approved' WHERE id = $1", [id]);
    await client.query('COMMIT');
    res.json(approvedItemData);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Approve submission ${id} error:`, err);
    res.status(500).json({ error: "Approval failed due to server error" });
  } finally {
    client.release();
  }
});


// POST reject submission
app.post("/api/submissions/:id/reject", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("UPDATE Submissions SET status = 'rejected' WHERE id = $1 AND status = 'pending'", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pending submission not found" });
    }
    res.json({ message: "Submission rejected successfully" });
  } catch (err) {
    console.error(`Reject submission ${id} error:`, err);
    res.status(500).json({ error: "Rejection failed due to server error" });
  }
});

// === Google Places API ===

// Autocomplete
app.get("/api/places/autocomplete", async (req, res) => {
    const { input } = req.query;
    if (!input) return res.status(400).json({ error: "Input query parameter is required" });
    if (!GOOGLE_API_KEY) return res.status(500).json({ error: "Google API key not configured" });
    try {
        const response = await googleMapsClient.placeAutocomplete({
            params: { input: input, key: GOOGLE_API_KEY, components: ['country:us'] }, timeout: 5000
        });
        res.json(response.data.predictions || []);
    } catch (err) {
        console.error("Google Places Autocomplete error:", err.response?.data || err.message);
        res.status(500).json({ error: "Google Places Autocomplete request failed" });
    }
});

// Place Details
app.get("/api/places/details", async (req, res) => {
    const { placeId } = req.query;
    if (!placeId) return res.status(400).json({ error: "Place ID query parameter is required" });
     if (!GOOGLE_API_KEY) return res.status(500).json({ error: "Google API key not configured" });
    try {
        const response = await googleMapsClient.placeDetails({
            params: { place_id: placeId, key: GOOGLE_API_KEY, fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id'] }, timeout: 5000
        });
        const details = response.data.result;
        if (!details) return res.status(404).json({ error: "Place details not found" });
        let city = ''; let neighborhood = '';
        details.address_components.forEach(component => {
            if (component.types.includes('locality')) { city = component.long_name; }
            if (component.types.includes('sublocality') || component.types.includes('neighborhood')) { neighborhood = component.long_name; }
        });
        if (!city) { details.address_components.forEach(component => { if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) { if (!city) city = component.long_name; } }); }
        res.json({ name: details.name, formattedAddress: details.formatted_address, city: city || null, neighborhood: neighborhood || null, placeId: details.place_id, location: details.geometry?.location });
    } catch (err) {
        console.error("Google Places Details error:", err.response?.data || err.message);
        res.status(500).json({ error: "Google Places Details request failed" });
    }
});

// === Common Dishes Search (Example) ===
app.get("/api/common-dishes", async (req, res) => {
    const { input } = req.query;
    if (!input) { return res.json([]); }
    try {
        const result = await pool.query("SELECT name FROM CommonDishes WHERE name ILIKE $1 LIMIT 10", [`%${input}%`]);
        res.json((result.rows || []).map(r => r.name));
    } catch (err) {
        console.error("Common dishes search error:", err);
        res.status(500).json({ error: "Failed to search common dishes" });
    }
});

// === Admin Data Management (Basic Examples) ===
// GET all for a type
app.get("/api/admin/:type", async (req, res) => {
    const { type } = req.params;
    const { sort = 'name_asc' } = req.query;
    let orderBy = 'name ASC';
    if (sort === 'name_desc') orderBy = 'name DESC'; else if (sort === 'date_asc') orderBy = 'created_at ASC'; else if (sort === 'date_desc') orderBy = 'created_at DESC';
    let tableName;
    if (type === 'restaurants') tableName = 'Restaurants'; else if (type === 'dishes') tableName = 'Dishes'; else if (type === 'lists') tableName = 'Lists'; else return res.status(400).json({ error: 'Invalid admin type' });
    try {
        const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
        res.json(result.rows || []);
    } catch (err) {
        console.error(`Admin GET /${type} error:`, err);
        res.status(500).json({ error: `Error fetching ${type}` });
    }
});

// PUT update item
app.put("/api/admin/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const updates = req.body;
    let tableName;
    if (type === 'restaurants') tableName = 'Restaurants'; else if (type === 'dishes') tableName = 'Dishes'; else if (type === 'lists') tableName = 'Lists'; else return res.status(400).json({ error: 'Invalid admin type' });
    delete updates.id; delete updates.created_at;
    const fields = Object.keys(updates); const values = Object.values(updates);
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update provided' });
    const setClause = fields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
    try {
        const result = await pool.query(`UPDATE ${tableName} SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`, [...values, id]);
        if (result.rowCount === 0) return res.status(404).json({ error: `${type} not found` });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Admin PUT /${type}/${id} error:`, err);
        res.status(500).json({ error: `Error updating ${type}` });
    }
});

// DELETE item
app.delete("/api/admin/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    let tableName;
    if (type === 'restaurants') tableName = 'Restaurants'; else if (type === 'dishes') tableName = 'Dishes'; else if (type === 'lists') tableName = 'Lists'; else return res.status(400).json({ error: 'Invalid admin type' });
    try {
        const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: `${type} not found` });
        res.status(204).send();
    } catch (err) {
         console.error(`Admin DELETE /${type}/${id} error:`, err);
        res.status(500).json({ error: `Error deleting ${type}` });
    }
});


// === Start Server ===
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  if (!GOOGLE_API_KEY) {
      console.warn("Warning: GOOGLE_API_KEY is not set in the environment variables. Google Places API features will not work.");
  }
});