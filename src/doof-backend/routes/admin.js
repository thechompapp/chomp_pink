// src/doof-backend/routes/admin.js
import express from 'express';
import { param, query, body, validationResult } from 'express-validator';
// Corrected imports:
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Constants and validation functions
const ALLOWED_ADMIN_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'submissions'];
const allowedSortColumns = {
  restaurants: ['name', 'city_name', 'neighborhood_name', 'adds', 'created_at', 'updated_at'],
  dishes: ['name', 'restaurant_id', 'adds', 'created_at', 'updated_at'], // Removed price as it's not in schema
  lists: ['name', 'city_name', 'item_count', 'saved_count', 'created_at', 'updated_at'],
  hashtags: ['name', 'category'],
  submissions: ['name', 'type', 'status', 'created_at', 'reviewed_at'],
};
const defaultSort = {
  restaurants: 'name_asc', dishes: 'name_asc', lists: 'name_asc',
  hashtags: 'name_asc', submissions: 'created_at_desc', // Default submissions to newest first
};

const validateTypeParam = (req, res, next) => {
  const { type } = req.params;
  if (!ALLOWED_ADMIN_TYPES.includes(type)) {
    return res.status(400).json({ error: `Invalid resource type: ${type}. Allowed types: ${ALLOWED_ADMIN_TYPES.join(', ')}` });
  }
  req.resourceType = type;
  // Map type to actual table name (ensure casing matches your DB schema)
  const tableMap = {
      restaurants: 'Restaurants',
      dishes: 'Dishes',
      lists: 'Lists',
      hashtags: 'Hashtags',
      submissions: 'Submissions'
  };
  req.tableName = tableMap[type];
  if (!req.tableName) {
      // Fallback or error if mapping fails, though validateTypeParam should prevent this
      return res.status(500).json({ error: 'Internal server error: Invalid resource type mapping.'});
  }
  next();
};

const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Admin Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const validateSortQuery = (req, res, next) => {
  const type = req.params.type;
  if (!type || !ALLOWED_ADMIN_TYPES.includes(type)) return next(); // Already validated by validateTypeParam

  const sortQuery = req.query.sort || defaultSort[type];
  const sortParts = sortQuery.toLowerCase().match(/^([a-z0-9_]+)_(asc|desc)$/); // Match column and direction

  if (!sortParts || !allowedSortColumns[type]?.includes(sortParts[1])) {
    console.warn(`[Admin Validation] Invalid or disallowed sort parameter "${sortQuery}" for type "${type}". Using default: ${defaultSort[type]}`);
    req.validSortColumn = defaultSort[type].split('_')[0];
    req.validSortDirection = defaultSort[type].split('_')[1] === 'desc' ? 'DESC' : 'ASC';
  } else {
    req.validSortColumn = sortParts[1];
    req.validSortDirection = sortParts[2] === 'desc' ? 'DESC' : 'ASC';
  }
  next();
};

const validateBulkAdd = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.type').isIn(['restaurant', 'dish']).withMessage('Each item type must be "restaurant" or "dish"'),
  body('items.*.name').trim().notEmpty().withMessage('Each item name is required'),
  // Add conditional validation based on type if needed later
];


