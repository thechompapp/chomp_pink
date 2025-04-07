// src/doof-backend/routes/places.js
import express from 'express';
import { query, validationResult } from 'express-validator'; // Added query, validationResult
import { Client, PlaceInputType } from "@googlemaps/google-maps-services-js"; // Added PlaceInputType
import dotenv from 'dotenv';

dotenv.config(); // Ensure GOOGLE_API_KEY is loaded

const router = express.Router();
const googleMapsClient = new Client({});
// Ensure GOOGLE_API_KEY is consistently named (using VITE_ prefix is usually frontend)
// Use the backend-specific env variable name. Assuming it's GOOGLE_API_KEY here.
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; // Use backend env var

// Validation and error handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.warn("[Places Route Validation Error]", req.path, errors.array());
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const checkApiKey = (req, res, next) => {
    if (!GOOGLE_API_KEY) {
        console.error(`[Places Route /${req.path.split('/')[1]}] FATAL Error: Google API key (GOOGLE_API_KEY) not configured.`);
        // Use next(err) for consistency
        return next(new Error("Server configuration error: Google API key missing."));
    }
    next();
};

// GET /api/places/autocomplete
router.get(
    "/autocomplete",
    checkApiKey, // Check API key first
    [query('input').notEmpty().withMessage('Input query parameter is required')], // Validation
    handleValidationErrors,
    async (req, res, next) => {
        const { input } = req.query;
        console.log(`[Places Autocomplete] Received request with input: "${input}"`);

        try {
            console.log("[Places Autocomplete] Calling Google Maps API...");
            const response = await googleMapsClient.placeAutocomplete({
                params: {
                    input: input,
                    key: GOOGLE_API_KEY,
                    components: ['country:us'], // Optional: Limit results (e.g., to US)
                    types: ['establishment', 'geocode'] // Fetch establishments and addresses
                },
                timeout: 5000 // 5 second timeout
            });
            console.log(`[Places Autocomplete] Google API returned ${response.data.predictions?.length || 0} predictions.`);
            res.json(response.data.predictions || []);
        } catch (err) {
            console.error("[Places Autocomplete] Google Places Autocomplete API error:", err.response?.data || err.message || err);
            next(new Error("Google Places Autocomplete request failed"));
        }
    }
);

// GET /api/places/details
router.get(
    "/details",
    checkApiKey, // Check API key
    [query('placeId').notEmpty().withMessage('Place ID query parameter is required')], // Validation
    handleValidationErrors,
    async (req, res, next) => {
        const { placeId } = req.query;
        console.log(`[Places Details] Received request for placeId: "${placeId}"`);

        try {
            console.log("[Places Details] Calling Google Maps Place Details API...");
            const response = await googleMapsClient.placeDetails({
                params: {
                    place_id: placeId,
                    key: GOOGLE_API_KEY,
                    fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id'] // Request specific fields
                },
                timeout: 5000
            });
            const details = response.data.result;

            if (!details) {
                console.log(`[Places Details] Place details not found for placeId: ${placeId}`);
                return res.status(404).json({ error: "Place details not found" });
            }
            console.log(`[Places Details] Details found for placeId: ${placeId}. Extracting components...`);

            // Extract city and neighborhood
            let city = '';
            let neighborhood = '';
            details.address_components?.forEach(component => { // Add safe navigation
                if (component.types.includes('locality')) { city = component.long_name; }
                if (component.types.includes('sublocality_level_1')) { neighborhood = component.long_name; }
                else if (component.types.includes('neighborhood') && !neighborhood) { neighborhood = component.long_name; }
            });
            // Fallback for city if locality wasn't present
            if (!city) {
                details.address_components?.forEach(component => { // Add safe navigation
                    if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) {
                        if (!city) city = component.long_name; // County or State as fallback
                    }
                });
            }
            console.log(`[Places Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`);

            res.json({
                name: details.name,
                formattedAddress: details.formatted_address,
                city: city || null,
                neighborhood: neighborhood || null,
                placeId: details.place_id,
                location: details.geometry?.location // Include lat/lng
            });
        } catch (err) {
            console.error("[Places Details] Google Places Details API error:", err.response?.data || err.message || err);
            next(new Error("Google Places Details request failed"));
        }
    }
);

// *** NEW ENDPOINT ***
// GET /api/places/find
// Finds a place based on text query (e.g., "Restaurant Name, City")
router.get(
    "/find",
    checkApiKey, // Check API key
    [query('query').notEmpty().withMessage('Query parameter is required')], // Validation
    handleValidationErrors,
    async (req, res, next) => {
        const { query } = req.query;
        console.log(`[Places Find] Received request with query: "${query}"`);

        try {
            console.log("[Places Find] Calling Google Maps Find Place From Text API...");
            const response = await googleMapsClient.findPlaceFromText({
                params: {
                    input: query,
                    inputtype: PlaceInputType.textQuery, // Specify input type
                    key: GOOGLE_API_KEY,
                    // Request fields needed for Bulk Add (Place ID is crucial)
                    fields: ['name', 'formatted_address', 'place_id', 'geometry']
                },
                timeout: 5000
            });

            const candidates = response.data.candidates;
            if (!candidates || candidates.length === 0) {
                console.log(`[Places Find] No place found for query: "${query}"`);
                // Return empty object or 404? Returning empty object might be safer for frontend
                return res.json({});
            }

            // Usually take the first candidate
            const place = candidates[0];
            console.log(`[Places Find] Found candidate for "${query}": ID ${place.place_id}`);

            // **Optional Enhancement**: Call Place Details API for address components
            // If city/neighborhood extraction is needed directly from this endpoint
            // This adds another API call but provides richer data.
            let city = null;
            let neighborhood = null;
            try {
                const detailsResponse = await googleMapsClient.placeDetails({
                   params: {
                       place_id: place.place_id,
                       key: GOOGLE_API_KEY,
                       fields: ['address_components'] // Only need components
                   },
                   timeout: 5000
                });
                const details = detailsResponse.data.result;
                 details?.address_components?.forEach(component => { // Safe navigation
                    if (component.types.includes('locality')) { city = component.long_name; }
                    if (component.types.includes('sublocality_level_1')) { neighborhood = component.long_name; }
                    else if (component.types.includes('neighborhood') && !neighborhood) { neighborhood = component.long_name; }
                 });
                 // City fallback
                 if (!city) {
                    details?.address_components?.forEach(component => {
                        if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) {
                            if (!city) city = component.long_name;
                        }
                    });
                 }
                 console.log(`[Places Find - Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`);
            } catch (detailsErr) {
                 console.warn(`[Places Find] Could not fetch details for Place ID ${place.place_id} after find:`, detailsErr.message);
                 // Proceed without city/neighborhood if details fail
            }

            // Return essential info including the crucial place_id
            res.json({
                name: place.name,
                formattedAddress: place.formatted_address,
                placeId: place.place_id,
                location: place.geometry?.location,
                city: city, // Include extracted city
                neighborhood: neighborhood // Include extracted neighborhood
            });

        } catch (err) {
            console.error("[Places Find] Google Find Place API error:", err.response?.data || err.message || err);
            next(new Error("Google Find Place request failed"));
        }
    }
);


export default router;