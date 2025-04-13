/* src/doof-backend/routes/admin.ts */
import express, { Request, Response, NextFunction } from 'express';
import { param, query, body, validationResult, ValidationChain, checkSchema, Schema } from 'express-validator';
import bcrypt from 'bcryptjs';

import * as AdminModel from '../models/adminModel.js';
import * as SubmissionModel from '../models/submissionModel.js';
import * as RestaurantModel from '../models/restaurantModel.js';
import * as DishModel from '../models/dishModel.js';
import * as ListModel from '../models/listModel.js';
import * as UserModel from '../models/userModel.js';
import * as HashtagModel from '../models/hashtagModel.js';
import * as FilterModel from '../models/filterModel.js';
// ** ADDED: Import Neighborhood Model **
import * as NeighborhoodModel from '../models/neighborhoodModel.js';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// ** ADDED: Import types **
import type { Restaurant } from '../../types/Restaurant.js';
import type { Submission } from '../../types/Submission.js';
import type { User } from '../../types/User.js';

// Import formatters if needed for GET responses (though often GET just returns DB data)
// import { formatRestaurantForResponse } from '../models/restaurantModel.js';
// import { formatDishForResponse } from '../models/dishModel.js';
// import { formatListForResponse } from '../models/listModel.js';
// import { formatHashtag } from '../models/hashtagModel.js';
// import { formatUser } from '../models/userModel.js';
// import { formatNeighborhood } from '../models/neighborhoodModel.js'; // Requires creation

type MutatePayload = Partial<RestaurantModel.Restaurant>
                   | Partial<DishModel.Dish>
                   | Partial<ListModel.List>
                   | Partial<HashtagModel.Hashtag>
                   // Use local Neighborhood type from model
                   | Partial<NeighborhoodModel.Neighborhood>
                   | Partial<Omit<UserModel.User, 'password_hash'>>;

const router = express.Router();

// Add 'neighborhoods' to allowed types
const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_UPDATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_CREATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];

