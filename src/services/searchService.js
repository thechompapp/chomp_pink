/* src/services/searchService.js */
// Patch: Make cityId optional in findRestaurantForBulkAdd to support city-agnostic lookups.

import apiClient from '@/services/apiClient';

const search = async (params) => {
    const { q, limit = 10, offset = 0, type = 'all' } = params;
    const queryParams = new URLSearchParams();
    if (q) queryParams.append('q', String(q));
    queryParams.append('limit', String(limit));
    queryParams.append('offset', String(offset));
    if (type && type !== 'all') queryParams.append('type', String(type));

    const endpoint = `/api/search?${queryParams.toString()}`;
    const context = `SearchService q=${q || '""'} type=${type}`;

    try {
        // Assume apiClient returns { success: boolean, data: any, error: string|null }
        const response = await apiClient(endpoint, context);

        if (!response.success || !response.data) {
            console.error(`[SearchService] API call failed or returned invalid data:`, response.error);
            throw new Error(response.error || 'Search API returned invalid data.');
        }

        // Basic formatting assumed based on previous context
         const formattedData = {
             restaurants: Array.isArray(response.data.restaurants) ? response.data.restaurants.map(r => ({ ...r, id: Number(r.id) })) : [],
             dishes: Array.isArray(response.data.dishes) ? response.data.dishes.map(d => ({ ...d, id: Number(d.id), restaurant_id: Number(d.restaurant_id) })) : [],
             lists: Array.isArray(response.data.lists) ? response.data.lists.map(l => ({ ...l, id: Number(l.id) })) : [],
        };
        return formattedData; // Return the data directly from the API response

    } catch (error/*: unknown*/) {
        console.error(`[SearchService] Error during search for "${q}":`, error);
        if (error instanceof Error) {
            throw error; // Re-throw the caught error
        } else {
            throw new Error(`An unexpected error occurred during search.`);
        }
    }
};


/**
 * Calls the backend endpoint to find restaurants based on name, optionally filtered by city.
 * Used for both restaurant verification (with cityId) and dish restaurant lookup (without cityId).
 * @param {string} restaurantName - The name of the restaurant to search for.
 * @param {number | string | null} [cityId=null] - Optional: The ID of the city to limit the search. If null/omitted, searches all cities (requires backend support).
 * @returns {Promise<{ status: 'found' | 'suggestions' | 'not_found' | 'error', data?: any, message?: string }>}
 * - 'found': Single high-confidence match. data: { id, name, address, city_id, city_name, score }
 * - 'suggestions': Multiple matches or lower confidence matches. data: [{ id, name, address, city_id, city_name, score }, ...]
 * - 'not_found': No matches found.
 * - 'error': An error occurred. message contains details.
 */
const findRestaurantForBulkAdd = async (restaurantName, cityId = null) => { // Default cityId to null
     const endpoint = '/api/search/find-restaurant-bulk';
     // Update context based on whether cityId is provided
     const context = `SearchService Bulk Lookup: Name=${restaurantName}${cityId ? `, CityID=${cityId}` : ' (City Agnostic)'}`;

     if (!restaurantName || String(restaurantName).trim() === '') {
          console.error(`[SearchService findRestaurantForBulkAdd] Invalid input:`, { restaurantName, cityId });
          throw new Error('Restaurant name is required for lookup.');
     }

     // Construct body, only include cityId if it's provided and valid
     const bodyPayload = { restaurantName: String(restaurantName).trim() };
     const numericCityId = Number(cityId);
     // IMPORTANT: Only send cityId if it's a valid positive number.
     // If cityId is null/undefined/invalid, it will be omitted, triggering city-agnostic search on backend.
     if (!isNaN(numericCityId) && numericCityId > 0) {
         bodyPayload.cityId = numericCityId;
     }

     const body = JSON.stringify(bodyPayload);

     try {
          // Use apiClient for the POST request
          const response = await apiClient(endpoint, context, {
               method: 'POST',
               body: body,
               // apiClient should automatically add 'Content-Type': 'application/json'
          });

          // Check if the API call itself failed in apiClient or returned unexpected structure
          if (!response || typeof response.status === 'undefined') {
               console.error(`[SearchService findRestaurantForBulkAdd] API client returned unexpected response:`, response);
               throw new Error('Failed to get a valid response from the restaurant lookup API.');
          }

           // Check for explicit error status from the backend response structure
           if (response.status === 'error') {
                console.error(`[SearchService findRestaurantForBulkAdd] API returned error:`, response.message);
                // Propagate the error message from the backend
                throw new Error(response.message || 'Restaurant lookup failed.');
           }

           // Return the structured response { status, data } for the frontend to handle
           // Ensure data includes city_name if status is 'suggestions' and multiple cities are possible
           return response;

     } catch (error/*: unknown*/) {
          console.error(`[SearchService findRestaurantForBulkAdd] Error calling lookup API:`, error);
          // Re-throw or return an error structure
          if (error instanceof Error) {
               throw error; // Re-throw the caught error
          } else {
               throw new Error('An unexpected error occurred during restaurant lookup.');
          }
     }
};


export const searchService = {
    search,
    findRestaurantForBulkAdd,
};