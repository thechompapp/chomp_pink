// src/doof-backend/routes/adminNeighborhoods.ts
import express, { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { requireSuperuser } from '../middleware/auth.js'; // Assuming superuser check middleware exists
import * as neighborhoodModel from '../models/neighborhoodModel.js';
import { Neighborhood } from '../../types.js';

const router = express.Router();

// --- Middleware for all routes in this file ---
router.use(requireSuperuser); // Ensure only superusers can manage neighborhoods

// --- Validation Chains ---
const neighborhoodValidationRules = [
    body('name').trim().notEmpty().withMessage('Neighborhood name is required.').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
    body('city_id').isInt({ gt: 0 }).withMessage('A valid City ID is required.'),
    // Add more validation as needed based on your Neighborhood type
];

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const paginationValidationRules = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.').toInt(),
    query('sortBy').optional().isString().trim().escape(),
    query('sortOrder').optional().toUpperCase().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC.'),
    query('search').optional().isString().trim().escape(),
    query('cityId').optional().isInt({ min: 1 }).withMessage('City ID must be a positive integer.').toInt(),
];

const idParamValidationRule = param('id').isInt({ gt: 0 }).withMessage('A valid numeric ID parameter is required.').toInt();


// --- Routes ---

// GET /api/admin/neighborhoods - Get all neighborhoods (paginated, sorted, filtered)
router.get(
    '/',
    paginationValidationRules,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                limit = 20, // Default limit
                page = 1,   // Default page
                sortBy = 'neighborhoods.name',
                sortOrder = 'ASC',
                search,
                cityId,
             } = req.query as { limit?: number; page?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC'; search?: string; cityId?: number };

            const offset = (page - 1) * limit;

            const { neighborhoods, total } = await neighborhoodModel.getAllNeighborhoods(
                limit,
                offset,
                sortBy,
                sortOrder,
                search,
                cityId
            );

            const totalPages = Math.ceil(total / limit);

            res.json({
                data: neighborhoods,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages,
                },
            });
        } catch (error) {
            next(error); // Pass error to global error handler
        }
    }
);

// GET /api/admin/neighborhoods/cities - Helper to get cities for dropdowns
router.get(
    '/cities',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cities = await neighborhoodModel.getAllCitiesSimple();
            res.json({ data: cities });
        } catch (error) {
            next(error);
        }
    }
);


// GET /api/admin/neighborhoods/:id - Get single neighborhood by ID
router.get(
    '/:id',
    idParamValidationRule,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // The param 'id' is already validated and converted to number by middleware
            const id = (req.params as any).id as number;
            const neighborhood = await neighborhoodModel.getNeighborhoodById(id);
            if (!neighborhood) {
                return res.status(404).json({ message: 'Neighborhood not found.' });
            }
            res.json({ data: neighborhood });
        } catch (error) {
            next(error);
        }
    }
);

// POST /api/admin/neighborhoods - Create a new neighborhood
router.post(
    '/',
    neighborhoodValidationRules,
    handleValidationErrors,
    async (req: Request<{}, {}, Omit<Neighborhood, 'id'>>, res: Response, next: NextFunction) => {
        try {
            const newNeighborhood = await neighborhoodModel.createNeighborhood(req.body);
            res.status(201).json({ data: newNeighborhood });
        } catch (error) {
             // Add specific error handling, e.g., duplicate name within city
             // if (error.code === '23505') { // Example for unique constraint violation
             //     return res.status(409).json({ message: 'Neighborhood with this name already exists in the selected city.' });
             // }
            next(error);
        }
    }
);

// PUT /api/admin/neighborhoods/:id - Update a neighborhood
router.put(
    '/:id',
    idParamValidationRule,
    // Run same validation rules, but make fields optional for partial updates conceptually
    // express-validator handles missing fields gracefully in PUT if not using .notEmpty()
    // We can refine this if strict "all fields required for update" is needed
    body('name').optional().trim().notEmpty().withMessage('Neighborhood name cannot be empty if provided.').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
    body('city_id').optional().isInt({ gt: 0 }).withMessage('A valid City ID must be provided if updating city.'),
    handleValidationErrors,
    async (req: Request<{ id: string }, {}, Partial<Omit<Neighborhood, 'id'>>>, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id, 10); // Already validated, but keep parse for clarity
            const updatedNeighborhood = await neighborhoodModel.updateNeighborhood(id, req.body);

            if (!updatedNeighborhood) {
                return res.status(404).json({ message: 'Neighborhood not found or no changes made.' });
            }
            res.json({ data: updatedNeighborhood });
        } catch (error) {
            // Add specific error handling
            next(error);
        }
    }
);

// DELETE /api/admin/neighborhoods/:id - Delete a neighborhood
router.delete(
    '/:id',
    idParamValidationRule,
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = (req.params as any).id as number;
            const deleted = await neighborhoodModel.deleteNeighborhood(id);
            if (!deleted) {
                 // This could be 404 (not found) or maybe 409 (conflict if dependent items exist and deletion blocked)
                return res.status(404).json({ message: 'Neighborhood not found.' });
            }
            res.status(204).send(); // Success, no content
        } catch (error) {
            // Handle potential foreign key constraint errors if deletion fails due to dependencies
            // if (error.code === '23503') { // Example FK violation code
            //     return res.status(409).json({ message: 'Cannot delete neighborhood as it is linked to other records (e.g., restaurants).' });
            // }
            next(error);
        }
    }
);

export default router;