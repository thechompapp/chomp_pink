/* src/services/restaurantService.js */
import apiClient, { ApiError } from '@/services/apiClient.js'; // Use global alias

// Helper function (if any)
const formatRestaurant = (restaurant) => {
  // Ensure basic structure exists
  if (!restaurant || typeof restaurant.id !== 'number') {
    console.warn('[formatRestaurant] Received invalid restaurant data:', restaurant);
    return null; // Return null for invalid data
  }
  return {
    id: restaurant.id,
    name: restaurant.name || 'Unnamed Restaurant', // Provide default name
    city_id: restaurant.city_id ? Number(restaurant.city_id) : null,
    neighborhood_id: restaurant.neighborhood_id ? Number(restaurant.neighborhood_id) : null,
    latitude: restaurant.latitude != null ? Number(restaurant.latitude) : null,
    longitude: restaurant.longitude != null ? Number(restaurant.longitude) : null,
    adds: Number(restaurant.adds ?? 0),
    tags: Array.isArray(restaurant.tags) ? restaurant.tags.filter(t => typeof t === 'string') : [],
    // Add other fields as needed, ensuring type safety
    address: restaurant.address || null,
    phone_number: restaurant.phone_number || null,
    website: restaurant.website || null,
    google_maps_url: restaurant.google_maps_url || null,
    google_place_id: restaurant.google_place_id || null,
  };
};

// --- Service Functions ---

// Get all restaurants with optional filtering/pagination
export const getRestaurants = async (params = {}) => {
  // Example: Build query string from params
  const queryParams = new URLSearchParams();
  if (params.cityId) queryParams.append('cityId', String(params.cityId));
  if (params.neighborhoodId) queryParams.append('neighborhoodId', String(params.neighborhoodId));
  if (params.search) queryParams.append('search', params.search);
  // Add other potential params like page, limit, sortBy etc.

  const queryString = queryParams.toString();
  const endpoint = `/api/restaurants${queryString ? `?${queryString}` : ''}`;
  const context = `RestaurantService Get All`;

  try {
    const response = await apiClient(endpoint, context);
    if (!response.success || !Array.isArray(response.data)) {
      throw new ApiError(response.error || 'Failed to fetch restaurants.', response.status || 500, response);
    }
    // Filter out null results from formatting potentially invalid data
    return response.data.map(formatRestaurant).filter(Boolean);
  } catch (error) {
    console.error(`[${context}] Error fetching restaurants:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch restaurants', 500, error);
  }
};

// Get a single restaurant by its ID
export const getRestaurantById = async (restaurantId) => {
  if (!restaurantId) {
    throw new ApiError('Restaurant ID is required', 400);
  }
  const endpoint = `/api/restaurants/${encodeURIComponent(String(restaurantId))}`;
  const context = `RestaurantService Get Details`;
  try {
    const response = await apiClient(endpoint, context);
    if (!response.success || !response.data) {
      // Use the status from the response if available, otherwise default to 404
      throw new ApiError(response.error || `Restaurant not found with ID: ${restaurantId}`, response.status ?? 404, response);
    }
    const formatted = formatRestaurant(response.data);
    // Check if formatting failed
    if (!formatted) {
      throw new ApiError(`Invalid restaurant data received for ID: ${restaurantId}`, 500);
    }
    return formatted;
  } catch (error) {
    console.error(`[${context}] Error for restaurant ${restaurantId}:`, error);
    // Re-throw ApiError instances directly
    if (error instanceof ApiError) throw error;
    // Wrap other errors
    throw new ApiError(error.message || 'Failed to fetch restaurant details', error.status || 500, error);
  }
};

// Creates a new restaurant via the API.
export const createRestaurant = async (restaurantData) => {
  // Basic validation
  if (!restaurantData || !restaurantData.name || !restaurantData.city_id) {
    throw new ApiError('Missing required fields (name, city_id) for creating restaurant.', 400);
  }
  const endpoint = `/api/restaurants`;
  const context = `RestaurantService Create`;
  try {
    // Ensure data is stringified for the request body
    const response = await apiClient(endpoint, context, {
      method: 'POST',
      body: JSON.stringify(restaurantData),
      // Ensure headers indicate JSON content type
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // Check for success and presence of data in the response
    if (!response.success || !response.data) {
      throw new ApiError(response.error || 'Failed to create restaurant.', response.status || 500, response);
    }
    // Return the created restaurant data, potentially formatted
    return formatRestaurant(response.data); // Format the response data
  } catch (error) {
    console.error(`[${context}] Error creating restaurant:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to create restaurant', 500, error);
  }
};

// --- Service Object Export ---
// This object bundles all exported functions for convenient import.
export const restaurantService = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  // Add other exported functions here if created (e.g., updateRestaurant, deleteRestaurant)
};

// --- Default Export ---
// Makes the entire service object available as the default import.
export default restaurantService;