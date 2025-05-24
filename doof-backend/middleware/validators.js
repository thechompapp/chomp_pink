/* doof-backend/middleware/validators.js */
/* REFACTORED: Convert to ES Modules (import/export) */
/* REFACTORED: Added stricter validation rules (lengths, formats) */

// Use import instead of require
import { body, param, query, validationResult } from 'express-validator';

// --- Reusable Validation Chains ---
// Change exports.name = ... to export const name = ...

export const validateIdParam = (paramName = 'id') => [
    param(paramName)
        .isInt({ gt: 0 })
        .withMessage(`${paramName} must be a positive integer.`),
];

export const validateOptionalIdParam = (paramName = 'id') => [
    param(paramName)
        .optional()
        .isInt({ gt: 0 })
        .withMessage(`${paramName} must be a positive integer if provided.`),
];

export const validateString = (fieldName, options = {}) => {
    const { optional = false, min = 1, max = 255, message } = options;
    let chain = body(fieldName);
    chain = optional ? chain.optional({ checkFalsy: true }) : chain.notEmpty().withMessage(`${fieldName} is required.`); // Use checkFalsy for optional fields that can be empty string
    chain = chain
        .isString().withMessage(`${fieldName} must be a string.`)
        .trim()
        .isLength({ min, max }).withMessage(`${fieldName} must be between ${min} and ${max} characters.`);
    if (message) {
        chain = chain.withMessage(message);
    }
    return chain;
};

export const validateUrl = (fieldName, options = {}) => {
    const { optional = true, message = 'Invalid URL format.' } = options;
    let chain = body(fieldName);
    chain = optional ? chain.optional({ checkFalsy: true }) : chain.notEmpty().withMessage(`${fieldName} is required.`);
    chain = chain
        .isURL({ require_protocol: true, require_valid_protocol: ['http', 'https'], require_host: true })
        .withMessage(message);
    return chain;
};

export const validateBoolean = (fieldName, options = {}) => {
     const { optional = false, message = `${fieldName} must be true or false.` } = options;
     let chain = body(fieldName);
     chain = optional ? chain.optional() : chain.exists({ checkNull: true }).withMessage(`${fieldName} is required.`); // Ensure it exists if not optional
     chain = chain.isBoolean().withMessage(message);
     return chain;
};

export const validateInt = (fieldName, options = {}) => {
     const { optional = true, min, max, message } = options;
     let chain = body(fieldName);
     chain = optional ? chain.optional({ checkFalsy: true }) : chain.notEmpty().withMessage(`${fieldName} is required.`);
     const intOptions = {};
     if (min !== undefined) intOptions.min = min;
     if (max !== undefined) intOptions.max = max;
     const defaultMessage = `${fieldName} must be an integer${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}.`;
     chain = chain.isInt(intOptions).withMessage(message || defaultMessage);
     return chain;
};

export const validateFloat = (fieldName, options = {}) => {
     const { optional = true, min, max, message } = options;
     let chain = body(fieldName);
     chain = optional ? chain.optional({ checkFalsy: true }) : chain.notEmpty().withMessage(`${fieldName} is required.`);
     const floatOptions = {};
     if (min !== undefined) floatOptions.min = min;
     if (max !== undefined) floatOptions.max = max;
     const defaultMessage = `${fieldName} must be a number${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}.`;
     chain = chain.isFloat(floatOptions).withMessage(message || defaultMessage);
     return chain;
};

export const validateEmail = (fieldName = 'email', options = {}) => {
     const { optional = false, message = 'Invalid email format.' } = options;
     let chain = body(fieldName);
     chain = optional ? chain.optional() : chain.notEmpty().withMessage(`${fieldName} is required.`);
     chain = chain.isEmail().normalizeEmail().withMessage(message);
     return chain;
};

export const validatePassword = (fieldName = 'password', options = {}) => {
    const { optional = false, min = 8, max = 100, message = `Password must be between ${min} and ${max} characters.` } = options;
    let chain = body(fieldName);
    chain = optional ? chain.optional() : chain.notEmpty().withMessage(`${fieldName} is required.`);

    // Custom: Allow 'doof123' for 'admin@example.com' in development mode
    chain = chain.custom((value, { req }) => {
        if (
            process.env.NODE_ENV === 'development' &&
            req.body &&
            req.body.email === 'admin@example.com' &&
            value === 'doof123'
        ) {
            return true; // Bypass min length for this special case
        }
        // Otherwise, enforce length
        if (typeof value !== 'string' || value.length < min || value.length > max) {
            throw new Error(message);
        }
        return true;
    });
    return chain;
};

export const validateTags = (fieldName = 'tags', options = {}) => {
    const { optional = true } = options;
    let chain = body(fieldName);
    chain = optional ? chain.optional({ checkFalsy: true }) : chain.notEmpty().withMessage(`${fieldName} are required.`);
    chain = chain
        .isArray().withMessage(`${fieldName} must be an array.`)
        .custom((tags) => { // Custom validation for tag content
            if (!Array.isArray(tags)) return true; // Let isArray handle this
            for (const tag of tags) {
                if (typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 50) { // Example limits
                    throw new Error('Each tag must be a non-empty string up to 50 characters.');
                }
            }
            return true;
        });
    return chain;
};