// GET /:type - Fetch items for admin view
router.get("/:type", authMiddleware, validateTypeParam, validateSortQuery, async (req, res, next) => {
  // Check if user is superuser
  const currentDb = req.app?.get('db') || db;
  try {
      const userCheck = await currentDb.query('SELECT account_type FROM Users WHERE id = $1', [req.user.id]);
      if (userCheck.rows.length === 0 || userCheck.rows[0].account_type !== 'superuser') {
        return res.status(403).json({ error: 'Forbidden: Admin access required.' });
      }
  } catch(authErr) {
       console.error('[Admin GET /:type] Auth check error:', authErr);
       return next(authErr); // Pass DB error to handler
  }

  const sortColumn = req.validSortColumn;
  const sortDirection = req.validSortDirection;
  // Ensure column name is safe (basic alphanumeric + underscore) before interpolating
  const safeSortColumn = /^[a-z0-9_]+$/.test(sortColumn) ? `"${sortColumn}"` : null; // Quote potentially reserved words
  if (!safeSortColumn) {
       console.error(`[Admin GET /:type] Invalid sort column derived: ${sortColumn}`);
       return res.status(400).json({ error: 'Invalid sort parameter.'});
  }
  const orderBy = `${safeSortColumn} ${sortDirection}`;

  try {
    let query;
    const tableName = req.tableName; // Use validated table name

    if (req.resourceType === 'dishes') {
      // Handle potential alias if sorting on columns from joined tables
      let dishOrderBy = orderBy;
      if (sortColumn === 'name') dishOrderBy = `d.name ${sortDirection}`; // Use alias if joining
      else if (sortColumn === 'restaurant_id') dishOrderBy = `d.restaurant_id ${sortDirection}`;
      // Add other specific column mappings if needed
      else dishOrderBy = `d.${safeSortColumn} ${sortDirection}`; // Default to alias 'd'

      query = `SELECT d.*, r.name as restaurant_name
               FROM Dishes d
               LEFT JOIN Restaurants r ON d.restaurant_id = r.id
               ORDER BY ${dishOrderBy}`; // Use potentially modified orderBy
    } else {
      // For other types, direct query on the table
      query = `SELECT * FROM ${tableName} ORDER BY ${orderBy}`;
    }

    console.log(`[Admin GET /${req.params.type}] Executing Query: ${query}`);
    const result = await currentDb.query(query);
    res.json(result.rows || []);
  } catch (err) {
    console.error(`[Admin GET /${req.params.type}] Database query error:`, err);
    next(err); // Pass error to central handler
  }
});

