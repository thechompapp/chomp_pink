/* src/utils/bulkAddUtils.js */
/**
 * Utility functions for bulk add operations.
 * Extracts common functionality from the bulk add processor to improve maintainability.
 */
import { logDebug, logError, logWarn } from '@/utils/logger.js';

/**
 * Finds duplicate items within a batch by name.
 * @param {Array} items - Array of items to check for duplicates
 * @returns {Array} - Array of duplicate item pairs
 */
export const findLocalDuplicates = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) return [];
  
  const duplicates = [];
  const seen = new Map();
  
  // First pass: record all items
  items.forEach((item, index) => {
    if (!item.name) return;
    
    const key = item.name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, { item, index });
    } else {
      // Found a duplicate
      const firstOccurrence = seen.get(key);
      duplicates.push({
        original: firstOccurrence.item,
        duplicate: item,
        originalIndex: firstOccurrence.index,
        duplicateIndex: index
      });
    }
  });
  
  return duplicates;
};

/**
 * Marks items as duplicates based on duplicate detection results.
 * @param {Array} items - Original items array
 * @param {Array} duplicates - Array of duplicate pairs
 * @returns {Array} - Items with duplicate flags
 */
export const markLocalDuplicates = (items, duplicates) => {
  if (!duplicates || duplicates.length === 0) return items;
  
  // Create a copy of the items array
  const markedItems = [...items];
  
  // Mark each duplicate
  duplicates.forEach(dup => {
    const duplicateIndex = dup.duplicateIndex;
    const originalIndex = dup.originalIndex;
    
    if (duplicateIndex >= 0 && duplicateIndex < markedItems.length) {
      markedItems[duplicateIndex] = {
        ...markedItems[duplicateIndex],
        isDuplicate: true,
        duplicateInfo: {
          originalIndex: originalIndex,
          originalName: markedItems[originalIndex].name,
          message: `Duplicate of item on line ${originalIndex + 1}: ${markedItems[originalIndex].name}`
        },
        status: 'warning',
        message: `Duplicate of item on line ${originalIndex + 1}`
      };
    }
  });
  
  return markedItems;
};

/**
 * Parses address components from a formatted address string.
 * @param {string} formattedAddress - Formatted address string
 * @returns {Object} - Parsed address components
 */
export const parseAddress = (formattedAddress) => {
  if (!formattedAddress) return {
    streetNumber: '',
    route: '',
    city: '',
    state: '',
    zipcode: ''
  };
  
  const addressParts = formattedAddress.split(',').map(part => part.trim());
  
  // Extract street number and route
  let streetNumber = '';
  let route = '';
  if (addressParts.length > 0) {
    const streetParts = addressParts[0].split(' ');
    streetNumber = streetParts[0] || '';
    route = streetParts.slice(1).join(' ') || '';
  }
  
  // Extract city
  let city = '';
  if (addressParts.length > 1) {
    city = addressParts[1];
  }
  
  // Extract state and zipcode
  let state = '';
  let zipcode = '';
  if (addressParts.length > 2) {
    const stateParts = addressParts[2].split(' ');
    state = stateParts[0] || '';
    zipcode = stateParts[1] || '';
  }
  
  return {
    streetNumber,
    route,
    city,
    state,
    zipcode
  };
};

/**
 * Formats place details from Google Places API for internal processing.
 * @param {Object} placeDetails - Raw place details from API
 * @param {string} itemName - Name of the item
 * @returns {Object} - Formatted place details
 */
