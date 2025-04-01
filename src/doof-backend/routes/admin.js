// src/doof-backend/routes/admin.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// === Admin Data Management ===

// GET all items for a specific type (e.g., /api/admin/restaurants)
router.get("/:type", async (req, res) => {
    const { type } = req.params;
    const { sort = 'name_asc' } = req.query;
    let orderBy = 'name ASC';
    if (sort === 'name_desc') orderBy = 'name DESC';
    else if (sort === 'date_asc') orderBy = 'created_at ASC';
    else if (sort === 'date_desc') orderBy = 'created_at DESC';

    let tableName;
    // Whitelist allowed types
    if (type === 'restaurants') tableName = 'Restaurants';
    else if (type === 'dishes') tableName = 'Dishes';
    else if (type === 'lists') tableName = 'Lists';
    else if (type === 'submissions') tableName = 'Submissions'; // Added submissions view
    else if (type === 'hashtags') tableName = 'Hashtags'; // Added hashtags view
    else return res.status(400).json({ error: 'Invalid admin resource type' });

    try {
        // Add specific joins or columns if needed for display
        let query = `SELECT * FROM ${tableName} ORDER BY ${orderBy}`;
        if (type === 'dishes') {
            // Example: Join to get restaurant name for dishes admin view
            query = `SELECT d.*, r.name as restaurant_name
                     FROM Dishes d
                     LEFT JOIN Restaurants r ON d.restaurant_id = r.id
                     ORDER BY ${orderBy.replace('name', 'd.name').replace('created_at', 'd.created_at')}`; // Adjust ordering columns
        }
        const result = await db.query(query);
        res.json(result.rows || []);
    } catch (err) {
        console.error(`Admin GET /${type} error:`, err);
        res.status(500).json({ error: `Error fetching ${type}` });
    }
});

// PUT update item by ID and type (e.g., /api/admin/restaurants/123)
router.put("/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const updates = req.body;

    let tableName;
    if (type === 'restaurants') tableName = 'Restaurants';
    else if (type === 'dishes') tableName = 'Dishes';
    else if (type === 'lists') tableName = 'Lists';
    else if (type === 'hashtags') tableName = 'Hashtags';
    // Add submissions? Be careful what fields are updatable
    else return res.status(400).json({ error: 'Invalid admin resource type' });

    delete updates.id; // Prevent changing primary key
    delete updates.created_at; // Prevent changing creation timestamp

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update provided' });

    // Ensure column names are quoted to handle potential reserved words
    const setClause = fields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');

    try {
        const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`;
        const result = await db.query(query, [...values, id]);
        if (result.rowCount === 0) return res.status(404).json({ error: `${type} not found` });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Admin PUT /${type}/${id} error:`, err);
        res.status(500).json({ error: `Error updating ${type}: ${err.message}` }); // Include DB error message
    }
});

// DELETE item by ID and type (e.g., /api/admin/restaurants/123)
router.delete("/:type/:id", async (req, res) => {
    const { type, id } = req.params;

    let tableName;
    if (type === 'restaurants') tableName = 'Restaurants';
    else if (type === 'dishes') tableName = 'Dishes';
    else if (type === 'lists') tableName = 'Lists';
     else if (type === 'hashtags') tableName = 'Hashtags';
    // Add submissions?
    else return res.status(400).json({ error: 'Invalid admin resource type' });

    // Add dependency checks or rely on CASCADE constraints in DB schema
    // Example: If deleting a restaurant, ensure related dishes are handled.

    try {
        const result = await db.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: `${type} not found` });
        res.status(204).send(); // No content on successful delete
    } catch (err) {
         // Handle FK constraint errors if CASCADE isn't used
         if (err.code === '23503') {
             return res.status(409).json({ error: `Cannot delete ${type} as it is referenced by other items.` });
         }
         console.error(`Admin DELETE /${type}/${id} error:`, err);
         res.status(500).json({ error: `Error deleting ${type}: ${err.message}` });
    }
});


// --- NOTE on Submission Routes ---
// The submission approval/rejection routes were originally in server.js under /api/admin/submissions/...
// They are currently in submissions.js. If you want them under the /api/admin path,
// you could either:
// 1. Move the submission approval/rejection logic into this admin.js file.
// 2. Mount the submissions router within this file:
//    const submissionsRouter = require('./submissions');
//    router.use('/submissions', submissionsRouter); // Mounts submissions routes at /api/admin/submissions/...
// For clarity, keeping them separate in submissions.js and mounting at /api/submissions (see server.js update) might be better.

module.exports = router;