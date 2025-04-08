/* src/doof-backend/routes/restaurants.js */
import express from 'express';
import { param, query as queryValidator, body, validationResult } from 'express-validator';
// Import model functions
import * as RestaurantModel from '../models/restaurantModel.js';
import authMiddleware from '../middleware/auth.js'; // If needed for POST/PUT/DELETE
import requireSuperuser from '../middleware/requireSuperuser.js'; // If needed

const router = express.Router();

// --- Middleware & Validation ---
const validateIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('Restaurant ID must be a positive integer').toInt()
];
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn(`[Restaurants Route Validation Error] Path: ${req.path}`, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};
// Validation for creating/updating a restaurant
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
    // Note: 'adds' count is usually managed internally, not set via API directly
];

// GET /api/restaurants/:id (Restaurant Detail)
router.get(
    '/:id',
    validateIdParam,
    handleValidationErrors,
    async (req, res, next) => {
        const { id } = req.params;
        try {
            const restaurantData = await RestaurantModel.findRestaurantByIdWithDetails(id); // Use Model

            if (!restaurantData) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
             // Model already combines data and formats it
            res.json({ data: restaurantData });

        } catch (err) {
            console.error(`[Restaurants GET /:id] Error fetching restaurant ${id}:`, err);
            next(err);
        }
    }
);

// POST /api/restaurants (Create Restaurant - Requires Superuser)
router.post('/', authMiddleware, requireSuperuser, validateRestaurantBody, handleValidationErrors, async (req, res, next) => {
  try {
     const newRestaurant = await RestaurantModel.createRestaurant(req.body);
     if (!newRestaurant) {
         // This could happen due to ON CONFLICT DO NOTHING if it already exists
         // Maybe return 409 Conflict or fetch and return existing?
         // For now, assume creation or retrieval of existing is handled by model.
         // If model returns null/undefined on conflict, treat as error here.
         return res.status(409).json({ error: "Restaurant with this name/city likely already exists." });
     }
     res.status(201).json({ data: newRestaurant }); // Model formats response
  } catch (err) {
      console.error(`[Restaurants POST /] Error creating restaurant:`, err);
      next(err);
   }
});

// PUT /api/restaurants/:id (Update Restaurant - Requires Superuser)
router.put('/:id', authMiddleware, requireSuperuser, validateIdParam, validateRestaurantBody, handleValidationErrors, async (req, res, next) => {
   const { id } = req.params;
   try {
      const updatedRestaurant = await RestaurantModel.updateRestaurant(id, req.body);
      if (!updatedRestaurant) return res.status(404).json({ error: 'Restaurant not found or no changes made.' });
      res.json({ data: updatedRestaurant }); // Model formats response
   } catch (err) {
       console.error(`[Restaurants PUT /:id] Error updating restaurant ${id}:`, err);
       next(err);
    }
});

// DELETE /api/restaurants/:id (Delete Restaurant - Requires Superuser)
// Note: Actual deletion might be preferred via the generic admin route for consistency
// router.delete('/:id', authMiddleware, requireSuperuser, validateIdParam, handleValidationErrors, async (req, res, next) => {
//    const { id } = req.params;
//    try {
//        const deleted = await RestaurantModel.deleteRestaurant(id);
//        if (!deleted) return res.status(404).json({ error: 'Restaurant not found' });
//        res.status(204).send();
//    } catch (err) {
//        console.error(`[Restaurants DELETE /:id] Error deleting restaurant ${id}:`, err);
//        next(err);
//     }
// });

// GET /api/restaurants (List Restaurants - Placeholder, implement if needed beyond search/admin)
// router.get('/', /* validation? */ handleValidationErrors, async (req, res, next) => {
//     try {
//         // Call a ListModel.findRestaurants function with filters/pagination
//         res.status(501).json({ error: "Listing restaurants not implemented yet." });
//     } catch (err) { next(err); }
// });


export default router;