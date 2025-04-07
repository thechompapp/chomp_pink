// src/doof-backend/routes/admin.js
import express from 'express';
import { param, query, body, validationResult } from 'express-validator';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// --- Constants and Configuration ---
const ALLOWED_RESOURCE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'submissions', 'users'];
const ALLOWED_MUTATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags'];
const allowedSortColumns = {
    restaurants: ['id', 'name', 'city_name', 'neighborhood_name', 'adds', 'created_at', 'updated_at'],
    dishes: ['id', 'name', 'restaurant_id', 'adds', 'created_at', 'updated_at'],
    lists: ['id', 'name', 'saved_count', 'created_at', 'updated_at', 'user_id', 'is_public'],
    hashtags: ['id', 'name', 'category', 'created_at', 'updated_at'],
    submissions: ['id', 'name', 'type', 'status', 'created_at', 'reviewed_at', 'user_id'],
    users: ['id', 'username', 'email', 'account_type', 'created_at'],
};
const defaultSort = {
    restaurants: 'name_asc',
    dishes: 'name_asc',
    lists: 'name_asc',
    hashtags: 'name_asc',
    submissions: 'created_at_desc',
    users: 'username_asc',
};
const updatableFields = {
    restaurants: ['name', 'city_name', 'neighborhood_name', 'address', 'google_place_id', 'latitude', 'longitude', 'city_id', 'neighborhood_id'],
    dishes: ['name', 'restaurant_id'],
    lists: ['name', 'description', 'list_type', 'is_public', 'tags'],
    hashtags: ['name', 'category'],
    users: ['username', 'email', 'account_type'],
};
const fieldTypes = {
    name: 'text', city_name: 'text', neighborhood_name: 'text', address: 'text', google_place_id: 'text',
    latitude: 'number', longitude: 'number', city_id: 'number', neighborhood_id: 'number',
    restaurant_id: 'number', description: 'text', list_type: 'select', is_public: 'boolean',
    tags: 'array', category: 'text', username: 'text', email: 'email', account_type: 'select',
    adds: 'number', saved_count: 'number', id: 'number', created_at: 'datetime', updated_at: 'datetime',
    status: 'text', type: 'text', user_id: 'number', reviewed_at: 'datetime'
};
const listTypeOptions = ['mixed', 'restaurant', 'dish'];
const userAccountTypeOptions = ['user', 'contributor', 'superuser'];
const submissionStatusOptions = ['pending', 'approved', 'rejected'];

// --- Middleware ---
// Middleware to require Superuser role
const requireSuperuser = async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    if (!req.user || typeof req.user.id === 'undefined') {
        console.warn('[Admin RequireSuperuser] Auth middleware did not attach user or user ID.');
        return res.status(401).json({ error: 'Authentication required or invalid token payload.' });
    }
    try {
        // Use lowercase unquoted table and column names
        const userCheckQuery = 'SELECT account_type FROM users WHERE id = $1';
        console.log(`[Admin RequireSuperuser] Checking permissions for user ID: ${req.user.id}`);
        const userCheck = await currentDb.query(userCheckQuery, [req.user.id]);

        if (userCheck.rows.length === 0) {
             console.warn(`[Admin RequireSuperuser] User ID ${req.user.id} not found in database.`);
             return res.status(403).json({ error: 'Forbidden: User not found.' });
        }
        const accountType = userCheck.rows[0].account_type;
        if (accountType !== 'superuser') {
            console.warn(`[Admin RequireSuperuser] Access denied for user ID ${req.user.id}. Account type: ${accountType}`);
            return res.status(403).json({ error: 'Forbidden: Superuser access required.' });
        }
        console.log(`[Admin RequireSuperuser] User ID ${req.user.id} verified as superuser.`);
        next();
    } catch (authErr) {
        console.error('[Admin RequireSuperuser] Database query error during permission check:', authErr);
        if (authErr.code === '42P01') { // Undefined table
             console.error('[Admin RequireSuperuser] FATAL: "users" table does not exist or cannot be accessed.');
             return res.status(500).json({ error: 'Server configuration error: User table not found or inaccessible.' });
        }
        return next(new Error('Database error during permission verification.'));
    }
};

// Middleware to validate :type parameter
const validateTypeParam = (req, res, next) => {
    const { type } = req.params;
    if (!ALLOWED_RESOURCE_TYPES.includes(type)) {
        return res.status(400).json({ error: `Invalid resource type specified: ${type}` });
    }
    // *** Use lowercase unquoted table name ***
    req.tableName = type.toLowerCase(); // e.g., 'restaurants', 'submissions'
    req.resourceType = type;
    next();
};

// Middleware to validate :id parameter
const validateIdParam = [
    param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
];

// Middleware to handle validation errors from express-validator
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Admin Validation Error] Path: ${req.path}, Errors:`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Middleware to validate and sanitize sort query parameters
const validateSortQuery = (req, res, next) => {
    const { sort } = req.query;
    const type = req.resourceType;
    const defaultSortValue = defaultSort[type] || 'id_asc';
    let column, direction;

    if (sort) {
        const parts = sort.split('_');
        direction = parts.pop()?.toLowerCase();
        column = parts.join('_');
    } else {
        [column, direction] = defaultSortValue.split('_');
    }

    if (!allowedSortColumns[type]?.includes(column) || !['asc', 'desc'].includes(direction)) {
        console.warn(`[Admin Sort Validation] Invalid sort params: Column "${column}", Direction "${direction}". Falling back to default: ${defaultSortValue}`);
        [column, direction] = defaultSortValue.split('_');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(column)) {
        console.error(`[Admin Sort Validation] Invalid characters in sort column: ${column}. Aborting.`);
        return res.status(400).json({ error: 'Invalid sort column name.' });
    }

    // Quote column names for safety in ORDER BY
    req.safeSortColumn = `"${column}"`;
    req.validSortDirection = direction.toUpperCase(); // ASC/DESC

    console.log(`[Admin Sort] Using sort: ${req.safeSortColumn} ${req.validSortDirection}`);
    next();
};

// Middleware to validate update body against allowed fields
const validateUpdateBody = (req, res, next) => {
    const { type } = req.params;
    if (!ALLOWED_MUTATE_TYPES.includes(type)) {
        return res.status(400).json({ error: `Updates not allowed for resource type: ${type}.` });
    }
    const allowedFields = updatableFields[type] || [];
    const bodyFields = Object.keys(req.body);
    const invalidFields = bodyFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
        return res.status(400).json({ error: `Invalid fields provided for update on ${type}: ${invalidFields.join(', ')}` });
    }
    if (bodyFields.length === 0) {
         return res.status(400).json({ error: `No fields provided for update.` });
    }
    next();
};

// Validation middleware for bulk add request body
const validateBulkAdd = [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.name').trim().notEmpty().withMessage('Item name is required'),
    body('items.*.type').isIn(['restaurant', 'dish']).withMessage('Invalid item type (must be "restaurant" or "dish")'),
    body('items.*.restaurant_name').if(body('items.*.type').equals('dish')).trim().notEmpty().withMessage('Restaurant name is required for dishes'),
    body('items.*.tags').optional({ nullable: true }).isArray().withMessage('Tags must be an array if provided'),
    body('items.*.tags.*').optional().isString().trim().notEmpty().withMessage('Tags must be non-empty strings'),
];

// --- Apply Common Middleware ---
router.use(authMiddleware);
router.use(requireSuperuser);

// --- Routes ---

// GET /api/admin/:type (Read)
router.get(
    "/:type",
    validateTypeParam,
    validateSortQuery,
    async (req, res, next) => {
        const currentDb = req.app?.get('db') || db;
        const safeSortColumn = req.safeSortColumn; // e.g., "created_at"
        const sortDirection = req.validSortDirection; // e.g., DESC
        const tableName = req.tableName; // e.g., 'submissions'

        // *** Construct ORDER BY clause carefully - Ensure space before ORDER BY ***
        const orderByClause = ` ORDER BY ${safeSortColumn} ${sortDirection}`;

        try {
            let queryBase; // Base SELECT part
            let joins = ''; // JOIN clauses
            let whereClause = ''; // WHERE clause (for filtering like submissions status)
            let params = []; // Parameters for the query

            // Use lowercase, unquoted table names consistently
            switch (req.resourceType) {
                case 'submissions':
                    const statusFilter = req.query.status || 'pending';
                    if (!submissionStatusOptions.includes(statusFilter)) {
                        return res.status(400).json({ error: `Invalid status filter. Allowed values: ${submissionStatusOptions.join(', ')}` });
                    }
                    queryBase = `SELECT s.*, u.username as user_handle FROM submissions s`;
                    joins = `LEFT JOIN users u ON s.user_id = u.id`;
                    whereClause = `WHERE s.status = $1`;
                    params = [statusFilter];
                    break;
                case 'dishes':
                    queryBase = `SELECT d.*, r.name AS restaurant_name FROM dishes d`;
                    joins = `LEFT JOIN restaurants r ON d.restaurant_id = r.id`;
                    break;
                case 'lists':
                    queryBase = `SELECT l.*, u.username AS creator_handle FROM lists l`;
                    joins = `LEFT JOIN users u ON l.user_id = u.id`;
                    break;
                case 'restaurants':
                    queryBase = `SELECT r.*, c.name AS city_name, n.name AS neighborhood_name FROM restaurants r`;
                    joins = `LEFT JOIN cities c ON r.city_id = c.id LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id`;
                    break;
                case 'users':
                    queryBase = `SELECT id, username, email, account_type, created_at FROM users`;
                    break;
                default: // For hashtags or other simple tables
                    queryBase = `SELECT * FROM ${tableName}`; // Use lowercase table name
                    break;
            }

            // Combine parts into the final query
            // Add space before JOIN, WHERE, ORDER BY
            const query = `${queryBase}${joins ? ' ' + joins : ''}${whereClause ? ' ' + whereClause : ''}${orderByClause}`;

            console.log(`[Admin GET /${req.params.type}] Executing Query: ${query} with params: ${JSON.stringify(params)}`);
            const result = await currentDb.query(query, params);
            res.json(result.rows || []);
        } catch (err) {
            console.error(`[Admin GET /${req.params.type}] Database query error:`, err);
            if (err.code === '42703') { // Undefined column
                 console.error(`[Admin Sort Error] Column specified in ORDER BY (${req.safeSortColumn}) likely does not exist in table ${req.tableName}.`);
                 return res.status(400).json({ error: `Invalid sort column: ${req.safeSortColumn.replace(/"/g, '')}` });
            } else if (err.code === '42P01') { // Undefined table
                console.error(`[Admin GET Error] Table ${req.tableName} likely does not exist.`);
                return res.status(500).json({ error: `Database schema error: Table ${req.tableName} missing.` });
            } else if (err.code === '42601') { // Syntax error code
                 console.error(`[Admin GET /${req.params.type}] SQL Syntax Error. Query generated: ${query}`); // Log the failing query
                 const detailedError = process.env.NODE_ENV === 'development' ? err.message : `Internal server error processing request for ${req.params.type}.`;
                 return res.status(500).json({ error: detailedError });
            }
            next(err);
        }
    }
);


