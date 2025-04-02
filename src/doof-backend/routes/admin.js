// src/doof-backend/routes/admin.js (Added sort query validation)
const express = require('express');
const db = require('../db');
const { param, query, body, validationResult } = require('express-validator'); // Added query

const router = express.Router();

// Allowed resource types and sort columns
const ALLOWED_ADMIN_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'submissions'];
const allowedSortColumns = {
    restaurants: ['name', 'city_name', 'neighborhood_name', 'adds', 'created_at', 'updated_at'],
    dishes: ['name', 'restaurant_id', 'adds', 'price', 'created_at', 'updated_at'],
    lists: ['name', 'city_name', 'item_count', 'saved_count', 'created_at', 'updated_at'],
    hashtags: ['name', 'category'],
    submissions: ['name', 'type', 'status', 'created_at', 'reviewed_at']
};
const defaultSort = {
    restaurants: 'name_asc', dishes: 'name_asc', lists: 'name_asc',
    hashtags: 'name_asc', submissions: 'created_at_asc'
};

// Middleware (Keep validateTypeParam, validateIdParam, handleValidationErrors as is)
const validateTypeParam = (req, res, next) => { /* ... */ };
const validateIdParam = [ /* ... */ ];
const handleValidationErrors = (req, res, next) => { /* ... */ };
const validateUpdateBody = (req, res, next) => { /* ... */ }; // Keep complex PUT validation

// Validation for GET list query parameter 'sort'
const validateSortQuery = (req, res, next) => {
    const type = req.params.type; // Assumes validateTypeParam runs first
    if (!type || !ALLOWED_ADMIN_TYPES.includes(type)) {
        return next(); // Skip if type is invalid (should be caught earlier)
    }

    const sortQuery = req.query.sort || defaultSort[type];
    const sortParts = sortQuery.toLowerCase().split('_');
    const column = sortParts[0];
    const direction = sortParts.slice(-1)[0]; // Get last part for direction

    if (!allowedSortColumns[type]?.includes(column) || !['asc', 'desc'].includes(direction)) {
        console.warn(`[Admin Validation] Invalid sort parameter "${sortQuery}" for type "${type}". Using default.`);
        req.validSort = defaultSort[type]; // Use default if invalid
    } else {
        // Store validated sort string (e.g., "name_asc", "adds_desc")
        req.validSort = `${column}_${direction}`;
    }
    next();
};


// === Admin Data Management ===

// GET all items for a specific type
router.get(
    "/:type",
    validateTypeParam, // Ensure type is valid
    validateSortQuery, // Validate or default the sort query param
    async (req, res) => {
        const sort = req.validSort; // Use validated sort order
        const sortParts = sort.split('_');
        const sortColumn = sortParts[0];
        const sortDirection = sortParts[1] === 'desc' ? 'DESC' : 'ASC';
        let orderBy = `"${sortColumn}" ${sortDirection}`; // Basic quoting

        try {
            let query = `SELECT * FROM ${req.tableName}`; // Use tableName from validateTypeParam

            // Add specific joins or column aliasing if needed based on type and sort column
            if (req.resourceType === 'dishes') {
                 let dishOrderBy = orderBy;
                 // Example: If sorting by restaurant name (need to add 'restaurant_name' to allowedSortColumns['dishes'])
                 // if (sortColumn === 'restaurant_name') dishOrderBy = `r.name ${sortDirection}`;
                 if (sortColumn === 'name') dishOrderBy = `d.name ${sortDirection}`;
                 else if (sortColumn === 'created_at') dishOrderBy = `d.created_at ${sortDirection}`;
                 // ... other dish sort columns ...

                query = `SELECT d.*, r.name as restaurant_name
                         FROM Dishes d
                         LEFT JOIN Restaurants r ON d.restaurant_id = r.id
                         ORDER BY ${dishOrderBy}`;
            } else {
                 query += ` ORDER BY ${orderBy}`; // Apply standard order by for other types
            }

            console.log(`Executing Admin GET Query: ${query}`);
            const result = await db.query(query);
            res.json(result.rows || []);
        } catch (err) {
            console.error(`Admin GET /${req.params.type} error:`, err);
            res.status(500).json({ error: `Error fetching ${req.params.type}` });
        }
    }
);

// PUT update item by ID and type (Keep as is)
router.put( "/:type/:id", validateTypeParam, validateIdParam, validateUpdateBody, async (req, res) => { /* ... */ } );

// DELETE item by ID and type (Keep as is)
router.delete( "/:type/:id", validateTypeParam, validateIdParam, handleValidationErrors, async (req, res) => { /* ... */ } );


module.exports = router;