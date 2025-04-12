// src/components/UI/PlacesInput.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { MapPin } from 'lucide-react';

const PlacesInput = ({ rowId, initialValue = '', placeId, onUpdate, disabled }) => {
  const [address, setAddress] = useState(initialValue);
  const [error, setError] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [currentPlaceId, setCurrentPlaceId] = useState(placeId);

  useEffect(() => {
    setAddress(initialValue);
    setCurrentPlaceId(placeId);
  }, [initialValue, placeId]);

  useEffect(() => {
    if (currentPlaceId && address) {
      fetchPlaceDetails();
    }
  }, [currentPlaceId, address]);

  const fetchPlaceDetails = async () => {
    if (!currentPlaceId) return;
    try {
      const response = await apiClient(
        `/api/places/details?placeId=${encodeURIComponent(currentPlaceId)}`,
        'PlacesInput Google Places Details'
      );
      if (response.data) {
        setPlaceDetails(response.data);
        const newAddress = response.data.formattedAddress || address;

        // Log the full response to debug structure
        console.log('[PlacesInput] Google Places API Response:', response.data);

        // Extract latitude and longitude
        const latitude = response.data.geometry?.location?.lat || null;
        const longitude = response.data.geometry?.location?.lng || null;

        // Use city directly from the API response if available
        let cityName = response.data.city || '';
        let neighborhoodName = '';

        // Extract ZIP code from response.data.formattedAddress directly
        let postalCode = '';
        const addressForZip = response.data.formattedAddress || newAddress;
        console.log('[PlacesInput] Address used for ZIP extraction:', addressForZip);

        // First, try address_components if available
        const addressComponents = response.data.address_components || [];
        if (addressComponents.length > 0) {
          const postalCodeComponent = addressComponents.find(comp => comp.types.includes('postal_code'));
          if (postalCodeComponent) {
            postalCode = postalCodeComponent.short_name;
            console.log('[PlacesInput] Extracted ZIP Code from address_components:', postalCode);
          }
        }

        // If not found in address_components, try formattedAddress
        if (!postalCode && addressForZip) {
          // Match 5-digit ZIP code, optionally followed by a 4-digit extension, with possible spaces
          const zipCodeMatch = addressForZip.match(/(?:\b|\s)\d{5}(?:-\d{4})?(?:\b|\s)/);
          if (zipCodeMatch) {
            postalCode = zipCodeMatch[0].trim().split('-')[0]; // Take only the 5-digit part
            console.log('[PlacesInput] Extracted ZIP Code from formattedAddress:', postalCode);
          } else {
            console.log('[PlacesInput] No ZIP code found in address:', addressForZip);
          }
        }

        // Fallback: Extract city from formattedAddress if not provided
        if (!cityName && response.data.formattedAddress) {
          const addressParts = response.data.formattedAddress.split(',');
          console.log('[PlacesInput] Formatted Address Parts:', addressParts);

          let stateZipIndex = -1;
          for (let i = 0; i < addressParts.length; i++) {
            const part = addressParts[i].trim();
            if (part.match(/\b[A-Z]{2}\b/) && part.match(/\b\d{5}\b/)) {
              stateZipIndex = i;
              break;
            }
          }

          if (stateZipIndex > 0) {
            cityName = addressParts[stateZipIndex - 1]?.trim() || '';
          } else if (addressParts.length >= 2) {
            const lastPart = addressParts[addressParts.length - 1]?.trim().toLowerCase();
            if (lastPart === 'usa' || lastPart === 'united states') {
              cityName = addressParts[addressParts.length - 3]?.trim() || '';
            } else {
              cityName = addressParts[addressParts.length - 2]?.trim() || '';
            }
          }
        }

        // Fetch city ID based on city name
        let cityId = null;
        let neighborhoodId = null;
        let lookupFailed = true;

        if (cityName) {
          try {
            const cityResponse = await apiClient(
              `/api/admin/lookup/cities`,
              'PlacesInput City Lookup'
            );
            const cities = cityResponse.data || [];
            console.log('[PlacesInput] Available Cities:', cities);

            const normalizedCityName = cityName.toLowerCase().replace('city', '').replace('borough of', '').trim();
            const city = cities.find((c) => {
              const normalizedBackendCity = c.name.toLowerCase().replace('city', '').replace('borough of', '').trim();
              return normalizedBackendCity === normalizedCityName || c.name.toLowerCase() === cityName.toLowerCase();
            });

            if (city) {
              cityId = city.id;
              console.log('[PlacesInput] Matched City:', city);

              // Look up neighborhood by ZIP code if available
              if (cityId && postalCode) {
                const neighborhoodResponse = await apiClient(
                  `/api/neighborhoods/by-zipcode?zipcode=${postalCode}`,
                  'PlacesInput Neighborhood Lookup by ZIP'
                );
                const neighborhoodData = neighborhoodResponse.data;
                console.log('[PlacesInput] Neighborhood Lookup Response:', neighborhoodData);

                if (neighborhoodData && neighborhoodData.id && neighborhoodData.name) {
                  neighborhoodId = neighborhoodData.id;
                  neighborhoodName = neighborhoodData.name;
                  console.log('[PlacesInput] Matched Neighborhood by ZIP:', neighborhoodData);
                  lookupFailed = false;
                } else {
                  console.log('[PlacesInput] No matching neighborhood found for ZIP:', postalCode);
                  setError(`Could not find a neighborhood for ZIP code "${postalCode}" in city "${cityName}". Please select manually.`);
                  lookupFailed = true;
                }
              } else {
                console.log('[PlacesInput] No ZIP code available to look up neighborhood.');
                // Do not set an error; allow manual selection without forcing it
                lookupFailed = true;
              }
            } else {
              console.log('[PlacesInput] No matching city found for:', cityName);
              setError(`Could not find city "${cityName}" in the database. Please select manually.`);
              lookupFailed = true;
            }
          } catch (err) {
            console.error('[PlacesInput] City/Neighborhood lookup failed:', err);
            setError('Failed to resolve city or neighborhood. Please select manually.');
            lookupFailed = true;
          }
        } else {
          console.log('[PlacesInput] Could not extract city name from address components or formatted address.');
          setError('Unable to determine city from address. Please select manually.');
          lookupFailed = true;
        }

        // Update the address state after all processing
        setAddress(newAddress);

        // Update with all relevant data
        onUpdate({
          address: newAddress,
          latitude: latitude,
          longitude: longitude,
          google_place_id: currentPlaceId,
          city_id: cityId || '',
          city_name: cityName || '',
          neighborhood_id: neighborhoodId || '',
          neighborhood_name: neighborhoodName || '',
          lookupFailed: lookupFailed,
        });

        const neighborhoodEvent = new CustomEvent('neighborhood-resolved', {
          detail: {
            rowId,
            neighborhoodId: neighborhoodId || null,
            neighborhoodName: neighborhoodName || null,
            cityId: cityId || null,
            cityName: cityName || null,
            zipcode: postalCode || null,
          },
        });
        document.dispatchEvent(neighborhoodEvent);
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
      console.error('[PlacesInput] Error fetching place details:', err);
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

  const handleChange = (e) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    setCurrentPlaceId(null);
    onUpdate({
      address: newAddress,
      google_place_id: null,
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
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default PlacesInput;