// Admin Locations Routes
// Unified management of cities and neighborhoods in hierarchical structure

import express from 'express';
import locationModel from '../models/locationModel.js';
import { requireAuth, requireSuperuser } from '../middleware/auth.js';
import { logInfo, logError } from '../utils/logger.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireSuperuser);

// GET /api/admin/locations/hierarchy - Get complete location hierarchy
router.get('/hierarchy', async (req, res, next) => {
    try {
        logInfo(`[AdminLocations] Fetching location hierarchy for user: ${req.user?.username} (${req.user?.id})`);
        
        const hierarchy = await locationModel.getLocationHierarchy();
        
        res.json({
            data: hierarchy,
            message: 'Location hierarchy retrieved successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error fetching location hierarchy:', error);
        next(error);
    }
});

// GET /api/admin/locations/cities - Get cities with enhanced info
router.get('/cities', async (req, res, next) => {
    try {
        logInfo(`[AdminLocations] Fetching enhanced cities for user: ${req.user?.username} (${req.user?.id})`);
        
        const cities = await locationModel.getCitiesEnhanced();
        
        res.json({
            data: cities,
            message: 'Enhanced cities retrieved successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error fetching enhanced cities:', error);
        next(error);
    }
});

// GET /api/admin/locations/neighborhoods/:cityId - Get neighborhoods by city
router.get('/neighborhoods/:cityId', async (req, res, next) => {
    try {
        const { cityId } = req.params;
        const { includeChildren = 'true' } = req.query;
        
        logInfo(`[AdminLocations] Fetching neighborhoods for city ${cityId}, includeChildren: ${includeChildren}`);
        
        const neighborhoods = await locationModel.getNeighborhoodsByCity(
            parseInt(cityId),
            includeChildren === 'true'
        );
        
        res.json({
            data: neighborhoods,
            message: 'Neighborhoods retrieved successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error fetching neighborhoods:', error);
        next(error);
    }
});

// GET /api/admin/locations/search - Search locations
router.get('/search', async (req, res, next) => {
    try {
        const { q: searchTerm = '', limit = 25 } = req.query;
        
        logInfo(`[AdminLocations] Searching locations: "${searchTerm}", limit: ${limit}`);
        
        const results = await locationModel.searchLocations(searchTerm, parseInt(limit));
        
        res.json({
            data: results,
            message: 'Location search completed successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error searching locations:', error);
        next(error);
    }
});

// POST /api/admin/locations/resolve - Resolve address to location
router.post('/resolve', async (req, res, next) => {
    try {
        const { addressCity, addressState = 'NY' } = req.body;
        
        if (!addressCity) {
            return res.status(400).json({
                error: 'Address city is required'
            });
        }
        
        logInfo(`[AdminLocations] Resolving address: ${addressCity}, ${addressState}`);
        
        const resolution = await locationModel.resolveAddress(addressCity, addressState);
        
        res.json({
            data: resolution,
            message: resolution 
                ? `Address resolved: ${resolution.resolution_type}` 
                : 'No resolution found for address'
        });
    } catch (error) {
        logError('[AdminLocations] Error resolving address:', error);
        next(error);
    }
});

// POST /api/admin/locations/cities - Create new city
router.post('/cities', async (req, res, next) => {
    try {
        const cityData = req.body;
        
        logInfo(`[AdminLocations] Creating new city: ${cityData.name} by user: ${req.user?.username}`);
        
        const newCity = await locationModel.createLocation('city', cityData);
        
        res.status(201).json({
            data: newCity,
            message: 'City created successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error creating city:', error);
        
        // Handle custom error codes from the model
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                error: {
                    code: error.code,
                    type: 'validation_error'
                }
            });
        }
        
        next(error);
    }
});

// POST /api/admin/locations/neighborhoods - Create new neighborhood
router.post('/neighborhoods', async (req, res, next) => {
    try {
        const neighborhoodData = req.body;
        
        logInfo(`[AdminLocations] Creating new neighborhood: ${neighborhoodData.name} by user: ${req.user?.username}`);
        
        const newNeighborhood = await locationModel.createLocation('neighborhood', neighborhoodData);
        
        res.status(201).json({
            data: newNeighborhood,
            message: 'Neighborhood created successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error creating neighborhood:', error);
        
        // Handle custom error codes from the model
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                error: {
                    code: error.code,
                    type: 'validation_error'
                }
            });
        }
        
        next(error);
    }
});

// PUT /api/admin/locations/cities/:id - Update city
router.put('/cities/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        logInfo(`[AdminLocations] Updating city ${id} by user: ${req.user?.username}`);
        
        const updatedCity = await locationModel.updateLocation('city', parseInt(id), updateData);
        
        res.json({
            data: updatedCity,
            message: 'City updated successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error updating city:', error);
        next(error);
    }
});

// PUT /api/admin/locations/neighborhoods/:id - Update neighborhood
router.put('/neighborhoods/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        logInfo(`[AdminLocations] Updating neighborhood ${id} by user: ${req.user?.username}`);
        
        const updatedNeighborhood = await locationModel.updateLocation('neighborhood', parseInt(id), updateData);
        
        res.json({
            data: updatedNeighborhood,
            message: 'Neighborhood updated successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error updating neighborhood:', error);
        next(error);
    }
});

// DELETE /api/admin/locations/cities/:id - Delete city
router.delete('/cities/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        logInfo(`[AdminLocations] Deleting city ${id} by user: ${req.user?.username}`);
        
        const deletedCity = await locationModel.deleteLocation('city', parseInt(id));
        
        res.json({
            data: deletedCity,
            message: 'City deleted successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error deleting city:', error);
        next(error);
    }
});

// DELETE /api/admin/locations/neighborhoods/:id - Delete neighborhood
router.delete('/neighborhoods/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        logInfo(`[AdminLocations] Deleting neighborhood ${id} by user: ${req.user?.username}`);
        
        const deletedNeighborhood = await locationModel.deleteLocation('neighborhood', parseInt(id));
        
        res.json({
            data: deletedNeighborhood,
            message: 'Neighborhood deleted successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error deleting neighborhood:', error);
        next(error);
    }
});

// GET /api/admin/locations/stats - Get location statistics
router.get('/stats', async (req, res, next) => {
    try {
        logInfo(`[AdminLocations] Fetching location statistics for user: ${req.user?.username}`);
        
        // Get basic stats
        const cities = await locationModel.getCitiesEnhanced();
        const totalCities = cities.length;
        const totalNeighborhoods = cities.reduce((sum, city) => sum + (city.neighborhood_count || 0), 0);
        const totalBoroughs = cities.reduce((sum, city) => sum + (city.borough_count || 0), 0);
        const metroAreas = cities.filter(city => city.is_metro_area).length;
        
        const stats = {
            total_cities: totalCities,
            total_neighborhoods: totalNeighborhoods,
            total_boroughs: totalBoroughs,
            metro_areas: metroAreas,
            cities_with_boroughs: cities.filter(city => city.has_boroughs).length,
            avg_neighborhoods_per_city: totalCities > 0 ? Math.round(totalNeighborhoods / totalCities) : 0
        };
        
        res.json({
            data: stats,
            message: 'Location statistics retrieved successfully'
        });
    } catch (error) {
        logError('[AdminLocations] Error fetching location statistics:', error);
        next(error);
    }
});

export default router; 