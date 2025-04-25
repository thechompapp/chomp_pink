// Filename: /root/doof-backend/controllers/placesController.js
/* REFACTORED: Convert to ES Modules */
import axios from 'axios'; // Use import
import config from '../config/config.js'; // Use import, add .js

const GOOGLE_PLACES_API_BASE_URL = config.PLACES_API_BASE_URL || 'https://maps.googleapis.com/maps/api/place'; // Use config

// Controller to proxy Google Places Autocomplete requests
export const proxyAutocomplete = async (req, res, next) => {
    const apiKey = config.GOOGLE_PLACES_API_KEY;
    if (!apiKey) { return res.status(503).json({ success: false, message: 'Service unavailable (Places API Key missing).' }); }
    try {
        const response = await axios.get(`${GOOGLE_PLACES_API_BASE_URL}/autocomplete/json`, { params: { ...req.query, key: apiKey } });
        // Forward success=true and data/status from Google
        res.json({ success: true, data: response.data.predictions, status: response.data.status });
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.error_message || 'Failed to fetch autocomplete suggestions.';
        // Send structured error
        res.status(status).json({ success: false, message: message, error: error.response?.data });
    }
};

// Controller to proxy Google Places Details requests
export const proxyDetails = async (req, res, next) => {
    const apiKey = config.GOOGLE_PLACES_API_KEY;
    if (!apiKey) { return res.status(503).json({ success: false, message: 'Service unavailable (Places API Key missing).' }); }
    const { placeId, place_id, ...otherParams } = req.query; // Accept both placeId and place_id
    const actualPlaceId = placeId || place_id;
    if (!actualPlaceId) { return res.status(400).json({ success: false, message: 'Missing required parameter: placeId or place_id' }); }
    try {
        const response = await axios.get(`${GOOGLE_PLACES_API_BASE_URL}/details/json`, { params: { ...otherParams, place_id: actualPlaceId, key: apiKey } });
        // Forward success=true and data/status from Google
        // Structure it similar to how PlacesAutocomplete component expects
        const result = response.data?.result || {};
        const formatted = {
              placeId: result.place_id,
              name: result.name,
              formattedAddress: result.formatted_address,
              location: result.geometry?.location,
              addressComponents: result.address_components,
              website: result.website,
              phone: result.formatted_phone_number,
              // Extract zipcode more reliably
              zipcode: result.address_components?.find(c => c.types.includes('postal_code'))?.short_name,
          };
        res.json({ success: true, data: formatted, status: response.data.status });
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.error_message || 'Failed to fetch place details.';
        res.status(status).json({ success: false, message: message, error: error.response?.data });
    }
};