export const formatPlaceDetails = (placeDetails, itemName) => {
  if (!placeDetails) return null;
  
  const formattedDetails = {
    placeId: placeDetails.place_id || placeDetails.placeId,
    name: itemName || placeDetails.name,
    formatted_address: placeDetails.formatted_address || placeDetails.address || '',
    geometry: {
      location: {
        lat: placeDetails.geometry?.location?.lat || 0,
        lng: placeDetails.geometry?.location?.lng || 0
      }
    },
    address_components: placeDetails.address_components || []
  };
  
  // If address_components is empty but we have a formatted address, parse it
  if (formattedDetails.address_components.length === 0 && formattedDetails.formatted_address) {
    const { streetNumber, route, city, state, zipcode } = parseAddress(formattedDetails.formatted_address);
    
    formattedDetails.address_components = [
      { long_name: streetNumber, short_name: streetNumber, types: ['street_number'] },
      { long_name: route, short_name: route, types: ['route'] },
      { long_name: city, short_name: city, types: ['locality', 'political'] },
      { long_name: state, short_name: state, types: ['administrative_area_level_1', 'political'] },
      { long_name: zipcode, short_name: zipcode, types: ['postal_code'] }
    ].filter(comp => comp.long_name); // Remove empty components
  }
  
  return formattedDetails;
};

/**
 * Formats an item for API submission.
 * @param {Object} item - Processed item
 * @returns {Object} - Item formatted for API submission
 */
export const formatItemForSubmission = (item) => {
  return {
    name: item.name,
    type: item.type || 'restaurant',
    address: item.address || '',
    city: item.city || '',
    state: item.state || '',
    zipcode: item.zipcode || '',
    city_id: item.city_id || 1,
    neighborhood_id: item.neighborhood_id || null,
    latitude: item.latitude || 0,
    longitude: item.longitude || 0,
    tags: item.tags || [],
    place_id: item.placeId || '',
    _lineNumber: item._lineNumber
  };
};

/**
 * Extracts address components from place details.
 * @param {Object} placeDetails - Formatted place details
 * @returns {Object} - Extracted address components
 */
export const extractAddressComponents = (placeDetails) => {
  if (!placeDetails || !placeDetails.address_components) {
    return {
      streetNumber: '',
      route: '',
      city: '',
      state: '',
      zipcode: ''
    };
  }
  
  const components = placeDetails.address_components;
  const streetNumber = components.find(comp => comp.types.includes('street_number'))?.long_name || '';
  const route = components.find(comp => comp.types.includes('route'))?.long_name || '';
  const city = components.find(comp => comp.types.includes('locality'))?.long_name || '';
  const state = components.find(comp => comp.types.includes('administrative_area_level_1'))?.short_name || '';
  const zipcode = components.find(comp => comp.types.includes('postal_code'))?.long_name || '';
  
  return {
    streetNumber,
    route,
    city,
    state,
    zipcode
  };
};

/**
 * Processes raw input text into structured items.
 * @param {string} rawText - Raw input text with items separated by newlines
 * @returns {Array} - Array of parsed items
 */
export const parseRawInput = (rawText) => {
  if (!rawText) return [];
  
  const lines = rawText.split('\n').filter(line => line.trim());
  
  return lines.map((line, index) => {
    // Support both pipe and semicolon separators
    const separator = line.includes('|') ? '|' : ';';
    const parts = line.split(separator).map(part => part.trim());
    
    // Basic validation
    if (parts.length < 2) {
      return {
        _lineNumber: index + 1,
        name: parts[0] || '',
        type: 'restaurant', // Default type
        status: 'error',
        message: 'Invalid format. Expected: name; type; location; tags'
      };
    }
    
    const name = parts[0];
    const type = parts[1].toLowerCase();
    const location = parts[2] || '';
    // Keep tags as a string to avoid issues with rendering
    const tags = parts[3] || '';
    
    // Create item based on type
    if (type === 'restaurant') {
      return {
        _lineNumber: index + 1,
        name,
        type,
        city_name: location, // For restaurants, location is city name
        tags,
        status: 'pending',
        message: 'Ready for processing'
      };
    } else if (type === 'dish') {
      return {
        _lineNumber: index + 1,
        name,
        type,
        restaurant_name: location, // For dishes, location is restaurant name
        tags,
        status: 'pending',
        message: 'Ready for processing'
      };
    } else {
      return {
        _lineNumber: index + 1,
        name,
        type: 'unknown',
        location,
        tags,
        status: 'error',
        message: `Unknown type: ${type}. Expected 'restaurant' or 'dish'.`
      };
    }
  });
};

