// src/doof-backend/routes/submissions.js
// (Review Comments Added)

const express = require('express');
const db = require('../db');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateSubmissionPOST = [
    body('type').isIn(['restaurant', 'dish']).withMessage('Invalid submission type.'),
    body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }).withMessage('Name too long.'),
    body('location').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Location too long.'),
    body('tags').optional().isArray().withMessage('Tags must be an array.'),
    body('tags.*').optional().isString().trim().isLength({ max: 50 }).withMessage('Tags cannot exceed 50 characters.'),
    body('place_id').optional({ nullable: true }).isString().trim().isLength({ max: 255 }).withMessage('Place ID too long.'),
    body('city').optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage('City too long.'),
    body('neighborhood').optional({ nullable: true }).isString().trim().isLength({ max: 100 }).withMessage('Neighborhood too long.'),
    body('user_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Invalid user ID.'),
    body().custom((value, { req }) => {
        if (req.body.type === 'dish' && (!req.body.location || req.body.location.trim() === '')) {
            throw new Error('Restaurant location name is required when submitting a dish.');
        }
        return true;
    }),
];

// Validation for ID parameter
const validateIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('Invalid Submission ID format in URL.'),
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
         console.warn("[Validation Error]", req.path, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Helper function to find or create a tag ID safely within a transaction
async function findOrCreateTagId(client, tagName) {
    const tagNameClean = tagName.trim();
    if (!tagNameClean) return null;

    try {
        let tagIdRes = await client.query("SELECT id FROM Hashtags WHERE name = $1", [tagNameClean]);
        if (tagIdRes.rows.length > 0) {
            return tagIdRes.rows[0].id;
        } else {
            console.warn(`[findOrCreateTagId] Tag "${tagNameClean}" not found. Creating it.`);
            await client.query("INSERT INTO Hashtags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [tagNameClean]);
            tagIdRes = await client.query("SELECT id FROM Hashtags WHERE name = $1", [tagNameClean]);
            if (tagIdRes.rows.length > 0) {
                return tagIdRes.rows[0].id;
            } else {
                console.error(`[findOrCreateTagId] Failed to retrieve ID for tag "${tagNameClean}" after attempting creation.`);
                return null; // Failure
            }
        }
    } catch (error) {
         console.error(`[findOrCreateTagId] Error processing tag "${tagNameClean}":`, error);
         return null; // Failure
    }
}


// === Submissions Routes ===

// POST new submission (with validation)
router.post(
    "/",
    validateSubmissionPOST,
    handleValidationErrors,
    async (req, res) => {
        const { type, name, location, tags, place_id, city, neighborhood, user_id } = req.body;
        const cleanTags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];

        try {
            const result = await db.query(
                `INSERT INTO Submissions (type, name, location, tags, place_id, city, neighborhood, user_id, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
                [type, name.trim(), location?.trim() || null, cleanTags, place_id?.trim() || null, city?.trim() || null, neighborhood?.trim() || null, user_id || null]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error("Error creating submission:", err);
            res.status(500).json({ error: "Failed to create submission" });
        }
    }
);

// GET pending submissions (for admin dashboard)
router.get("/pending", async (req, res) => {
  try {
    const result = await db.query(
        `SELECT * FROM Submissions WHERE status = 'pending' ORDER BY created_at ASC`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/submissions/pending (GET) error:", err);
    res.status(500).json({ error: "Error loading pending submissions" });
  }
});


// POST approve submission
router.post(
    "/:id/approve",
    validateIdParam,
    handleValidationErrors,
    async (req, res) => {
      const { id } = req.params;
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        // Lock the submission row
        const submissionResult = await client.query("SELECT * FROM Submissions WHERE id = $1 AND status = 'pending' FOR UPDATE", [id]);
        if (submissionResult.rows.length === 0) {
          await client.query('ROLLBACK');
           const exists = await db.query("SELECT status FROM Submissions WHERE id = $1", [id]);
            if (exists.rowCount > 0) return res.status(409).json({ error: `Submission already reviewed (status: ${exists.rows[0].status})` });
            else return res.status(404).json({ error: "Pending submission not found" });
        }
        const sub = submissionResult.rows[0];
        let approvedItemData = {};

        if (sub.type === 'restaurant') {
          // Check if restaurant already exists more robustly (e.g., using google_place_id if available)
          let existingRest = null;
          if (sub.google_place_id) {
               const placeIdRes = await client.query("SELECT * FROM Restaurants WHERE google_place_id = $1", [sub.google_place_id]);
               if (placeIdRes.rows.length > 0) existingRest = placeIdRes.rows[0];
          }
          // Fallback to name/city/neighborhood match if no place_id match
          if (!existingRest) {
               const nameMatchRes = await client.query("SELECT * FROM Restaurants WHERE name = $1 AND city = $2 AND (neighborhood = $3 OR ($3 IS NULL AND neighborhood IS NULL))", [sub.name, sub.city, sub.neighborhood]);
               if (nameMatchRes.rows.length > 0) existingRest = nameMatchRes.rows[0];
          }

          if (existingRest) {
               approvedItemData = existingRest;
               console.log(`[Approve Submission] Restaurant "${sub.name}" already exists (ID: ${approvedItemData.id}). Using existing.`);
               // CONSIDER: Update existing restaurant with potentially newer info from submission? (e.g., merge tags)
               // Example: Fetch existing tags, merge with submission tags, update RestaurantHashtags
          } else {
              // Create the new restaurant
              const restResult = await client.query( /* ... Insert query as before ... */
                  `INSERT INTO Restaurants (name, address, neighborhood, city, google_place_id, adds) VALUES ($1, $2, $3, $4, $5, 1) RETURNING *`,
                  [ sub.name, sub.location, sub.neighborhood, sub.city, sub.place_id ]
               );
              approvedItemData = restResult.rows[0];
              const restaurantId = approvedItemData.id;
              console.log(`[Approve Submission] Created new restaurant (ID: ${restaurantId}): "${sub.name}"`);

              // Link submitted tags to the new restaurant
               const submittedTags = Array.isArray(sub.tags) ? sub.tags : [];
               if (submittedTags.length > 0) {
                   for (const tagName of submittedTags) {
                       const tagId = await findOrCreateTagId(client, tagName);
                       if (tagId) { // Only link if tagId was found/created
                           await client.query("INSERT INTO RestaurantHashtags (restaurant_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [restaurantId, tagId]);
                       } else {
                            console.warn(`[Approve Submission] Could not link tag "${tagName}" to restaurant ${restaurantId} as tag ID was not found/created.`);
                       }
                   }
               }
          }
        } else if (sub.type === 'dish') {
            // Find the restaurant ID
            // CONSIDER: Use google_place_id from submission if available for better restaurant matching?
            const restQueryResult = await client.query( /* ... Query as before ... */
                 `SELECT id FROM Restaurants WHERE name ILIKE $1 ${sub.city ? 'AND city = $2' : ''} ORDER BY adds DESC LIMIT 1`,
                 sub.city ? [sub.location, sub.city] : [sub.location]
            );
            let restaurantId = null;
            if (restQueryResult.rows.length > 0) {
                restaurantId = restQueryResult.rows[0].id;
            } else {
                 await client.query('ROLLBACK');
                 return res.status(400).json({ error: `Cannot approve dish: Restaurant "${sub.location}" not found. Ensure restaurant exists.` });
            }

            // Check if dish already exists at this restaurant
            const existingDish = await client.query("SELECT * FROM Dishes WHERE name = $1 AND restaurant_id = $2", [sub.name, restaurantId]);
            if (existingDish.rows.length > 0) {
                 approvedItemData = existingDish.rows[0];
                 console.log(`[Approve Submission] Dish "${sub.name}" already exists (ID: ${approvedItemData.id}) at restaurant ID ${restaurantId}.`);
                 // CONSIDER: Update existing dish? (e.g., merge tags, description?)
            } else {
                // Create the new dish
                const dishResult = await client.query( /* ... Insert query as before ... */
                    `INSERT INTO Dishes (name, restaurant_id, description, adds) VALUES ($1, $2, $3, 1) RETURNING *`,
                    [ sub.name, restaurantId, null ]
                );
                approvedItemData = dishResult.rows[0];
                const dishId = approvedItemData.id;
                 console.log(`[Approve Submission] Created new dish (ID: ${dishId}): "${sub.name}" for restaurant ID ${restaurantId}`);

                // Link submitted tags to the new dish
                const submittedTags = Array.isArray(sub.tags) ? sub.tags : [];
                if (submittedTags.length > 0) {
                     for (const tagName of submittedTags) {
                          const tagId = await findOrCreateTagId(client, tagName);
                          if (tagId) { // Only link if tag ID was found/created
                              await client.query("INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [dishId, tagId]);
                          } else {
                              console.warn(`[Approve Submission] Could not link tag "${tagName}" to dish ${dishId} as tag ID was not found/created.`);
                          }
                     }
                }
            }
        } else { // Should be caught by validation, but defense-in-depth
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `Invalid submission type "${sub.type}" found during approval.` });
        }

        // Mark submission as approved
        await client.query("UPDATE Submissions SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
        await client.query('COMMIT'); // Commit transaction

        console.log(`[Approve Submission] Successfully approved submission ${id}.`);
        res.json(approvedItemData);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Approve submission ${id} transaction error:`, err);
        res.status(500).json({ error: `Approval failed due to server error: ${err.message}` });
      } finally {
        client.release();
      }
    }
);


// POST reject submission
router.post(
    "/:id/reject",
    validateIdParam,
    handleValidationErrors,
    async (req, res) => {
      const { id } = req.params;
      try {
        const result = await db.query("UPDATE Submissions SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending'", [id]);
        if (result.rowCount === 0) {
           const exists = await db.query("SELECT status FROM Submissions WHERE id = $1", [id]);
            if (exists.rowCount === 0) return res.status(404).json({ error: "Submission not found" });
            else return res.status(409).json({ error: `Submission already reviewed (status: ${exists.rows[0].status})` });
        }
        res.json({ message: "Submission rejected successfully" });
      } catch (err) {
        console.error(`Reject submission ${id} error:`, err);
        res.status(500).json({ error: "Rejection failed due to server error" });
      }
    }
);


module.exports = router;