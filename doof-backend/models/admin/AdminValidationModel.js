import db from '../../db/index.js';
import format from 'pg-format';
import { 
  getResourceConfig, 
  logAdminOperation, 
  createAdminModelError
} from './AdminBaseModel.js';
import { identityFormatter } from '../../utils/formatters.js';
import { 
  updateResource, 
  createResource, 
  findResourceById 
} from './AdminResourceManager.js';
import { 
  getChangesByIds 
} from './AdminDataAnalyzer.js';

/**
 * AdminValidationModel - Handles validation rules and change application
 * Provides comprehensive validation and change management functionality
 */

/**
 * Applies approved changes to resources
 * @param {string} resourceType - Type of resource
 * @param {Array} changesToApply - Array of change objects to apply
 * @param {object} options - Additional options for application
 * @returns {Promise<object>} Results of change application
 */
export const applyChanges = async (resourceType, changesToApply, options = {}) => {
  const client = await db.getClient();
  const results = { successCount: 0, failureCount: 0, errors: [], appliedChanges: [] };

  try {
    await client.query('BEGIN');
    
    logAdminOperation('info', 'applyChanges', resourceType, `Starting application of ${changesToApply.length} changes`);

    for (const change of changesToApply) {
      try {
        const appliedChange = await applySingleChange(change, options);
        if (appliedChange) {
          results.appliedChanges.push(appliedChange);
          results.successCount++;
        }
      } catch (changeError) {
        results.failureCount++;
        results.errors.push({
          changeId: change.changeId,
          error: changeError.message,
          change: change
        });
        
        logAdminOperation('warn', 'applyChanges', resourceType, 
          `Failed to apply change ${change.changeId}`, { error: changeError.message });
      }
    }

    if (results.failureCount > 0 && results.successCount === 0) {
      await client.query('ROLLBACK');
      logAdminOperation('warn', 'applyChanges', resourceType, 'All changes failed, rolling back transaction');
    } else {
      await client.query('COMMIT');
      logAdminOperation('info', 'applyChanges', resourceType, 
        `Applied ${results.successCount} changes successfully, ${results.failureCount} failed`);
    }

    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    logAdminOperation('error', 'applyChanges', resourceType, 'Critical error during change application', { error: error.message });
    throw createAdminModelError('applyChanges', resourceType, error);
  } finally {
    client.release();
  }
};

/**
 * Applies a single change to a resource
 * @param {object} change - Change object containing details
 * @param {object} options - Application options
 * @returns {Promise<object>} Applied change result
 */
const applySingleChange = async (change, options = {}) => {
  try {
    const { resourceType, resourceId, field, proposedValue } = change;
    
    logAdminOperation('info', 'applySingleChange', resourceType, 
      `Applying change to ${field} for resource ${resourceId}`);

    // Validate the change is still applicable
    const currentResource = await findResourceById(resourceType, resourceId);
    if (!currentResource) {
      throw new Error(`Resource ${resourceId} not found for change application`);
    }

    // Check if the field value has changed since the change was proposed
    if (change.currentValue !== null && currentResource[field] !== change.currentValue) {
      throw new Error(`Field ${field} has been modified since change was proposed. Expected: ${change.currentValue}, Current: ${currentResource[field]}`);
    }

    // Apply the change
    const updateData = { [field]: proposedValue };
    const updatedResource = await updateResource(resourceType, resourceId, updateData);

    if (!updatedResource) {
      throw new Error(`Failed to update resource ${resourceId}`);
    }

    logAdminOperation('info', 'applySingleChange', resourceType, 
      `Successfully applied change to ${field} for resource ${resourceId}`);

    return {
      changeId: change.changeId,
      resourceId,
      resourceType,
      field,
      oldValue: change.currentValue,
      newValue: proposedValue,
      appliedAt: new Date().toISOString(),
      status: 'applied'
    };
  } catch (error) {
    logAdminOperation('error', 'applySingleChange', change.resourceType, 
      `Failed to apply change ${change.changeId}`, { error: error.message });
    throw error;
  }
};

/**
 * Rejects proposed changes
 * @param {string} resourceType - Type of resource
 * @param {Array} changesToReject - Array of change objects to reject
 * @returns {Promise<object>} Results of change rejection
 */
export const rejectChanges = async (resourceType, changesToReject) => {
  try {
    logAdminOperation('info', 'rejectChanges', resourceType, `Rejecting ${changesToReject.length} changes`);

    const rejectedChanges = changesToReject.map(change => ({
      changeId: change.changeId,
      resourceId: change.resourceId,
      resourceType: change.resourceType,
      field: change.field,
      rejectedAt: new Date().toISOString(),
      status: 'rejected',
      rejectionReason: 'Manually rejected by admin'
    }));

    logAdminOperation('info', 'rejectChanges', resourceType, `Successfully rejected ${rejectedChanges.length} changes`);

    return {
      successCount: rejectedChanges.length,
      failureCount: 0,
      errors: [],
      rejectedChanges
    };
  } catch (error) {
    logAdminOperation('error', 'rejectChanges', resourceType, 'Failed to reject changes', { error: error.message });
    throw createAdminModelError('rejectChanges', resourceType, error);
  }
};

/**
 * Validates bulk data before import/creation
 * @param {string} resourceType - Type of resource to validate
 * @param {Array} items - Array of items to validate
 * @returns {Promise<object>} Validation results
 */
export const validateBulkData = async (resourceType, items) => {
  try {
    const config = getResourceConfig(resourceType);
    
    logAdminOperation('info', 'validateBulkData', resourceType, `Validating ${items.length} items`);

    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const validation = await validateSingleItem(resourceType, item, config, i);
      
      if (validation.isValid) {
        results.valid.push({
          index: i,
          item: validation.cleanedItem,
          warnings: validation.warnings
        });
        
        if (validation.warnings.length > 0) {
          results.warnings.push({
            index: i,
            item,
            warnings: validation.warnings
          });
        }
      } else {
        results.invalid.push({
          index: i,
          item,
          errors: validation.errors
        });
      }
    }

    logAdminOperation('info', 'validateBulkData', resourceType, 
      `Validation complete: ${results.valid.length} valid, ${results.invalid.length} invalid, ${results.warnings.length} with warnings`);

    return results;
  } catch (error) {
    logAdminOperation('error', 'validateBulkData', resourceType, 'Bulk validation failed', { error: error.message });
    throw createAdminModelError('validateBulkData', resourceType, error);
  }
};

/**
 * Validates a single item
 * @param {string} resourceType - Type of resource
 * @param {object} item - Item to validate
 * @param {object} config - Resource configuration
 * @param {number} index - Item index for error reporting
 * @returns {Promise<object>} Validation result
 */
const validateSingleItem = async (resourceType, item, config, index) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    cleanedItem: { ...item }
  };

  try {
    // Validate required fields
    const requiredFields = getRequiredFields(resourceType, config);
    for (const field of requiredFields) {
      if (!item[field] || (typeof item[field] === 'string' && item[field].trim() === '')) {
        validation.errors.push(`Missing required field: ${field}`);
        validation.isValid = false;
      }
    }

    // Validate field types and formats
    for (const field in item) {
      if (item[field] !== null && item[field] !== undefined) {
        const fieldValidation = await validateField(resourceType, field, item[field], config);
        
        if (!fieldValidation.isValid) {
          validation.errors.push(...fieldValidation.errors);
          validation.isValid = false;
        }
        
        if (fieldValidation.warnings.length > 0) {
          validation.warnings.push(...fieldValidation.warnings);
        }
        
        // Apply cleaned value if available
        if (fieldValidation.cleanedValue !== undefined) {
          validation.cleanedItem[field] = fieldValidation.cleanedValue;
        }
      }
    }

    // Resource-specific validations
    const resourceValidation = await validateResourceSpecific(resourceType, validation.cleanedItem);
    if (!resourceValidation.isValid) {
      validation.errors.push(...resourceValidation.errors);
      validation.isValid = false;
    }
    
    validation.warnings.push(...resourceValidation.warnings);

  } catch (error) {
    validation.errors.push(`Validation error: ${error.message}`);
    validation.isValid = false;
  }

  return validation;
};

/**
 * Gets required fields for a resource type
 * @param {string} resourceType - Type of resource
 * @param {object} config - Resource configuration
 * @returns {Array} Array of required field names
 */
const getRequiredFields = (resourceType, config) => {
  const requiredFieldsMap = {
    restaurants: ['name'],
    dishes: ['name', 'restaurant_id'],
    users: ['email'],
    cities: ['name'],
    neighborhoods: ['name', 'city_id'],
    hashtags: ['name'],
    lists: ['name', 'user_id'],
    restaurant_chains: ['name'],
    submissions: ['type', 'name']
  };

  return requiredFieldsMap[resourceType.toLowerCase()] || [];
};

/**
 * Validates a single field
 * @param {string} resourceType - Type of resource
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {object} config - Resource configuration
 * @returns {Promise<object>} Field validation result
 */
const validateField = async (resourceType, field, value, config) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    cleanedValue: value
  };

  try {
    // String length validations
    if (typeof value === 'string') {
      if (value.length > 500 && !['description', 'notes'].includes(field)) {
        validation.errors.push(`${field} is too long (max 500 characters)`);
        validation.isValid = false;
      }
      
      // Trim whitespace and update cleaned value
      const trimmed = value.trim();
      if (trimmed !== value) {
        validation.cleanedValue = trimmed;
        validation.warnings.push(`${field} had leading/trailing whitespace that was removed`);
      }
    }

    // Email validation
    if (field === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        validation.errors.push(`${field} is not a valid email address`);
        validation.isValid = false;
      }
    }

    // Phone number validation
    if (field === 'phone' && typeof value === 'string') {
      const phoneRegex = /^\(?[\d\s\-\(\)\+\.]{7,}$/;
      if (!phoneRegex.test(value)) {
        validation.errors.push(`${field} is not a valid phone number`);
        validation.isValid = false;
      }
    }

    // URL validation
    if ((field === 'website' || field.includes('url')) && typeof value === 'string') {
      try {
        new URL(value.startsWith('http') ? value : `https://${value}`);
      } catch {
        validation.warnings.push(`${field} may not be a valid URL`);
      }
    }

    // Numeric validations
    if (['price', 'latitude', 'longitude'].includes(field)) {
      if (isNaN(parseFloat(value))) {
        validation.errors.push(`${field} must be a valid number`);
        validation.isValid = false;
      }
    }

    // ID field validations
    if (field.endsWith('_id') && value !== null) {
      const numericValue = parseInt(value, 10);
      if (isNaN(numericValue) || numericValue <= 0) {
        validation.errors.push(`${field} must be a positive integer`);
        validation.isValid = false;
      } else {
        validation.cleanedValue = numericValue;
      }
    }

  } catch (error) {
    validation.errors.push(`Field validation error for ${field}: ${error.message}`);
    validation.isValid = false;
  }

  return validation;
};

/**
 * Performs resource-specific validations
 * @param {string} resourceType - Type of resource
 * @param {object} item - Item to validate
 * @returns {Promise<object>} Resource validation result
 */
const validateResourceSpecific = async (resourceType, item) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    switch (resourceType.toLowerCase()) {
      case 'restaurants':
        await validateRestaurant(item, validation);
        break;
      case 'dishes':
        await validateDish(item, validation);
        break;
      case 'users':
        await validateUser(item, validation);
        break;
      case 'neighborhoods':
        await validateNeighborhood(item, validation);
        break;
      // Add more resource-specific validations as needed
    }
  } catch (error) {
    validation.errors.push(`Resource validation error: ${error.message}`);
    validation.isValid = false;
  }

  return validation;
};

/**
 * Validates restaurant-specific rules
 * @param {object} restaurant - Restaurant data
 * @param {object} validation - Validation object to update
 */
const validateRestaurant = async (restaurant, validation) => {
  // Check if city_id exists if provided
  if (restaurant.city_id) {
    try {
      const cityExists = await db.query('SELECT id FROM cities WHERE id = $1', [restaurant.city_id]);
      if (cityExists.rows.length === 0) {
        validation.errors.push(`City ID ${restaurant.city_id} does not exist`);
        validation.isValid = false;
      }
    } catch (error) {
      validation.warnings.push(`Could not verify city ID: ${error.message}`);
    }
  }

  // Check if neighborhood_id exists and belongs to the specified city
  if (restaurant.neighborhood_id && restaurant.city_id) {
    try {
      const neighborhoodExists = await db.query(
        'SELECT id FROM neighborhoods WHERE id = $1 AND city_id = $2', 
        [restaurant.neighborhood_id, restaurant.city_id]
      );
      if (neighborhoodExists.rows.length === 0) {
        validation.errors.push(`Neighborhood ID ${restaurant.neighborhood_id} does not exist or does not belong to city ${restaurant.city_id}`);
        validation.isValid = false;
      }
    } catch (error) {
      validation.warnings.push(`Could not verify neighborhood ID: ${error.message}`);
    }
  }
};

/**
 * Validates dish-specific rules
 * @param {object} dish - Dish data
 * @param {object} validation - Validation object to update
 */
const validateDish = async (dish, validation) => {
  // Check if restaurant_id exists
  if (dish.restaurant_id) {
    try {
      const restaurantExists = await db.query('SELECT id FROM restaurants WHERE id = $1', [dish.restaurant_id]);
      if (restaurantExists.rows.length === 0) {
        validation.errors.push(`Restaurant ID ${dish.restaurant_id} does not exist`);
        validation.isValid = false;
      }
    } catch (error) {
      validation.warnings.push(`Could not verify restaurant ID: ${error.message}`);
    }
  }

  // Validate price if provided
  if (dish.price !== null && dish.price !== undefined) {
    const price = parseFloat(dish.price);
    if (price < 0) {
      validation.errors.push('Price cannot be negative');
      validation.isValid = false;
    } else if (price > 1000) {
      validation.warnings.push('Price seems unusually high (over $1000)');
    }
  }
};

/**
 * Validates user-specific rules
 * @param {object} user - User data
 * @param {object} validation - Validation object to update
 */
const validateUser = async (user, validation) => {
  // Check for duplicate email
  if (user.email) {
    try {
      const emailExists = await db.query('SELECT id FROM users WHERE email = $1', [user.email.toLowerCase()]);
      if (emailExists.rows.length > 0) {
        validation.errors.push(`Email ${user.email} already exists`);
        validation.isValid = false;
      }
    } catch (error) {
      validation.warnings.push(`Could not verify email uniqueness: ${error.message}`);
    }
  }

  // Validate account type
  if (user.account_type && !['user', 'admin', 'superuser'].includes(user.account_type)) {
    validation.errors.push(`Invalid account type: ${user.account_type}`);
    validation.isValid = false;
  }
};

/**
 * Validates neighborhood-specific rules
 * @param {object} neighborhood - Neighborhood data
 * @param {object} validation - Validation object to update
 */
const validateNeighborhood = async (neighborhood, validation) => {
  // Check if city_id exists
  if (neighborhood.city_id) {
    try {
      const cityExists = await db.query('SELECT id FROM cities WHERE id = $1', [neighborhood.city_id]);
      if (cityExists.rows.length === 0) {
        validation.errors.push(`City ID ${neighborhood.city_id} does not exist`);
        validation.isValid = false;
      }
    } catch (error) {
      validation.warnings.push(`Could not verify city ID: ${error.message}`);
    }
  }
};

/**
 * Approves a submission and creates the corresponding resource
 * @param {number} submissionId - ID of submission to approve
 * @param {string} itemType - Type of item being approved
 * @param {object} itemData - Data for the new item
 * @param {number} cityId - City ID for the item
 * @param {number} neighborhoodId - Neighborhood ID for the item
 * @param {string} placeId - Google Place ID if applicable
 * @param {number} submittedByUserId - ID of user who submitted
 * @param {number} reviewedByAdminId - ID of admin approving
 * @returns {Promise<object>} Created item
 */
export const approveSubmission = async (submissionId, itemType, itemData, cityId, neighborhoodId, placeId, submittedByUserId, reviewedByAdminId) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    logAdminOperation('info', 'approveSubmission', 'submissions', 
      `Approving submission ${submissionId} for ${itemType}`);

    // Create the new item
    const newItem = await createResource(itemType, itemData);
    
    if (!newItem) {
      throw new Error('Failed to create item from submission');
    }

    // Update submission status
    const submissionConfig = getResourceConfig('submissions');
    const updateValues = [reviewedByAdminId, submissionId];
    const submissionUpdateQuery = format(`
      UPDATE %I
      SET status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1
      WHERE id = $2 RETURNING *;
    `, submissionConfig.tableName);

    const { rows: updatedSubmissionRows } = await client.query(submissionUpdateQuery, updateValues);
    if (updatedSubmissionRows.length === 0) {
      throw new Error('Failed to update submission status after item creation.');
    }

    await client.query('COMMIT');
    
    const formatter = getResourceConfig(itemType).formatter || identityFormatter;
    const formattedItem = formatter(newItem);
    
    logAdminOperation('info', 'approveSubmission', 'submissions', 
      `Successfully approved submission ${submissionId}, created ${itemType} with ID ${newItem.id}`);
    
    return formattedItem;
  } catch (error) {
    await client.query('ROLLBACK');
    logAdminOperation('error', 'approveSubmission', 'submissions', 
      `Failed to approve submission ${submissionId}`, { error: error.message });
    throw createAdminModelError('approveSubmission', 'submissions', error);
  } finally {
    client.release();
  }
};

/**
 * Rejects a submission with a reason
 * @param {number} submissionId - ID of submission to reject
 * @param {string} rejectionReason - Reason for rejection
 * @param {number} reviewedByAdminId - ID of admin rejecting
 * @returns {Promise<object|null>} Updated submission or null if not found
 */
export const rejectSubmission = async (submissionId, rejectionReason, reviewedByAdminId) => {
  try {
    const submissionConfig = getResourceConfig('submissions');
    
    logAdminOperation('info', 'rejectSubmission', 'submissions', 
      `Rejecting submission ${submissionId}: ${rejectionReason}`);
    
    const query = format(`
      UPDATE %I
      SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = $2
      WHERE id = $3 AND status = 'pending' RETURNING *;
    `, submissionConfig.tableName);
    
    const { rows } = await db.query(query, [reviewedByAdminId, rejectionReason, submissionId]);
    
    if (rows.length === 0) {
      logAdminOperation('warn', 'rejectSubmission', 'submissions', 
        `Submission ${submissionId} not found or not in pending status`);
      return null;
    }
    
    const formatter = submissionConfig.formatter || identityFormatter;
    const formattedSubmission = formatter(rows[0]);
    
    logAdminOperation('info', 'rejectSubmission', 'submissions', 
      `Successfully rejected submission ${submissionId}`);
    
    return formattedSubmission;
  } catch (error) {
    logAdminOperation('error', 'rejectSubmission', 'submissions', 
      `Failed to reject submission ${submissionId}`, { error: error.message });
    throw createAdminModelError('rejectSubmission', 'submissions', error);
  }
};

/**
 * Default export containing all validation functions
 */
export default {
  applyChanges,
  rejectChanges,
  validateBulkData,
  approveSubmission,
  rejectSubmission
}; 