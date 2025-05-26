/**
 * Enhanced Bulk Add Utility Functions
 * 
 * Provides utility functions for bulk add operations with improved performance,
 * error handling, and maintainability.
 */
import { logDebug, logError, logWarn, logInfo } from '@/utils/logger.js';

/**
 * Configuration constants for bulk add operations
 */
export const BULK_ADD_CONFIG = {
  batchSize: 5,           // Number of items to process in a batch
  maxRetries: 3,          // Maximum number of retries for API calls
  retryDelay: 1000,       // Delay between retries in milliseconds
  defaultCityId: 1,       // Default city ID (New York)
  defaultNeighborhoodId: 1, // Default neighborhood ID
  maxPlaceOptions: 5,     // Maximum number of place options to show
  processingTimeout: 30000, // Timeout for processing in milliseconds
  retryAttempts: 3        // For backward compatibility
};

/**
 * Mapping of ZIP codes to neighborhoods for testing and fallback
 */
export const zipToNeighborhoodMap = {
  '10001': { id: 1, name: 'Chelsea', city_id: 1 },
  '10002': { id: 2, name: 'Lower East Side', city_id: 1 },
  '10003': { id: 3, name: 'East Village', city_id: 1 },
  '10011': { id: 4, name: 'West Village', city_id: 1 },
  '10012': { id: 5, name: 'SoHo', city_id: 1 },
  '10013': { id: 6, name: 'Tribeca', city_id: 1 },
  '10014': { id: 7, name: 'Meatpacking District', city_id: 1 },
  '10016': { id: 8, name: 'Murray Hill', city_id: 1 },
  '10017': { id: 9, name: 'Midtown East', city_id: 1 },
  '10018': { id: 10, name: 'Midtown West', city_id: 1 },
  '10019': { id: 11, name: 'Midtown', city_id: 1 },
  '10021': { id: 12, name: 'Upper East Side', city_id: 1 },
  '10023': { id: 13, name: 'Upper West Side', city_id: 1 },
  '10024': { id: 14, name: 'Upper West Side', city_id: 1 },
  '10025': { id: 15, name: 'Upper West Side', city_id: 1 },
  '10028': { id: 16, name: 'Upper East Side', city_id: 1 },
  '10036': { id: 17, name: 'Times Square', city_id: 1 },
  '11238': { id: 18, name: 'Prospect Heights', city_id: 2 },
  '11249': { id: 5, name: 'Williamsburg', city_id: 2 },
  '11377': { id: 12, name: 'Sunnyside', city_id: 3 }
};

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
 * Parses raw input text into structured items.
 * @param {string} rawText - Raw input text with items separated by newlines
 * @returns {Array} - Array of parsed items
 */
export const parseRawInput = (rawText) => {
  if (!rawText || !rawText.trim()) return [];
  
  const lines = rawText.split('\n').filter(line => line.trim());
  logDebug(`[parseRawInput] Processing ${lines.length} lines`);
  
  return lines.map((line, index) => {
    try {
      // Split by comma or pipe
      const parts = line.split(/[,|]/).map(part => part.trim());
      
      // Basic validation
      if (parts.length < 1) {
        return {
          _raw: line,
          _lineNumber: index + 1,
          status: 'error',
          message: 'Invalid format. Please use: Name, Address, City, State, ZIP'
        };
      }
      
      // Extract name (required)
      const name = parts[0];
      
      if (!name) {
        return {
          _raw: line,
          _lineNumber: index + 1,
          status: 'error',
          message: 'Name is required'
        };
      }
      
      // Extract address (optional but recommended)
      const address = parts.length > 1 ? parts[1] : '';
      
      // Extract city (optional)
      const city = parts.length > 2 ? parts[2] : '';
      
      // Extract state (optional)
      const state = parts.length > 3 ? parts[3] : '';
      
      // Extract ZIP (optional)
      const zipcode = parts.length > 4 ? parts[4] : '';
      
      // Extract tags (optional)
      const tags = parts.length > 5 ? 
        parts[5].split(',').map(tag => tag.trim()).filter(Boolean) : 
        [];
      
      return {
        name,
        address,
        city,
        state,
        zipcode,
        tags,
        type: 'restaurant', // Default type
        _raw: line,
        _lineNumber: index + 1,
        status: 'pending',
        message: 'Ready to process'
      };
    } catch (error) {
      logError(`[parseRawInput] Error parsing line ${index + 1}:`, error);
      
      return {
        _raw: line,
        _lineNumber: index + 1,
        status: 'error',
        message: `Error parsing line: ${error.message}`
      };
    }
  });
};

