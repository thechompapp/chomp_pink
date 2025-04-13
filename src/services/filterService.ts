/* src/services/filterService.ts */
import apiClient from '@/services/apiClient';
import type { City, Cuisine, Neighborhood } from '@/types/Filters';

interface CitiesResponse { data?: City[] }
interface CuisinesResponse { data?: Cuisine[] }
interface NeighborhoodsResponse { data?: Neighborhood[], pagination?: { total: number, page: number, limit: number, totalPages: number } }

const getCities = async (): Promise<City[]> => {
    try {
        const response = await apiClient<CitiesResponse>('/api/filters/cities', 'FilterService Cities');
        const data = response?.data || [];
        const validCities = Array.isArray(data)
            ? data.filter((item): item is City => !!item && item.id != null && typeof item.name === 'string')
            : [];
        return validCities
            .map(city => ({ ...city, id: Number(city.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        return [];
    }
};

const getCuisines = async (): Promise<Cuisine[]> => {
     try {
        const response = await apiClient<CuisinesResponse>('/api/filters/cuisines', 'FilterService Cuisines');
        const data = response?.data || [];
        const validCuisines = Array.isArray(data)
            ? data.filter((item): item is Cuisine => !!item && item.id != null && typeof item.name === 'string')
            : [];
         return validCuisines
            .map(cuisine => ({ ...cuisine, id: Number(cuisine.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
     } catch (error) {
         return [];
     }
};

const getNeighborhoodsByCity = async (cityId: number | string | null | undefined): Promise<Neighborhood[]> => {
    const cityIdNum = cityId != null ? parseInt(String(cityId), 10) : NaN;

    if (isNaN(cityIdNum) || cityIdNum <= 0) {
        return [];
    }

    try {
        const response = await apiClient<NeighborhoodsResponse>(`/api/filters/neighborhoods?cityId=${cityIdNum}`, `FilterService Neighborhoods city ${cityIdNum}`);
        const data = response?.data || [];
        const validNeighborhoods = Array.isArray(data)
            ? data.filter((item): item is Neighborhood => !!item && item.id != null && typeof item.name === 'string')
            : [];
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
        throw new Error(message);
    }
};

const findNeighborhoodByZipcode = async (zipcode: string): Promise<Neighborhood | null> => {
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        return null;
    }

    try {
        let allNeighborhoods: Neighborhood[] = [];
        let page = 1;
        const limit = 100; // Increase limit to fetch more entries per page

        // Fetch all pages of neighborhoods
        while (true) {
            const response = await apiClient<NeighborhoodsResponse>(
                `/api/neighborhoods?page=${page}&limit=${limit}`,
                `FilterService Fetch Neighborhoods Page ${page}`
            );
            console.log(`[FilterService] Response from /api/neighborhoods (page ${page}):`, response);

            if (!response.success || !Array.isArray(response.data)) {
                console.error('[FilterService] Invalid response from /api/neighborhoods:', response);
                return null;
            }

            allNeighborhoods = allNeighborhoods.concat(response.data);

            const pagination = response.pagination;
            if (!pagination || page >= pagination.totalPages) {
                break;
            }
            page++;
        }

        // Log all neighborhood names and IDs
        console.log('[FilterService] All neighborhoods fetched:', allNeighborhoods.map(n => ({ id: n.id, name: n.name })));

        // Log the zipcode_ranges for "East Village" specifically
        const eastVillage = allNeighborhoods.find(n => n.name.toLowerCase() === 'east village');
        if (eastVillage) {
            console.log('[FilterService] East Village zipcode_ranges:', eastVillage.zipcode_ranges);
        } else {
            console.log('[FilterService] East Village not found in API response');
        }

        const matchingNeighborhood = allNeighborhoods.find(n => {
            let zipRanges = n.zipcode_ranges;
            if (typeof zipRanges === 'string') {
                try {
                    zipRanges = JSON.parse(zipRanges.replace(/^{|}$/g, '').replace(/,/g, '","').replace(/^/, '["').replace(/$/, '"]'));
                } catch (e) {
                    console.warn('[FilterService] Failed to parse zipcode_ranges as JSON for neighborhood:', n, 'Error:', e);
                    zipRanges = zipRanges.split(',').map(s => s.trim());
                }
            }

            if (!Array.isArray(zipRanges)) {
                console.warn('[FilterService] zipcode_ranges not an array for neighborhood:', n, 'Value:', zipRanges);
                return false;
            }

            // Normalize zipcode and zipRanges for comparison
            const zipcodeStr = String(zipcode).trim();
            const includesZipcode = zipRanges.some(range => String(range).trim() === zipcodeStr);
            if (includesZipcode) {
                console.log(`[FilterService] Found match for zipcode ${zipcode} in neighborhood:`, n);
            }
            return includesZipcode;
        });

        console.log(`[FilterService] Neighborhood lookup for zipcode ${zipcode} resolved to:`, matchingNeighborhood || 'null');

        if (!matchingNeighborhood) {
            return null;
        }

        const cityResponse = await apiClient<{ data: City[] }>(
            `/api/filters/cities`,
            `FilterService Fetch Cities`
        );
        const cities = cityResponse?.data || [];
        const city = cities.find(c => c.id === matchingNeighborhood.city_id);

        return {
            ...matchingNeighborhood,
            city_name: city?.name || ''
        };
    } catch (error) {
        console.error(`[FilterService] Neighborhood lookup failed for zipcode ${zipcode}:`, error instanceof Error ? error.message : 'Unknown error');
        return null;
    }
};

export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
    findNeighborhoodByZipcode,
};