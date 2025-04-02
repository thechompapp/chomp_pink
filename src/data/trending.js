// src/doof-backend/routes/trending.js
// Simplified the original complex queries - REMOVED joins/aggregations for tags/dish_count

const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/trending/dishes (Simplified Original Query)
router.get("/dishes", async (req, res) => {
  console.log(">>> [TRENDING DISHES - Simpler Original] Handler entered.");
  try {
    // Select core dish info + necessary restaurant info, order by adds
    // Removed joins for Hashtags
    const query = `
      SELECT
         d.id, d.name, d.description, d.adds, d.price, d.created_at,
         r.id as restaurant_id, r.name as restaurant_name,
         r.neighborhood_name as neighborhood, r.city_name as city
       FROM Dishes d
       JOIN Restaurants r ON d.restaurant_id = r.id -- Use JOIN since r.id check was implicit before
       ORDER BY d.adds DESC NULLS LAST, d.created_at DESC -- Ensure NULL adds are last
       LIMIT 15;
       `;
    const result = await db.query(query);
    console.log(`>>> [TRENDING DISHES - Simpler Original] Found ${result.rows.length} dishes.`);
    // Add placeholder tags if needed by frontend card
    const dishes = (result.rows || []).map(d => ({ ...d, tags: [] }));
    res.json(dishes);
  } catch (err) {
    console.error(">>> [TRENDING DISHES - Simpler Original] Error:", err);
    res.status(500).json({ error: "Error fetching trending dishes (Simpler Original)" });
  }
});

// GET /api/trending/restaurants (Simplified Original Query)
router.get("/restaurants", async (req, res) => {
   console.log(">>> [TRENDING RESTAURANTS - Simpler Original] Handler entered.");
  try {
     // Select core restaurant info, order by adds
     // Removed joins for Dishes (for count) and Hashtags
     const query = `
       SELECT
             r.id, r.name, r.address, r.neighborhood_name as neighborhood, r.city_name as city,
             r.zip_code, r.borough, r.phone, r.website, r.google_place_id, r.latitude, r.longitude,
             r.adds, r.created_at, r.updated_at
        FROM Restaurants r
        ORDER BY r.adds DESC NULLS LAST, r.created_at DESC -- Ensure NULL adds are last
        LIMIT 15;
        `;
     const result = await db.query(query);
     console.log(`>>> [TRENDING RESTAURANTS - Simpler Original] Found ${result.rows.length} restaurants.`);
     // Add placeholder tags/dish_count if needed by frontend card
     const restaurants = (result.rows || []).map(r => ({ ...r, tags: [], dish_count: 0 }));
     res.json(restaurants);
   } catch (err) {
     console.error(">>> [TRENDING RESTAURANTS - Simpler Original] Error:", err);
     res.status(500).json({ error: "Error fetching trending restaurants (Simpler Original)" });
   }
 });

// GET /api/trending/lists (Simplified Original Query)
router.get("/lists", async (req, res) => {
   console.log(">>> [TRENDING LISTS - Simpler Original] Handler entered.");
  try {
    // Select core list info, order by saved_count
    // Removed join for ListItems (for count)
    const query = `
      SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name as city, l.tags, l.is_public,
          l.created_by_user, l.creator_handle, l.is_following, l.created_at, l.updated_at
       FROM Lists l
       WHERE l.is_public = TRUE
       ORDER BY l.saved_count DESC NULLS LAST, l.created_at DESC -- Ensure NULL saved_count are last
       LIMIT 15;
       `;
    const result = await db.query(query);
    console.log(`>>> [TRENDING LISTS - Simpler Original] Found ${result.rows.length} lists.`);
    // Add placeholder item_count if needed by frontend card
    const lists = (result.rows || []).map(l => ({
        ...l,
        item_count: 0, // Add placeholder
        is_following: l.is_following ?? false
    }));
    res.json(lists);
  } catch (err) {
    console.error(">>> [TRENDING LISTS - Simpler Original] Error:", err);
    res.status(500).json({ error: "Error fetching popular lists (Simpler Original)" });
  }
});

module.exports = router;