/**
 * Alternative parser that handles more complex formats
 * @param {string} inputText - Raw input text
 * @returns {Array} - Array of parsed items
 */
export const parseInputText = (inputText) => {
  if (!inputText || typeof inputText !== 'string') {
    return [];
  }
  
  // Split by newlines and filter out empty lines
  const lines = inputText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  
  logInfo(`[parseInputText] Processing ${lines.length} lines of input`);
  
  return lines.map((line, index) => {
    try {
      // First, check if this is a semicolon-delimited format
      // Example: "Maison Passerelle; restaurant; New York; French-Diaspora Fusion"
      if (line.includes(';')) {
        const parts = line.split(';').map(part => part.trim());
        const name = parts[0] || '';
        
        if (!name) {
          return {
            _raw: line,
            _lineNumber: index + 1,
            status: 'error',
            message: 'Name is required'
          };
        }
        
        const type = parts.length > 1 ? parts[1] : 'restaurant';
        const location = parts.length > 2 ? parts[2] : '';
        const hashtags = parts.length > 3 ? parts[3] : '';
        
        // Extract city and state from location if possible
        let city = '';
        let state = '';
        
        if (location.includes(',')) {
          const locationParts = location.split(',').map(part => part.trim());
          city = locationParts[0] || '';
          state = locationParts.length > 1 ? locationParts[1] : '';
        } else {
          city = location; // Assume the whole location is the city
        }
        
        // Parse hashtags
        let tags = [];
        if (hashtags) {
          // If hashtags contains commas, split by commas
          if (hashtags.includes(',')) {
            tags = hashtags.split(',').map(tag => tag.trim()).filter(Boolean);
          } else {
            // Otherwise, treat the whole string as a single tag
            tags = [hashtags];
          }
        }
        
        return {
          name,
          type,
          city,
          state,
          tags,
          _raw: line,
          _lineNumber: index + 1,
          status: 'pending',
          message: 'Ready to process'
        };
      }
      
      // Support other formats: CSV, pipe-delimited, or even mixed
      // First, determine the primary delimiter (comma or pipe)
      const primaryDelimiter = line.includes('|') ? '|' : ',';
      const parts = line.split(primaryDelimiter).map(part => part.trim());
      
      // Extract the basic fields
      const name = parts[0] || '';
      
      if (!name) {
        return {
          _raw: line,
          _lineNumber: index + 1,
          status: 'error',
          message: 'Name is required'
        };
      }
      
      // Handle different formats for address information
      let address = '';
      let city = '';
      let state = '';
      let zipcode = '';
      let tags = [];
      
      if (parts.length > 1) {
        // Check if the second part contains a full address
        const addressPart = parts[1];
        
        if (addressPart.includes(',')) {
          // This might be a full address like "123 Main St, New York, NY 10001"
          const addressParts = addressPart.split(',').map(part => part.trim());
          
          address = addressParts[0] || '';
          city = addressParts.length > 1 ? addressParts[1] : '';
          
          if (addressParts.length > 2) {
            // The last part might contain state and ZIP
            const stateZip = addressParts[2].split(' ').filter(Boolean);
            state = stateZip[0] || '';
            zipcode = stateZip.length > 1 ? stateZip[1] : '';
          }
        } else {
          // Simple address
          address = addressPart;
          
          // Get city, state, ZIP from other parts if available
          city = parts.length > 2 ? parts[2] : '';
          state = parts.length > 3 ? parts[3] : '';
          zipcode = parts.length > 4 ? parts[4] : '';
        }
      }
      
      // Extract tags from the last part if it contains commas
      const lastPart = parts[parts.length - 1];
      if (parts.length > 2 && lastPart.includes(',')) {
        // This might be a list of tags
        tags = lastPart.split(',').map(tag => tag.trim()).filter(Boolean);
      } else if (parts.length > 5) {
        // Tags in the standard position
        tags = parts[5].split(',').map(tag => tag.trim()).filter(Boolean);
      }
      
      return {
        name,
        address,
        city,
        state,
        zipcode,
        tags,
        type: 'restaurant',
        _raw: line,
        _lineNumber: index + 1,
        status: 'pending',
        message: 'Ready to process'
      };
    } catch (error) {
      logError(`[parseInputText] Error parsing line ${index + 1}:`, error);
      return {
        _raw: line,
        _lineNumber: index + 1,
        status: 'error',
        message: `Error parsing line: ${error.message}`
      };
    }
  });
};

