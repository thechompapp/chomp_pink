/* main/src/pages/BulkAdd/index.jsx */
// Final version: Implements city-agnostic dish restaurant lookup, restaurant verification,
// status handling, UI updates, and adheres to formatting/preservation rules.
// CORRECTED: Parsing logic for 4-part vs 5-part restaurant inputs.
// ADDED: Debug console logs for Google Places/Neighborhood lookup processing.

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, Loader2, Upload, AlertTriangle, Info, Check, X as IconX,
    Edit, Trash2, Eye, Search, CheckCircle, HelpCircle, AlertCircle, MapPin, Copy
} from 'lucide-react';
import Button from '@/components/UI/Button';
import Modal from '@/components/UI/Modal';
import useAuthStore from '@/stores/useAuthStore';
import apiClient from '@/services/apiClient';
import { placeService } from '@/services/placeService';
import { adminService } from '@/services/adminService';
import { filterService } from '@/services/filterService';
import { searchService } from '@/services/searchService';
import { dishService } from '@/services/dishService'; // Import the real service


const ALLOWED_BULK_ADD_TYPES = ['restaurant', 'dish'];
const RESTAURANT_DUPLICATE_THRESHOLD = 0.98; // Confidence score to consider a restaurant a duplicate

// Fetches simplified city list for lookups
const fetchAdminCitiesSimple = async () => {
    try {
        const response = await adminService.getAdminCitiesSimple();
        if (response?.success && Array.isArray(response.data)) {
            return response.data;
        }
        throw new Error(response?.error || "Invalid city data format received");
    } catch (error) {
        console.error("[BulkAdd] Error fetching cities:", error);
        throw error;
    }
};

// Utility to get city ID from name using the fetched map
const getCityIdFromName = (cityName, cityMap) => {
     if (!cityName || !cityMap) return null;
     return cityMap.get(String(cityName).toLowerCase().trim()) || null;
};

