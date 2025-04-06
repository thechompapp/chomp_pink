// src/doof-backend/routes/users.js
import express from 'express';
import { param, validationResult } from 'express-validator';
// Corrected imports using relative paths:
import db from '../db/index.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateUserId = [
  param('userId').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Users Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Route handler for GET /:userId/profile
router.get('/:userId/profile', authMiddleware, validateUserId, handleValidationErrors, async (req, res, next) => {
  console.log(`[Users] Handling GET /api/users/${req.params.userId}/profile for userId: ${req.params.userId}`);
  const { userId } = req.params;
  // Use db instance from app context if available, otherwise use direct import
  const currentDb = req.app?.get('db') || db;

  try {
    // Check if user exists
    const userCheck = await currentDb.query('SELECT id FROM Users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      console.log(`[Users] User with ID ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch profile counts concurrently
    const [
        listsCreatedResult,
        listsFollowingResult,
        dishesFollowingResult, // Assuming this uses DishVotes based on schema
        restaurantsFollowingResult // Placeholder logic - revisit if needed
    ] = await Promise.all([
      currentDb.query('SELECT COUNT(*) FROM Lists WHERE user_id = $1', [userId]),
      currentDb.query('SELECT COUNT(*) FROM ListFollows WHERE user_id = $1', [userId]),
      currentDb.query("SELECT COUNT(*) FROM DishVotes WHERE user_id = $1 AND vote_type = 'up'", [userId]),
      currentDb.query('SELECT COUNT(*) FROM Submissions WHERE user_id = $1 AND type = $2 AND status = $3', [userId, 'restaurant', 'approved']), // Example placeholder - adjust as needed
    ]);

    // Construct profile data object
    const profileData = {
      listsCreated: parseInt(listsCreatedResult.rows[0].count, 10) || 0,
      listsFollowing: parseInt(listsFollowingResult.rows[0].count, 10) || 0,
      dishesFollowing: parseInt(dishesFollowingResult.rows[0].count, 10) || 0,
      restaurantsFollowing: parseInt(restaurantsFollowingResult.rows[0].count, 10) || 0, // Revisit this logic
    };

    console.log(`[Users] Successfully fetched profile data for userId ${userId}:`, profileData);
    res.json(profileData); // Send the profile data as JSON response
  } catch (err) {
    console.error('[Users /profile] Error:', err);
    next(err); // Pass errors to the central error handler
  }
});

// Export the router
export default router;