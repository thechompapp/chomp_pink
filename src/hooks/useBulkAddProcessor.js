// Filename: root/src/hooks/useBulkAddProcessor.js
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { placeService } from '@/services/placeService.js';
import { filterService } from '@/services/filterService.js';
import { adminService } from '@/services/adminService.js';
import { logDebug, logError, logWarn } from '@/utils/logger.js';

console.log('[BulkAdd/index.jsx] Loaded version with setError defined and timeout');

// Helper function to fetch neighborhood by zipcode using the real API
const fetchNeighborhoodByZipcode = async (zipcode) => {
  try {
    logDebug(`[BulkAddProcessor] Looking up neighborhood for zipcode: ${zipcode}`);
    
    // Use the real API call from filterService
    const response = await filterService.findNeighborhoodByZipcode(zipcode);
    logDebug(`[BulkAddProcessor] Neighborhood lookup response:`, response);
    
    return response;
  } catch (error) {
    logError(`[BulkAddProcessor] Error fetching neighborhood for zipcode ${zipcode}:`, error);
    return null;
  }
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
    
    try {
      // Format items for duplicate check
      const formattedItems = items.map(item => ({
        name: item.name,
        type: item.type,
        city_id: item.city_id,
        place_id: item.placeId,
        _lineNumber: item._lineNumber
      }));
      
      // Use the adminService to check for existing items
      const response = await adminService.checkExistingItems('restaurants', { items: formattedItems });
      logDebug('[BulkAddProcessor] Duplicate check response:', response);
      
      if (!response || !response.success) {
        logWarn('[BulkAddProcessor] Duplicate check failed:', response?.message || 'Unknown error');
        return items; // Continue with submission if duplicate check fails
      }
      
      // Process the response and mark duplicates
      const duplicateResults = response.data || [];
      const itemsWithDuplicateFlags = items.map(item => {
        const duplicateResult = duplicateResults.find(result => 
          result.item._lineNumber === item._lineNumber);
        
        if (duplicateResult && duplicateResult.existing) {
          // Mark as duplicate
          return {
            ...item,
            isDuplicate: true,
            duplicateInfo: {
              id: duplicateResult.existing.id,
              name: duplicateResult.existing.name,
              message: `Duplicate of existing restaurant with ID ${duplicateResult.existing.id}`
            },
            status: 'warning',
            message: `Duplicate of existing restaurant: ${duplicateResult.existing.name} (ID: ${duplicateResult.existing.id})`
          };
        }
        
        return item;
      });
      
      // Log duplicate detection results
      const duplicateCount = itemsWithDuplicateFlags.filter(item => item.isDuplicate).length;
      logDebug(`[BulkAddProcessor] Found ${duplicateCount} duplicates out of ${items.length} items`);
      
      return itemsWithDuplicateFlags;
    } catch (error) {
      logError('[BulkAddProcessor] Error checking for duplicates:', error);
      return items; // Continue with submission if duplicate check fails
    }
  }, []);

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
        const item = initialItems[i];
        
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
                continue;
              }
              
              // Get place details using the place ID
              const placeDetailsResult = await placeService.getPlaceDetails(placeResult.placeId);
              logDebug(`[BulkAddProcessor] Place details result:`, placeDetailsResult);
              
              if (!placeDetailsResult || !placeDetailsResult.details) {
                // No place details found or error
                initialItems[i].status = 'error';
                initialItems[i].message = `Unable to get place details: ${placeDetailsResult?.status || 'Unknown error'}`;
                continue;
              }
              
              // Set the place ID on the item
              initialItems[i].placeId = placeResult.placeId;
              
              // Process place details
              const placeDetails = placeDetailsResult.details;
              
              // Create a properly formatted place details object for our processor
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
        
        // Update items after each processing
        setProcessedItems([...initialItems]);
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
      if (city) {
        logDebug(`[BulkAddProcessor] Looking up city_id for: ${city}`);
        const cityData = await filterService.findCityByName(city);
        
        if (cityData && cityData.id) {
          currentItems[index].city_id = cityData.id;
          logDebug(`[BulkAddProcessor] Set city_id for item ${index}: ${cityData.id}`);
        } else {
          // If city not found in database, we need to handle this case
          // For now, default to New York (ID: 1) if no city found
          currentItems[index].city_id = 1; // Default to New York
          logWarn(`[BulkAddProcessor] City not found in database: ${city}, using default city_id: 1`);
        }
      } else {
        // Default to New York if no city in address
        currentItems[index].city_id = 1;
        logWarn(`[BulkAddProcessor] No city in address, using default city_id: 1`);
      }
      
      // Fetch neighborhood by zipcode
      if (zipcode) {
        logDebug(`[BulkAddProcessor] Fetching neighborhood for zipcode: ${zipcode}`);
        const neighborhood = await fetchNeighborhoodByZipcode(zipcode);
        logDebug(`[BulkAddProcessor] Neighborhood lookup result:`, neighborhood);
        
        if (neighborhood) {
          // Set both neighborhood and neighborhood_name for compatibility
          currentItems[index].neighborhood = neighborhood.name;
          currentItems[index].neighborhood_name = neighborhood.name;
          currentItems[index].neighborhood_id = neighborhood.id;
          logDebug(`[BulkAddProcessor] Set neighborhood for item ${index}:`, neighborhood.name);
        } else {
          // If no neighborhood found, use a default one based on the city
          const defaultNeighborhood = {
            id: 999,
            name: city ? `${city} Area` : 'Unknown Area',
            borough: city || 'Unknown',
            city: city || 'New York'
          };
          // Set both neighborhood and neighborhood_name for compatibility
          currentItems[index].neighborhood = defaultNeighborhood.name;
          currentItems[index].neighborhood_name = defaultNeighborhood.name;
          currentItems[index].neighborhood_id = defaultNeighborhood.id;
          logDebug(`[BulkAddProcessor] Set default neighborhood for item ${index}:`, defaultNeighborhood.name);
        }
      } else {
        // If no zipcode, use a default neighborhood
        const defaultNeighborhood = {
          id: 999,
          name: city ? `${city} Area` : 'Unknown Area',
          borough: city || 'Unknown',
          city: city || 'New York'
        };
        // Set both neighborhood and neighborhood_name for compatibility
        currentItems[index].neighborhood = defaultNeighborhood.name;
        currentItems[index].neighborhood_name = defaultNeighborhood.name;
        currentItems[index].neighborhood_id = defaultNeighborhood.id;
        logDebug(`[BulkAddProcessor] No zipcode, set default neighborhood for item ${index}:`, defaultNeighborhood.name);
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
  
  // We already have a processPlaceDetails function defined earlier in the file

  // Process the final submission of items
  const processSubmission = useCallback(async (items) => {
    logDebug('[BulkAddProcessor] Processing final submission:', items);
    
    try {
      // Log the formatted items to verify city_id is included
      logDebug('[BulkAddProcessor] Formatted items for submission:', items);
      
      // Use the adminService to submit items
      const response = await adminService.bulkAddItems({ items });
      logDebug('[BulkAddProcessor] Submission response:', response);
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Submission failed');
      }
      
      return response;
    } catch (error) {
      logError('[BulkAddProcessor] Error in processSubmission:', error);
      throw error;
    }
  }, []);
  
  // Main function to handle bulk add submission with duplicate checking
  const submitBulkAdd = useCallback(async (items) => {
    logDebug('[BulkAddProcessor] Submitting items:', items);
    
    try {
      // First check for duplicates
      const itemsWithDuplicateFlags = await checkForDuplicates(items);
      
      // Filter out items marked as duplicates unless they're explicitly marked for submission
      const itemsToSubmit = itemsWithDuplicateFlags.filter(item => 
        !item.isDuplicate || item.forceSubmit);
      
      // If all items are duplicates and none are forced to submit, return early
      if (itemsToSubmit.length === 0) {
        logWarn('[BulkAddProcessor] All items are duplicates and none are marked for forced submission');
        return {
          status: 200,
          data: {
            success: true,
            message: 'No new items to submit. All items are duplicates.',
            details: itemsWithDuplicateFlags.map(item => ({
              ...item,
              status: item.isDuplicate ? 'duplicate' : 'skipped',
              input: {
                _lineNumber: item._lineNumber
              }
            }))
          }
        };
      }
      
      // Format items for submission
      const formattedItems = itemsToSubmit.map(item => ({
        name: item.name,
        type: item.type,
        address: item.address,
        city: item.city,
        state: item.state,
        zipcode: item.zipcode,
        city_id: item.city_id, // Include city_id which is required by the database
        neighborhood_id: item.neighborhood_id,
        latitude: item.latitude,
        longitude: item.longitude,
        tags: item.tags || [],
        place_id: item.placeId,
        _lineNumber: item._lineNumber // Keep for tracking
      }));
      
      // Submit the formatted items
      const response = await processSubmission(formattedItems);
      
      // Combine the results with the duplicate flags
      const allResults = itemsWithDuplicateFlags.map(item => {
        if (item.isDuplicate && !item.forceSubmit) {
          return {
            ...item,
            status: 'duplicate',
            message: item.message || `Duplicate of existing restaurant (ID: ${item.duplicateInfo?.id || 'unknown'})`
          };
        }
        
        // For submitted items, use the response data
        const submittedItem = response.data?.createdItems?.find(created => 
          created.name === item.name) || null;
        
        if (submittedItem) {
          return {
            ...item,
            status: 'added',
            message: `Added successfully (ID: ${submittedItem.id})`,
            finalId: submittedItem.id
          };
        }
        
        // Default case for items that weren't duplicates but weren't in the response
        return {
          ...item,
          status: 'unknown',
          message: 'Status unknown after submission'
        };
      });
      
      return {
        status: 200,
        data: {
          success: true,
          message: response.message || `Processed ${itemsToSubmit.length} items`,
          details: allResults,
          summary: {
            total: itemsWithDuplicateFlags.length,
            added: response.data?.successCount || 0,
            duplicates: itemsWithDuplicateFlags.filter(item => item.isDuplicate && !item.forceSubmit).length,
            skipped: 0,
            error: response.data?.failureCount || 0
          }
        }
      };
    } catch (error) {
      logError('[BulkAddProcessor] Error submitting items:', error);
      
      // Return a formatted error response
      return {
        status: error.status || 500,
        data: {
          success: false,
          message: error.message || 'Error submitting items',
          details: items.map(item => ({
            ...item,
            status: 'error',
            reason: error.message || 'Submission failed',
            input: {
              _lineNumber: item._lineNumber
            }
          }))
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
