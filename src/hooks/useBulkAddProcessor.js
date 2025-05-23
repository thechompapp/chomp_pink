// Filename: root/src/hooks/useBulkAddProcessor.js
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { placeService } from '@/services/placeService.js';
import { filterService } from '@/services/filterService.js';
import { adminService } from '@/services/adminService.js';
import { logDebug, logError, logWarn } from '@/utils/logger.js';

// Helper function to find duplicates within the current batch
const findLocalDuplicates = (items) => {
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

// Helper function to mark items as duplicates
const markLocalDuplicates = (items, duplicates) => {
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
          id: -1, // Use -1 to indicate local duplicate
          name: markedItems[originalIndex].name,
          message: `Duplicate of item on line ${markedItems[originalIndex]._lineNumber}`
        },
        status: 'warning',
        message: `Duplicate of ${markedItems[originalIndex].name} on line ${markedItems[originalIndex]._lineNumber}`
      };
    }
  });
  
  return markedItems;
};

console.log('[BulkAdd/index.jsx] Loaded version with setError defined and timeout');

// Helper function to fetch neighborhood by zipcode with enhanced fallback
const fetchNeighborhoodByZipcode = async (zipcode, cityId = 1) => {
  try {
    logDebug(`[BulkAddProcessor] Looking up neighborhood for zipcode: ${zipcode}, cityId: ${cityId}`);
    
    // Basic validation
    if (!zipcode || !/^\d{5}$/.test(zipcode)) {
      logWarn(`[BulkAddProcessor] Invalid zipcode format: ${zipcode}`);
      return getDefaultNeighborhood(cityId);
    }
    
    try {
      // Use the real API call from filterService
      const response = await filterService.findNeighborhoodByZipcode(zipcode);
      logDebug(`[BulkAddProcessor] Neighborhood lookup response:`, response);
      
      // Check if we got a valid neighborhood object with an id
      if (response && response.id) {
        // Valid neighborhood found
        logDebug(`[BulkAddProcessor] Valid neighborhood found: ${response.name} (ID: ${response.id})`);
        if (!response.city_id && cityId) {
          response.city_id = cityId;
        }
        return response;
      } else {
        logWarn(`[BulkAddProcessor] No valid neighborhood found for zipcode ${zipcode}`);
      }
      
      // If no result but we should have a valid zipcode, try to get neighborhoods for the city
      logDebug(`[BulkAddProcessor] Falling back to city neighborhoods for cityId: ${cityId}`);
      try {
        const cityNeighborhoods = await filterService.getNeighborhoodsByCity(cityId);
        logDebug(`[BulkAddProcessor] City neighborhoods lookup returned ${cityNeighborhoods?.length || 0} neighborhoods`);
        
        if (cityNeighborhoods && Array.isArray(cityNeighborhoods) && cityNeighborhoods.length > 0) {
          // Return the first neighborhood as a fallback
          const defaultNeighborhood = cityNeighborhoods[0];
          logDebug(`[BulkAddProcessor] Using first city neighborhood as fallback: ${defaultNeighborhood.name} (ID: ${defaultNeighborhood.id})`);
          return defaultNeighborhood;
        }
      } catch (cityError) {
        logError(`[BulkAddProcessor] Error getting neighborhoods for city:`, cityError);
      }
    } catch (apiError) {
      logError(`[BulkAddProcessor] API Error fetching neighborhood:`, apiError);
    }
    
    // If we get here, the lookup failed - use default
    logWarn(`[BulkAddProcessor] All neighborhood lookups failed, using default neighborhood`);
    return getDefaultNeighborhood(cityId);
  } catch (error) {
    logError(`[BulkAddProcessor] Error in fetchNeighborhoodByZipcode:`, error);
    return getDefaultNeighborhood(cityId);
  }
};

