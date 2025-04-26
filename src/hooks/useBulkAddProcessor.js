// Filename: root/src/hooks/useBulkAddProcessor.js
import { useState, useCallback, useEffect } from 'react';
import { adminService } from '@/services/adminService'; // Updated to named import
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse'; // Confirmed correct import

// --- START: Helper to identify required fields ---
const getRequiredFields = (itemType) => {
	switch (itemType) {
		case 'restaurants':
			return ['name', 'address', 'neighborhood', 'city', 'cuisine_type']; // Add latitude, longitude if manually required
		case 'dishes':
			return ['name', 'restaurant_name', 'cuisine_type']; // Add other required fields like description?
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

function useBulkAddProcessor(itemType) {
	const [items, setItems] = useState([]); // Processed items ready for review/submit
	const [errors, setErrors] = useState([]); // Errors found during processing
	const [duplicates, setDuplicates] = useState([]); // Items identified as potential duplicates
	const [isProcessing, setIsProcessing] = useState(false);
	const [parseError, setParseError] = useState(null);
	const [submitStatus, setSubmitStatus] = useState({ state: 'idle', message: '' }); // idle, submitting, success, error
	const queryClient = useQueryClient();

	const resetState = useCallback(() => {
		setItems([]);
		setErrors([]);
		setDuplicates([]);
		setIsProcessing(false);
		setParseError(null);
		setSubmitStatus({ state: 'idle', message: '' });
	}, []);

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
		setIsProcessing(true);
		setParseError(null);
		setErrors([]);
		setDuplicates([]);
		setItems([]); // Clear previous results

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

			for (let i = 0; i < parsedItems.length; i++) {
				const item = parsedItems[i];
				// Trim whitespace from string values
                const trimmedItem = Object.fromEntries(
                    Object.entries(item).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
                );

				const validationErrors = validateItem(trimmedItem, i, parsedItems, itemType, currentLookupData);
				if (validationErrors) {
					foundErrors.push(validationErrors);
					continue; // Skip duplicate check if basic validation fails
				}

				// Pass the fetched existingItemIdentifiers to checkDuplicate
				const duplicateInfo = checkDuplicate(trimmedItem, i, parsedItems, itemType, existingItemIdentifiers);
				if (duplicateInfo) {
					foundDuplicates.push(duplicateInfo);
                    // Decide whether to still add duplicates to 'processedItems' for review
                    // Or filter them out entirely here. Adding them allows user review.
                    // processedItems.push({ ...trimmedItem, status: 'duplicate', duplicateReason: duplicateInfo.reason });
				} else {
					// Map to expected backend structure if necessary
					// Example: Convert neighborhood name to neighborhood_id
					const neighborhoodName = trimmedItem.neighborhood?.toLowerCase();
                    const neighborhood = currentLookupData.neighborhoods.get(neighborhoodName);

					// Example: Convert restaurant name to restaurant_id for dishes
					// const restaurantName = trimmedItem.restaurant_name?.toLowerCase();
					// const restaurant = currentLookupData.restaurants.get(restaurantName);

					processedItems.push({
						...trimmedItem,
						status: 'valid', // Mark as initially valid
						// Add mapped IDs if needed:
						neighborhood_id: itemType === 'restaurants' ? neighborhood?.id : undefined,
						// restaurant_id: itemType === 'dishes' ? restaurant?.id : undefined,
						// Remove temporary fields if needed:
						// neighborhood: undefined,
						// restaurant_name: undefined,
					});
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
		handleFileUpload,
		processInputData, // Expose for manual data input if needed
		submitBulkAdd,
		resetState
	};
}

export default useBulkAddProcessor;