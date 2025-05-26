/**
 * Place Data Transformers
 * 
 * Utility functions for transforming place data.
 * Extracted from usePlaceResolver.js to improve separation of concerns.
 */
import { logDebug } from '@/utils/logger';

/**
 * Extract address components from place details
 * @param {Object} placeDetails - Place details from Google Places API
 * @returns {Object} Extracted address components
 */
export const extractAddressComponents = (placeDetails) => {
  if (!placeDetails || !placeDetails.address_components) {
    return {
      street_number: '',
      route: '',
      neighborhood: '',
      locality: '',
      administrative_area_level_1: '',
      country: '',
      postal_code: ''
    };
  }
  
  const components = {};
  
  // Extract each address component
  placeDetails.address_components.forEach(component => {
    const types = component.types || [];
    
    if (types.includes('street_number')) {
      components.street_number = component.long_name;
    } else if (types.includes('route')) {
      components.route = component.long_name;
    } else if (types.includes('neighborhood')) {
      components.neighborhood = component.long_name;
    } else if (types.includes('locality')) {
      components.locality = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      components.administrative_area_level_1 = component.short_name;
    } else if (types.includes('country')) {
      components.country = component.long_name;
    } else if (types.includes('postal_code')) {
      components.postal_code = component.long_name;
    }
  });
  
  return {
    street_number: components.street_number || '',
    route: components.route || '',
    neighborhood: components.neighborhood || '',
    locality: components.locality || '',
    administrative_area_level_1: components.administrative_area_level_1 || '',
    country: components.country || '',
    postal_code: components.postal_code || ''
  };
};

/**
 * Format place details into a standardized format
 * @param {Object} placeDetails - Place details from Google Places API
 * @returns {Object} Formatted place details
 */
export const formatPlaceDetails = (placeDetails) => {
  if (!placeDetails) {
    return null;
  }
  
  // Extract address components
  const addressComponents = extractAddressComponents(placeDetails);
  
  // Build formatted address
  let formattedAddress = '';
  
  if (addressComponents.street_number && addressComponents.route) {
    formattedAddress += `${addressComponents.street_number} ${addressComponents.route}`;
  } else if (placeDetails.formatted_address) {
    formattedAddress = placeDetails.formatted_address;
  }
  
  // Add city, state, zip
  if (addressComponents.locality && addressComponents.administrative_area_level_1) {
    if (formattedAddress) formattedAddress += ', ';
    formattedAddress += `${addressComponents.locality}, ${addressComponents.administrative_area_level_1}`;
    
    if (addressComponents.postal_code) {
      formattedAddress += ` ${addressComponents.postal_code}`;
    }
  }
  
  // Create formatted place object
  const formattedPlace = {
    place_id: placeDetails.place_id,
    name: placeDetails.name,
    address: formattedAddress,
    latitude: placeDetails.geometry?.location?.lat,
    longitude: placeDetails.geometry?.location?.lng,
    phone: placeDetails.formatted_phone_number || placeDetails.international_phone_number,
    website: placeDetails.website,
    zipcode: addressComponents.postal_code,
    city: addressComponents.locality,
    state: addressComponents.administrative_area_level_1,
    country: addressComponents.country,
    neighborhood_name: addressComponents.neighborhood
  };
  
  logDebug(`[placeDataTransformers] Formatted place details for ${placeDetails.name}`);
  
  return formattedPlace;
};

/**
 * Process a place for an item
 * @param {Object} item - Item being processed
 * @param {Object} place - Place details
 * @param {Object} neighborhood - Neighborhood data
 * @returns {Object} Processed item with place details
 */
export const processPlaceForItem = (item, place, neighborhood) => {
  if (!item || !place) {
    return item;
  }
  
  // Create processed item with place details
  const processedItem = {
    ...item,
    place_id: place.place_id,
    formatted_address: place.address,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    phone: place.phone,
    website: place.website,
    zipcode: place.zipcode,
    city: place.city,
    state: place.state,
    country: place.country,
    neighborhood_name: place.neighborhood_name,
    neighborhood_id: neighborhood?.id || null,
    status: 'ready',
    message: 'Ready for submission',
    _processed: true
  };
  
  logDebug(`[placeDataTransformers] Processed place for item: ${item.name}`);
  
  return processedItem;
};

/**
 * Create a cache key for place data
 * @param {string} name - Place name
 * @param {string} address - Place address
 * @returns {string} Cache key
 */
export const createPlaceCacheKey = (name, address) => {
  if (!name) return '';
  
  return address 
    ? `${name.toLowerCase().trim()}_${address.toLowerCase().trim()}`
    : `${name.toLowerCase().trim()}`;
};

export default {
  extractAddressComponents,
  formatPlaceDetails,
  processPlaceForItem,
  createPlaceCacheKey
};