/**
 * Batch processes items for better performance with enhanced error handling.
 * @param {Array} items - Items to process
 * @param {Function} processorFn - Function to process each item
 * @param {number} batchSize - Size of each batch
 * @param {Function} onBatchComplete - Optional callback for batch completion
 * @returns {Promise<Array>} - Processed items
 */
export const batchProcess = async (items, processorFn, batchSize = BULK_ADD_CONFIG.batchSize, onBatchComplete = null) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }
  
  if (!processorFn || typeof processorFn !== 'function') {
    throw new Error('Processor function is required');
  }
  
  const processedItems = [];
  const batches = [];
  
  // Split items into batches
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  logInfo(`[batchProcess] Processing ${items.length} items in ${batches.length} batches`);
  
  // Process each batch sequentially
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    logDebug(`[batchProcess] Processing batch ${batchIndex + 1} of ${batches.length} (${batch.length} items)`);
    
    try {
      // Process items in the batch concurrently
      const batchPromises = batch.map(async (item) => {
        try {
          return await processorFn(item);
        } catch (error) {
          logError(`[batchProcess] Error processing item ${item.name || ''}:`, error);
          return {
            ...item,
            status: 'error',
            message: `Error: ${error.message || 'Unknown error'}`,
            error: error
          };
        }
      });
      
      // Wait for all items in the batch to be processed
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results and handle any errors
      const processedBatch = batchResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Handle rejected promises
          logError(`[batchProcess] Promise rejected for item:`, result.reason);
          return {
            ...batch[index],
            status: 'error',
            message: `Error: ${result.reason?.message || 'Unknown error'}`,
            error: result.reason
          };
        }
      });
      
      // Add batch results to processed items
      processedItems.push(...processedBatch);
      
      // Call the batch complete callback if provided
      if (onBatchComplete && typeof onBatchComplete === 'function') {
        onBatchComplete(processedBatch, batchIndex, batches.length);
      }
      
      // Add a small delay between batches to avoid overwhelming the API
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (batchError) {
      logError(`[batchProcess] Error processing batch ${batchIndex + 1}:`, batchError);
      
      // Mark all items in the batch as failed
      const failedBatch = batch.map(item => ({
        ...item,
        status: 'error',
        message: `Batch error: ${batchError.message || 'Unknown error'}`,
        error: batchError
      }));
      
      processedItems.push(...failedBatch);
      
      // Call the batch complete callback if provided
      if (onBatchComplete && typeof onBatchComplete === 'function') {
        onBatchComplete(failedBatch, batchIndex, batches.length);
      }
    }
  }
  
  logInfo(`[batchProcess] Finished processing ${processedItems.length} items`);
  
  return processedItems;
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} - Result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = BULK_ADD_CONFIG.maxRetries, baseDelay = BULK_ADD_CONFIG.retryDelay) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        logWarn(`[retryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Additional neighborhood information for reference
const additionalNeighborhoods = {
  '10014': 'West Village',
  '11249': 'Williamsburg',
  '10001': 'NoMad',
  '11377': 'Sunnyside',
  '11238': 'Prospect Heights'
};

// Note: The main BULK_ADD_CONFIG and zipToNeighborhoodMap are defined at the top of this file
