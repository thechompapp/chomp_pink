/* src/components/UI/PlacesAutocomplete.jsx */
/* REMOVED: TypeScript interfaces and type annotations */
import React, { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { usePlacesApi } from '@/context/PlacesApiContext';
import Button from './Button';
import Input from './Input';
import { AlertCircle } from 'lucide-react';
import { filterService } from '@/services/filterService'; // Assuming filterService is JS

// REMOVED: interface PlacesAutocompleteProps { ... }
// REMOVED: interface PlaceSuggestion { ... }

const PlacesAutocomplete/*REMOVED: : React.FC<PlacesAutocompleteProps>*/ = ({
  rowId,
  initialValue = '',
  onPlaceSelected,
  onAddressChange,
  disabled = false,
  placeholder = 'Search for a place...',
  enableManualEntry = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]); // REMOVED: <PlaceSuggestion[]>
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null); // REMOVED: <string | null>
  const queryClient = useQueryClient();
  const { isAvailable, error: apiError } = usePlacesApi();

  const fetchSuggestions = useCallback(async (searchQuery) => { // REMOVED: : string
    if (!searchQuery.trim()) {
      setSuggestions([]);
      queryClient.setQueryData(['placeSuggestions', searchQuery], []);
      return;
    }

    if (!isAvailable) {
      setLocalError('Places API is not available. Please try again later.');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      const response = await apiClient(
        // Use the proxy endpoint
        `/api/places/proxy/autocomplete?input=${encodeURIComponent(searchQuery)}`,
        'PlacesAutocomplete Fetch Suggestions'
      );

      // Check backend wrapper success and data format
      if (response.success && Array.isArray(response.data)) {
        setSuggestions(response.data);
        queryClient.setQueryData(['placeSuggestions', searchQuery], response.data);
      } else {
        const errorMessage = response.error || 'Failed to fetch suggestions';
        setLocalError(errorMessage);
        setSuggestions([]);
        queryClient.setQueryData(['placeSuggestions', searchQuery], []);
      }
    } catch (error) {
        // Use ApiError details if available
        const message = error instanceof ApiError ? error.message : 'Failed to fetch suggestions. Please try again.';
        setLocalError(message);
        setSuggestions([]);
        queryClient.setQueryData(['placeSuggestions', searchQuery], []);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, isAvailable]); // Removed error dependency

  const handleSearch = useCallback((value) => { // REMOVED: : string
    setQuery(value);
    setLocalError(null); // Clear local error on new search
    // Debounce fetch suggestions
    const debounceTimeout = setTimeout(() => {
         fetchSuggestions(value);
    }, 300); // 300ms debounce
    // Clear previous timeout if user types again quickly
    return () => clearTimeout(debounceTimeout);
  }, [fetchSuggestions]);


  const handleSuggestionClick = useCallback(async (suggestion) => { // REMOVED: : PlaceSuggestion
    if (!suggestion || !suggestion.place_id) {
      setLocalError('Invalid suggestion selected.');
      return;
    }

    // Clear suggestions immediately
    setSuggestions([]);
    queryClient.setQueryData(['placeSuggestions', query], []); // Use current query for cache key
    setIsLoading(true); // Indicate loading details
    setLocalError(null);

    try {
        // Use the proxy details endpoint
      const response = await apiClient(
        `/api/places/proxy/details?placeId=${encodeURIComponent(suggestion.place_id)}`,
        'PlacesAutocomplete Fetch Details'
      );

        // Check backend wrapper success and data presence
      if (response.success && response.data) {
        const details = response.data;

        // Extract zipcode (logic assumes backend returns addressComponents or formattedAddress)
        let zipcode;
        const postalCodeComp = details.addressComponents?.find(comp => comp.types.includes('postal_code'));
        if (postalCodeComp) {
            zipcode = postalCodeComp.short_name;
        } else if (details.formattedAddress) {
            const zipcodeMatch = details.formattedAddress.match(/\b\d{5}\b/);
            zipcode = zipcodeMatch ? zipcodeMatch[0] : undefined;
        }
        console.log(`[PlacesAutocomplete] Extracted zipcode: ${zipcode}`);


        // Prepare data for the callback
        const placeData/*REMOVED: : Record<string, any>*/ = {
          name: details.name || suggestion.structured_formatting?.main_text || suggestion.description,
          place_id: suggestion.place_id,
          formatted_address: details.formattedAddress, // Use key from backend response
          address: details.formattedAddress, // Keep 'address' for compatibility?
          zipcode, // Extracted zipcode
          latitude: details.location?.lat, // Use key from backend response
          longitude: details.location?.lng, // Use key from backend response
          // Potentially add city/neighborhood directly from backend response if available
          city: details.city,
          neighborhood: details.neighborhood,
          lookupFailed: !zipcode && !details.city && !details.neighborhood, // Indicate if key details missing
        };

        onPlaceSelected(placeData); // Send structured data
        // Update input field to show selected place name
        setQuery(details.name || suggestion.structured_formatting?.main_text || suggestion.description);
      } else {
        // Handle failure from backend proxy
        throw new Error(response.error || 'Invalid response from Places API details proxy.');
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
       // Use ApiError details if available
       const message = error instanceof ApiError ? error.message : 'Failed to fetch place details. Please select city and neighborhood manually.';
       setLocalError(message);
       // If details fail, still provide basic info if addressChange callback exists
      if (onAddressChange) {
        onAddressChange(suggestion.description, suggestion.place_id);
      }
    } finally {
        setIsLoading(false); // Stop loading indicator
    }
  }, [query, queryClient, onPlaceSelected, onAddressChange]); // Dependencies

  // Update query state if initialValue prop changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Combine local and API context errors for display
  const errorMessage = localError || apiError;

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        {/* Input field */}
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || !isAvailable} // Disable if Places API is unavailable
            className="w-full pr-8" // Add padding for icons
          />
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            </div>
          )}
          {/* Error Icon (only show if not loading) */}
          {!isLoading && errorMessage && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none" title={errorMessage}>
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {!isLoading && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                // Use onMouseDown to capture click before blur hides the list
                onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
              >
                <div className="font-medium">{suggestion.structured_formatting?.main_text || suggestion.description}</div>
                {suggestion.structured_formatting?.secondary_text && (
                  <div className="text-xs text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display Error Message Below Input */}
      {errorMessage && (
        <div className="mt-1 text-xs text-red-600">{errorMessage}</div>
      )}
    </div>
  );
};

// Use React.memo for performance optimization if props don't change often
export default React.memo(PlacesAutocomplete);