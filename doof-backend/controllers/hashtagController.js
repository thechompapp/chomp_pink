// Filename: /root/doof-backend/controllers/hashtagController.js
import { query, validationResult } from 'express-validator';
import * as HashtagModel from '../models/hashtagModel.js';

const handleControllerError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ success: false, message: error.message || message });
};

// Validation middleware for getTopHashtags
export const validateGetTopHashtags = [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be between 1 and 50.'),
];

// Controller to get top hashtags
export const getTopHashtags = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  const { limit = 15 } = req.query;
  try {
    const hashtags = await HashtagModel.getTopHashtags(limit);
    res.json({
      success: true,
      message: `Top ${limit} hashtags retrieved successfully.`,
      data: hashtags,
    });
  } catch (error) {
    handleControllerError(res, error, `Error fetching top hashtags`);
  }
};