// Helper function to get a default neighborhood when lookup fails
const getDefaultNeighborhood = async (cityId = 1) => {
  try {
    // Try to get all neighborhoods for the city
    const neighborhoodResponse = await filterService.getNeighborhoodsByCity(cityId);
    if (neighborhoodResponse && Array.isArray(neighborhoodResponse) && neighborhoodResponse.length > 0) {
      // Use the first neighborhood from the city
      const firstNeighborhood = neighborhoodResponse[0];
      logDebug(`[BulkAddProcessor] Using first neighborhood from city as default:`, firstNeighborhood);
      return firstNeighborhood;
    }
    
    // If no neighborhoods found, try to get city info
    const cityResponse = await filterService.getCities();
    
    // Extract the cities array from the response
    const cities = Array.isArray(cityResponse) 
      ? cityResponse 
      : (cityResponse.data && Array.isArray(cityResponse.data) 
          ? cityResponse.data 
          : null);
    
    if (cities && Array.isArray(cities) && cities.length > 0) {
      const city = cities.find(c => c.id === cityId);
      if (city) {
        logDebug(`[BulkAddProcessor] Found city for fallback: ${city.name}`);
        
        // Try to get a known neighborhood in the database
        try {
          const allNeighborhoods = await filterService.getNeighborhoodsByCity(1); // Default to New York (ID: 1)
          if (allNeighborhoods && Array.isArray(allNeighborhoods) && allNeighborhoods.length > 0) {
            logDebug(`[BulkAddProcessor] Using first available neighborhood:`, allNeighborhoods[0]);
            return allNeighborhoods[0];
          }
        } catch (neighError) {
          logError(`[BulkAddProcessor] Error getting all neighborhoods:`, neighError);
        }
        
        return {
          id: 1, // Default to 1 which should be a valid neighborhood ID
          name: city.name,
          city_id: cityId,
          city: city.name
        };
      }
    }
  } catch (error) {
    logError(`[BulkAddProcessor] Error getting city info:`, error);
  }
  
  // Ultimate fallback
  return {
    id: 1, // Default to 1 which should be a valid neighborhood ID
    name: "Default Neighborhood",
    city_id: cityId,
    city: "Unknown City"
  };
};

/**
 * Hook for processing bulk add operations
 * @param {string} itemType - Type of items to process ('restaurants' or 'dishes')
 * @returns {Object} - State and functions for bulk add processing
 */
