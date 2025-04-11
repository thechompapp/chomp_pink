/* src/doof-backend/routes/admin.ts */
import express, { Request, Response, NextFunction } from 'express';
import { param, query, body, validationResult, ValidationChain, checkSchema, Schema } from 'express-validator'; // Import checkSchema and Schema
// Corrected imports - Add .js extension back
import * as AdminModel from '../models/adminModel.js';
import * as SubmissionModel from '../models/submissionModel.js';
import * as RestaurantModel from '../models/restaurantModel.js';
import * as DishModel from '../models/dishModel.js';
import * as ListModel from '../models/listModel.js';
import * as UserModel from '../models/userModel.js';
import * as HashtagModel from '../models/hashtagModel.js';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

// Import Formatter Functions (needed for PUT response formatting)
import { formatRestaurantForResponse } from '../models/restaurantModel.js';
import { formatDishForResponse } from '../models/dishModel.js';
import { formatListForResponse } from '../models/listModel.js';
import { formatHashtag } from '../models/hashtagModel.js';
import { formatUser } from '../models/userModel.js';

// Type definition for allowed update payloads
type UpdatePayload = Partial<RestaurantModel.Restaurant>
                   | Partial<DishModel.Dish>
                   | Partial<ListModel.List>
                   | Partial<HashtagModel.Hashtag>
                   | Partial<UserModel.User>;


const router = express.Router();

// --- Constants, Validation, Middleware ---
const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users'];
const ALLOWED_UPDATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users'];
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users'];
const DEFAULT_PAGE_LIMIT = 25;
const typeToTable: Record<string, string> = {
    submissions: 'submissions', restaurants: 'restaurants', dishes: 'dishes',
    lists: 'lists', hashtags: 'hashtags', users: 'users',
};

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Admin Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

// Interface used by attachResourceInfo middleware
interface RequestWithResourceInfo extends AuthenticatedRequest {
    resourceType?: string;
    tableName?: string;
}

const attachResourceInfo = (req: Request, res: Response, next: NextFunction) => {
    const reqWithInfo = req as RequestWithResourceInfo;
    const typeParam = reqWithInfo.params.type;
    if (!ALLOWED_TYPES.includes(typeParam)) {
        return res.status(400).json({ error: 'Invalid resource type specified.' });
    }
    reqWithInfo.resourceType = typeParam;
    reqWithInfo.tableName = typeToTable[typeParam];
    if (!reqWithInfo.tableName) {
        return res.status(500).json({ error: 'Internal server error: Invalid resource type mapping.' });
    }
    next();
};

// Apply global middleware for admin routes
router.use(authMiddleware);
router.use(requireSuperuser);

// Validation Chains
const validateTypeParam = param('type').isIn(ALLOWED_TYPES).withMessage('Invalid resource type specified');
const validateIdParam = param('id').isInt({ gt: 0 }).withMessage('ID must be a positive integer').toInt();
const validateSortQuery = query('sort').optional().isString().matches(/^[a-zA-Z0-9_.]+_(asc|desc)$/i).withMessage('Invalid sort format (column_direction)');
const validateGetListQuery: ValidationChain[] = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    query('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search term too long or invalid characters'),
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status filter'),
    query('list_type').optional().isIn(['mixed', 'restaurant', 'dish']).withMessage('Invalid list type filter'),
    query('hashtag_category').optional().isString().trim().escape().isLength({ max: 50 }).withMessage('Invalid hashtag category'),
];
const validateBulkAdd: ValidationChain[] = [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.type').isIn(['restaurant', 'dish']).withMessage('Invalid item type in bulk add'),
    body('items.*.name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 255 }).escape(),
    body('items.*.location').optional({ nullable: true }).trim().isLength({ max: 500 }).escape(),
    body('items.*.city').optional({ nullable: true }).trim().isLength({ max: 100 }).escape(),
    body('items.*.neighborhood').optional({ nullable: true }).trim().isLength({ max: 100 }).escape(),
    body('items.*.place_id').optional({ nullable: true }).trim().isLength({ max: 255 }).escape(),
    body('items.*.restaurant_name').optional({ nullable: true }).trim().isLength({ max: 255 }).escape(),
    body('items.*.tags').optional({ nullable: true }).isArray().withMessage('Tags must be an array'),
    body('items.*.tags.*').if(body('items.*.tags').exists()).isString().trim().isLength({ min: 1, max: 50 }).escape(),
];

// This function returns the *schema definition object* for checkSchema
const getUpdateValidationSchema = (type: string): Schema => {
    switch (type) {
        case 'restaurants':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                city_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                neighborhood_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                address: { optional: true, isString: true, trim: true, isLength: { options: { max: 500 } }, escape: true },
                tags: { optional: true, isString: true, trim: true }, // Accept as string initially, parse later
            };
        case 'dishes':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                tags: { optional: true, isString: true, trim: true }, // Accept as string initially, parse later
            };
        case 'lists':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                description: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 1000 } }, escape: true },
                list_type: { optional: true, isIn: { options: [['mixed', 'restaurant', 'dish']] } },
                is_public: { optional: true, isBoolean: true, toBoolean: true },
                tags: { optional: true, isString: true, trim: true }, // Accept as string initially, parse later
                city_name: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
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
        default:
            return {}; // Return empty schema if type doesn't match
    }
};


