/* src/doof-backend/routes/admin.js */
import express from 'express';
import { param, query, body, validationResult } from 'express-validator';
// Import relevant models
import * as AdminModel from '../models/adminModel.js';
import * as SubmissionModel from '../models/submissionModel.js';
// Keep db import for potentially complex queries not moved to models
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

// --- Constants ---
const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users'];
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags']; // Users not deleted via generic route
const DEFAULT_PAGE_LIMIT = 25;

// Map API type to DB table name
const typeToTable = {
    submissions: 'submissions',
    restaurants: 'restaurants',
    dishes: 'dishes',
    lists: 'lists',
    hashtags: 'hashtags',
    users: 'users',
};

// --- Middleware ---
const handleValidationErrors = (req, res, next) => { /* ... (same as before) ... */ };
router.use(authMiddleware);
router.use(requireSuperuser);

// --- Validation Chains ---
const validateTypeParam = [
    param('type').isIn(ALLOWED_TYPES).withMessage('Invalid resource type specified'),
    // Attach table name and resource type to request for later use
    (req, res, next) => {
        req.resourceType = req.params.type; // e.g., 'submissions'
        req.tableName = typeToTable[req.params.type]; // e.g., 'Submissions'
        if (!req.tableName) {
            return res.status(400).json({ error: 'Invalid resource type mapping.' });
        }
        next();
    }
];
const validateIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('ID must be a positive integer').toInt()
];
const validateSortQuery = [
    query('sort').optional().isString().matches(/^[a-zA-Z0-9_.]+_(asc|desc)$/).withMessage('Invalid sort format (column_direction)')
];
const validateGetListQuery = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200').toInt(),
    query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search term too long'),
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status filter'),
    // Add other potential filters like list_type, category here
];
const validateBulkAdd = [
    body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
    body('items.*.type').isIn(['restaurant', 'dish']).withMessage('Invalid item type in bulk add'),
    body('items.*.name').trim().notEmpty().withMessage('Item name is required').isLength({ max: 255 }),
    // Add more specific validation per item type if needed
];

