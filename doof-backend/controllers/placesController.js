// Filename: /root/doof-backend/controllers/placesController.js
import axios from 'axios';
import config from '../config/config.js';

// Constants
const GOOGLE_PLACES_API_BASE_URL = config.PLACES_API_BASE_URL || 'https://maps.googleapis.com/maps/api/place';
const DEFAULT_ERROR_MESSAGE = 'Failed to fetch data from Places API.';

/**
 * Helper function to handle API errors consistently
 * @param {Error} error - The error object from axios
 * @param {string} defaultMessage - Default error message
 * @returns {Object} Standardized error response
 */
const handleApiError = (error, defaultMessage) => {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error_message || defaultMessage;
    return { status, response: { success: false, message, error: error.response?.data } };
};

/**
 * Proxy Google Places Autocomplete requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const proxyAutocomplete = async (req, res, next) => {
    try {
        // Mock data for development mode to avoid API key dependency
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                data: [
                    { place_id: 'mock_place_1', description: 'New York, NY, USA', structured_formatting: { main_text: 'New York', secondary_text: 'NY, USA' } },
                    { place_id: 'mock_place_2', description: 'New York Mills, NY, USA', structured_formatting: { main_text: 'New York Mills', secondary_text: 'NY, USA' } }
                ],
                status: 'OK'
            });
        }
        
        // Production mode - use actual API
        const response = await axios.get(`${GOOGLE_PLACES_API_BASE_URL}/autocomplete/json`, { 
            params: { ...req.query, key: config.googlePlacesApiKey } 
        });
        
        res.json({ 
            success: true, 
            data: response.data.predictions, 
            status: response.data.status 
        });
    } catch (error) {
        const { status, response } = handleApiError(error, 'Failed to fetch autocomplete suggestions.');
        res.status(status).json(response);
    }
};

/**
 * Format place details response to match expected frontend format
 * @param {Object} result - Google Places API result object
 * @returns {Object} Formatted place details
 */
const formatPlaceDetails = (result = {}) => ({
    placeId: result.place_id,
    name: result.name,
    formattedAddress: result.formatted_address,
    location: result.geometry?.location,
    addressComponents: result.address_components,
    website: result.website,
    phone: result.formatted_phone_number,
    zipcode: result.address_components?.find(c => c.types.includes('postal_code'))?.short_name,
});

/**
 * Proxy Google Places Details requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const proxyDetails = async (req, res, next) => {
    // Extract and normalize place ID parameter
    const { placeId, place_id, ...otherParams } = req.query;
    const actualPlaceId = placeId || place_id;
    
    // Validate required parameters
    if (!actualPlaceId) {
        return res.status(400).json({
            success: false,
            message: 'Missing required parameter: placeId or place_id'
        });
    }
    
    try {
        // Mock data for development mode to avoid API key dependency
        if (process.env.NODE_ENV === 'development') {
            // Return mock data based on the place ID
            const mockResult = {
                place_id: actualPlaceId,
                name: actualPlaceId === 'mock_place_1' ? 'New York' : 'New York Mills',
                formatted_address: actualPlaceId === 'mock_place_1' ? 'New York, NY, USA' : 'New York Mills, NY, USA',
                geometry: { location: { lat: 40.7128, lng: -74.0060 } },
                address_components: [
                    { long_name: 'New York', short_name: 'NY', types: ['locality'] },
                    { long_name: '10001', short_name: '10001', types: ['postal_code'] },
                    { long_name: 'United States', short_name: 'US', types: ['country'] }
                ],
                website: 'https://www.nyc.gov/',
                formatted_phone_number: '+1 (212) 555-1234'
            };
            
            return res.json({
                success: true,
                data: formatPlaceDetails(mockResult),
                status: 'OK'
            });
        }
        
        // Production mode - use actual API
        const response = await axios.get(`${GOOGLE_PLACES_API_BASE_URL}/details/json`, {
            params: {
                ...otherParams,
                place_id: actualPlaceId,
                key: config.googlePlacesApiKey
            }
        });
        
        const result = response.data?.result || {};
        const formatted = formatPlaceDetails(result);
        
        res.json({
            success: true,
            data: formatted,
            status: response.data.status
        });
    } catch (error) {
        const { status, response } = handleApiError(error, 'Failed to fetch place details.');
        res.status(status).json(response);
    }
};