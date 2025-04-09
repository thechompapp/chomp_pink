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
        res.status(400).json({ error: errors.array()[0].msg }); // Removed 'return'
        return; // Explicit return after sending response
    }
    next();
};

const checkApiKey = (req: Request, res: Response, next: NextFunction): void => {
    if (!GOOGLE_API_KEY) {
        console.error(`[Places Route /${req.path.split('/')[1]}] FATAL Error: Google API key (GOOGLE_API_KEY) not configured.`);
        const err = new Error("Server configuration error: Google API key missing.");
        // No 'return' needed before next(err) as it doesn't return Response
        next(err);
        return; // Explicit return after calling next
    }
    next();
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
            console.log(`[Places Autocomplete] Google API returned ${response.data.predictions?.length || 0} predictions.`);
            res.json(response.data.predictions || []);
        } catch (err: unknown) {
            console.error("[Places Autocomplete] Google Places Autocomplete API error:", (err as any).response?.data || (err as Error).message || err);
            next(new Error("Google Places Autocomplete request failed"));
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
            const details = response.data.result;

            if (!details) {
                console.log(`[Places Details] Place details not found for placeId: ${placeId}`);
                res.status(404).json({ error: "Place details not found" }); // Removed 'return'
                return; // Explicit return
            }
            console.log(`[Places Details] Details found for placeId: ${placeId}. Extracting components...`);

            let city: string | null = null;
            let neighborhood: string | null = null;
            details.address_components?.forEach(component => {
                if (component.types.includes('locality' as any)) { city = component.long_name; }
                if (component.types.includes('sublocality_level_1' as any)) { neighborhood = component.long_name; }
                else if (component.types.includes('neighborhood' as any) && !neighborhood) { neighborhood = component.long_name; }
            });
            if (!city) {
                details.address_components?.forEach(component => {
                    if (component.types.includes('administrative_area_level_2' as any) || component.types.includes('administrative_area_level_1' as any)) {
                        if (!city) city = component.long_name;
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
                location: details.geometry?.location
            });
        } catch (err: unknown) {
            console.error("[Places Details] Google Places Details API error:", (err as any).response?.data || (err as Error).message || err);
            next(new Error("Google Places Details request failed"));
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

            const candidates = response.data.candidates;
            if (!candidates || candidates.length === 0) {
                console.log(`[Places Find] No place found for query: "${query}"`);
                res.json({}); // Removed 'return'
                return; // Explicit return
            }

            const place = candidates[0];
            console.log(`[Places Find] Found candidate for "${query}": ID ${place.place_id}`);

            let city: string | null = null;
            let neighborhood: string | null = null;
            try {
                const detailsResponse = await googleMapsClient.placeDetails({
                    params: {
                        place_id: place.place_id!,
                        key: GOOGLE_API_KEY!,
                        fields: ['address_components']
                    },
                    timeout: 5000
                });
                const details = detailsResponse.data.result;
                details?.address_components?.forEach(component => {
                    if (component.types.includes('locality' as any)) { city = component.long_name; }
                    if (component.types.includes('sublocality_level_1' as any)) { neighborhood = component.long_name; }
                    else if (component.types.includes('neighborhood' as any) && !neighborhood) { neighborhood = component.long_name; }
                });
                if (!city) {
                    details?.address_components?.forEach(component => {
                        if (component.types.includes('administrative_area_level_2' as any) || component.types.includes('administrative_area_level_1' as any)) {
                            if (!city) city = component.long_name;
                        }
                    });
                }
                console.log(`[Places Find - Details] Extracted City: ${city || 'N/A'}, Neighborhood: ${neighborhood || 'N/A'}`);
            } catch (detailsErr: unknown) {
                console.warn(`[Places Find] Could not fetch details for Place ID ${place.place_id} after find:`, (detailsErr as Error).message);
            }

            res.json({
                name: place.name,
                formattedAddress: place.formatted_address,
                placeId: place.place_id,
                location: place.geometry?.location,
                city: city,
                neighborhood: neighborhood
            });
        } catch (err: unknown) {
            console.error("[Places Find] Google Find Place API error:", (err as any).response?.data || (err as Error).message || err);
            next(new Error("Google Find Place request failed"));
        }
    }
);

export default router;