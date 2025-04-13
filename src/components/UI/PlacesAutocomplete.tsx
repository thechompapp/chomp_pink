import React, { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { usePlacesApi } from '@/context/PlacesApiContext';
import Button from './Button';
import Input from './Input';
import { AlertCircle } from 'lucide-react';
import { filterService } from '@/services/filterService';

interface PlacesAutocompleteProps {
  rowId?: string | number;
  initialValue?: string;
  onPlaceSelected: (placeData: Record<string, any>) => void;
  onAddressChange?: (address: string, placeId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  enableManualEntry?: boolean;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  rowId,
  initialValue = '',
  onPlaceSelected,
  onAddressChange,
  disabled = false,
  placeholder = 'Search for a place...',
  enableManualEntry = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isAvailable, error: apiError } = usePlacesApi();

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
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
        `/api/places/proxy/autocomplete?input=${encodeURIComponent(searchQuery)}`,
        'PlacesAutocomplete Fetch Suggestions'
      );

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
      setLocalError('Failed to fetch suggestions. Please try again.');
      setSuggestions([]);
      queryClient.setQueryData(['placeSuggestions', searchQuery], []);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, isAvailable]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setLocalError(null);
    fetchSuggestions(value);
  }, [fetchSuggestions]);

  const handleSuggestionClick = useCallback(async (suggestion: PlaceSuggestion) => {
    if (!suggestion.place_id) {
      return;
    }

    setSuggestions([]);
    queryClient.setQueryData(['placeSuggestions', query], []);

    try {
      const response = await apiClient(
        `/api/places/proxy/details?placeId=${encodeURIComponent(suggestion.place_id)}`,
        'PlacesAutocomplete Fetch Details'
      );

      if (response.success && response.data) {
        const details = response.data;

        let zipcode = details.address_components?.find(comp => comp.types.includes('postal_code'))?.short_name;
        if (!zipcode && details.formattedAddress) {
          const zipcodeMatch = details.formattedAddress.match(/\b\d{5}\b/);
          zipcode = zipcodeMatch ? zipcodeMatch[0] : undefined;
        }
        console.log(`[PlacesAutocomplete] Extracted zipcode: ${zipcode}`);

        const placeData: Record<string, any> = {
          name: details.name || suggestion.structured_formatting?.main_text || suggestion.description,
          place_id: suggestion.place_id,
          formatted_address: details.formattedAddress,
          address: details.formattedAddress,
          zipcode,
          latitude: details.location?.lat || details.geometry?.location?.lat,
          longitude: details.location?.lng || details.geometry?.location?.lng,
          lookupFailed: !zipcode,
        };

        onPlaceSelected(placeData);
        setQuery(details.name || suggestion.structured_formatting?.main_text || suggestion.description);
      } else {
        throw new Error('Invalid response from Places API');
      }
    } catch (error) {
      setLocalError('Failed to fetch place details. Please select city and neighborhood manually.');
      if (onAddressChange) {
        onAddressChange(suggestion.description, suggestion.place_id);
      }
    }
  }, [query, queryClient, onPlaceSelected, onAddressChange]);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const errorMessage = localError || apiError;

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || !isAvailable}
            className="w-full"
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
          {errorMessage && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500">
              <AlertCircle className="h-4 w-4" />
            </div>
          )}
        </div>

        {!isLoading && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="font-medium">{suggestion.structured_formatting?.main_text}</div>
                <div className="text-sm text-gray-500">{suggestion.structured_formatting?.secondary_text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="mt-1 text-sm text-red-600">{errorMessage}</div>
      )}
    </div>
  );
};

export default React.memo(PlacesAutocomplete);