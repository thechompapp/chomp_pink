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
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

import { formatRestaurantForResponse } from '../models/restaurantModel.js';
import { formatDishForResponse } from '../models/dishModel.js';
import { formatListForResponse } from '../models/listModel.js';
import { formatHashtag } from '../models/hashtagModel.js';
import { formatUser } from '../models/userModel.js';

type MutatePayload = Partial<RestaurantModel.Restaurant>
                   | Partial<DishModel.Dish>
                   | Partial<ListModel.List>
                   | Partial<HashtagModel.Hashtag>
                   | Partial<{ id?: number; name: string; city_id: number }>
                   | Partial<Omit<UserModel.User, 'password_hash'>>;

const router = express.Router();

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
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

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

router.use(authMiddleware);
router.use(requireSuperuser);

const getUpdateValidationSchema = (type: string): Schema => {
    switch (type) {
        case 'restaurants':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                city_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                neighborhood_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                address: { optional: true, isString: true, trim: true, isLength: { options: { max: 500 } }, escape: true },
                tags: { optional: true, isString: true, trim: true },
            };
        case 'dishes':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                tags: { optional: true, isString: true, trim: true },
                restaurant_id: { optional: true, isInt: { options: { gt: 0 } }, toInt: true },
            };
        case 'lists':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 255 } }, escape: true },
                description: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 1000 } }, escape: true },
                list_type: { optional: true, isIn: { options: [['mixed', 'restaurant', 'dish']] } },
                is_public: { optional: true, isBoolean: true, toBoolean: true },
                tags: { optional: true, isString: true, trim: true },
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
        case 'neighborhoods':
            return {
                name: { optional: true, isString: true, trim: true, notEmpty: true, isLength: { options: { max: 100 } }, escape: true, errorMessage: 'Neighborhood name cannot be empty if provided.' },
                city_id: { optional: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'A valid City ID must be provided if changing the city.' },
            };
        default:
            return {};
    }
};

const getCreateValidationSchema = (type: string): Schema => {
    switch (type) {
        case 'restaurants':
            return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Restaurant name is required', isLength: { options: { max: 255 } }, escape: true },
                city_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                neighborhood_name: { optional: true, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
                address: { optional: true, isString: true, trim: true, isLength: { options: { max: 500 } }, escape: true },
                tags: { optional: true, isArray: true, errorMessage: 'Tags must be an array' },
                'tags.*': { isString: true, trim: true, escape: true },
                city_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'City ID must be a positive integer' },
                neighborhood_id: { optional: { options: { nullable: true } }, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'Neighborhood ID must be a positive integer' },
            };
        case 'dishes':
            return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'Dish name is required', isLength: { options: { max: 255 } }, escape: true },
                restaurant_id: { notEmpty: true, isInt: { options: { gt: 0 } }, toInt: true, errorMessage: 'Restaurant ID is required and must be a positive integer' },
                tags: { optional: true, isArray: true, errorMessage: 'Tags must be an array' },
                'tags.*': { isString: true, trim: true, escape: true },
            };
        case 'lists':
            return {
                name: { isString: true, trim: true, notEmpty: true, errorMessage: 'List name is required', isLength: { options: { max: 255 } }, escape: true },
                description: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 1000 } }, escape: true },
                list_type: { optional: true, isIn: { options: [['mixed', 'restaurant', 'dish']] } },
                is_public: { optional: true, isBoolean: true, toBoolean: true },
                tags: { optional: true, isArray: true, errorMessage: 'Tags must be an array' },
                'tags.*': { isString: true, trim: true, escape: true },
                city_name: { optional: { options: { nullable: true } }, isString: true, trim: true, isLength: { options: { max: 100 } }, escape: true },
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
            };
        default:
            return {};
    }
};

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

router.get('/lookup/cities', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const citiesResult = await db.query('SELECT id, name FROM cities ORDER BY name ASC');
        const cities = citiesResult.rows || [];
        console.log(`[Admin GET /lookup/cities] Fetched cities:`, cities);
        res.json({ data: cities });
    } catch (error) {
        console.error('[Admin GET /lookup/cities] Error fetching cities:', error);
        next(error);
    }
});

