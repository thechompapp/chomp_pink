/* src/components/UI/PlacesAutocomplete.jsx */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient, { ApiError } from '@/services/apiClient';
import { usePlacesApi } from '@/context/PlacesApiContext';
import Button from './Button';
import Input from './Input';
import { AlertCircle, Loader2 } from 'lucide-react';
import { placeService } from '@/services/placeService';

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// REMOVED decodeHtmlEntities function

const PlacesAutocomplete = ({
  rowId,
  initialValue = '',
  onPlaceSelected,
  disabled = false,
  placeholder = 'Search for a place...',
  enableManualEntry = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const queryClient = useQueryClient();
  const { isAvailable, error: apiError, forceManualMode } = usePlacesApi();
  const suggestionsRef = useRef(null);
  const containerRef = useRef(null);

  const fetchSuggestions = useCallback(async (searchQuery) => {
    const trimmedQuery = searchQuery?.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setSuggestions([]); return;
    }
    if (!isAvailable) { setLocalError('Places API unavailable.'); return; }
    setIsLoading(true); setLocalError(null);
    try {
      const response = await apiClient(`/api/places/proxy/autocomplete?input=${encodeURIComponent(trimmedQuery)}`, 'PlacesAutocomplete Fetch Suggestions');
      if (response.success && Array.isArray(response.data)) {
        setSuggestions(response.data.filter(p => p?.place_id));
      } else { throw new Error(response.error || 'Failed to fetch suggestions'); }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Suggestion fetch failed.';
      setLocalError(message); setSuggestions([]);
    } finally { setIsLoading(false); }
  }, [queryClient, isAvailable]);

  const debouncedFetchSuggestions = useMemo(() => debounce(fetchSuggestions, 300), [fetchSuggestions]);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    setLocalError(null);
    debouncedFetchSuggestions(value);
  }, [debouncedFetchSuggestions]);

  const handleSuggestionClick = useCallback(async (suggestion) => {
    if (!suggestion || !suggestion.place_id) { setLocalError('Invalid suggestion.'); return; }
    setSuggestions([]);
    setIsLoading(true); setLocalError(null);
    try {
      const response = await apiClient(`/api/places/proxy/details?placeId=${encodeURIComponent(suggestion.place_id)}`, `PlacesAutocomplete Fetch Details`);
      if (response.success && response.data) {
        const details = response.data;
        let zipcode;
        if (details.zipcode) { zipcode = details.zipcode; }
        else if (details.addressComponents) { const pc = details.addressComponents.find(c => c.types.includes('postal_code')); zipcode = pc?.short_name || pc?.long_name; }
        else if (details.formattedAddress) { const m = details.formattedAddress.match(/\b\d{5}\b/); zipcode = m?.[0]; }
        const placeData = { name: details.name || suggestion.structured_formatting?.main_text || suggestion.description, place_id: suggestion.place_id, formattedAddress: details.formattedAddress, zipcode: zipcode || null, latitude: details.location?.lat || null, longitude: details.location?.lng || null, city: details.city || null, neighborhood: details.neighborhood || null, addressComponents: details.addressComponents || [] };
        onPlaceSelected(placeData);
        setQuery(details.name || suggestion.structured_formatting?.main_text || suggestion.description);
      } else { throw new Error(response.error || 'Invalid response from Places details proxy.'); }
    } catch (error) {
      console.error("Error fetching place details:", error);
      const message = error instanceof ApiError ? error.message : (error instanceof Error ? error.message : 'Failed to fetch place details.');
      setLocalError(message + " Manual entry might be needed.");
    } finally { setIsLoading(false); }
  }, [queryClient, onPlaceSelected, enableManualEntry, forceManualMode]);

  useEffect(() => { setQuery(initialValue); }, [initialValue]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
            setSuggestions([]);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const errorMessage = localError || apiError;

  return (
    <div className="relative" ref={containerRef}>
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || !isAvailable || isLoading}
            className="w-full pr-8 text-sm"
            autoComplete="off"
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? `${rowId || 'places'}-error-message` : undefined}
          />
          {/* Icons */}
          {isLoading && ( <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"> <Loader2 className="animate-spin h-4 w-4 text-gray-400" /> </div> )}
          {!isLoading && errorMessage && ( <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none" title={errorMessage}> <AlertCircle className="h-4 w-4" /> </div> )}
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-10"
          >
            <ul>
                {suggestions.map((suggestion) => {
                  // Render raw text directly - decoding removed
                  const mainText = suggestion.structured_formatting?.main_text || suggestion.description || '';
                  const secondaryText = suggestion.structured_formatting?.secondary_text || '';

                  // Logging raw data for verification if needed
                  // console.log('[PlacesAutocomplete Raw Suggestion]:', suggestion);

                  return (
                    <li key={suggestion.place_id}>
                        <div
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
                        >
                        {/* Render raw text */}
                        <div className="font-medium">{mainText}</div>
                        {secondaryText && ( <div className="text-xs text-gray-500">{secondaryText}</div> )}
                        </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

      {/* Display Error Message Below Input */}
      {errorMessage && ( <div id={`${rowId || 'places'}-error-message`} className="mt-1 text-xs text-red-600">{errorMessage}</div> )}
    </div>
  );
};

export default React.memo(PlacesAutocomplete);