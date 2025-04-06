// src/doof-backend/routes/filters.js
const express = require('express');
const db = require('../db'); // Ensure db is imported
const router = express.Router();

// GET /api/filters/cities
router.get('/cities', async (req, res, next) => { // Added next
  try {
    const query = `
      SELECT id, name
      FROM Cities
      ORDER BY name
    `;
    const result = await (req.app.get('db') || db).query(query); // Use db fallback
    res.json(result.rows);
  } catch (error) {
    console.error('[Filters] Error fetching cities:', error);
    next(error); // Pass error to central handler
  }
});

// GET /api/filters/cuisines
router.get('/cuisines', async (req, res, next) => { // Added next
  try {
    const query = `
      SELECT id, name
      FROM Hashtags
      WHERE category = 'cuisine'
      ORDER BY name
    `;
    const result = await (req.app.get('db') || db).query(query); // Use db fallback
    res.json(result.rows);
  } catch (error) {
    console.error('[Filters] Error fetching cuisines:', error);
    next(error); // Pass error to central handler
  }
});

// GET /api/filters/neighborhoods?cityId=<id>
router.get('/neighborhoods', async (req, res, next) => { // Added next
  const { cityId } = req.query;
  if (!cityId) {
    // Return 400 for missing required parameter
    return res.status(400).json({ error: 'cityId query parameter is required' });
  }
  // Optional: Add validation to ensure cityId is an integer
  if (!/^\d+$/.test(cityId)) {
     return res.status(400).json({ error: 'cityId must be a positive integer' });
  }

  try {
    const query = `
      SELECT id, name
      FROM Neighborhoods
      WHERE city_id = $1
      ORDER BY name
    `;
    const result = await (req.app.get('db') || db).query(query, [cityId]); // Use db fallback
    res.json(result.rows);
  } catch (error) {
    console.error('[Filters] Error fetching neighborhoods:', error);
    next(error); // Pass error to central handler
  }
});

module.exports = router;