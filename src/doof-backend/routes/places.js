/* src/doof-backend/routes/places.js */
import express from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
import { Client } from "@googlemaps/google-maps-services-js"; // PlaceInputType removed as not used after TS removal
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const googleMapsClient = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn("[Places Route Validation Error]", req.path, errors.array());
        res.status(400).json({ error: errors.array()[0].msg });
        return;
    }
    next();
};

const checkApiKey = (req, res, next) => {
    if (!GOOGLE_API_KEY) {
        console.error(`[Places Route /proxy] FATAL Error: Google API key (GOOGLE_API_KEY) not configured on server.`);
        res.status(503).json({ success: false, message: "Places lookup service is temporarily unavailable due to configuration issues." });
        return;
    }
    next();
};

const validatePlaceIdFormat = (placeId) => {
    const googlePlaceIdRegex = /^ChIJ[0-9A-Za-z_-]{22,}$/;
    const mockPlaceIdRegex = /^gplace_\d+$/;
    // Ensure placeId is a string before testing
    return typeof placeId === 'string' && (googlePlaceIdRegex.test(placeId) || mockPlaceIdRegex.test(placeId));
};

router.get(
    "/proxy/autocomplete",
    checkApiKey,
    [
        queryValidator('input').trim().notEmpty().withMessage('Input query parameter is required')
            .isLength({ max: 200 }).withMessage('Input query cannot exceed 200 characters')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        const input = req.query.input;
        console.log(`[Places Proxy Autocomplete] Received request with input: "${input}"`);
        try {
            const response = await googleMapsClient.placeAutocomplete({
                params: {
                    input: String(input), // Ensure string
                    key: GOOGLE_API_KEY,
                    components: ['country:us'],
                    types: 'establishment', // Keep as string
                },
                timeout: 5000
            });
            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                console.error(`[Places Proxy Autocomplete] Google API error: ${response.data.status}`, response.data.error_message);
                 res.status(502).json({ success: false, message: `Places lookup failed (${response.data.status}).` });
                 return;
            }
            console.log(`[Places Proxy Autocomplete] Google API returned ${response.data.predictions?.length || 0} predictions.`);
            res.json({ success: true, data: response.data.predictions || [] });
        } catch (err) {
            const errorResponse = err.response; // Capture potential axios response error
            console.error("[Places Proxy Autocomplete] Error calling Google API:", errorResponse?.data || err.message || err);
             res.status(502).json({ success: false, message: "Failed to contact Places service." });
        }
    }
);

router.get(
    "/proxy/details",
    checkApiKey,
    [
        queryValidator('placeId').trim().notEmpty().withMessage('Place ID query parameter is required')
            .isLength({ min: 5, max: 500 }).withMessage('Place ID seems invalid')
    ],
    handleValidationErrors,
    async (req, res, next) => {
        const placeId = req.query.placeId;
        console.log(`[Places Proxy Details] Received request for placeId: "${placeId}"`);

        if (!validatePlaceIdFormat(placeId)) {
            console.warn(`[Places Proxy Details] Invalid placeId format: "${placeId}"`);
            return res.status(400).json({ success: false, message: "Invalid Place ID format" });
        }

        try {
            const response = await googleMapsClient.placeDetails({
                params: {
                    place_id: String(placeId), // Ensure string
                    key: GOOGLE_API_KEY,
                    fields: ['name', 'formatted_address', 'address_components', 'geometry/location', 'place_id']
                },
                timeout: 5000
            });

            if (response.data.status !== 'OK') {
                console.error(`[Places Proxy Details] Google API error: ${response.data.status}`, response.data.error_message);
                if (response.data.status === 'NOT_FOUND') {
                    return res.status(404).json({ success: false, message: "Place details not found." });
                }
                 return res.status(502).json({ success: false, message: `Places lookup failed (${response.data.status}).` });
            }

            const details = response.data.result;
            if (!details) {
                console.warn(`[Places Proxy Details] Google API status OK but no details found for placeId: ${placeId}`);
                return res.status(404).json({ success: false, message: "Place details not found." });
            }

            console.log(`[Places Proxy Details] Details found for placeId: ${placeId}. Extracting components...`);
            let city = null;
            let neighborhood = null;
            details.address_components?.forEach(component => {
                if (component.types.includes('locality')) { city = component.long_name; }
                if (component.types.includes('sublocality_level_1')) { neighborhood = component.long_name; }
                else if (component.types.includes('neighborhood') && !neighborhood) { neighborhood = component.long_name; }
            });
            // Fallback logic for city
            if (!city) {
                 details.address_components?.forEach(component => {
                     if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) {
                         if (!city) city = component.long_name;
                     }
                 });
            }
            console.log(`[Places Proxy Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`);

            res.json({
                success: true,
                data: {
                    name: details.name,
                    formattedAddress: details.formatted_address,
                    city: city || null,
                    neighborhood: neighborhood || null,
                    placeId: details.place_id,
                    location: details.geometry?.location,
                    addressComponents: details.address_components || [],
                }
            });
        } catch (err) {
            const errorResponse = err.response; // Capture potential axios response error
            console.error("[Places Proxy Details] Error calling Google API:", errorResponse?.data || err.message || err);
            res.status(502).json({ success: false, message: "Failed to contact Places service." });
        }
    }
);


export default router;