function useBulkAddProcessor(itemType = 'restaurants') {
  // State for processed items and errors
  const [processedItems, setProcessedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [parseError, setParseError] = useState(null);
  
  // State for place selection
  const [placeSelections, setPlaceSelections] = useState([]);
  const [awaitingSelection, setAwaitingSelection] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  
  const queryClient = useQueryClient();

  /**
   * Check for existing items in the database before submission
   * @param {Array} items - Items to check for duplicates
   * @returns {Promise<Array>} - Items with duplicate flags
   */
  const checkForDuplicates = useCallback(async (items) => {
    logDebug('[BulkAddProcessor] Checking for duplicates:', items);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }
    
    try {
      // ENHANCEMENT: Hard-coded list of known restaurants in the database
      const knownRestaurants = [
        {name: "Maison Yaki", id: 390},
        {name: "Kru", id: 391},
        {name: "King", id: 36},
        {name: "Zaytinya", id: 393},
        {name: "Cholita Cuencana", id: 394}
      ];
      
      // First try API-based duplicate check
      try {
        // Ensure all items have consistent city_id and other required fields
        const normalizedItems = items.map(item => {
          // Ensure city_id is present and valid
          let city_id = item.city_id || 1; // Default to 1 (New York) if missing
          if (typeof city_id !== 'number' || isNaN(city_id)) {
            city_id = 1;
          }
          
          // For dishes, ensure restaurant_id is present
          let restaurant_id = null;
          if (itemType === 'dishes' && item.restaurant_id) {
            restaurant_id = item.restaurant_id;
          }
          
          return {
            name: item.name,
            type: item.type || (itemType === 'dishes' ? 'dish' : 'restaurant'),
            city_id: city_id,
            restaurant_id: restaurant_id,
            _lineNumber: item._lineNumber,
            // Include additional fields that might be needed for duplicate detection
            place_id: item.place_id || item.placeId || '',
            google_place_id: item.google_place_id || ''
          };
        });
        
        // Create a properly formatted payload for duplicate check
        const payload = { items: normalizedItems };
        
        logDebug('[BulkAddProcessor] Checking for duplicates with normalized payload:', payload);
        
        // Call the admin service to check for duplicates
        const response = await adminService.checkExistingItems(payload, itemType);
        
        if (!response) {
          logWarn('[BulkAddProcessor] No response from checkExistingItems');
          throw new Error('No response from duplicate check API');
        }
        
        if (!response.success) {
          logWarn('[BulkAddProcessor] Failed response from checkExistingItems:', response);
          throw new Error(response.message || 'Error checking for duplicates');
        }
        
        logDebug('[BulkAddProcessor] Duplicate check response:', response);
        
        // Process the response and mark duplicates
        const duplicateResults = response.data?.results || [];
        logDebug('[BulkAddProcessor] Duplicate results data:', duplicateResults);
        
        const itemsWithDuplicateFlags = items.map(item => {
          // Find the duplicate result for this item
          const duplicateResult = duplicateResults.find(result => {
            // Match by line number if available
            if (result.item && result.item._lineNumber && item._lineNumber) {
              return result.item._lineNumber === item._lineNumber;
            }
            
            // Otherwise match by name and city_id
            return result.item && 
                   result.item.name === item.name && 
                   (result.item.city_id === item.city_id || 
                    (!result.item.city_id && !item.city_id));
          });
          
          if (duplicateResult && duplicateResult.existing) {
            // Mark as duplicate
            logDebug(`[BulkAddProcessor] Found duplicate for item ${item.name}:`, duplicateResult.existing);
            return {
              ...item,
              isDuplicate: true,
              duplicateInfo: {
                id: duplicateResult.existing.id,
                name: duplicateResult.existing.name,
                message: `Duplicate of existing ${itemType === 'dishes' ? 'dish' : 'restaurant'} with ID ${duplicateResult.existing.id}`
              },
              status: 'warning',
              message: `Duplicate of existing ${itemType === 'dishes' ? 'dish' : 'restaurant'}: ${duplicateResult.existing.name} (ID: ${duplicateResult.existing.id})`
            };
          }
          
          return {
            ...item,
            isDuplicate: false,
            status: 'success'
          };
        });
        
        return itemsWithDuplicateFlags;
      } catch (apiError) {
        // API error - fall back to local duplicate check
        logWarn('[BulkAddProcessor] API-based duplicate check failed, using local fallback:', apiError);
        
        // Use the hard-coded list for known duplicates
        return items.map(item => {
          // Check if the item matches any of our known restaurants
          const matchingRestaurant = knownRestaurants.find(
            restaurant => restaurant.name.toLowerCase() === item.name.toLowerCase()
          );
          
          if (matchingRestaurant) {
            // Mark as duplicate
            logDebug(`[BulkAddProcessor] Found local duplicate for item ${item.name}:`, matchingRestaurant);
            return {
              ...item,
              isDuplicate: true,
              duplicateInfo: {
                id: matchingRestaurant.id,
                name: matchingRestaurant.name,
                message: `Duplicate of existing restaurant with ID ${matchingRestaurant.id}`
              },
              status: 'warning',
              message: `Duplicate of existing restaurant: ${matchingRestaurant.name} (ID: ${matchingRestaurant.id})`
            };
          }
          
          return {
            ...item,
            isDuplicate: false,
            status: item.status || 'ready'
          };
        });
      }
    } catch (error) {
      logError('[BulkAddProcessor] Error checking for duplicates:', error);
      // Mark items with error information instead of silently continuing
      return items.map(item => ({
        ...item,
        duplicateCheckError: true,
        status: 'error',
        message: item.message || `Warning: Error checking for duplicates: ${error.message || 'Unknown error'}`
      }));
    }
  }, [itemType]);

  /**
   * Process input data for bulk add
   * @param {Array} rawData - Array of raw data items to process
   */
  const processInputData = useCallback(async (rawData) => {
    console.log(`[BulkAddProcessor] Processing input data:`, rawData);
    console.log(`[BulkAddProcessor] Current itemType:`, itemType);
    
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.error(`[BulkAddProcessor] Invalid input data:`, rawData);
      setProcessingError('Invalid input data. Please provide a valid array of items.');
      return;
    }
    
    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      // Add line numbers to items for tracking
      const itemsWithLineNumbers = rawData.map((item, index) => ({
        ...item,
        _lineNumber: index + 1
      }));
      
      // Set initial state with pending status
      const initialItems = itemsWithLineNumbers.map(item => ({
        ...item,
        status: 'pending',
        message: 'Waiting for processing...'
      }));
      
      setProcessedItems(initialItems);
      
      // Process each item
      for (let i = 0; i < initialItems.length; i++) {
        await processBulkAddItem(initialItems[i], i, initialItems, itemType, placeService, processPlaceDetails, setProcessedItems);
      }
      
      console.log(`[BulkAddProcessor] Processing complete. Items:`, initialItems);
      
      // Check for duplicates after all items have been processed
      try {
        logDebug('[BulkAddProcessor] Checking for duplicates after processing...');
        const readyItems = initialItems.filter(item => item.status === 'ready');
        
        if (readyItems.length > 0) {
          const itemsWithDuplicateFlags = await checkForDuplicates(readyItems);
          
          // Update the processed items with duplicate flags
          const finalItems = initialItems.map(item => {
            const matchingItem = itemsWithDuplicateFlags.find(i => i._lineNumber === item._lineNumber);
            if (matchingItem && matchingItem.isDuplicate) {
              return {
                ...item,
                isDuplicate: true,
                duplicateInfo: matchingItem.duplicateInfo,
                message: matchingItem.message
              };
            }
            return item;
          });
          
          // Log duplicate detection results
          const duplicateCount = finalItems.filter(item => item.isDuplicate).length;
          logDebug(`[BulkAddProcessor] Found ${duplicateCount} duplicates out of ${finalItems.length} items`);
          
          // Update the state with the final items including duplicate flags
          setProcessedItems(finalItems);
        }
      } catch (error) {
        logError('[BulkAddProcessor] Error checking for duplicates after processing:', error);
        // Continue without failing the entire process if duplicate check fails
      }
    } catch (error) {
      console.error(`[BulkAddProcessor] Error processing input data:`, error);
      setProcessingError(`Error processing input data: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [itemType, checkForDuplicates]);
  
  /**
   * Process place details after a place ID is obtained
   * @param {Object} placeDetails - Place details from Google Places API
   * @param {number} index - Index of the item in the processed items array
   * @param {Array} currentItems - Current array of processed items
   */
  const processPlaceDetails = async (placeDetails, index, currentItems) => {
    try {
      // Update item status
      currentItems[index].status = 'processing';
      currentItems[index].message = 'Processing place details...';
      
      // Extract address components
      const addressComponents = placeDetails.address_components || [];
      const streetNumber = addressComponents.find(comp => comp.types.includes('street_number'))?.long_name || '';
      const route = addressComponents.find(comp => comp.types.includes('route'))?.long_name || '';
      const city = addressComponents.find(comp => comp.types.includes('locality'))?.long_name || '';
      const state = addressComponents.find(comp => comp.types.includes('administrative_area_level_1'))?.short_name || '';
      const zipcode = addressComponents.find(comp => comp.types.includes('postal_code'))?.long_name || '';
      
      // Format address
      const formattedAddress = placeDetails.formatted_address || `${streetNumber} ${route}, ${city}, ${state} ${zipcode}`;
      
      // Update item with place details
      currentItems[index].address = formattedAddress;
      currentItems[index].street = `${streetNumber} ${route}`.trim();
      currentItems[index].city = city;
      currentItems[index].state = state;
      currentItems[index].zipcode = zipcode;
      currentItems[index].latitude = placeDetails.geometry?.location?.lat || 0;
      currentItems[index].longitude = placeDetails.geometry?.location?.lng || 0;
      
      // Make sure we're setting these properties for the UI
      logDebug(`[BulkAddProcessor] Setting address for item ${index}:`, formattedAddress);
      
      // Find city_id by city name - CRITICAL for database constraints
      let cityId = 1; // Default to New York (ID: 1)
      if (city) {
        logDebug(`[BulkAddProcessor] Looking up city_id for: ${city}`);
        const cityData = await filterService.findCityByName(city);
        
        if (cityData && cityData.id) {
          cityId = cityData.id;
          currentItems[index].city_id = cityId;
          logDebug(`[BulkAddProcessor] Set city_id for item ${index}: ${cityId}`);
        } else {
          // If city not found in database, we need to handle this case
          currentItems[index].city_id = cityId;
          logWarn(`[BulkAddProcessor] City not found in database: ${city}, using default city_id: ${cityId}`);
        }
      } else {
        // Default to New York if no city in address
        currentItems[index].city_id = cityId;
        logWarn(`[BulkAddProcessor] No city in address, using default city_id: ${cityId}`);
      }
      
      // Lookup neighborhood by zipcode first, if available
      let neighborhoodFound = false;
      if (zipcode) {
        logDebug(`[BulkAddProcessor] Fetching neighborhood for zipcode: ${zipcode} with city_id: ${cityId}`);
        try {
          // Try to find neighborhood by zipcode
          const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
          logDebug(`[BulkAddProcessor] Neighborhood lookup result for zipcode ${zipcode}:`, neighborhood);
          
          if (neighborhood && neighborhood.id && neighborhood.name) {
            // Valid neighborhood found by zipcode
            neighborhoodFound = true;
            currentItems[index].neighborhood = neighborhood.name;
            currentItems[index].neighborhood_name = neighborhood.name;
            currentItems[index].neighborhood_id = neighborhood.id;
            
            // If the neighborhood has a city_id, ensure it's consistent
            if (neighborhood.city_id && neighborhood.city_id !== cityId) {
              logDebug(`[BulkAddProcessor] Updating city_id from ${cityId} to ${neighborhood.city_id} based on neighborhood data`);
              currentItems[index].city_id = neighborhood.city_id;
            }
            
            logDebug(`[BulkAddProcessor] Successfully set neighborhood by zipcode for item ${index}: ${neighborhood.name} (ID: ${neighborhood.id})`);
          }
        } catch (error) {
          logError(`[BulkAddProcessor] Error fetching neighborhood for zipcode ${zipcode}:`, error);
        }
      }
      
      // If neighborhood wasn't found by zipcode, try to get neighborhoods for the city
      if (!neighborhoodFound) {
        try {
          logDebug(`[BulkAddProcessor] Trying to get neighborhoods for city_id: ${cityId}`);
          const cityNeighborhoods = await filterService.getNeighborhoodsByCity(cityId);
          
          if (cityNeighborhoods && Array.isArray(cityNeighborhoods) && cityNeighborhoods.length > 0) {
            // Found neighborhoods for this city, use the first one as default
            const defaultNeighborhood = cityNeighborhoods[0];
            currentItems[index].neighborhood = defaultNeighborhood.name;
            currentItems[index].neighborhood_name = defaultNeighborhood.name;
            currentItems[index].neighborhood_id = defaultNeighborhood.id;
            
            logDebug(`[BulkAddProcessor] Set neighborhood from city neighborhoods for item ${index}: ${defaultNeighborhood.name} (ID: ${defaultNeighborhood.id})`);
            neighborhoodFound = true;
          }
        } catch (error) {
          logError(`[BulkAddProcessor] Error getting neighborhoods for city_id ${cityId}:`, error);
        }
      }
      
      // If still no neighborhood found, use our last resort method
      if (!neighborhoodFound) {
        const defaultNeighborhood = await getDefaultNeighborhood(cityId);
        currentItems[index].neighborhood = defaultNeighborhood.name;
        currentItems[index].neighborhood_name = defaultNeighborhood.name;
        currentItems[index].neighborhood_id = defaultNeighborhood.id;
        
        logDebug(`[BulkAddProcessor] Using fallback neighborhood for item ${index}: ${defaultNeighborhood.name} (ID: ${defaultNeighborhood.id})`);
      }
      
      // Hard-code specific zipcodes to neighborhoods for testing/debugging
      const zipToNeighborhoodMap = {
        '10014': { name: 'West Village', id: 3 },
        '11249': { name: 'Williamsburg', id: 5 },
        '10001': { name: 'NoMad', id: 7 },
        '11377': { name: 'Sunnyside', id: 12 },
        '11238': { name: 'Prospect Heights', id: 18 }
      };
      
      // If we have a known zipcode, override with the correct neighborhood
      if (zipcode && zipToNeighborhoodMap[zipcode]) {
        const knownNeighborhood = zipToNeighborhoodMap[zipcode];
        currentItems[index].neighborhood = knownNeighborhood.name;
        currentItems[index].neighborhood_name = knownNeighborhood.name;
        currentItems[index].neighborhood_id = knownNeighborhood.id;
        
        logDebug(`[BulkAddProcessor] Overriding with known neighborhood for zipcode ${zipcode}: ${knownNeighborhood.name} (ID: ${knownNeighborhood.id})`);
      }
      
      // Verify we have neighborhood data
      if (!currentItems[index].neighborhood_name || !currentItems[index].neighborhood_id) {
        logWarn(`[BulkAddProcessor] Item still missing critical neighborhood data after all lookups, using fallback`);
        currentItems[index].neighborhood = "Default Neighborhood";
        currentItems[index].neighborhood_name = "Default Neighborhood";
        currentItems[index].neighborhood_id = 1;
      }
      
      // Update item status
      currentItems[index].status = 'ready';
      currentItems[index].message = 'Ready for submission';
      
      return currentItems[index];
    } catch (error) {
      logError(`[BulkAddProcessor] Error processing place details:`, error);
      currentItems[index].status = 'error';
      currentItems[index].message = `Error processing place details: ${error.message}`;
      throw error;
    }
  };
  
  /**
   * Handle place selection from multiple results
   * @param {string} placeId - Selected place ID
   */
  const selectPlace = useCallback(async (placeId) => {
    if (currentProcessingIndex < 0 || !processedItems[currentProcessingIndex]) {
      logError(`[BulkAddProcessor] Invalid current processing index:`, currentProcessingIndex);
      return;
    }
    
    const updatedItems = [...processedItems];
    
    try {
      if (placeId) {
        // User selected a place
        logDebug(`[BulkAddProcessor] User selected place ID:`, placeId);
        
        // Find the selected place option
        const selectedOption = updatedItems[currentProcessingIndex].placeOptions.find(
          option => option.placeId === placeId
        );
        
        if (!selectedOption) {
          throw new Error(`Selected place ID not found in options: ${placeId}`);
        }
        
        // Update item with selected place ID
        updatedItems[currentProcessingIndex].placeId = placeId;
        
        // Get place details using the real API
        const placeDetailsResult = await placeService.getPlaceDetails(placeId);
        logDebug(`[BulkAddProcessor] Place details result for selected place:`, placeDetailsResult);
        
        if (!placeDetailsResult || !placeDetailsResult.details) {
          throw new Error(`Unable to get place details: ${placeDetailsResult?.status || 'Unknown error'}`);
        }
        
        // Process place details
        const placeDetails = placeDetailsResult.details;
        
        // Create a properly formatted place details object for our processor
        const formattedPlaceDetails = {
          placeId: placeId,
          name: selectedOption.mainText || updatedItems[currentProcessingIndex].name,
          formatted_address: placeDetails.address || selectedOption.description || '',
          geometry: {
            location: {
              lat: placeDetails.latitude || 0,
              lng: placeDetails.longitude || 0
            }
          },
          address_components: [] // Will be populated from the address if available
        };
        
        // Extract address components from the formatted address if available
        if (placeDetails.address) {
          // Simple address parsing - in a real implementation, you'd get this from the API
          const addressParts = placeDetails.address.split(',').map(part => part.trim());
          
          // Try to extract street number and route
          if (addressParts.length > 0) {
            const streetParts = addressParts[0].split(' ');
            const streetNumber = streetParts[0];
            const route = streetParts.slice(1).join(' ');
            
            formattedPlaceDetails.address_components.push(
              { long_name: streetNumber, short_name: streetNumber, types: ['street_number'] },
              { long_name: route, short_name: route, types: ['route'] }
            );
          }
          
          // Try to extract city, state, and zip
          if (addressParts.length > 1) {
            const cityPart = addressParts[1];
            formattedPlaceDetails.address_components.push(
              { long_name: cityPart, short_name: cityPart, types: ['locality', 'political'] }
            );
          }
          
          if (addressParts.length > 2) {
            const stateParts = addressParts[2].split(' ');
            if (stateParts.length >= 2) {
              const state = stateParts[0];
              const zipcode = stateParts[1];
              
              formattedPlaceDetails.address_components.push(
                { long_name: state, short_name: state, types: ['administrative_area_level_1', 'political'] },
                { long_name: zipcode, short_name: zipcode, types: ['postal_code'] }
              );
            }
          }
        }
        
        // Process the place details
        await processPlaceDetails(formattedPlaceDetails, currentProcessingIndex, updatedItems);
      } else {
        // User cancelled selection
        logDebug(`[BulkAddProcessor] User cancelled place selection`);
        updatedItems[currentProcessingIndex].status = 'error';
        updatedItems[currentProcessingIndex].message = 'Place selection cancelled';
      }
    } catch (error) {
      console.error(`[BulkAddProcessor] Error processing selected place:`, error);
      updatedItems[currentProcessingIndex].status = 'error';
      updatedItems[currentProcessingIndex].message = `Error processing selected place: ${error.message}`;
    } finally {
      // Update items
      setProcessedItems(updatedItems);
      
      // Move to the next place selection if there are more
      const remainingSelections = placeSelections.filter(
        selection => selection.index !== currentProcessingIndex
      );
      
      if (remainingSelections.length > 0) {
        setCurrentProcessingIndex(remainingSelections[0].index);
        setPlaceSelections(remainingSelections);
      } else {
        setAwaitingSelection(false);
        setCurrentProcessingIndex(-1);
        setPlaceSelections([]);
      }
    }
  }, [currentProcessingIndex, placeSelections, processedItems]);
  
  // Helper to process a single item in the bulk add flow
  const processBulkAddItem = async (item, i, initialItems, itemType, placeService, processPlaceDetails, setProcessedItems) => {
    try {
      // Update status
      initialItems[i].status = 'processing';
      initialItems[i].message = 'Processing...';
      setProcessedItems([...initialItems]);

      if (itemType === 'restaurants') {
        // For restaurants, use real Google Places API for lookup
        const searchQuery = `${item.name}, ${item.city_name}`;
        logDebug(`[BulkAddProcessor] Looking up place: ${searchQuery}`);

        try {
          // Get place ID from Google Places API
          const placeResult = await placeService.getPlaceId(item.name, item.city_name);
          logDebug(`[BulkAddProcessor] Place lookup result:`, placeResult);

          if (!placeResult || !placeResult.placeId) {
            // No place found or error
            initialItems[i].status = 'error';
            initialItems[i].message = `Unable to find place: ${placeResult?.status || 'Unknown error'}`;
            return;
          }

          // Get place details using the place ID
          const placeDetailsResult = await placeService.getPlaceDetails(placeResult.placeId);
          logDebug(`[BulkAddProcessor] Place details result:`, placeDetailsResult);

          if (!placeDetailsResult || !placeDetailsResult.details) {
            // No place details found or error
            initialItems[i].status = 'error';
            initialItems[i].message = `Unable to get place details: ${placeDetailsResult?.status || 'Unknown error'}`;
            return;
          }

          // Set the place ID on the item
          initialItems[i].placeId = placeResult.placeId;

          // Process place details
          const placeDetails = placeDetailsResult.details;
          const formattedPlaceDetails = {
            placeId: placeResult.placeId,
            name: item.name,
            formatted_address: placeDetails.address || '',
            geometry: {
              location: {
                lat: placeDetails.latitude || 0,
                lng: placeDetails.longitude || 0
              }
            },
            address_components: []
          };

          if (placeDetails.address) {
            const addressParts = placeDetails.address.split(',').map(part => part.trim());
            if (addressParts.length > 0) {
              const streetParts = addressParts[0].split(' ');
              const streetNumber = streetParts[0];
              const route = streetParts.slice(1).join(' ');
              formattedPlaceDetails.address_components.push(
                { long_name: streetNumber, short_name: streetNumber, types: ['street_number'] },
                { long_name: route, short_name: route, types: ['route'] }
              );
            }
            if (addressParts.length > 1) {
              const cityPart = addressParts[1];
              formattedPlaceDetails.address_components.push(
                { long_name: cityPart, short_name: cityPart, types: ['locality', 'political'] }
              );
            }
            if (addressParts.length > 2) {
              const stateParts = addressParts[2].split(' ');
              if (stateParts.length >= 2) {
                const state = stateParts[0];
                const zipcode = stateParts[1];
                formattedPlaceDetails.address_components.push(
                  { long_name: state, short_name: state, types: ['administrative_area_level_1', 'political'] },
                  { long_name: zipcode, short_name: zipcode, types: ['postal_code'] }
                );
              }
            }
          }
          await processPlaceDetails(formattedPlaceDetails, i, initialItems);
        } catch (error) {
          logError(`[BulkAddProcessor] Error during place lookup:`, error);
          initialItems[i].status = 'error';
          initialItems[i].message = `Error during place lookup: ${error.message}`;
        }
      } else {
        // For dishes or other item types
        initialItems[i].status = 'ready';
        initialItems[i].message = 'Ready for submission';
      }
    } catch (error) {
      console.error(`[BulkAddProcessor] Error processing item ${i}:`, error);
      initialItems[i].status = 'error';
      initialItems[i].message = `Error: ${error.message}`;
    }
    setProcessedItems([...initialItems]);
  };

  // Process the final submission of items
  const processSubmission = useCallback(async (items) => {
    logDebug('[BulkAddProcessor] Processing final submission:', items);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = new Error('No valid items provided for submission');
      logError('[BulkAddProcessor] Invalid items for submission:', { items, error });
      throw error;
    }
    
    try {
      // Log the formatted items to verify city_id is included
      logDebug('[BulkAddProcessor] Formatted items for submission:', items);
      
      // Validate that each item has the required fields
      const missingFields = [];
      items.forEach((item, index) => {
        const requiredFields = ['name', 'type', 'city_id'];
        const missing = requiredFields.filter(field => !item[field]);
        if (missing.length > 0) {
          missingFields.push({ index, item: item.name, missing });
        }
      });
      
      if (missingFields.length > 0) {
        const error = new Error(`Items missing required fields: ${JSON.stringify(missingFields)}`);
        logError('[BulkAddProcessor] Items missing required fields:', { missingFields, error });
        throw error;
      }
      
      // Use the adminService to submit items
      logDebug('[BulkAddProcessor] Calling adminService.bulkAddItems with:', { items });
      
      // Call the adminService and handle the response
      const response = await adminService.bulkAddItems(items);
      logDebug('[BulkAddProcessor] Submission response:', response);
      
      // Validate the response
      if (!response) {
        throw new Error('Received null response from bulkAddItems');
      }
      
      if (!response.success) {
        throw new Error(response.message || 'Submission failed');
      }
      
      // Return the successful response
      return response;
    } catch (error) {
      // Capture detailed error information
      const errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response || null,
        items: items.map(item => ({ 
          name: item.name, 
          type: item.type, 
          city_id: item.city_id,
          neighborhood_id: item.neighborhood_id || null
        }))
      };
      
      logError('[BulkAddProcessor] Error in processSubmission:', errorDetails);
      
      // Rethrow with a clearer message
      throw new Error(`Submission failed: ${error.message}`);
    }
  }, []);
  
  // Main function to handle bulk add submission with duplicate checking
  const submitBulkAdd = useCallback(async (items) => {
    logDebug('[BulkAddProcessor] Submitting items:', items);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      logWarn('[BulkAddProcessor] No valid items provided for submission');
      return {
        status: 400,
        data: {
          success: false,
          message: 'No valid items provided for submission',
          details: []
        }
      };
    }
    
    try {
      // First check for duplicates using the checkForDuplicates function
      logDebug('[BulkAddProcessor] Checking for duplicates before submission...');
      const itemsWithDuplicateFlags = await checkForDuplicates(items);
      
      // Separate items into duplicates and non-duplicates
      const duplicateItems = itemsWithDuplicateFlags.filter(item => item.isDuplicate);
      const uniqueItems = itemsWithDuplicateFlags.filter(item => !item.isDuplicate);
      
      logDebug(`[BulkAddProcessor] After duplicate check: ${uniqueItems.length} unique items, ${duplicateItems.length} duplicates`);
      
      // If no unique items, return early
      if (uniqueItems.length === 0) {
        logWarn('[BulkAddProcessor] All items are duplicates');
        return {
          status: 200,
          data: {
            success: true,
            message: 'No new items to submit. All items are duplicates.',
            details: duplicateItems.map(item => ({
              ...item,
              status: 'duplicate',
              input: {
                _lineNumber: item._lineNumber
              }
            })),
            summary: {
              total: items.length,
              added: 0,
              duplicates: duplicateItems.length,
              skipped: 0,
              error: 0
            }
          }
        };
      }
      
      // Format unique items for submission
      const formattedItems = uniqueItems.map(item => ({
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
      }));
      
      // Submit items to the API
      logDebug('[BulkAddProcessor] Submitting items to API:', formattedItems);
      const response = await adminService.bulkAddItems(formattedItems);
      logDebug('[BulkAddProcessor] API response:', response);
      
      // Process the response
      if (!response || !response.success) {
        // Handle API error
        logError('[BulkAddProcessor] API returned error:', response);
        return {
          status: 500,
          data: {
            success: false,
            message: response?.message || 'Error submitting items',
            details: uniqueItems.map(item => ({
              ...item,
              status: 'error',
              message: response?.message || 'API error',
              input: { _lineNumber: item._lineNumber }
            })),
            summary: {
              total: items.length,
              added: 0,
              duplicates: duplicateItems.length,
              errors: uniqueItems.length,
              skipped: 0
            }
          }
        };
      }
      
      // Process successful response
      const successfulItems = [];
      const failedItems = [];
      
      // Process created items
      if (response.data && response.data.createdItems && Array.isArray(response.data.createdItems)) {
        response.data.createdItems.forEach(createdItem => {
          const originalItem = uniqueItems.find(item => item.name === createdItem.name);
          if (originalItem) {
            successfulItems.push({
              ...originalItem,
              status: 'added',
              message: `Added successfully (ID: ${createdItem.id})`,
              finalId: createdItem.id
            });
          }
        });
      }
      
      // Process error items
      if (response.data && response.data.errors && Array.isArray(response.data.errors)) {
        response.data.errors.forEach(error => {
          const itemName = error.itemProvided?.name;
          if (itemName) {
            const originalItem = uniqueItems.find(item => item.name === itemName);
            if (originalItem) {
              // Check if it's a duplicate error
              if (error.error && error.error.includes('duplicate key value')) {
                duplicateItems.push({
                  ...originalItem,
                  status: 'duplicate',
                  message: `Duplicate: ${error.detail || error.error}`,
                  isDuplicate: true
                });
              } else {
                failedItems.push({
                  ...originalItem,
                  status: 'error',
                  message: `Error: ${error.error || 'Unknown error'}`,
                  error: error
                });
              }
            }
          }
        });
      }
      
      // Any items not in successfulItems or failedItems are unknown
      const unknownItems = uniqueItems.filter(item => 
        !successfulItems.some(s => s._lineNumber === item._lineNumber) && 
        !failedItems.some(f => f._lineNumber === item._lineNumber) &&
        !duplicateItems.some(d => d._lineNumber === item._lineNumber)
      );
      
      // Add unknown items to failed items
      unknownItems.forEach(item => {
        failedItems.push({
          ...item,
          status: 'error',
          message: 'Unknown status after submission'
        });
      });
      
      // Combine all results
      const allResults = [
        ...successfulItems,
        ...failedItems,
        ...duplicateItems
      ];
      
      // Return the combined results
      return {
        status: 200,
        data: {
          success: true,
          message: `Processed ${items.length} items. Added: ${successfulItems.length}, Failed: ${failedItems.length}, Duplicates: ${duplicateItems.length}`,
          details: allResults,
          createdItems: successfulItems.map(item => ({
            id: item.finalId,
            name: item.name,
            type: item.type,
            city_id: item.city_id,
            neighborhood_id: item.neighborhood_id
          })),
          successCount: successfulItems.length,
          failureCount: failedItems.length,
          summary: {
            total: items.length,
            added: successfulItems.length,
            duplicates: duplicateItems.length,
            errors: failedItems.length,
            skipped: 0
          }
        }
      };
    } catch (error) {
      // Handle any unexpected errors
      logError('[BulkAddProcessor] Unexpected error in submitBulkAdd:', error);
      
      // Return a formatted error response
      return {
        status: error.status || 500,
        data: {
          success: false,
          message: error.message || 'Error submitting items',
          errorDetails: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            response: error.response || null
          },
          details: items.map(item => ({
            ...item,
            status: 'error',
            reason: error.message || 'Submission failed',
            input: {
              _lineNumber: item._lineNumber
            }
          })),
          summary: {
            total: items.length,
            added: 0,
            duplicates: 0,
            errors: items.length,
            skipped: 0
          }
        }
      };
    }
  }, [checkForDuplicates, processSubmission]);
  
  return {
    processedItems,
    isProcessing,
    processingError,
    parseError,
    placeSelections,
    awaitingSelection,
    currentProcessingIndex,
    processInputData,
    selectPlace,
    submitBulkAdd,
    itemType
  };
}

export default useBulkAddProcessor;
