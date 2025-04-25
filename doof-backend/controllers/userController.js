// Filename: /root/doof-backend/controllers/userController.js
/* REFACTORED: Convert to ES Modules */
import * as UserModel from '../models/userModel.js'; // Use namespace import
import { formatUser } from '../utils/formatters.js'; // Ensure this formatter exists and is exported namedly
import { validationResult } from 'express-validator';

// Controller to get user profile
export const getUserProfile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ success: false, errors: errors.array() }); }
    const { identifier } = req.params;
    try {
        let user;
        const isNumericId = /^\d+$/.test(identifier);
        if (isNumericId) { user = await UserModel.findUserById(parseInt(identifier, 10)); }
        else { user = await UserModel.findUserByUsername(identifier); }
        if (!user) { return res.status(404).json({ success: false, message: `User '${identifier}' not found.` }); }
        const publicProfile = formatUser(user); // Use formatter from utils
        res.json({ success: true, message: 'User profile retrieved successfully.', data: publicProfile });
    } catch (error) { next(error); }
};

// Add other controllers using named exports