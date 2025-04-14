/* src/pages/BulkAdd/index.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, AlertTriangle, Info, Check, X as IconX } from 'lucide-react';
import Button from '@/components/UI/Button'; // Corrected import path
import useAuthStore from '@/stores/useAuthStore';
import apiClient from '@/services/apiClient';
import { placeService } from '@/services/placeService';
// REMOVED: import { GOOGLE_PLACES_API_KEY } from '@/config'; // No longer imported

const BulkAdd = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isSuperuser = useAuthStore(state => state.isSuperuser());

  const [inputData, setInputData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  // REMOVED: isApiKeyMissing state

  // No longer need useEffect for API key check

  const handleInputChange = (e) => {
    setInputData(e.target.value);
    setError('');
    setResults(null);
  };

  // Fetch place details using the backend proxy via placeService
  const fetchPlaceDetails = useCallback(async (placeName, city) => {
    // Removed client-side API key check
    if (!isSuperuser || !placeName) { // Check only for superuser status and name
      setProcessingStatus(`Skipping Google lookup for "${placeName}" (permissions/name missing).`);
      return null;
    }

    const queryInput = city ? `${placeName}, ${city}` : placeName;
    setProcessingStatus(`Looking up "${queryInput}" on Google Places...`);

    try {
      // Use the service function that calls the backend proxy
      const place = await placeService.getPlaceDetails(queryInput); // Changed to getPlaceDetails assuming proxy exists
      // Adjust based on the actual structure returned by your placeService/backend proxy
       if (place && place.placeId) {
           setProcessingStatus(`Found Place ID ${place.placeId} for "${queryInput}".`);
           return {
             placeId: place.placeId,
             formattedAddress: place.formattedAddress,
             city: place.city,
             neighborhood: place.neighborhood,
             location: place.location, // Expect lat/lng here
           };
       } else {
           setProcessingStatus(`No unique Google Place found for "${queryInput}".`);
           return null;
       }
    } catch (err) {
      console.error(`[BulkAdd fetchPlaceDetails] Error fetching place details for "${queryInput}":`, err);
      setProcessingStatus(`Error looking up "${queryInput}" on Google Places.`);
      return null;
    }
  }, [isSuperuser]); // Dependency on isSuperuser


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
      if (parseErrorOccurred) break;
      lineNum++;
      setProcessingStatus(`Processing line ${lineNum}/${lines.length}: "${line.substring(0, 50)}..."`);

      try {
        const parts = line.split(';').map(p => p.trim());
        const name = parts[0];
        const type = parts[1]?.toLowerCase();
        const locationHintOrRestaurant = parts[2];
        const tags = parts[3] ? parts[3].split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

        if (!name) throw new Error('Name is missing');
        if (type !== 'restaurant' && type !== 'dish') throw new Error(`Invalid type "${type}"`);

        let cityHint = null;
        let restaurantNameHint = null;
        if (type === 'restaurant') {
            cityHint = locationHintOrRestaurant;
        } else if (type === 'dish') {
            restaurantNameHint = locationHintOrRestaurant;
             if (!restaurantNameHint) {
                 throw new Error(`Restaurant name is missing for dish "${name}"`);
             }
        }

        let placeDetails = null;
        if (type === 'restaurant') {
            placeDetails = await fetchPlaceDetails(name, cityHint);
            await new Promise(resolve => setTimeout(resolve, 50)); // Optional delay
        }

        itemsToSubmit.push({
          name: name,
          type: type,
          city: placeDetails?.city || (type === 'restaurant' ? cityHint : null),
          neighborhood: placeDetails?.neighborhood || null,
          location: placeDetails?.formattedAddress || null,
          place_id: placeDetails?.placeId || null,
          latitude: placeDetails?.location?.lat || null, // Extract lat
          longitude: placeDetails?.location?.lng || null, // Extract lng
          restaurant_name: type === 'dish' ? restaurantNameHint : undefined,
          tags: tags
        });

      } catch (parseError) {
        setError(`Error processing line ${lineNum}: ${parseError.message}`);
        setProcessingStatus(`Stopped due to error on line ${lineNum}.`);
        parseErrorOccurred = true;
      }
    }

    if (parseErrorOccurred) {
         setIsProcessing(false);
         return;
    }
    if (itemsToSubmit.length === 0) {
         setError("No valid items were parsed from the input.");
         setIsProcessing(false);
         return;
    }

    setProcessingStatus(`Parsed ${itemsToSubmit.length} items. Submitting to backend...`);
    try {
      // Backend endpoint remains the same
      const response = await apiClient('/api/admin/bulk-add', 'Bulk Add Submit', {
        method: 'POST',
        body: JSON.stringify({ items: itemsToSubmit }),
      });
      // Assuming backend returns { processedCount, addedCount, skippedCount, details, message }
      if (response.success && response.data) {
          setResults(response.data);
          setProcessingStatus(`Submission complete: ${response.data.addedCount || 0} added, ${response.data.skippedCount || 0} skipped/existed.`);
      } else {
          throw new Error(response.error || "Backend submission failed.");
      }
      setInputData('');
    } catch (apiError) {
      console.error("[BulkAdd] API submission error:", apiError);
      setError(apiError.message || "Failed to submit data to the backend.");
      setProcessingStatus("Submission failed.");
    } finally {
      setIsProcessing(false);
    }
  }, [inputData, isSuperuser, fetchPlaceDetails]);

  if (!isAuthenticated || !isSuperuser) {
    // Access denied message remains the same
    return ( /* ... access denied JSX ... */ );
  }

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

       {/* REMOVED: isApiKeyMissing warning */}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <textarea
          value={inputData}
          onChange={handleInputChange}
          placeholder="Paste your data here..."
          className="w-full h-60 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] text-sm font-mono"
          disabled={isProcessing}
          aria-label="Bulk data input"
        />

        {isProcessing && processingStatus && (
            <p className="mt-3 text-sm text-blue-600 flex items-center justify-center">
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                {processingStatus}
            </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">
            {error}
          </p>
        )}
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
            className="flex items-center gap-2 min-w-[160px] justify-center disabled:opacity-60"
          >
            {isProcessing ? (<><Loader2 className="animate-spin h-4 w-4" /> Processing...</>) : (<><Upload size={16} /> Process & Submit</>)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkAdd;