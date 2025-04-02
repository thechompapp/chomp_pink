// src/doof-backend/routes/filters.js (Added query validation)
const express = require('express');
const db = require('../db');
const { query, validationResult } = require('express-validator'); // Added query

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
    // Ensure cityId is provided and is a positive integer
    query('cityId')
        .notEmpty().withMessage('cityId query parameter is required.')
        .isInt({ gt: 0 }).withMessage('cityId must be a positive integer.'),
];

// === Filter Options (Using new tables) ===

// GET Cities: Returns [{ id, name }, ...] from Cities table
router.get("/cities", async (req, res) => {
  try {
    const query = `SELECT id, name FROM Cities ORDER BY name ASC;`;
    const result = await db.query(query);
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/cities error:", err);
    res.status(500).json({ error: "Error fetching cities" });
  }
});

// GET Neighborhoods: Returns [{ id, name }, ...] based on selected cityId from Neighborhoods table
router.get(
    "/neighborhoods",
    validateNeighborhoodQuery, // Validate cityId query param
    handleValidationErrors,
    async (req, res) => {
      // cityId is validated by middleware
      const { cityId } = req.query;

      try {
        const neighborhoodQuery = `
           SELECT id, name
           FROM Neighborhoods
           WHERE city_id = $1
           ORDER BY name ASC;
         `;
        const result = await db.query(neighborhoodQuery, [cityId]);
        // It's okay if this returns empty if the cityId exists but has no neighborhoods
        res.json(result.rows || []);
      } catch (err) {
        console.error("/api/neighborhoods error:", err);
        res.status(500).json({ error: "Error fetching neighborhoods" });
      }
    }
);


// GET Cuisines/Hashtags: Returns [{ id, name }, ...] from Hashtags table
router.get("/cuisines", async (req, res) => {
  try {
    const result = await db.query(
        `SELECT id, name FROM Hashtags ORDER BY name ASC`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/cuisines error:", err);
    res.status(500).json({ error: "Error fetching cuisines" });
  }
});

// GET Combined Filters: Returns { cities: [], neighborhoods: [], hashtags: [] }
router.get("/filters", async (req, res) => {
  try {
     const citiesPromise = db.query("SELECT id, name FROM Cities ORDER BY name ASC");
     const neighborhoodsPromise = db.query("SELECT id, name, city_id FROM Neighborhoods ORDER BY city_id, name ASC");
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

module.exports = router;