// --- Specific Validation Sets ---

export const validateRegistration = [ // Changed from exports.
    validateString('username', { min: 3, max: 50, message: 'Username must be 3-50 characters.' }),
    validateEmail('email'),
    validatePassword('password'),
];

export const validateLogin = [ // Changed from exports.
    validateEmail('email'),
    validatePassword('password', { optional: true }), // Password might be optional depending on login strategy? Assuming required.
    body('password').notEmpty().withMessage('Password is required for login.'),
];

export const validateList = [ // Changed from exports. (For Create and Update)
    validateString('name', { min: 1, max: 100, message: 'List name must be 1-100 characters.' }),
    validateString('description', { optional: true, max: 1000 }),
    validateBoolean('is_public', { optional: true }), // Allow optional for update, set default on create
    validateTags('tags', { optional: true }),
    validateString('city_name', { optional: true, max: 100 }),
    body('list_type')
        .optional() // Optional on update, required on create (handled by controller default?)
        .isIn(['restaurant', 'dish', 'mixed'])
        .withMessage("List type must be 'restaurant', 'dish', or 'mixed'."),
];

export const validateListId = validateIdParam('id'); // Changed from exports. (Route param validation)

export const validateAddItemToList = [ // Changed from exports.
    validateIdParam('id'), // listId from route param
    validateInt('item_id', { optional: false, min: 1 }),
    body('item_type')
        .isIn(['restaurant', 'dish'])
        .withMessage("Item type must be 'restaurant' or 'dish'."),
    validateString('notes', { optional: true, max: 500 }), // Validate notes if added
];

export const validateRemoveListItem = [ // Changed from exports.
    validateIdParam('id'), // listId from route param
    validateIdParam('listItemId'), // listItemId from route param
];

export const validateFollow = [ // Changed from exports.
    validateIdParam('id'), // listId from route param
];

export const validateSubmission = [ // Changed from exports.
    validateString('type', { optional: false }).isIn(['restaurant', 'dish']).withMessage("Submission type must be 'restaurant' or 'dish'."),
    validateString('name', { optional: false, min: 1, max: 255 }),
    validateString('location', { optional: true, max: 500 }),
    validateTags('tags', { optional: true }),
    validateString('place_id', { optional: true, max: 255 }),
    validateString('city', { optional: true, max: 100 }),
    validateString('neighborhood', { optional: true, max: 100 }),
    // Add validation for restaurant_id/restaurant_name if submitting a dish
    body('restaurant_id').if(body('type').equals('dish'))
        .optional()
        .isInt({ gt: 0 })
        .withMessage('Restaurant ID must be a positive integer for dish submissions if provided.'),
    body('restaurant_name').if(body('type').equals('dish'))
        .optional({ checkFalsy: true })
        .isString().trim().isLength({ min: 1, max: 255 })
        .withMessage('Restaurant name must be 1-255 characters for dish submissions if provided.'),
];

export const validateReviewSubmission = [ // Changed from exports.
    validateIdParam('id'), // submissionId
    body('status')
        .isIn(['approved', 'rejected'])
        .withMessage("Status must be 'approved' or 'rejected'."),
    // Optional: validate rejection reason?
    validateString('rejectionReason', { optional: true, max: 500 }),
];

// Generic validation for admin resource routes (can be customized further)
export const validateAdminResourceParam = validateIdParam('id'); // Changed from exports.
export const validateAdminResourceTypeParam = [ // Changed from exports.
    param('resourceType')
        .isIn(['restaurants', 'dishes', 'users', 'cities', 'neighborhoods', 'hashtags', 'restaurant_chains', 'lists']) // Added lists
        .withMessage('Invalid resource type specified.'),
];

export const validateAdminUpdate = (req, res, next) => { // Changed from exports.
    // ... (no change to internal logic)
    console.log(`[Validator] validateAdminUpdate called for type: ${req.params.resourceType}`);
    next();
};

export const validateAdminCreate = (req, res, next) => { // Changed from exports.
    // ... (no change to internal logic)
    console.log(`[Validator] validateAdminCreate called for type: ${req.params.resourceType}`);
    next();
};

export const validatePagination = [ // Changed from exports.
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('sortBy').optional().isString().trim().notEmpty().withMessage('SortBy must be a non-empty string.'),
    query('sortDirection').optional().toUpperCase().isIn(['ASC', 'DESC']).withMessage('SortDirection must be ASC or DESC.'),
];

// --- Error Handling Middleware ---

export const handleValidationErrors = (req, res, next) => { // Changed from exports.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Log detailed errors for debugging
        console.error("Validation Errors:", JSON.stringify(errors.array()));
        // Return structured errors
        return res.status(400).json({
            success: false,
            message: "Validation failed.", // General message
            // Provide structured errors for frontend consumption
            errors: errors.array().map(e => ({
                 type: e.type,
                 msg: e.msg,
                 path: e.path,
                 location: e.location,
                 // Avoid logging sensitive values like passwords
                 value: (e.path === 'password' || e.path === 'confirmPassword') ? undefined : e.value
             }))
        });
    }
    next();
};