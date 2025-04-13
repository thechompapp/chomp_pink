import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { placeService } from '@/services/placeService';
import { filterService } from '@/services/filterService';

interface PlacesInputProps {
  rowId?: string | number;
  initialValue?: string;
  placeId?: string | null;
  onUpdate: (data: Record<string, any>) => void;
  disabled?: boolean;
}

const PlacesInput: React.FC<PlacesInputProps> = ({ 
  rowId, 
  initialValue = '', 
  placeId, 
  onUpdate, 
  disabled 
}) => {
  const [address, setAddress] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [currentPlaceId, setCurrentPlaceId] = useState<string | null>(placeId || null);

  useEffect(() => {
    setAddress(initialValue);
    setCurrentPlaceId(placeId || null);
  }, [initialValue, placeId]);

  useEffect(() => {
    if (currentPlaceId && address) {
      fetchPlaceDetails();
    }
  }, [currentPlaceId, address]);

  const fetchPlaceDetails = async () => {
    if (!currentPlaceId) return;
    try {
      const details = await placeService.getPlaceDetails(currentPlaceId);
      if (details) {
        const newAddress = details.formattedAddress || address;
        let zipcode = details.addressComponents?.find(comp => comp.types.includes('postal_code'))?.short_name;
        if (!zipcode && details.formattedAddress) {
          const zipcodeMatch = details.formattedAddress.match(/\b\d{5}\b/);
          zipcode = zipcodeMatch ? zipcodeMatch[0] : undefined;
        }
        console.log(`[PlacesInput] Extracted zipcode: ${zipcode}`);

        const updates: Record<string, any> = {
          address: newAddress,
          latitude: details.location?.lat || null,
          longitude: details.location?.lng || null,
          google_place_id: currentPlaceId,
          lookupFailed: !zipcode,
        };

        if (zipcode) {
          try {
            const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
            console.log(`[PlacesInput] Neighborhood lookup for zipcode ${zipcode} resolved to:`, neighborhood);
            if (neighborhood && neighborhood.id) {
              updates.city_id = String(neighborhood.city_id);
              updates.city_name = neighborhood.city_name;
              updates.neighborhood_id = String(neighborhood.id);
              updates.neighborhood_name = neighborhood.name;
              updates.lookupFailed = false;
            } else {
              updates.city_id = '';
              updates.city_name = '';
              updates.neighborhood_id = '';
              updates.neighborhood_name = '';
              updates.lookupFailed = true;
              setError(`Could not find neighborhood for ZIP code "${zipcode}". Please select city and neighborhood manually.`);
            }
          } catch (err) {
            updates.city_id = '';
            updates.city_name = '';
            updates.neighborhood_id = '';
            updates.neighborhood_name = '';
            updates.lookupFailed = true;
            setError('Neighborhood lookup failed. Please select city and neighborhood manually.');
          }
        } else {
          updates.city_id = '';
          updates.city_name = '';
          updates.neighborhood_id = '';
          updates.neighborhood_name = '';
          updates.lookupFailed = true;
          setError('No ZIP code found in address. Please select city and neighborhood manually.');
        }

        setAddress(newAddress);
        onUpdate(updates);
      } else {
        setError('Invalid response from Google Places API.');
        onUpdate({
          address: address,
          latitude: null,
          longitude: null,
          google_place_id: currentPlaceId,
          city_id: '',
          city_name: '',
          neighborhood_id: '',
          neighborhood_name: '',
          lookupFailed: true,
        });
      }
    } catch (err) {
      setError('Failed to fetch detailed address information.');
      onUpdate({
        address: address,
        latitude: null,
        longitude: null,
        google_place_id: currentPlaceId,
        city_id: '',
        city_name: '',
        neighborhood_id: '',
        neighborhood_name: '',
        lookupFailed: true,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setCurrentPlaceId(null);
    onUpdate({
      address: newAddress,
      google_place_id: null,
      latitude: null,
      longitude: null,
      city_id: '',
      city_name: '',
      neighborhood_id: '',
      neighborhood_name: '',
      lookupFailed: true,
    });
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={address}
          onChange={handleChange}
          disabled={disabled}
          className="w-full pl-8 pr-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A78B71] focus:border-[#A78B71] disabled:bg-gray-100"
          placeholder="Enter address..."
        />
      </div>
      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}
    </div>
  );
};

export default PlacesInput;