// --- Routes ---

// GET /api/admin/:type
router.get(
    "/:type",
    validateTypeParam,
    attachResourceInfo,
    validateSortQuery,
    validateGetListQuery,
    handleValidationErrors, // Handles errors from the static validators above
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => {
        const currentDb = req.app?.get('db') || db;
        const tableName = req.tableName!;
        const resourceType = req.resourceType!;
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_LIMIT;
        const sort = req.query.sort as string | undefined;
        const search = req.query.search as string | undefined;
        const status = req.query.status as string | undefined;
        const listType = req.query.list_type as string | undefined;
        const hashtagCategory = req.query.hashtag_category as string | undefined;
        const offset = (page - 1) * limit;

        // --- Define Sort Logic ---
        let sortColumn = 'created_at';
        let sortDirection = 'DESC';
        if (resourceType === 'users') sortColumn = 'id';
        if (resourceType === 'hashtags') { sortColumn = 'name'; sortDirection = 'ASC'; }
        if (sort) {
            const [col, dir] = sort.split('_');
            // Basic validation to prevent injection (improve if needed)
            if (col && /^[a-zA-Z0-9_.]+$/.test(col) && ['asc', 'desc'].includes(dir.toLowerCase())) {
                sortColumn = col;
                sortDirection = dir.toUpperCase();
            }
        }

        // --- Define Query Parts ---
        let selectFields = `${tableName}.*`;
        let joins = '';
        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1;

        // Add joins and specific fields based on type
        if (resourceType === 'dishes') {
            selectFields += ', restaurants.name as restaurant_name';
            joins += ' LEFT JOIN restaurants ON dishes.restaurant_id = restaurants.id';
        } else if (resourceType === 'submissions') {
            selectFields += ', users.username as user_handle';
            joins += ' LEFT JOIN users ON submissions.user_id = users.id';
        } else if (resourceType === 'lists') {
            selectFields += ', users.username as creator_handle';
            joins += ' LEFT JOIN users ON lists.user_id = users.id';
            selectFields += ', COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = lists.id), 0)::int as item_count';
        }

        // Apply search filter (example for 'name' column, adapt as needed)
        if (search) {
            const searchPattern = `%${search}%`;
            let searchColumn = `${tableName}.name`; // Default search column
            if (resourceType === 'users') searchColumn = 'users.username';
            if (resourceType === 'submissions') searchColumn = 'submissions.name'; // Example
            // Add more conditions or search columns if needed
            whereConditions.push(`${searchColumn} ILIKE $${paramIndex++}`);
            queryParams.push(searchPattern);
        }

        // Apply specific status/type filters
        if (resourceType === 'submissions' && status && ['pending', 'approved', 'rejected'].includes(status)) {
            whereConditions.push(`${tableName}.status = $${paramIndex++}`);
            queryParams.push(status);
        }
        if (resourceType === 'lists' && listType && listType !== 'all' && ['mixed', 'restaurant', 'dish'].includes(listType)) {
            whereConditions.push(`${tableName}.list_type = $${paramIndex++}`);
            queryParams.push(listType);
        }
        if (resourceType === 'hashtags' && hashtagCategory && hashtagCategory !== 'all') {
            whereConditions.push(`${tableName}.category = $${paramIndex++}`);
            queryParams.push(hashtagCategory);
        }

        // --- Construct and Execute Queries ---
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        // Use double quotes for potentially reserved keywords or mixed-case columns
        const orderByClause = `ORDER BY "${tableName}"."${sortColumn}" ${sortDirection} NULLS LAST`;
        const limitOffsetClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

        const dataQuery = `SELECT ${selectFields} FROM ${tableName} ${joins} ${whereClause} ${orderByClause} ${limitOffsetClause}`;
        const countQuery = `SELECT COUNT(*) FROM ${tableName} ${joins} ${whereClause}`;

        const dataParams = [...queryParams, limit, offset];
        const countParams = [...queryParams];

        try {
            console.log("[Admin GET Query]", dataQuery, dataParams); // Log query
            const [dataResult, countResult] = await Promise.all([
                currentDb.query(dataQuery, dataParams),
                currentDb.query(countQuery, countParams)
            ]);
            const totalItems = parseInt(countResult.rows[0]?.count || '0', 10);
            const totalPages = Math.ceil(totalItems / limit);

            res.json({
                data: dataResult.rows || [],
                pagination: { total: totalItems, page, limit, totalPages }
            });
        } catch (err) {
            console.error(`[Admin GET /${resourceType}] Error fetching data:`, err);
            next(err);
        }
    }
);


