// src/doof-backend/routes/submissions.js
const express = require('express');
const db = require('../db');
const { param, validationResult } = require('express-validator');

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
router.get('/', async (req, res, next) => { // Added next
  const status = req.query.status || 'pending'; // Default to pending if not specified
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
    const result = await db.query(query, [status]); // Pass status as parameter
    // Removed console log
    res.json(result.rows);
  } catch (err) {
    console.error(`[Submissions GET /?status=${status}] Error:`, err);
    next(err); // Pass error to central handler
  }
});

// POST /api/submissions
router.post('/', async (req, res, next) => { // Added next
  const { type, name, location, city, neighborhood, tags, place_id } = req.body;
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
    const values = [type, name, location || null, city || null, neighborhood || null, tags || [], place_id || null];
    const result = await db.query(query, values);
    // Removed console log
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[Submissions POST /] Error:', err);
    next(err); // Pass error to central handler
  }
});

// POST /api/submissions/:id/approve
router.post('/:id/approve', validateSubmissionId, handleValidationErrors, async (req, res, next) => { // Added next
  const { id } = req.params;
  // Removed console log
  try {
    const query = `
      UPDATE Submissions
      SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP -- Changed updated_at to reviewed_at
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      // Check if it exists but wasn't pending
      const check = await db.query('SELECT status FROM Submissions WHERE id = $1', [id]);
      if (check.rows.length > 0) {
          return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).`});
      } else {
          return res.status(404).json({ error: 'Submission not found' });
      }
    }
    // Removed console log
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`[Submissions POST /:id/approve] Error approving submission ${id}:`, err);
    next(err); // Pass error to central handler
  }
});

// POST /api/submissions/:id/reject
router.post('/:id/reject', validateSubmissionId, handleValidationErrors, async (req, res, next) => { // Added next
  const { id } = req.params;
  // Removed console log
  try {
    const query = `
      UPDATE Submissions
      SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP -- Changed updated_at to reviewed_at
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const result = await db.query(query, [id]);
     if (result.rows.length === 0) {
       // Check if it exists but wasn't pending
       const check = await db.query('SELECT status FROM Submissions WHERE id = $1', [id]);
       if (check.rows.length > 0) {
           return res.status(409).json({ error: `Submission ${id} already processed (status: ${check.rows[0].status}).`});
       } else {
           return res.status(404).json({ error: 'Submission not found' });
       }
     }
    // Removed console log
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`[Submissions POST /:id/reject] Error rejecting submission ${id}:`, err);
    next(err); // Pass error to central handler
  }
});

module.exports = router;