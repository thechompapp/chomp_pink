import React, { useState, useCallback } from 'react';
import { usePlacesApi } from '@/contexts/PlacesApiContext';
import { placeService } from '@/services/placeService';
import { getDefaultApiClient } from '@/services/http';
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';
import { MapPin } from 'lucide-react';
import { PlacePrediction, PlaceDetails, PlacesAutocompleteResponse, PlaceDetailsResponse } from '@/types/Places';

interface RestaurantLocationEditorProps {
  restaurant: {
    id: number;
    name: string;
    address?: string;
    neighborhood_id?: number;
    city_id?: number;
  };
  onUpdate: (updates: {
    address?: string;
    neighborhood_id?: number;
    zipcode?: string;
    lat?: number;
    lng?: number;
  }) => void;
}

interface Neighborhood {
  id: number;
  name: string;
}

const RestaurantLocationEditor: React.FC<RestaurantLocationEditorProps> = ({
  restaurant,
  onUpdate,
}) => {
  const { isAvailable, isLoading: placesApiLoading } = usePlacesApi();
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch neighborhoods when zipcode is available
  const fetchNeighborhoods = useCallback(async (zipcode: string) => {
    try {
      const response = await apiClient<Neighborhood[]>(`/api/neighborhoods/by-zipcode/${zipcode}`);
      setNeighborhoods(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      setNeighborhoods([]);
      setError('Failed to fetch neighborhoods. Please try again.');
    }
  }, []);

  // Handle place selection from Google Places
  const handlePlaceSelect = useCallback(async (place: PlacePrediction) => {
    setIsLoading(true);
    setError(null);
    try {
      const placeDetails = await placeService.getPlaceDetails(place.place_id);
      
      if (!placeDetails) {
        throw new Error('Failed to fetch place details');
      }

      const zipcode = placeDetails.address_components?.find(
        (comp) => comp.types.includes('postal_code')
      )?.long_name;

      if (zipcode) {
        await fetchNeighborhoods(zipcode);
      }

      setSelectedPlace(placeDetails);
      onUpdate({
        address: placeDetails.formatted_address,
        zipcode,
        lat: placeDetails.geometry.location.lat,
        lng: placeDetails.geometry.location.lng,
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
      setError('Failed to fetch place details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchNeighborhoods, onUpdate]);

  // Handle neighborhood selection
  const handleNeighborhoodSelect = useCallback((neighborhoodId: number) => {
    onUpdate({ neighborhood_id: neighborhoodId });
    setError(null);
  }, [onUpdate]);

  // Handle search input changes
  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    setError(null);
    
    if (!isAvailable || value.length < 3) {
      setPlacePredictions([]);
      return;
    }

    try {
      const predictions = await placeService.getAutocompleteSuggestions(value);
      if (predictions.length > 0) {
        setPlacePredictions(predictions);
        setError(null);
      } else {
        setPlacePredictions([]);
        setError('No results found');
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      setPlacePredictions([]);
      setError('Failed to fetch suggestions. Please try again.');
    }
  }, [isAvailable]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={placesApiLoading ? "Loading places service..." : "Search for restaurant location..."}
          className="w-full"
          icon={<MapPin className="w-4 h-4" />}
          disabled={placesApiLoading || !isAvailable}
        />
        {!isAvailable && !placesApiLoading && (
          <div className="text-sm text-red-500 mt-1">
            Places service is currently unavailable. Please try again later.
          </div>
        )}
        {error && (
          <div className="text-sm text-red-500 mt-1">
            {error}
          </div>
        )}
        {placePredictions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            {placePredictions.map((prediction) => (
              <div
                key={prediction.place_id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handlePlaceSelect(prediction)}
              >
                <div className="font-medium">{prediction.structured_formatting.main_text}</div>
                <div className="text-sm text-gray-500">{prediction.structured_formatting.secondary_text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlace && (
        <div className="space-y-2">
          <Input
            type="text"
            value={selectedPlace.formatted_address}
            readOnly
            label="Address"
          />
          
          {neighborhoods.length > 0 && (
            <Select
              value={restaurant.neighborhood_id?.toString() || ''}
              onChange={(e) => handleNeighborhoodSelect(Number(e.target.value))}
              label="Neighborhood"
              options={[
                { value: '', label: 'Select a neighborhood' },
                ...neighborhoods.map(n => ({
                  value: n.id.toString(),
                  label: n.name
                }))
              ]}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default RestaurantLocationEditor; 