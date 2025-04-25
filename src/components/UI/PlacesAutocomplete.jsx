/* src/components/UI/PlacesAutocomplete.jsx */
/* Patched: Added formattedAddress parsing fallback for city extraction */
/* Patched: Added detailed logging for address_components */
/* Patched: Added administrative_area_level_2 as city fallback */
/* Patched: Ensure consistent apiClient usage */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient'; // Remove ApiError import
import { usePlacesApi } from '@/context/PlacesApiContext';
import Button from './Button';
import Input from './Input';
import { AlertCircle, Loader2 } from 'lucide-react';

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Helper function to extract address components
const getAddressComponent = (components, type, useLongName = false) => {
    if (!Array.isArray(components)) {
         console.warn('[getAddressComponent] Invalid components array received:', components);
         return null;
    }
    const component = components.find(c => c.types.includes(type));
    return component ? (useLongName ? component.long_name : component.short_name) : null;
};

// Helper function to parse city from formattedAddress
const parseCityFromFormattedAddress = (formattedAddress) => {
    if (!formattedAddress || typeof formattedAddress !== 'string') return null;
    const parts = formattedAddress.split(',').map(part => part.trim());
    if (parts.length >= 3) {
        const potentialState = parts[parts.length - 2].split(' ')[0];
        if (potentialState && potentialState.length === 2 && potentialState === potentialState.toUpperCase()) {
            const potentialCity = parts[parts.length - 3];
            if (potentialCity) return potentialCity;
        }
    }
    if (parts.length === 2) {
        const potentialState = parts[1].split(' ')[0];
        if (potentialState && potentialState.length === 2 && potentialState === potentialState.toUpperCase()) {
             return parts[0];
        }
    }
    console.warn('[parseCityFromFormattedAddress] Could not reliably parse city from:', formattedAddress);
    return null;
};

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
      const response = await apiClient(
        `/api/places/proxy/autocomplete?input=${encodeURIComponent(trimmedQuery)}`,
        'PlacesAutocomplete Fetch Suggestions'
      );
      if (response.success && Array.isArray(response.data)) {
        setSuggestions(response.data.filter(p => p?.place_id));
      } else {
        throw new Error(response.error || 'Failed to fetch suggestions');
      }
    } catch (error) {
      const message = error.message || 'Suggestion fetch failed.';
      console.warn('[PlacesAutocomplete] Suggestion fetch error:', error);
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
      const response = await apiClient(
        `/api/places/proxy/details?placeId=${encodeURIComponent(suggestion.place_id)}`,
        'PlacesAutocomplete Fetch Details'
      );
      if (response.success && response.data) {
        const details = response.data;
        const addressComponents = details.addressComponents || [];
        const formattedAddress = details.formattedAddress || '';

        console.log('[PlacesAutocomplete] Raw address_components received:', JSON.stringify(addressComponents, null, 2));
        console.log('[PlacesAutocomplete] Formatted Address received:', formattedAddress);

        // City Extraction
        let extractedCity =
            getAddressComponent(addressComponents, 'locality') ||
            getAddressComponent(addressComponents, 'sublocality_level_1') ||
            getAddressComponent(addressComponents, 'postal_town') ||
            getAddressComponent(addressComponents, 'administrative_area_level_2') ||
            '';

        // Cleanup (County -> Borough, etc.)
        if (extractedCity) {
            const cityLower = extractedCity.toLowerCase();
            if (cityLower === 'kings county') extractedCity = 'Brooklyn';
            else if (cityLower === 'new york county') extractedCity = 'Manhattan';
            else if (cityLower === 'queens county') extractedCity = 'Queens';
            else if (cityLower === 'bronx county') extractedCity = 'Bronx';
            else if (cityLower === 'richmond county') extractedCity = 'Staten Island';
            else if (cityLower.endsWith(' county')) {
                 extractedCity = extractedCity.substring(0, extractedCity.length - " County".length);
            }
        }

        // Fallback using formattedAddress if city still not found
        if (!extractedCity && formattedAddress) {
            console.log('[PlacesAutocomplete] City extraction from components failed, attempting formattedAddress parse...');
            extractedCity = parseCityFromFormattedAddress(formattedAddress) || '';
        }

        const extractedNeighborhood = getAddressComponent(addressComponents, 'neighborhood') || '';
        const extractedZipcode = details.zipcode || getAddressComponent(addressComponents, 'postal_code') || '';
        const extractedName = details.name || suggestion.structured_formatting?.main_text || suggestion.description || '';

        const placeData = {
            name: extractedName,
            place_id: suggestion.place_id,
            formattedAddress: formattedAddress,
            zipcode: extractedZipcode.trim(),
            latitude: details.location?.lat || null,
            longitude: details.location?.lng || null,
            city: extractedCity.trim(),
            neighborhood: extractedNeighborhood.trim(),
            addressComponents: addressComponents
        };

        console.log('[PlacesAutocomplete] Final Extracted Place Data:', placeData);

        onPlaceSelected(placeData);
        setQuery(extractedName);
      } else { throw new Error(response.error || 'Invalid response from Places details proxy.'); }
    } catch (error) {
      console.error("[PlacesAutocomplete] Error fetching/processing place details:", error);
      const message = error.message || 'Failed to fetch place details.';
      setLocalError(message + " Manual entry might be needed.");
    } finally { setIsLoading(false); }
  }, [queryClient, onPlaceSelected, enableManualEntry, forceManualMode]);

  useEffect(() => { setQuery(initialValue); }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
            setSuggestions([]);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayErrorMessage = localError || (!isAvailable && apiError);

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
            aria-invalid={!!displayErrorMessage}
            aria-describedby={displayErrorMessage ? `${rowId || 'places'}-error-message` : undefined}
          />
          {isLoading && ( <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none"> <Loader2 className="animate-spin h-4 w-4 text-gray-400 dark:text-gray-500" /> </div> )}
          {!isLoading && displayErrorMessage && ( <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 pointer-events-none" title={displayErrorMessage}> <AlertCircle className="h-4 w-4" /> </div> )}
        </div>

        {suggestions.length > 0 && isAvailable && (
          <div
            ref={suggestionsRef}
            className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto z-10"
          >
            <ul>
                {suggestions.map((suggestion) => {
                  const mainText = suggestion.structured_formatting?.main_text || suggestion.description || '';
                  const secondaryText = suggestion.structured_formatting?.secondary_text || '';
                  return (
                    <li key={suggestion.place_id}>
                        <button
                            type="button"
                            className="block w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                            onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(suggestion); }}
                        >
                        <div className="font-medium text-gray-900 dark:text-gray-100">{mainText}</div>
                        {secondaryText && ( <div className="text-xs text-gray-500 dark:text-gray-400">{secondaryText}</div> )}
                        </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

      {displayErrorMessage && ( <div id={`${rowId || 'places'}-error-message`} className="mt-1 text-xs text-red-600 dark:text-red-400">{displayErrorMessage}</div> )}
    </div>
  );
};

export default React.memo(PlacesAutocomplete);