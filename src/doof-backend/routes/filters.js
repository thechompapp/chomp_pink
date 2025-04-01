// src/doof-backend/routes/filters.js (Corrected /api/cities query)
const express = require('express');
const db = require('../db'); // Import the db module

const router = express.Router();

// === Filter Options (Endpoints moved here) ===

// GET Cities: Returns [{ id, name }, ...] - CORRECTED QUERY
router.get("/cities", async (req, res) => {
  try {
    // Use GROUP BY to ensure unique city names.
    // Assign a consistent ID (e.g., based on the row number of the distinct group)
    const query = `
      WITH DistinctCities AS (
        SELECT
          city,
          ROW_NUMBER() OVER (ORDER BY MIN(created_at), city) as rn -- Assign row number based on grouping
        FROM Restaurants
        WHERE city IS NOT NULL AND city <> ''
        GROUP BY city -- Group by city name first
      )
      SELECT
        city AS name,
        rn AS id -- Use the row number as the ID
      FROM DistinctCities
      ORDER BY city ASC;
    `;
    const result = await db.query(query);
    res.json(result.rows || []); // Ensure an empty array is sent if no results
  } catch (err) {
    console.error("/api/cities error:", err);
    res.status(500).json({ error: "Error fetching cities" });
  }
});

// GET Neighborhoods: Returns [{ id, name }, ...] based on selected cityId
router.get("/neighborhoods", async (req, res) => {
  const { cityId } = req.query;
  let cityName = null;
  if (cityId) {
      try {
          // This query assumes the ROW_NUMBER approach used in /api/cities
          // If you have a real Cities table, query that instead.
          const cityQuery = `
               WITH DistinctCities AS (
                 SELECT
                   city,
                   ROW_NUMBER() OVER (ORDER BY MIN(created_at), city) as rn
                 FROM Restaurants
                 WHERE city IS NOT NULL AND city <> ''
                 GROUP BY city
               )
               SELECT city AS name
               FROM DistinctCities
               WHERE rn = $1;
             `;
          const cityResult = await db.query(cityQuery, [cityId]);
          if (cityResult.rows.length > 0) {
              cityName = cityResult.rows[0].name; // Use 'name' alias from query
          } else {
              // If cityId is invalid or not found, return empty array
              return res.json([]);
          }
      } catch (err) {
          console.error("Error finding city name for neighborhood filter:", err);
          return res.status(500).json({ error: "Error processing city filter" });
      }
  } else {
      // No cityId provided, return empty array as neighborhoods depend on city
      return res.json([]);
  }

  // Now fetch neighborhoods for the determined cityName
  try {
    // Using ROW_NUMBER() again for consistency. Replace with real IDs if available.
    // Grouping by neighborhood to ensure uniqueness within the city.
     const neighborhoodQuery = `
       WITH DistinctNeighborhoods AS (
         SELECT
           neighborhood,
           ROW_NUMBER() OVER (ORDER BY MIN(created_at), neighborhood) as rn
         FROM Restaurants
         WHERE city = $1 AND neighborhood IS NOT NULL AND neighborhood <> ''
         GROUP BY neighborhood
       )
       SELECT
         neighborhood AS name,
         rn AS id
       FROM DistinctNeighborhoods
       ORDER BY neighborhood ASC;
     `;
    const result = await db.query(neighborhoodQuery, [cityName]);
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/neighborhoods error:", err);
    res.status(500).json({ error: "Error fetching neighborhoods" });
  }
});


// GET Cuisines/Hashtags: Returns [{ id, name }, ...]
router.get("/cuisines", async (req, res) => {
  try {
    // Assumes 'Hashtags' table contains cuisines/tags and has 'id' and 'name'
    const result = await db.query(
        `SELECT id, name
         FROM Hashtags
         ORDER BY name ASC`
    );
    res.json(result.rows || []); // Ensure empty array if no results
  } catch (err) {
    console.error("/api/cuisines error:", err);
    res.status(500).json({ error: "Error fetching cuisines" });
  }
});

// GET Combined Filters: Returns { cities: [], neighborhoods: [], hashtags: [] }
router.get("/filters", async (req, res) => {
  try {
     // Use the corrected city query logic
     const citiesPromise = db.query(`
       WITH DistinctCities AS (
         SELECT city, ROW_NUMBER() OVER (ORDER BY MIN(created_at), city) as rn
         FROM Restaurants WHERE city IS NOT NULL AND city <> '' GROUP BY city
       ) SELECT city AS name, rn AS id FROM DistinctCities ORDER BY city ASC;
     `);
     // Use the corrected neighborhood query logic (without city filter for combined endpoint)
    const neighborhoodsPromise = db.query(`
       WITH DistinctNeighborhoods AS (
         SELECT neighborhood, ROW_NUMBER() OVER (ORDER BY MIN(created_at), neighborhood) as rn
         FROM Restaurants WHERE neighborhood IS NOT NULL AND neighborhood <> '' GROUP BY neighborhood
       ) SELECT neighborhood AS name, rn AS id FROM DistinctNeighborhoods ORDER BY neighborhood ASC;
     `);
    const hashtagsPromise = db.query("SELECT id, name FROM Hashtags ORDER BY name ASC");

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

module.exports = router; // Export the router