// POST /api/admin/submissions/:id/approve
router.post(
    '/submissions/:id/approve',
    validateIdParam,
    handleValidationErrors,
    async (req, res, next) => {
        const { id } = req.params;
        const currentDb = req.app?.get('db') || db;
        try {
            // Use lowercase, unquoted table name
            const query = `
                UPDATE submissions
                SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
                WHERE id = $1 AND status = 'pending'
                RETURNING *
            `;
            const result = await currentDb.query(query, [id, req.user.id]);
            if (result.rows.length === 0) {
                const check = await currentDb.query('SELECT status FROM submissions WHERE id = $1', [id]);
                if (check.rows.length > 0) {
                    return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).` });
                } else {
                    return res.status(404).json({ error: 'Submission not found.' });
                }
            }
            console.log(`[Admin POST /submissions/${id}/approve] Submission approved.`);
            res.json(result.rows[0]);
        } catch (err) {
            console.error(`[Admin POST /submissions/${id}/approve] Error approving submission:`, err);
            next(err);
        }
    }
);

// POST /api/admin/submissions/:id/reject
router.post(
    '/submissions/:id/reject',
    validateIdParam,
    handleValidationErrors,
    async (req, res, next) => {
        const { id } = req.params;
        const currentDb = req.app?.get('db') || db;
        try {
             // Use lowercase, unquoted table name
            const query = `
                UPDATE submissions
                SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
                WHERE id = $1 AND status = 'pending'
                RETURNING *
            `;
            const result = await currentDb.query(query, [id, req.user.id]);
            if (result.rows.length === 0) {
                const check = await currentDb.query('SELECT status FROM submissions WHERE id = $1', [id]);
                if (check.rows.length > 0) {
                    return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).` });
                } else {
                    return res.status(404).json({ error: 'Submission not found.' });
                }
            }
            console.log(`[Admin POST /submissions/${id}/reject] Submission rejected.`);
            res.json(result.rows[0]);
        } catch (err) {
            console.error(`[Admin POST /submissions/${id}/reject] Error rejecting submission:`, err);
            next(err);
        }
    }
);

// PUT /api/admin/:type/:id (Update)
router.put(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    validateUpdateBody,
    handleValidationErrors,
    async (req, res, next) => {
        const { type, id } = req.params;
        const currentDb = req.app?.get('db') || db;

        try {
            const fields = updatableFields[type];
            const updates = [];
            const values = [id];
            let paramIndex = 2;

            for (const field of fields) {
                if (req.body[field] !== undefined) {
                     const expectedType = fieldTypes[field];
                     const value = req.body[field];
                     if (expectedType === 'number' && (value !== null && isNaN(Number(value)))) {
                         return res.status(400).json({ error: `Invalid number format for field: ${field}` });
                     }
                     if (expectedType === 'boolean' && typeof value !== 'boolean') {
                          return res.status(400).json({ error: `Field ${field} must be a boolean.` });
                     }
                      if (expectedType === 'array' && !Array.isArray(value)) {
                          return res.status(400).json({ error: `Field ${field} must be an array.` });
                      }
                      if (expectedType === 'select' && type === 'lists' && field === 'list_type' && !listTypeOptions.includes(value)) {
                          return res.status(400).json({ error: `Invalid list_type. Must be one of: ${listTypeOptions.join(', ')}` });
                      }
                       if (expectedType === 'select' && type === 'users' && field === 'account_type' && !userAccountTypeOptions.includes(value)) {
                          return res.status(400).json({ error: `Invalid account_type. Must be one of: ${userAccountTypeOptions.join(', ')}` });
                      }
                    // Use unquoted column names
                    updates.push(`${field} = $${paramIndex++}`);
                    values.push(value);
                }
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No valid fields provided for update.' });
            }

             // Use lowercase table name, unquoted updated_at
            const query = `
                UPDATE ${req.tableName}
                SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            console.log(`[Admin PUT /${type}/${id}] Executing Query: ${query}`);
            console.log(`[Admin PUT /${type}/${id}] Values:`, values);

            const result = await currentDb.query(query, values);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: `${req.resourceType.slice(0, -1)} not found.` });
            }

            const responseData = { ...result.rows[0] };
            if (req.tableName === 'users') {
                 delete responseData.password_hash;
            }

            res.json(responseData);
        } catch (err) {
            console.error(`[Admin PUT /${type}/${id}] Error updating item:`, err);
             if (err.code === '23505') {
                 return res.status(409).json({ error: `Update failed: A record with the provided unique details already exists.` });
             } else if (err.code === '23503') {
                 return res.status(400).json({ error: `Update failed: Invalid reference (e.g., city_id or restaurant_id does not exist).` });
             } else if (err.code === '42703') { // Undefined column
                console.error(`[Admin PUT Error] Column likely does not exist in table ${req.tableName}. Check query: ${query}`);
                return res.status(500).json({ error: `Database schema error during update.` });
             } else if (err.code === '42P01') { // Undefined table
                console.error(`[Admin PUT Error] Table ${req.tableName} likely does not exist.`);
                return res.status(500).json({ error: `Database schema error: Table ${req.tableName} missing.` });
            }
            next(err);
        }
    }
);

// DELETE /api/admin/:type/:id (Delete)
router.delete(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    handleValidationErrors,
    async (req, res, next) => {
        const { type, id } = req.params;
        const currentDb = req.app?.get('db') || db;
        if (!ALLOWED_MUTATE_TYPES.includes(type)) {
            return res.status(400).json({ error: `Deletion not allowed for resource type: ${type}.` });
        }
        try {
             // Use lowercase table name
            const query = `
                DELETE FROM ${req.tableName}
                WHERE id = $1
                RETURNING id
            `;
            console.log(`[Admin DELETE /${type}/${id}] Executing Query: ${query}`);
            const result = await currentDb.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: `${req.resourceType.slice(0, -1)} not found.` });
            }
            res.status(204).send();
        } catch (err) {
            console.error(`[Admin DELETE /${type}/${id}] Error deleting item:`, err);
             if (err.code === '23503') {
                 return res.status(409).json({ error: `Cannot delete ${type.slice(0, -1)}: It is referenced by other items.` });
             } else if (err.code === '42P01') { // Undefined table
                console.error(`[Admin DELETE Error] Table ${req.tableName} likely does not exist.`);
                return res.status(500).json({ error: `Database schema error: Table ${req.tableName} missing.` });
            }
            next(err);
        }
    }
);

// POST /api/admin/bulk-add (Bulk Create Restaurants/Dishes)
router.post(
    '/bulk-add',
    validateBulkAdd,
    handleValidationErrors,
    async (req, res, next) => {
        const { items } = req.body;
        const currentDb = req.app?.get('db') || db;
        const client = await currentDb.getClient();
        const results = { processedCount: 0, addedCount: 0, skippedCount: 0, message: '', details: [] };

        try {
            await client.query('BEGIN');

            for (const item of items) {
                results.processedCount++;
                let addedItem = null;
                let reason = '';
                let status = 'skipped';

                try {
                    if (item.type === 'restaurant') {
                        // Use lowercase table names
                        const query = `
                            INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, adds)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
                            ON CONFLICT (name, city_id) DO NOTHING
                            RETURNING *
                        `;
                        const result = await client.query(query, [
                            item.name, item.city_id || null, item.neighborhood_id || null, item.city || null,
                            item.neighborhood || null, item.location || null, item.place_id || null
                        ]);
                        if (result.rows.length > 0) {
                            addedItem = result.rows[0];
                            status = 'added';
                            results.addedCount++;
                        } else {
                            reason = 'Restaurant likely already exists with this name in the specified city.';
                            results.skippedCount++;
                        }
                    } else if (item.type === 'dish') {
                        let restaurantId = null;
                        if (item.restaurant_name) {
                             // Use lowercase table name
                             const findRestQuery = 'SELECT id FROM restaurants WHERE name ILIKE $1 LIMIT 1';
                             const restResult = await client.query(findRestQuery, [item.restaurant_name]);
                             if (restResult.rows.length > 0) {
                                 restaurantId = restResult.rows[0].id;
                             } else {
                                 reason = `Restaurant '${item.restaurant_name}' not found. Dish skipped.`;
                             }
                        } else {
                            reason = 'Restaurant name missing for dish.';
                        }

                        if (restaurantId) {
                             // Use lowercase table name
                            const query = `
                                INSERT INTO dishes (name, restaurant_id, adds)
                                VALUES ($1, $2, 0)
                                ON CONFLICT (name, restaurant_id) DO NOTHING
                                RETURNING *
                            `;
                            const result = await client.query(query, [item.name, restaurantId]);
                            if (result.rows.length > 0) {
                                addedItem = result.rows[0];
                                status = 'added';
                                results.addedCount++;
                            } else {
                                reason = reason || 'Dish likely already exists for this restaurant.';
                                results.skippedCount++;
                            }
                        } else {
                             results.skippedCount++;
                        }
                    }
                } catch (itemError) {
                    console.warn(`[Bulk Add Item Error] Item: ${JSON.stringify(item)}, Error: ${itemError.message}`);
                    status = 'error';
                    reason = itemError.message;
                    results.skippedCount++;
                }
                results.details.push({
                    input: { name: item.name, type: item.type },
                    status: status,
                    reason: reason || undefined,
                    id: addedItem?.id || undefined,
                    type: addedItem ? item.type : undefined,
                });
            } // end for loop

            await client.query('COMMIT');
            results.message = `Bulk processing complete. Added: ${results.addedCount}, Skipped/Existed/Error: ${results.skippedCount}.`;
            res.status(200).json(results);
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('[Admin POST /bulk-add] Transaction error during bulk add:', err);
            next(err);
        } finally {
            client.release();
        }
    }
);


// POST /api/admin/:type (Create Single Item) - Refined
router.post(
    '/:type',
    validateTypeParam,
    handleValidationErrors,
    async (req, res, next) => {
        const { type } = req.params;
        const data = req.body;
        const currentDb = req.app?.get('db') || db;

        if (!ALLOWED_MUTATE_TYPES.includes(type)) {
            return res.status(400).json({ error: `Creation not allowed for resource type: ${type}.` });
        }

        try {
            let query, values;
            const columns = [];
            const placeholders = [];
            values = [];
            let paramIndex = 1;

            // Use unquoted, lowercase column names
            const addParam = (field, value, required = false) => {
                if (value !== undefined && value !== null) {
                    columns.push(field);
                    placeholders.push(`$${paramIndex++}`);
                    values.push(value);
                } else if (required) {
                    throw new Error(`Missing required field: ${field}`);
                }
            };

            addParam('name', data.name, true);

            switch (type) {
                case 'restaurants':
                    addParam('city_id', data.city_id, true);
                    addParam('city_name', data.city_name);
                    addParam('neighborhood_id', data.neighborhood_id);
                    addParam('neighborhood_name', data.neighborhood_name);
                    addParam('address', data.address);
                    addParam('google_place_id', data.google_place_id);
                    addParam('latitude', data.latitude);
                    addParam('longitude', data.longitude);
                    addParam('adds', 0);
                    break;
                case 'dishes':
                    addParam('restaurant_id', data.restaurant_id, true);
                    addParam('adds', 0);
                    break;
                case 'lists':
                    addParam('description', data.description);
                    addParam('list_type', data.list_type || 'mixed');
                    if (data.list_type && !listTypeOptions.includes(data.list_type)) {
                        throw new Error(`Invalid list_type. Must be one of: ${listTypeOptions.join(', ')}`);
                    }
                    addParam('saved_count', 0);
                    addParam('is_public', data.is_public ?? true);
                    addParam('tags', data.tags || []);
                    addParam('user_id', req.user.id);
                    addParam('creator_handle', req.user.username);
                    break;
                case 'hashtags':
                     addParam('category', data.category);
                    break;
                default:
                     return res.status(400).json({ error: `Invalid type for creation: ${type}` });
            }

            // Use lowercase table name
            query = `
                INSERT INTO ${req.tableName} (${columns.join(', ')})
                VALUES (${placeholders.join(', ')})
                RETURNING *
            `;

            console.log(`[Admin POST /${type}] Executing Query: ${query}`);
            console.log(`[Admin POST /${type}] Values:`, values);

            const result = await currentDb.query(query, values);
            if (result.rows.length === 0) {
                return res.status(500).json({ error: 'Failed to create item, no data returned.' });
            }
            res.status(201).json(result.rows[0]);
        } catch (err) {
            console.error(`[Admin POST /${type}] Error creating item:`, err);
            if (err.code === '23505') {
                res.status(409).json({ error: `Item creation failed: A record with the provided unique details already exists.` });
            } else if (err.code === '23503') {
                res.status(400).json({ error: `Item creation failed: Invalid reference (e.g., city_id or restaurant_id does not exist).` });
            } else if (err.message.startsWith('Missing required field:')) {
                 res.status(400).json({ error: err.message });
            } else {
                next(err);
            }
        }
    }
);

export default router;