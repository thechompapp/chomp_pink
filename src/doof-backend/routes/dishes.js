/* src/doof-backend/routes/dishes.js */
import express from 'express';
import { param, query as queryValidator, body, validationResult } from 'express-validator';
// Import model functions
import * as DishModel from '../models/dishModel.js';
import * as RestaurantModel from '../models/restaurantModel.js'; // Needed for restaurant check
import authMiddleware from '../middleware/auth.js';
import requireSuperuser from '../middleware/requireSuperuser.js';

const router = express.Router();

// --- Middleware & Validation Chains ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Dishes Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};
const validateIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('Dish ID must be a positive integer').toInt()
];
const validateGetDishesQuery = [
    queryValidator('name').optional().trim().notEmpty().withMessage('Name query must not be empty if provided').isLength({ max: 100 }),
    queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
    queryValidator('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer').toInt()
];
const validateDishBody = [
    body('name').trim().notEmpty().withMessage('Dish name is required').isLength({ max: 255 }),
    body('restaurant_id').isInt({ gt: 0 }).withMessage('Valid Restaurant ID is required').toInt(),
    // Add validation for other fields like tags if they can be set on create/update
];

// GET /api/dishes (List/Suggest Dishes)
router.get(
    "/",
    validateGetDishesQuery,
    handleValidationErrors,
    async (req, res, next) => {
        const { name = '', limit = 20, offset = 0 } = req.query;
        try {
          const dishes = await DishModel.findDishesByName(name, limit, offset); // Use Model
          res.json({ data: dishes || [] }); // Model formats simplified response
        } catch (err) {
          console.error("/api/dishes (GET List) error:", err);
          next(err);
        }
    }
);

// GET /api/dishes/:id (Dish Detail)
router.get(
  "/:id",
  validateIdParam,
  handleValidationErrors,
  async (req, res, next) => {
    const { id } = req.params;
    try {
      const dishData = await DishModel.findDishById(id); // Use Model
      if (!dishData) {
        return res.status(404).json({ error: "Dish not found" });
      }
      res.json({ data: dishData }); // Model formats response
    } catch (err) {
      console.error(`/api/dishes/${id} (GET Detail) error:`, err);
      next(err);
    }
  }
);

// POST /api/dishes (Create Dish - Requires Superuser)
router.post('/', authMiddleware, requireSuperuser, validateDishBody, handleValidationErrors, async (req, res, next) => {
  try {
      // Check if restaurant exists
      const restaurantExists = await RestaurantModel.findRestaurantById(req.body.restaurant_id);
      if (!restaurantExists) {
           return res.status(400).json({ error: `Restaurant with ID ${req.body.restaurant_id} not found.` });
      }

      const newDish = await DishModel.createDish(req.body);
      if (!newDish) {
           // Handle conflict (dish might already exist for this restaurant)
           return res.status(409).json({ error: "Dish with this name likely already exists for this restaurant." });
      }
      res.status(201).json({ data: newDish }); // Model formats response
  } catch (err) {
      console.error(`[Dishes POST /] Error creating dish:`, err);
      next(err);
  }
});

// PUT /api/dishes/:id (Update Dish - Requires Superuser)
router.put('/:id', authMiddleware, requireSuperuser, validateIdParam, validateDishBody, handleValidationErrors, async (req, res, next) => {
   const { id } = req.params;
   try {
       // Check if referenced restaurant exists if restaurant_id is being changed
       if (req.body.restaurant_id) {
           const restaurantExists = await RestaurantModel.findRestaurantById(req.body.restaurant_id);
           if (!restaurantExists) {
                return res.status(400).json({ error: `Restaurant with ID ${req.body.restaurant_id} not found.` });
           }
       }

       const updatedDish = await DishModel.updateDish(id, req.body);
       if (!updatedDish) return res.status(404).json({ error: 'Dish not found or no changes made.' });
       res.json({ data: updatedDish }); // Model formats response
   } catch (err) {
        console.error(`[Dishes PUT /:id] Error updating dish ${id}:`, err);
       next(err);
    }
});

// DELETE /api/dishes/:id (Delete Dish - Requires Superuser)
// Note: Actual deletion might be preferred via the generic admin route for consistency
// router.delete('/:id', authMiddleware, requireSuperuser, validateIdParam, handleValidationErrors, async (req, res, next) => {
//    const { id } = req.params;
//    try {
//        const deleted = await DishModel.deleteDish(id);
//        if (!deleted) return res.status(404).json({ error: 'Dish not found' });
//        res.status(204).send();
//    } catch (err) {
//        console.error(`[Dishes DELETE /:id] Error deleting dish ${id}:`, err);
//        next(err);
//     }
// });


export default router;