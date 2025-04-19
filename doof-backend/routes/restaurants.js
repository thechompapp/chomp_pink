/* /doof-backend/routes/restaurants.js */
// Patch: Corrected function call from findRestaurantByIdWithDetails to findRestaurantById

import express from 'express';
import { param, body, validationResult } from 'express-validator';
import * as RestaurantModel from '../models/restaurantModel.js'; // Path relative to this file, still correct after move
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Import if needed for GET

const router = express.Router();

const validateIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('Restaurant ID must be a positive integer').toInt()
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Restaurants Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array({ onlyFirstError: true })[0].msg }); // Only first error
        return;
    }
    next();
};

// Define validation schema for create/update - Reuse from admin route if identical
const validateRestaurantBody = [
    body('name').trim().notEmpty().withMessage('Restaurant name is required').isLength({ max: 255 }),
    body('city_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('City ID must be a positive integer').toInt(),
    body('neighborhood_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Neighborhood ID must be a positive integer').toInt(),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('neighborhood_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('address').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('google_place_id').optional({ nullable: true }).trim().isLength({ max: 255 }),
    body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude').toFloat(),
    body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude').toFloat(),
    body('phone_number').optional({ nullable: true }).isString().trim().isLength({ max: 30 }).escape(), // Added validation
    body('website').optional({ nullable: true }).isURL().trim().isLength({ options: { max: 2048 } }), // Added validation
    body('instagram_handle').optional({ nullable: true }).isString().trim().isLength({ options: { max: 100 } }).escape(), // Added validation
    body('photo_url').optional({ nullable: true }).isURL().trim().isLength({ options: { max: 2048 } }), // Added validation
];

// GET /api/restaurants/:id - Publicly accessible? Assume yes for now.
router.get('/:id', validateIdParam, handleValidationErrors, async (req, res, next) => {
    const id = req.params.id;
    try {
        // *** FIXED: Changed function call to the existing findRestaurantById ***
        const restaurantData = await RestaurantModel.findRestaurantById(id); //
        if (!restaurantData) {
            res.status(404).json({ success: false, error: 'Restaurant not found' }); // Add success flag
            return;
        }
        res.json({ success: true, data: restaurantData }); // Wrap response
    } catch (err) {
        console.error(`[Restaurants GET /:id] Error fetching restaurant ${id}:`, err);
        next(err);
    }
});

// POST /api/restaurants - Requires Superuser
router.post('/', authMiddleware, requireSuperuser, validateRestaurantBody, handleValidationErrors, async (req, res, next) => {
    try {
        const newRestaurant = await RestaurantModel.createRestaurant(req.body);
        if (!newRestaurant) {
             // console.warn(`[Restaurants POST /] Restaurant creation did not return a result, likely duplicate or error.`); // Optional
             // Check if it exists for better error message
             const existing = await RestaurantModel.findRestaurantById(req.body.name); // Basic check
             if (existing && existing.city_id === req.body.city_id) {
                res.status(409).json({ success: false, error: "Restaurant creation failed: name likely already exists in this city." });
             } else {
                res.status(400).json({ success: false, error: "Restaurant creation failed for an unknown reason." });
             }
             return;
        }
        res.status(201).json({ success: true, data: newRestaurant }); // Wrap response
    } catch (err) {
        console.error(`[Restaurants POST /] Error creating restaurant:`, err);
        if (err.code === '23505') { // Unique constraint
            res.status(409).json({ success: false, error: "Restaurant creation failed, likely already exists." });
            return;
        }
         if (err.code === '23503') { // Foreign key constraint
             res.status(400).json({ success: false, error: "Restaurant creation failed: Invalid City or Neighborhood ID." });
             return;
         }
        next(err);
    }
});

// PUT /api/restaurants/:id - Requires Superuser
router.put('/:id', authMiddleware, requireSuperuser, validateIdParam,
    // Apply validation rules (optional for update) - Use a slightly modified validator if needed
    [
        body('name').optional().trim().notEmpty().withMessage('Restaurant name cannot be empty').isLength({ max: 255 }),
        body('city_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('City ID must be a positive integer').toInt(),
        body('neighborhood_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Neighborhood ID must be a positive integer').toInt(),
        body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
        body('neighborhood_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
        body('address').optional({ nullable: true }).trim().isLength({ max: 500 }),
        body('google_place_id').optional({ nullable: true }).trim().isLength({ max: 255 }),
        body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude').toFloat(),
        body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude').toFloat(),
        body('phone_number').optional({ nullable: true }).isString().trim().isLength({ max: 30 }).escape(), // Added validation
        body('website').optional({ nullable: true }).isURL().trim().isLength({ options: { max: 2048 } }), // Added validation
        body('instagram_handle').optional({ nullable: true }).isString().trim().isLength({ options: { max: 100 } }).escape(), // Added validation
        body('photo_url').optional({ nullable: true }).isURL().trim().isLength({ options: { max: 2048 } }), // Added validation
    ],
    handleValidationErrors,
    async (req, res, next) => {
        const id = req.params.id;
        try {
            const updatedRestaurant = await RestaurantModel.updateRestaurant(id, req.body);
            if (!updatedRestaurant) {
                const checkExists = await RestaurantModel.findRestaurantById(id);
                if (!checkExists) {
                    res.status(404).json({ success: false, error: 'Restaurant not found.' });
                } else {
                    // console.warn(`[Restaurants PUT /:id] Update for restaurant ${id} returned null, possibly no changes made.`); // Optional
                    res.status(200).json({ success: true, data: checkExists, message: "No changes detected or update failed." });
                }
                return;
            }
            res.json({ success: true, data: updatedRestaurant }); // Wrap response
        } catch (err) {
            console.error(`[Restaurants PUT /:id] Error updating restaurant ${id}:`, err);
            if (err.code === '23505') { // Unique constraint
                res.status(409).json({ success: false, error: "Update failed, conflicts with existing data (e.g., name in city)." });
                return;
            }
             if (err.code === '23503') { // Foreign key constraint
                 res.status(400).json({ success: false, error: "Update failed: Invalid City or Neighborhood ID." });
                 return;
             }
            next(err);
        }
    }
);

// DELETE /api/restaurants/:id - Requires Superuser
router.delete('/:id', authMiddleware, requireSuperuser, validateIdParam, handleValidationErrors, async (req, res, next) => {
    const id = req.params.id;
    try {
        const deleted = await RestaurantModel.deleteRestaurant(id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Restaurant not found.' }); // Add success flag
        }
        res.status(204).send();
    } catch (err) {
        console.error(`[Restaurants DELETE /:id] Error deleting restaurant ${id}:`, err);
        if (err instanceof Error && err.code === '23503') { // Foreign key constraint
            return res.status(409).json({ success: false, error: 'Cannot delete restaurant: It is referenced by other items (e.g., dishes).' });
        }
        next(err);
    }
});

export default router;