// PUT /api/admin/:type/:id
router.put(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    attachResourceInfo, // Sets req.resourceType and req.tableName
    // No dynamic validation middleware here - done inside handler
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => { // Main route handler
        const { type, id } = req.params;
        const resourceType = req.resourceType!; // Get from attachResourceInfo middleware
        const numericId = id as unknown as number;
        const tableName = req.tableName!;
        const updateData = req.body; // Raw body
        const userId = req.user!.id;

        // --- Apply Validation Here ---
        if (!ALLOWED_UPDATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ error: `Updates not allowed for resource type: ${resourceType}` });
        }
        const schemaDefinition = getUpdateValidationSchema(resourceType); // Get schema definition object
        const validationMiddlewares = checkSchema(schemaDefinition); // Get express-validator middleware array

        // Manually run the validation middleware chain
        try {
            await Promise.all(validationMiddlewares.map(middleware =>
                new Promise<void>((resolve, reject) => {
                    middleware(req, res, (err) => {
                        if (err) { reject(err); } // Reject if middleware itself errors
                        else { resolve(); }
                    });
                })
            ));
        } catch (middlewareError) {
            console.error(`[Admin PUT /${type}/${numericId}] Error executing validation middleware:`, middlewareError);
            return next(middlewareError); // Pass middleware error to global handler
        }

        // Now check the validation results
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn(`[Admin PUT /${type}/${numericId} Validation Error]`, errors.array());
            return res.status(400).json({ error: errors.array()[0].msg });
        }
        // --- Validation Applied ---

        // Filter the input `updateData` to only include keys defined in the schema
        // Use req.body as validation/sanitization happens in place
        const allowedKeys = Object.keys(schemaDefinition);
        const filteredUpdateData = Object.keys(req.body) // Use req.body after validation
            .filter(key => allowedKeys.includes(key))
            .reduce((obj: Record<string, any>, key) => { // FIX: Explicitly type accumulator 'obj'
                obj[key] = req.body[key]; // Access potentially sanitized value
                return obj;
            }, {}); // Initialize with empty object

        // Check if any valid fields remain after filtering
        if (Object.keys(filteredUpdateData).length === 0) {
            return res.status(400).json({ error: 'No valid update fields provided.' });
        }

        console.log(`[Admin PUT /${type}/${numericId}] User ${userId} updating resource. Filtered Data:`, filteredUpdateData);

        try {
            let updatedRecord: any = null;
            switch (type) {
                case 'restaurants':
                    updatedRecord = await RestaurantModel.updateRestaurant(numericId, filteredUpdateData as Partial<RestaurantModel.Restaurant>);
                    break;
                case 'dishes':
                    updatedRecord = await DishModel.updateDish(numericId, filteredUpdateData as Partial<DishModel.Dish>);
                    break;
                case 'lists':
                    // Handle tags conversion if needed (assuming validation passes string)
                    // FIX: Check if 'tags' exists on filteredUpdateData before accessing
                    if (filteredUpdateData.tags && typeof filteredUpdateData.tags === 'string') {
                         filteredUpdateData.tags = filteredUpdateData.tags.split(',').map(t => t.trim()).filter(Boolean);
                    }
                    updatedRecord = await ListModel.updateList(numericId, filteredUpdateData as Partial<ListModel.List>);
                    break;
                case 'hashtags':
                    updatedRecord = await HashtagModel.updateHashtag(numericId, filteredUpdateData as Partial<HashtagModel.Hashtag>);
                    break;
                case 'users':
                    const targetUser = await UserModel.findUserById(numericId);
                    if (!targetUser) return res.status(404).json({ error: 'User not found.' });
                    const userUpdateData = filteredUpdateData as Partial<UserModel.User>;
                     if (targetUser.id === userId && userUpdateData.account_type && targetUser.account_type !== userUpdateData.account_type) {
                         return res.status(403).json({ error: 'Superusers cannot change their own account type via this generic route.' });
                     }
                    delete userUpdateData.password_hash; // Ensure password isn't updated this way
                    updatedRecord = await UserModel.updateUser(numericId, userUpdateData);
                    break;
                // No default needed as type is pre-validated by attachResourceInfo
            }

            // Handle cases where the update didn't return a record
            if (!updatedRecord) {
                const checkExists = await db.query(`SELECT id FROM ${tableName} WHERE id = $1`, [numericId]);
                if (checkExists.rowCount === 0) {
                    return res.status(404).json({ error: `${type.slice(0, -1)} not found.` });
                } else {
                    console.warn(`[Admin PUT /${type}/${numericId}] Update returned null, possibly no changes made or concurrent modification.`);
                    const currentRecordResult = await db.query(`SELECT * FROM ${tableName} WHERE id = $1`, [numericId]);
                    const currentRecord = currentRecordResult.rows[0] || {};
                    let formattedRecord: any = currentRecord;
                    // Format based on type using imported formatters
                    if (type === 'restaurants') formattedRecord = formatRestaurantForResponse(currentRecord);
                    if (type === 'dishes') formattedRecord = formatDishForResponse(currentRecord);
                    if (type === 'lists') formattedRecord = formatListForResponse(currentRecord);
                    if (type === 'hashtags') formattedRecord = formatHashtag(currentRecord);
                    if (type === 'users') formattedRecord = formatUser(currentRecord);
                    return res.status(200).json({ data: formattedRecord, message: 'No effective changes applied or update conflict.' });
                }
            }

            console.log(`[Admin PUT /${type}/${numericId}] Update successful.`);
            res.json({ data: updatedRecord });

        } catch (err: unknown) { // Error during DB operation
            console.error(`[Admin PUT /${type}/${numericId}] DB Error:`, err);
            if ((err as any)?.code === '23505') { // Handle unique constraint errors
                return res.status(409).json({ error: `Update failed: Value conflicts with an existing record (e.g., duplicate name/email).` });
            }
            next(err); // Pass other errors to global handler
        }
    }
);


