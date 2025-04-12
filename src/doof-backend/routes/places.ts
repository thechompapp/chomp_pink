/* src/doof-backend/routes/places.ts */
import express, { Request, Response, NextFunction } from 'express';
import { query as queryValidator, validationResult, ValidationChain } from 'express-validator';
import { Client, PlaceInputType, PlaceAutocompleteType } from "@googlemaps/google-maps-services-js";
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const googleMapsClient = new Client({});
const GOOGLE_API_KEY: string | undefined = process.env.GOOGLE_API_KEY;

const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn("[Places Route Validation Error]", req.path, errors.array());
        res.status(400).json({ success: false, error: errors.array()[0].msg });
        return;
    }
    next();
};

const checkApiKey = (req: Request, res: Response, next: NextFunction): void => {
    if (!GOOGLE_API_KEY) {
        console.error(`[Places Route /${req.path.split('/')[1]}] FATAL Error: Google API key (GOOGLE_API_KEY) not configured.`);
        res.status(500).json({ success: false, error: "Server configuration error: Google API key missing." });
        return;
    }
    next();
};

// Validate placeId format (basic check for Google Place ID structure)
const validatePlaceIdFormat = (placeId: string): boolean => {
    // Google Place IDs typically start with "ChIJ" and are 27 characters long
    const placeIdRegex = /^ChIJ[0-9A-Za-z_-]{22,}$/;
    return placeIdRegex.test(placeId);
};

router.get(
    "/autocomplete",
    checkApiKey,
    [
        queryValidator('input').trim().notEmpty().withMessage('Input query parameter is required')
            .isLength({ max: 200 }).withMessage('Input query cannot exceed 200 characters')
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const { input } = req.query;
        console.log(`[Places Autocomplete] Received request with input: "${input}"`);

        try {
            console.log("[Places Autocomplete] Calling Google Maps API...");
            const response = await googleMapsClient.placeAutocomplete({
                params: {
                    input: input as string,
                    key: GOOGLE_API_KEY!,
                    components: ['country:us'],
                    types: 'establishment' as PlaceAutocompleteType
                },
                timeout: 5000
            });

            if (response.data.status !== 'OK') {
                console.error(`[Places Autocomplete] Google API error: ${response.data.status}`, response.data.error_message);
                res.status(500).json({ success: false, error: `Google API error: ${response.data.status}${response.data.error_message ? ` - ${response.data.error_message}` : ''}` });
                return;
            }

            console.log(`[Places Autocomplete] Google API returned ${response.data.predictions?.length || 0} predictions. Full response:`, JSON.stringify(response.data.predictions, null, 2));
            res.json({ success: true, data: response.data.predictions || [] });
        } catch (err: unknown) {
            console.error("[Places Autocomplete] Google Places Autocomplete API error:", (err as any).response?.data || (err as Error).message || err);
            res.status(500).json({ success: false, error: "Google Places Autocomplete request failed" });
        }
    }
);

router.get(
    "/details",
    checkApiKey,
    [
        queryValidator('placeId').trim().notEmpty().withMessage('Place ID query parameter is required')
            .isLength({ min: 5, max: 500 }).withMessage('Place ID seems invalid')
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const { placeId } = req.query;
        console.log(`[Places Details] Received request for placeId: "${placeId}"`);

        // Validate placeId format
        if (!validatePlaceIdFormat(placeId as string)) {
            console.warn(`[Places Details] Invalid placeId format: "${placeId}"`);
            res.status(400).json({ success: false, error: "Invalid Place ID format" });
            return;
        }

        try {
            console.log("[Places Details] Calling Google Maps Place Details API...");
            const response = await googleMapsClient.placeDetails({
                params: {
                    place_id: placeId as string,
                    key: GOOGLE_API_KEY!,
                    fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id']
                },
                timeout: 5000
            });

            if (response.data.status !== 'OK') {
                console.error(`[Places Details] Google API error: ${response.data.status}`, response.data.error_message);
                res.status(500).json({ success: false, error: `Google API error: ${response.data.status}${response.data.error_message ? ` - ${response.data.error_message}` : ''}` });
                return;
            }

            const details = response.data.result;
            if (!details) {
                console.log(`[Places Details] Place details not found for placeId: ${placeId}`);
                res.status(404).json({ success: false, error: "Place details not found" });
                return;
            }
            console.log(`[Places Details] Details found for placeId: ${placeId}. Extracting components...`);

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
            console.log(`[Places Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`);

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
        } catch (err: unknown) {
            console.error("[Places Details] Google Places Details API error:", (err as any).response?.data || (err as Error).message || err);
            res.status(500).json({ success: false, error: "Google Places Details request failed" });
        }
    }
);