/**
 * Batch processes items for better performance.
 * @param {Array} items - Items to process
 * @param {Function} processorFn - Function to process each item
 * @param {number} batchSize - Size of each batch
 * @returns {Promise<Array>} - Processed items
 */
export const batchProcess = async (items, processorFn, batchSize = 5) => {
  console.log('[batchProcess] Starting batch processing with:', { itemsLength: items?.length, processorFn, batchSize });
  if (!items || !Array.isArray(items) || items.length === 0) {
    logWarn('[batchProcess] No items to process or invalid items array');
    return [];
  }

  if (typeof processorFn !== 'function') {
    logError('[batchProcess] Invalid processor function');
    return [...items]; // Return original items to avoid data loss
  }

  // Import BULK_ADD_CONFIG at the top of the file
  // Ensure batchSize is a positive number
  const effectiveBatchSize = Math.max(1, Math.floor(Number(batchSize) || 5));
  
  // Create a copy of the items to avoid mutating the original array
  const results = [...items];
  
  // Track processing statistics for debugging
  const stats = {
    totalItems: items.length,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
    startTime: Date.now()
  };
  
  try {
    // Process items in batches
    for (let i = 0; i < items.length; i += effectiveBatchSize) {
      const batchStartTime = Date.now();
      
      // Create the current batch
      const batch = items.slice(i, Math.min(i + effectiveBatchSize, items.length));
      
      // Get the original indices for proper result placement
      // This handles the case where items might not have unique identifiers
      const batchIndices = [];
      for (let j = 0; j < batch.length; j++) {
        batchIndices.push(i + j); // More reliable than indexOf which can find wrong item
      }
      
      logDebug(`[batchProcess] Processing batch ${Math.floor(i / effectiveBatchSize) + 1}/${Math.ceil(items.length / effectiveBatchSize)} (${batch.length} items)`);
      
      // Process batch in parallel
      await Promise.all(
        batch.map((item, batchIndex) => {
          const originalIndex = batchIndices[batchIndex];
          
          return processorFn(item, originalIndex, results)
            .then(result => {
              stats.successfulItems++;
              return result;
            })
            .catch(error => {
              stats.failedItems++;
              
              // Log the error with context
              logError(`[batchProcess] Error processing item ${originalIndex}:`, error);
              console.error(`[batchProcess] Item data:`, item);
              
              // Update item with error status while preserving original data
              results[originalIndex] = {
                ...results[originalIndex],
                status: 'error',
                message: `Processing error: ${error.message || 'Unknown error'}`
              };
            })
            .finally(() => {
              stats.processedItems++;
            });
        })
      );
      
      const batchDuration = Date.now() - batchStartTime;
      logDebug(`[batchProcess] Batch completed in ${batchDuration}ms`);
    }
  } catch (error) {
    // Catch any unexpected errors in the batch processing loop itself
    logError('[batchProcess] Unexpected error in batch processing:', error);
    console.error('[batchProcess] Full error details:', error);
  }
  
  // Log processing statistics
  const totalDuration = Date.now() - stats.startTime;
  logDebug(`[batchProcess] Processing completed: ${stats.successfulItems}/${stats.totalItems} successful, ${stats.failedItems} failed, took ${totalDuration}ms`);
  
  return results;
};

/**
 * Alias for parseRawInput for backward compatibility
 * @param {string} rawText - Raw input text with items separated by newlines
 * @returns {Array} - Array of parsed items
 */
export const parseInputText = parseRawInput;

// Map of known zipcodes to neighborhoods for testing/fallback
export const zipToNeighborhoodMap = {
  '10014': { name: 'West Village', id: 3 },
  '11249': { name: 'Williamsburg', id: 5 },
  '10001': { name: 'NoMad', id: 7 },
  '11377': { name: 'Sunnyside', id: 12 },
  '11238': { name: 'Prospect Heights', id: 18 }
};

// Default configuration values
export const BULK_ADD_CONFIG = {
  batchSize: 5,
  defaultCityId: 1, // Default to New York
  defaultNeighborhoodId: 1,
  retryAttempts: 3,
  retryDelay: 1000
};
