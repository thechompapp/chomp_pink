// Filename: root/src/hooks/useBulkAddProcessor.js
import { useState, useCallback, useEffect } from 'react';
import { adminService } from '@/services/adminService'; // Updated to named import
import { placeService } from '@/services/placeService'; // For Google Places API integration
import { filterService } from '@/services/filterService'; // For neighborhood lookup by zipcode
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse'; // Confirmed correct import

// --- START: Helper to identify required fields ---
const getRequiredFields = (itemType) => {
	switch (itemType) {
		case 'restaurants':
			// For bulk add format like "Thai Villa; restaurant; New York; Thai"
			// We only need name and city_name as required fields
			return ['name', 'city_name']; 
		case 'dishes':
			return ['name', 'restaurant_name']; 
		default:
			return [];
	}
};
// --- END: Helper ---

// --- START: Helper to match items with lookup results ---
// This is a basic example, might need refinement based on data structure
const findMatchingItem = (item, lookupMap, lookupKey) => {
    const key = item[lookupKey]?.toLowerCase();
    return key ? lookupMap.get(key) : null;
};
// --- END: Helper ---

// Helper function to fetch neighborhood by zipcode
const fetchNeighborhoodByZipcode = async (zipcode) => {
	try {
		console.log(`[BulkAddProcessor] Looking up neighborhood for zipcode: ${zipcode}`);
		const response = await filterService.getNeighborhoodsByZipcode(zipcode);
		console.log(`[BulkAddProcessor] Neighborhood lookup response:`, response);
		
		if (response && Array.isArray(response) && response.length > 0) {
			// Return the first neighborhood found
			return response[0];
		}
		return null;
	} catch (error) {
		console.error(`[BulkAddProcessor] Error fetching neighborhood for zipcode ${zipcode}:`, error);
		return null;
	}
};

