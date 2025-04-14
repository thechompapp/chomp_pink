/* src/doof-backend/routes/admin.js */
import express from 'express';
import { param, query, body, validationResult, checkSchema } from 'express-validator';
import bcrypt from 'bcryptjs';

// Corrected imports - Add .js extension back
import * as AdminModel from '../models/adminModel.js';
import * as SubmissionModel from '../models/submissionModel.js';
import * as NeighborhoodModel from '../models/neighborhoodModel.js';
import * as FilterModel from '../models/filterModel.js';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_UPDATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_CREATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];

const DEFAULT_PAGE_LIMIT = 25;
const typeToTable = {
    submissions: 'submissions', restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users', neighborhoods: 'neighborhoods'
};

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Admin Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ message: errors.array({ onlyFirstError: true })[0].msg });
        return;
    }
    next();
};

const attachResourceInfo = (req, res, next) => {
    const reqWithInfo = req;
    const typeParam = reqWithInfo.params.type;
    if (!typeParam || !ALLOWED_TYPES.includes(typeParam)) {
        return res.status(400).json({ message: 'Invalid or missing resource type specified.' });
    }
    reqWithInfo.resourceType = typeParam;
    reqWithInfo.tableName = typeToTable[typeParam];
    if (!reqWithInfo.tableName) {
        console.error(`[Admin attachResourceInfo] Internal error: Invalid resource type mapping for '${typeParam}'.`);
        return res.status(500).json({ message: 'Internal server error: Resource type mapping failed.' });
    }
    next();
};

router.use(authMiddleware);
router.use(requireSuperuser);

// --- Validation Schemas ---
const getUpdateValidationSchema = (type) => {
    switch (type) {
        case 'restaurants':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                address: { optional: true, isString: true, trim: true, isLength: { options: { max: 500 } }, escape: true },
                zipcode: { optional: true, isString: true, trim: true, matches: { options: /^\d{5}$/ }, errorMessage: 'Zipcode must be 5 digits' },
                latitude: { optional: { options: { nullable: true } }, isFloat: true, toFloat: true },
                longitude: { optional: { options: { nullable: true } }, isFloat: true, toFloat: true },
                phone_number: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 30 } }, escape: true },
                website: { optional: { options: { nullable: true } }, isURL: {}, trim: true, isLength: { options: { max: 2048 } } },
                google_place_id: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 255 } }, escape: true },
                neighborhood_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'Neighborhood ID must be a positive integer or null' },
                photo_url: { optional: { options: { nullable: true } }, isURL: {}, trim: true, isLength: { options: { max: 2048 } } },
                instagram_handle: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                city_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'City ID must be a positive integer' }, // Added city_id
            };
        case 'dishes':
             return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                restaurant_id: { optional: true, isInt: { options: { gt: 0 } }, toInt: true },
            };
        case 'lists':
             return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                description: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 1000 } }, escape: true },
                list_type: { optional: true, isIn: { options: [['restaurant', 'dish']] } }, // Removed 'mixed' if not intended
                is_public: { optional: true, isBoolean: true, toBoolean: true },
                city_name: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                tags: { optional: true, isArray: true, errorMessage: 'Tags must be an array' }, // Handle tags update if needed
                 'tags.*': { isString: true, trim: true, escape: true },
            };
        case 'hashtags':
             return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 100 } }, escape: true },
                category: { optional: true, isString: true, trim: true, isLength: { options: { max: 50 } }, escape: true },
            };
        case 'users':
            return {
                username: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { min: 3, max: 50 } }, escape: true },
                email: { optional: true, isEmail: true, normalizeEmail: true },
                account_type: { optional: true, isIn: { options: [['user', 'contributor', 'superuser']] } },
            };
        case 'neighborhoods':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 100 } }, escape: true, errorMessage: 'Neighborhood name cannot be empty if provided.' },
                city_id: { optional: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'A valid City ID must be provided if changing the city.' },
                zipcode_ranges: { // Match create/update logic in model
                    optional: { options: { nullable: true } },
                    custom: {
                        options: (value) => {
                             if (value === null || value === undefined || value === '') return true;
                            const codes = Array.isArray(value) ? value : String(value).split(',').map(z => z.trim());
                            return codes.every(code => /^\d{5}$/.test(code));
                         },
                        errorMessage: 'Zip codes must be a comma-separated string or array of valid 5-digit codes.'
                     }
                },
            };
        default:
            return {};
    }
};

const getCreateValidationSchema = (type) => {
    switch (type) {
        case 'restaurants':
             return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Restaurant name is required', isLength: { options: { max: 255 } }, escape: true },
                address: { optional: true, isString: true, trim: true, isLength: { options: { max: 500 } }, escape: true },
                zipcode: { optional: true, isString: true, trim: true, matches: { options: /^\d{5}$/ }, errorMessage: 'Zipcode must be 5 digits' },
                city_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'City ID must be a positive integer' },
                neighborhood_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'Neighborhood ID must be a positive integer' },
                 // Allow other fields from update schema optionally
                 latitude: { optional: { options: { nullable: true } }, isFloat: true, toFloat: true },
                 longitude: { optional: { options: { nullable: true } }, isFloat: true, toFloat: true },
                 phone_number: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 30 } }, escape: true },
                 website: { optional: { options: { nullable: true } }, isURL: {}, trim: true, isLength: { options: { max: 2048 } } },
                 google_place_id: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 255 } }, escape: true },
                 photo_url: { optional: { options: { nullable: true } }, isURL: {}, trim: true, isLength: { options: { max: 2048 } } },
                 instagram_handle: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },

            };
        case 'dishes':
             return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Dish name is required', isLength: { options: { max: 255 } }, escape: true },
                restaurant_id: { notEmpty: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'Restaurant ID is required and must be a positive integer' },
            };
        case 'lists':
            return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'List name is required', isLength: { options: { max: 255 } }, escape: true },
                description: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 1000 } }, escape: true },
                list_type: { notEmpty: true, isIn: { options: [['restaurant', 'dish']] }, errorMessage: 'List type (restaurant or dish) is required' }, // Removed 'mixed' if not intended
                is_public: { optional: true, isBoolean: true, toBoolean: true },
                city_name: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                 tags: { optional: true, isArray: true, errorMessage: 'Tags must be an array' },
                 'tags.*': { isString: true, trim: true, escape: true },
            };
        case 'hashtags':
             return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Hashtag name is required', isLength: { options: { max: 100 } }, escape: true },
                category: { optional: true, isString: true, trim: true, isLength: { options: { max: 50 } }, escape: true },
            };
        case 'users':
            return {
                username: { isString: true, trim: true, notEmpty: true, isLength: { options: { min: 3, max: 50 } }, errorMessage: 'Username must be 3-50 characters', escape: true },
                email: { isEmail: true, errorMessage: 'Valid email is required', normalizeEmail: true },
                account_type: { optional: true, isIn: { options: [['user', 'contributor', 'superuser']] } },
                password: { notEmpty: true, isLength: { options: { min: 6 } }, errorMessage: 'Password must be at least 6 characters' },
            };
        case 'neighborhoods':
             return {
                name: { isString: true, trim: true, notEmpty: true, isLength: { options: { max: 100 } }, escape: true, errorMessage: 'Neighborhood name is required.' },
                city_id: { notEmpty: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'A valid City ID is required.' },
                zipcode_ranges: { // Match update schema
                     optional: { options: { nullable: true } },
                     custom: {
                         options: (value) => {
                             if (value === null || value === undefined || value === '') return true;
                             const codes = Array.isArray(value) ? value : String(value).split(',').map(z => z.trim());
                             return codes.every(code => /^\d{5}$/.test(code));
                          },
                         errorMessage: 'Zip codes must be a comma-separated string or array of valid 5-digit codes.'
                      }
                 },
            };
        default:
            return {};
    }
};

// Common Validation Chains
const validateIdParam = param('id').isInt({ gt: 0 }).withMessage('ID must be a positive integer').toInt();
const validateTypeParam = param('type').isIn(ALLOWED_TYPES).withMessage('Invalid resource type specified');
const validateSortQuery = query('sort').optional().isString().matches(/^[a-zA-Z0-9_.]+_(asc|desc)$/i).withMessage('Invalid sort format (column_direction)');
const validateGetListQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    query('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search term too long or invalid characters'),
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status filter'),
    query('list_type').optional().isIn(['restaurant', 'dish']).withMessage('Invalid list type filter'), // Removed 'mixed'
    query('hashtag_category').optional().isString().trim().escape().isLength({ max: 50 }).withMessage('Invalid hashtag category'),
    query('cityId').optional().isInt({ gt: 0 }).withMessage('City ID must be a positive integer').toInt(),
];
const validateBulkAdd = [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.type').isIn(['restaurant', 'dish']).withMessage('Invalid item type in bulk add'),
    body('items.*.name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 255 }).escape(),
];

// --- Lookup Routes ---
router.get('/lookup/cities', async (req, res, next) => {
    try {
        // Using NeighborhoodModel as it already has the helper
        const cities = await NeighborhoodModel.getAllCitiesSimple();
        console.log(`[Admin GET /lookup/cities] Fetched cities:`, cities.length);
        res.json({ data: cities });
    } catch (error) {
        console.error('[Admin GET /lookup/cities] Error fetching cities:', error);
        next(error);
    }
});

// --- Generic GET /:type Route ---
router.get(
    "/:type",
    validateTypeParam,
    attachResourceInfo,
    validateSortQuery,
    validateGetListQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const currentDb = req.app?.get('db') || db;
        const tableName = req.tableName;
        const resourceType = req.resourceType;
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT;
        const sort = req.query.sort;
        const search = req.query.search;
        const status = req.query.status;
        const listType = req.query.list_type;
        const hashtagCategory = req.query.hashtag_category;
        const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
        const offset = (page - 1) * limit;

        let sortColumn = 'created_at';
        let sortDirection = 'DESC';
        // Default sorts based on resource type
        if (['users', 'hashtags', 'neighborhoods', 'restaurants', 'dishes', 'lists'].includes(resourceType)) {
            sortColumn = 'name';
            sortDirection = 'ASC';
        }
         if (resourceType === 'users') sortColumn = 'id'; // Special case for users?

        // Apply user-defined sort if valid
        if (sort) {
             // ... (sorting validation logic - needs adjustment, see notes below) ...
             const parts = String(sort).split('_'); // Ensure string conversion
             const dir = parts.pop()?.toLowerCase();
             const col = parts.join('_');
             const allowedSortColumns = {
                restaurants: ['id', 'name', 'city_name', 'neighborhood_name', 'adds', 'created_at', 'updated_at'],
                dishes: ['id', 'name', 'restaurant_name', 'adds', 'created_at', 'updated_at'],
                lists: ['id', 'name', 'list_type', 'saved_count', 'item_count', 'is_public', 'creator_handle', 'city_name', 'created_at', 'updated_at'],
                hashtags: ['id', 'name', 'category', 'created_at', 'updated_at'],
                users: ['id', 'username', 'email', 'account_type', 'created_at', 'updated_at'],
                neighborhoods: ['id', 'name', 'city_name', 'created_at', 'updated_at'],
                submissions: ['id', 'type', 'name', 'status', 'created_at', 'updated_at']
             };
            if (col && /^[a-zA-Z0-9_.]+$/.test(col) && ['asc', 'desc'].includes(dir || '') && allowedSortColumns[resourceType]?.includes(col)) {
                sortColumn = col;
                sortDirection = dir.toUpperCase();
            } else {
                console.warn(`[Admin GET /${resourceType}] Invalid sort parameter ignored: ${sort}`);
            }
        }

        let selectFields = `${tableName}.*`;
        let joins = '';
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Add joins based on type
        if (resourceType === 'dishes') {
            selectFields += ', r.name as restaurant_name';
            joins += ' LEFT JOIN restaurants r ON dishes.restaurant_id = r.id';
        } else if (resourceType === 'submissions') {
            selectFields += ', u.username as user_handle';
            joins += ' LEFT JOIN users u ON submissions.user_id = u.id';
        } else if (resourceType === 'lists') {
            selectFields += ', u.username as creator_handle';
            joins += ' LEFT JOIN users u ON lists.user_id = u.id';
            selectFields += ', COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = lists.id), 0)::int as item_count';
        } else if (resourceType === 'neighborhoods') {
            selectFields += ', c.name as city_name';
            joins += ' LEFT JOIN cities c ON neighborhoods.city_id = c.id';
        } else if (resourceType === 'restaurants') {
            selectFields += ', n.name as neighborhood_name';
            joins += ' LEFT JOIN neighborhoods n ON restaurants.neighborhood_id = n.id';
             selectFields += ', c.name as city_name'; // Also join city name for restaurants
             joins += ' LEFT JOIN cities c ON restaurants.city_id = c.id';
        }

        // Add search conditions
        if (search) {
             // ... (search column logic remains similar) ...
             const searchPattern = `%${search}%`;
             let searchColumns = [];
             switch (resourceType) {
                case 'users': searchColumns = ['users.username', 'users.email']; break;
                case 'restaurants': searchColumns = ['restaurants.name', 'restaurants.address', 'restaurants.city_name', 'n.name']; break; // Use alias n
                case 'dishes': searchColumns = ['dishes.name', 'r.name']; break; // Use alias r
                case 'lists': searchColumns = ['lists.name', 'lists.description', 'u.username']; break; // Use alias u
                case 'hashtags': searchColumns = ['hashtags.name', 'hashtags.category']; break;
                case 'neighborhoods': searchColumns = ['neighborhoods.name', 'c.name']; break; // Use alias c
                case 'submissions': searchColumns = ['submissions.name', 'submissions.city', 'submissions.neighborhood', 'submissions.location']; break;
                default: searchColumns = [`${tableName}.name`];
             }
             if (searchColumns.length > 0) {
                 whereConditions.push(`(${searchColumns.map(col => `${col} ILIKE $${paramIndex++}`).join(' OR ')})`);
                 searchColumns.forEach(() => queryParams.push(searchPattern));
             }
        }

        // Add specific filters
        if (resourceType === 'submissions' && status) {
            whereConditions.push(`submissions.status = $${paramIndex++}`);
            queryParams.push(status);
        }
        if (resourceType === 'lists' && listType && listType !== 'all') {
            whereConditions.push(`lists.list_type = $${paramIndex++}`);
            queryParams.push(listType);
        }
        if (resourceType === 'hashtags' && hashtagCategory && hashtagCategory !== 'all') {
            whereConditions.push(`hashtags.category ILIKE $${paramIndex++}`);
            queryParams.push(hashtagCategory);
        }
        if (resourceType === 'neighborhoods' && cityId) {
            whereConditions.push(`neighborhoods.city_id = $${paramIndex++}`);
            queryParams.push(cityId);
        }
         if (resourceType === 'restaurants' && cityId) { // Filter restaurants by city
             whereConditions.push(`restaurants.city_id = $${paramIndex++}`);
             queryParams.push(cityId);
         }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        let safeSortColumn;
        // Refine sort column handling
         const columnMapping = { // Map frontend/logical names to actual DB columns/aliases
            dishes: { restaurant_name: 'r.name' },
            submissions: { user_handle: 'u.username' },
            lists: { creator_handle: 'u.username', item_count: 'item_count' },
            neighborhoods: { city_name: 'c.name' },
            restaurants: { neighborhood_name: 'n.name', city_name: 'c.name' } // Added city_name mapping
         };
         if (columnMapping[resourceType]?.[sortColumn]) {
             safeSortColumn = columnMapping[resourceType][sortColumn];
         } else if (sortColumn === 'item_count' && resourceType === 'lists') {
             safeSortColumn = 'item_count'; // It's a calculated field
         } else if (sortColumn.includes('.')) {
              safeSortColumn = sortColumn; // Already qualified (e.g., users.email)
         } else {
             // Assume it's a column on the main table if not mapped
             safeSortColumn = `"${tableName}"."${sortColumn}"`;
         }
        const orderByClause = `ORDER BY ${safeSortColumn} ${sortDirection} NULLS LAST`;
        const limitOffsetClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        const dataQuery = `SELECT ${selectFields} FROM ${tableName} ${joins} ${whereClause} ${orderByClause} ${limitOffsetClause}`;
        const countQuery = `SELECT COUNT(${tableName}.id) FROM ${tableName} ${joins} ${whereClause}`;
        const countParams = queryParams.slice(0, paramIndex - 3);
        const dataParams = [...queryParams, limit, offset];

        try {
            const [dataResult, countResult] = await Promise.all([
                currentDb.query(dataQuery, dataParams),
                currentDb.query(countQuery, countParams)
            ]);
            const totalItems = parseInt(countResult.rows[0]?.count || '0', 10);
            const totalPages = Math.ceil(totalItems / limit);
            const rows = dataResult.rows || [];
            res.json({
                data: rows,
                pagination: { total: totalItems, page, limit, totalPages }
            });
        } catch (err) {
            console.error(`[Admin GET /${resourceType}] Error executing query:`, err);
            res.status(500).json({ message: 'Failed to retrieve data. ' + (process.env.NODE_ENV === 'development' ? err.message : 'Internal server error') });
            next(err);
        }
    }
);

