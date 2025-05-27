// Filename: /root/doof-backend/controllers/userController.js
/* REFACTORED: Convert to ES Modules */
import UserModel from '../models/userModel.js'; // Use default import
import { formatUser } from '../utils/formatters.js'; // Ensure this formatter exists and is exported namedly
import { validationResult } from 'express-validator';

// Controller to get user profile
export const getUserProfile = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { 
        return res.status(400).json({ success: false, errors: errors.array() }); 
    }
    
    const { identifier } = req.params;
    try {
        let user;
        const isNumericId = /^\d+$/.test(identifier);
        
        if (isNumericId) { 
            user = await UserModel.findUserById(parseInt(identifier, 10)); 
        } else { 
            user = await UserModel.findByUsername(identifier); 
        }
        
        if (!user) { 
            return res.status(404).json({ 
                success: false, 
                message: `User '${identifier}' not found.` 
            }); 
        }
        
        const publicProfile = formatUser(user);
        res.json({ 
            success: true, 
            message: 'User profile retrieved successfully.', 
            data: publicProfile 
        });
    } catch (error) { 
        console.error('Error in getUserProfile:', error);
        next(error); 
    }
};

/**
 * Update user's password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateUserPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = parseInt(req.params.id, 10);

  try {
    // Get the user by ID
    const user = await UserModel.findUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isMatch = await UserModel.comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password in the database
    await UserModel.updateUserPassword(userId, newHashedPassword);

    res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating password',
      error: error.message 
    });
  }
};

// Add other controllers using named exports