const DEFAULT_PAGE_LIMIT = 25;
const typeToTable: Record<string, string> = {
    submissions: 'submissions', restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users', neighborhoods: 'neighborhoods'
};

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Admin Route Validation Error] Path: ${req.path}`, errors.array());
        // Return only the first error message for simplicity
        res.status(400).json({ message: errors.array({ onlyFirstError: true })[0].msg });
        return;
    }
    next();
};

interface RequestWithResourceInfo extends AuthenticatedRequest {
    resourceType?: string;
    tableName?: string;
}

// Middleware to attach resource type and table name based on URL param
const attachResourceInfo = (req: Request, res: Response, next: NextFunction) => {
    const reqWithInfo = req as RequestWithResourceInfo;
    const typeParam = reqWithInfo.params.type;
    if (!typeParam || !ALLOWED_TYPES.includes(typeParam)) {
        return res.status(400).json({ message: 'Invalid or missing resource type specified.' });
    }
    reqWithInfo.resourceType = typeParam;
    reqWithInfo.tableName = typeToTable[typeParam];
    if (!reqWithInfo.tableName) {
         // Should not happen if ALLOWED_TYPES is correct
        console.error(`[Admin attachResourceInfo] Internal error: Invalid resource type mapping for '${typeParam}'.`);
        return res.status(500).json({ message: 'Internal server error: Resource type mapping failed.' });
    }
    next();
};

// Apply authentication and superuser check to all routes in this file
router.use(authMiddleware);
router.use(requireSuperuser);

// --- Validation Schemas ---
// (Keep existing getUpdateValidationSchema and getCreateValidationSchema functions)
// Make sure 'neighborhoods' case exists in both schemas as provided in the fetched context

const getUpdateValidationSchema = (type: string): Schema => {
    switch (type) {
        case 'restaurants':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                // Include other editable fields for restaurants
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
                // Avoid allowing city_name/neighborhood_name updates directly, use IDs
                // city_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                // neighborhood_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                // tags: { optional: true, isString: true, trim: true }, // Tag handling might be separate
            };
        case 'dishes': // Keep existing cases...
             return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                // tags: { optional: true, isString: true, trim: true }, // Separate tag handling?
                restaurant_id: { optional: true, isInt: { options: { gt: 0 } }, toInt: true },
            };
        case 'lists': // Keep existing cases...
             return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                description: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 1000 } }, escape: true },
                list_type: { optional: true, isIn: { options: [['mixed', 'restaurant', 'dish']] } },
                is_public: { optional: true, isBoolean: true, toBoolean: true },
                // tags: { optional: true, isString: true, trim: true },
                city_name: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
            };
        case 'hashtags': // Keep existing cases...
             return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 100 } }, escape: true },
                category: { optional: true, isString: true, trim: true, isLength: { options: { max: 50 } }, escape: true },
            };
        case 'users': // Keep existing cases...
            return {
                username: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { min: 3, max: 50 } }, escape: true },
                email: { optional: true, isEmail: true, normalizeEmail: true },
                account_type: { optional: true, isIn: { options: [['user', 'contributor', 'superuser']] } },
                is_superadmin: { optional: true, isBoolean: true, toBoolean: true }, // Add superadmin toggle
            };
        case 'neighborhoods': // Ensure this matches fetched context
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 100 } }, escape: true, errorMessage: 'Neighborhood name cannot be empty if provided.' },
                city_id: { optional: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'A valid City ID must be provided if changing the city.' },
                zip_codes: { // Add validation for zip_codes (accepts string or array)
                    optional: { options: { nullable: true } }, // Allow clearing
                    custom: {
                        options: (value) => {
                             if (value === null || value === undefined || value === '') return true; // Allow empty/null
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

const getCreateValidationSchema = (type: string): Schema => {
    switch (type) {
        case 'restaurants': // Keep existing cases...
             return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Restaurant name is required', isLength: { options: { max: 255 } }, escape: true },
                address: { optional: true, isString: true, trim: true, isLength: { options: { max: 500 } }, escape: true },
                zipcode: { optional: true, isString: true, trim: true, matches: { options: /^\d{5}$/ }, errorMessage: 'Zipcode must be 5 digits' },
                city_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'City ID must be a positive integer' },
                neighborhood_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'Neighborhood ID must be a positive integer' },
                // Add other fields needed for creation if applicable
            };
        case 'dishes': // Keep existing cases...
             return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Dish name is required', isLength: { options: { max: 255 } }, escape: true },
                restaurant_id: { notEmpty: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'Restaurant ID is required and must be a positive integer' },
                // tags: { optional: true, isArray: true, errorMessage: 'Tags must be an array' },
                // 'tags.*': { isString: true, trim: true, escape: true },
            };
        case 'lists': // Keep existing cases...
            return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'List name is required', isLength: { options: { max: 255 } }, escape: true },
                description: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 1000 } }, escape: true },
                list_type: { optional: true, isIn: { options: [['mixed', 'restaurant', 'dish']] } },
                is_public: { optional: true, isBoolean: true, toBoolean: true },
                // tags: { optional: true, isArray: true, errorMessage: 'Tags must be an array' },
                // 'tags.*': { isString: true, trim: true, escape: true },
                city_name: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
            };
        case 'hashtags': // Keep existing cases...
             return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Hashtag name is required', isLength: { options: { max: 100 } }, escape: true },
                category: { optional: true, isString: true, trim: true, isLength: { options: { max: 50 } }, escape: true },
            };
        case 'users': // Keep existing cases...
            return {
                username: { isString: true, trim: true, notEmpty: true, isLength: { options: { min: 3, max: 50 } }, errorMessage: 'Username must be 3-50 characters', escape: true },
                email: { isEmail: true, errorMessage: 'Valid email is required', normalizeEmail: true },
                account_type: { optional: true, isIn: { options: [['user', 'contributor', 'superuser']] } },
                password: { notEmpty: true, isLength: { options: { min: 6 } }, errorMessage: 'Password must be at least 6 characters' },
                 is_superadmin: { optional: true, isBoolean: true, toBoolean: true }, // Allow setting on create
            };
        case 'neighborhoods': // Ensure this matches fetched context
             return {
                name: { isString: true, trim: true, notEmpty: true, isLength: { options: { max: 100 } }, escape: true, errorMessage: 'Neighborhood name is required.' },
                city_id: { notEmpty: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'A valid City ID is required.' },
                 zip_codes: { // Add validation for zip_codes on create
                     optional: { options: { nullable: true } },
                     custom: { // Same custom validation as update
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
const validateGetListQuery: ValidationChain[] = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    query('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search term too long or invalid characters'),
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status filter'),
    query('list_type').optional().isIn(['mixed', 'restaurant', 'dish']).withMessage('Invalid list type filter'),
    query('hashtag_category').optional().isString().trim().escape().isLength({ max: 50 }).withMessage('Invalid hashtag category'),
    query('cityId').optional().isInt({ gt: 0 }).withMessage('City ID must be a positive integer').toInt(),
];
const validateBulkAdd: ValidationChain[] = [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.type').isIn(['restaurant', 'dish']).withMessage('Invalid item type in bulk add'),
    body('items.*.name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 255 }).escape(),
];

// --- Lookup Routes ---
router.get('/lookup/cities', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Use the model function directly if it exists
        const cities = await NeighborhoodModel.getAllCitiesSimple(); // Assuming this exists
        console.log(`[Admin GET /lookup/cities] Fetched cities:`, cities);
        res.json({ data: cities }); // Return nested under 'data' for consistency
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
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => {
        const currentDb = req.app?.get('db') || db; // Use app-specific DB if available
        const tableName = req.tableName!;
        const resourceType = req.resourceType!;
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT;
        const sort = req.query.sort as string | undefined;
        const search = req.query.search as string | undefined;
        const status = req.query.status as Submission['status'] | undefined; // Use imported type
        const listType = req.query.list_type as ListModel.List['list_type'] | undefined; // Use imported type
        const hashtagCategory = req.query.hashtag_category as string | undefined;
        const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
        const offset = (page - 1) * limit;

        // Default sort values
        let sortColumn = 'created_at';
        let sortDirection = 'DESC';
        // Type-specific defaults
        if (resourceType === 'users') { sortColumn = 'id'; sortDirection = 'ASC'; }
        if (resourceType === 'hashtags' || resourceType === 'neighborhoods') { sortColumn = 'name'; sortDirection = 'ASC'; }
        if (resourceType === 'restaurants') { sortColumn = 'name'; sortDirection = 'ASC'; }
        if (resourceType === 'dishes') { sortColumn = 'name'; sortDirection = 'ASC'; }
        if (resourceType === 'lists') { sortColumn = 'name'; sortDirection = 'ASC'; }


        // Parse sort parameter
        if (sort) {
            const parts = sort.split('_');
            const dir = parts.pop()?.toLowerCase();
            const col = parts.join('_');
            // Allowed sort columns per type
            const allowedSortColumns: { [key: string]: string[] } = {
                restaurants: ['id', 'name', 'city_name', 'neighborhood_name', 'adds', 'created_at', 'updated_at'],
                dishes: ['id', 'name', 'restaurant_name', 'adds', 'created_at', 'updated_at'],
                lists: ['id', 'name', 'list_type', 'saved_count', 'item_count', 'is_public', 'creator_handle', 'city_name', 'created_at', 'updated_at'],
                hashtags: ['id', 'name', 'category', 'created_at', 'updated_at'],
                users: ['id', 'username', 'email', 'account_type', 'is_superadmin', 'created_at', 'updated_at'],
                neighborhoods: ['id', 'name', 'city_name', 'created_at', 'updated_at'],
                submissions: ['id', 'type', 'name', 'status', 'created_at', 'updated_at']
            };
            if (col && /^[a-zA-Z0-9_.]+$/.test(col) && ['asc', 'desc'].includes(dir || '') && allowedSortColumns[resourceType]?.includes(col)) {
                sortColumn = col;
                sortDirection = dir!.toUpperCase();
            } else {
                console.warn(`[Admin GET /${resourceType}] Invalid sort parameter ignored: ${sort}`);
            }
        }

        // Base query construction
        let selectFields = `${tableName}.*`;
        let joins = '';
        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1; // Parameter index counter

        // Add specific joins and select fields based on type
        if (resourceType === 'dishes') {
            selectFields += ', r.name as restaurant_name';
            joins += ' LEFT JOIN restaurants r ON dishes.restaurant_id = r.id';
        } else if (resourceType === 'submissions') {
            selectFields += ', u.username as user_handle'; // Assuming user_handle is username
            joins += ' LEFT JOIN users u ON submissions.user_id = u.id';
        } else if (resourceType === 'lists') {
            selectFields += ', u.username as creator_handle';
            joins += ' LEFT JOIN users u ON lists.user_id = u.id';
            selectFields += ', COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = lists.id), 0)::int as item_count';
        } else if (resourceType === 'neighborhoods') {
            selectFields += ', c.name as city_name';
            joins += ' LEFT JOIN cities c ON neighborhoods.city_id = c.id';
        } else if (resourceType === 'restaurants') {
            // Join neighborhood to get name for display/filtering if needed
            selectFields += ', n.name as neighborhood_name';
            joins += ' LEFT JOIN neighborhoods n ON restaurants.neighborhood_id = n.id';
             // Optionally join city if needed
             // selectFields += ', c.name as city_name_from_join'; // avoid conflict with restaurants.city_name
             // joins += ' LEFT JOIN cities c ON restaurants.city_id = c.id';
        }


        // Add search conditions
        if (search) {
            const searchPattern = `%${search}%`;
            let searchColumns: string[] = [];
            switch (resourceType) {
                case 'users': searchColumns = ['users.username', 'users.email']; break;
                case 'restaurants': searchColumns = ['restaurants.name', 'restaurants.address', 'restaurants.city_name', 'n.name']; break; // Search joined neighborhood name too
                case 'dishes': searchColumns = ['dishes.name', 'r.name']; break;
                case 'lists': searchColumns = ['lists.name', 'lists.description', 'u.username']; break;
                case 'hashtags': searchColumns = ['hashtags.name', 'hashtags.category']; break;
                case 'neighborhoods': searchColumns = ['neighborhoods.name', 'c.name']; break;
                case 'submissions': searchColumns = ['submissions.name', 'submissions.city', 'submissions.neighborhood', 'submissions.location']; break;
                default: searchColumns = [`${tableName}.name`]; // Default to name column
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
            whereConditions.push(`hashtags.category ILIKE $${paramIndex++}`); // Use ILIKE for flexibility
            queryParams.push(hashtagCategory);
        }
        if ((resourceType === 'neighborhoods' || resourceType === 'restaurants') && cityId) { // Filter restaurants by city too
             const cityColumn = resourceType === 'neighborhoods' ? 'neighborhoods.city_id' : 'restaurants.city_id';
            whereConditions.push(`${cityColumn} = $${paramIndex++}`);
            queryParams.push(cityId);
        }

        // Construct final query parts
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Handle sorting on aliased or joined columns correctly
        let safeSortColumn: string;
        const columnMapping: Record<string, Record<string, string>> = {
            dishes: { restaurant_name: 'r.name' },
            submissions: { user_handle: 'u.username' },
            lists: { creator_handle: 'u.username', item_count: 'item_count' /* special case */ },
            neighborhoods: { city_name: 'c.name' },
            restaurants: { neighborhood_name: 'n.name' } // Map to joined neighborhood name
        };

        if (columnMapping[resourceType]?.[sortColumn]) {
            safeSortColumn = columnMapping[resourceType][sortColumn];
        } else if (sortColumn === 'item_count' && resourceType === 'lists') {
            safeSortColumn = 'item_count'; // Already calculated, sort directly
        } else if (sortColumn.includes('.')) {
            // Assume qualified column names are safe if they passed the initial check
             safeSortColumn = sortColumn;
        } else {
            // Default to table-qualified column name
            safeSortColumn = `"${tableName}"."${sortColumn}"`;
        }

        const orderByClause = `ORDER BY ${safeSortColumn} ${sortDirection} NULLS LAST`;
        const limitOffsetClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

        // Final queries
        const dataQuery = `SELECT ${selectFields} FROM ${tableName} ${joins} ${whereClause} ${orderByClause} ${limitOffsetClause}`;
        // Count query needs to match joins and where clause, but not ordering/limiting/selecting extra fields
        const countQuery = `SELECT COUNT(${tableName}.id) FROM ${tableName} ${joins} ${whereClause}`;

        // Parameters for count query (only those used in WHERE)
        const countParams = queryParams.slice(0, paramIndex - 3); // Exclude limit and offset params
        // Parameters for data query (all params)
        const dataParams = [...queryParams, limit, offset];


        try {
            // console.log(`[Admin GET /${resourceType}] Data Query:`, dataQuery.replace(/\s+/g, ' '));
            // console.log(`[Admin GET /${resourceType}] Data Params:`, dataParams);
            // console.log(`[Admin GET /${resourceType}] Count Query:`, countQuery.replace(/\s+/g, ' '));
            // console.log(`[Admin GET /${resourceType}] Count Params:`, countParams);

            // Execute queries in parallel
            const [dataResult, countResult] = await Promise.all([
                currentDb.query(dataQuery, dataParams),
                currentDb.query(countQuery, countParams)
            ]);

            const totalItems = parseInt(countResult.rows[0]?.count || '0', 10);
            const totalPages = Math.ceil(totalItems / limit);
            const rows = dataResult.rows || [];

            // console.log(`[Admin GET /${resourceType}] Rows fetched:`, rows.length, 'Total items:', totalItems);

             // Formatting (optional, could be done in model or frontend)
             // let formattedRows = rows;
             // if (resourceType === 'users') formattedRows = rows.map(formatUser);
             // if (resourceType === 'restaurants') formattedRows = rows.map(r => formatRestaurantForResponse(r));
             // ...etc


            res.json({
                data: rows, // Return raw rows for now, frontend can format
                pagination: { total: totalItems, page, limit, totalPages }
            });
        } catch (err: any) {
            console.error(`[Admin GET /${resourceType}] Error executing query:`, err);
            // Avoid sending detailed SQL errors to client in production
            res.status(500).json({ message: 'Failed to retrieve data. ' + (process.env.NODE_ENV === 'development' ? err.message : 'Internal server error') });
            next(err); // Pass to global error handler if needed
        }
    }
);


// --- Generic POST /:type Route ---
router.post(
    '/:type',
    validateTypeParam,
    attachResourceInfo,
    async (req: Request, res: Response, next: NextFunction) => { // Validation middleware runner
        const resourceType = (req as RequestWithResourceInfo).resourceType;
        if (!resourceType || !ALLOWED_CREATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ message: `Creation not allowed for resource type: ${resourceType}` });
        }
        const schemaDefinition = getCreateValidationSchema(resourceType);
        const validationMiddlewares = checkSchema(schemaDefinition);

        try {
            // Run all validation chains concurrently
            await Promise.all(validationMiddlewares.map(middleware =>
                new Promise<void>((resolve, reject) => {
                    middleware(req, res, (err) => {
                        if (err) reject(err); else resolve();
                    });
                })
            ));
            // If no errors were thrown, proceed to handleValidationErrors
            next();
        } catch (middlewareError) {
             // This catch block might not be necessary if errors are handled by the middleware itself
            console.error(`[Admin POST /${resourceType} Validation Middleware Runner Error]`, middlewareError);
            next(middlewareError); // Pass to global error handler
        }
    },
    handleValidationErrors, // Check results after running validators
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => { // Route handler
        const { type } = req.params;
        const resourceType = req.resourceType!;
        const createData = req.body;
        const userId = req.user!.id; // From authMiddleware
        const userHandle = req.user!.username; // From authMiddleware

        console.log(`[Admin POST /${type}] User ${userId} creating resource. Data:`, createData);

        try {
             // Special handling for user password hashing is done within createResource model
            const newRecord = await AdminModel.createResource(resourceType, createData, userId, userHandle);

            if (!newRecord) {
                // Model should throw specific errors (like unique constraint), null might mean non-creation for other reasons
                console.warn(`[Admin POST /${type}] Create operation returned null. Possible conflict or invalid data not caught by validation.`);
                 // Provide a more generic conflict message unless the model throws something more specific
                return res.status(409).json({ message: `Failed to create ${type.slice(0, -1)}. It might conflict with an existing entry.` });
            }

            console.log(`[Admin POST /${type}] Create successful. ID: ${newRecord.id}`);
            res.status(201).json({ data: newRecord }); // Send back created record nested in 'data'
        } catch (err: unknown) {
            console.error(`[Admin POST /${type}] Model Error:`, err);
            // Handle specific DB errors passed from the model
            if (err instanceof Error) {
                 if ((err as any).code === '23505') { // Unique constraint violation
                    return res.status(409).json({ message: `Create failed: Value conflicts with an existing record (e.g., duplicate name/email/username).` });
                }
                 if ((err as any).code === '23503') { // Foreign key violation
                    return res.status(400).json({ message: `Create failed: Invalid reference provided (e.g., non-existent City ID or Restaurant ID). Details: ${err.message}` });
                }
                 // Handle specific validation errors thrown by the model itself
                 if (err.message.includes("required")) {
                     return res.status(400).json({ message: err.message });
                 }
            }
            next(err); // Pass to global error handler for generic 500
        }
    }
);

// --- Generic PUT /:type/:id Route ---
router.put(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    attachResourceInfo,
    async (req: Request, res: Response, next: NextFunction) => { // Validation middleware runner
        const resourceType = (req as RequestWithResourceInfo).resourceType;
        if (!resourceType || !ALLOWED_UPDATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ message: `Updates not allowed for resource type: ${resourceType}` });
        }
        const schemaDefinition = getUpdateValidationSchema(resourceType);
        const validationMiddlewares = checkSchema(schemaDefinition);
        try {
            await Promise.all(validationMiddlewares.map(middleware =>
                new Promise<void>((resolve, reject) => {
                    middleware(req, res, (err) => { if (err) reject(err); else resolve(); });
                })
            ));
            next();
        } catch (middlewareError) {
            next(middlewareError);
        }
    },
    handleValidationErrors, // Check validation results
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => { // Route handler
        const { type, id } = req.params;
        const resourceType = req.resourceType!;
        const numericId = parseInt(id, 10); // Already validated by validateIdParam
        const updateData = req.body;
        const userId = req.user!.id; // For logging or potential ownership checks later

        // Filter req.body to only include keys defined in the validation schema for this type
         // This prevents unwanted fields from being passed to the model
         // NOTE: This relies on the validation schema accurately reflecting updatable fields.
        const schemaDefinition = getUpdateValidationSchema(resourceType);
        const allowedKeys = Object.keys(schemaDefinition);
        const filteredUpdateData = Object.keys(updateData)
            .filter(key => allowedKeys.includes(key))
            .reduce((obj: Record<string, any>, key) => {
                 // Special handling for boolean 'is_superadmin' in users update
                 if (resourceType === 'users' && key === 'is_superadmin') {
                     // Ensure it's explicitly true or false
                     if (typeof updateData[key] === 'boolean') {
                         obj[key] = updateData[key];
                     } else {
                         // Ignore invalid boolean values for this specific field
                         console.warn(`[Admin PUT /users/${numericId}] Ignoring invalid value for is_superadmin:`, updateData[key]);
                     }
                 } else if (resourceType === 'neighborhoods' && key === 'zip_codes') {
                     // Pass zip codes directly (model handles parsing/validation)
                     obj[key] = updateData[key];
                 }
                 // Convert empty string neighborhood_id to null for restaurants
                 else if (resourceType === 'restaurants' && key === 'neighborhood_id' && updateData[key] === '') {
                     obj[key] = null;
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
             // Handle specific logic like preventing self-demotion for users
             if (resourceType === 'users' && numericId === userId && filteredUpdateData.is_superadmin === false) {
                 return res.status(403).json({ message: "Action forbidden: Cannot remove your own superadmin status." });
             }

            const updatedRecord = await AdminModel.updateResource(resourceType, numericId, filteredUpdateData, userId);

            if (!updatedRecord) {
                 // Check if the resource actually exists to differentiate 404 from other update issues
                 // This requires a generic findById or type-specific check
                 // For simplicity, assume model returns null if not found or no changes applied
                const checkExistsQuery = `SELECT id FROM ${req.tableName!} WHERE id = $1`;
                const checkExistsResult = await db.query(checkExistsQuery, [numericId]);

                if (checkExistsResult.rowCount === 0) {
                    console.warn(`[Admin PUT /${type}/${numericId}] Resource not found.`);
                    return res.status(404).json({ message: `${resourceType.slice(0, -1)} with ID ${numericId} not found.` });
                } else {
                     // Record exists, but update didn't change anything or failed silently
                     console.warn(`[Admin PUT /${type}/${numericId}] Update returned null/no rows affected. Data might be identical or another issue occurred.`);
                     // Return the existing record to indicate the state hasn't changed unexpectedly
                     const currentRecordResult = await db.query(`SELECT * FROM ${req.tableName!} WHERE id = $1`, [numericId]);
                    return res.status(200).json({ data: currentRecordResult.rows[0], message: 'Update successful, but no changes were applied (data might be identical).' });
                }
            }

            console.log(`[Admin PUT /${type}/${numericId}] Update successful.`);
            res.json({ data: updatedRecord }); // Return updated record nested in 'data'
        } catch (err: unknown) {
            console.error(`[Admin PUT /${type}/${numericId}] Model Error:`, err);
             // Handle specific DB errors passed from the model
            if (err instanceof Error) {
                 if ((err as any).code === '23505') { // Unique constraint violation
                     // Attempt to identify the conflicting field if possible (depends on constraint name/details)
                     let conflictField = 'value';
                     if (err.message.includes('email')) conflictField = 'email';
                     if (err.message.includes('username')) conflictField = 'username';
                     if (err.message.includes('neighborhoods_name_city_id_key')) conflictField = 'name for this city';
                     if (err.message.includes('restaurants_name_city_id_key')) conflictField = 'name for this city'; // Assuming constraint name

                    return res.status(409).json({ message: `Update failed: The provided ${conflictField} conflicts with an existing record.` });
                }
                 if ((err as any).code === '23503') { // Foreign key violation
                     return res.status(400).json({ message: `Update failed: Invalid reference provided (e.g., non-existent City ID or Restaurant ID). Details: ${err.message}` });
                 }
                  // Handle specific validation errors thrown by the model itself
                 if (err.message.includes("required") || err.message.includes("Invalid") || err.message.includes("cannot be empty")) {
                     return res.status(400).json({ message: err.message });
                 }
            }
            next(err); // Pass to global error handler for generic 500
        }
    }
);


// --- Specific Submission Approval/Rejection Routes ---
// These remain specific as they involve status changes and potentially reviewer tracking

router.post(
    '/submissions/:id/approve',
    validateIdParam,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const submissionId = req.params.id as unknown as number; // Already validated
        const reviewerId = req.user?.id;
        if (!reviewerId) return res.status(401).json({ message: 'Authentication error: Reviewer ID missing.' });

        try {
            const updatedSubmission = await AdminModel.updateSubmissionStatus(submissionId, 'approved', reviewerId);
            if (!updatedSubmission) {
                 // Check if it exists and what its current status is
                const currentSubmission = await SubmissionModel.findSubmissionById(submissionId);
                 if (!currentSubmission) return res.status(404).json({ message: 'Submission not found.' });
                 return res.status(409).json({ message: `Submission is already ${currentSubmission.status} or cannot be approved.` });
            }
            res.json({ data: updatedSubmission });
        } catch (err: any) {
            console.error(`[Admin Approve /submissions/${submissionId}] Error:`, err);
             // Handle specific error from model (e.g., dish already exists)
             if (err instanceof Error && err.message.includes('dish_already_exists')) {
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
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const submissionId = req.params.id as unknown as number; // Already validated
        const reviewerId = req.user?.id;
        if (!reviewerId) return res.status(401).json({ message: 'Authentication error: Reviewer ID missing.' });

        try {
            const updatedSubmission = await AdminModel.updateSubmissionStatus(submissionId, 'rejected', reviewerId);
             if (!updatedSubmission) {
                 // Check if it exists and what its current status is
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
    handleValidationErrors, // Check validation before proceeding
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => {
        const { type, id } = req.params;
        const tableName = req.tableName!;
        const resourceType = req.resourceType!;
        const numericId = parseInt(id, 10); // Already validated

        // Double-check allowed types for deletion
        if (!ALLOWED_MUTATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ message: `Deletions not allowed for resource type: ${resourceType}` });
        }

        // Add safeguard: Prevent deleting own user account via this generic admin route
         if (resourceType === 'users' && numericId === req.user?.id) {
             return res.status(403).json({ message: "Action forbidden: Cannot delete your own user account via this route." });
         }

        try {
            const deleted = await AdminModel.deleteResourceById(tableName, numericId);
            if (!deleted) {
                 // Resource might have been deleted already or never existed
                 console.warn(`[Admin DELETE /${type}/${id}] Resource not found for deletion.`);
                 return res.status(404).json({ message: `${resourceType.slice(0, -1)} with ID ${numericId} not found.` });
            }
             console.log(`[Admin DELETE /${type}/${id}] Deletion successful.`);
            res.status(204).send(); // Standard success response for DELETE
        } catch (err: unknown) {
            console.error(`[Admin DELETE /${type}/${id}] Error:`, err);
            // Handle foreign key constraint errors specifically
            if (err instanceof Error && (err as any).code === '23503') {
                return res.status(409).json({ message: `Cannot delete ${resourceType.slice(0, -1)}: It is referenced by other items in the database.` });
            }
            next(err); // Pass other errors to global handler
        }
    }
);

// --- Bulk Add Route ---
router.post(
    '/bulk-add', // Keep specific route name
    validateBulkAdd,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const { items } = req.body;
        try {
            const results = await AdminModel.bulkAddItems(items);
            res.status(200).json(results); // Return detailed results object
        } catch (err) {
            console.error(`[Admin POST /bulk-add] Error:`, err);
            next(err);
        }
    }
);

export default router;