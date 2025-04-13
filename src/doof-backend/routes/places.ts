/* src/doof-backend/routes/places.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
import { Client, PlaceInputType, PlaceAutocompleteType } from "@googlemaps/google-maps-services-js";
import dotenv from 'dotenv';
// Corrected import for auth middleware (assuming it might be needed later, though not strictly for proxy)
import optionalAuthMiddleware from '../middleware/optionalAuth.js'; // Or authMiddleware if auth is required

dotenv.config();

const router = express.Router();
const googleMapsClient = new Client({});
// Use the server-side key, NOT prefixed with VITE_
const GOOGLE_API_KEY: string | undefined = process.env.GOOGLE_API_KEY;

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn("[Places Route Validation Error]", req.path, errors.array());
        // Ensure consistent error response structure
        res.status(400).json({ success: false, message: errors.array({ onlyFirstError: true })[0].msg });
        return;
    }
    next();
};

// Middleware to check for the SERVER-SIDE key
const checkApiKey = (req: Request, res: Response, next: NextFunction): void => {
    if (!GOOGLE_API_KEY) {
        console.error(`[Places Route /proxy] FATAL Error: Google API key (GOOGLE_API_KEY) not configured on server.`);
        // Return a user-friendly error, status 503 (Service Unavailable) might be appropriate
        res.status(503).json({ success: false, message: "Places lookup service is temporarily unavailable due to configuration issues." });
        return;
    }
    next();
};

// Validate placeId format (basic check for Google Place ID structure)
const validatePlaceIdFormat = (placeId: string): boolean => {
    // Accept both Google Place IDs and our mock format
    const googlePlaceIdRegex = /^ChIJ[0-9A-Za-z_-]{22,}$/;
    const mockPlaceIdRegex = /^gplace_\d+$/;
    return googlePlaceIdRegex.test(placeId) || mockPlaceIdRegex.test(placeId);
};

// ==============================================================
// NEW PROXY ENDPOINTS
// ==============================================================

// Proxy for Place Autocomplete API
router.get(
    "/proxy/autocomplete", // New proxied route
    checkApiKey, // Use the server-side key check
    [
        queryValidator('input').trim().notEmpty().withMessage('Input query parameter is required')
            .isLength({ max: 200 }).withMessage('Input query cannot exceed 200 characters')
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const { input } = req.query;
        console.log(`[Places Proxy Autocomplete] Received request with input: "${input}"`);

        try {
            const response = await googleMapsClient.placeAutocomplete({
                params: {
                    input: input as string,
                    key: GOOGLE_API_KEY!, // Use the server-side key
                    components: ['country:us'], // Example restriction
                    types: 'establishment' as PlaceAutocompleteType, // Example type filter
                },
                timeout: 5000 // Example timeout
            });

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                console.error(`[Places Proxy Autocomplete] Google API error: ${response.data.status}`, response.data.error_message);
                // Don't pass raw Google errors directly
                 res.status(502).json({ success: false, message: `Places lookup failed (${response.data.status}).` });
                 return;
            }

            console.log(`[Places Proxy Autocomplete] Google API returned ${response.data.predictions?.length || 0} predictions.`);
            // Return consistent structure, wrapping Google's predictions in 'data'
            res.json({ success: true, data: response.data.predictions || [] });
        } catch (err: unknown) {
            console.error("[Places Proxy Autocomplete] Error calling Google API:", (err as any).response?.data || (err as Error).message || err);
            // Use next to pass to the global error handler or return a generic server error
             res.status(502).json({ success: false, message: "Failed to contact Places service." });
        }
    }
);

// Proxy for Place Details API
router.get(
    "/proxy/details", // New proxied route
    checkApiKey, // Use the server-side key check
    [
        queryValidator('placeId').trim().notEmpty().withMessage('Place ID query parameter is required')
            .isLength({ min: 5, max: 500 }).withMessage('Place ID seems invalid')
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const { placeId } = req.query;
        console.log(`[Places Proxy Details] Received request for placeId: "${placeId}"`);

        if (!validatePlaceIdFormat(placeId as string)) {
            console.warn(`[Places Proxy Details] Invalid placeId format: "${placeId}"`);
            return res.status(400).json({ success: false, message: "Invalid Place ID format" });
        }

        try {
            const response = await googleMapsClient.placeDetails({
                params: {
                    place_id: placeId as string,
                    key: GOOGLE_API_KEY!, // Use the server-side key
                     // Request specific fields needed by frontend (match PlaceDetails interface in placeService.ts)
                    fields: ['name', 'formatted_address', 'address_components', 'geometry/location', 'place_id']
                },
                timeout: 5000 // Example timeout
            });

            if (response.data.status !== 'OK') {
                console.error(`[Places Proxy Details] Google API error: ${response.data.status}`, response.data.error_message);
                 // Handle specific statuses like NOT_FOUND
                if (response.data.status === 'NOT_FOUND') {
                    return res.status(404).json({ success: false, message: "Place details not found." });
                }
                 return res.status(502).json({ success: false, message: `Places lookup failed (${response.data.status}).` });
            }

            const details = response.data.result;
            if (!details) {
                 // Should not happen if status is OK, but good practice to check
                console.warn(`[Places Proxy Details] Google API status OK but no details found for placeId: ${placeId}`);
                return res.status(404).json({ success: false, message: "Place details not found." });
            }

            console.log(`[Places Proxy Details] Details found for placeId: ${placeId}. Extracting components...`);
            // Extract city/neighborhood (logic remains the same as original /details endpoint)
            let city: string | null = null;
            let neighborhood: string | null = null;
            details.address_components?.forEach(component => {
                if (component.types.includes('locality')) { city = component.long_name; }
                if (component.types.includes('sublocality_level_1')) { neighborhood = component.long_name; }
                else if (component.types.includes('neighborhood') && !neighborhood) { neighborhood = component.long_name; }
            });
            if (!city) {
                details.address_components?.forEach(component => {
                    if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) {
                        if (!city) city = component.long_name;
                    }
                });
            }
            console.log(`[Places Proxy Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`);

            // Return consistent structure, wrapping relevant details in 'data'
            res.json({
                success: true,
                data: {
                    name: details.name,
                    formattedAddress: details.formatted_address,
                    city: city || null,
                    neighborhood: neighborhood || null,
                    placeId: details.place_id,
                    location: details.geometry?.location, // contains lat/lng
                    addressComponents: details.address_components || [], // Include components if needed by frontend
                }
            });
        } catch (err: unknown) {
            console.error("[Places Proxy Details] Error calling Google API:", (err as any).response?.data || (err as Error).message || err);
            res.status(502).json({ success: false, message: "Failed to contact Places service." });
        }
    }
);

// ==============================================================
// ORIGINAL ENDPOINTS (Keep or remove based on need)
// These might still be useful for direct backend use or if you need
// features not easily proxied. If they are no longer needed, remove them.
// ==============================================================

// Keep GET /autocomplete if needed for direct backend use (requires separate API key check logic)
// router.get("/autocomplete", /* ... existing implementation ... */ );

// Keep GET /details if needed for direct backend use (requires separate API key check logic)
// router.get("/details", /* ... existing implementation ... */ );

// Keep GET /find if needed for direct backend use (requires separate API key check logic)
// router.get("/find", /* ... existing implementation ... */ );


export default router;