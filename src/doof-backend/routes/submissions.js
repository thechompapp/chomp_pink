// src/doof-backend/routes/submissions.js
import express from 'express';
import { param, validationResult } from 'express-validator';
// Corrected imports:
import db from '../db/index.js';

const router = express.Router();

// Validation middleware
const validateSubmissionId = [
  param('id').isInt({ min: 1 }).withMessage('Submission ID must be a positive integer'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Submissions Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// GET /api/submissions?status=pending (or other status)
router.get('/', async (req, res, next) => {
  const status = req.query.status || 'pending'; // Default to pending if not specified
  // Use db instance from app context if available, otherwise use direct import
  const currentDb = req.app?.get('db') || db;
  // Basic validation for status query param
  if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value. Use 'pending', 'approved', or 'rejected'." });
  }
  try {
    const query = `
      SELECT id, user_id, type, name, location, city, neighborhood, tags, place_id, created_at
      FROM Submissions
      WHERE status = $1 -- Use parameter binding for status
      ORDER BY created_at DESC
    `;
    const result = await currentDb.query(query, [status]);
    res.json(result.rows || []); // Ensure an array is always returned
  } catch (err) {
    console.error(`[Submissions GET /?status=${status}] Error:`, err);
    next(err); // Pass error to central handler
  }
});

// POST /api/submissions
router.post('/', async (req, res, next) => {
  const { type, name, location, city, neighborhood, tags, place_id } = req.body;
  // Use db instance from app context if available, otherwise use direct import
  const currentDb = req.app?.get('db') || db;
  // Basic validation (could use express-validator for more robustness)
  if (!type || !name || !['restaurant', 'dish'].includes(type)) {
      return res.status(400).json({ error: "Invalid submission data: 'type' and 'name' are required." });
  }
  try {
    const query = `
      INSERT INTO Submissions (type, name, location, city, neighborhood, tags, place_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    // Ensure tags is an array, default to empty if null/undefined
    const cleanTags = Array.isArray(tags) ? tags : [];
    const values = [type, name, location || null, city || null, neighborhood || null, cleanTags, place_id || null];
    const result = await currentDb.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[Submissions POST /] Error:', err);
    next(err); // Pass error to central handler
  }
});

// POST /api/submissions/:id/approve
router.post('/:id/approve', validateSubmissionId, handleValidationErrors, async (req, res, next) => {
  const { id } = req.params;
  // Use db instance from app context if available, otherwise use direct import
  const currentDb = req.app?.get('db') || db;
  try {
    const query = `
      UPDATE Submissions
      SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const result = await currentDb.query(query, [id]);
    if (result.rows.length === 0) {
      // Check if it exists but wasn't pending
      const check = await currentDb.query('SELECT status FROM Submissions WHERE id = $1', [id]);
      if (check.rows.length > 0) {
          return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).`});
      } else {
          return res.status(404).json({ error: 'Submission not found' });
      }
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`[Submissions POST /:id/approve] Error approving submission ${id}:`, err);
    next(err); // Pass error to central handler
  }
});

// POST /api/submissions/:id/reject
router.post('/:id/reject', validateSubmissionId, handleValidationErrors, async (req, res, next) => {
  const { id } = req.params;
  // Use db instance from app context if available, otherwise use direct import
  const currentDb = req.app?.get('db') || db;
  try {
    const query = `
      UPDATE Submissions
      SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const result = await currentDb.query(query, [id]);
     if (result.rows.length === 0) {
       // Check if it exists but wasn't pending
       const check = await currentDb.query('SELECT status FROM Submissions WHERE id = $1', [id]);
       if (check.rows.length > 0) {
           return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).`});
       } else {
           return res.status(404).json({ error: 'Submission not found' });
       }
     }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`[Submissions POST /:id/reject] Error rejecting submission ${id}:`, err);
    next(err); // Pass error to central handler
  }
});

// Corrected export statement
export default router;