router.get(
    "/:type",
    validateTypeParam,
    attachResourceInfo,
    validateSortQuery,
    validateGetListQuery,
    handleValidationErrors,
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
        const cityId = req.query.cityId ? Number(req.query.cityId) : undefined;
        const offset = (page - 1) * limit;

        let sortColumn = 'created_at';
        let sortDirection = 'DESC';
        if (resourceType === 'users') sortColumn = 'id';
        if (resourceType === 'hashtags' || resourceType === 'neighborhoods') { sortColumn = 'name'; sortDirection = 'ASC'; }
        if (sort) {
            const parts = sort.split('_');
            const dir = parts.pop()?.toLowerCase();
            const col = parts.join('_');
            const allowedSortColumns: { [key: string]: string[] } = {
                restaurants: ['id', 'name', 'city_name', 'neighborhood_name', 'adds', 'created_at'],
                dishes: ['id', 'name', 'restaurant_name', 'adds', 'created_at'],
                lists: ['id', 'name', 'list_type', 'saved_count', 'item_count', 'is_public', 'creator_handle', 'city_name', 'created_at'],
                hashtags: ['id', 'name', 'category', 'created_at'],
                users: ['id', 'username', 'email', 'account_type', 'created_at'],
                neighborhoods: ['id', 'name', 'city_name', 'created_at'],
                submissions: ['id', 'type', 'name', 'status', 'created_at']
            };
            if (col && /^[a-zA-Z0-9_.]+$/.test(col) && ['asc', 'desc'].includes(dir || '') && allowedSortColumns[resourceType]?.includes(col)) {
                sortColumn = col;
                sortDirection = dir!.toUpperCase();
            } else {
                console.warn(`[Admin GET /${resourceType}] Invalid sort parameter ignored: ${sort}`);
            }
        }

        let selectFields = `${tableName}.*`;
        let joins = '';
        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1;

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
        }

        if (search) {
            const searchPattern = `%${search}%`;
            let searchColumns: string[] = [];
            switch (resourceType) {
                case 'users': searchColumns = ['users.username', 'users.email']; break;
                case 'restaurants': searchColumns = ['restaurants.name', 'restaurants.city_name', 'restaurants.neighborhood_name']; break;
                case 'dishes': searchColumns = ['dishes.name', 'r.name']; break;
                case 'lists': searchColumns = ['lists.name', 'lists.description', 'u.username']; break;
                case 'hashtags': searchColumns = ['hashtags.name', 'hashtags.category']; break;
                case 'neighborhoods': searchColumns = ['neighborhoods.name', 'c.name']; break;
                case 'submissions': searchColumns = ['submissions.name']; break;
                default: searchColumns = [`${tableName}.name`];
            }
            if (searchColumns.length > 0) {
                whereConditions.push(`(${searchColumns.map(col => `${col} ILIKE $${paramIndex++}`).join(' OR ')})`);
                searchColumns.forEach(() => queryParams.push(searchPattern));
            }
        }

        if (resourceType === 'submissions' && status && ['pending', 'approved', 'rejected'].includes(status)) {
            whereConditions.push(`submissions.status = $${paramIndex++}`);
            queryParams.push(status);
        }
        if (resourceType === 'lists' && listType && listType !== 'all' && ['mixed', 'restaurant', 'dish'].includes(listType)) {
            whereConditions.push(`lists.list_type = $${paramIndex++}`);
            queryParams.push(listType);
        }
        if (resourceType === 'hashtags' && hashtagCategory && hashtagCategory !== 'all') {
            whereConditions.push(`hashtags.category = $${paramIndex++}`);
            queryParams.push(hashtagCategory);
        }
        if (resourceType === 'neighborhoods' && cityId) {
            whereConditions.push(`neighborhoods.city_id = $${paramIndex++}`);
            queryParams.push(cityId);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        // Handle joined column sorting correctly
        let safeSortColumn;
        if (sortColumn === 'restaurant_name' && resourceType === 'dishes') {
            safeSortColumn = 'r.name'; // Use alias from join
        } else if (sortColumn === 'user_handle' && resourceType === 'submissions') {
            safeSortColumn = 'u.username';
        } else if (sortColumn === 'creator_handle' && resourceType === 'lists') {
            safeSortColumn = 'u.username';
        } else if (sortColumn === 'city_name' && resourceType === 'neighborhoods') {
            safeSortColumn = 'c.name';
        } else if (sortColumn === 'city_name' && resourceType === 'restaurants') {
            safeSortColumn = '"restaurants"."city_name"'; // Direct column in restaurants table
        } else {
            safeSortColumn = sortColumn.includes('.') ? sortColumn : `"${tableName}"."${sortColumn}"`;
        }
        const orderByClause = `ORDER BY ${safeSortColumn} ${sortDirection} NULLS LAST`;
        const limitOffsetClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

        const dataQuery = `SELECT ${selectFields} FROM ${tableName} ${joins} ${whereClause} ${orderByClause} ${limitOffsetClause}`;
        const countQuery = `SELECT COUNT(${tableName}.id) FROM ${tableName} ${joins} ${whereClause}`;
        const dataParams = [...queryParams, limit, offset];
        const countParams = queryParams.slice(0, paramIndex - 3);

        try {
            console.log(`[Admin GET /${resourceType}] Data Query:`, dataQuery.replace(/\s+/g, ' '));
            console.log(`[Admin GET /${resourceType}] Data Params:`, dataParams);
            console.log(`[Admin GET /${resourceType}] Count Query:`, countQuery.replace(/\s+/g, ' '));
            console.log(`[Admin GET /${resourceType}] Count Params:`, countParams);

            const [dataResult, countResult] = await Promise.all([
                currentDb.query(dataQuery, dataParams),
                currentDb.query(countQuery, countParams)
            ]);

            const totalItems = parseInt(countResult.rows[0]?.count || '0', 10);
            const totalPages = Math.ceil(totalItems / limit);
            const rows = dataResult.rows || [];

            console.log(`[Admin GET /${resourceType}] Rows fetched:`, rows.length, 'Total items:', totalItems);

            res.json({
                data: rows,
                pagination: { total: totalItems, page, limit, totalPages }
            });
        } catch (err) {
            console.error(`[Admin GET /${resourceType}] Error executing query:`, err);
            res.status(500).json({ error: err.message || 'Internal server error' });
            next(err);
        }
    }
);

