// src/doof-backend/routes/commonDishes.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// Search Common Dishes
// If CommonDishes table was removed or renamed, update or remove this route.
// For now, keeping the check for table existence.
router.get("/", async (req, res, next) => { // Added next
    const { input } = req.query;
    if (!input) { return res.json([]); }
    try {
        // Check if CommonDishes table exists before querying
        // If logic migrated to use 'is_common' flag in Dishes table, update query below
        const result = await db.query(
            // Option 1: Keep querying CommonDishes if it exists
            "SELECT name FROM CommonDishes WHERE name ILIKE $1 LIMIT 10",
            // Option 2: Query Dishes table if CommonDishes was removed
            // "SELECT name FROM Dishes WHERE name ILIKE $1 AND is_common = TRUE LIMIT 10",
            [`%${input}%`]
        );
        res.json((result.rows || []).map(r => r.name));
    } catch (err) {
         if (err.code === '42P01') { // Table 'commonDishes' does not exist
             console.warn("CommonDishes table not found for search, returning empty. Consider removing this route if the table is deprecated.");
             res.json([]); // Return empty array gracefully
         } else {
            console.error("Common dishes search error:", err);
            // Pass error to centralized handler
            next(new Error("Failed to search common dishes"));
         }
    }
});

module.exports = router;