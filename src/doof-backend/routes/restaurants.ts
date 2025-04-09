import express, { Request, Response, NextFunction } from 'express';
import { param, query as queryValidator, body, validationResult, ValidationChain } from 'express-validator';
// FIX: Import from .ts file implicitly
import * as RestaurantModel from '../models/restaurantModel';
import authMiddleware from '../middleware/auth.js'; // Keep .js for compiled middleware
import requireSuperuser from '../middleware/requireSuperuser.js'; // Keep .js for compiled middleware
// Import AuthenticatedRequest if needed for superuser routes
import type { AuthenticatedRequest } from '../middleware/auth.js'; // Keep .js for compiled middleware

const router = express.Router();

const validateIdParam: ValidationChain[] = [
    param('id').isInt({ gt: 0 }).withMessage('Restaurant ID must be a positive integer').toInt()
];
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Restaurants Route Validation Error] Path: ${req.path}`, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return; // Explicit return
    }
    next();
};
const validateRestaurantBody: ValidationChain[] = [
    body('name').trim().notEmpty().withMessage('Restaurant name is required').isLength({ max: 255 }),
    body('city_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('City ID must be a positive integer').toInt(),
    body('neighborhood_id').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Neighborhood ID must be a positive integer').toInt(),
    body('city_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('neighborhood_name').optional({ nullable: true }).trim().isLength({ max: 100 }),
    body('address').optional({ nullable: true }).trim().isLength({ max: 500 }),
    body('google_place_id').optional({ nullable: true }).trim().isLength({ max: 255 }),
    body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude').toFloat(),
    body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude').toFloat(),
    // Removed 'adds' validation - generally shouldn't be updated directly via API
];

router.get(
    '/:id',
    validateIdParam,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as unknown as number; // ID is already parsed/validated
        try {
            const restaurantData = await RestaurantModel.findRestaurantByIdWithDetails(id);
            if (!restaurantData) {
                res.status(404).json({ error: 'Restaurant not found' });
                return; // Explicit return
            }
            res.json({ data: restaurantData });
        } catch (err) {
            console.error(`[Restaurants GET /:id] Error fetching restaurant ${id}:`, err);
            next(err);
        }
    }
);

// Use AuthenticatedRequest for routes requiring auth/superuser
router.post('/', authMiddleware, requireSuperuser, validateRestaurantBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const newRestaurant = await RestaurantModel.createRestaurant(req.body);
        if (!newRestaurant) {
            // This can happen due to ON CONFLICT DO NOTHING or other potential issues
            console.warn(`[Restaurants POST /] Restaurant creation did not return a result, likely duplicate or error.`);
            // Check if it exists to provide a better error message
             const existing = await RestaurantModel.findRestaurantById(req.body.name); // Assuming findByName exists or adapt check
             if (existing) {
                res.status(409).json({ error: "Restaurant creation failed: name likely already exists in this city." });
             } else {
                res.status(400).json({ error: "Restaurant creation failed for an unknown reason." });
             }
             return;
        }
        res.status(201).json({ data: newRestaurant });
    } catch (err) {
        console.error(`[Restaurants POST /] Error creating restaurant:`, err);
        // Check for specific duplicate key error codes if possible (e.g., '23505' for PostgreSQL)
        if ((err as any)?.code === '23505') {
             res.status(409).json({ error: "Restaurant creation failed, likely already exists." });
             return;
        }
        next(err);
    }
});

// Use AuthenticatedRequest for routes requiring auth/superuser
router.put('/:id', authMiddleware, requireSuperuser, validateIdParam, validateRestaurantBody, handleValidationErrors, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const id = req.params.id as unknown as number; // Already parsed/validated
    try {
        const updatedRestaurant = await RestaurantModel.updateRestaurant(id, req.body);
        if (!updatedRestaurant) {
            // Check if the restaurant actually exists
            const checkExists = await RestaurantModel.findRestaurantById(id);
             if (!checkExists) {
                res.status(404).json({ error: 'Restaurant not found.' });
             } else {
                 console.warn(`[Restaurants PUT /:id] Update for restaurant ${id} returned null, possibly no changes made.`);
                 // Return existing data if no changes or update failed silently
                 res.status(200).json({ data: checkExists, message: "No changes detected or update failed." });
             }
             return; // Explicit return
        }
        res.json({ data: updatedRestaurant });
    } catch (err) {
        console.error(`[Restaurants PUT /:id] Error updating restaurant ${id}:`, err);
         // Check for specific error codes if possible (e.g., unique constraint violations on update)
        if ((err as any)?.code === '23505') {
             res.status(409).json({ error: "Update failed, conflicts with existing data." });
             return;
        }
        next(err);
    }
});

// Add DELETE route (requires auth/superuser)
router.delete(
    '/:id',
    authMiddleware,
    requireSuperuser,
    validateIdParam,
    handleValidationErrors,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const id = req.params.id as unknown as number; // Already parsed/validated
        try {
            const deleted = await RestaurantModel.deleteRestaurant(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Restaurant not found.' });
            }
            res.status(204).send(); // No content on successful deletion
        } catch (err) {
             console.error(`[Restaurants DELETE /:id] Error deleting restaurant ${id}:`, err);
             // Handle specific errors like foreign key constraints if needed
             if (err instanceof Error && (err as any).code === '23503') {
                  return res.status(409).json({ error: 'Cannot delete restaurant: It is referenced by other items (e.g., dishes).' });
             }
             next(err); // Pass other errors to handler
        }
    }
);


export default router;