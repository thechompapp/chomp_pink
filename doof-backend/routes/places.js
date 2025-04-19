/* src/doof-backend/routes/places.js */
import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

const getEnv = (key, defaultValue = '') => process.env[key] || defaultValue;
const GOOGLE_PLACES_API_KEY = getEnv('GOOGLE_PLACES_API_KEY');
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Middleware to check for API key
const checkApiKey = (req, res, next) => {
    const keyFromEnv = process.env.GOOGLE_PLACES_API_KEY;
    // console.log(`[checkApiKey Middleware] Checking GOOGLE_PLACES_API_KEY: ->${keyFromEnv}<-`);
    if (!keyFromEnv) {
        // ** Use console directly here for safety during early middleware errors **
        console.error('[checkApiKey] Google Places API Key is missing from environment variables.');
        return res.status(500).json({ success: false, error: 'Server configuration error: API key missing.' });
    }
    next();
};

// --- Autocomplete Proxy ---
router.get('/proxy/autocomplete', checkApiKey, async (req, res) => {
    const { input } = req.query;

    if (!input) {
        return res.status(400).json({ success: false, error: 'Input query parameter is required.' });
    }
    const url = `${PLACES_API_BASE_URL}/autocomplete/json`;
    const params = { input: input, key: GOOGLE_PLACES_API_KEY };

    try {
        // Use req.log if available AFTER middleware stack likely ran
        (req.log || console).info({ input }, `[Places Proxy Autocomplete] Requesting`);
        const response = await axios.get(url, { params });
        (req.log || console).info({ status: response.data.status }, `[Places Proxy Autocomplete] Google API response`);

        if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
             const predictions = (response.data.predictions || []).map(p => ({
                 description: p.description,
                 place_id: p.place_id,
             }));
            res.json({ success: true, data: predictions });
        } else {
             // Use req.log if available
            (req.log || console).error({ status: response.data.status, error: response.data.error_message }, `[Places Proxy Autocomplete] Google API error`);
            res.status(500).json({ success: false, error: `Google Places API error: ${response.data.status}` });
        }
    } catch (error) {
        // ** Safest Logging in Catch Block **
        const log = req.log || console; // Get logger instance safely
        log.error(error, '[Places Proxy Autocomplete] Network or server error');
        res.status(500).json({ success: false, error: 'Failed to fetch autocomplete suggestions.' });
    }
});


// --- Place Details Proxy ---
router.get('/proxy/details', checkApiKey, async (req, res) => {
    const { placeId } = req.query;
    const log = req.log || console; // Use console as fallback throughout

    if (!placeId) {
        return res.status(400).json({ success: false, error: 'Place ID query parameter is required.' });
    }
    const url = `${PLACES_API_BASE_URL}/details/json`;
    const fields = 'place_id,name,formatted_address,geometry,address_components,url,website,international_phone_number';
    const params = { place_id: placeId, fields: fields, key: GOOGLE_PLACES_API_KEY };

    try {
        log.info({ placeId }, `[Places Proxy Details] Requesting details`);
        const response = await axios.get(url, { params });
        const detailsResult = response.data.result;
        const status = response.data.status;
        log.info({ placeId, status }, `[Places Proxy Details] Google API response`);

        if (status !== 'OK' || !detailsResult) {
            log.error({ placeId, status, error: response.data.error_message }, `[Places Proxy Details] Google API error`);
            return res.status(500).json({ success: false, error: `Google Places API error: ${status}` });
        }

        // --- Data Extraction ---
        const addressComponents = detailsResult.address_components || [];
        log.debug({ msg: `[Places Proxy Details] Raw Address Components for ${placeId}`, placeId: placeId, components: addressComponents });
        const findComponent = (type, components = addressComponents) => components.find(comp => comp.types.includes(type))?.long_name || '';

        // Zipcode Extraction
        let zipcode = findComponent('postal_code');
        if (!zipcode) zipcode = findComponent('postal_code_prefix');
        if (!zipcode) zipcode = findComponent('postal_code_suffix');
        if (!zipcode && detailsResult.formatted_address) { /* ... fallback logic ... */ } // (Keeping existing fallback logic concise)
        zipcode = zipcode && /^\d{5}$/.test(zipcode) ? zipcode : null;

        // City Extraction
        let city = findComponent('locality');
        if (!city) city = findComponent('sublocality_level_1');
        if (!city) city = findComponent('administrative_area_level_3');
        if (!city) city = findComponent('postal_town');

        // Neighborhood Extraction
        let neighborhood = findComponent('neighborhood');
        if (!neighborhood) neighborhood = findComponent('sublocality_level_1');
        const locality = findComponent('locality');
        if (!neighborhood && locality && locality !== city) { neighborhood = locality; }
        if (!neighborhood) neighborhood = findComponent('sublocality');

        log.debug({ placeId, zipcode, city, neighborhood }, `[Places Proxy Details] Extracted values`);

        // Construct response data
        const responseData = {
            placeId: detailsResult.place_id, name: detailsResult.name, formattedAddress: detailsResult.formatted_address,
            location: detailsResult.geometry?.location || null, googleMapsUrl: detailsResult.url, website: detailsResult.website,
            phone: detailsResult.international_phone_number, city: city || null, neighborhood: neighborhood || null,
            zipcode: zipcode, addressComponents: addressComponents,
        };
        res.json({ success: true, data: responseData });

    } catch (error) {
         // ** Safest Logging in Catch Block **
        const log = req.log || console; // Get logger instance safely
        log.error(error, `[Places Proxy Details] Network or server error for ${placeId}`);
        res.status(500).json({ success: false, error: 'Failed to fetch place details.' });
    }
});

export default router;