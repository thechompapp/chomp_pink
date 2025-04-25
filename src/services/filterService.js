/* src/services/filterService.js */
import apiClient from '@/services/apiClient.js';

const formatCity = (city) => {
  if (!city || typeof city.id !== 'number' || !city.name) return null;
  return { id: city.id, name: city.name };
};

const formatNeighborhood = (neighborhood) => {
  if (!neighborhood || typeof neighborhood.id !== 'number' || !neighborhood.name) return null;
  return { id: neighborhood.id, name: neighborhood.name, city_id: neighborhood.city_id ? Number(neighborhood.city_id) : null };
};

const formatCuisine = (cuisine) => {
  if (typeof cuisine === 'string') return { id: cuisine, name: cuisine };
  if (cuisine && typeof cuisine.id !== 'undefined' && cuisine.name) {
    return { id: cuisine.id, name: cuisine.name };
  }
  return null;
};

export const getCities = async () => {
  const endpoint = '/api/filters/cities';
  try {
    const response = await apiClient(endpoint);
    if (!response.success || !Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to fetch cities.');
    }
    return response.data.map(formatCity).filter(Boolean);
  } catch (error) {
    console.error(`[FilterService Get Cities] Error:`, error);
    throw new Error(error.message || 'Failed to fetch cities');
  }
};

export const getNeighborhoods = async (cityIdParam = null) => {
  let endpoint = '/api/filters/neighborhoods';
  let cityIdForQuery = null;

  if (cityIdParam !== null && cityIdParam !== undefined) {
    if (typeof cityIdParam === 'object' && cityIdParam.id != null) {
      cityIdForQuery = String(cityIdParam.id);
      console.warn('[filterService getNeighborhoods] Received cityId as object, extracting ID:', cityIdForQuery);
    } else if (typeof cityIdParam === 'number' || (typeof cityIdParam === 'string' && cityIdParam.trim() !== '' && !isNaN(parseInt(cityIdParam)))) {
      cityIdForQuery = String(cityIdParam);
    } else {
      console.error('[filterService getNeighborhoods] Received invalid cityIdParam type or value:', cityIdParam);
      cityIdForQuery = null;
    }
  }

  if (cityIdForQuery) {
    endpoint += `?cityId=${encodeURIComponent(cityIdForQuery)}`;
  }
  try {
    const response = await apiClient(endpoint);
    if (!response.success || !Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to fetch neighborhoods.');
    }
    return response.data.map(formatNeighborhood).filter(Boolean);
  } catch (error) {
    console.error(`[FilterService Get Neighborhoods (City ID: ${cityIdForQuery || 'All'})] Error:`, error);
    throw new Error(error.message || 'Failed to fetch neighborhoods');
  }
};

export const getCuisines = async () => {
  const endpoint = '/api/filters/cuisines';
  try {
    const response = await apiClient(endpoint);
    if (!response.success || !Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to fetch cuisines.');
    }
    return response.data.map(formatCuisine).filter(Boolean);
  } catch (error) {
    console.error(`[FilterService Get Cuisines] Error:`, error);
    throw new Error(error.message || 'Failed to fetch cuisines');
  }
};

export const filterService = { getCities, getNeighborhoods, getCuisines };
export default filterService;