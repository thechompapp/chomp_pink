// src/doof-backend/routes/restaurants.js
// REFACTORED: GET /:id handler to use explicit client and query object format
const express = require('express');
const db = require('../db'); // db object now exports getClient and query
const { param, query, validationResult } = require('express-validator');

const router = express.Router();

// --- Middleware (Keep as is) ---
const handleValidationErrors = (req, res, next) => { /* ... */ };
const validateIdParam = [ /* ... */ ];
const validateListQuery = [ /* ... */ ];


// === Restaurant Detail (Refactored Handler) ===
router.get(
    "/:id",
    // Remove middleware logging if desired
    // (req, res, next) => { console.log(`... Before validateIdParam ...`); next(); },
    validateIdParam,
    // (req, res, next) => { console.log(`... After validateIdParam ...`); next(); },
    handleValidationErrors,
    // (req, res, next) => { console.log(`... After handleValidationErrors ...`); next(); },
    async (req, res) => {
        console.log(`[RESTAURANTS GET /:id] Route handler function entered for ID: ${req.params.id}`);
        const { id } = req.params;
        let client; // Define client variable outside try

        try {
            // --- Acquire Client ---
            client = await db.getClient();
            console.log(`[RESTAURANTS GET /:id] Acquired DB client for ID: ${id}`);

            // --- Fetch restaurant details ---
            const restaurantQueryText = `
                SELECT
                    r.id, r.name, r.address, r.neighborhood_name, r.city_name,
                    r.zip_code, r.borough, r.phone, r.website, r.google_place_id,
                    r.latitude, r.longitude, r.adds, r.created_at, r.updated_at,
                    COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
                FROM Restaurants r
                LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
                LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
                WHERE r.id = $1
                GROUP BY r.id;
            `;
            console.log(`[RESTAURANTS GET /:id] Executing restaurant query for ID: ${id}`);
            // Use client.query with object format
            const restaurantResult = await client.query({
                text: restaurantQueryText,
                values: [id]
             });

            if (restaurantResult.rows.length === 0) {
                console.log(`[RESTAURANTS GET /:id] Restaurant not found for ID: ${id}`);
                // Release client before sending response
                if (client) await client.release();
                console.log(`[RESTAURANTS GET /:id] Released DB client for ID: ${id} (Not Found)`);
                return res.status(404).json({ error: "Restaurant not found" });
            }
            const restaurant = restaurantResult.rows[0];
            console.log(`[RESTAURANTS GET /:id] Found restaurant: ${restaurant.name}`);

            // --- Fetch associated dishes ---
            const dishesQueryText = `
                SELECT
                    d.id, d.name, d.description, d.price, d.adds,
                    COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
                FROM Dishes d
                LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
                LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
                WHERE d.restaurant_id = $1
                GROUP BY d.id
                ORDER BY d.adds DESC, d.name ASC;
            `;
            console.log(`[RESTAURANTS GET /:id] Executing dishes query for Restaurant ID: ${id}`);
             // Use client.query with object format
            const dishesResult = await client.query({
                 text: dishesQueryText,
                 values: [id]
            });
            restaurant.dishes = dishesResult.rows || []; // Add dishes to the restaurant object
            console.log(`[RESTAURANTS GET /:id] Found ${restaurant.dishes.length} dishes for Restaurant ID: ${id}`);

            res.json(restaurant); // Send final response

        } catch (err) {
            console.error(`[RESTAURANTS GET /:id] Error fetching details for ID ${id}:`, err);
             if (err.message && (err.message.includes('timeout') || err.message.includes('timed out'))) {
                 return res.status(504).json({ error: "Database timeout fetching restaurant details." });
             }
             // Check for the specific bind error code again
             if (err.code === '08P01') {
                  console.error(`!!! Bind error 08P01 occurred despite explicit client handling !!!`);
                  return res.status(500).json({ error: "Internal server error during database query preparation." });
             }
            res.status(500).json({ error: "Error loading restaurant details" });
        } finally {
            // --- Release Client ---
            if (client) {
                await client.release();
                console.log(`[RESTAURANTS GET /:id] Released DB client for ID: ${id} in finally block`);
            } else {
                 console.log(`[RESTAURANTS GET /:id] No client to release for ID: ${id} (likely failed before acquisition)`);
            }
        }
    }
);


// GET /api/restaurants (List Restaurants)
router.get( "/", validateListQuery, handleValidationErrors, async (req, res) => { /* ... Original logic ... */ } );

module.exports = router;