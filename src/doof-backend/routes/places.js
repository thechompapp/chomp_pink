// src/doof-backend/routes/places.js
const express = require('express');
const { Client } = require("@googlemaps/google-maps-services-js");
require("dotenv").config(); // Ensure GOOGLE_API_KEY is loaded

const router = express.Router();
const googleMapsClient = new Client({});
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Autocomplete
router.get("/autocomplete", async (req, res) => {
    const { input } = req.query;
    if (!input) return res.status(400).json({ error: "Input query parameter is required" });
    if (!GOOGLE_API_KEY) return res.status(500).json({ error: "Google API key not configured" });
    try {
        const response = await googleMapsClient.placeAutocomplete({
            params: { input: input, key: GOOGLE_API_KEY, components: ['country:us'] }, timeout: 5000
        });
        res.json(response.data.predictions || []);
    } catch (err) {
        console.error("Google Places Autocomplete error:", err.response?.data || err.message);
        res.status(500).json({ error: "Google Places Autocomplete request failed" });
    }
});

// Place Details
router.get("/details", async (req, res) => {
    const { placeId } = req.query;
    if (!placeId) return res.status(400).json({ error: "Place ID query parameter is required" });
     if (!GOOGLE_API_KEY) return res.status(500).json({ error: "Google API key not configured" });
    try {
        const response = await googleMapsClient.placeDetails({
            params: { place_id: placeId, key: GOOGLE_API_KEY, fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id'] }, timeout: 5000
        });
        const details = response.data.result;
        if (!details) return res.status(404).json({ error: "Place details not found" });
        let city = ''; let neighborhood = '';
        details.address_components.forEach(component => {
            if (component.types.includes('locality')) { city = component.long_name; }
            if (component.types.includes('sublocality') || component.types.includes('neighborhood')) { neighborhood = component.long_name; }
        });
        if (!city) { details.address_components.forEach(component => { if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) { if (!city) city = component.long_name; } }); }
        res.json({ name: details.name, formattedAddress: details.formatted_address, city: city || null, neighborhood: neighborhood || null, placeId: details.place_id, location: details.geometry?.location });
    } catch (err) {
        console.error("Google Places Details error:", err.response?.data || err.message);
        res.status(500).json({ error: "Google Places Details request failed" });
    }
});

// Moved from server.js - POST endpoint might not be needed if using GET w/ query params
// If POST is needed for semantic reasons or large inputs:
// router.post("/google-search", ...)

module.exports = router;