/* src/doof-backend/routes/dishes.js */
import express from 'express';
import { param, query as queryValidator, body, validationResult } from 'express-validator';
import * as DishModel from '../models/dishModel.js';
import * as RestaurantModel from '../models/restaurantModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Dishes Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array({ onlyFirstError: true})[0].msg }); // Send only first error message
        return;
    }
    next();
};

const validateIdParam = [
    param('id')
        .isInt({ gt: 0 })
        .withMessage('Dish ID must be a positive integer')
        .toInt(),
];

const validateGetDishesQuery = [
    queryValidator('name')
        .optional()
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Name query must not be empty if provided')
        .isLength({ max: 100 }),
    queryValidator('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
        .toInt(),
    queryValidator('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer')
        .toInt(),
];

const validateDishBody = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Dish name is required')
        .isLength({ max: 255 })
        .escape(),
    body('restaurant_id')
        .notEmpty().withMessage('Restaurant ID is required') // Make it required for creation
        .isInt({ gt: 0 })
        .withMessage('Valid Restaurant ID is required')
        .toInt(),
];

// --- Routes ---

// GET /api/dishes (List/Search Dishes) - Public ok?
router.get('/', validateGetDishesQuery, handleValidationErrors, async (req, res, next) => {
    const name = req.query.name || '';
    const limit = req.query.limit ?? 20;
    const offset = req.query.offset ?? 0;
    try {
        const dishes = await DishModel.findDishesByName(String(name), Number(limit), Number(offset)); // Ensure types
        res.json({ success: true, data: dishes || [] }); // Wrap response
    } catch (err) {
        console.error('[Dishes GET /] Error:', err);
        next(err);
    }
});

// GET /api/dishes/:id (Get Dish Details) - Public ok?
router.get('/:id', validateIdParam, handleValidationErrors, async (req, res, next) => {
    const dishId = req.params.id;
    try {
        const dishData = await DishModel.findDishById(dishId);
        if (!dishData) {
            res.status(404).json({ success: false, error: 'Dish not found' }); // Add success flag
            return;
        }
        res.json({ success: true, data: dishData }); // Wrap response
    } catch (err) {
        console.error(`[Dishes GET /:id] Error fetching dish ${dishId}:`, err);
        next(err);
    }
});

// POST /api/dishes (Create Dish - Superuser only)
router.post('/', authMiddleware, requireSuperuser, validateDishBody, handleValidationErrors, async (req, res, next) => {
    const { name, restaurant_id } = req.body;
    try {
        const restaurantExists = await RestaurantModel.findRestaurantById(restaurant_id);
        if (!restaurantExists) {
            // console.warn(`[Dishes POST /] Restaurant ID ${restaurant_id} not found.`); // Optional
            res.status(400).json({ success: false, error: `Restaurant with ID ${restaurant_id} not found.` });
            return;
        }
        const newDish = await DishModel.createDish({ name, restaurant_id });
        if (!newDish) {
             // console.warn(`[Dishes POST /] Dish "${name}" likely already exists for restaurant ${restaurant_id}.`); // Optional
             // No need to re-check existence here, model already handled CONFLICT
             res.status(409).json({ success: false, error: 'Dish with this name already exists for this restaurant.' });
             return;
        }
        res.status(201).json({ success: true, data: newDish }); // Wrap response
    } catch (err) {
        console.error('[Dishes POST /] Error creating dish:', err);
       if (err.code === '23505') { // Unique constraint
          res.status(409).json({ success: false, error: "Dish with this name already exists for this restaurant." });
          return;
       }
        next(err);
    }
});

// PUT /api/dishes/:id (Update Dish - Superuser only)
router.put('/:id', authMiddleware, requireSuperuser, validateIdParam,
[ // Optional fields for PUT
    body('name').optional().trim().notEmpty().withMessage('Dish name cannot be empty').isLength({ max: 255 }).escape(),
    body('restaurant_id').optional().isInt({ gt: 0 }).withMessage('Valid Restaurant ID is required').toInt(),
], handleValidationErrors, async (req, res, next) => {
    const dishId = req.params.id;
    const updateData = req.body;
    delete updateData.adds; // Don't allow updating adds

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, error: "No update fields provided." });
    }
    try {
        if (updateData.restaurant_id) {
            const restaurantExists = await RestaurantModel.findRestaurantById(updateData.restaurant_id);
            if (!restaurantExists) {
                // console.warn(`[Dishes PUT /:id] Cannot update dish ${dishId}: New restaurant ID ${updateData.restaurant_id} not found.`); // Optional
                res.status(400).json({ success: false, error: `Restaurant with ID ${updateData.restaurant_id} not found.` });
                return;
            }
        }
        const updatedDish = await DishModel.updateDish(dishId, updateData);
        if (!updatedDish) {
            const dishExists = await DishModel.findDishById(dishId);
            if (!dishExists) {
                res.status(404).json({ success: false, error: 'Dish not found.' });
            } else {
                // console.warn(`[Dishes PUT /:id] Update for dish ${dishId} returned null.`); // Optional
                res.status(200).json({ success: true, data: dishExists, message: 'No changes detected or update failed.' });
            }
            return;
        }
        res.json({ success: true, data: updatedDish }); // Wrap response
    } catch (err) {
        console.error(`[Dishes PUT /:id] Error updating dish ${dishId}:`, err);
       if (err.code === '23505') { // Unique constraint
          res.status(409).json({ success: false, error: "Update failed: Dish with this name already exists for the target restaurant." });
          return;
       }
       if (err.code === '23503') { // Foreign key constraint
             res.status(400).json({ success: false, error: "Update failed: Invalid Restaurant ID." });
             return;
         }
        next(err);
    }
});

// DELETE /api/dishes/:id (Delete Dish - Superuser only)
router.delete('/:id', authMiddleware, requireSuperuser, validateIdParam, handleValidationErrors, async (req, res, next) => {
    const dishId = req.params.id;
    try {
        const deleted = await DishModel.deleteDish(dishId);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Dish not found.' }); // Add success flag
            return;
        }
        res.status(204).send();
    } catch (err) {
        console.error(`[Dishes DELETE /:id] Error deleting dish ${dishId}:`, err);
        next(err);
    }
});

export default router;