// Remaining routes (POST, PUT, DELETE, etc.) unchanged for brevity
router.post(
    '/:type',
    validateTypeParam,
    attachResourceInfo,
    async (req: Request, res: Response, next: NextFunction) => {
        const resourceType = (req as RequestWithResourceInfo).resourceType;
        if (!resourceType || !ALLOWED_CREATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ error: `Creation not allowed for resource type: ${resourceType}` });
        }
        const schemaDefinition = getCreateValidationSchema(resourceType);
        const validationMiddlewares = checkSchema(schemaDefinition);

        try {
            await Promise.all(validationMiddlewares.map(middleware =>
                new Promise<void>((resolve, reject) => {
                    middleware(req, res, (err) => {
                        if (err) reject(err); else resolve();
                    });
                })
            ));
            next();
        } catch (middlewareError) {
            console.error(`[Admin POST /${resourceType} Validation Middleware Error]`, middlewareError);
            next(middlewareError);
        }
    },
    handleValidationErrors,
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => {
        const { type } = req.params;
        const resourceType = req.resourceType!;
        const createData = req.body;
        const userId = req.user!.id;
        const userHandle = req.user!.username;

        console.log(`[Admin POST /${type}] User ${userId} creating resource. Data:`, createData);

        try {
            const newRecord = await AdminModel.createResource(resourceType, createData, userId, userHandle);

            if (!newRecord) {
                console.warn(`[Admin POST /${type}] Create operation returned null.`);
                return res.status(409).json({ error: `Failed to create ${type.slice(0, -1)}, possibly already exists.` });
            }

            console.log(`[Admin POST /${type}] Create successful. ID: ${newRecord.id}`);
            res.status(201).json({ data: newRecord });
        } catch (err: unknown) {
            console.error(`[Admin POST /${type}] Model Error:`, err);
            if ((err as any)?.code === '23505') {
                return res.status(409).json({ error: `Create failed: Value conflicts with an existing record (e.g., duplicate name/email).` });
            }
            if (err instanceof Error && err.message.includes("not found") || (err as any)?.code === '23503') {
                return res.status(400).json({ error: err.message });
            }
            next(err);
        }
    }
);

