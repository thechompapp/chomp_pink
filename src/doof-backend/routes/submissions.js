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

// GET /api/submissions
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, user_id, type, name, location, city, neighborhood, tags, place_id, created_at
      FROM Submissions
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);
    console.log(`[Submissions GET /] Fetched ${result.rows.length} pending submissions.`);
    res.json(result.rows);
  } catch (err) {
    console.error('[Submissions GET /] Error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions', details: err.message });
  }
});

// POST /api/submissions
router.post('/', async (req, res) => {
  const { type, name, location, city, neighborhood, tags, place_id } = req.body;
  try {
    const query = `
      INSERT INTO Submissions (type, name, location, city, neighborhood, tags, place_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const values = [type, name, location || null, city || null, neighborhood || null, tags || [], place_id || null];
    const result = await db.query(query, values);
    console.log('[Submissions POST /] Submission created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[Submissions POST /] Error:', err);
    res.status(500).json({ error: 'Failed to create submission', details: err.message });
  }
});

// POST /api/submissions/:id/approve
router.post('/:id/approve', validateSubmissionId, handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  console.log(`[Submissions POST /:id/approve] Approving submission ID: ${id}`);
  try {
    const query = `
      UPDATE Submissions
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or already processed' });
    }
    console.log(`[Submissions POST /:id/approve] Submission ${id} approved.`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`[Submissions POST /:id/approve] Error approving submission ${id}:`, err);
    res.status(500).json({ error: 'Failed to approve submission', details: err.message });
  }
});

// POST /api/submissions/:id/reject
router.post('/:id/reject', validateSubmissionId, handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  console.log(`[Submissions POST /:id/reject] Rejecting submission ID: ${id}`);
  try {
    const query = `
      UPDATE Submissions
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found or already processed' });
    }
    console.log(`[Submissions POST /:id/reject] Submission ${id} rejected.`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`[Submissions POST /:id/reject] Error rejecting submission ${id}:`, err);
    res.status(500).json({ error: 'Failed to reject submission', details: err.message });
  }
});

module.exports = router;