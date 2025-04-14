/* src/services/filterService.js */
import apiClient, { ApiError } from '@/services/apiClient';

const getCities = async () => {
    try {
        const response = await apiClient('/api/filters/cities', 'FilterService Cities');
        if (!response?.success || !Array.isArray(response?.data)) {
            console.warn('[FilterService getCities] Invalid response data:', response);
            return [];
        }
        const data = response.data;
        const validCities = data.filter((item) => !!item && item.id != null && typeof item.name === 'string');
        return validCities
            .map(city => ({ ...city, id: Number(city.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        console.error("[FilterService getCities] Fetch error:", error);
        return [];
    }
};

const getCuisines = async () => {
     try {
        const response = await apiClient('/api/filters/cuisines', 'FilterService Cuisines');
        if (!response?.success || !Array.isArray(response?.data)) {
             console.warn('[FilterService getCuisines] Invalid response data:', response);
             return [];
        }
        const data = response.data;
        const validCuisines = data.filter((item) => !!item && item.id != null && typeof item.name === 'string');
         return validCuisines
            .map(cuisine => ({ ...cuisine, id: Number(cuisine.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
     } catch (error) {
         console.error("[FilterService getCuisines] Fetch error:", error);
         return [];
     }
};

const getNeighborhoodsByCity = async (cityId) => {
    const cityIdNum = cityId != null ? parseInt(String(cityId), 10) : NaN;
    if (isNaN(cityIdNum) || cityIdNum <= 0) {
        console.warn(`[FilterService getNeighborhoodsByCity] Invalid cityId: ${cityId}`);
        return [];
    }
    try {
        // This correctly calls the endpoint designed for filtering by city
        const response = await apiClient(`/api/filters/neighborhoods?cityId=${cityIdNum}`, `FilterService Neighborhoods city ${cityIdNum}`);
         if (!response?.success || !Array.isArray(response?.data)) {
             console.warn(`[FilterService getNeighborhoodsByCity] Invalid response data for city ${cityIdNum}:`, response);
             return [];
         }
         const data = response.data;
         const validNeighborhoods = data.filter((item) => !!item && item.id != null && typeof item.name === 'string');
         return validNeighborhoods
            .map(nb => ({
                 ...nb,
                 id: Number(nb.id),
                 city_id: nb.city_id ? Number(nb.city_id) : undefined,
                 // Ensure zipcode_ranges is handled correctly if present in response
                 zipcode_ranges: Array.isArray(nb.zipcode_ranges) ? nb.zipcode_ranges : (typeof nb.zipcode_ranges === 'string' ? nb.zipcode_ranges.split(',').map(z => z.trim()) : null)
            }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to load neighborhoods for city ${cityIdNum}.`;
        console.error(`[FilterService getNeighborhoodsByCity] Fetch error for city ${cityIdNum}:`, error);
        // Consider re-throwing or returning empty based on how calling components handle errors
        throw new Error(message); // Re-throwing allows React Query to handle error state
        // return [];
    }
};

// --- findNeighborhoodByZipcode Correction ---
const findNeighborhoodByZipcode = async (zipcode) => {
    // **NOTE:** This function remains inefficient as it fetches ALL neighborhoods client-side.
    // **RECOMMENDATION:** Implement and use a dedicated backend endpoint like `/api/neighborhoods/by-zipcode/:zipcode`.
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        console.warn(`[FilterService findNeighborhoodByZipcode] Invalid zipcode: ${zipcode}`);
        return null;
    }

    console.log(`[FilterService findNeighborhoodByZipcode] Fetching all neighborhoods (inefficient) to find match for ${zipcode}...`);

    try {
        // Fetch *all* neighborhoods using the paginated endpoint (this is the inefficient part)
        let allNeighborhoods = [];
        let page = 1;
        const limit = 200; // Fetch large pages to minimize requests
        while (true) {
            const response = await apiClient(
                `/api/neighborhoods?page=${page}&limit=${limit}`, // Calls the LIST endpoint
                `FilterService Fetch All Nb Page ${page}`
            );

            // ** CORRECTED CHECK: Access response.data (the array) directly **
            if (!response.success || !Array.isArray(response?.data)) {
                // Log the "Invalid response" message from the console log
                console.error(`[FilterService findNeighborhoodByZipcode] Invalid response from /api/neighborhoods page ${page}:`, response);
                // Stop pagination, try searching what we have so far, or return null
                break;
            }

            allNeighborhoods = allNeighborhoods.concat(response.data); // Add fetched page to the list

            const pagination = response.pagination; // Access pagination info if available at top level
            if (!pagination || page >= pagination.totalPages) break; // Stop if no more pages
            page++;
        }

        console.log(`[FilterService findNeighborhoodByZipcode] Total neighborhoods fetched: ${allNeighborhoods.length}. Filtering for zipcode ${zipcode}...`);

        // Filter client-side based on zipcode_ranges (ensure consistent parsing)
        const matchingNeighborhood = allNeighborhoods.find(n => {
            let zipRanges = n.zipcode_ranges;
            // Handle cases where zipcodes might be stored as string '{12345,54321}' or array ['12345', '54321']
             if (typeof zipRanges === 'string' && zipRanges.startsWith('{') && zipRanges.endsWith('}')) {
                // Handle PostgreSQL array string format: '{val1,val2}'
                zipRanges = zipRanges.slice(1, -1).split(',').map(z => z.trim());
             } else if (typeof zipRanges === 'string') {
                 // Handle simple comma-separated string
                 zipRanges = zipRanges.split(',').map(z => z.trim());
             }

            if (!Array.isArray(zipRanges)) return false;
            return zipRanges.some(range => String(range).trim() === String(zipcode).trim());
        });

        if (!matchingNeighborhood) {
            console.log(`[FilterService findNeighborhoodByZipcode] No neighborhood found containing zipcode ${zipcode}.`);
            return null;
        }

        console.log(`[FilterService findNeighborhoodByZipcode] Found match:`, matchingNeighborhood);

        // Fetch city name separately if needed (can be optimized by backend join)
        // This assumes getCities is fast or cached by React Query
        const cities = await getCities(); // Re-fetch or use cached cities
        const city = cities.find(c => Number(c.id) === Number(matchingNeighborhood.city_id));

        return {
            ...matchingNeighborhood,
            id: Number(matchingNeighborhood.id), // Ensure numeric IDs
            city_id: Number(matchingNeighborhood.city_id),
            city_name: city?.name || matchingNeighborhood.city_name || null // Add city name
        };

    } catch (error) {
        console.error(`[FilterService findNeighborhoodByZipcode] Neighborhood lookup failed for zipcode ${zipcode}:`, error instanceof Error ? error.message : 'Unknown error');
        return null; // Return null on error
    }
};


export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
    findNeighborhoodByZipcode, // Keep the (inefficient) function available
};