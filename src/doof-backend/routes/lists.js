// src/doof-backend/routes/lists.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// === List Management ===

// GET all user-relevant lists (or all for now)
router.get("/", async (req, res) => {
  try {
    // In a real app, you'd filter by logged-in user_id
    const result = await db.query(`
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
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const listResult = await db.query("SELECT * FROM Lists WHERE id = $1", [id]);
    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: "List not found" });
    }
    const list = listResult.rows[0];
    res.json({ ...list, is_following: list.is_following ?? false });

  } catch (err) {
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
router.post("/", async (req, res) => {
    const { name, is_public = true, created_by_user = true, creator_handle = "@default_user" } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: "List name is required" });
    }
    try {
        const result = await db.query(
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
router.put("/:id/items", async (req, res) => {
    const { id } = req.params;
    const { item } = req.body;
    if (!item || !item.id || !item.type || !item.name) {
        return res.status(400).json({ error: "Invalid item data provided" });
    }
    const client = await db.getClient(); // Get client for transaction
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
        console.error(`/api/lists/${id}/items (PUT) error:`, err);
        res.status(500).json({ error: "Error adding item to list" });
    } finally {
        client.release();
    }
});


// POST: Follow a list
router.post("/:id/follow", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
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

// DELETE: Unfollow a list
router.delete("/:id/follow", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
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


module.exports = router;