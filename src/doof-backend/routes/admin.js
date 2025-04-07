// src/doof-backend/routes/admin.js
import express from 'express';
import { param, query, body, validationResult } from 'express-validator';
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';
// REMOVED incorrect import: import { submissionService } from '../../services/submissionService.js';

const router = express.Router();

// --- Constants and Configuration ---
const ALLOWED_ADMIN_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'submissions'];
const ALLOWED_MUTATE_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags'];
const allowedSortColumns = { /* ... (same as before) ... */ };
const defaultSort = { /* ... (same as before) ... */ };
const updatableFields = { /* ... (same as before) ... */ };
const fieldTypes = { /* ... (same as before) ... */ };
const listTypeOptions = ['mixed', 'restaurant', 'dish'];


// --- Middleware ---
const validateTypeParam = (req, res, next) => { /* ... (same as before) ... */ };
const validateIdParam = [ /* ... (same as before) ... */ ];
const handleValidationErrors = (req, res, next) => { /* ... (same as before) ... */ };
const validateSortQuery = (req, res, next) => { /* ... (same as before) ... */ };
const validateBulkAdd = [ /* ... (same as before) ... */ ];
const requireSuperuser = async (req, res, next) => { /* ... (same as before) ... */ };
const validateUpdateBody = (req, res, next) => { /* ... (same as before) ... */ };


// --- Routes ---

// GET /api/admin/:type (Read) - Modified to handle submissions directly
router.get(
    "/:type",
    authMiddleware, requireSuperuser, validateTypeParam, validateSortQuery,
    async (req, res, next) => {
        const currentDb = req.app?.get('db') || db;
        const sortColumn = req.validSortColumn;
        const sortDirection = req.validSortDirection;
        const safeSortColumn = /^[a-z0-9_]+$/.test(sortColumn) ? `"${sortColumn}"` : null;
        if (!safeSortColumn) {
             console.error(`[Admin GET /:type] Invalid sort column derived: ${sortColumn}`);
             return res.status(400).json({ error: 'Invalid sort parameter.'});
        }
        const orderBy = `${safeSortColumn} ${sortDirection}`;

        try {
            let query;
            const tableName = req.tableName;

            if (req.resourceType === 'dishes') { /* ... (query as before) ... */ }
            else if (req.resourceType === 'lists') { /* ... (query as before) ... */ }
            else if (req.resourceType === 'restaurants') { /* ... (query as before) ... */ }
            else if (req.resourceType === 'submissions') {
                 // Directly query submissions table, filter by status=pending
                 query = `SELECT * FROM "Submissions" WHERE status = 'pending' ORDER BY ${orderBy}`;
            }
             else { // Hashtags, etc.
                query = `SELECT * FROM "${tableName}" ORDER BY ${orderBy}`;
            }

            console.log(`[Admin GET /${req.params.type}] Executing Query: ${query}`);
            const result = await currentDb.query(query);
            res.json(result.rows || []);
        } catch (err) {
            console.error(`[Admin GET /${req.params.type}] Database query error:`, err);
            next(err);
        }
    }
);

// *** NEW: Submission Approve/Reject Endpoints (moved logic here) ***
// POST /api/admin/submissions/:id/approve
router.post(
    '/submissions/:id/approve', // Changed route to be more specific
    authMiddleware,
    requireSuperuser,
    validateIdParam, // Validate the submission ID
    handleValidationErrors,
    async (req, res, next) => {
        const { id } = req.params;
        const currentDb = req.app?.get('db') || db;
        // Optional: Add reviewer ID (req.user.id) later
        try {
            const query = `
                UPDATE "Submissions"
                SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND status = 'pending'
                RETURNING *
            `;
            const result = await currentDb.query(query, [id]);
            if (result.rows.length === 0) {
                const check = await currentDb.query('SELECT status FROM "Submissions" WHERE id = $1', [id]);
                if (check.rows.length > 0) {
                    return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).`});
                } else {
                    return res.status(404).json({ error: 'Submission not found.' });
                }
            }
            console.log(`[Admin POST /submissions/${id}/approve] Submission approved.`);
            // TODO: Add logic here to potentially create the actual restaurant/dish based on the approved submission data
            res.json(result.rows[0]);
        } catch (err) {
            console.error(`[Admin POST /submissions/${id}/approve] Error approving submission:`, err);
            next(err);
        }
});

// POST /api/admin/submissions/:id/reject
router.post(
    '/submissions/:id/reject', // Changed route to be more specific
    authMiddleware,
    requireSuperuser,
    validateIdParam, // Validate the submission ID
    handleValidationErrors,
    async (req, res, next) => {
        const { id } = req.params;
        const currentDb = req.app?.get('db') || db;
         // Optional: Add reviewer ID (req.user.id) later
        try {
            const query = `
                UPDATE "Submissions"
                SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND status = 'pending'
                RETURNING *
            `;
            const result = await currentDb.query(query, [id]);
            if (result.rows.length === 0) {
               const check = await currentDb.query('SELECT status FROM "Submissions" WHERE id = $1', [id]);
               if (check.rows.length > 0) {
                   return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).`});
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
});


// PUT /api/admin/:type/:id (Update)
router.put(
    '/:type/:id',
    authMiddleware, requireSuperuser, validateTypeParam, validateIdParam, validateUpdateBody, handleValidationErrors,
    async (req, res, next) => { /* ... (same as before) ... */ }
);

// DELETE /api/admin/:type/:id (Delete)
router.delete(
    '/:type/:id',
    authMiddleware, requireSuperuser, validateTypeParam, validateIdParam, handleValidationErrors,
    async (req, res, next) => { /* ... (same as before) ... */ }
);

// POST /api/admin/bulk-add (Bulk Create)
router.post(
    '/bulk-add',
    authMiddleware, requireSuperuser, validateBulkAdd, handleValidationErrors,
    async (req, res, next) => { /* ... (same as before) ... */ }
);


export default router;