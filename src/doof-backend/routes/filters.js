const express = require('express');
const db = require('../db');
const { query, validationResult } = require('express-validator');

const router = express.Router();

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Validation for neighborhood query param 'cityId'
const validateNeighborhoodQuery = [
  query('cityId')
    .notEmpty().withMessage('cityId query parameter is required.')
    .isInt({ gt: 0 }).withMessage('cityId must be a positive integer.'),
];

// GET Cities: Returns [{ id, name }, ...] from Cities table
router.get("/cities", async (req, res) => {
  try {
    const query = `SELECT id, name FROM Cities ORDER BY name ASC;`;
    console.log('[FILTERS GET /cities] Executing query:', query);
    const result = await db.query(query);
    console.log(`[FILTERS GET /cities] Found ${result.rows.length} cities:`, result.rows);
    res.json(result.rows || []);
  } catch (err) {
    console.error("[FILTERS GET /cities] Error:", err);
    res.status(500).json({ error: "Error fetching cities", details: err.message || 'Unknown database error' });
  }
});

// GET Neighborhoods: Returns [{ id, name }, ...] based on selected cityId from Neighborhoods table
router.get(
  "/neighborhoods",
  validateNeighborhoodQuery,
  handleValidationErrors,
  async (req, res) => {
    const { cityId } = req.query;
    try {
      const neighborhoodQuery = `
        SELECT id, name
        FROM Neighborhoods
        WHERE city_id = $1
        ORDER BY name ASC;
      `;
      console.log('[FILTERS GET /neighborhoods] Executing query:', neighborhoodQuery, 'with cityId:', cityId);
      const result = await db.query(neighborhoodQuery, [cityId]);
      console.log(`[FILTERS GET /neighborhoods] Found ${result.rows.length} neighborhoods for cityId ${cityId}:`, result.rows);
      res.json(result.rows || []);
    } catch (err) {
      console.error("[FILTERS GET /neighborhoods] Error:", err);
      res.status(500).json({ error: "Error fetching neighborhoods", details: err.message || 'Unknown database error' });
    }
  }
);

// GET Cuisines: Returns [{ id, name }, ...] from Hashtags table with category 'cuisine'
router.get("/cuisines", async (req, res) => {
  try {
    const query = `SELECT id, name FROM Hashtags WHERE category = 'cuisine' ORDER BY name ASC`;
    console.log('[FILTERS GET /cuisines] Executing query:', query);
    const result = await db.query(query);
    console.log(`[FILTERS GET /cuisines] Found ${result.rows.length} cuisines:`, result.rows);
    res.json(result.rows || []);
  } catch (err) {
    console.error("[FILTERS GET /cuisines] Error:", err);
    res.status(500).json({ error: "Error fetching cuisines", details: err.message || 'Unknown database error' });
  }
});

// GET Combined Filters: Returns { cities: [], neighborhoods: [], hashtags: [] }
router.get("/filters", async (req, res) => {
  try {
    const citiesQuery = "SELECT id, name FROM Cities ORDER BY name ASC";
    const neighborhoodsQuery = "SELECT id, name, city_id FROM Neighborhoods ORDER BY city_id, name ASC";
    const hashtagsQuery = "SELECT id, name FROM Hashtags WHERE category = 'cuisine' ORDER BY name ASC";

    console.log('[FILTERS GET /filters] Executing queries:');
    console.log('Cities query:', citiesQuery);
    console.log('Neighborhoods query:', neighborhoodsQuery);
    console.log('Hashtags query:', hashtagsQuery);

    const [citiesResult, neighborhoodsResult, hashtagsResult] = await Promise.all([
      db.query(citiesQuery),
      db.query(neighborhoodsQuery),
      db.query(hashtagsQuery)
    ]);

    console.log(`[FILTERS GET /filters] Results:`);
    console.log(`Cities: ${citiesResult.rows.length} found:`, citiesResult.rows);
    console.log(`Neighborhoods: ${neighborhoodsResult.rows.length} found:`, neighborhoodsResult.rows);
    console.log(`Hashtags (cuisines): ${hashtagsResult.rows.length} found:`, hashtagsResult.rows);

    res.json({
      cities: citiesResult.rows || [],
      neighborhoods: neighborhoodsResult.rows || [],
      hashtags: hashtagsResult.rows || [],
    });
  } catch (err) {
    console.error("[FILTERS GET /filters] Error:", err);
    res.status(500).json({ error: "Error fetching all filters", details: err.message || 'Unknown database error' });
  }
});

module.exports = router;