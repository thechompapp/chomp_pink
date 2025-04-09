import express, { Request, Response, NextFunction } from 'express';
import { param, query as queryValidator, body, validationResult } from 'express-validator';
import * as RestaurantModel from '../models/restaurantModel.ts';
import authMiddleware from '../middleware/auth.ts';
import requireSuperuser from '../middleware/requireSuperuser.ts';

const router = express.Router();

const validateIdParam = [
    param('id').isInt({ gt: 0 }).withMessage('Restaurant ID must be a positive integer').toInt()
];
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`[Restaurants Route Validation Error] Path: ${req.path}`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};
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
];

router.get(
    '/:id',
    validateIdParam,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;
        try {
            const restaurantData = await RestaurantModel.findRestaurantByIdWithDetails(id);
            if (!restaurantData) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            res.json({ data: restaurantData });
        } catch (err) {
            console.error(`[Restaurants GET /:id] Error fetching restaurant ${id}:`, err);
            next(err);
        }
    }
);

router.post('/', authMiddleware, requireSuperuser, validateRestaurantBody, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newRestaurant = await RestaurantModel.createRestaurant(req.body);
        if (!newRestaurant) {
            return res.status(409).json({ error: "Restaurant with this name/city likely already exists." });
        }
        res.status(201).json({ data: newRestaurant });
    } catch (err) {
        console.error(`[Restaurants POST /] Error creating restaurant:`, err);
        next(err);
    }
});

router.put('/:id', authMiddleware, requireSuperuser, validateIdParam, validateRestaurantBody, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
        const updatedRestaurant = await RestaurantModel.updateRestaurant(id, req.body);
        if (!updatedRestaurant) return res.status(404).json({ error: 'Restaurant not found or no changes made.' });
        res.json({ data: updatedRestaurant });
    } catch (err) {
        console.error(`[Restaurants PUT /:id] Error updating restaurant ${id}:`, err);
        next(err);
    }
});

export default router;