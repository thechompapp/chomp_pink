// src/pages/BulkAdd/index.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, AlertTriangle, Info, Check, X as IconX } from 'lucide-react'; // Renamed X to IconX
import Button from '@/components/Button';
import useAuthStore from '@/stores/useAuthStore';
import apiClient from '@/services/apiClient';
import { placeService } from '@/services/placeService'; // Import placeService
import { GOOGLE_PLACES_API_KEY } from '@/config';

const BulkAdd = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSuperuser = useAuthStore(state => state.isSuperuser());

  const [inputData, setInputData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(''); // For detailed status updates
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // Store detailed results { addedCount, skippedCount, message, details }
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isSuperuser && !GOOGLE_PLACES_API_KEY) {
      setIsApiKeyMissing(true);
      console.warn("[BulkAdd] Google Places API Key is missing. Address/Place ID lookup will be skipped.");
    } else if (isAuthenticated && isSuperuser) {
      setIsApiKeyMissing(false);
    }
  }, [isAuthenticated, isSuperuser]);

  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setError('');
    setResults(null); // Clear previous results when input changes
  };

  // Uses the new placeService.findPlaceByText
  const fetchPlaceDetails = async (placeName, city) => {
    if (!isSuperuser || !GOOGLE_PLACES_API_KEY || !placeName) {
      setProcessingStatus(`Skipping Google lookup for "${placeName}" (no API key/permissions/name).`);
      return null;
    }

    const queryInput = city ? `${placeName}, ${city}` : placeName;
    setProcessingStatus(`Looking up "${queryInput}" on Google Places...`);

    try {
      // Use the service function that calls the backend /find endpoint
      const place = await placeService.findPlaceByText(queryInput);
      if (place && place.placeId) {
        setProcessingStatus(`Found Place ID ${place.placeId} for "${queryInput}".`);
        return {
          placeId: place.placeId,
          formattedAddress: place.formattedAddress,
          city: place.city, // City extracted by backend
          neighborhood: place.neighborhood, // Neighborhood extracted by backend
          location: place.location, // Lat/Lng
        };
      } else {
        setProcessingStatus(`No unique Google Place found for "${queryInput}".`);
        return null;
      }
    } catch (err) {
      console.error(`[BulkAdd fetchPlaceDetails] Error fetching place details for "${queryInput}":`, err);
      // Set a general processing status error, but don't block the whole process
      setProcessingStatus(`Error looking up "${queryInput}" on Google Places.`);
      // Don't set the main 'error' state here, let the loop continue if desired
      return null;
    }
  };

  const processInputData = useCallback(async () => {
    setError('');
    setResults(null);
    if (!inputData.trim()) {
      setError('Please paste some data to process.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Starting processing...');

    const lines = inputData.trim().split('\n');
    const itemsToSubmit = [];
    let lineNum = 0;
    let parseErrorOccurred = false;

    for (const line of lines) {
      if (parseErrorOccurred) break; // Stop if a parsing error occurred
      lineNum++;
      setProcessingStatus(`Processing line ${lineNum}/${lines.length}: "${line.substring(0, 50)}..."`);

      try {
        // Basic parsing (adjust delimiter/format as needed)
        // Example: Name; Type; LocationHintOrRestaurantName; Tag1,Tag2
        const parts = line.split(';').map(p => p.trim());
        const name = parts[0];
        const type = parts[1]?.toLowerCase();
        const locationHintOrRestaurant = parts[2]; // Could be City for restaurant, or Restaurant Name for dish
        const tags = parts[3] ? parts[3].split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

        if (!name) throw new Error('Name is missing');
        if (type !== 'restaurant' && type !== 'dish') throw new Error(`Invalid type "${type}"`);

        let cityHint = null;
        let restaurantNameHint = null;
        if (type === 'restaurant') {
            cityHint = locationHintOrRestaurant; // Assume 3rd part is City for restaurants
        } else if (type === 'dish') {
            restaurantNameHint = locationHintOrRestaurant; // Assume 3rd part is Restaurant Name for dishes
             if (!restaurantNameHint) {
                 throw new Error(`Restaurant name is missing for dish "${name}"`);
             }
        }

        let placeDetails = null;
        // Only lookup restaurants for now
        if (type === 'restaurant') {
            placeDetails = await fetchPlaceDetails(name, cityHint);
            // Allow a small delay between Google API calls if needed
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        itemsToSubmit.push({
          name: name,
          type: type,
          // Use Google details if available, otherwise fall back
          city: placeDetails?.city || (type === 'restaurant' ? cityHint : null), // City primarily from Google or hint for restaurant
          neighborhood: placeDetails?.neighborhood || null,
          location: placeDetails?.formattedAddress || null, // Use formatted address as location
          place_id: placeDetails?.placeId || null,
          // Include restaurant_name hint for dishes to help backend find/create restaurant
          restaurant_name: type === 'dish' ? restaurantNameHint : undefined,
          tags: tags
        });

      } catch (parseError) {
        setError(`Error processing line ${lineNum}: ${parseError.message}`);
        setProcessingStatus(`Stopped due to error on line ${lineNum}.`);
        parseErrorOccurred = true; // Set flag to stop processing
        // No need to set isProcessing false here, finally block handles it
      }
    } // End loop

    if (parseErrorOccurred) {
         setIsProcessing(false); // Stop if parsing failed
         return;
    }

    if (itemsToSubmit.length === 0) {
         setError("No valid items were parsed from the input.");
         setIsProcessing(false);
         return;
    }


    setProcessingStatus(`Parsed ${itemsToSubmit.length} items. Submitting to backend...`);
    // --- Backend API Call ---
    try {
      const response = await apiClient('/api/admin/bulk-add', 'Bulk Add Submit', {
        method: 'POST',
        body: JSON.stringify({ items: itemsToSubmit }),
      });
      setResults(response); // Store the detailed results from backend
      setProcessingStatus(`Submission complete: ${response.addedCount || 0} added, ${response.skippedCount || 0} skipped/existed.`);
      setInputData(''); // Clear input on success
    } catch (apiError) {
      console.error("[BulkAdd] API submission error:", apiError);
      setError(apiError.message || "Failed to submit data to the backend.");
      setProcessingStatus("Submission failed.");
    } finally {
      setIsProcessing(false);
    }
  }, [inputData, isSuperuser, fetchPlaceDetails]); // Added fetchPlaceDetails dependency

  // Render access denied message (no change needed)
  if (!isAuthenticated || !isSuperuser) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
         <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4">
              <ArrowLeft size={16} className="mr-1" /> Back
         </Button>
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">Access Denied</h2>
          <p className="text-amber-700">
            {isAuthenticated ? "You do not have permission to access this page." : "Please log in as an administrator."}
          </p>
           {!isAuthenticated && (
               <Button onClick={() => navigate('/login')} variant="secondary" size="sm" className='mt-4'>Log In</Button>
           )}
        </div>
      </div>
    );
  }

  // Main component render (updated feedback section)
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4">
        <ArrowLeft size={16} className="mr-1" /> Back
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Bulk Add Restaurants/Dishes</h1>
      <p className="text-sm text-gray-600 mb-4">
        Paste data below (one item per line). Use semicolons (`;`) as separators. Format: `Name; Type; LocationHintOrRestaurantName; Tag1,Tag2`
      </p>
      <p className="text-xs text-gray-500 mb-4 italic">
        Examples:<br />
        `Some Cool Cafe; restaurant; New York; coffee,bakery`<br />
        `Amazing Burger; dish; Some Cool Cafe; burger,must try`
      </p>

        {isApiKeyMissing && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm flex items-center gap-2">
                <Info size={16} />
                <span>Google Places API key is missing. Address/Place ID lookup for restaurants will be skipped.</span>
            </div>
        )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <textarea
          value={inputData}
          onChange={handleInputChange}
          placeholder="Paste your data here..."
          className="w-full h-60 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm font-mono"
          disabled={isProcessing}
          aria-label="Bulk data input"
        />

        {/* Processing Status */}
        {isProcessing && processingStatus && (
            <p className="mt-3 text-sm text-blue-600 flex items-center justify-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                {processingStatus}
            </p>
        )}

        {/* General Error Display */}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
            {error}
          </p>
        )}

        {/* Detailed Results Display */}
        {results && !error && (
            <div className="mt-4 p-3 border rounded-md bg-gray-50 max-h-60 overflow-y-auto">
                <p className="text-sm font-medium text-gray-800 mb-2">{results.message || `Processed ${results.processedCount || 0} items.`}</p>
                <ul className="space-y-1 text-xs">
                    {results.details?.map((detail, index) => (
                        <li key={index} className={`flex items-start gap-2 p-1 rounded ${detail.status === 'added' ? 'bg-green-50 text-green-800' : detail.status === 'skipped' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'}`}>
                            {detail.status === 'added' ? <Check size={14} className="flex-shrink-0 mt-0.5"/> : detail.status === 'skipped' ? <Info size={14} className="flex-shrink-0 mt-0.5"/> : <IconX size={14} className="flex-shrink-0 mt-0.5"/>}
                            <span className="flex-grow">
                                <span className="font-semibold">{detail.input?.name}</span> ({detail.input?.type}) - {detail.status}: {detail.reason || (detail.id ? `ID: ${detail.id}` : 'OK')}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        )}


        <div className="mt-4 flex justify-end">
          <Button
            onClick={processInputData}
            variant="primary"
            disabled={isProcessing || !inputData.trim()}
            className="flex items-center gap-2 min-w-[160px] justify-center disabled:opacity-60" // Ensure disabled state is visible
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" /> Processing...
              </>
            ) : (
              <>
                <Upload size={16} /> Process & Submit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkAdd;