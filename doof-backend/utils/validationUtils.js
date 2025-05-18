/**
 * Validation Utilities
 * 
 * Centralizes common validation logic for use across the application
 */
import { check, query, param, body, validationResult } from 'express-validator';
import { BadRequestError } from './errorHandler.js';

/**
 * Common validation rules for reuse
 */
export const validationRules = {
  // ID validation
  id: (location = 'param', field = 'id') => {
    const validator = getValidator(location, field);
    return validator.isInt({ gt: 0 }).withMessage(`${field} must be a positive integer`);
  },
  
  // Pagination validation
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  
  // String field validation with min/max lengths
  stringField: (location, field, { required = true, min = 1, max = 255, trim = true } = {}) => {
    const validator = getValidator(location, field);
    
    if (required) {
      validator.notEmpty().withMessage(`${field} is required`);
    } else {
      validator.optional({ checkFalsy: true });
    }
    
    if (trim) {
      validator.trim();
    }
    
    return validator
      .isLength({ min, max })
      .withMessage(`${field} must be between ${min} and ${max} characters`);
  },
  
  // Email validation
  email: (location = 'body', field = 'email') => {
    const validator = getValidator(location, field);
    return validator
      .trim()
      .normalizeEmail()
      .isEmail()
      .withMessage('Must be a valid email address');
  },
  
  // Password validation with strength requirements
  password: (location = 'body', field = 'password') => {
    const validator = getValidator(location, field);
    return validator
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');
  },
  
  // Username validation
  username: (location = 'body', field = 'username') => {
    const validator = getValidator(location, field);
    return validator
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_.-]+$/)
      .withMessage('Username can only contain letters, numbers, underscores, dots, and hyphens');
  },
  
  // Boolean field validation
  booleanField: (location, field, { required = false } = {}) => {
    const validator = getValidator(location, field);
    
    if (required) {
      validator.exists().withMessage(`${field} is required`);
    } else {
      validator.optional();
    }
    
    return validator
      .isBoolean()
      .withMessage(`${field} must be a boolean value`)
      .toBoolean();
  },
  
  // Array validation
  array: (location, field, { required = false, min = 0, max = null } = {}) => {
    const validator = getValidator(location, field);
    
    if (required) {
      validator.exists().withMessage(`${field} is required`);
    } else {
      validator.optional();
    }
    
    let arrayValidator = validator.isArray().withMessage(`${field} must be an array`);
    
    if (min > 0) {
      arrayValidator = arrayValidator.isArray({ min }).withMessage(`${field} must contain at least ${min} items`);
    }
    
    if (max !== null) {
      arrayValidator = arrayValidator.isArray({ max }).withMessage(`${field} must contain at most ${max} items`);
    }
    
    return arrayValidator;
  },
  
  // Date validation
  date: (location, field, { required = true } = {}) => {
    const validator = getValidator(location, field);
    
    if (required) {
      validator.notEmpty().withMessage(`${field} is required`);
    } else {
      validator.optional({ checkFalsy: true });
    }
    
    return validator.isISO8601().withMessage(`${field} must be a valid ISO 8601 date`);
  },
  
  // JSON validation
  json: (location, field, { required = true } = {}) => {
    const validator = getValidator(location, field);
    
    if (required) {
      validator.notEmpty().withMessage(`${field} is required`);
    } else {
      validator.optional({ checkFalsy: true });
    }
    
    return validator.custom(value => {
      try {
        if (typeof value === 'string') {
          JSON.parse(value);
        }
        return true;
      } catch (err) {
        throw new Error(`${field} must be valid JSON`);
      }
    });
  }
};

/**
 * Helper function to get the appropriate validator based on location
 */
function getValidator(location, field) {
  switch (location) {
    case 'body': return body(field);
    case 'query': return query(field);
    case 'param': return param(field);
    default: return check(field);
  }
}

/**
 * Middleware to validate request and handle errors
 */
export function validate(validations) {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    // Format errors and throw BadRequestError
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    next(new BadRequestError('Validation failed', formattedErrors));
  };
}

/**
 * Validation helpers for common entity types
 */
export const validators = {
  // List validation
  list: {
    create: [
      validationRules.stringField('body', 'name', { min: 3, max: 100 }),
      validationRules.stringField('body', 'description', { required: false, max: 500 }),
      body('list_type')
        .isIn(['restaurant', 'dish', 'mixed'])
        .withMessage("list_type must be 'restaurant', 'dish', or 'mixed'"),
      validationRules.booleanField('body', 'is_public', { required: false }),
      validationRules.array('body', 'tags', { required: false })
        .custom(value => {
          if (!Array.isArray(value)) return true;
          return value.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50);
        })
        .withMessage('Each tag must be a non-empty string up to 50 characters'),
      body('city_id')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('city_id must be a positive integer')
    ],
    
    getUserLists: [
      query('view')
        .optional()
        .isIn(['all', 'created', 'followed'])
        .withMessage("View must be 'all', 'created', or 'followed'"),
      ...validationRules.pagination,
      query('cityId')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('cityId must be a positive integer'),
      query('boroughId')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('boroughId must be a positive integer'),
      query('neighborhoodId')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('neighborhoodId must be a positive integer'),
      query('query')
        .optional({ checkFalsy: true })
        .isString()
        .trim()
        .escape(),
      query('hashtags').optional()
    ],
    
    getListItems: [
      validationRules.id('param', 'id'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50')
    ],
    
    addItemToList: [
      validationRules.id('param', 'id'),
      body('itemId')
        .isInt({ gt: 0 })
        .withMessage('itemId must be a positive integer'),
      body('itemType')
        .isIn(['dish', 'restaurant'])
        .withMessage("itemType must be 'dish' or 'restaurant'"),
      validationRules.stringField('body', 'notes', { required: false })
    ]
  },
  
  // User validation
  user: {
    register: [
      validationRules.email(),
      validationRules.password(),
      validationRules.username(),
      validationRules.stringField('body', 'name', { required: true, min: 2, max: 100 })
    ],
    
    login: [
      body('email').notEmpty().withMessage('Email is required'),
      body('password').notEmpty().withMessage('Password is required')
    ],
    
    updateProfile: [
      validationRules.stringField('body', 'name', { required: false, min: 2, max: 100 }),
      validationRules.username('body', 'username', { required: false }),
      body('bio').optional({ checkFalsy: true }).isString().trim()
    ]
  },
  
  // Restaurant validation
  restaurant: {
    create: [
      validationRules.stringField('body', 'name', { min: 2, max: 100 }),
      body('city_id').isInt({ min: 1 }).withMessage('city_id must be a positive integer'),
      body('neighborhood_id')
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage('neighborhood_id must be a positive integer'),
      validationRules.stringField('body', 'address', { required: false }),
      validationRules.array('body', 'tags', { required: false })
    ]
  }
};

export default {
  validationRules,
  validate,
  validators
}; 