// POST /api/admin/submissions/:id/approve
router.post(
    '/submissions/:id/approve',
    validateIdParam,
    handleValidationErrors, // Handles ID validation
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const submissionId = req.params.id as unknown as number;
        try {
            const reviewerId = req.user?.id;
            if (!reviewerId) return res.status(401).json({ error: 'User details not found.' });
            const updatedSubmission = await SubmissionModel.updateSubmissionStatus(submissionId, 'approved', reviewerId);
             if (!updatedSubmission) {
                // Check if it was already processed or doesn't exist
                 const exists = await SubmissionModel.findSubmissionById(submissionId);
                 if (!exists) return res.status(404).json({ error: 'Submission not found.' });
                 else return res.status(409).json({ error: 'Submission was already processed or is not pending.' });
            }
            res.json({ data: updatedSubmission });
        } catch (err) {
             console.error(`[Admin Approve /submissions/${submissionId}] Error:`, err);
             next(err);
        }
    }
);

// POST /api/admin/submissions/:id/reject
router.post(
    '/submissions/:id/reject',
    validateIdParam,
    handleValidationErrors, // Handles ID validation
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const submissionId = req.params.id as unknown as number;
         try {
             const reviewerId = req.user?.id;
             if (!reviewerId) return res.status(401).json({ error: 'User details not found.' });
             const updatedSubmission = await SubmissionModel.updateSubmissionStatus(submissionId, 'rejected', reviewerId);
              if (!updatedSubmission) {
                 const exists = await SubmissionModel.findSubmissionById(submissionId);
                 if (!exists) return res.status(404).json({ error: 'Submission not found.' });
                 else return res.status(409).json({ error: 'Submission was already processed or is not pending.' });
             }
             res.json({ data: updatedSubmission });
         } catch (err) {
              console.error(`[Admin Reject /submissions/${submissionId}] Error:`, err);
              next(err);
         }
    }
);

// DELETE /api/admin/:type/:id
router.delete(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    attachResourceInfo,
    handleValidationErrors, // Handles param validation
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => {
         const { type, id } = req.params;
         const tableName = req.tableName!;
         const resourceType = req.resourceType!;
         const numericId = parseInt(id, 10); // Already validated by validateIdParam

         if (!ALLOWED_MUTATE_TYPES.includes(resourceType)) {
             return res.status(405).json({ error: `Deletions not allowed for resource type: ${resourceType}` });
         }

         try {
             const deleted = await AdminModel.deleteResourceById(tableName, numericId);
             if (!deleted) return res.status(404).json({ error: `${resourceType.slice(0, -1)} not found.` });
             res.status(204).send(); // Success, no content
         } catch (err: unknown) {
             console.error(`[Admin DELETE /${type}/${id}] Error:`, err);
             if (err instanceof Error && (err as any).code === '23503') { // Foreign key violation
                  return res.status(409).json({ error: `Cannot delete ${resourceType.slice(0, -1)}: It is referenced by other items.` });
             }
             next(err);
         }
    }
);

// POST /api/admin/bulk-add
router.post(
    '/bulk-add',
    validateBulkAdd, // Use the validation chain for bulk add
    handleValidationErrors, // Handle any validation errors
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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