// POST /bulk-add - Add restaurants/dishes in bulk
router.post('/bulk-add', authMiddleware, validateBulkAdd, handleValidationErrors, async (req, res, next) => {
  const { items } = req.body;
  const userId = req.user?.id;
  const currentDb = req.app?.get('db') || db; // Access db

  // Double-check superuser status within the route
  try {
    const userCheck = await currentDb.query('SELECT account_type FROM Users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].account_type !== 'superuser') {
      return res.status(403).json({ error: 'Forbidden: Only superusers can perform bulk add operations.' });
    }
  } catch(authErr) {
       console.error('[Admin POST /bulk-add] Auth check error:', authErr);
       return next(authErr);
  }

  let addedCount = 0;
  let skippedCount = 0;
  const results = []; // To track individual item results

  try {
    await currentDb.query('BEGIN'); // Start transaction

    for (const item of items) {
      let itemResult = { input: item, status: 'skipped', reason: 'Unknown item type' };
      try {
        if (item.type === 'restaurant') {
          // Insert Restaurant logic (using ON CONFLICT for place_id if provided)
          const restaurantQuery = `
            INSERT INTO Restaurants (name, city_name, neighborhood_name, google_place_id, adds, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ${item.place_id ? 'ON CONFLICT (google_place_id) DO NOTHING' : 'ON CONFLICT DO NOTHING'} -- Handle conflict only if place_id exists
            RETURNING id, name
          `;
          const restaurantResult = await currentDb.query(restaurantQuery, [
            item.name.trim(),
            item.city?.trim() || null,
            item.neighborhood?.trim() || null,
            item.place_id?.trim() || null,
          ]);

          if (restaurantResult.rows.length > 0) {
            const restaurantId = restaurantResult.rows[0].id;
            itemResult = { input: item, status: 'added', type: 'restaurant', id: restaurantId };
            // Add tags logic...
            if (Array.isArray(item.tags) && item.tags.length > 0) {
              for (const tag of item.tags) {
                const cleanTag = String(tag).trim().toLowerCase();
                if (!cleanTag) continue;
                const hashtagQuery = `
                  INSERT INTO Hashtags (name, category) VALUES ($1, 'general')
                  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
                `;
                const hashtagResult = await currentDb.query(hashtagQuery, [cleanTag]);
                const hashtagId = hashtagResult.rows[0].id;
                await currentDb.query(
                  'INSERT INTO RestaurantHashtags (restaurant_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                  [restaurantId, hashtagId]
                );
              }
            }
            addedCount++;
          } else {
            // Check if it already exists to provide better feedback
             let existingCheck;
             if(item.place_id) {
                 existingCheck = await currentDb.query('SELECT id, name FROM Restaurants WHERE google_place_id = $1', [item.place_id]);
             } else {
                  existingCheck = await currentDb.query('SELECT id, name FROM Restaurants WHERE name ILIKE $1 AND city_name ILIKE $2 LIMIT 1', [item.name, item.city || '']);
             }
             if(existingCheck.rows.length > 0) {
                 itemResult = { input: item, status: 'skipped', reason: `Restaurant likely already exists (ID: ${existingCheck.rows[0].id}, Name: ${existingCheck.rows[0].name})`};
             } else {
                 itemResult = { input: item, status: 'skipped', reason: 'Insert conflict or unknown error (restaurant)'};
             }
             skippedCount++;
          }
        } else if (item.type === 'dish') {
          // Dish logic: Find/Create Restaurant first
          if (!item.restaurant_name) {
            itemResult = { input: item, status: 'skipped', reason: 'Missing restaurant_name for dish' };
            skippedCount++;
            results.push(itemResult);
            continue; // Skip this dish
          }

          let restaurantId;
          const restaurantCheck = await currentDb.query(
            'SELECT id FROM Restaurants WHERE name ILIKE $1 LIMIT 1', // Case-insensitive check
            [item.restaurant_name.trim()]
          );

          if (restaurantCheck.rows.length > 0) {
            restaurantId = restaurantCheck.rows[0].id;
          } else {
            // Create restaurant if not found
            const restaurantInsert = await currentDb.query(
              'INSERT INTO Restaurants (name, city_name, neighborhood_name, adds, created_at, updated_at) VALUES ($1, $2, $3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
              [item.restaurant_name.trim(), item.city?.trim() || null, item.neighborhood?.trim() || null]
            );
            restaurantId = restaurantInsert.rows[0].id;
            console.log(`[Admin /bulk-add] Created new restaurant ID ${restaurantId} for dish "${item.name}"`);
          }

          // Insert Dish
          const dishQuery = `
            INSERT INTO Dishes (name, restaurant_id, adds, created_at, updated_at)
            VALUES ($1, $2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (name, restaurant_id) DO NOTHING -- Prevent duplicate dish at same restaurant
            RETURNING id
          `;
          const dishResult = await currentDb.query(dishQuery, [item.name.trim(), restaurantId]);

          if (dishResult.rows.length > 0) {
            const dishId = dishResult.rows[0].id;
             itemResult = { input: item, status: 'added', type: 'dish', id: dishId, restaurantId: restaurantId };
            // Add tags logic...
            if (Array.isArray(item.tags) && item.tags.length > 0) {
              for (const tag of item.tags) {
                 const cleanTag = String(tag).trim().toLowerCase();
                 if (!cleanTag) continue;
                const hashtagQuery = `
                  INSERT INTO Hashtags (name, category) VALUES ($1, 'general')
                  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
                `;
                const hashtagResult = await currentDb.query(hashtagQuery, [cleanTag]);
                const hashtagId = hashtagResult.rows[0].id;
                await currentDb.query(
                  'INSERT INTO DishHashtags (dish_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                  [dishId, hashtagId]
                );
              }
            }
            addedCount++;
          } else {
             itemResult = { input: item, status: 'skipped', reason: `Dish likely already exists at restaurant ID ${restaurantId}` };
            skippedCount++;
          }
        }
      } catch(itemErr) {
           console.error(`[Admin /bulk-add] Error processing item: ${JSON.stringify(item)}`, itemErr);
           itemResult = { input: item, status: 'error', reason: itemErr.message || 'Processing error' };
           skippedCount++; // Count errors as skipped for summary
           // Decide if one error should rollback all (currently it will due to outer catch)
           // Or log and continue? Transaction ensures atomicity if we let it throw.
           // throw itemErr; // Re-throw to rollback transaction immediately
      }
      results.push(itemResult); // Add result for this item
    } // End of loop

    await currentDb.query('COMMIT'); // Commit transaction if loop finishes without throwing
    res.status(201).json({
        processedCount: items.length,
        addedCount,
        skippedCount,
        message: `${addedCount} items added, ${skippedCount} skipped or already existed.`,
        details: results // Provide detailed results
    });
  } catch (err) {
    // Ensure rollback happens if an error occurred during processing or commit
    try { await currentDb.query('ROLLBACK'); } catch (rbErr) { console.error('Error rolling back transaction:', rbErr); }
    console.error('[Admin /bulk-add] Transaction failed:', err);
    next(err); // Pass error to central handler
  }
});


// Corrected export
export default router;