/* src/doof-backend/routes/admin.ts */
import express, { Request, Response, NextFunction } from 'express';
import { param, query, body, validationResult } from 'express-validator';
import * as AdminModel from '../models/adminModel.js'; // Added .js
import * as SubmissionModel from '../models/submissionModel.js'; // Added .js
import db from '../db/index.js'; // Added .js
import authMiddleware from '../middleware/auth.js'; // Added .js
import requireSuperuser from '../middleware/requireSuperuser.js'; // Added .js
import type { AuthenticatedRequest } from '../middleware/auth.js'; // Import type

const router = express.Router();

const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users'];
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags']; // Users typically not deleted via admin panel directly this way
const DEFAULT_PAGE_LIMIT = 25;

// Simple mapping for table names (adjust if needed)
const typeToTable: Record<string, string> = {
    submissions: 'submissions',
    restaurants: 'restaurants',
    dishes: 'dishes',
    lists: 'lists',
    hashtags: 'hashtags',
    users: 'users',
};

// Validation error handler
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Admin Route Validation Error] Path: ${req.path}`, errors.array());
        // Return only the first error message for simplicity
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// Middleware to attach table/resource names to request
interface AdminRequest extends AuthenticatedRequest {
    resourceType?: string;
    tableName?: string;
}

const attachResourceInfo = (req: AdminRequest, res: Response, next: NextFunction) => {
    const typeParam = req.params.type;
    if (!ALLOWED_TYPES.includes(typeParam)) {
        return res.status(400).json({ error: 'Invalid resource type specified.' });
    }
    req.resourceType = typeParam;
    req.tableName = typeToTable[typeParam];
    if (!req.tableName) {
        // This case should theoretically not happen if ALLOWED_TYPES and typeToTable are synced
        return res.status(500).json({ error: 'Internal server error: Invalid resource type mapping.' });
    }
    next();
};


// --- Use Middleware ---
router.use(authMiddleware); // Apply auth to all admin routes
router.use(requireSuperuser); // Apply superuser check to all admin routes

// --- Validation Chains ---
const validateTypeParam = param('type').isIn(ALLOWED_TYPES).withMessage('Invalid resource type specified');
const validateIdParam = param('id').isInt({ gt: 0 }).withMessage('ID must be a positive integer').toInt();
const validateSortQuery = query('sort').optional().isString().matches(/^[a-zA-Z0-9_.]+_(asc|desc)$/i).withMessage('Invalid sort format (column_direction)');
const validateGetListQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    query('search').optional().isString().trim().escape().isLength({ max: 100 }).withMessage('Search term too long or invalid characters'),
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status filter'),
    // Add other filters if needed (e.g., list_type, hashtag_category)
    query('list_type').optional().isIn(['mixed', 'restaurant', 'dish']).withMessage('Invalid list type filter'),
    query('hashtag_category').optional().isString().trim().escape().isLength({ max: 50 }).withMessage('Invalid hashtag category'),
];
const validateBulkAdd = [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.type').isIn(['restaurant', 'dish']).withMessage('Invalid item type in bulk add'),
    body('items.*.name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 255 }).escape(),
    body('items.*.location').optional({ nullable: true }).trim().isLength({ max: 500 }).escape(),
    body('items.*.city').optional({ nullable: true }).trim().isLength({ max: 100 }).escape(),
    body('items.*.neighborhood').optional({ nullable: true }).trim().isLength({ max: 100 }).escape(),
    body('items.*.place_id').optional({ nullable: true }).trim().isLength({ max: 255 }).escape(),
    body('items.*.restaurant_name').optional({ nullable: true }).trim().isLength({ max: 255 }).escape(),
    body('items.*.tags').optional({ nullable: true }).isArray().withMessage('Tags must be an array'),
    body('items.*.tags.*').if(body('items.*.tags').exists()).isString().trim().isLength({ min: 1, max: 50 }).escape(), // Validate individual tags
];

// --- Routes ---

// GET /api/admin/:type (List resources with pagination, sorting, searching, filtering)
router.get(
    "/:type",
    validateTypeParam, // Validate type first
    attachResourceInfo, // Attach tableName/resourceType
    validateSortQuery,
    validateGetListQuery,
    handleValidationErrors,
    async (req: AdminRequest, res: Response, next: NextFunction) => {
        const currentDb = req.app?.get('db') || db;
        const tableName = req.tableName!;
        const resourceType = req.resourceType!;

        const page = parseInt(String(req.query.page || '1'), 10);
        const limit = parseInt(String(req.query.limit || DEFAULT_PAGE_LIMIT), 10);
        const sort = req.query.sort as string | undefined;
        const search = req.query.search as string | undefined;
        const status = req.query.status as string | undefined; // For submissions
        const listType = req.query.list_type as string | undefined; // For lists
        const hashtagCategory = req.query.hashtag_category as string | undefined; // For hashtags

        const offset = (page - 1) * limit;

        // Default sort order
        let sortColumn = 'created_at';
        let sortDirection = 'DESC';

        // Override default sort for specific types if needed
        if (resourceType === 'users') sortColumn = 'id';
        if (resourceType === 'hashtags') sortColumn = 'name'; sortDirection = 'ASC';

        // Apply user-specified sort if valid
        if (sort) {
            const parts = sort.toLowerCase().split('_');
            if (parts.length === 2 && ['asc', 'desc'].includes(parts[1])) {
                // Basic validation against SQL injection for column name
                if (/^[a-z0-9_.]+$/.test(parts[0])) {
                    sortColumn = parts[0];
                    sortDirection = parts[1].toUpperCase();
                } else {
                     console.warn(`[Admin GET /${resourceType}] Invalid sort column format detected: ${parts[0]}`);
                     // Keep default sort or return error? Keeping default for now.
                }
            }
        }


        // --- Build Query Parts ---
        let selectFields = `${tableName}.*`;
        let joins = '';
        let whereConditions: string[] = [];
        let queryParams: any[] = [];
        let paramIndex = 1; // For parameterized queries $1, $2, ...

        // Add specific joins and selected fields based on type
        if (resourceType === 'dishes') {
            selectFields += ', restaurants.name as restaurant_name';
            joins += ' JOIN restaurants ON dishes.restaurant_id = restaurants.id';
        } else if (resourceType === 'submissions') {
            selectFields += ', users.username as user_handle';
            joins += ' LEFT JOIN users ON submissions.user_id = users.id';
        } else if (resourceType === 'lists') {
            selectFields += ', users.username as creator_handle';
            joins += ' LEFT JOIN users ON lists.user_id = users.id';
            // Add item count calculation
            selectFields += ', COALESCE((SELECT COUNT(*) FROM listitems li WHERE li.list_id = lists.id), 0)::int as item_count';
        }

        // Add search condition (use ILIKE for case-insensitive search)
        if (search) {
            let searchField = 'name'; // Default search field
            if (resourceType === 'users') searchField = 'username';
            else if (resourceType === 'hashtags') searchField = 'name';
            else if (resourceType === 'submissions') searchField = 'name'; // Can search submissions by name too

            // Basic validation for search field name
             if (/^[a-z0-9_.]+$/.test(searchField)) {
                 whereConditions.push(`${tableName}.${searchField} ILIKE $${paramIndex++}`);
                 queryParams.push(`%${search}%`);
             }
        }

        // Add status filter for submissions
        if (resourceType === 'submissions' && status) {
            whereConditions.push(`${tableName}.status = $${paramIndex++}`);
            queryParams.push(status);
        }
        // Add list_type filter for lists
        if (resourceType === 'lists' && listType && listType !== 'all') {
             whereConditions.push(`${tableName}.list_type = $${paramIndex++}`);
             queryParams.push(listType);
        }
         // Add category filter for hashtags
         if (resourceType === 'hashtags' && hashtagCategory && hashtagCategory !== 'all') {
             whereConditions.push(`${tableName}.category = $${paramIndex++}`);
             queryParams.push(hashtagCategory);
         }


        // Combine query parts
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const orderByClause = `ORDER BY "${sortColumn}" ${sortDirection} NULLS LAST`; // Use validated sort params
        const limitOffsetClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

        const dataQuery = `SELECT ${selectFields} FROM ${tableName} ${joins} ${whereClause} ${orderByClause} ${limitOffsetClause}`;
        const countQuery = `SELECT COUNT(*) FROM ${tableName} ${joins} ${whereClause}`;

        // Final parameters for data and count queries
        const dataParams = [...queryParams, limit, offset];
        const countParams = [...queryParams]; // Count query doesn't need limit/offset

        console.log(`[Admin GET /${resourceType}] Data Query: ${dataQuery}`);
        console.log(`[Admin GET /${resourceType}] Data Params:`, dataParams);
        console.log(`[Admin GET /${resourceType}] Count Query: ${countQuery}`);
        console.log(`[Admin GET /${resourceType}] Count Params:`, countParams);

        try {
            // Execute both queries concurrently
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
            next(err); // Pass error to global handler
        }
    }
);

// POST /api/admin/submissions/:id/approve
router.post(
    '/submissions/:id/approve',
    validateIdParam, // Validate ID
    handleValidationErrors,
    async (req: AdminRequest, res: Response, next: NextFunction) => {
        const submissionId = req.params.id; // ID is already parsed by validation
        try {
            const reviewerId = req.user?.id; // Get superuser ID from authenticated request
            if (!reviewerId) return res.status(401).json({ error: 'User details not found in request.' });

            const updatedSubmission = await SubmissionModel.updateSubmissionStatus(submissionId, 'approved', reviewerId);

            if (!updatedSubmission) {
                // Check if submission exists but wasn't pending
                const currentSub = await SubmissionModel.findSubmissionById(submissionId);
                if (currentSub) return res.status(409).json({ error: `Submission ${submissionId} already processed (status: ${currentSub.status}).` });
                else return res.status(404).json({ error: 'Submission not found.' });
            }

            console.log(`[Admin Action] Submission ${submissionId} approved by user ${reviewerId}.`);
            // Optionally trigger cache invalidation here if needed
            res.json({ data: updatedSubmission }); // Return updated submission
        } catch (err) {
            console.error(`[Admin Approve /submissions/${submissionId}] Error:`, err);
            next(err);
        }
    }
);

// POST /api/admin/submissions/:id/reject
router.post(
    '/submissions/:id/reject',
    validateIdParam, // Validate ID
    handleValidationErrors,
    async (req: AdminRequest, res: Response, next: NextFunction) => {
        const submissionId = req.params.id;
        try {
            const reviewerId = req.user?.id;
            if (!reviewerId) return res.status(401).json({ error: 'User details not found in request.' });

            const updatedSubmission = await SubmissionModel.updateSubmissionStatus(submissionId, 'rejected', reviewerId);

            if (!updatedSubmission) {
                 // Check if submission exists but wasn't pending
                 const currentSub = await SubmissionModel.findSubmissionById(submissionId);
                 if (currentSub) return res.status(409).json({ error: `Submission ${submissionId} already processed (status: ${currentSub.status}).` });
                 else return res.status(404).json({ error: 'Submission not found.' });
            }
            console.log(`[Admin Action] Submission ${submissionId} rejected by user ${reviewerId}.`);
            // Optionally trigger cache invalidation here
            res.json({ data: updatedSubmission }); // Return updated submission
        } catch (err) {
             console.error(`[Admin Reject /submissions/${submissionId}] Error:`, err);
            next(err);
        }
    }
);

// DELETE /api/admin/:type/:id (Delete a resource)
router.delete(
    '/:type/:id',
    validateTypeParam, // Validate type
    validateIdParam, // Validate ID
    attachResourceInfo, // Attach tableName/resourceType
    handleValidationErrors,
    async (req: AdminRequest, res: Response, next: NextFunction) => {
        const { type, id } = req.params;
        const tableName = req.tableName!;
        const resourceType = req.resourceType!;

        // Check if deletion is allowed for this type
        if (!ALLOWED_MUTATE_TYPES.includes(type)) {
            return res.status(400).json({ error: `Deletion not allowed for resource type: ${type}.` });
        }

        try {
            const deleted = await AdminModel.deleteResourceById(tableName, id); // Use the model function
            if (!deleted) {
                return res.status(404).json({ error: `${resourceType.slice(0, -1)} not found.` });
            }
            console.log(`[Admin DELETE /${type}/${id}] Deletion successful. User: ${req.user?.id}`);
             // Optionally trigger cache invalidation
            res.status(204).send(); // No content on successful deletion
        } catch (err: unknown) {
            // Check for foreign key constraint violation (PostgreSQL code '23503')
            if (err instanceof Error && (err as any).code === '23503') {
                console.warn(`[Admin DELETE /${type}/${id}] Foreign key violation.`);
                return res.status(409).json({ error: `Cannot delete ${type.slice(0, -1)}: It is referenced by other items.` });
            }
             console.error(`[Admin DELETE /${type}/${id}] Error:`, err);
            next(err); // Pass other errors to the global handler
        }
    }
);

// POST /api/admin/bulk-add
router.post(
    '/bulk-add',
    validateBulkAdd, // Apply validation rules
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const { items } = req.body;
        const userId = req.user?.id; // Logged-in superuser performing the action
        console.log(`[Admin Bulk Add] Received ${items.length} items from user ${userId}`);
        try {
            // Call the model function to handle the bulk add logic
            const results = await AdminModel.bulkAddItems(items);

            // Add a summary message to the results
            results.message = `Bulk processing complete. Added: ${results.addedCount}, Skipped/Existed/Error: ${results.skippedCount}.`;

            // Optionally trigger cache invalidations based on added types
            if (results.addedCount > 0) {
                const typesAdded = new Set(results.details.filter((d: any) => d.status === 'added').map((d: any) => d.type + 's'));
                typesAdded.forEach(typeKey => {
                    if (ALLOWED_TYPES.includes(typeKey)) { // Ensure typeKey is valid
                        console.log(`[Admin Bulk Add] Invalidation recommended for adminData type: ${typeKey}`);
                         queryClient.invalidateQueries({ queryKey: ['adminData', { tab: typeKey }] }); // Example invalidation
                    }
                });
                console.log('[Admin Bulk Add] Invalidation recommended for trending/search');
                 queryClient.invalidateQueries({ queryKey: ['trendingData'] });
                 queryClient.invalidateQueries({ queryKey: ['trendingDataHome'] });
                 queryClient.invalidateQueries({ queryKey: ['searchResults'] });
            }

            res.status(200).json(results); // Send back detailed results
        } catch (err) {
             console.error(`[Admin Bulk Add] Error during bulk add operation:`, err);
            next(err); // Pass error to the global handler
        }
    }
);


export default router;