import * as AdminModel from '../../models/adminModel.js';
import * as UserModel from '../../models/userModel.js';
import db from '../../db/index.js';
import { logInfo, logError } from '../../utils/logger.js';
import {
  validateSuperuserAccess,
  getFormatterForResourceType,
  sendSuccessResponse,
  sendErrorResponse,
  createPagination,
  parsePaginationParams
} from './adminBaseController.js';

/**
 * Get all users with admin privileges
 */
export const getUsers = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const { page, limit, sort, order, filters } = parsePaginationParams(req.query);
    const result = await AdminModel.findAllResources('users', page, limit, sort, order, filters);
    
    const formatter = getFormatterForResourceType('users');
    const formattedData = Array.isArray(result.items) ? result.items.map(formatter) : [];
    
    sendSuccessResponse(res, formattedData, 'Users fetched successfully', result.pagination);
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch users');
  }
};

/**
 * Get user by ID with admin privileges
 */
export const getUserById = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'fetch user');
    }
    
    const item = await AdminModel.findResourceById('users', resourceId);
    if (!item) {
      return sendErrorResponse(res, `User with ID ${resourceId} not found.`, 404, 'fetch user');
    }
    
    const formatter = getFormatterForResourceType('users');
    sendSuccessResponse(res, formatter(item), 'User fetched successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'fetch user');
  }
};

/**
 * Update user with admin privileges
 */
export const updateUser = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'update user');
    }
    
    const updatedItem = await AdminModel.updateResource('users', resourceId, req.body);
    if (!updatedItem) {
      return sendErrorResponse(res, `User with ID ${resourceId} not found.`, 404, 'update user');
    }
    
    const formatter = getFormatterForResourceType('users');
    sendSuccessResponse(res, formatter(updatedItem), 'User updated successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'update user');
  }
};

/**
 * Delete user with admin privileges
 */
export const deleteUser = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    const resourceId = parseInt(req.params.id, 10);
    if (isNaN(resourceId)) {
      return sendErrorResponse(res, 'Invalid ID format. ID must be an integer.', 400, 'delete user');
    }
    
    const deletedItem = await AdminModel.deleteResource('users', resourceId);
    if (!deletedItem) {
      return sendErrorResponse(res, `User with ID ${resourceId} not found.`, 404, 'delete user');
    }
    
    sendSuccessResponse(res, null, 'User deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error, 500, 'delete user');
  }
};

/**
 * Promote user to superuser with admin privileges
 */
export const promoteUser = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminUserController] Attempting to promote user');
    const userId = parseInt(req.params.id, 10);
    
    if (isNaN(userId)) {
      return sendErrorResponse(res, 'Invalid user ID format. ID must be an integer.', 400, 'promote user');
    }
    
    // Check if user exists
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (user.rows.length === 0) {
      return sendErrorResponse(res, `User with ID ${userId} not found.`, 404, 'promote user');
    }
    
    // Update user role to superuser
    const result = await db.query(
      'UPDATE users SET role = $1, account_type = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      ['superuser', 'superuser', userId]
    );
    
    if (result.rows.length === 0) {
      return sendErrorResponse(res, 'Failed to promote user.', 500, 'promote user');
    }
    
    const formatter = getFormatterForResourceType('users');
    const promotedUser = formatter(result.rows[0]);
    
    logInfo(`User ${userId} promoted to superuser successfully`);
    sendSuccessResponse(res, promotedUser, 'User promoted to superuser successfully');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'promote user');
  }
};

/**
 * Bulk validate users
 */
export const bulkValidateUsers = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminUserController] Starting bulk user validation');
    const { users } = req.body;
    
    if (!users || !Array.isArray(users)) {
      return sendErrorResponse(res, 'Invalid users data provided', 400, 'validate users');
    }
    
    const results = { valid: [], invalid: [], warnings: [] };
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const rowNumber = i + 1;
      const errors = [];
      const warns = [];
      
      try {
        // Basic validation
        if (!user.email || !user.username) {
          errors.push('Email and username are required');
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (user.email && !emailRegex.test(user.email)) {
          errors.push('Invalid email format');
        }
        
        // Username validation
        if (user.username && user.username.length < 3) {
          errors.push('Username must be at least 3 characters long');
        }
        
        // Check for potential duplicates (this would need a more sophisticated check in real scenarios)
        if (user.email && user.email.length > 100) {
          warns.push('Email address is quite long');
        }
        
        if (user.role && !['user', 'admin', 'superuser'].includes(user.role)) {
          warns.push(`Unknown role "${user.role}" - will default to "user"`);
        }
        
        if (errors.length > 0) {
          results.invalid.push({
            rowNumber,
            original: user,
            errors
          });
        } else {
          // Create resolved data
          const resolved = {
            email: user.email.toLowerCase().trim(),
            username: user.username.trim(),
            full_name: user.full_name ? user.full_name.trim() : '',
            role: user.role || 'user',
            account_type: user.account_type || 'user'
          };
          
          const validItem = {
            rowNumber,
            original: user,
            resolved
          };
          
          if (warns.length > 0) {
            results.warnings.push({
              ...validItem,
              warnings: warns
            });
          }
          
          results.valid.push(validItem);
        }
        
      } catch (error) {
        results.invalid.push({
          rowNumber,
          original: user,
          errors: [`Processing error: ${error.message}`]
        });
      }
    }
    
    logInfo(`User validation complete: ${results.valid.length} valid, ${results.invalid.length} invalid, ${results.warnings.length} warnings`);
    
    sendSuccessResponse(res, {
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings,
      summary: {
        total: users.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        warnings: results.warnings.length
      }
    }, 'User validation completed');
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'validate users');
  }
};

/**
 * Bulk add users
 */
export const bulkAddUsers = async (req, res) => {
  if (!validateSuperuserAccess(req, res)) return;
  
  try {
    logInfo('[AdminUserController] Starting bulk add users');
    const { users } = req.body;
    
    if (!users || !Array.isArray(users)) {
      return sendErrorResponse(res, 'Invalid users data provided', 400, 'bulk add users');
    }
    
    const results = {
      success: 0,
      failed: 0,
      total: users.length,
      errors: []
    };
    
    // Process each user
    for (const user of users) {
      try {
        // Basic validation
        if (!user.email || !user.username) {
          results.failed++;
          results.errors.push(`Missing required fields for user: ${user.email || user.username || 'Unknown'}`);
          continue;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user.email)) {
          results.failed++;
          results.errors.push(`Invalid email format for user: ${user.email}`);
          continue;
        }
        
        const userData = {
          email: user.email.toLowerCase().trim(),
          username: user.username.trim(),
          full_name: user.full_name ? user.full_name.trim() : '',
          role: user.role || 'user',
          account_type: user.account_type || 'user',
          // Note: In a real scenario, you'd need to handle password creation/hashing
          password_hash: 'TEMP_PLACEHOLDER' // This would need proper implementation
        };
        
        await UserModel.createUser(userData);
        results.success++;
        
      } catch (error) {
        logError(`Error adding user ${user.email}:`, error);
        results.failed++;
        results.errors.push(`Failed to add ${user.email}: ${error.message}`);
      }
    }
    
    logInfo(`Bulk user add completed: ${results.success} success, ${results.failed} failed`);
    
    // Clear cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    sendSuccessResponse(res, results, `Bulk add completed: ${results.success} added, ${results.failed} failed`);
    
  } catch (error) {
    sendErrorResponse(res, error, 500, 'bulk add users');
  }
}; 