import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Loader2, MapPin, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PlacesAutocompleteInput from '@/components/UI/PlacesAutocompleteInput';
import { getDefaultApiClient } from '@/services/http';
import { cn } from '@/lib/utils';

const apiClient = getDefaultApiClient();

const RestaurantAddressCell = ({
  restaurantId,
  currentAddress = '',
  currentCityId = null,
  currentNeighborhoodId = null,
  cities = [],
  neighborhoods = [],
  onSave,
  onCancel,
  autoSave = true,
  className = ''
}) => {
  const [address, setAddress] = useState(currentAddress);
  const [cityId, setCityId] = useState(currentCityId);
  const [neighborhoodId, setNeighborhoodId] = useState(currentNeighborhoodId);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState(neighborhoods);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Helper function to validate and parse restaurant ID
  const getValidRestaurantId = useCallback((id) => {
    if (id === null || id === undefined || id === '') {
      return null;
    }
    
    const parsed = parseInt(id);
    if (isNaN(parsed) || parsed <= 0) {
      return null;
    }
    
    return parsed;
  }, []);

  // Update local state when props change
  useEffect(() => {
    setAddress(currentAddress);
    setCityId(currentCityId);
    setNeighborhoodId(currentNeighborhoodId);
    setHasChanges(false);
  }, [currentAddress, currentCityId, currentNeighborhoodId]);

  // Filter neighborhoods based on selected city
  useEffect(() => {
    if (cityId) {
      const filteredNeighborhoods = neighborhoods.filter(n => n.city_id === cityId);
      setAvailableNeighborhoods(filteredNeighborhoods);
      
      // If current neighborhood doesn't belong to selected city, clear it
      if (neighborhoodId && !filteredNeighborhoods.find(n => n.id === neighborhoodId)) {
        setNeighborhoodId(null);
        setHasChanges(true);
      }
    } else {
      setAvailableNeighborhoods(neighborhoods);
    }
  }, [cityId, neighborhoods, neighborhoodId]);

  // Fetch neighborhoods by zip code
  const fetchNeighborhoodsByZipcode = useCallback(async (zipcode) => {
    if (!zipcode) return null;
    
    try {
      const response = await apiClient.get(`/api/neighborhoods/zip/${zipcode}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching neighborhoods by zipcode:', error);
      return null;
    }
  }, []);

  // Extract zip code from address using regex
  const extractZipCode = useCallback((address) => {
    if (!address) return null;
    
    // Match 5-digit zip codes (with optional 4-digit extension)
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
    return zipMatch ? zipMatch[1] : null;
  }, []);

  // Extract restaurant name from Google Places result
  const extractRestaurantName = useCallback((placeData) => {
    // Try to get restaurant name from structured formatting or description
    const { addressComponents } = placeData;
    
    // Look for establishment name in address components
    const establishment = addressComponents?.find(
      comp => comp.types.includes('establishment') || comp.types.includes('point_of_interest')
    );
    
    if (establishment) {
      return establishment.long_name;
    }
    
    // If no establishment found, try to extract from the first part of the address
    const address = placeData.address;
    if (address) {
      const parts = address.split(',');
      const firstPart = parts[0]?.trim();
      
      // Check if first part looks like a business name (contains letters and not just numbers)
      if (firstPart && /[a-zA-Z]/.test(firstPart) && !/^\d+\s/.test(firstPart)) {
        return firstPart;
      }
    }
    
    return null;
  }, []);

  // Get city from neighborhood
  const getCityFromNeighborhood = useCallback((neighborhood) => {
    if (!neighborhood || !neighborhood.city_id) return null;
    return cities.find(city => city.id === neighborhood.city_id);
  }, [cities]);

  // Handle place selection from Google Places
  const handlePlaceSelect = useCallback(async (placeData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { address: newAddress, zipcode: extractedZipcode, restaurantName } = placeData;
      
      // Also try to extract zip code from address if not provided
      const zipcode = extractedZipcode || extractZipCode(newAddress);
      
      setAddress(newAddress);
      setHasChanges(true);
      
      // Auto-populate restaurant name if available and we have a valid restaurant ID
      const validRestaurantId = getValidRestaurantId(restaurantId);
      if (restaurantName && validRestaurantId) {
        toast.success(`Auto-detected restaurant: "${restaurantName}"`);
        
        // Auto-populate restaurant name if onSave supports it
        try {
          await onSave(validRestaurantId, 'name', restaurantName);
        } catch (error) {
          console.error('[RestaurantAddressCell] Restaurant name save failed:', error);
        }
      } else if (restaurantName && !validRestaurantId) {
        // Show the detected name but don't try to save without valid ID
        toast.success(`Auto-detected restaurant: "${restaurantName}" (will save when editing mode is confirmed)`);
      }
      
      if (zipcode) {
        // Look up neighborhoods by zip code
        const zipcodeNeighborhoods = await fetchNeighborhoodsByZipcode(zipcode);
        
        if (zipcodeNeighborhoods && zipcodeNeighborhoods.length > 0) {
          // Select the first neighborhood found
          const selectedNeighborhood = zipcodeNeighborhoods[0];
          const selectedCity = getCityFromNeighborhood(selectedNeighborhood);
          
          if (selectedCity) {
            setCityId(selectedCity.id);
            setNeighborhoodId(selectedNeighborhood.id);
            setHasChanges(true);
            
            toast.success(`Auto-set location: ${selectedCity.name}, ${selectedNeighborhood.name}`);
          }
        } else {
          // Clear city and neighborhood if no matches found
          setCityId(null);
          setNeighborhoodId(null);
          toast.info(`No neighborhoods found for zip code ${zipcode}. Please select manually.`);
        }
      }
      
      // Auto-save if enabled and we have a valid restaurant ID
      const validRestaurantIdForSave = getValidRestaurantId(restaurantId);
      if (autoSave && validRestaurantIdForSave) {
        await handleSave(newAddress, cityId, neighborhoodId);
      }
    } catch (error) {
      console.error('Error processing place selection:', error);
      setError('Failed to process location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [autoSave, fetchNeighborhoodsByZipcode, getCityFromNeighborhood, extractZipCode, cityId, neighborhoodId, onSave, restaurantId, getValidRestaurantId]);

  // Handle manual city change
  const handleCityChange = useCallback((newCityId) => {
    setCityId(newCityId ? parseInt(newCityId) : null);
    setNeighborhoodId(null); // Clear neighborhood when city changes
    setHasChanges(true);
  }, []);

  // Handle manual neighborhood change
  const handleNeighborhoodChange = useCallback((newNeighborhoodId) => {
    setNeighborhoodId(newNeighborhoodId ? parseInt(newNeighborhoodId) : null);
    setHasChanges(true);
  }, []);

  // Save changes
  const handleSave = useCallback(async (addressToSave = address, cityToSave = cityId, neighborhoodToSave = neighborhoodId) => {
    if (!hasChanges && addressToSave === currentAddress && cityToSave === currentCityId && neighborhoodToSave === currentNeighborhoodId) {
      return;
    }
    
    // Validate restaurant ID
    const validRestaurantId = getValidRestaurantId(restaurantId);
    if (!validRestaurantId) {
      console.error('Cannot save: Invalid restaurant ID:', {
        received: restaurantId,
        type: typeof restaurantId,
        parsed: parseInt(restaurantId)
      });
      setError('Invalid restaurant ID. Cannot save changes.');
      toast.error('Invalid restaurant ID format. Cannot save changes.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updates = {};
      
      if (addressToSave !== currentAddress) {
        updates.address = addressToSave;
      }
      if (cityToSave !== currentCityId) {
        updates.city_id = cityToSave;
      }
      if (neighborhoodToSave !== currentNeighborhoodId) {
        updates.neighborhood_id = neighborhoodToSave;
      }
      
      if (Object.keys(updates).length > 0) {
        // Save multiple fields at once using the correct signature with validated ID
        for (const [field, value] of Object.entries(updates)) {
          await onSave(validRestaurantId, field, value);
        }
        
        setHasChanges(false);
        toast.success('Restaurant location updated successfully');
      }
    } catch (error) {
      console.error('Error saving restaurant location:', error);
      setError('Failed to save changes. Please try again.');
      toast.error('Failed to save location changes');
    } finally {
      setIsLoading(false);
    }
  }, [address, cityId, neighborhoodId, currentAddress, currentCityId, currentNeighborhoodId, hasChanges, onSave, restaurantId, getValidRestaurantId]);

  // Cancel changes
  const handleCancel = useCallback(() => {
    setAddress(currentAddress);
    setCityId(currentCityId);
    setNeighborhoodId(currentNeighborhoodId);
    setHasChanges(false);
    setError(null);
    onCancel?.();
  }, [currentAddress, currentCityId, currentNeighborhoodId, onCancel]);

  // Get display values
  const currentCity = cities.find(city => city.id === cityId);
  const currentNeighborhood = availableNeighborhoods.find(n => n.id === neighborhoodId);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Address Input with Google Places Autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <PlacesAutocompleteInput
          value={address || ''}
          onChange={(newValue) => setAddress(newValue || '')}
          onPlaceSelect={handlePlaceSelect}
          placeholder="Search for restaurant address..."
          error={error}
          disabled={isLoading}
        />
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City
        </label>
        <select
          value={cityId || ''}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Select a city...</option>
          {cities.map(city => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      {/* Neighborhood Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Neighborhood
        </label>
        <select
          value={neighborhoodId || ''}
          onChange={(e) => handleNeighborhoodChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || !cityId}
        >
          <option value="">Select a neighborhood...</option>
          {availableNeighborhoods.map(neighborhood => (
            <option key={neighborhood.id} value={neighborhood.id}>
              {neighborhood.name}
            </option>
          ))}
        </select>
        {!cityId && (
          <p className="text-xs text-gray-500 mt-1">
            Select a city first to see available neighborhoods
          </p>
        )}
      </div>

      {/* Action buttons for non-auto-save mode */}
      {!autoSave && hasChanges && (
        <div className="flex items-center space-x-2 pt-2">
          <button
            onClick={() => handleSave()}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Check className="w-3 h-3 mr-1" />
            )}
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </button>
        </div>
      )}

      {/* Status indicators */}
      {hasChanges && autoSave && (
        <div className="flex items-center text-xs text-yellow-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Changes will be saved automatically
        </div>
      )}

      {isLoading && (
        <div className="flex items-center text-xs text-blue-600">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {autoSave ? 'Saving changes...' : 'Processing...'}
        </div>
      )}

      {error && (
        <div className="flex items-center text-xs text-red-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default RestaurantAddressCell; 