router.put(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    attachResourceInfo,
    async (req: Request, res: Response, next: NextFunction) => {
        const resourceType = (req as RequestWithResourceInfo).resourceType;
        if (!resourceType || !ALLOWED_UPDATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ error: `Updates not allowed for resource type: ${resourceType}` });
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
    handleValidationErrors,
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => {
        const { type, id } = req.params;
        const resourceType = req.resourceType!;
        const numericId = parseInt(id, 10);
        const updateData = req.body;
        const userId = req.user!.id;

        const schemaDefinition = getUpdateValidationSchema(resourceType);
        const allowedKeys = Object.keys(schemaDefinition);
        const filteredUpdateData = Object.keys(updateData)
            .filter(key => allowedKeys.includes(key))
            .reduce((obj: Record<string, any>, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        if (Object.keys(filteredUpdateData).length === 0) {
            return res.status(400).json({ error: 'No valid or changeable fields provided.' });
        }

        console.log(`[Admin PUT /${type}/${numericId}] User ${userId} updating resource. Filtered Data:`, filteredUpdateData);

        try {
            const updatedRecord = await AdminModel.updateResource(resourceType, numericId, filteredUpdateData, userId);

            if (!updatedRecord) {
                const checkExists = await db.query(`SELECT id FROM ${req.tableName!} WHERE id = $1`, [numericId]);
                if (checkExists.rowCount === 0) {
                    return res.status(404).json({ error: `${resourceType.slice(0, -1)} not found.` });
                } else {
                    console.warn(`[Admin PUT /${type}/${numericId}] Update returned null, possibly no changes made or concurrent modification.`);
                    const currentRecordResult = await db.query(`SELECT * FROM ${req.tableName!} WHERE id = $1`, [numericId]);
                    const currentRecord = currentRecordResult.rows[0] || {};
                    let formattedRecord = currentRecord;
                    if (type === 'restaurants') formattedRecord = formatRestaurantForResponse(currentRecord);
                    if (type === 'dishes') formattedRecord = formatDishForResponse(currentRecord);
                    if (type === 'lists') formattedRecord = formatListForResponse(currentRecord);
                    if (type === 'hashtags') formattedRecord = formatHashtag(currentRecord);
                    if (type === 'users') formattedRecord = formatUser(currentRecord);
                    return res.status(200).json({ data: formattedRecord, message: 'No effective changes applied.' });
                }
            }

            console.log(`[Admin PUT /${type}/${numericId}] Update successful.`);
            res.json({ data: updatedRecord });
        } catch (err: unknown) {
            console.error(`[Admin PUT /${type}/${numericId}] Model Error:`, err);
            if ((err as any)?.code === '23505') {
                return res.status(409).json({ error: `Update failed: Value conflicts with an existing record (e.g., duplicate name/email).` });
            }
            if (err instanceof Error && err.message.includes("not found") || (err as any)?.code === '23503') {
                return res.status(400).json({ error: err.message });
            }
            next(err);
        }
    }
);

router.post(
    '/submissions/:id/approve',
    validateIdParam,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const submissionId = req.params.id as unknown as number;
        try {
            const reviewerId = req.user?.id;
            if (!reviewerId) return res.status(401).json({ error: 'User details not found.' });
            const updatedSubmission = await SubmissionModel.updateSubmissionStatus(submissionId, 'approved', reviewerId);
            if (!updatedSubmission) {
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

router.post(
    '/submissions/:id/reject',
    validateIdParam,
    handleValidationErrors,
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

router.delete(
    '/:type/:id',
    validateTypeParam,
    validateIdParam,
    attachResourceInfo,
    handleValidationErrors,
    async (req: RequestWithResourceInfo, res: Response, next: NextFunction) => {
        const { type, id } = req.params;
        const tableName = req.tableName!;
        const resourceType = req.resourceType!;
        const numericId = parseInt(id, 10);

        if (!ALLOWED_MUTATE_TYPES.includes(resourceType)) {
            return res.status(405).json({ error: `Deletions not allowed for resource type: ${resourceType}` });
        }

        try {
            const deleted = await AdminModel.deleteResourceById(tableName, numericId);
            if (!deleted) return res.status(404).json({ error: `${resourceType.slice(0, -1)} not found.` });
            res.status(204).send();
        } catch (err: unknown) {
            console.error(`[Admin DELETE /${type}/${id}] Error:`, err);
            if (err instanceof Error && (err as any).code === '23503') {
                return res.status(409).json({ error: `Cannot delete ${resourceType.slice(0, -1)}: It is referenced by other items.` });
            }
            next(err);
        }
    }
);

router.post(
    '/bulk-add',
    validateBulkAdd,
    handleValidationErrors,
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