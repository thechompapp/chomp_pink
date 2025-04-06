// src/doof-backend/routes/filters.js
import express from 'express';
// Corrected import:
import db from '../db/index.js';

const router = express.Router();

router.get('/cities', async (req, res, next) => {
   const currentDb = req.app?.get('db') || db; // Access db
  try {
    const query = `
      SELECT id, name
      FROM Cities
      ORDER BY name
    `;
    const result = await currentDb.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('[Filters] Error fetching cities:', error);
    next(error);
  }
});

router.get('/cuisines', async (req, res, next) => {
   const currentDb = req.app?.get('db') || db; // Access db
  try {
    const query = `
      SELECT id, name
      FROM Hashtags
      WHERE category = 'cuisine'
      ORDER BY name
    `;
    const result = await currentDb.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('[Filters] Error fetching cuisines:', error);
    next(error);
  }
});

router.get('/neighborhoods', async (req, res, next) => {
  const { cityId } = req.query;
  const currentDb = req.app?.get('db') || db; // Access db
  if (!cityId) {
    return res.status(400).json({ error: 'cityId query parameter is required' });
  }
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
    const result = await currentDb.query(query, [cityId]);
    res.json(result.rows);
  } catch (error) {
    console.error('[Filters] Error fetching neighborhoods:', error);
    next(error);
  }
});

export default router;