function useBulkAddProcessor(itemType = 'restaurants') { // Default to restaurants if not specified
	const [items, setItems] = useState([]); // Processed items ready for review/submit
	const [errors, setErrors] = useState([]); // Errors found during processing
	const [duplicates, setDuplicates] = useState([]); // Items identified as potential duplicates
	const [isProcessing, setIsProcessing] = useState(false);
	const [parseError, setParseError] = useState(null);
	const [submitStatus, setSubmitStatus] = useState({ state: 'idle', message: '' }); // idle, submitting, success, error
	const queryClient = useQueryClient();
	
	// State for handling multiple place results
	const [placeSelections, setPlaceSelections] = useState([]); // Array of items with multiple place options
	const [awaitingSelection, setAwaitingSelection] = useState(false); // Whether we're waiting for user to select a place
	const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1); // Index of the item currently awaiting selection

	const resetState = useCallback(() => {
		setItems([]);
		setErrors([]);
		setDuplicates([]);
		setIsProcessing(false);
		setParseError(null);
		setSubmitStatus({ state: 'idle', message: '' });
		
		// Reset place selection state
		setPlaceSelections([]);
		setAwaitingSelection(false);
		setCurrentProcessingIndex(-1);
	}, []);

	// Function to process place details after a place ID is obtained
	const processPlaceDetails = useCallback(async (placeId, index, currentItems) => {
		console.log(`[BulkAddProcessor] Processing place details for place ID: ${placeId} at index ${index}`);
		
		try {
			// Make sure we're working with the latest items array
			const updatedItems = currentItems || [...processedItems];
			
			// Update item status to processing
			updatedItems[index].status = 'processing';
			updatedItems[index].message = 'Fetching place details...';
			setItems([...updatedItems]);
			
			// Fetch place details
			const placeDetails = await placeService.getPlaceDetails(placeId);
			console.log('[BulkAddProcessor] Place details:', placeDetails);
			
			if (!placeDetails) {
				throw new Error('Failed to fetch place details');
			}
			
			// Extract address components
			const addressComponents = placeDetails.address_components || [];
			const streetNumber = addressComponents.find(comp => comp.types.includes('street_number'))?.long_name || '';
			const route = addressComponents.find(comp => comp.types.includes('route'))?.long_name || '';
			const city = addressComponents.find(comp => comp.types.includes('locality'))?.long_name || 
				addressComponents.find(comp => comp.types.includes('administrative_area_level_1'))?.long_name || '';
			const state = addressComponents.find(comp => comp.types.includes('administrative_area_level_1'))?.short_name || '';
			const zipcode = addressComponents.find(comp => comp.types.includes('postal_code'))?.long_name || '';
			
			// Format address
			const formattedAddress = placeDetails.formatted_address || `${streetNumber} ${route}, ${city}, ${state} ${zipcode}`;
			
			// Update item with place details
			updatedItems[index].place_id = placeId;
			updatedItems[index].address = formattedAddress;
			updatedItems[index].street = `${streetNumber} ${route}`.trim();
			updatedItems[index].city = city;
			updatedItems[index].state = state;
			updatedItems[index].zipcode = zipcode;
			updatedItems[index].latitude = placeDetails.geometry?.location?.lat || 0;
			updatedItems[index].longitude = placeDetails.geometry?.location?.lng || 0;
			
			// Fetch neighborhood by zipcode
			if (zipcode) {
				updatedItems[index].message = 'Fetching neighborhood...';
				setItems([...updatedItems]);
				
				try {
					const neighborhood = await fetchNeighborhoodByZipcode(zipcode);
					updatedItems[index].neighborhood = neighborhood;
					
					if (!neighborhood) {
						updatedItems[index].status = 'warning';
						updatedItems[index].message = 'Place details found, but no neighborhood assigned';
					} else {
						updatedItems[index].status = 'processed';
						updatedItems[index].message = 'Successfully processed';
					}
				} catch (neighborhoodError) {
					console.error('[BulkAddProcessor] Error fetching neighborhood:', neighborhoodError);
					updatedItems[index].status = 'warning';
					updatedItems[index].message = `Place details found, but neighborhood lookup failed: ${neighborhoodError.message}`;
				}
			} else {
				updatedItems[index].status = 'warning';
				updatedItems[index].message = 'Place details found, but no zipcode to lookup neighborhood';
			}
			
			setItems([...updatedItems]);
			return updatedItems[index];
		} catch (error) {
			console.error('[BulkAddProcessor] Error processing place details:', error);
			
			// Make sure we're working with the latest items array
			const updatedItems = currentItems || [...processedItems];
			
			updatedItems[index].status = 'error';
			updatedItems[index].message = `Error: ${error.message}`;
			setItems([...updatedItems]);
			return updatedItems[index];
		}
	}, [fetchNeighborhoodByZipcode]);

	// Function to handle user selection of place when multiple results are found
	const selectPlace = useCallback(async (placeId) => {
		// Handle cancellation case
		if (placeId === null) {
			console.log('[BulkAddProcessor] Place selection cancelled');
			
			// Update the item status to cancelled if valid
			if (awaitingSelection && currentProcessingIndex >= 0 && currentProcessingIndex < processedItems.length) {
				const updatedItems = [...processedItems];
				updatedItems[currentProcessingIndex].status = 'error';
				updatedItems[currentProcessingIndex].message = 'Place selection cancelled';
				setItems(updatedItems);
			}
			
			// Move to the next place selection if there are more
			if (placeSelections && placeSelections.length > 1) {
				const nextSelection = placeSelections[1];
				setCurrentProcessingIndex(nextSelection.index);
				setPlaceSelections(placeSelections.slice(1));
			} else {
				// No more selections needed
				setAwaitingSelection(false);
				setCurrentProcessingIndex(-1);
				setPlaceSelections([]);
			}
			return;
		}
		
		// Validate parameters
		if (!placeId || !awaitingSelection || currentProcessingIndex < 0 || currentProcessingIndex >= processedItems.length) {
			console.warn('[BulkAddProcessor] Cannot select place: Invalid state or parameters');
			setAwaitingSelection(false); // Reset state to prevent UI getting stuck
			return;
		}
		
		console.log(`[BulkAddProcessor] Selected place ID: ${placeId} for item ${currentProcessingIndex}`);
		
		try {
			// Update item status to show processing
			const updatedItems = [...processedItems];
			
			updatedItems[currentProcessingIndex].status = 'processing';
			updatedItems[currentProcessingIndex].message = 'Processing selected place...';
			setItems(updatedItems);
			
			// Process place details for the selected place
			await processPlaceDetails(placeId, currentProcessingIndex, updatedItems);
			
			// Move to the next place selection if there are more
			if (placeSelections && placeSelections.length > 1) {
				const nextSelection = placeSelections[1];
				setCurrentProcessingIndex(nextSelection.index);
				setPlaceSelections(placeSelections.slice(1));
			} else {
				// No more selections needed
				setAwaitingSelection(false);
				setCurrentProcessingIndex(-1);
				setPlaceSelections([]);
			}
		} catch (error) {
			console.error(`[BulkAddProcessor] Error processing selected place:`, error);
			
			// Update the item status to error
			const updatedItems = [...processedItems];
			updatedItems[currentProcessingIndex].status = 'error';
			updatedItems[currentProcessingIndex].message = `Error processing selected place: ${error.message}`;
			setItems(updatedItems);
			
			// Move to the next place selection if there are more
			if (placeSelections && placeSelections.length > 1) {
				const nextSelection = placeSelections[1];
				setCurrentProcessingIndex(nextSelection.index);
				setPlaceSelections(placeSelections.slice(1));
			} else {
				// No more selections needed
				setAwaitingSelection(false);
				setCurrentProcessingIndex(-1);
				setPlaceSelections([]);
			}
		}
	}, [items, placeSelections, awaitingSelection, currentProcessingIndex, processPlaceDetails]);

	// Fetch existing data needed for validation/lookups (e.g., neighborhoods, restaurants)
	// --- START: Modified Pre-computation ---
	const [lookupData, setLookupData] = useState({
		neighborhoods: new Map(), // Stores neighborhood name -> neighborhood object (or just name)
		restaurants: new Map(), // Stores restaurant name -> restaurant object (or just name/id)
		existingItems: new Set(), // Stores identifiers ("name|address" or "name|restaurant_id") of existing items
	});
	const [isPrecomputing, setIsPrecomputing] = useState(false);

	// Pre-fetch neighborhoods and potentially restaurants if needed for dish adding
	useEffect(() => {
        const precomputeLookups = async () => {
            setIsPrecomputing(true);
            try {
                const [neighborhoodData] = await Promise.all([
                    adminService.getAdminNeighborhoods(), // Updated to existing method
                    // Add adminService.getAdminRestaurants() here if adding dishes
                ]);

                const neighborhoodMap = new Map(
                    neighborhoodData.map(n => [n.name.toLowerCase(), n]) // Store full object or just ID if preferred
                );
                setLookupData(prev => ({ ...prev, neighborhoods: neighborhoodMap }));

                // Pre-fetch existing restaurant/dish names + identifiers for duplicate check
                // This reduces load during processing, but might fetch a lot upfront
                // Consider fetching only relevant items based on input if possible
                // OR rely purely on the efficient lookup check during processInputData
                // For now, we'll primarily rely on the dedicated lookup during processInputData

            } catch (error) {
                console.error("Error precomputing lookups:", error);
                // Handle error appropriately, maybe set an error state
            } finally {
                setIsPrecomputing(false);
            }
        };

        // precomputeLookups(); // Uncomment if upfront fetching is desired, otherwise lookup happens during processing
		// Reset state when itemType changes
		resetState();

	}, [itemType, resetState]); // Added resetState dependency

	// --- END: Modified Pre-computation ---

	const validateItem = useCallback((item, index, allItems, itemType, currentLookupData) => {
		const itemErrors = [];
		const requiredFields = getRequiredFields(itemType);

		// 1. Check for missing required fields
		requiredFields.forEach(field => {
			if (!item[field] || String(item[field]).trim() === '') {
				itemErrors.push(`Missing required field: ${field}`);
			}
		});

		// 2. Specific validations (can be expanded)
		if (itemType === 'restaurants') {
			// Example: Check if neighborhood exists (using pre-fetched data for speed)
			// This check now complements the backend pre-check for user feedback
			if (item.neighborhood && !currentLookupData.neighborhoods.has(item.neighborhood.toLowerCase())) {
				itemErrors.push(`Neighborhood '${item.neighborhood}' not found. Please add it first via Admin Panel.`);
			}
			// Could add checks for lat/lon format if they are manually entered
		} else if (itemType === 'dishes') {
			// Example: Check if restaurant exists (if restaurant data was pre-fetched)
			// if (item.restaurant_name && !currentLookupData.restaurants.has(item.restaurant_name.toLowerCase())) {
			//     itemErrors.push(`Restaurant '${item.restaurant_name}' not found.`);
			// }
		}

		// Add more validation rules as needed (e.g., URL format, data types)

		return itemErrors.length > 0 ? { index, errors: itemErrors, itemData: item } : null;
	}, []); // Removed lookupData dependency, pass it explicitly if needed or rely on closure

	// --- START: Modified checkDuplicate function ---
	/**
	 * Checks for duplicates within the *input data itself* and against *known existing items*.
	 * @param {object} item - The item to check.
	 * @param {number} index - The index of the item in the input array.
	 * @param {array} allItems - All items currently being processed.
	 * @param {string} itemType - 'restaurants' or 'dishes'.
	 * @param {Set<string>} existingItemIdentifiers - Set of identifiers ("name|address" or "name|restaurant_id") from backend lookup.
	 * @returns {object|null} - Duplicate info object or null.
	 */
	const checkDuplicate = useCallback((item, index, allItems, itemType, existingItemIdentifiers) => {
        let identifier = '';
        let duplicateSource = ''; // 'input' or 'database'

        // Define how to identify duplicates
        if (itemType === 'restaurants') {
            // Check based on name AND address (case-insensitive)
            identifier = `${item.name?.toLowerCase()}|${item.address?.toLowerCase()}`;
        } else if (itemType === 'dishes') {
            // Check based on name AND restaurant name (case-insensitive)
            // Need restaurant ID eventually, but check name first from input
            identifier = `${item.name?.toLowerCase()}|${item.restaurant_name?.toLowerCase()}`;
            // This might require refinement if restaurant_id is available/used earlier
        } else {
            return null; // Should not happen
        }

		if (!item.name) return null; // Cannot check duplicate without a name

        // Check against known existing items from backend
        if (existingItemIdentifiers.has(identifier)) {
            duplicateSource = 'database';
        } else {
             // Check for duplicates within the current input batch (excluding self)
            const inputDuplicateIndex = allItems.findIndex((otherItem, otherIndex) => {
                if (index === otherIndex) return false;
                let otherIdentifier = '';
                 if (itemType === 'restaurants') {
                     otherIdentifier = `${otherItem.name?.toLowerCase()}|${otherItem.address?.toLowerCase()}`;
                 } else if (itemType === 'dishes') {
                     otherIdentifier = `${otherItem.name?.toLowerCase()}|${otherItem.restaurant_name?.toLowerCase()}`;
                 }
                return identifier === otherIdentifier;
            });

            if (inputDuplicateIndex !== -1 && inputDuplicateIndex < index) { // Only flag first occurrence
                 duplicateSource = 'input';
            }
        }

        if (duplicateSource) {
			// Potential source of the "'id' of undefined" error could be here IF we were
            // trying to access properties of a non-existent item or an item missing expected fields.
            // The current logic relies on basic fields like name/address/restaurant_name.
            // Ensure these fields exist or handle missing ones gracefully.
            console.log(`Duplicate check: Found duplicate for identifier "${identifier}", source: ${duplicateSource}`, item); // Debug log
            return {
                index,
                itemData: item, // Return the original item data
                identifier: identifier, // What identified it as duplicate
				reason: `Potential duplicate found in ${duplicateSource}.`,
            };
        }

        return null;
	}, []);
	// --- END: Modified checkDuplicate function ---

	const processInputData = useCallback(async (data) => {
		console.log('[BulkAddProcessor] Processing input data:', data);
		console.log('[BulkAddProcessor] Current itemType:', itemType);
		
		setIsProcessing(true);
		setParseError(null);
		setErrors([]);
		setDuplicates([]);
		setItems([]); // Clear previous results
		setPlaceSelections([]);
		setAwaitingSelection(false);
		setCurrentProcessingIndex(-1);

		try {
			const parsedItems = Array.isArray(data) ? data : []; // Assume data is already parsed array for now
			if (parsedItems.length === 0) {
				setParseError('No items found in input.');
				setIsProcessing(false);
				return;
			}

			// --- START: Efficient Lookup Integration ---
            let existingItemIdentifiers = new Set();
            try {
                if (itemType === 'neighborhoods') { // Example if adding neighborhoods directly
                    const names = parsedItems.map(item => item.name).filter(Boolean);
                    if (names.length > 0) {
						// Call the dedicated lookup service
                        const existingNames = await adminService.lookupNeighborhoods(names);
						// Convert names back to the identifier format used by checkDuplicate if needed
						existingItemIdentifiers = new Set(Array.from(existingNames).map(name => `${name.toLowerCase()}|`)); // Adjust format as needed
						console.log("Existing neighborhoods found by lookup:", existingItemIdentifiers); // Debug log
                    }
                } else if (itemType === 'restaurants') {
					// TODO: Implement efficient lookup for restaurants if needed
					// const restaurantIdentifiers = parsedItems.map(item => ({ name: item.name, address: item.address }));
					// existingItemIdentifiers = await adminService.lookupRestaurants(restaurantIdentifiers); // Hypothetical service
					 console.warn("Efficient restaurant lookup not yet implemented in useBulkAddProcessor.");
				} else if (itemType === 'dishes') {
					// TODO: Implement efficient lookup for dishes if needed
					// const dishIdentifiers = parsedItems.map(item => ({ name: item.name, restaurant_name: item.restaurant_name }));
					// existingItemIdentifiers = await adminService.lookupDishes(dishIdentifiers); // Hypothetical service
					console.warn("Efficient dish lookup not yet implemented in useBulkAddProcessor.");
				}
            } catch (lookupError) {
                console.error("Failed to perform pre-check lookup:", lookupError);
                // Decide how to proceed: halt processing, show error, or continue without pre-check?
                setErrors([{ index: -1, errors: ['Failed to check for existing items.'], itemData: {} }]);
				// Potentially set a specific error state
            }
			// --- END: Efficient Lookup Integration ---

			const processedItems = [];
			const foundErrors = [];
			const foundDuplicates = [];
			const currentLookupData = lookupData; // Use state at the time of processing
			const pendingPlaceSelections = [];

			// First pass: validate items and prepare for processing
			for (let i = 0; i < parsedItems.length; i++) {
				const item = parsedItems[i];
				// Trim whitespace from string values
                const trimmedItem = Object.fromEntries(
                    Object.entries(item).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
                );

				const validationErrors = validateItem(trimmedItem, i, parsedItems, itemType, currentLookupData);
				if (validationErrors) {
					foundErrors.push(validationErrors);
					continue; // Skip if basic validation fails
				}

				// Pass the fetched existingItemIdentifiers to checkDuplicate
				const duplicateInfo = checkDuplicate(trimmedItem, i, parsedItems, itemType, existingItemIdentifiers);
				if (duplicateInfo) {
					foundDuplicates.push(duplicateInfo);
					// Add to processed items with duplicate status
					processedItems.push({
						...trimmedItem,
						status: 'duplicate',
						message: duplicateInfo.reason || 'Duplicate item',
					});
				} else {
					// For restaurants, we need to look up the place details
					if (itemType === 'restaurants') {
						// Add to processed items with pending status
						processedItems.push({
							...trimmedItem,
							status: 'pending',
							message: 'Looking up place details...',
						});
					} else {
						// For other item types, just add as valid
						processedItems.push({
							...trimmedItem,
							status: 'valid',
							message: 'Ready for submission',
						});
					}
				}
			}

			// Set initial items
			setItems(processedItems);
			setErrors(foundErrors);
			setDuplicates(foundDuplicates);

			// Second pass: process restaurant items to look up place details
			if (itemType === 'restaurants') {
				for (let i = 0; i < processedItems.length; i++) {
					const item = processedItems[i];
					
					// Skip items that are not pending or already have errors
					if (item.status !== 'pending') {
						continue;
					}
					
					try {
						// Update status
						item.status = 'processing';
						item.message = 'Looking up place...';
						setItems([...processedItems]);
						
						// Look up place using Google Places API
						const searchQuery = `${item.name}, ${item.city_name}`;
						console.log(`[BulkAddProcessor] Looking up place: ${searchQuery}`);
						
						const placeResults = await placeService.getPlaceId(item.name, item.city_name);
						console.log(`[BulkAddProcessor] Place lookup results:`, placeResults);
						
						if (!placeResults || placeResults.status !== 'OK') {
							throw new Error(`Place lookup failed: ${placeResults?.status || 'Unknown error'}`);
						}
						
						// Check if we have multiple results
						if (Array.isArray(placeResults.data) && placeResults.data.length > 1) {
							// Multiple results found, need user selection
							console.log(`[BulkAddProcessor] Multiple places found for ${item.name}, need user selection`);
							
							// Update item status
							item.status = 'awaiting_selection';
							item.message = 'Multiple places found, please select one';
							item.placeOptions = placeResults.data.map(place => ({
								placeId: place.place_id,
								description: place.description,
								mainText: place.structured_formatting?.main_text,
								secondaryText: place.structured_formatting?.secondary_text
							}));
							
							// Add to pending place selections
							pendingPlaceSelections.push({
								index: i,
								name: item.name,
								options: item.placeOptions
							});
							
						} else if (Array.isArray(placeResults.data) && placeResults.data.length === 1) {
							// Single result found, process it directly
							const placeId = placeResults.data[0].place_id;
							item.placeId = placeId;
							
							// Process place details
							await processPlaceDetails(placeId, i, processedItems);
						} else {
							// No results found
							item.status = 'error';
							item.message = 'No places found matching this name and location';
						}
						
					} catch (error) {
						console.error(`[BulkAddProcessor] Error processing item ${i}:`, error);
						item.status = 'error';
						item.message = `Error: ${error.message}`;
					}
					
					// Update items after each processing
					setItems([...processedItems]);
				}
				
				// If we have pending place selections, set state for user selection
				if (pendingPlaceSelections.length > 0) {
					setPlaceSelections(pendingPlaceSelections);
					setCurrentProcessingIndex(pendingPlaceSelections[0].index);
					setAwaitingSelection(true);
				}
			}

			console.log("Processing complete. Valid Items:", processedItems.length, "Duplicates:", foundDuplicates.length, "Errors:", foundErrors.length); // Debug log
			setItems(processedItems); // Items ready for review (excluding validation errors)
            setDuplicates(foundDuplicates); // Duplicates identified (from input or DB check)
			setErrors(foundErrors); // Validation errors

		} catch (err) {
			console.error("Error processing input data:", err);
			setParseError(`Processing error: ${err.message}`);
			setItems([]);
			setErrors([]);
			setDuplicates([]);
		} finally {
			setIsProcessing(false);
		}
	}, [itemType, validateItem, checkDuplicate, lookupData]); // Ensure all dependencies are listed

	const handleFileUpload = useCallback((file) => {
		resetState();
		if (!file) return;

		setIsProcessing(true);
		Papa.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				console.log("CSV Parsed Data:", results.data); // Debug log
				processInputData(results.data);
			},
			error: (err) => {
				console.error("CSV Parsing error:", err);
				setParseError(`Error parsing CSV: ${err.message}`);
				setIsProcessing(false);
			}
		});
	}, [processInputData, resetState]);

	const submitBulkAdd = useCallback(async (itemsToSubmit) => {
		setSubmitStatus({ state: 'submitting', message: 'Submitting items...' });
		try {
			// Filter out items marked specifically not to be submitted if review stage allows it
			const finalItems = itemsToSubmit; // .filter(item => item.status !== 'skipped' && item.status !== 'duplicate'); // Example filtering

			if (finalItems.length === 0) {
				setSubmitStatus({ state: 'error', message: 'No valid items to submit.' });
				return;
			}

			console.log(`Submitting ${finalItems.length} items of type ${itemType}`, finalItems); // Debug log

			// Use bulkAddItems with itemType
			const response = await adminService.bulkAddItems({ type: itemType, items: finalItems });

			console.log("Bulk add response:", response.data); // Debug log
			setSubmitStatus({ state: 'success', message: `Successfully added ${response.data?.length || 0} items.` });

			// Invalidate relevant queries to refresh data
			queryClient.invalidateQueries(['adminData', itemType]);
			if (itemType === 'restaurants') {
                queryClient.invalidateQueries(['restaurants']);
				queryClient.invalidateQueries(['neighborhoods']); // Invalidate if new neighborhoods might affect restaurant queries
            } else if (itemType === 'dishes') {
				queryClient.invalidateQueries(['dishes']);
			}
			// Consider invalidating related queries like trending, search results etc. if applicable

			// Optionally reset state after successful submission
			// resetState(); // Or keep data for review

		} catch (error) {
			console.error("Error submitting bulk add:", error.response?.data || error.message);
			setSubmitStatus({ state: 'error', message: `Submission failed: ${error.response?.data?.message || error.message}` });
		}
	}, [itemType, queryClient]); // Removed resetState dependency - reset explicitly if needed

	return {
		items,
		errors,
		duplicates,
		isProcessing,
		parseError,
		submitStatus,
		isPrecomputing, // Expose precomputing state
		// Place selection state
		placeSelections,
		awaitingSelection,
		currentProcessingIndex,
		// Functions
		handleFileUpload,
		processInputData, // Expose for manual data input if needed
		submitBulkAdd,
		selectPlace, // Expose for user selection of places
		resetState
	};
}

export default useBulkAddProcessor;