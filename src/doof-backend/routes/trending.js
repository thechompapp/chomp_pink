const express = require('express');
const db = require('../db');
const optionalAuthMiddleware = require('../middleware/optionalAuth');
const router = express.Router();

// GET /restaurants
router.get('/restaurants', async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

    const query = `
      SELECT r.id, r.name, r.city_name, r.neighborhood_name, r.adds, r.city_id, r.neighborhood_id,
             COALESCE((
               SELECT ARRAY_AGG(h.name)
               FROM RestaurantHashtags rh
               JOIN Hashtags h ON rh.hashtag_id = h.id
               WHERE rh.restaurant_id = r.id
             ), ARRAY[]::TEXT[]) as tags
      FROM Restaurants r
      ORDER BY r.adds DESC
      LIMIT 10
    `;
    const result = await client.query(query);
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /restaurants] Error:', err);
    try { if (client) await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
    next(err);
  } finally {
    if (client) client.release();
  }
});

// GET /dishes
router.get('/dishes', async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

    const query = `
      SELECT d.id, d.name, d.adds, r.name as restaurant, r.city_name, r.city_id, r.neighborhood_id,
             COALESCE((
               SELECT ARRAY_AGG(h.name)
               FROM DishHashtags dh
               JOIN Hashtags h ON dh.hashtag_id = h.id
               WHERE dh.dish_id = d.id
             ), ARRAY[]::TEXT[]) as tags
      FROM Dishes d
      JOIN Restaurants r ON d.restaurant_id = r.id
      ORDER BY d.adds DESC
      LIMIT 10
    `;
    const result = await client.query(query);
    await client.query('COMMIT');
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /dishes] Error:', err);
    try { if (client) await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
    next(err);
  } finally {
    if (client) client.release();
  }
});

// GET /lists
router.get('/lists', optionalAuthMiddleware, async (req, res, next) => {
  const userId = req.user?.id;
  console.log(`[TRENDING GET /lists] Request received. Authenticated User ID: ${userId === undefined ? 'None (Guest)' : userId}`);

  let client;
  try {
    // Use a fresh connection for each request
    client = await db.pool.connect();
    await client.query('BEGIN');
    await client.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');

    const queryParams = [userId || null];
    console.log(`[TRENDING GET /lists] Query params:`, queryParams);

    const query = `
      SELECT
        l.id,
        l.name,
        l.description,
        l.saved_count,
        l.city_name,
        l.tags,
        l.is_public,
        l.creator_handle,
        l.created_at,
        l.updated_at,
        l.user_id,
        COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count,
        EXISTS (SELECT 1 FROM listfollows lf WHERE lf.list_id = l.id AND lf.user_id = $1) as is_following,
        (l.user_id = $1)::BOOLEAN as created_by_user
      FROM Lists l
      WHERE l.is_public = TRUE
      ORDER BY l.saved_count DESC
      LIMIT 10
    `;

    const result = await client.query(query, queryParams);

    if (result.rows && result.rows.length > 0) {
      console.log(`[TRENDING GET /lists] Raw query results (first 3):`,
        result.rows.slice(0, 3).map(l => ({
          id: l.id,
          name: l.name,
          is_following: l.is_following,
          user_id: l.user_id,
          saved_count: l.saved_count
        }))
      );

      // Additional debug: Check listfollows table directly
      if (userId) {
        const followCheck = await client.query(
          `SELECT list_id, user_id FROM listfollows WHERE user_id = $1`,
          [userId]
        );
        console.log(`[TRENDING GET /lists] listfollows table for user ${userId}:`,
          followCheck.rows.map(row => ({
            list_id: row.list_id,
            user_id: row.user_id
          }))
        );
      }
    } else {
      console.log(`[TRENDING GET /lists] No results found`);
    }

    const lists = (result.rows || []).map(list => ({
      ...list,
      is_following: !!list.is_following,
      created_by_user: !!list.created_by_user,
      item_count: list.item_count || 0,
      saved_count: list.saved_count || 0,
      tags: Array.isArray(list.tags) ? list.tags : [],
      is_public: list.is_public ?? true,
    }));

    console.log("[TRENDING GET /lists] Returning lists with follow status:",
      JSON.stringify(lists.slice(0, 3).map(l => ({
        id: l.id,
        name: l.name,
        is_following: l.is_following
      })), null, 2)
    );

    await client.query('COMMIT');
    res.json(lists);
  } catch (err) {
    console.error('[TRENDING GET /lists] Error:', err);
    try { if (client) await client.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
    next(err);
  } finally {
    if (client) client.release();
  }
});

module.exports = router;