// --- Generic POST /:type Route ---
router.post(
    '/:type',
    validateTypeParam,
    attachResourceInfo,
    async (req, res, next) => {
        const resourceType = req.resourceType;
        if (!resourceType || !ALLOWED_CREATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ message: `Creation not allowed for resource type: ${resourceType}` });
        }
        const schemaDefinition = getCreateValidationSchema(resourceType);
        const validationMiddlewares = checkSchema(schemaDefinition);
        try {
            await Promise.all(validationMiddlewares.map(middleware =>
                new Promise((resolve, reject) => {
                    middleware(req, res, (err) => {
                        if (err) reject(err); else resolve();
                    });
                })
            ));
            next();
        } catch (middlewareError) {
            console.error(`[Admin POST /${resourceType} Validation Middleware Runner Error]`, middlewareError);
            next(middlewareError);
        }
    },
    handleValidationErrors,
    async (req, res, next) => {
        const { type } = req.params;
        const resourceType = req.resourceType;
        const createData = req.body;
        const userId = req.user.id;
        const userHandle = req.user.username;

        console.log(`[Admin POST /${type}] User ${userId} creating resource. Data:`, createData);

        try {
            const newRecord = await AdminModel.createResource(resourceType, createData, userId, userHandle);
            if (!newRecord) {
                console.warn(`[Admin POST /${type}] Create operation returned null. Possible conflict or invalid data not caught by validation.`);
                return res.status(409).json({ message: `Failed to create ${type.slice(0, -1)}. It might conflict with an existing entry.` });
            }
            console.log(`[Admin POST /${type}] Create successful. ID: ${newRecord.id}`);
            res.status(201).json({ data: newRecord });
        } catch (err) {
            console.error(`[Admin POST /${type}] Model Error:`, err);
             if (err.code === '23505') {
                 return res.status(409).json({ message: `Create failed: Value conflicts with an existing record (e.g., duplicate name/email/username).` });
             }
              if (err.code === '23503') {
                 return res.status(400).json({ message: `Create failed: Invalid reference provided (e.g., non-existent City ID or Restaurant ID). Details: ${err.message}` });
             }
              if (err.message?.includes("required")) {
                  return res.status(400).json({ message: err.message });
              }
            next(err);
        }
    }
);

