/* src/pages/BulkAdd/index.jsx */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Upload, AlertTriangle, Info, Check, X as IconX, Edit, Trash2, Eye } from 'lucide-react';
import Button from '@/components/UI/Button';
import useAuthStore from '@/stores/useAuthStore';
import apiClient from '@/services/apiClient';
import { placeService } from '@/services/placeService';
import { adminService } from '@/services/adminService';
import { filterService } from '@/services/filterService';

const ALLOWED_BULK_ADD_TYPES = ['restaurant', 'dish'];

const fetchAdminCitiesSimple = async () => {
    // Fetches cities for the city lookup dropdown/validation
    try {
        const response = await adminService.getAdminCitiesSimple();
        if (response?.success && Array.isArray(response.data)) {
            return response.data;
        }
        console.warn("[BulkAdd] Could not fetch cities for lookup:", response?.error);
        throw new Error(response?.error || "Invalid city data format received");
    } catch (error) {
        console.error("[BulkAdd] Error fetching cities:", error);
        throw error; // Re-throw for useQuery to handle
    }
};

const BulkAdd = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSuperuser = useAuthStore(state => state.isSuperuser);

  // Fetch city list for validation and mapping name to ID
  const { data: cities = [], isLoading: isLoadingCities, error: citiesError } = useQuery({
      queryKey: ['adminCitiesSimpleForBulkAdd'],
      queryFn: fetchAdminCitiesSimple,
      staleTime: Infinity, // Cache indefinitely
      enabled: isSuperuser(), // Only run if user is superuser
      placeholderData: undefined, // Don't use placeholder to differentiate loading/error/empty
  });

  // Cache for neighborhoods fetched per city (for name lookup fallback)
  const [neighborhoodCache, setNeighborhoodCache] = useState({}); // { cityId: Neighborhood[] }

  // Component state
  const [inputData, setInputData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState(''); // For general/submission errors
  const [parseError, setParseError] = useState(''); // For errors during parsing/validation stage
  const [results, setResults] = useState(null); // For submission results display
  const [isInReviewMode, setIsInReviewMode] = useState(false);
  const [parsedItemsForReview, setParsedItemsForReview] = useState([]);

  // Clear errors/results when input changes
  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setError(''); setParseError(''); setResults(null); setIsInReviewMode(false);
    setParsedItemsForReview([]); setProcessingStatus('');
  };

  // Fetches Google Place Details via backend proxy
  const fetchPlaceDetails = useCallback(async (placeName, cityHint) => {
    if (!isSuperuser() || !placeName) {
      setProcessingStatus(`Skipping Google lookup for "${placeName}".`);
      return null;
    }
    const queryInput = cityHint ? `${placeName}, ${cityHint}` : placeName;
    setProcessingStatus(`Finding Place ID for "${queryInput}"...`);
    try {
      // 1. Autocomplete to get place_id
      const autocompleteResults = await placeService.getAutocompleteSuggestions(queryInput);
      if (!autocompleteResults || autocompleteResults.length === 0 || !autocompleteResults[0]?.place_id) {
        setProcessingStatus(`No Place ID found for "${queryInput}".`);
        return null;
      }
      const firstPlaceId = autocompleteResults[0].place_id;
      // 2. Get Place Details using place_id
      setProcessingStatus(`Fetching details for Place ID ${firstPlaceId}...`);
      const placeDetails = await placeService.getPlaceDetails(firstPlaceId); // Calls backend proxy
      // Proxy should extract zipcode, city, neighborhood etc.
      if (placeDetails?.placeId) {
           setProcessingStatus(`Details fetched for "${queryInput}".`);
           return {
             placeId: placeDetails.placeId,
             formattedAddress: placeDetails.formattedAddress,
             city: placeDetails.city, // City name from Google
             neighborhood: placeDetails.neighborhood, // Neighborhood name from Google
             location: placeDetails.location, // { lat, lng }
             zipcode: placeDetails.zipcode || null, // Zipcode extracted by backend
             addressComponents: placeDetails.addressComponents || [],
           };
      } else {
           setProcessingStatus(`Could not fetch details for Place ID ${firstPlaceId}.`);
           return null;
      }
    } catch (err) {
      console.error(`[BulkAdd fetchPlaceDetails] Error for "${queryInput}":`, err);
      setProcessingStatus(`Error during Google lookup for "${queryInput}".`);
      return null;
    }
  }, [isSuperuser]); // Depends only on user's superuser status

  // Gets neighborhoods for a specific city ID (used for name lookup fallback)
  const getNeighborhoodsForCity = useCallback(async (cityId) => {
       const numericCityId = Number(cityId);
      if (isNaN(numericCityId) || numericCityId <= 0) return [];
      // Use cache if available
      if (neighborhoodCache[numericCityId]) return neighborhoodCache[numericCityId];

      setProcessingStatus(`Loading neighborhoods for City ID ${numericCityId}...`);
      try {
          // Call service to get neighborhoods by city ID
          const fetchedNeighborhoods = await filterService.getNeighborhoodsByCity(numericCityId);
          const validNeighborhoods = Array.isArray(fetchedNeighborhoods) ? fetchedNeighborhoods : [];
          // Update cache
          setNeighborhoodCache(prev => ({ ...prev, [numericCityId]: validNeighborhoods }));
          return validNeighborhoods;
      } catch (error) {
          console.error(`[BulkAdd] Error fetching neighborhoods for city ${numericCityId}:`, error);
          setNeighborhoodCache(prev => ({ ...prev, [numericCityId]: [] })); // Cache empty array on error
          return [];
      }
  }, [neighborhoodCache]); // Depends on the cache state

  // Main parsing and validation logic
  const handleParseAndReview = useCallback(async () => {
    // 1. Reset states & basic validation
    setError(''); setParseError(''); setResults(null); setParsedItemsForReview([]);
    if (!inputData.trim()) { setParseError('Please paste some data to process.'); return; }

    // 2. Check if city data (required for validation) is loaded/available
    if (isLoadingCities) { setParseError('City data is still loading...'); return; }
    if (citiesError) { setParseError(`Error loading city data: ${citiesError.message || 'Unknown'}. Cannot proceed.`); return; }
    if (!cities || cities.length === 0) { setParseError('City data is empty. Cannot proceed.'); return; }

    // 3. Start processing
    setIsProcessing(true);
    setProcessingStatus('Starting processing...');
    const lines = inputData.trim().split('\n');
    const parsedItems = [];
    let lineNum = 0;
    let anyErrors = false;
    // Create a Map for efficient city name -> city ID lookup
    const cityMap = new Map(cities.map(city => [city.name.toLowerCase(), city.id]));

    // 4. Process each line
    for (const line of lines) {
      lineNum++;
      setProcessingStatus(`Processing line ${lineNum}/${lines.length}: "${line.substring(0, 50)}..."`);
      let itemError = null;
      let parsedItem = null;
      let placeDetails = null;
      let cityId = null; // Numeric ID of the city for this item
      let neighborhoodId = null; // Final numeric neighborhood ID (null if not found)
      let neighborhoodName = null; // Final neighborhood name (DB or Google)
      let cityNameForDB = null; // City name provided in the input

      try {
        // Basic line parsing
        const parts = line.split(';').map(p => p.trim());
        const name = parts[0];
        const type = parts[1]?.toLowerCase();
        const locationHintOrRestaurant = parts[2];
        const tags = parts[3] ? parts[3].split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

        if (!name) throw new Error('Name missing');
        if (!type || !ALLOWED_BULK_ADD_TYPES.includes(type)) throw new Error(`Invalid type "${type}"`);

        let restaurantNameHint = null;
        let restaurantId = null;

        // Logic specific to 'restaurant' type
        if (type === 'restaurant') {
            const cityHint = locationHintOrRestaurant;
            if (!cityHint) throw new Error('City hint required');
            // Validate city against loaded city data
            const foundCityId = cityMap.get(cityHint.toLowerCase());
            if (!foundCityId) throw new Error(`City '${cityHint}' not found in database`);
            cityId = foundCityId; // Store the numeric city ID
            cityNameForDB = cityHint; // Store the input city name

            // Fetch Google Place Details (includes zipcode)
            placeDetails = await fetchPlaceDetails(name, cityHint);
            const zipcode = placeDetails?.zipcode; // Zipcode extracted by backend proxy
            const googleNeighborhoodName = placeDetails?.neighborhood; // Name from Google

            // Attempt Neighborhood Lookup - Strategy: Zipcode first, then Name Fallback

            // A. Try Zipcode Lookup
            // ** Refined Check: Ensure zipcode is a non-empty string **
            if (zipcode && typeof zipcode === 'string' && zipcode.trim() && cityId) {
                const trimmedZip = zipcode.trim(); // Use trimmed zip for lookup
                setProcessingStatus(`Zipcode ${trimmedZip} found. Looking up in DB...`);
                try {
                    // Call backend API via service
                    const neighborhoodFromZip = await filterService.findNeighborhoodByZipcode(trimmedZip);
                    const foundNbCityId = neighborhoodFromZip?.city_id != null ? Number(neighborhoodFromZip.city_id) : null;
                    const restaurantCityIdNum = Number(cityId); // Known valid city ID

                    // Check if lookup returned a neighborhood AND its city matches the restaurant's city
                    if (neighborhoodFromZip && foundNbCityId === restaurantCityIdNum) {
                        neighborhoodId = Number(neighborhoodFromZip.id); // Assign the found DB ID
                        neighborhoodName = neighborhoodFromZip.name; // Assign the DB name
                        setProcessingStatus(`Zipcode matched DB: ${neighborhoodName} (ID: ${neighborhoodId})`);
                    } else {
                        // Zipcode lookup failed or city mismatch
                        neighborhoodName = googleNeighborhoodName; // Keep Google name for potential name lookup
                        if (neighborhoodFromZip) { // Found a neighborhood but wrong city
                           setProcessingStatus(`Zipcode ${trimmedZip} found nb in wrong city. Trying name fallback.`);
                           console.warn(`[BulkAdd Parse] Zipcode ${trimmedZip} nb lookup city ID ${foundNbCityId} mismatch (expected ${restaurantCityIdNum}).`);
                        } else { // Zipcode not found in DB
                           setProcessingStatus(`Zipcode ${trimmedZip} not found in DB. Trying name fallback.`);
                           console.log(`[BulkAdd Parse] Zipcode ${trimmedZip} not found in DB.`);
                        }
                        // neighborhoodId remains null here
                    }
                } catch (zipLookupError) {
                     // Error during the API call itself
                     setProcessingStatus(`Error during zipcode lookup. Trying name fallback.`);
                     console.error(`[BulkAdd Parse] Zipcode ${trimmedZip} lookup failed:`, zipLookupError);
                     neighborhoodName = googleNeighborhoodName; // Use Google name on error
                     // neighborhoodId remains null
                }
            } else {
                 // No valid zipcode string extracted from Google details or no cityId found earlier
                 neighborhoodName = googleNeighborhoodName; // Use Google name if zipcode lookup wasn't possible
                 setProcessingStatus(`No valid zipcode found. Trying name fallback.`); // Updated status message
                 console.log(`[BulkAdd Parse] No valid zipcode ('${zipcode}') or cityId ('${cityId}'), skipping zipcode lookup.`); // Updated log
                 // neighborhoodId remains null
            }

            // B. Fallback: Name Lookup (Only if Zipcode lookup failed AND we have a name from Google)
            if (neighborhoodId === null && neighborhoodName && cityId) {
                 setProcessingStatus(`Trying name lookup for "${neighborhoodName}" in City ${cityId}...`);
                 const cityNeighborhoods = await getNeighborhoodsForCity(cityId); // Fetch/use cached neighborhoods for the city
                 // Find neighborhood in the list matching the Google name (case-insensitive)
                 const matchedNeighborhood = cityNeighborhoods.find(
                     nb => nb.name.toLowerCase() === neighborhoodName.toLowerCase()
                 );
                 if (matchedNeighborhood) {
                     neighborhoodId = matchedNeighborhood.id; // Found by name! Assign ID
                     // Keep neighborhoodName as is (it matched the DB name)
                     setProcessingStatus(`Name matched DB: ${neighborhoodName} (ID: ${neighborhoodId})`);
                     console.log(`[BulkAdd Parse] Fallback name lookup success for "${neighborhoodName}" -> ID ${neighborhoodId}`);
                 } else {
                     // Name lookup also failed
                     setProcessingStatus(`Name "${neighborhoodName}" not found in DB neighborhoods for City ${cityId}.`);
                     console.warn(`[BulkAdd Parse] Fallback name lookup failed for "${neighborhoodName}" in City ${cityId}.`);
                     // Keep neighborhoodName (from Google) for display, ID remains null
                 }
            } else if (neighborhoodId === null) {
                 // Zipcode lookup failed AND (no name from Google OR no cityId)
                 setProcessingStatus("No neighborhood ID found (Zipcode & Name lookup failed/skipped).");
                 // Ensure name is null only if ID is null AND Google didn't provide a name. Otherwise keep Google name for display.
                 if (!googleNeighborhoodName) {
                     neighborhoodName = null;
                 } else {
                     neighborhoodName = googleNeighborhoodName;
                 }
            }

            // Add delay between Google API calls to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 50));

        // Logic specific to 'dish' type
        } else if (type === 'dish') {
            const possibleId = Number(locationHintOrRestaurant);
            if (!isNaN(possibleId) && possibleId > 0) {
                 restaurantId = possibleId; // Assume it's a restaurant ID
            } else if (locationHintOrRestaurant) {
                 restaurantNameHint = locationHintOrRestaurant; // Assume it's a restaurant name (ID lookup not implemented here)
            } else {
                throw new Error(`Restaurant Name or ID missing for dish`);
            }
        }

        // 5. Construct the result object for this line
        parsedItem = {
          _originalLine: line, _lineNumber: lineNum, name: name, type: type,
          city_id: type === 'restaurant' ? cityId : undefined,
          city: type === 'restaurant' ? cityNameForDB : null, // Name from input
          neighborhood_id: type === 'restaurant' ? neighborhoodId : undefined, // Final ID (null if not found)
          neighborhood: type === 'restaurant' ? neighborhoodName : null, // Final name (DB or Google)
          address: placeDetails?.formattedAddress || null,
          place_id: placeDetails?.placeId || null,
          latitude: placeDetails?.location?.lat || null,
          longitude: placeDetails?.location?.lng || null,
          restaurant_id: type === 'dish' ? restaurantId : undefined,
          restaurant_name: type === 'dish' ? restaurantNameHint : undefined,
          tags: tags, _status: 'valid',
        };

      } catch (parseErr) {
        // Handle errors during parsing/lookup for this line
        itemError = parseErr.message; anyErrors = true;
        parsedItem = { _originalLine: line, _lineNumber: lineNum, name: line.split(';')[0] || '?', type: '?', _status: 'error', _error: itemError };
      }
      parsedItems.push(parsedItem);
    } // End loop over lines

    // 6. Finalize processing and update state
    setParsedItemsForReview(parsedItems); setIsInReviewMode(true); setIsProcessing(false);
    setProcessingStatus(anyErrors ? 'Processing complete with errors.' : 'Processing complete. Please review.');
    if (anyErrors) setParseError("Some items had errors. Check 'Status'.");

  }, [inputData, isSuperuser, fetchPlaceDetails, cities, isLoadingCities, citiesError, getNeighborhoodsForCity]);


  // Handles confirming and submitting reviewed items
  const handleConfirmSubmit = useCallback(async () => {
     // 1. Reset errors/results
     setError(''); setParseError(''); setResults(null);

     let firstInvalidItem = null;
     // 2. Filter items: Remove errors, removed items, and check critical fields
     const itemsToSubmit = parsedItemsForReview.filter(item => {
        if (item._status === 'error' || item._status === 'removed') return false;
        // Restaurants must have a city_id
        if (item.type === 'restaurant' && (item.city_id === null || item.city_id === undefined || isNaN(Number(item.city_id)))) {
            if (!firstInvalidItem) firstInvalidItem = { ...item, _error: "Missing required City ID." }; return false;
        }
        // Dishes must have a restaurant_id (lookup by name not supported during submission)
        if (item.type === 'dish' && (item.restaurant_id === null || item.restaurant_id === undefined || isNaN(Number(item.restaurant_id)))) {
             if (!firstInvalidItem) firstInvalidItem = { ...item, _error: "Missing required Restaurant ID." }; return false;
         }
        // Type must be valid
        if (!item.type || !ALLOWED_BULK_ADD_TYPES.includes(item.type)) {
            if (!firstInvalidItem) firstInvalidItem = { ...item, _error: `Invalid type '${item.type || 'missing'}'` }; return false;
        }
        // Neighborhood ID is allowed to be null if lookup failed
        return true;
     });

     // 3. Abort if invalid items found after filtering
     if (firstInvalidItem) {
          setError(`Submission aborted: Item on line ${firstInvalidItem._lineNumber} ("${firstInvalidItem.name}") has an error: ${firstInvalidItem._error}. Remove or fix.`);
          return;
     }
     if (itemsToSubmit.length === 0) { setError("No valid items remaining to submit."); return; }

     // 4. Prepare payload for backend
     setIsSubmitting(true);
     setProcessingStatus(`Submitting ${itemsToSubmit.length} valid items...`);
     const cleanedItems = itemsToSubmit.map(item => {
         // Remove internal/display fields (_*, neighborhood, city)
         const { _originalLine, _lineNumber, _status, _error, neighborhood, city, ...rest } = item;
         // Ensure numeric types or null
         if (rest.city_id !== undefined) rest.city_id = Number(rest.city_id) || null;
         if (rest.neighborhood_id !== undefined) rest.neighborhood_id = Number(rest.neighborhood_id) || null; // Pass ID (can be null)
         if (rest.restaurant_id !== undefined) rest.restaurant_id = Number(rest.restaurant_id) || null;
         if (rest.latitude !== undefined) rest.latitude = Number(rest.latitude) || null;
         if (rest.longitude !== undefined) rest.longitude = Number(rest.longitude) || null;
         rest.tags = Array.isArray(rest.tags) ? rest.tags : [];
         // Optionally add names if backend needs them for denormalization (check backend model)
         if (item.type === 'restaurant') {
             rest.city_name = city; // Pass original city name hint
             rest.neighborhood_name = item.neighborhood_id ? neighborhood : null; // Pass DB/matched name ONLY if ID was found
         }
         return rest;
     });

      console.log('[BulkAdd] Submitting cleaned payload:', JSON.stringify({ items: cleanedItems }, null, 2));

     // 5. Send payload to backend
     try {
        const response = await apiClient('/api/admin/bulk-add', 'Bulk Add Submit', {
            method: 'POST',
            body: JSON.stringify({ items: cleanedItems }),
        });
        if (response.success && response.data) {
            setResults(response.data); // Display backend results
            setProcessingStatus(`Submission complete: ${response.data.addedCount || 0} added, ${response.data.skippedCount || 0} skipped/existed, ${response.data.errorCount || 0} errors.`);
            // Reset form
            setInputData(''); setParsedItemsForReview([]); setIsInReviewMode(false); setNeighborhoodCache({});
        } else { throw new Error(response.error || response.message || "Backend submission failed."); }
     } catch (apiErr) {
         // Handle submission API errors
         console.error("[BulkAdd] Submission API error:", apiErr);
         setError(apiErr.message || "Failed to submit data to the backend.");
         setProcessingStatus("Submission failed.");
     } finally { setIsSubmitting(false); }
  }, [parsedItemsForReview]);

  // Cancels review mode, clears state
  const handleCancelReview = useCallback(() => {
      setIsInReviewMode(false); setParsedItemsForReview([]); setProcessingStatus('');
      setError(''); setParseError(''); setNeighborhoodCache({});
  }, []);

  // Marks an item as 'removed' in the review table
  const handleRemoveItemFromReview = useCallback((lineNumber) => {
       setParsedItemsForReview(prev => prev.map(item =>
           item._lineNumber === lineNumber ? { ...item, _status: 'removed' } : item
       ));
   }, []);

  // Combine parsing and submission errors for display
  const displayError = error || parseError;

  // Access Denied Check
  if (!isAuthenticated || !isSuperuser()) {
      return (
          <div className="container mx-auto px-4 py-8 text-center">
              <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-4">You do not have permission to access the Bulk Add tool.</p>
              <Button onClick={() => navigate('/')} variant="primary">Go Home</Button>
          </div>
      );
  }

  // Render the main UI
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
       {/* Back Button */}
       <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4 flex items-center">
           <ArrowLeft size={16} className="mr-1" /> Back
       </Button>
       <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Bulk Add Tool</h1>

      {/* Conditional Rendering: Input Mode vs Review Mode */}
      {!isInReviewMode ? (
          <>
              {/* Input Mode */}
              <p className="text-sm text-gray-600 mb-4"> Paste data below (one item per line). Format: `Name; Type; CityOrRestaurantNameOrID; Tag1,Tag2` </p>
              <p className="text-xs text-gray-500 mb-4 italic">
                  Type: 'restaurant' or 'dish'. City must exist. Restaurant ID needed for dishes if name isn't unique.<br />
                  Examples:<br />
                  `Peter Luger Steak House; restaurant; New York; steakhouse,classic,cash only`<br />
                  `Katz's Delicatessen; restaurant; New York; deli,sandwiches,pastrami`<br />
                  `Pastrami Sandwich; dish; Katz's Delicatessen; sandwich,must try`
              </p>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  {/* Textarea for Input */}
                  <textarea
                      value={inputData}
                      onChange={handleInputChange}
                      placeholder="Peter Luger Steak House; restaurant; New York; steakhouse,classic..."
                      className="w-full h-60 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm font-mono"
                      disabled={isProcessing}
                      aria-label="Bulk data input"
                  />
                  {/* Processing Status */}
                  {isProcessing && processingStatus && (
                      <p className="mt-3 text-sm text-blue-600 flex items-center justify-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" /> {processingStatus}
                      </p>
                  )}
                  {/* Error Display */}
                  {displayError && (
                      <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
                          {displayError}
                      </p>
                  )}
                  {/* Parse Button */}
                  <div className="mt-4 flex justify-end">
                      <Button
                          onClick={handleParseAndReview}
                          variant="primary"
                          disabled={isProcessing || isLoadingCities || !inputData.trim()}
                          className="flex items-center gap-2 min-w-[160px] justify-center disabled:opacity-60"
                      >
                          {isProcessing ? (<><Loader2 className="animate-spin h-4 w-4" /> Processing...</>)
                          : isLoadingCities ? (<><Loader2 className="animate-spin h-4 w-4" /> Loading Cities...</>)
                          : (<><Eye size={16} /> Parse & Review</>)}
                      </Button>
                  </div>
              </div>
          </>
      ) : (
          <> {/* Review Mode */}
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Review Items for Submission</h2>
              {/* Status/Error Display */}
              {processingStatus && <p className="text-sm text-blue-600 mb-3">{processingStatus}</p>}
              {displayError && ( <p role="alert" className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"> {displayError} </p> )}

              {/* Review Table */}
              <div className="bg-white p-0 rounded-lg shadow-sm border border-gray-100 max-h-[60vh] overflow-y-auto mb-4">
                 <table className="min-w-full text-xs">
                     <thead className="sticky top-0 z-10">
                         <tr className="border-b bg-gray-100 text-left">
                             <th className="p-2 font-medium">#</th>
                             <th className="p-2 font-medium">Name</th>
                             <th className="p-2 font-medium">Type</th>
                             <th className="p-2 font-medium">City (ID)</th>
                             <th className="p-2 font-medium">Neighborhood (Found ID)</th>
                             <th className="p-2 font-medium">Address</th>
                             <th className="p-2 font-medium">Restaurant (ID/Name)</th>
                             <th className="p-2 font-medium">Tags</th>
                             <th className="p-2 font-medium">Status</th>
                             <th className="p-2 font-medium text-center">Actions</th>
                         </tr>
                     </thead>
                     <tbody>
                         {parsedItemsForReview.map((item, index) => (
                             <tr key={item._lineNumber || index} className={`border-b last:border-b-0 ${item._status === 'error' ? 'bg-red-50' : item._status === 'removed' ? 'bg-gray-100 text-gray-400 line-through' : 'hover:bg-blue-50'}`}>
                                 <td className="p-2 text-gray-500">{item._lineNumber}</td>
                                 <td className="p-2 font-medium">{item.name || '?'}</td>
                                 <td className="p-2 capitalize">{item.type || '?'}</td>
                                 <td className="p-2">{item.type === 'restaurant' ? `${item.city || '?'} (${item.city_id || 'N/A'})` : '-'}</td>
                                 {/* Display Neighborhood Name (DB or Google) and the Found ID (or Not Found) */}
                                 <td className="p-2">
                                      {item.type === 'restaurant' ? (
                                         `${item.neighborhood || '-'} (${item.neighborhood_id ?? 'Not Found'})`
                                      ) : '-'}
                                 </td>
                                 <td className="p-2 max-w-xs truncate" title={item.address || ''}>{item.address || '-'}</td>
                                 <td className="p-2">{item.restaurant_id ? `ID: ${item.restaurant_id}` : item.restaurant_name || '-'}</td>
                                 <td className="p-2">{(item.tags || []).join(', ') || '-'}</td>
                                 <td className={`p-2 font-medium ${item._status === 'error' ? 'text-red-600' : item._status === 'removed' ? '' : 'text-green-600'}`}>
                                     {item._status === 'error' ? (
                                        <span title={item._error}>{item._error?.substring(0, 50) || 'Error'}...</span>
                                     ) : (
                                        item._status // Should be 'valid' or 'removed' here
                                     )}
                                </td>
                                 <td className="p-2 text-center">
                                     {/* Remove Button */}
                                     {item._status !== 'removed' && (
                                         <Button variant="tertiary" size="sm" className="!p-1 text-red-500 hover:bg-red-100" onClick={() => handleRemoveItemFromReview(item._lineNumber)} disabled={isSubmitting} title="Remove from submission">
                                             <Trash2 size={14}/>
                                         </Button>
                                     )}
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
              </div>
                {/* Bottom Actions: Cancel / Submit */}
                <div className="flex justify-between items-center">
                  <Button variant="tertiary" onClick={handleCancelReview} disabled={isSubmitting}>
                      Cancel Review
                  </Button>
                   <div className="flex items-center gap-2">
                        {/* Count of valid items for submission */}
                        <span className="text-sm text-gray-600">
                            {parsedItemsForReview.filter(i => i._status === 'valid' && ALLOWED_BULK_ADD_TYPES.includes(i.type) && (i.type !== 'restaurant' || i.city_id) && (i.type !== 'dish' || i.restaurant_id)).length} valid items will be submitted.
                        </span>
                       {/* Submit Button */}
                       <Button
                            onClick={handleConfirmSubmit}
                            variant="primary"
                            disabled={isSubmitting || parsedItemsForReview.filter(i => i._status === 'valid' && ALLOWED_BULK_ADD_TYPES.includes(i.type) && (i.type !== 'restaurant' || i.city_id) && (i.type !== 'dish' || i.restaurant_id)).length === 0}
                            className="flex items-center gap-2 min-w-[160px] justify-center disabled:opacity-60"
                        >
                           {isSubmitting ? (<><Loader2 className="animate-spin h-4 w-4" /> Submitting...</>) : (<><Upload size={16} /> Confirm & Submit</>)}
                       </Button>
                   </div>
              </div>
               {/* Display Submission Results */}
               {results && !error && !parseError && !isSubmitting && (
                 <div className="mt-4 p-3 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                     <p className="text-sm font-medium text-gray-800 mb-2">{results.message || `Processed ${results.processedCount || 0} items.`}</p>
                     <ul className="space-y-1 text-xs">
                         {results.details?.map((detail, index) => (
                             <li key={index} className={`flex items-start gap-2 p-1 rounded ${detail.status === 'added' ? 'bg-green-50 text-green-800' : detail.status === 'skipped' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                                 {detail.status === 'added' ? <Check size={14} className="flex-shrink-0 mt-0.5"/> : detail.status === 'skipped' ? <Info size={14} className="flex-shrink-0 mt-0.5"/> : <IconX size={14} className="flex-shrink-0 mt-0.5"/>}
                                 <span className="flex-grow"> <span className="font-semibold">{detail.input?.name}</span> ({detail.input?.type}) - {detail.status}: {detail.reason || (detail.id ? `ID: ${detail.id}` : 'OK')} </span>
                             </li>
                         ))}
                     </ul>
                 </div>
              )}
          </>
       )}
    </div>
  );
};

export default BulkAdd;