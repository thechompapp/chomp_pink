/* src/services/filterService.js */
import apiClient, { ApiError } from '@/services/apiClient';

const getCities = async () => {
    try {
        // Assume apiClient returns { success: boolean, data: City[] }
        const response = await apiClient('/api/filters/cities', 'FilterService Cities');

        // ** CORRECTED CHECK: Access response.data directly **
        if (!response?.success || !Array.isArray(response?.data)) {
            console.warn('[FilterService getCities] Invalid response data:', response);
            return [];
        }
        const data = response.data; // Extract the array directly

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

        // ** CORRECTED CHECK: Access response.data directly **
        if (!response?.success || !Array.isArray(response?.data)) {
             console.warn('[FilterService getCuisines] Invalid response data:', response);
             return [];
        }
        const data = response.data; // Extract the array directly

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
        const response = await apiClient(`/api/filters/neighborhoods?cityId=${cityIdNum}`, `FilterService Neighborhoods city ${cityIdNum}`);

        // ** CORRECTED CHECK: Access response.data directly **
         if (!response?.success || !Array.isArray(response?.data)) {
             console.warn(`[FilterService getNeighborhoodsByCity] Invalid response data for city ${cityIdNum}:`, response);
             return [];
         }
         const data = response.data; // Extract array directly

         const validNeighborhoods = data.filter((item) => !!item && item.id != null && typeof item.name === 'string');
         return validNeighborhoods
            .map(nb => ({
                 ...nb,
                 id: Number(nb.id),
                 city_id: nb.city_id ? Number(nb.city_id) : undefined,
                 zipcode_ranges: Array.isArray(nb.zipcode_ranges) ? nb.zipcode_ranges : null
            }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to load neighborhoods for city ${cityIdNum}.`;
        console.error(`[FilterService getNeighborhoodsByCity] Fetch error for city ${cityIdNum}:`, error);
        throw new Error(message);
    }
};

const findNeighborhoodByZipcode = async (zipcode) => {
    // NOTE: This client-side implementation is inefficient as it fetches all neighborhoods.
    // A dedicated backend endpoint `/api/neighborhoods/by-zipcode/:zipcode` is recommended.
    // Keeping the existing logic for now, assuming it might be used elsewhere.
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        return null;
    }
    try {
        // This logic fetches all neighborhoods - potentially very slow!
        let allNeighborhoods = [];
        let page = 1;
        const limit = 100; // Limit per page fetch
        while (true) {
            const response = await apiClient(
                 // Assuming the backend endpoint returns { success: true, data: { data: [], pagination: {...} } }
                `/api/neighborhoods?page=${page}&limit=${limit}`,
                `FilterService Fetch Neighborhoods Page ${page}`
            );
            // ** CORRECTED CHECK: Access response.data.data for this paginated endpoint **
            if (!response.success || !Array.isArray(response?.data?.data)) {
                console.error('[FilterService findNeighborhoodByZipcode] Invalid response from /api/neighborhoods:', response);
                // Don't throw, just stop pagination and try searching what we have
                break;
            }
            allNeighborhoods = allNeighborhoods.concat(response.data.data);
            const pagination = response.data.pagination;
            if (!pagination || page >= pagination.totalPages) break;
            page++;
        }

        // console.log('[FilterService findNeighborhoodByZipcode] All neighborhoods fetched:', allNeighborhoods.length); // Optional log

        const matchingNeighborhood = allNeighborhoods.find(n => {
            let zipRanges = n.zipcode_ranges;
            if (typeof zipRanges === 'string') { /* ... parsing logic ... */
                try { zipRanges = JSON.parse(zipRanges.replace(/^{|}$/g, '').replace(/(\w+)/g, '"$1"')); }
                catch (e) { zipRanges = zipRanges.split(',').map(s => s.trim()); }
            }
            if (!Array.isArray(zipRanges)) return false;
            return zipRanges.some(range => String(range).trim() === String(zipcode).trim());
        });

        if (!matchingNeighborhood) return null;

        // Fetch city name separately (also potentially inefficient)
        const cityResponse = await apiClient(`/api/filters/cities`, `FilterService Fetch Cities`);
        // ** CORRECTED CHECK: Access response.data directly **
        const cities = (cityResponse?.success && Array.isArray(cityResponse?.data)) ? cityResponse.data : [];
        const city = cities.find(c => c.id === matchingNeighborhood.city_id);

        return {
            ...matchingNeighborhood,
            city_name: city?.name || null
        };
    } catch (error) {
        console.error(`[FilterService findNeighborhoodByZipcode] Neighborhood lookup failed for zipcode ${zipcode}:`, error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
};


export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
    findNeighborhoodByZipcode,
};