// Filename: /root/doof-backend/controllers/submissionController.js
/* REFACTORED: Convert to ES Modules */
/* FIXED: Removed incorrect formatSubmission import from formatters.js */
import SubmissionModel from '../models/submissionModel.js'; // Use default import
import { validationResult } from 'express-validator';
import config from '../config/config.js';

const handleControllerError = (res, error, message, statusCode = 500) => {
    console.error(message, error);
    res.status(statusCode).json({ success: false, message: error.message || 'Server error.' });
};

// Controller to get user submissions
export const getUserSubmissions = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const userId = req.user.id;
    const { status, page = 1, limit = config.DEFAULT_PAGE_LIMIT ?? 10 } = req.query;
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const offset = (pageNum - 1) * limitNum;
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) { return res.status(400).json({ success: false, message: `Invalid status filter.` }); }
    try {
        // Model uses default export, call method on it
        const results = await SubmissionModel.findSubmissionsByUserId(userId, status); // Model handles formatting
        res.json({ success: true, message: 'User submissions retrieved.', data: results });
    } catch (error) { handleControllerError(res, error, `Error fetching submissions for user ${userId}`); }
};

// Controller to create a new submission
export const createSubmission = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array({ onlyFirstError: true }).map(e => ({ msg: e.msg, param: e.path })) }); }
    const userId = req.user.id;
    try {
        const newSubmission = await SubmissionModel.createSubmission({ ...req.body, user_id: userId }); // Pass user_id explicitly
        res.status(201).json({ success: true, message: 'Submission received successfully.', data: newSubmission });
    } catch (error) { handleControllerError(res, error, `Error creating submission for user ${userId}`); }
};