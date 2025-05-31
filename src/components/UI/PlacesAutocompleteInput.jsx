import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { usePlacesApi } from '@/contexts/PlacesApiContext';
import { placeService } from '@/services/placeService';
import { cn } from '@/lib/utils';

const PlacesAutocompleteInput = ({
  value = '',
  onChange,
  onPlaceSelect,
  onBlur,
  onKeyDown,
  placeholder = "Search for address...",
  className = '',
  autoFocus = false,
  error = null,
  disabled = false
}) => {
  const { isAvailable, isLoading: placesApiLoading } = usePlacesApi();
  const [placePredictions, setPlacePredictions] = useState([]);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Update search query when value prop changes, ensuring it's always a string
  useEffect(() => {
    setSearchQuery(value ?? '');
  }, [value]);

  // Handle search input changes
  const handleSearchChange = useCallback(async (newValue) => {
    const safeValue = newValue ?? '';
    setSearchQuery(safeValue);
    onChange?.(safeValue);
    
    if (!isAvailable || safeValue.length < 3) {
      setPlacePredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await placeService.searchPlaces(safeValue);
      const predictions = response.results || [];
      setPlacePredictions(predictions);
      setShowDropdown(predictions.length > 0);
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      setPlacePredictions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, onChange]);

  // Handle place selection from dropdown
  const handlePlaceSelect = useCallback(async (prediction) => {
    setIsLoading(true);
    setShowDropdown(false);
    
    try {
      console.log('[PlacesAutocompleteInput] ===== PLACE SELECTION DEBUG =====');
      console.log('[PlacesAutocompleteInput] Prediction:', JSON.stringify(prediction, null, 2));
      
      const { details } = await placeService.getPlaceDetails(prediction.place_id);
      console.log('[PlacesAutocompleteInput] API Response details:', JSON.stringify(details, null, 2));
      
      if (details) {
        // Extract zip code from address components
        const zipcode = details.address_components?.find(
          (comp) => comp.types.includes('postal_code')
        )?.long_name;
        console.log('[PlacesAutocompleteInput] Extracted zipcode:', zipcode);

        // Extract restaurant/business name from structured formatting or place name
        let restaurantName = null;
        
        // Try to get business name from the place name first
        if (details.name && details.name !== details.formattedAddress) {
          restaurantName = details.name;
        }
        
        // Also try from structured formatting (main text often contains business name)
        if (!restaurantName && prediction.structured_formatting?.main_text) {
          const mainText = prediction.structured_formatting.main_text;
          // If main text doesn't look like just an address, use it as restaurant name
          if (!/^\d+\s/.test(mainText) && mainText !== details.formattedAddress) {
            restaurantName = mainText;
          }
        }
        console.log('[PlacesAutocompleteInput] Extracted restaurantName:', restaurantName);

        // Ensure we have a valid formatted address - check both possible field names
        const formattedAddress = details.formattedAddress || details.formatted_address || '';
        console.log('[PlacesAutocompleteInput] Formatted address:', formattedAddress);
        
        // Update the input value with proper state management
        setSearchQuery(formattedAddress);
        
        // Call onChange with the formatted address
        if (onChange) {
          onChange(formattedAddress);
        }

        // Call the onPlaceSelect callback with extracted data
        if (onPlaceSelect) {
          // Extract coordinates properly - check multiple possible structures
          let latitude = null;
          let longitude = null;
          
          // Check direct location object first (our API format)
          if (details.location) {
            if (typeof details.location.lat === 'function') {
              latitude = details.location.lat();
              longitude = details.location.lng();
            } else {
              latitude = details.location.lat;
              longitude = details.location.lng;
            }
          }
          // Fallback to geometry.location (standard Google Places format)
          else if (details.geometry?.location) {
            if (typeof details.geometry.location.lat === 'function') {
              latitude = details.geometry.location.lat();
              longitude = details.geometry.location.lng();
            } else {
              latitude = details.geometry.location.lat;
              longitude = details.geometry.location.lng;
            }
          }
          console.log('[PlacesAutocompleteInput] Extracted coordinates:', { latitude, longitude });
          
          const dataToSend = {
            address: formattedAddress,
            restaurantName: restaurantName,
            zipcode,
            lat: latitude,
            lng: longitude,
            placeId: details.place_id || details.placeId,
            addressComponents: details.address_components || details.addressComponents,
            types: details.types || [],
            name: details.name
          };
          
          console.log('[PlacesAutocompleteInput] ===== DATA BEING SENT TO MODAL =====');
          console.log(JSON.stringify(dataToSend, null, 2));
          console.log('[PlacesAutocompleteInput] ============================================');
          
          onPlaceSelect(dataToSend);
        }
      }
    } catch (error) {
      console.error('[PlacesAutocompleteInput] Error fetching place details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, onPlaceSelect]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    // Delay hiding dropdown to allow for click selection
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
    onBlur?.(e);
  }, [onBlur]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
    onKeyDown?.(e);
  }, [onKeyDown]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isInputDisabled = disabled || placesApiLoading || !isAvailable;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placesApiLoading ? "Loading places service..." : placeholder}
          className={cn(
            "w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
            error ? "border-red-500" : "border-gray-300",
            isInputDisabled && "bg-gray-100 cursor-not-allowed opacity-60"
          )}
          disabled={isInputDisabled}
          autoFocus={autoFocus}
        />
        
        {/* Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Service status message */}
      {!isAvailable && !placesApiLoading && (
        <div className="text-xs text-red-500 mt-1">
          Places service is unavailable. Enter address manually.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}

      {/* Dropdown with predictions */}
      {showDropdown && placePredictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {placePredictions.map((prediction) => (
            <div
              key={prediction.place_id}
              className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              onClick={() => handlePlaceSelect(prediction)}
            >
              <div className="font-medium text-sm text-gray-900">
                {prediction.structured_formatting?.main_text || prediction.description}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {prediction.structured_formatting?.secondary_text || ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlacesAutocompleteInput; 