const BulkAdd = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSuperuser = useAuthStore(state => state.isSuperuser);

  // Fetch cities needed for validation and lookups
  const { data: cities = [], isLoading: isLoadingCities, error: citiesError } = useQuery({
      queryKey: ['adminCitiesSimpleForBulkAdd'], queryFn: fetchAdminCitiesSimple,
      staleTime: Infinity, enabled: isSuperuser(), placeholderData: [],
  });

  // Memoized map for efficient city name to ID lookup
  const cityMap = useMemo(() => {
      if (!cities || cities.length === 0) return new Map();
      return new Map(cities.map(city => [city.name.toLowerCase(), city.id]));
  }, [cities]);

  // State for caching neighborhood data per city
  const [neighborhoodCache, setNeighborhoodCache] = useState({});

  // Component state variables
  const [inputData, setInputData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState(''); // General submission/API errors
  const [parseError, setParseError] = useState(''); // Errors related to parsing/review phase
  const [results, setResults] = useState(null); // Results from backend after submission
  const [isInReviewMode, setIsInReviewMode] = useState(false); // Toggles between input and review table
  const [parsedItemsForReview, setParsedItemsForReview] = useState([]); // Holds items being reviewed
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState(null); // Item currently being resolved in modal

  // --- Callback Functions ---

  // Handles changes in the input textarea
  const handleInputChange = (e) => {
    setInputData(e.target.value);
    // Reset states when input changes
    setError(''); setParseError(''); setResults(null); setIsInReviewMode(false);
    setParsedItemsForReview([]); setProcessingStatus('');
    setIsSuggestionModalOpen(false); setReviewingItem(null);
  };

  // Fetches Google Place Details for a given restaurant name and city hint
  const fetchPlaceDetails = useCallback(async (placeName, cityHint) => {
    if (!isSuperuser() || !placeName) { setProcessingStatus(`Skipping Google lookup for "${placeName}".`); return null; }
    const queryInput = cityHint ? `${placeName}, ${cityHint}` : placeName;
    setProcessingStatus(`Finding Place ID for "${queryInput}"...`);
    try {
      const auto = await placeService.getAutocompleteSuggestions(queryInput);
      if (!auto || auto.length === 0 || !auto[0]?.place_id) { setProcessingStatus(`No Place ID found for "${queryInput}".`); return null; }
      const pid = auto[0].place_id;
      setProcessingStatus(`Fetching details for Place ID ${pid}...`); // Corrected typo
      const details = await placeService.getPlaceDetails(pid);
      if (details?.placeId) {
           setProcessingStatus(`Details fetched for "${queryInput}".`);
           // Return comprehensive details
           return {
               placeId: details.placeId,
               formattedAddress: details.formattedAddress,
               city: details.city, // City name from Google
               neighborhood: details.neighborhood, // Neighborhood name from Google
               location: details.location, // {lat, lng}
               zipcode: details.zipcode || null, // Zip code (already extracted in service)
               phone: details.phone || null,
               website: details.website || null,
               googleMapsUrl: details.googleMapsUrl || null,
               addressComponents: details.addressComponents || [], // Full components if needed later
           };
      } else { setProcessingStatus(`Could not fetch details for Place ID ${pid}.`); return null; }
    } catch (err) { console.error(`[BulkAdd fetchPlaceDetails] Error for "${queryInput}":`, err); setProcessingStatus(`Error during Google lookup for "${queryInput}".`); return null; }
  }, [isSuperuser]); // Dependency: only needs isSuperuser check

  // Fetches neighborhoods for a given city ID, using cache
  const getNeighborhoodsForCity = useCallback(async (cityId) => {
       const numericCityId = Number(cityId);
      if (isNaN(numericCityId) || numericCityId <= 0) return [];
      if (neighborhoodCache[numericCityId]) return neighborhoodCache[numericCityId]; // Return from cache
      setProcessingStatus(`Loading neighborhoods for City ID ${numericCityId}...`);
      try {
          const fetchedNeighborhoods = await filterService.getNeighborhoodsByCity(numericCityId);
          const validNeighborhoods = Array.isArray(fetchedNeighborhoods) ? fetchedNeighborhoods : [];
          setNeighborhoodCache(prev => ({ ...prev, [numericCityId]: validNeighborhoods })); // Update cache
          return validNeighborhoods;
      } catch (error) { console.error(`[BulkAdd] Error fetching neighborhoods for city ${numericCityId}:`, error); setNeighborhoodCache(prev => ({ ...prev, [numericCityId]: [] })); return []; }
  }, [neighborhoodCache]); // Dependency: neighborhoodCache

  // --- Verification Step Functions ---

  // Verifies 'restaurant' type items against the internal DB (requires cityId)
  const performRestaurantVerification = useCallback(async (itemsToCheck) => {
      setProcessingStatus(`Verifying restaurants (${itemsToCheck.length})...`);
      const verificationPromises = itemsToCheck.map(async (item) => {
          if (item.type !== 'restaurant' || item._status !== 'pending_resto_verification') { return { lineNumber: item._lineNumber, status: item._status, error: item._error, lookup: item._lookup, restaurantId: item.restaurant_id }; }
          try {
              if (!item.name || !item.city_id) throw new Error("Missing name or city ID for restaurant verification.");
              setProcessingStatus(`Verifying restaurant: "${item.name}" (City ID: ${item.city_id})`);
              const lookupResult = await searchService.findRestaurantForBulkAdd(item.name, item.city_id);

              // --- Logic based on backend response (which now includes status) ---
              let nextStatus = 'error'; let errorMsg = lookupResult?.message || 'Verification error.'; let foundRestaurantId = null;
              const backendStatus = lookupResult?.status; // Status field from backend
              const backendData = lookupResult?.data;

               if (backendStatus === 'found' && backendData?.score >= RESTAURANT_DUPLICATE_THRESHOLD) {
                   nextStatus = 'pending_google_lookup'; errorMsg = `Restaurant likely exists (ID: ${backendData.id}). Fetching details.`; foundRestaurantId = backendData.id;
                } else if (backendStatus === 'found') {
                    nextStatus = 'review_needed'; errorMsg = `Potential match found (Score: ${backendData.score?.toFixed(2)}). Review needed.`;
                } else if (backendStatus === 'suggestions') {
                     nextStatus = 'review_needed'; errorMsg = `Multiple matches found. Review needed.`;
                 } else if (backendStatus === 'not_found') {
                    nextStatus = 'pending_google_lookup'; errorMsg = undefined; // New resto -> Google lookup
                 } else { // Handle explicit error status or unexpected/missing status
                    errorMsg = `Verification failed: ${lookupResult?.message || 'API error or unexpected backend response'}`;
                    nextStatus = 'error';
                 }
               // --- End Logic ---

               return { lineNumber: item._lineNumber, status: nextStatus, error: errorMsg, lookup: lookupResult, restaurantId: foundRestaurantId };
          } catch (verificationError) { console.error(`[BulkAdd Restaurant Verify] Line ${item._lineNumber} Error:`, verificationError); return { lineNumber: item._lineNumber, status: 'error', error: `Restaurant verification failed: ${verificationError.message || 'Unknown'}`, lookup: null, restaurantId: null }; }
      });
      const results = await Promise.allSettled(verificationPromises); const map = new Map(); let errors = false; results.forEach(res => { if (res.status === 'fulfilled' && res.value) { map.set(res.value.lineNumber, { status: res.value.status, error: res.value.error, lookup: res.value.lookup, restaurantId: res.value.restaurantId }); if (res.value.status === 'error') errors = true; } else if (res.status === 'rejected') { const ln=res.reason?.lineNumber??null; const msg=res.reason?.error||res.reason?.message||'Rejected.'; if(ln) map.set(ln,{status:'error',error:msg,lookup:null,restaurantId:null}); errors=true; } }); return { verificationMap: map, verificationErrors: errors };
  }, []); // Dependencies: searchService

   // Performs internal DB lookup (city-agnostic) for restaurants associated with 'dish' items
   const performDishRestaurantLookup = useCallback(async (itemsToCheck) => {
       setProcessingStatus(`Looking up restaurants for dishes (${itemsToCheck.length})...`);
       const lookupPromises = itemsToCheck.map(async (item) => {
           if (item.type !== 'dish' || item._status !== 'pending_resto_lookup') { return { lineNumber: item._lineNumber, status: item._status, error: item._error, lookup: item._lookup, restaurantId: item.restaurant_id }; }
           try {
               if (!item.restaurant_name) throw new Error("Missing restaurant name for dish lookup.");
               setProcessingStatus(`Dish line ${item._lineNumber}: Looking up restaurant "${item.restaurant_name}" (city agnostic)`);
               // *** Call findRestaurantForBulkAdd WITHOUT cityId ***
               const lookupResult = await searchService.findRestaurantForBulkAdd(item.restaurant_name, null); // Pass null for cityId

               // --- Logic based on backend response (which now includes status) ---
               let nextStatus = 'error'; let errorMsg = lookupResult?.message || 'Lookup failed.'; let foundRestaurantId = null;
               const backendStatus = lookupResult?.status;
               const backendData = lookupResult?.data;

               if (backendStatus === 'found') {
                   nextStatus = 'pending_dish_verification'; errorMsg = undefined; foundRestaurantId = backendData.id;
                } else if (backendStatus === 'suggestions') {
                     nextStatus = 'review_needed'; errorMsg = `Multiple matches found for "${item.restaurant_name}" across cities. Review needed.`;
                 } else if (backendStatus === 'not_found') {
                     errorMsg = `Restaurant '${item.restaurant_name}' not found anywhere. Add restaurant first.`;
                     nextStatus = 'error'; // Mark as error if restaurant not found
                 } else { // Handle explicit error status or unexpected/missing status
                    errorMsg = `Restaurant lookup failed: ${lookupResult?.message || 'API error or unexpected backend response'}`;
                    nextStatus = 'error';
                 }
                // --- End Logic ---

               return { lineNumber: item._lineNumber, status: nextStatus, error: errorMsg, lookup: lookupResult, restaurantId: foundRestaurantId };
           } catch (lookupError) { console.error(`[BulkAdd Dish Lookup] Line ${item._lineNumber} Error:`, lookupError); return { lineNumber: item._lineNumber, status: 'error', error: `Restaurant lookup failed: ${lookupError.message || 'Unknown'}`, lookup: null, restaurantId: null }; }
       });
       const results = await Promise.allSettled(lookupPromises); const map = new Map(); let errors = false; results.forEach(res => { if (res.status === 'fulfilled' && res.value) { map.set(res.value.lineNumber, { status: res.value.status, error: res.value.error, lookup: res.value.lookup, restaurantId: res.value.restaurantId }); if (res.value.status === 'error') errors = true; } else if (res.status === 'rejected') { const ln=res.reason?.lineNumber??null; const msg=res.reason?.error||res.reason?.message||'Rejected.'; if(ln) map.set(ln,{status:'error',error:msg,lookup:null,restaurantId:null}); errors=true; } }); return { lookupMap: map, lookupErrors: errors };
   }, []); // Dependencies: searchService

    // Performs Google Place Details lookup for items needing it
    const performGoogleLookup = useCallback(async (itemsToCheck) => {
       setProcessingStatus(`Performing Google lookups (${itemsToCheck.length})...`);
       const googleLookupPromises = [];
       itemsToCheck.forEach(item => { if (item.type === 'restaurant' && item._status === 'pending_google_lookup') { googleLookupPromises.push( fetchPlaceDetails(item.name, item.city).then(d => ({ lineNumber: item._lineNumber, details: d })).catch(e => ({ lineNumber: item._lineNumber, error: e })) ); } });
       if (googleLookupPromises.length === 0) return { googleLookupMap: new Map(), googleLookupErrors: false };
       const results = await Promise.allSettled(googleLookupPromises); const map = new Map(); let errors = false; results.forEach(res => { if (res.status === 'fulfilled' && res.value) { if (res.value.error) { map.set(res.value.lineNumber, { error: res.value.error.message || 'Lookup failed.' }); errors = true; } else if (res.value.details === null) { map.set(res.value.lineNumber, { error: 'Place details not found.' }); errors = true; } else { map.set(res.value.lineNumber, { details: res.value.details }); } } else if (res.status === 'rejected') { const ln=res.reason?.lineNumber??null; const msg=res.reason?.message||'Rejected.'; if(ln){ map.set(ln,{error:msg}); } errors=true; } }); return { googleLookupMap: map, googleLookupErrors: errors };
    }, [fetchPlaceDetails]);

  // Verifies 'dish' type items against the internal DB
  const performDishVerification = useCallback(async (itemsToCheck) => {
    setProcessingStatus(`Verifying dish existence (${itemsToCheck.length})...`);
    const verificationPromises = itemsToCheck.map(async (item) => {
        if (item.type !== 'dish' || item._status !== 'pending_dish_verification') {
            return { lineNumber: item._lineNumber, status: item._status, error: item._error };
        }
        try {
            if (!item.name || !item.restaurant_id) {
                throw new Error("Missing name or restaurant ID for dish verification.");
            }
            setProcessingStatus(`Dish line ${item._lineNumber}: Verifying dish "${item.name}" @ Rest ID ${item.restaurant_id}`);
            // Use the actual service call
            const exists = await dishService.verifyDishExists(item.name, item.restaurant_id);
            return {
                lineNumber: item._lineNumber,
                status: exists ? 'db_duplicate' : 'valid',
                error: exists ? 'Dish already exists in database for this restaurant.' : undefined
            };
        } catch (verificationError) {
            console.error(`[BulkAdd Dish Verify] Line ${item._lineNumber} API Error:`, verificationError);
            return {
                lineNumber: item._lineNumber,
                status: 'error',
                error: `Dish verification API failed: ${verificationError.message || 'Unknown'}`
            };
        }
    });
    const results = await Promise.allSettled(verificationPromises);
    const map = new Map();
    let errors = false;
    results.forEach(res => {
        if (res.status === 'fulfilled' && res.value) {
            map.set(res.value.lineNumber, { status: res.value.status, error: res.value.error });
            if (res.value.status === 'error') errors = true;
        } else if (res.status === 'rejected') {
            const ln = res.reason?.lineNumber ?? null;
            const msg = res.reason?.error || res.reason?.message || 'Verification promise rejected.';
            if (ln) map.set(ln, { status: 'error', error: msg });
            errors = true;
        }
    });
    return { verificationMap: map, verificationErrors: errors };
  }, []); // Dependency: dishService

  // --- Main Processing Function ---
  const handleParseAndReview = useCallback(async () => {
    // 1. Reset states & basic validation
    setError(''); setParseError(''); setResults(null); setParsedItemsForReview([]);
    if (!inputData.trim()) { setParseError('Please paste data.'); return; }
    if (isLoadingCities || citiesError || !cities || cities.length === 0 || cityMap.size === 0) { setParseError('City data missing or invalid.'); return; }

    // 2. Start processing
    setIsProcessing(true); setProcessingStatus('Starting...');
    const lines = inputData.trim().split('\n');
    const preliminaryParsedItems = []; const batchDuplicateChecker = new Map();
    let lineNum = 0; let hasInitialErrors = false;

    // 3. Synchronous Parsing & Batch Dup Check
    setProcessingStatus(`Parsing ${lines.length} lines...`);
    for (const line of lines) {
        lineNum++; let itemError = null; let parsedItem = null; let isBatchDuplicate = false; let batchKey = '';
        try {
             const trimmedLine = line.trim(); if (!trimmedLine) continue;
             // --- Updated Parsing Logic ---
             const atMatch = trimmedLine.match(/^([^@]+)@([^;]+)(?:;\s*(.+))?$/);
             let name, type, restaurantHint, cityHint, tagsRaw = '';

             if (atMatch) { // Format: Dish @ Restaurant ; Tags
                 name = atMatch[1]?.trim(); type = 'dish'; restaurantHint = atMatch[2]?.trim();
                 tagsRaw = atMatch[3] ? atMatch[3].trim() : ''; // Tags are optional after semicolon
                 if (!name || !restaurantHint) throw new Error('Invalid "@" format. Needs: Dish Name @ Restaurant Name');
                 cityHint = null; // City is not part of this format
             } else if (trimmedLine.includes(';')) { // Format: Name; Type; Details...
                 const parts = trimmedLine.split(';').map(p => p.trim());
                 if (parts.length < 3) throw new Error('Invalid format. Minimum 3 parts required (Name; Type; Detail).');

                 name = parts[0];
                 type = parts[1]?.toLowerCase();

                 if (type === 'restaurant') {
                     // ** CORRECTED LOGIC **
                     // Check for 4 parts (Name; restaurant; City; Tags)
                     // or 5 parts (Name; restaurant; Ignored; City; Tags)
                     if (parts.length === 4) {
                         cityHint = parts[2]; // City is 3rd part
                         tagsRaw = parts[3] ?? ''; // Tags is 4th part
                     } else if (parts.length >= 5) {
                         cityHint = parts[3]; // City is 4th part (ignore parts[2])
                         tagsRaw = parts[4] ?? ''; // Tags is 5th part
                     } else {
                         // Allows 3 parts (Name; restaurant; City) with no tags
                         if (parts.length === 3) {
                             cityHint = parts[2];
                             tagsRaw = '';
                         } else {
                             throw new Error('Restaurant requires City (pos 3 or 4). Tags optional (pos 4 or 5).');
                         }
                     }
                     if (!cityHint) throw new Error('City name missing for restaurant.');
                     // ** END CORRECTED LOGIC **
                 } else if (type === 'dish') {
                      restaurantHint = parts[2]; // Restaurant Name/ID is always 3rd part
                      if (!restaurantHint) throw new Error('Restaurant Name/ID required for dish (pos 3).');
                      tagsRaw = parts[3] ?? ''; // Tags are always 4th part for dishes
                      cityHint = null; // City not parsed from input for dishes
                 } else {
                      throw new Error(`Invalid type "${type}". Use 'restaurant' or 'dish'.`);
                 }
             } else { throw new Error('Unrecognized format. Use ";" or "@" separators.'); }
             // --- End Updated Parsing Logic ---

             if (!name) throw new Error('Name missing');
             const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
             let restaurantNameHint = null; let restaurantId = null; let cityId = null; let cityNameForLookup = null; let initialStatus = 'pending';

             if (type === 'restaurant') {
                 // Restaurant requires city verification
                 if (!cityHint) throw new Error('City name missing in input for restaurant.'); // Should be caught by parsing now
                 cityId = getCityIdFromName(cityHint, cityMap); if (!cityId) throw new Error(`City '${cityHint}' not found in DB`);
                 cityNameForLookup = cityHint; initialStatus = 'pending_resto_verification'; batchKey = `restaurant::${name.toLowerCase()}::${cityId}`;
                 // Ensure all potential fields exist on the initial object, even if null
                 parsedItem = { _originalLine: trimmedLine, _lineNumber: lineNum, name: name, type: type, city_id: cityId, city: cityNameForLookup, tags: tags, _status: initialStatus, _lookup: null, restaurant_id: null, address: null, neighborhood_id: null, neighborhood: null, place_id: null, latitude: null, longitude: null, zip_code: null, phone: null, website: null, googleMapsUrl: null };
             } else if (type === 'dish') {
                 const possibleId = Number(restaurantHint);
                 if (!isNaN(possibleId) && possibleId > 0) { // Restaurant ID Provided
                     restaurantId = possibleId; batchKey = `dish::${name.toLowerCase()}::${restaurantId}`; initialStatus = 'pending_dish_verification';
                     // City ID remains null as it's not needed for lookup by ID
                     cityId = null; cityNameForLookup = null;
                     parsedItem = { _originalLine: trimmedLine, _lineNumber: lineNum, name: name, type: type, restaurant_id: restaurantId, restaurant_name: null, city_id: cityId, city: cityNameForLookup, tags: tags, _status: initialStatus, _lookup: null, address: null, neighborhood_id: null, neighborhood: null, place_id: null, latitude: null, longitude: null, zip_code: null, phone: null, website: null, googleMapsUrl: null };
                 } else { // Restaurant Name Provided
                     restaurantNameHint = restaurantHint; batchKey = `dish::${name.toLowerCase()}::${restaurantNameHint.toLowerCase()}`; initialStatus = 'pending_resto_lookup';
                     // City ID remains null for city-agnostic lookup
                     cityId = null; cityNameForLookup = null;
                     parsedItem = { _originalLine: trimmedLine, _lineNumber: lineNum, name: name, type: type, restaurant_id: null, restaurant_name: restaurantNameHint, city_id: cityId, city: cityNameForLookup, tags: tags, _status: initialStatus, _lookup: null, address: null, neighborhood_id: null, neighborhood: null, place_id: null, latitude: null, longitude: null, zip_code: null, phone: null, website: null, googleMapsUrl: null };
                 }
             }

             // Batch Duplicate Check
             if (batchKey) { if (batchDuplicateChecker.has(batchKey)) { const firstLine = batchDuplicateChecker.get(batchKey); itemError = `Duplicate in paste (line ${firstLine}).`; isBatchDuplicate = true; const firstItemIndex = preliminaryParsedItems.findIndex(p => p._lineNumber === firstLine); if (firstItemIndex !== -1 && preliminaryParsedItems[firstItemIndex]._status !== 'batch_duplicate') { preliminaryParsedItems[firstItemIndex]._status = 'batch_duplicate'; preliminaryParsedItems[firstItemIndex]._error = `Duplicate in paste (line ${lineNum}).`; } } else { batchDuplicateChecker.set(batchKey, lineNum); } }
             // Finalize Parsed Item
             if (isBatchDuplicate) { if (parsedItem) { parsedItem._status = 'batch_duplicate'; parsedItem._error = itemError; } else { parsedItem = { _originalLine: trimmedLine, _lineNumber: lineNum, name: name || '?', type: type || '?', _status: 'batch_duplicate', _error: itemError, _lookup: null }; } hasInitialErrors = true; }
             else if (itemError) { parsedItem = { _originalLine: trimmedLine, _lineNumber: lineNum, name: name || '?', type: type || '?', _status: 'error', _error: itemError, _lookup: null }; hasInitialErrors = true; }
             parsedItem = parsedItem || { _originalLine: trimmedLine, _lineNumber: lineNum, name: '?', type: '?', _status: 'error', _error: 'Parse failed.', _lookup: null };
        } catch (parseErr) { itemError = parseErr.message; parsedItem = { _originalLine: line.trim(), _lineNumber: lineNum, name: line.trim().split(/;|@/)[0] || '?', type: '?', _status: 'error', _error: itemError, _lookup: null }; hasInitialErrors = true; }
        preliminaryParsedItems.push(parsedItem);
    } // End parsing loop

    // --- Asynchronous Processing Steps ---
    let currentItems = [...preliminaryParsedItems];
    let hasProcessingErrors = hasInitialErrors;

    // 4. Restaurant Verification (Requires cityId)
    const itemsForRestoVerify = currentItems.filter(item => item._status === 'pending_resto_verification');
    if (itemsForRestoVerify.length > 0) {
        const { verificationMap, verificationErrors } = await performRestaurantVerification(itemsForRestoVerify);
        hasProcessingErrors = hasProcessingErrors || verificationErrors;
        currentItems = currentItems.map(item => { if (verificationMap.has(item._lineNumber)) { const { status, error, lookup, restaurantId } = verificationMap.get(item._lineNumber);
            // Store existing DB ID if found (even if low score/review needed), helps linking later
            const resolvedRestaurantId = lookup?.data?.id ?? item.restaurant_id;
            return { ...item, _status: status, _error: error, _lookup: lookup, restaurant_id: resolvedRestaurantId };
         } return item; });
    }

    // 5. Dish Restaurant Lookup (City Agnostic)
    const itemsForDishRestoLookup = currentItems.filter(item => item._status === 'pending_resto_lookup');
     if (itemsForDishRestoLookup.length > 0) {
        const { lookupMap, lookupErrors } = await performDishRestaurantLookup(itemsForDishRestoLookup);
        hasProcessingErrors = hasProcessingErrors || lookupErrors;
        currentItems = currentItems.map(item => { if (lookupMap.has(item._lineNumber)) { const { status, error, lookup, restaurantId } = lookupMap.get(item._lineNumber);
            // Store city info from lookup result if successful
            const foundCityId = lookup?.status === 'found' ? lookup.data?.city_id : item.city_id; // Get city ID from found restaurant
            const foundCityName = lookup?.status === 'found' ? lookup.data?.city_name : item.city; // Get city name
            return { ...item, _status: status, _error: error, _lookup: lookup, restaurant_id: restaurantId ?? item.restaurant_id, city_id: foundCityId, city: foundCityName }; // Update city info
         } return item; });
     }

    // 6. Google Place Lookup
    const itemsForGoogleLookup = currentItems.filter(item => item._status === 'pending_google_lookup');
    if (itemsForGoogleLookup.length > 0) {
        const { googleLookupMap, googleLookupErrors } = await performGoogleLookup(itemsForGoogleLookup);
        hasProcessingErrors = hasProcessingErrors || googleLookupErrors;
        setProcessingStatus('Matching neighborhoods...');
         // Process Google results and neighborhood matching sequentially
         for (let i = 0; i < currentItems.length; i++) {
             let item = currentItems[i];
             // Only process items that were pending and now have a result in the map
             if (item._status === 'pending_google_lookup' && googleLookupMap.has(item._lineNumber)) {
                  const lookupResult = googleLookupMap.get(item._lineNumber);
                  let nextStatus = 'error';
                  let currentError = item._error; // Preserve existing error (like db_duplicate reason)
                  let updatedItemData = {}; // Define this properly within scope

                  if (lookupResult?.error) {
                       nextStatus = 'error';
                       currentError = `Google lookup failed: ${lookupResult.error}`;
                       // --- ADDED DEBUG LOG ---
                       console.error(`[DEBUG Line ${item._lineNumber}] Google Lookup FAILED or no details. Error:`, lookupResult?.error);
                  } else if (lookupResult?.details) {
                       const placeDetails = lookupResult.details;
                       // --- ADDED DEBUG LOG ---
                       console.log(`[DEBUG Line ${item._lineNumber}] Google Place Details Received:`, placeDetails);

                       const zipcode = placeDetails?.zipcode;
                       const googleNeighborhoodName = placeDetails?.neighborhood;
                       let neighborhoodId = null;
                       let neighborhoodName = null;
                       let nbRes = null; // To store neighborhood result

                        // --- Neighborhood lookup logic ---
                         if (zipcode && item.city_id) { // Need city_id for zip lookup context
                              try {
                                   nbRes = await filterService.findNeighborhoodByZipcode(zipcode.trim());
                                   // --- ADDED DEBUG LOG ---
                                   console.log(`[DEBUG Line ${item._lineNumber}] Neighborhood by Zip (${zipcode}, City ${item.city_id}) Result:`, nbRes);
                                   if (nbRes && Number(nbRes.city_id) === Number(item.city_id)) {
                                        neighborhoodId = Number(nbRes.id);
                                        neighborhoodName = nbRes.name;
                                   } else {
                                       neighborhoodName = googleNeighborhoodName; // Zip found but wrong city or not found by zip
                                   }
                              } catch (e) {
                                   // --- ADDED DEBUG LOG ---
                                   console.error(`[DEBUG Line ${item._lineNumber}] Zip Lookup Error:`, e);
                                   neighborhoodName = googleNeighborhoodName; // Error during zip lookup
                              }
                         } else {
                             neighborhoodName = googleNeighborhoodName; // No zipcode, use Google's name
                         }

                         // Try matching by name if ID wasn't found via zip
                         if (neighborhoodId === null && neighborhoodName && item.city_id) {
                              try {
                                   const cityNbs = await getNeighborhoodsForCity(item.city_id);
                                   const matchedNb = cityNbs.find(nb => nb.name.toLowerCase() === neighborhoodName.toLowerCase());
                                   if (matchedNb) {
                                       neighborhoodId = matchedNb.id;
                                    }
                              } catch (e) { /* ignore error */ }
                         }

                         // Final assignment based on Google name if still no ID
                         if (neighborhoodId === null && googleNeighborhoodName) {
                            neighborhoodName = googleNeighborhoodName;
                         } else if (neighborhoodId === null) {
                            // If ID is still null and Google didn't provide a name either
                            neighborhoodName = null;
                         }
                         // --- End Neighborhood lookup ---

                         updatedItemData = {
                              neighborhood_id: neighborhoodId,
                              neighborhood: neighborhoodName,
                              address: placeDetails?.formattedAddress || null,
                              place_id: placeDetails?.placeId || null,
                              latitude: placeDetails?.location?.lat || null,
                              longitude: placeDetails?.location?.lng || null,
                              zip_code: zipcode, // Store zipcode from Google
                              phone: placeDetails?.phone || null, // Store phone from Google
                              website: placeDetails?.website || null, // Store website from Google
                              googleMapsUrl: placeDetails?.googleMapsUrl || null // Store maps URL
                         };
                         // --- ADDED DEBUG LOG ---
                         console.log(`[DEBUG Line ${item._lineNumber}] Final Updated Data Object:`, updatedItemData);

                         // Decide final status: Keep db_duplicate if it was set, otherwise valid
                         nextStatus = item._error?.includes("already exists") ? 'db_duplicate' : 'valid';
                         currentError = nextStatus === 'db_duplicate' ? item._error : undefined; // Keep error only if duplicate
                         // await new Promise(resolve => setTimeout(resolve, 30)); // Short pause no longer needed with await inside loop

                   } else {
                        // Case where lookupResult exists but details are missing (shouldn't happen if check in performGoogleLookup is correct)
                        nextStatus = 'error';
                        currentError = 'Google lookup returned no details.';
                        // --- ADDED DEBUG LOG ---
                        console.error(`[DEBUG Line ${item._lineNumber}] Google Lookup returned no details. LookupResult:`, lookupResult);
                   }
                   // Update the item in the array
                   currentItems[i] = { ...item, ...updatedItemData, _status: nextStatus, _error: currentError };
                   // --- ADDED DEBUG LOG ---
                   console.log(`[DEBUG Line ${item._lineNumber}] Item state AFTER update:`, currentItems[i]);
                   if (nextStatus === 'error') hasProcessingErrors = true;
             }
             // Add a small delay to prevent UI freeze and allow status updates to render if needed
             await new Promise(resolve => setTimeout(resolve, 5));
         } // End loop through items for Google processing
    }

    // 7. Dish Verification
     const itemsToVerifyDish = currentItems.filter(item => item._status === 'pending_dish_verification');
     if (itemsToVerifyDish.length > 0) {
         const { verificationMap, verificationErrors } = await performDishVerification(itemsToVerifyDish);
         hasProcessingErrors = hasProcessingErrors || verificationErrors;
         currentItems = currentItems.map(item => { if (verificationMap.has(item._lineNumber)) { const { status: newStatus, error: newError } = verificationMap.get(item._lineNumber); return { ...item, _status: newStatus, _error: newError }; } return item; });
     }

    // 8. Final Cleanup & State Update
    let finalParsedItems = currentItems.map(item => { // Catch any leftover pending states
        if (item._status.startsWith('pending_')) {
            console.warn(`[BulkAdd] Item line ${item._lineNumber} finished in unexpected state: ${item._status}. Marking error.`);
            hasProcessingErrors = true;
            return { ...item, _status: 'error', _error: item._error || `Processing incomplete (stuck in ${item._status})` };
        } return item;
    });

    setParsedItemsForReview(finalParsedItems); setIsInReviewMode(true); setIsProcessing(false);
    const finalStatusMessage = hasProcessingErrors ? 'Processing complete. Review errors/warnings.' : 'Processing complete. Review items.';
    setProcessingStatus(finalStatusMessage); if (hasProcessingErrors) setParseError("Some items need attention. Check 'Status'.");

  }, [inputData, isSuperuser, cities, isLoadingCities, citiesError, cityMap, getNeighborhoodsForCity, performRestaurantVerification, performDishRestaurantLookup, performGoogleLookup, performDishVerification]); // Added all processing functions

  // --- Submission and Modal Handlers ---
  const handleConfirmSubmit = useCallback(async () => {
     setError(''); setParseError(''); setResults(null); let firstInvalidItem = null;
     // Filter items strictly: only 'valid' status allowed for submission
     const itemsToSubmit = parsedItemsForReview.filter(item => {
         const block = ['error', 'removed', 'review_needed', 'batch_duplicate', 'db_duplicate', 'pending_resto_verification', 'pending_resto_lookup', 'pending_google_lookup', 'pending_dish_verification'].includes(item._status);
         if (block && !firstInvalidItem && item._status !== 'removed') firstInvalidItem = { ...item, _error: item._error || `Status (${item._status}) prevents submission.` };
         if (block) return false;
         // Final checks
         if (item.type === 'restaurant' && !item.city_id) { if (!firstInvalidItem) firstInvalidItem = { ...item, _error: "Restaurant missing City ID." }; return false; }
         // For dishes, restaurant_id must be set, city_id might be null if looked up by name
         if (item.type === 'dish' && !item.restaurant_id) { if (!firstInvalidItem) firstInvalidItem = { ...item, _error: "Dish missing verified Restaurant ID." }; return false; }
         if (!item.type || !ALLOWED_BULK_ADD_TYPES.includes(item.type)) { if (!firstInvalidItem) firstInvalidItem = { ...item, _error: `Invalid type.` }; return false; }
         return item._status === 'valid'; // Only submit 'valid' items
     });
     if (firstInvalidItem) { setError(`Submission aborted: Item line ${firstInvalidItem._lineNumber} ("${firstInvalidItem.name}") needs attention: ${firstInvalidItem._error}. Status: ${firstInvalidItem._status}.`); return; }
     if (itemsToSubmit.length === 0) { setError("No valid items to submit."); return; }
     setIsSubmitting(true); setProcessingStatus(`Submitting ${itemsToSubmit.length} items...`);
     // Clean payload for backend: include all relevant fields discovered during processing
      const cleanedItems = itemsToSubmit.map(item => {
          const {
              _originalLine, _lineNumber, _status, _error, _lookup,
              city, // Use city_name/city_id from item
              neighborhood, // Use neighborhood_name/neighborhood_id from item
              restaurant_name, // Frontend display only
              googleMapsUrl, // Don't send this intermediate field
              ...rest // Keep core fields like name, type, tags, address, zip_code, phone, website, etc.
          } = item;

          // Ensure numeric fields are numbers or null
           ['city_id', 'neighborhood_id', 'restaurant_id', 'latitude', 'longitude'].forEach(k => {
               if (rest[k] !== undefined && rest[k] !== null && rest[k] !== '') {
                   const num = Number(rest[k]);
                   rest[k] = isNaN(num) ? null : num; // Set null if conversion fails
               } else {
                   rest[k] = null; // Ensure null if empty/undefined
               }
           });

          // Ensure tags is an array
          rest.tags = Array.isArray(rest.tags) ? rest.tags : [];

          // Add explicit *_name fields if they exist on the item, for backend reference/denormalization if needed
          if (item.city) rest.city_name = item.city;
          if (item.neighborhood) rest.neighborhood_name = item.neighborhood;

          // Remove specific fields not needed by backend create models (these were intermediate)
          delete rest.city;
          delete rest.neighborhood;
          delete rest.restaurant_name;

          return rest;
      });
     console.log('[BulkAdd] Submitting cleaned payload:', JSON.stringify({ items: cleanedItems }, null, 2));
     try {
        // Call backend bulk add service
        const response = await adminService.bulkAddAdminItems(cleanedItems); // Use the dedicated adminService function

        if (response.success && response.data) {
             setResults(response.data); // Expect { processedCount, addedCount, skippedCount, errorCount, details: [...] }
             const { addedCount = 0, skippedCount = 0, errorCount = 0, processedCount = 0 } = response.data;
             const backendReviewNeeded = response.data.details?.filter(d => d.status === 'review_needed').length || 0;
             setProcessingStatus(`Backend response: Processed ${processedCount}. Added: ${addedCount}, Skipped: ${skippedCount}, Review: ${backendReviewNeeded}, Errors: ${errorCount}.`);
             // Reset UI states after successful submission
             setInputData(''); setParsedItemsForReview([]); setIsInReviewMode(false); setNeighborhoodCache({});
        } else {
            // Handle backend error response
            throw new Error(response.error || response.message || response.data?.message || "Backend submission failed.");
        }
     } catch (apiErr) { console.error("[BulkAdd] Submission API error:", apiErr); setError(`Submission Failed: ${apiErr.message || "Unknown error."}`); setProcessingStatus("Submission failed."); }
     finally { setIsSubmitting(false); }
  }, [parsedItemsForReview]);

  const handleCancelReview = useCallback(() => { setIsInReviewMode(false); setParsedItemsForReview([]); setProcessingStatus(''); setError(''); setParseError(''); setNeighborhoodCache({}); setIsSuggestionModalOpen(false); setReviewingItem(null); }, []);
  const handleRemoveItemFromReview = useCallback((lineNumber) => { setParsedItemsForReview(prev => prev.map(item => item._lineNumber === lineNumber ? { ...item, _status: 'removed' } : item )); }, []);
  const handleOpenSuggestionModal = useCallback((item) => { if (item && item._status === 'review_needed' && item._lookup && (item._lookup.status === 'suggestions' || item._lookup.status === 'found')) { setReviewingItem(item); setIsSuggestionModalOpen(true); } else { console.warn("Cannot open suggestion modal for item:", item); } }, []);
  const handleCloseSuggestionModal = useCallback(() => { setIsSuggestionModalOpen(false); setReviewingItem(null); }, []);

  // Handles selection from suggestion modal - Updated to pass city info from selectedData
  const handleSuggestionSelected = useCallback(async (selectedData) => { // Make async
        if (!reviewingItem || !selectedData?.id) { setError("Error applying selection."); handleCloseSuggestionModal(); return; }
        let nextStatus = 'error'; let updatedFields = {};
        const originalItemLineNumber = reviewingItem._lineNumber; // Store line number

        // Update item fields based on selected data, including city info
        if (reviewingItem.type === 'dish') {
             nextStatus = 'pending_dish_verification';
             updatedFields = {
                 restaurant_id: selectedData.id,
                 restaurant_name: selectedData.name, // Store resolved name
                 city_id: selectedData.city_id, // Store resolved city_id
                 city: selectedData.city_name, // Store resolved city name
                 // Inherit neighborhood/address from selected restaurant for context
                 neighborhood_id: selectedData.neighborhood_id || null,
                 neighborhood: selectedData.neighborhood_name || null,
                 address: selectedData.address || null,
             };
        } else if (reviewingItem.type === 'restaurant') {
             nextStatus = 'pending_google_lookup';
             // Use selected data, ensure city info is present
              updatedFields = {
                  restaurant_id: selectedData.id, // Store resolved DB ID if different
                  name: selectedData.name, // Update name if different
                  city_id: selectedData.city_id,
                  city: selectedData.city_name,
                  // Preserve original tags, but use address/neighborhood from suggestion
                  address: selectedData.address || reviewingItem.address,
                  neighborhood_id: selectedData.neighborhood_id || reviewingItem.neighborhood_id,
                  neighborhood: selectedData.neighborhood_name || reviewingItem.neighborhood,
                  // Clear potentially inaccurate Google data if resolving from DB suggestion
                  place_id: null, latitude: null, longitude: null, zip_code: null,
              };
        } else { setError(`Cannot resolve for type: ${reviewingItem.type}`); handleCloseSuggestionModal(); return; }

        // Update the item in the state immediately for UI feedback
        const updatedItemsForState = parsedItemsForReview.map(i =>
             i._lineNumber === originalItemLineNumber
             ? {
                ...i,
                ...updatedFields,
                _status: nextStatus,
                _lookup: { status: 'found', data: { ...selectedData } }, // Store selected suggestion
                _error: undefined // Clear previous review error
             }
             : i
        );
        setParsedItemsForReview(updatedItemsForState);
        handleCloseSuggestionModal(); // Close modal immediately

        // --- Trigger next async step based on the new status ---
        // Filter the *updated* items array to get the item we just modified
        const itemsForNextStep = updatedItemsForState.filter(item => item._lineNumber === originalItemLineNumber);
        if (itemsForNextStep.length === 0) return; // Should not happen

        if (nextStatus === 'pending_dish_verification') {
             try {
                 const { verificationMap, verificationErrors } = await performDishVerification(itemsForNextStep);
                 // Update state again with the result of the verification
                 setParsedItemsForReview(currentItems => currentItems.map(item => {
                      if (verificationMap.has(item._lineNumber)) {
                           const { status, error } = verificationMap.get(item._lineNumber);
                           return { ...item, _status: status, _error: error };
                      }
                      return item;
                 }));
                 if (verificationErrors) setParseError("Dish verification failed after resolving suggestion.");
             } catch (err) { setError(`Dish verification error after resolving suggestion: ${err.message}`); }
        } else if (nextStatus === 'pending_google_lookup') {
             try {
                const { googleLookupMap, googleLookupErrors } = await performGoogleLookup(itemsForNextStep);
                let itemsAfterGoogle = [...updatedItemsForState]; // Use the already updated state
                let hasErrors = googleLookupErrors;
                setProcessingStatus('Matching neighborhoods after resolving suggestion...');

                for (let i = 0; i < itemsAfterGoogle.length; i++) {
                    let item = itemsAfterGoogle[i];
                    // Only process the specific item we resolved
                    if (item._lineNumber === originalItemLineNumber && item._status === 'pending_google_lookup') {
                        const lookupResult = googleLookupMap.get(item._lineNumber);
                        let finalStatus = 'error'; let googleError = 'Google lookup failed.'; let googleData = {};
                        if (lookupResult?.details) {
                            // ... [Same Google Detail Processing & Neighborhood Lookup Logic as in handleParseAndReview] ...
                            const d = lookupResult.details;
                            const zip = d?.zipcode;
                            const gNb = d?.neighborhood;
                            let nbId = null; let nbName = null;
                            if (zip && item.city_id) {
                                try {
                                    const r = await filterService.findNeighborhoodByZipcode(zip.trim());
                                    if (r && Number(r.city_id)===Number(item.city_id)) { nbId=Number(r.id); nbName=r.name; } else { nbName=gNb; }
                                } catch (e){nbName=gNb;}
                            } else { nbName=gNb; }
                            if (nbId === null && nbName && item.city_id) {
                                try {
                                    const cN=await getNeighborhoodsForCity(item.city_id);
                                    const mN=cN.find(n=>n.name.toLowerCase()===nbName.toLowerCase());
                                    if(mN){nbId=mN.id;}
                                } catch(e){}
                            }
                            if (nbId===null && gNb) nbName=gNb; else if (nbId === null) nbName=null;
                            googleData = {
                                neighborhood_id: nbId, neighborhood: nbName,
                                address: d?.formattedAddress || null, place_id: d?.placeId || null,
                                latitude: d?.location?.lat || null, longitude: d?.location?.lng || null,
                                zip_code: zip,
                                phone: d?.phone || null,
                                website: d?.website || null,
                                googleMapsUrl: d?.googleMapsUrl || null,
                            };
                            finalStatus = 'valid'; googleError = undefined;
                        } else { googleError = lookupResult?.error || googleError; hasErrors = true; }
                        itemsAfterGoogle[i] = { ...item, ...googleData, _status: finalStatus, _error: googleError };
                    }
                }
                setParsedItemsForReview(itemsAfterGoogle); // Update state with Google results
                setProcessingStatus(''); // Clear status message
                if (hasErrors) setParseError("Google lookup failed after resolving suggestion.");
            } catch (err) { setError(`Google lookup error after resolving suggestion: ${err.message}`); }
        }
   }, [reviewingItem, parsedItemsForReview, handleCloseSuggestionModal, performDishVerification, performGoogleLookup, getNeighborhoodsForCity, filterService]);


  // --- Render Logic ---
  const displayError = error || parseError;
  if (!isAuthenticated || !isSuperuser()) { return ( <div className="container mx-auto px-4 py-8 text-center"><AlertTriangle size={48} className="mx-auto text-red-500 mb-4" /><h1 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h1><p className="text-gray-600 mb-4">No permission.</p><Button onClick={() => navigate('/')} variant="primary">Go Home</Button></div> ); }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
       <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4 flex items-center"> <ArrowLeft size={16} className="mr-1" /> Back </Button>
       <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Bulk Add Tool</h1>

      {!isInReviewMode ? (
          <> {/* Input Mode */}
               <p className="text-sm text-gray-600 mb-4"> Paste data (one item per line). Formats: </p>
              <ul className="list-disc list-inside text-xs text-gray-500 mb-4 italic space-y-1">
                   {/* Updated Format Explanations */}
                  <li> Restaurant (5 parts): `Name; restaurant; Ignored/ChainInfo; City Name; Tag1,Tag2`</li>
                  <li> Restaurant (4 parts): `Name; restaurant; City Name; Tag1,Tag2`</li>
                  <li> Dish (by ID): `Name; dish; Restaurant ID; Tag1,Tag2`</li>
                  <li> Dish (by Name): `Name; dish; Restaurant Name; Tag1,Tag2`</li>
                  <li> Dish (by Name @): `Dish Name @ Restaurant Name ; Tag1,Tag2`</li>
              </ul>
              <p className="text-xs text-gray-500 mb-4 italic"> Examples:<br/> `Peter Luger Steak House; restaurant; N/A; Brooklyn; steakhouse,classic`<br/> `Kochi; restaurant; New York; korean, tasting menu`<br/> `Margherita Pizza; dish; 123; pizza` (Uses Rest ID 123)<br/> `Spicy Rigatoni Vodka; dish; Carbone; italian,pasta` (Looks for 'Carbone' everywhere)<br/> `Chopped Cheese @ Harlem Bodega ; sandwich,late night` (Looks for 'Harlem Bodega' everywhere) </p>
              {/* Input Area */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <textarea value={inputData} onChange={handleInputChange} placeholder="Peter Luger Steak House; restaurant; N/A; Brooklyn; steakhouse..." className="w-full h-60 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm font-mono" disabled={isProcessing} aria-label="Bulk data input"/>
                  {isProcessing && processingStatus && ( <p className="mt-3 text-sm text-blue-600 flex items-center justify-center"> <Loader2 className="animate-spin h-4 w-4 mr-2" /> {processingStatus} </p> )}
                  {displayError && ( <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"> {displayError} </p> )}
                  <div className="mt-4 flex justify-end"> <Button onClick={handleParseAndReview} variant="primary" disabled={isProcessing || isLoadingCities || !inputData.trim()} className="flex items-center gap-2 min-w-[160px] justify-center disabled:opacity-60"> {isProcessing ? (<><Loader2 className="animate-spin h-4 w-4" /> Processing...</>) : isLoadingCities ? (<><Loader2 className="animate-spin h-4 w-4" /> Loading Cities...</>) : (<><Eye size={16} /> Parse & Review</>)} </Button> </div>
              </div>
          </>
      ) : (
          <> {/* Review Mode */}
              <h2 className="text-xl font-semibold text-gray-700 mb-3">Review Items</h2>
              {processingStatus && <p className="text-sm text-blue-600 mb-3">{processingStatus}</p>}
              {displayError && ( <p role="alert" className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center"> {displayError} </p> )}
              {/* Review Table */}
              <div className="bg-white p-0 rounded-lg shadow-sm border border-gray-100 max-h-[60vh] overflow-y-auto mb-4">
                 <table className="min-w-full text-xs">
                     <thead className="sticky top-0 z-10 bg-gray-100"> <tr className="border-b text-left"> <th className="p-2 font-medium">#</th> <th className="p-2 font-medium">Name</th> <th className="p-2 font-medium">Type</th> <th className="p-2 font-medium">City (Found/Req.)</th> <th className="p-2 font-medium">Neighborhood (ID)</th> <th className="p-2 font-medium">Address</th> <th className="p-2 font-medium">Restaurant Info</th> <th className="p-2 font-medium">Tags</th> <th className="p-2 font-medium">Status</th> <th className="p-2 font-medium text-center">Actions</th> </tr> </thead>
                     <tbody>
                         {parsedItemsForReview.map((item, index) => { /* ... Row rendering logic ... */ let rowBgClass = 'hover:bg-gray-50'; if (item._status === 'error') rowBgClass = 'bg-red-50 hover:bg-red-100'; else if (item._status === 'removed') rowBgClass = 'bg-gray-100 text-gray-400 line-through hover:bg-gray-200'; else if (item._status === 'review_needed') rowBgClass = 'bg-blue-50 hover:bg-blue-100'; else if (item._status === 'batch_duplicate') rowBgClass = 'bg-orange-50 hover:bg-orange-100'; else if (item._status === 'db_duplicate') rowBgClass = 'bg-yellow-50 hover:bg-yellow-100'; else if (item._status.startsWith('pending_')) rowBgClass = 'bg-purple-50 hover:bg-purple-100'; return ( <tr key={item._lineNumber || index} className={`border-b last:border-b-0 ${rowBgClass} transition-colors duration-150`}> <td className="p-2 text-gray-500">{item._lineNumber}</td> <td className="p-2 font-medium text-gray-800">{item.name || '?'}</td> <td className="p-2 capitalize text-gray-700">{item.type || '?'}</td> <td className="p-2 text-gray-600">{item.city || (item.type==='restaurant' ? '?' : '-')} ({item.city_id || 'N/A'})</td> <td className="p-2 text-gray-600">{item.type === 'restaurant' ? (`${item.neighborhood || '-'} (${item.neighborhood_id ?? '?'})`) : (item.neighborhood ? `${item.neighborhood} (${item.neighborhood_id ?? '?'})` : '-')}</td> <td className="p-2 text-gray-600 max-w-xs truncate" title={item.address || ''}>{item.address || '-'}</td> {/* Restaurant Info Cell */} <td className="p-2 text-gray-600"> {item.type === 'dish' ? ( <span className="flex items-center gap-1 flex-wrap"> <span>{item._lookup?.status === 'found' ? item._lookup.data.name : item.restaurant_name || `ID: ${item.restaurant_id}` || '?'}</span> {item.restaurant_id && <span className="text-gray-500">(ID:{item.restaurant_id})</span>} {(item._status === 'valid' || item._status === 'db_duplicate' || item._status === 'pending_dish_verification') && item.restaurant_id && <CheckCircle size={14} className="text-green-600 inline ml-1" title={`Restaurant Found/Verified (ID: ${item.restaurant_id})`}/>} {item._status === 'review_needed' && <HelpCircle size={14} className="text-blue-600 inline ml-1 cursor-pointer" title="Review needed" onClick={() => handleOpenSuggestionModal(item)}/>} {item._lookup?.status === 'not_found' && <AlertCircle size={14} className="text-orange-600 inline ml-1" title={`Not Found: ${item.restaurant_name}`}/>} {item._lookup?.status === 'error' && item._status !== 'error' && <AlertCircle size={14} className="text-red-600 inline ml-1" title={`Lookup Error`}/>} {item._status === 'pending_resto_lookup' && <Loader2 size={14} className="text-purple-600 inline ml-1 animate-spin" title="Looking up..."/>} </span> ) : item.type === 'restaurant' ? ( <span className="flex items-center gap-1 flex-wrap"> {item.restaurant_id && <span className="text-gray-500">(DB ID:{item.restaurant_id})</span>} {item._status === 'db_duplicate' && <Info size={14} className="text-yellow-700 inline ml-1" title={item._error || "Exists in DB."}/>} {item._status === 'valid' && item.address && <CheckCircle size={14} className="text-green-600 inline ml-1" title="Details fetched."/>} {item._status === 'review_needed' && <HelpCircle size={14} className="text-blue-600 inline ml-1 cursor-pointer" title="Review needed" onClick={() => handleOpenSuggestionModal(item)}/>} {item._status === 'pending_resto_verification' && <Loader2 size={14} className="text-purple-600 inline ml-1 animate-spin" title="Verifying..."/>} {item._status === 'pending_google_lookup' && <Loader2 size={14} className="text-purple-600 inline ml-1 animate-spin" title="Fetching details..."/>} {item._status === 'error' && <AlertCircle size={14} className="text-red-600 inline ml-1" title={`Error: ${item._error || '?'}`}/>} </span> ) : '-'} </td> {/* Tags Cell */} <td className="p-2 text-gray-600">{(item.tags || []).join(', ') || '-'}</td> {/* Status Cell */} <td className={`p-2 font-medium whitespace-nowrap ${ item._status === 'error' ? 'text-red-600' : item._status === 'removed' ? 'text-gray-500' : item._status === 'review_needed' ? 'text-blue-600' : item._status === 'valid' ? 'text-green-600' : item._status === 'batch_duplicate' ? 'text-orange-600' : item._status === 'db_duplicate' ? 'text-yellow-700' : item._status.startsWith('pending_') ? 'text-purple-600' : 'text-gray-700' }`}> <span title={item._error || item._status} className="flex items-center gap-1"> {item._status === 'error' && <><AlertCircle size={14} /> Error</>} {item._status === 'review_needed' && <><HelpCircle size={14}/> Review</>} {item._status === 'removed' && 'Removed'} {item._status === 'valid' && <><CheckCircle size={14}/> Valid</>} {item._status === 'batch_duplicate' && <><Copy size={14}/> Batch Dup.</>} {item._status === 'db_duplicate' && <><Info size={14}/> Exists</>} {item._status.startsWith('pending_') && <><Loader2 size={14} className="animate-spin"/> Pending</>} </span> </td> {/* Actions Cell */} <td className="p-2 text-center"> {item._status !== 'removed' && ( <Button variant="tertiary" size="sm" className="!p-1 text-red-500 hover:bg-red-100" onClick={() => handleRemoveItemFromReview(item._lineNumber)} disabled={isSubmitting || isProcessing} title="Remove"><Trash2 size={14}/></Button> )} {item._status === 'review_needed' && ( <Button variant="tertiary" size="sm" className="!p-1 text-blue-500 hover:bg-blue-100 ml-1" onClick={() => handleOpenSuggestionModal(item)} disabled={isSubmitting || isProcessing} title="Resolve"><Edit size={14}/></Button> )} </td> </tr> ) })} </tbody>
                 </table>
              </div>
                {/* Bottom Actions */}
                 <div className="flex justify-between items-center"> <Button variant="tertiary" onClick={handleCancelReview} disabled={isSubmitting || isProcessing}>Cancel Review</Button> <div className="flex items-center gap-2"> <span className="text-sm text-gray-600">{parsedItemsForReview.filter(i => i._status === 'valid').length} valid items will be submitted.</span> <Button onClick={handleConfirmSubmit} variant="primary" disabled={isSubmitting || isProcessing || parsedItemsForReview.filter(i => i._status === 'valid').length === 0} className="flex items-center gap-2 min-w-[160px] justify-center disabled:opacity-60"> {isSubmitting ? (<><Loader2 className="animate-spin h-4 w-4" /> Submitting...</>) : (<><Upload size={16} /> Submit Valid</>)} </Button> </div> </div>
               {/* Backend Result Display */}
                {results && !isSubmitting && !isProcessing && ( <div className="mt-4 p-3 border rounded-md bg-gray-50 max-h-60 overflow-y-auto"> <p className="text-sm font-medium text-gray-800 mb-2">{results.message || `Processed ${results.processedCount || 0}.`}</p> <ul className="space-y-1 text-xs">{results.details?.map((detail, index) => ( <li key={index} className={`flex items-start gap-2 p-1 rounded ${ detail.status === 'added' ? 'bg-green-50 text-green-800' : detail.status === 'skipped' ? 'bg-yellow-50 text-yellow-800' : detail.status === 'review_needed' ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-800' }`}> {detail.status === 'added' ? <Check size={14}/> : detail.status === 'skipped' ? <Info size={14}/> : detail.status === 'review_needed' ? <HelpCircle size={14}/> : <AlertCircle size={14}/>} <span className="flex-grow"> <span className="font-semibold">{detail.input?.name}</span> ({detail.input?.type}, Line: {detail.input?.line}) - <span className='font-medium uppercase'>{detail.status}</span> {detail.reason && <span className="italic text-gray-600"> - {detail.reason}</span>} {detail.id && detail.status === 'added' && <span className="text-gray-500"> (ID: {detail.id})</span>} {detail.status === 'review_needed' && detail.suggestions?.length > 0 && ( <span className="text-xxs block pl-4"> Suggestions: {detail.suggestions.map(s => `${s.name} (ID: ${s.id})`).join(', ')}</span> )} </span> </li> ))} </ul> </div> )}
          </>
       )}

        {/* Suggestion Resolution Modal */}
        <Modal isOpen={isSuggestionModalOpen} onClose={handleCloseSuggestionModal} title={`Resolve ${reviewingItem?.type || ''}: ${reviewingItem?.name || ''}`}>
            {reviewingItem && (
                <div className="text-sm">
                    <p className="mb-3"> Potential matches found for {reviewingItem.type === 'restaurant' ? 'restaurant' : 'dish restaurant'}: <strong className="font-medium">"{reviewingItem.type === 'restaurant' ? reviewingItem.name : reviewingItem.restaurant_name}"</strong>. </p>
                    <p className="mb-4 font-semibold text-gray-700">Select correct restaurant:</p>
                    <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {(Array.isArray(reviewingItem._lookup?.data)
                            ? reviewingItem._lookup.data // Case: 'suggestions'
                            : (reviewingItem._lookup?.status === 'found' && reviewingItem._lookup.data ? [reviewingItem._lookup.data] : []) // Case: 'found'
                        ).map((suggestion) => (
                             <li key={suggestion.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                                 <div>
                                     <p className="font-medium text-gray-800">{suggestion.name}</p>
                                     {suggestion.city_name && <p className="text-xs text-gray-600 font-semibold">{suggestion.city_name}</p>}
                                     {suggestion.address && ( <p className="text-xs text-gray-500 flex items-center mt-0.5"> <MapPin size={12} className="mr-1"/> {suggestion.address} </p> )}
                                     {typeof suggestion.score === 'number' && <p className="text-xxs text-gray-400">Score: {suggestion.score.toFixed(2)}</p>}
                                 </div>
                                 <Button variant="secondary" size="sm" onClick={() => handleSuggestionSelected(suggestion)} className="ml-2"> Select </Button>
                             </li>
                        ))}
                    </ul>
                    <div className="mt-5 flex justify-end"> <Button variant="tertiary" onClick={handleCloseSuggestionModal}> Cancel </Button> </div>
                </div>
            )}
        </Modal>

    </div> // End container
  );
};

export default BulkAdd;