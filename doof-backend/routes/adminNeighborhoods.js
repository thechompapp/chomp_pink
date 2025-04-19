/* src/doof-backend/routes/adminNeighborhoods.js */
import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import requireSuperuser from '../middleware/requireSuperuser.js'; // Corrected path assuming it's at the root of middleware
import * as neighborhoodModel from '../models/neighborhoodModel.js';

const router = express.Router();

// --- Middleware for all routes in this file ---
router.use(requireSuperuser);

// --- Validation Chains ---
const neighborhoodValidationRules = [
    body('name').trim().notEmpty().withMessage('Neighborhood name is required.').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
    body('city_id').isInt({ gt: 0 }).withMessage('A valid City ID is required.'),
    body('zipcode_ranges') // Match field name used in model/AdminPanel
        .optional({ nullable: true })
        .custom((value) => {
             if (value === null || value === undefined || value === '') return true;
             const codes = Array.isArray(value) ? value : String(value).split(',').map(z => z.trim());
             return codes.every(code => /^\d{5}$/.test(code));
        }).withMessage('Zip codes must be a comma-separated string or array of valid 5-digit codes.')
];

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array({ onlyFirstError: true }) }); // Return only first error
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
    async (req, res, next) => {
        try {
            const {
                limit = 20,
                page = 1,
                sortBy = 'neighborhoods.name',
                sortOrder = 'ASC',
                search,
                cityId,
             } = req.query;

            const offset = (Number(page) - 1) * Number(limit);

            const { neighborhoods, total } = await neighborhoodModel.getAllNeighborhoods(
                Number(limit),
                offset,
                String(sortBy), // Ensure string type
                String(sortOrder), // Ensure string type
                String(search || ''), // Ensure string type
                cityId ? Number(cityId) : undefined // Ensure number or undefined
            );

            const totalPages = Math.ceil(total / Number(limit));

            res.json({
                data: neighborhoods,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// GET /api/admin/neighborhoods/cities - Helper to get cities for dropdowns
router.get(
    '/cities',
    async (req, res, next) => {
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
    async (req, res, next) => {
        try {
            const id = req.params.id; // Already validated as number
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
    async (req, res, next) => {
        try {
             // Prepare data, ensuring zipcode_ranges is handled
             const createData = {
                 name: req.body.name,
                 city_id: req.body.city_id,
                 zipcode_ranges: req.body.zipcode_ranges // Pass directly, model handles parsing
             };
            const newNeighborhood = await neighborhoodModel.createNeighborhood(createData);
            res.status(201).json({ data: newNeighborhood });
        } catch (error) {
             if (error.code === '23505') {
                 return res.status(409).json({ message: 'Neighborhood with this name already exists in the selected city.' });
             }
             if (error.code === '23503') {
                 return res.status(400).json({ message: `Invalid City ID provided.`});
             }
            next(error);
        }
    }
);

// PUT /api/admin/neighborhoods/:id - Update a neighborhood
router.put(
    '/:id',
    idParamValidationRule,
    // Slightly adapt validation for optional fields in PUT
    [
        body('name').optional().trim().notEmpty().withMessage('Neighborhood name cannot be empty if provided.').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
        body('city_id').optional().isInt({ gt: 0 }).withMessage('A valid City ID must be provided if updating city.'),
        body('zipcode_ranges') // Match field name
            .optional({ nullable: true })
            .custom((value) => {
                 if (value === null || value === undefined || value === '') return true;
                 const codes = Array.isArray(value) ? value : String(value).split(',').map(z => z.trim());
                 return codes.every(code => /^\d{5}$/.test(code));
            }).withMessage('Zip codes must be a comma-separated string or array of valid 5-digit codes.')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const id = req.params.id; // Validated number
            // Prepare update data carefully
            const updateData = {};
            if (req.body.name !== undefined) updateData.name = req.body.name;
            if (req.body.city_id !== undefined) updateData.city_id = req.body.city_id;
            if (req.body.zipcode_ranges !== undefined) updateData.zipcode_ranges = req.body.zipcode_ranges; // Pass raw, model handles parsing/null

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ message: "No valid fields provided for update." });
            }

            const updatedNeighborhood = await neighborhoodModel.updateNeighborhood(id, updateData);

            if (!updatedNeighborhood) {
                // Check if it exists to return 404 vs 200 with no change
                 const exists = await neighborhoodModel.getNeighborhoodById(id);
                 if (!exists) {
                    return res.status(404).json({ message: 'Neighborhood not found.' });
                 } else {
                    return res.status(200).json({ data: exists, message: "Update successful, but no changes were applied (data might be identical)." });
                 }
            }
            res.json({ data: updatedNeighborhood });
        } catch (error) {
            if (error.code === '23505') {
                 return res.status(409).json({ message: 'Update failed: Neighborhood name likely conflicts in the target city.' });
             }
             if (error.code === '23503') {
                 return res.status(400).json({ message: `Update failed: Invalid City ID provided.`});
             }
            next(error);
        }
    }
);

// DELETE /api/admin/neighborhoods/:id - Delete a neighborhood
router.delete(
    '/:id',
    idParamValidationRule,
    handleValidationErrors,
    async (req, res, next) => {
        try {
            const id = req.params.id; // Validated number
            const deleted = await neighborhoodModel.deleteNeighborhood(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Neighborhood not found.' });
            }
            res.status(204).send();
        } catch (error) {
             if (error.code === '23503') {
                 return res.status(409).json({ message: 'Cannot delete neighborhood as it is linked to other records (e.g., restaurants).' });
             }
            next(error);
        }
    }
);

export default router;