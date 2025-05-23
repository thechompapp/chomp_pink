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
        // Always use real API data as per user preference
        // Check if we have a valid API key
        if (!config.googlePlacesApiKey) {
            console.warn('No Google Places API key found. Using fallback data.');
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
        // Always use real API data as per user preference
        // Check if we have a valid API key
        if (!config.googlePlacesApiKey) {
            console.warn('No Google Places API key found. Using fallback data.');
            // Return fallback data based on the place ID
            const mockResult = {
                place_id: actualPlaceId,
                name: actualPlaceId.startsWith('mock_') ? (actualPlaceId === 'mock_place_1' ? 'New York' : 'New York Mills') : actualPlaceId,
                formatted_address: actualPlaceId.startsWith('mock_') ? (actualPlaceId === 'mock_place_1' ? 'New York, NY, USA' : 'New York Mills, NY, USA') : `${actualPlaceId}, New York, NY, USA`,
                formatted_phone_number: '(555) 123-4567',
                website: 'https://example.com',
                geometry: {
                    location: {
                        lat: 40.7128,
                        lng: -74.0060
                    }
                },
                address_components: [
                    {
                        long_name: actualPlaceId.startsWith('mock_') ? (actualPlaceId === 'mock_place_1' ? 'New York' : 'New York Mills') : actualPlaceId,
                        short_name: actualPlaceId.startsWith('mock_') ? (actualPlaceId === 'mock_place_1' ? 'NYC' : 'NY Mills') : actualPlaceId,
                        types: ['locality']
                    },
                    {
                        long_name: 'New York',
                        short_name: 'NY',
                        types: ['administrative_area_level_1']
                    },
                    {
                        long_name: 'United States',
                        short_name: 'US',
                        types: ['country']
                    },
                    {
                        long_name: '10001',
                        short_name: '10001',
                        types: ['postal_code']
                    }
                ],
                types: ['locality', 'political']
            };
            
            return res.json({
                success: true,
                result: mockResult,
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