// --- Generic PUT /:type/:id Route ---
router.put(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    attachResourceInfo,
    async (req, res, next) => {
        const resourceType = req.resourceType;
        if (!resourceType || !ALLOWED_UPDATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ message: `Updates not allowed for resource type: ${resourceType}` });
        }
        const schemaDefinition = getUpdateValidationSchema(resourceType);
        const validationMiddlewares = checkSchema(schemaDefinition);
        try {
            await Promise.all(validationMiddlewares.map(middleware =>
                new Promise((resolve, reject) => {
                    middleware(req, res, (err) => { if (err) reject(err); else resolve(); });
                })
            ));
            next();
        } catch (middlewareError) {
            next(middlewareError);
        }
    },
    handleValidationErrors,
    async (req, res, next) => {
        const { type, id } = req.params;
        const resourceType = req.resourceType;
        const numericId = parseInt(id, 10);
        const updateData = req.body;
        const userId = req.user.id;

        const schemaDefinition = getUpdateValidationSchema(resourceType);
        const allowedKeys = Object.keys(schemaDefinition);
        const filteredUpdateData = Object.keys(updateData)
            .filter(key => allowedKeys.includes(key))
            .reduce((obj, key) => {
                 if (resourceType === 'users' && key === 'is_superadmin') { // Handle boolean conversion specifically
                      obj.account_type = updateData[key] === true ? 'superuser' : 'user'; // Assuming mapping like this
                 } else if (resourceType === 'neighborhoods' && key === 'zipcode_ranges') {
                     obj[key] = updateData[key]; // Keep original for model to handle parsing
                 }
                 else if (resourceType === 'restaurants' && key === 'neighborhood_id' && updateData[key] === '') {
                      obj[key] = null; // Allow clearing neighborhood
                 }
                 else {
                     obj[key] = updateData[key];
                 }
                 return obj;
            }, {});

        if (Object.keys(filteredUpdateData).length === 0) {
            return res.status(400).json({ message: 'No valid or changeable fields provided for update.' });
        }

        console.log(`[Admin PUT /${type}/${numericId}] User ${userId} updating resource. Filtered Data:`, filteredUpdateData);

        try {
             if (resourceType === 'users' && numericId === userId && filteredUpdateData.account_type !== 'superuser') {
                  return res.status(403).json({ message: "Action forbidden: Cannot remove your own superadmin status." });
             }

            const updatedRecord = await AdminModel.updateResource(resourceType, numericId, filteredUpdateData, userId);

            if (!updatedRecord) {
                const checkExistsQuery = `SELECT id FROM ${req.tableName} WHERE id = $1`;
                const checkExistsResult = await db.query(checkExistsQuery, [numericId]);

                if (checkExistsResult.rowCount === 0) {
                    console.warn(`[Admin PUT /${type}/${numericId}] Resource not found.`);
                    return res.status(404).json({ message: `${resourceType.slice(0, -1)} with ID ${numericId} not found.` });
                } else {
                     console.warn(`[Admin PUT /${type}/${numericId}] Update returned null/no rows affected. Data might be identical or another issue occurred.`);
                     const currentRecordResult = await db.query(`SELECT * FROM ${req.tableName} WHERE id = $1`, [numericId]);
                    return res.status(200).json({ data: currentRecordResult.rows[0], message: 'Update successful, but no changes were applied (data might be identical).' });
                }
            }

            console.log(`[Admin PUT /${type}/${numericId}] Update successful.`);
            res.json({ data: updatedRecord });
        } catch (err) {
            console.error(`[Admin PUT /${type}/${numericId}] Model Error:`, err);
            if (err.code === '23505') {
                let conflictField = 'value';
                 if (err.message.includes('email')) conflictField = 'email';
                 if (err.message.includes('username')) conflictField = 'username';
                 if (err.message.includes('neighborhoods_name_city_id_key')) conflictField = 'name for this city';
                 if (err.message.includes('restaurants_name_city_id_key')) conflictField = 'name for this city';
                return res.status(409).json({ message: `Update failed: The provided ${conflictField} conflicts with an existing record.` });
            }
             if (err.code === '23503') {
                 return res.status(400).json({ message: `Update failed: Invalid reference provided (e.g., non-existent City ID or Restaurant ID). Details: ${err.message}` });
             }
             if (err.message?.includes("required") || err.message?.includes("Invalid") || err.message?.includes("cannot be empty")) {
                  return res.status(400).json({ message: err.message });
             }
            next(err);
        }
    }
);

// --- Specific Submission Approval/Rejection Routes ---
router.post(
    '/submissions/:id/approve',
    validateIdParam,
    handleValidationErrors,
    async (req, res, next) => {
        const submissionId = req.params.id;
        const reviewerId = req.user?.id;
        if (!reviewerId) return res.status(401).json({ message: 'Authentication error: Reviewer ID missing.' });

        try {
            const updatedSubmission = await AdminModel.updateSubmissionStatus(submissionId, 'approved', reviewerId);
            if (!updatedSubmission) {
                const currentSubmission = await SubmissionModel.findSubmissionById(submissionId);
                 if (!currentSubmission) return res.status(404).json({ message: 'Submission not found.' });
                 return res.status(409).json({ message: `Submission is already ${currentSubmission.status} or cannot be approved.` });
            }
            res.json({ data: updatedSubmission });
        } catch (err) {
            console.error(`[Admin Approve /submissions/${submissionId}] Error:`, err);
             if (err.message?.includes('dish_already_exists')) {
                 return res.status(409).json({ message: 'Approval failed: A dish with this name already exists for the associated restaurant.' });
             }
            next(err);
        }
    }
);

router.post(
    '/submissions/:id/reject',
    validateIdParam,
    handleValidationErrors,
    async (req, res, next) => {
        const submissionId = req.params.id;
        const reviewerId = req.user?.id;
        if (!reviewerId) return res.status(401).json({ message: 'Authentication error: Reviewer ID missing.' });

        try {
            const updatedSubmission = await AdminModel.updateSubmissionStatus(submissionId, 'rejected', reviewerId);
             if (!updatedSubmission) {
                 const currentSubmission = await SubmissionModel.findSubmissionById(submissionId);
                 if (!currentSubmission) return res.status(404).json({ message: 'Submission not found.' });
                 return res.status(409).json({ message: `Submission is already ${currentSubmission.status} or cannot be rejected.` });
            }
            res.json({ data: updatedSubmission });
        } catch (err) {
            console.error(`[Admin Reject /submissions/${submissionId}] Error:`, err);
            next(err);
        }
    }
);

