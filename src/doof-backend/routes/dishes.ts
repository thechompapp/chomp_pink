/* src/doof-backend/routes/dishes.ts */
import express, { Request, Response, NextFunction } from 'express';
import { param, query as queryValidator, body, validationResult, ValidationChain } from 'express-validator';
// Corrected imports - Add .js extension back
import * as DishModel from '../models/dishModel.js';
import * as RestaurantModel from '../models/restaurantModel.js';
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = express.Router();

// Helper for validation errors
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[Dishes Route Validation Error] Path: ${req.path}`, errors.array());
    res.status(400).json({ error: errors.array()[0].msg });
    return; // Explicit return
  }
  next();
};

// --- Validation Chains ---
const validateIdParam: ValidationChain[] = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('Dish ID must be a positive integer')
    .toInt(),
];
const validateGetDishesQuery: ValidationChain[] = [
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
const validateDishBody: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Dish name is required')
    .isLength({ max: 255 })
    .escape(),
  body('restaurant_id')
    .isInt({ gt: 0 })
    .withMessage('Valid Restaurant ID is required')
    .toInt(),
  // Removed 'adds' validation - shouldn't typically be set via API directly
];

// --- Routes ---

// GET /api/dishes (List/Search Dishes)
router.get(
  '/',
  validateGetDishesQuery,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    const name = (req.query.name as string) || '';
    const limit = req.query.limit as number | undefined ?? 20; // Use validated number or default
    const offset = req.query.offset as number | undefined ?? 0; // Use validated number or default
    try {
      const dishes = await DishModel.findDishesByName(name, limit, offset);
      res.json({ data: dishes || [] });
    } catch (err) {
      console.error('[Dishes GET /] Error:', err);
      next(err);
    }
  }
);

// GET /api/dishes/:id (Get Dish Details)
router.get(
  '/:id',
  validateIdParam,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    const dishId = req.params.id as unknown as number; // Use validated number
    try {
      const dishData = await DishModel.findDishById(dishId);
      if (!dishData) {
        res.status(404).json({ error: 'Dish not found' });
        return; // Explicit return
      }
      res.json({ data: dishData });
    } catch (err) {
      console.error(`[Dishes GET /:id] Error fetching dish ${dishId}:`, err);
      next(err);
    }
  }
);

// POST /api/dishes (Create Dish - Superuser only)
router.post(
  '/',
  authMiddleware,
  requireSuperuser,
  validateDishBody,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Destructure validated/sanitized data
    const { name, restaurant_id } = req.body;
    try {
      // Validate that the restaurant exists
      const restaurantExists = await RestaurantModel.findRestaurantById(restaurant_id);
      if (!restaurantExists) {
        console.warn(`[Dishes POST /] Restaurant ID ${restaurant_id} not found.`);
        res.status(400).json({ error: `Restaurant with ID ${restaurant_id} not found.` });
        return; // Explicit return
      }

      const newDish = await DishModel.createDish({ name, restaurant_id });
      if (!newDish) {
         // This can happen due to ON CONFLICT or other DB issues
         console.warn(`[Dishes POST /] Dish "${name}" likely already exists for restaurant ${restaurant_id}.`);
         // Check if it exists to confirm
         const existing = await DishModel.findDishById(name as any); // Assuming findByName/ID exists or adapt check
         if (existing && existing.restaurant_id === restaurant_id) {
            res.status(409).json({ error: 'Dish with this name already exists for this restaurant.' });
         } else {
            res.status(400).json({ error: 'Dish creation failed for an unknown reason.' });
         }
         return; // Explicit return
      }
      res.status(201).json({ data: newDish });
    } catch (err) {
      console.error('[Dishes POST /] Error creating dish:', err);
       // Check for specific duplicate key error codes if possible
       if ((err as any)?.code === '23505') { // PostgreSQL unique violation
          res.status(409).json({ error: "Dish with this name already exists for this restaurant." });
          return;
       }
      next(err);
    }
  }
);

// PUT /api/dishes/:id (Update Dish - Superuser only)
router.put(
  '/:id',
  authMiddleware,
  requireSuperuser,
  validateIdParam,
  // Slightly different validation for PUT: fields are optional
  [
      body('name').optional().trim().notEmpty().withMessage('Dish name cannot be empty').isLength({ max: 255 }).escape(),
      body('restaurant_id').optional().isInt({ gt: 0 }).withMessage('Valid Restaurant ID is required').toInt(),
      // Add other optional fields if necessary
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const dishId = req.params.id as unknown as number; // Use validated number
    const updateData = req.body; // Contains name?, restaurant_id?

    // Don't allow updating 'adds' via this route
    delete updateData.adds;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No update fields provided." });
    }

    try {
      // If restaurant_id is being updated, validate it exists
      if (updateData.restaurant_id) {
        const restaurantExists = await RestaurantModel.findRestaurantById(updateData.restaurant_id);
        if (!restaurantExists) {
          console.warn(`[Dishes PUT /:id] Cannot update dish ${dishId}: New restaurant ID ${updateData.restaurant_id} not found.`);
          res.status(400).json({ error: `Restaurant with ID ${updateData.restaurant_id} not found.` });
          return; // Explicit return
        }
      }

      const updatedDish = await DishModel.updateDish(dishId, updateData);
      if (!updatedDish) {
        const dishExists = await DishModel.findDishById(dishId);
        if (!dishExists) {
          res.status(404).json({ error: 'Dish not found.' });
          return; // Explicit return
        } else {
          console.warn(`[Dishes PUT /:id] Update for dish ${dishId} returned null, possibly no changes or DB issue.`);
          // Return the existing data if update seemed to fail silently
          res.status(200).json({ data: dishExists, message: 'No changes detected or update failed.' });
          return; // Explicit return
        }
      }
      res.json({ data: updatedDish });
    } catch (err) {
      console.error(`[Dishes PUT /:id] Error updating dish ${dishId}:`, err);
       // Check for specific duplicate key error codes if possible
       if ((err as any)?.code === '23505') { // PostgreSQL unique violation
          res.status(409).json({ error: "Update failed: Dish with this name already exists for the target restaurant." });
          return;
       }
      next(err);
    }
  }
);

// DELETE /api/dishes/:id (Delete Dish - Superuser only)
router.delete(
  '/:id',
  authMiddleware,
  requireSuperuser,
  validateIdParam,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const dishId = req.params.id as unknown as number; // Use validated number
    try {
      const deleted = await DishModel.deleteDish(dishId);
      if (!deleted) {
        res.status(404).json({ error: 'Dish not found.' });
        return; // Explicit return
      }
      res.status(204).send(); // No content on success
    } catch (err) {
      console.error(`[Dishes DELETE /:id] Error deleting dish ${dishId}:`, err);
       // Handle foreign key constraints if needed (though schema uses ON DELETE CASCADE)
      // if ((err as any)?.code === '23503') { ... }
      next(err);
    }
  }
);

export default router;