router.get(
    "/find",
    checkApiKey,
    [
        queryValidator('query').trim().notEmpty().withMessage('Query parameter is required')
            .isLength({ max: 250 }).withMessage('Query cannot exceed 250 characters')
    ],
    handleValidationErrors,
    async (req: Request, res: Response, next: NextFunction) => {
        const { query } = req.query;
        console.log(`[Places Find] Received request with query: "${query}"`);

        try {
            console.log("[Places Find] Calling Google Maps Find Place From Text API...");
            const response = await googleMapsClient.findPlaceFromText({
                params: {
                    input: query as string,
                    inputtype: PlaceInputType.textQuery,
                    key: GOOGLE_API_KEY!,
                    fields: ['name', 'formatted_address', 'place_id', 'geometry']
                },
                timeout: 5000
            });

            if (response.data.status !== 'OK') {
                console.error(`[Places Find] Google API error: ${response.data.status}`, response.data.error_message);
                res.status(500).json({ success: false, error: `Google API error: ${response.data.status}${response.data.error_message ? ` - ${response.data.error_message}` : ''}` });
                return;
            }

            const candidates = response.data.candidates;
            if (!candidates || candidates.length === 0) {
                console.log(`[Places Find] No place found for query: "${query}"`);
                res.json({ success: false, error: "No place found" });
                return;
            }

            const place = candidates[0];
            console.log(`[Places Find] Found candidate for "${query}": ID ${place.place_id}`);

            let city: string | null = null;
            let neighborhood: string | null = null;
            let addressComponents: any[] = [];
            try {
                const detailsResponse = await googleMapsClient.placeDetails({
                    params: {
                        place_id: place.place_id!,
                        key: GOOGLE_API_KEY!,
                        fields: ['address_components']
                    },
                    timeout: 5000
                });

                if (detailsResponse.data.status !== 'OK') {
                    console.warn(`[Places Find - Details] Google API error: ${detailsResponse.data.status}`, detailsResponse.data.error_message);
                } else {
                    const details = detailsResponse.data.result;
                    addressComponents = details?.address_components || [];
                    details?.address_components?.forEach(component => {
                        if (component.types.includes('locality')) { city = component.long_name; }
                        if (component.types.includes('sublocality_level_1')) { neighborhood = component.long_name; }
                        else if (component.types.includes('neighborhood') && !neighborhood) { neighborhood = component.long_name; }
                    });
                    if (!city) {
                        details?.address_components?.forEach(component => {
                            if (component.types.includes('administrative_area_level_2') || component.types.includes('administrative_area_level_1')) {
                                if (!city) city = component.long_name;
                            }
                        });
                    }
                    console.log(`[Places Find - Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`);
                }
            } catch (detailsErr: unknown) {
                console.warn(`[Places Find] Could not fetch details for Place ID ${place.place_id} after find:`, (detailsErr as Error).message);
            }

            res.json({
                success: true,
                data: {
                    name: place.name,
                    formattedAddress: place.formatted_address,
                    placeId: place.place_id,
                    location: place.geometry?.location,
                    city: city,
                    neighborhood: neighborhood,
                    addressComponents: addressComponents,
                }
            });
        } catch (err: unknown) {
            console.error("[Places Find] Google Find Place API error:", (err as any).response?.data || (err as Error).message || err);
            res.status(500).json({ success: false, error: "Google Find Place request failed" });
        }
    }
);

export default router;