// --- Generic DELETE /:type/:id Route ---
router.delete(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    attachResourceInfo,
    handleValidationErrors,
    async (req, res, next) => {
        const { type, id } = req.params;
        const tableName = req.tableName;
        const resourceType = req.resourceType;
        const numericId = parseInt(id, 10);

        if (!ALLOWED_MUTATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ message: `Deletions not allowed for resource type: ${resourceType}` });
        }

         if (resourceType === 'users' && numericId === req.user?.id) {
             return res.status(403).json({ message: "Action forbidden: Cannot delete your own user account via this route." });
         }

        try {
            const deleted = await AdminModel.deleteResourceById(tableName, numericId);
            if (!deleted) {
                 console.warn(`[Admin DELETE /${type}/${id}] Resource not found for deletion.`);
                 return res.status(404).json({ message: `${resourceType.slice(0, -1)} with ID ${numericId} not found.` });
            }
             console.log(`[Admin DELETE /${type}/${id}] Deletion successful.`);
            res.status(204).send();
        } catch (err) {
            console.error(`[Admin DELETE /${type}/${id}] Error:`, err);
            if (err.code === '23503') { // Use err.code
                return res.status(409).json({ message: `Cannot delete ${resourceType.slice(0, -1)}: It is referenced by other items in the database.` });
            }
            next(err);
        }
    }
);

// --- Bulk Add Route ---
router.post(
    '/bulk-add',
    validateBulkAdd,
    handleValidationErrors,
    async (req, res, next) => {
        const { items } = req.body;
        try {
            const results = await AdminModel.bulkAddItems(items);
            res.status(200).json(results);
        } catch (err) {
            console.error(`[Admin POST /bulk-add] Error:`, err);
            next(err);
        }
    }
);

export default router;