// GET /api/admin/:type (Fetch resources with pagination, sorting, filtering, search)
router.get("/:type", validateTypeParam, validateSortQuery, validateGetListQuery, handleValidationErrors, async (req, res, next) => {
    const currentDb = req.app?.get('db') || db;
    const { tableName, resourceType } = req;
    const {
        page = 1,
        limit = DEFAULT_PAGE_LIMIT,
        sort, // e.g., 'name_asc' or 'created_at_desc'
        search,
        status, // Only relevant for submissions
        // Add other filters here (e.g., list_type, category)
    } = req.query;

    const offset = (page - 1) * limit;
    let sortColumn = 'created_at'; // Default sort
    let sortDirection = 'DESC';
    if (sort) {
        [sortColumn, sortDirection] = sort.toLowerCase().split('_');
        // Basic validation: prevent obviously invalid column names? More robust validation needed if complex.
        if (!/^[a-z0-9_.]+$/.test(sortColumn)) {
             return res.status(400).json({ error: 'Invalid sort column specified.' });
        }
    }

    // Base query parts
    let selectFields = `${tableName}.*`;
    let joins = '';
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Add type-specific joins or select fields
     if (resourceType === 'dishes') {
        selectFields += ', restaurants.name as restaurant_name';
        joins += ' JOIN restaurants ON dishes.restaurant_id = restaurants.id';
    } else if (resourceType === 'submissions') {
         selectFields += ', users.username as user_handle';
         joins += ' LEFT JOIN users ON submissions.user_id = users.id';
    } else if (resourceType === 'lists') {
        selectFields += ', users.username as creator_handle'; // Use alias from setup.sql
        joins += ' LEFT JOIN users ON lists.user_id = users.id';
         // Add list_type filter if needed
         // if (req.query.list_type && req.query.list_type !== 'all') { ... }
    } else if (resourceType === 'hashtags') {
         // Add category filter if needed
         // if (req.query.category && req.query.category !== 'all') { ... }
    }


    // Add search condition (simple ILIKE on name/title/username/email for now)
    if (search) {
        let searchField = 'name'; // Default search field
        if (resourceType === 'users') searchField = 'username'; // Or search email too?
        else if (resourceType === 'hashtags') searchField = 'name';
        // Add more specific search fields if needed
        whereConditions.push(`${tableName}.${searchField} ILIKE $${paramIndex++}`);
        queryParams.push(`%${search}%`);
    }

     // Add status filter for submissions
     if (resourceType === 'submissions' && status) {
        whereConditions.push(`${tableName}.status = $${paramIndex++}`);
        queryParams.push(status);
    }

    // Construct WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Use double quotes for column names if needed (e.g., case sensitivity or keywords)
    // Ensure sortColumn is safe before injecting (basic check done above)
    const orderByClause = `ORDER BY "${sortColumn}" ${sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'} NULLS LAST`;

    // Construct final queries
    const dataQuery = `SELECT ${selectFields} FROM ${tableName} ${joins} ${whereClause} ${orderByClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    const countQuery = `SELECT COUNT(*) FROM ${tableName} ${joins} ${whereClause}`;

    // Add limit and offset to data query params
    const dataParams = [...queryParams, limit, offset];
    const countParams = [...queryParams]; // Count query doesn't use limit/offset

    console.log(`[Admin GET /${resourceType}] Data Query: ${dataQuery}`);
    console.log(`[Admin GET /${resourceType}] Data Params:`, dataParams);
    console.log(`[Admin GET /${resourceType}] Count Query: ${countQuery}`);
    console.log(`[Admin GET /${resourceType}] Count Params:`, countParams);


    try {
        const [dataResult, countResult] = await Promise.all([
            currentDb.query(dataQuery, dataParams), // Use dataParams
            currentDb.query(countQuery, countParams) // Use countParams
        ]);

        const totalItems = parseInt(countResult.rows[0].count, 10) || 0;
        const totalPages = Math.ceil(totalItems / limit);

        res.json({
            data: dataResult.rows || [],
            pagination: {
                total: totalItems,
                page: page,
                limit: limit,
                totalPages: totalPages,
            }
        });
    } catch (err) {
        console.error(`[Admin GET /${resourceType}] Error fetching data:`, err);
        next(err);
    }
});

// POST /api/admin/submissions/:id/approve
router.post('/submissions/:id/approve', validateIdParam, handleValidationErrors, async (req, res, next) => {
    const { id } = req.params;
    try {
        const updatedSubmission = await SubmissionModel.updateSubmissionStatus(id, 'approved', req.user.id); // Use Model
        if (!updatedSubmission) {
             const currentSub = await SubmissionModel.findSubmissionById(id);
             if (currentSub) return res.status(409).json({ error: `Submission ${id} already processed (status: ${currentSub.status}).`});
             else return res.status(404).json({ error: 'Submission not found.' });
        }
        console.log(`[Admin Action] Submission ${id} approved. Consider invalidating caches.`);
        // TODO: Trigger creation of actual restaurant/dish from submission data here or via a separate service/job
        res.json({ data: updatedSubmission }); // Standard response
    } catch (err) { next(err); }
});

// POST /api/admin/submissions/:id/reject
router.post('/submissions/:id/reject', validateIdParam, handleValidationErrors, async (req, res, next) => {
    const { id } = req.params;
    try {
        const updatedSubmission = await SubmissionModel.updateSubmissionStatus(id, 'rejected', req.user.id); // Use Model
         if (!updatedSubmission) {
             const currentSub = await SubmissionModel.findSubmissionById(id);
             if (currentSub) return res.status(409).json({ error: `Submission ${id} already processed (status: ${currentSub.status}).`});
             else return res.status(404).json({ error: 'Submission not found.' });
         }
        console.log(`[Admin Action] Submission ${id} rejected. Consider invalidating caches.`);
        res.json({ data: updatedSubmission }); // Standard response
    } catch (err) { next(err); }
});

// DELETE /api/admin/:type/:id
router.delete('/:type/:id', validateTypeParam, validateIdParam, handleValidationErrors, async (req, res, next) => {
    const { type, id } = req.params;
    if (!ALLOWED_MUTATE_TYPES.includes(type)) {
        return res.status(400).json({ error: `Deletion not allowed for resource type: ${type}.` });
    }
    try {
        // Use req.tableName which was set in validateTypeParam middleware
        const deleted = await AdminModel.deleteResourceById(req.tableName, id); // Use Model
        if (!deleted) {
            return res.status(404).json({ error: `${req.resourceType.slice(0, -1)} not found.` });
        }
         console.log(`[Admin DELETE /${type}/${id}] Deletion successful. Consider cache invalidation.`);
         // Invalidate relevant caches
         queryClient?.invalidateQueries({ queryKey: ['adminData', type] });
         // Invalidate other potentially affected queries
         if (type === 'lists') queryClient?.invalidateQueries({ queryKey: ['listDetails'] });
         if (type === 'restaurants') queryClient?.invalidateQueries({ queryKey: ['restaurantDetails'] });
         // etc.

        res.status(204).send();
    } catch (err) {
         if (err.code === '23503') { // Foreign key violation
             return res.status(409).json({ error: `Cannot delete ${type.slice(0, -1)}: It is referenced by other items.` });
         }
        next(err);
    }
});

// POST /api/admin/bulk-add
router.post('/bulk-add', validateBulkAdd, handleValidationErrors, async (req, res, next) => {
    const { items } = req.body;
    try {
        const results = await AdminModel.bulkAddItems(items); // Use Model
        results.message = `Bulk processing complete. Added: ${results.addedCount}, Skipped/Existed/Error: ${results.skippedCount}.`;

         // Invalidate relevant admin tables if items were added
         if (results.addedCount > 0) {
             const typesAdded = new Set(results.details.filter(d => d.status === 'added').map(d => d.type + 's')); // e.g., {'restaurants', 'dishes'}
             typesAdded.forEach(typeKey => {
                 queryClient?.invalidateQueries({ queryKey: ['adminData', typeKey] });
             });
             // Also potentially invalidate trending/search
             queryClient?.invalidateQueries({ queryKey: ['trendingData'] });
             queryClient?.invalidateQueries({ queryKey: ['searchResults'] });
         }

        res.status(200).json(results); // Return detailed results
    } catch (err) {
        // Model should throw generic error on transaction failure
        next(err);
    }
});

// PUT /api/admin/:type/:id (Generic Update - Placeholder)
// Needs specific implementation per type, likely calling model functions
// Example: PUT /api/admin/restaurants/:id
// router.put('/:type/:id', validateTypeParam, validateIdParam, /* add body validation */ handleValidationErrors, async (req, res, next) => {
//    if (!ALLOWED_MUTATE_TYPES.includes(req.params.type)) {
//         return res.status(400).json({ error: `Updates not allowed for resource type: ${req.params.type}.` });
//    }
//    // ... find resource, check permissions, call appropriate model update function ...
//    res.status(501).json({ error: `Update for ${req.params.type} not implemented yet.` });
// });

// POST /api/admin/:type (Generic Create - Placeholder)
// Needs specific implementation per type, likely calling model functions
// router.post('/:type', validateTypeParam, /* add body validation */ handleValidationErrors, async (req, res, next) => {
//      if (!ALLOWED_MUTATE_TYPES.includes(req.params.type)) {
//          return res.status(400).json({ error: `Creation not allowed for resource type: ${req.params.type}.` });
//      }
//     // ... call appropriate model create function ...
//     res.status(501).json({ error: `Creation for ${req.params.type} not implemented yet.` });
// });


export default router;