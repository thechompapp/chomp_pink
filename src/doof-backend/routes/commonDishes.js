// src/doof-backend/routes/commonDishes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// Search Common Dishes (Example - if CommonDishes table still exists)
// If CommonDishes was removed, delete this file and the route mounting in server.js
router.get("/", async (req, res) => {
    const { input } = req.query;
    if (!input) { return res.json([]); }
    try {
        // Check if CommonDishes table exists before querying
        // This check might be better done at server startup
        // For now, assume it might exist or query will fail gracefully
        const result = await db.query(
            // Use the 'is_common' flag in Dishes table instead if CommonDishes removed
             // "SELECT name FROM Dishes WHERE name ILIKE $1 AND is_common = TRUE LIMIT 10",
            "SELECT name FROM CommonDishes WHERE name ILIKE $1 LIMIT 10",
            [`%${input}%`]
        );
        res.json((result.rows || []).map(r => r.name));
    } catch (err) {
         if (err.code === '42P01') { // Table does not exist error code
             console.warn("CommonDishes table not found for search, returning empty.");
             res.json([]);
         } else {
            console.error("Common dishes search error:", err);
            res.status(500).json({ error: "Failed to search common dishes" });
         }
    }
});

module.exports = router;