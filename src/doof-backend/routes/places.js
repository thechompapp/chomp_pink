// src/doof-backend/routes/places.js
import express from 'express';
import { Client } from "@googlemaps/google-maps-services-js";
import dotenv from 'dotenv'; // Import dotenv

dotenv.config(); // Ensure GOOGLE_API_KEY is loaded

const router = express.Router();
const googleMapsClient = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Autocomplete
router.get("/autocomplete", async (req, res, next) => { // Added next
    const { input } = req.query;
    console.log(`[Places Autocomplete] Received request with input: "${input}"`); // Log input

    if (!input) {
        console.log("[Places Autocomplete] Error: Input query parameter missing.");
        return res.status(400).json({ error: "Input query parameter is required" });
    }
    if (!GOOGLE_API_KEY) {
        console.error("[Places Autocomplete] FATAL Error: Google API key not configured.");
        // Use next(err) for consistency, letting the central handler manage the response
        return next(new Error("Server configuration error: Google API key missing."));
        // return res.status(500).json({ error: "Google API key not configured" }); // Old way
    }
    try {
        console.log("[Places Autocomplete] Calling Google Maps API..."); // Log API call attempt
        const response = await googleMapsClient.placeAutocomplete({
            params: {
                input: input,
                key: GOOGLE_API_KEY,
                components: ['country:us'], // Limit to US for now
                types: ['establishment', 'geocode'] // Fetch establishments and addresses
            },
            timeout: 5000 // 5 second timeout
        });
        console.log(`[Places Autocomplete] Google API returned ${response.data.predictions?.length || 0} predictions.`); // Log result count
        res.json(response.data.predictions || []); // Return predictions or empty array
    } catch (err) {
        // Log the detailed error from Google or the request
        console.error("[Places Autocomplete] Google Places Autocomplete API error:", err.response?.data || err.message || err);
        // Pass a generic error to the central handler
        next(new Error("Google Places Autocomplete request failed"));
    }
});

// Place Details
router.get("/details", async (req, res, next) => { // Added next
    const { placeId } = req.query;
    console.log(`[Places Details] Received request for placeId: "${placeId}"`); // Log input

    if (!placeId) {
        console.log("[Places Details] Error: Place ID query parameter missing.");
        return res.status(400).json({ error: "Place ID query parameter is required" });
     }
     if (!GOOGLE_API_KEY) {
        console.error("[Places Details] FATAL Error: Google API key not configured.");
        return next(new Error("Server configuration error: Google API key missing."));
     }
    try {
        console.log("[Places Details] Calling Google Maps Place Details API..."); // Log API call attempt
        const response = await googleMapsClient.placeDetails({
            params: {
                place_id: placeId,
                key: GOOGLE_API_KEY,
                // Request specific fields needed by FloatingQuickAdd/submissions
                fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id']
            },
            timeout: 5000
        });
        const details = response.data.result;

        if (!details) {
            console.log(`[Places Details] Place details not found for placeId: ${placeId}`);
            return res.status(404).json({ error: "Place details not found" });
        }
        console.log(`[Places Details] Details found for placeId: ${placeId}. Extracting components...`); // Log success

        // Extract city and neighborhood (improved logic)
        let city = '';
        let neighborhood = '';
        details.address_components.forEach(component => {
            if (component.types.includes('locality')) { city = component.long_name; }
            // Use sublocality_level_1 primarily for neighborhood, fallback to neighborhood
            if (component.types.includes('sublocality_level_1')) { neighborhood = component.long_name; }
             else if (component.types.includes('neighborhood') && !neighborhood) { neighborhood = component.long_name; }
        });
        // Fallback for city if locality wasn't present
        if (!city) {
            details.address_components.forEach(component => {
                if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) {
                    if (!city) city = component.long_name; // County or State as fallback
                }
            });
        }
        console.log(`[Places Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`); // Log extracted info

        // Return structured data needed by frontend
        res.json({
            name: details.name,
            formattedAddress: details.formatted_address,
            city: city || null,
            neighborhood: neighborhood || null,
            placeId: details.place_id,
            location: details.geometry?.location // Include lat/lng if needed
        });
    } catch (err) {
        console.error("[Places Details] Google Places Details API error:", err.response?.data || err.message || err);
        next(new Error("Google Places Details request failed"));
    }
});

export default router; // Changed from module.exports