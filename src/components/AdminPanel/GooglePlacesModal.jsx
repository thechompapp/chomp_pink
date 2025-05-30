import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Loader2, AlertCircle, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import PlacesAutocompleteInput from '@/components/UI/PlacesAutocompleteInput';
import { placeService } from '@/services/placeService';
import { cn } from '@/lib/utils';

/**
 * Google Places Modal Component
 * 
 * Allows users to search Google Places for restaurant information
 * and apply the data to restaurant records
 */
const GooglePlacesModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  restaurantId,
  currentData = {},
  cities = [],
  neighborhoods = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedPlace(null);
      setExtractedData(null);
      setError(null);
      setDuplicateWarning(null);
    }
  }, [isOpen]);

  // Extract zip code from address
  const extractZipCode = useCallback((address) => {
    if (!address) return null;
    const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
    return zipMatch ? zipMatch[1] : null;
  }, []);

  // Find city and neighborhood by zip code
  const findLocationByZipCode = useCallback(async (zipcode) => {
    if (!zipcode) return { city: null, neighborhood: null };

    try {
      // Use existing neighborhood lookup service
      const response = await fetch(`/api/neighborhoods/zip/${zipcode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        const neighborhoods = await response.json();
        if (neighborhoods && neighborhoods.length > 0) {
          const neighborhood = neighborhoods[0];
          const city = cities.find(c => c.id === neighborhood.city_id);
          return {
            city: city ? { id: city.id, name: city.name } : null,
            neighborhood: { id: neighborhood.id, name: neighborhood.name }
          };
        }
      }
    } catch (error) {
      console.error('Error looking up location by zip:', error);
    }

    return { city: null, neighborhood: null };
  }, [cities]);

  // Handle place selection from Google Places
  const handlePlaceSelect = useCallback(async (placeData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[GooglePlacesModal] ===== PLACE SELECTION DEBUG =====');
      console.log('[GooglePlacesModal] Raw place data received:', JSON.stringify(placeData, null, 2));
      
      // Extract data from Google Places API response
      let extractedInfo = {
        name: '',
        address: '',
        zipcode: null,
        city: null,
        neighborhood: null,
        latitude: null,
        longitude: null,
        googlePlaceId: null,
        addressComponents: null,
        types: null
      };

      // Handle the data structure from PlacesAutocompleteInput (most common case)
      extractedInfo.name = placeData.restaurantName || placeData.name || '';
      extractedInfo.address = placeData.address || placeData.formatted_address || '';
      extractedInfo.zipcode = placeData.zipcode || placeData.postal_code;
      extractedInfo.googlePlaceId = placeData.placeId || placeData.place_id;
      extractedInfo.addressComponents = placeData.addressComponents || placeData.address_components;
      extractedInfo.types = placeData.types;
      
      // Handle coordinates
      extractedInfo.latitude = placeData.lat || placeData.latitude;
      extractedInfo.longitude = placeData.lng || placeData.longitude;

      console.log('[GooglePlacesModal] Initial extracted info:', JSON.stringify(extractedInfo, null, 2));

      // Extract city and neighborhood from address components
      if (extractedInfo.addressComponents && Array.isArray(extractedInfo.addressComponents)) {
        console.log('[GooglePlacesModal] Processing address components:', JSON.stringify(extractedInfo.addressComponents, null, 2));
        
        let potentialCity = null;
        let potentialNeighborhood = null;
        
        for (const component of extractedInfo.addressComponents) {
          const types = component.types || [];
          const longName = component.long_name || component.longText || '';
          const shortName = component.short_name || component.shortText || '';
          
          console.log(`[GooglePlacesModal] Processing component: ${longName} (${shortName}) - types: ${types.join(', ')}`);
          
          // Extract postal code if not already found
          if (types.includes('postal_code') && !extractedInfo.zipcode) {
            extractedInfo.zipcode = longName || shortName;
            console.log(`[GooglePlacesModal] Found postal_code: ${extractedInfo.zipcode}`);
          }
          
          // Extract city - prioritize NYC boroughs (sublocality_level_1) over general locality
          if (types.includes('sublocality_level_1') && types.includes('political')) {
            // This is likely a NYC borough (Brooklyn, Queens, Bronx, Manhattan, Staten Island)
            extractedInfo.city = longName;
            console.log(`[GooglePlacesModal] Found NYC borough as city: ${extractedInfo.city}`);
          } else if (types.includes('locality') && !extractedInfo.city) {
            // Only use locality if we haven't found a borough
            potentialCity = longName;
            console.log(`[GooglePlacesModal] Found potential locality city: ${potentialCity}`);
          } else if (types.includes('administrative_area_level_3') && !extractedInfo.city && !potentialCity) {
            potentialCity = longName;
            console.log(`[GooglePlacesModal] Found admin_area_level_3 city: ${potentialCity}`);
          }
          
          // Extract neighborhood - try various sublocality levels
          if (types.includes('neighborhood')) {
            extractedInfo.neighborhood = longName;
            console.log(`[GooglePlacesModal] Found neighborhood: ${extractedInfo.neighborhood}`);
          } else if (types.includes('sublocality_level_2') && !extractedInfo.neighborhood) {
            potentialNeighborhood = longName;
            console.log(`[GooglePlacesModal] Found potential sublocality_level_2 neighborhood: ${potentialNeighborhood}`);
          } else if (types.includes('sublocality') && !extractedInfo.neighborhood && !potentialNeighborhood) {
            potentialNeighborhood = longName;
            console.log(`[GooglePlacesModal] Found sublocality neighborhood: ${potentialNeighborhood}`);
          }
        }
        
        // Use potential values if no primary values were found
        if (!extractedInfo.city && potentialCity) {
          extractedInfo.city = potentialCity;
          console.log(`[GooglePlacesModal] Using potential city: ${extractedInfo.city}`);
        }
        
        if (!extractedInfo.neighborhood && potentialNeighborhood) {
          extractedInfo.neighborhood = potentialNeighborhood;
          console.log(`[GooglePlacesModal] Using potential neighborhood: ${extractedInfo.neighborhood}`);
        }
        
        console.log('[GooglePlacesModal] After address components processing:', {
          city: extractedInfo.city,
          neighborhood: extractedInfo.neighborhood,
          zipcode: extractedInfo.zipcode
        });
      } else {
        console.log('[GooglePlacesModal] No address components found or not an array');
      }

      // Fallback: extract zip code from address string if not found in components
      if (!extractedInfo.zipcode && extractedInfo.address) {
        const fallbackZip = extractZipCode(extractedInfo.address);
        extractedInfo.zipcode = fallbackZip;
        console.log(`[GooglePlacesModal] Fallback zip extraction from address: ${fallbackZip}`);
      }

      console.log('[GooglePlacesModal] Extracted info after processing:', JSON.stringify(extractedInfo, null, 2));
      setSelectedPlace(placeData);

      // Use zip code lookup first if we have a zip code
      let location = { city: null, neighborhood: null };
      
      if (extractedInfo.zipcode) {
        console.log(`[GooglePlacesModal] Performing zip code lookup for: ${extractedInfo.zipcode}`);
        const zipLookup = await findLocationByZipCode(extractedInfo.zipcode);
        console.log('[GooglePlacesModal] Zip lookup result:', JSON.stringify(zipLookup, null, 2));
        
        if (zipLookup.city) {
          location.city = zipLookup.city;
          console.log(`[GooglePlacesModal] Using zip lookup city: ${zipLookup.city.name}`);
        }
        if (zipLookup.neighborhood) {
          location.neighborhood = zipLookup.neighborhood;
          console.log(`[GooglePlacesModal] Using zip lookup neighborhood: ${zipLookup.neighborhood.name}`);
        }
      }
      
      // Only fallback to Google Places address components if zip lookup failed
      if ((!location.city || !location.neighborhood) && extractedInfo.addressComponents) {
        console.log('[GooglePlacesModal] Zip lookup incomplete, falling back to address components');
        
        // Extract city and neighborhood from address components as fallback
        let potentialCity = extractedInfo.city;
        let potentialNeighborhood = extractedInfo.neighborhood;
        
        // Use address component values if zip lookup didn't provide them
        if (!location.city && potentialCity) {
          location.city = potentialCity;
          console.log(`[GooglePlacesModal] Using address component city: ${potentialCity}`);
        }
        if (!location.neighborhood && potentialNeighborhood) {
          location.neighborhood = potentialNeighborhood;
          console.log(`[GooglePlacesModal] Using address component neighborhood: ${potentialNeighborhood}`);
        }
      }
      
      // Prepare final extracted data with proper city/neighborhood objects
      const extracted = {
        name: extractedInfo.name,
        address: extractedInfo.address,
        zipcode: extractedInfo.zipcode,
        city: location.city, // Should already be an object with id from zip lookup
        neighborhood: location.neighborhood, // Should already be an object with id from zip lookup
        latitude: extractedInfo.latitude,
        longitude: extractedInfo.longitude,
        googlePlaceId: extractedInfo.googlePlaceId,
        addressComponents: extractedInfo.addressComponents,
        types: extractedInfo.types
      };

      console.log('[GooglePlacesModal] ===== FINAL EXTRACTED DATA =====');
      console.log(JSON.stringify(extracted, null, 2));
      console.log('[GooglePlacesModal] ===============================');
      setExtractedData(extracted);
       
    } catch (error) {
      console.error('[GooglePlacesModal] Error processing place selection:', error);
      setError('Failed to process location data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [extractZipCode, findLocationByZipCode]);

  // Handle applying the data
  const handleApply = useCallback(async () => {
    if (!extractedData) return;

    await applyData(extractedData);
  }, [extractedData]);

  // Apply the extracted data
  const applyData = useCallback(async (dataToApply) => {
    try {
      await onApply(restaurantId, dataToApply);
      toast.success('Restaurant information updated successfully');
      onClose();
    } catch (error) {
      console.error('Error applying place data:', error);
      
      // Handle specific error cases
      if (error.statusCode === 409 && error.message.includes('google_place_id')) {
        setError('This restaurant already exists in the database. Another restaurant record is already using this Google Places location.');
        toast.error('Duplicate restaurant: This location is already in the database');
      } else if (error.statusCode === 409) {
        setError('A conflict occurred while updating the restaurant. This may be due to a duplicate name or other conflicting data.');
        toast.error('Update conflict: ' + error.message);
      } else {
        setError('Failed to update restaurant information: ' + error.message);
        toast.error('Failed to update restaurant information');
      }
    }
  }, [onApply, restaurantId, onClose]);

  // Modal title
  const modalTitle = useMemo(() => {
    return `Google Places - Restaurant #${restaurantId}`;
  }, [restaurantId]);

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle}
      dialogClassName="sm:max-w-2xl"
    >
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Search Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Search for Restaurant
          </label>
          <PlacesAutocompleteInput
            value={searchQuery}
            onChange={setSearchQuery}
            onPlaceSelect={handlePlaceSelect}
            placeholder="Search for restaurant (e.g., Joe's Pizza New York)"
            disabled={isLoading}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Start typing to search Google Places for restaurant information
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600">Processing location data...</span>
          </div>
        )}

        {/* Extracted Data Preview */}
        {extractedData && !isLoading && (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              Restaurant Information Found
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Restaurant Name
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {extractedData.name || <span className="italic text-gray-400">Not available</span>}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Address
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {extractedData.address || <span className="italic text-gray-400">Not available</span>}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Zip Code
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {extractedData.zipcode || <span className="italic text-gray-400">Not found</span>}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    City
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {extractedData.city?.name || <span className="italic text-gray-400">Not found</span>}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Neighborhood
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {extractedData.neighborhood?.name || <span className="italic text-gray-400">Not found</span>}
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Coordinates
                  </label>
                  <p className="text-sm text-gray-900 mt-1">
                    {extractedData.latitude && extractedData.longitude 
                      ? `${extractedData.latitude.toFixed(6)}, ${extractedData.longitude.toFixed(6)}`
                      : <span className="italic text-gray-400">Not available</span>
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Current vs New Data Comparison */}
            <div className="text-xs text-gray-500">
              <h5 className="font-medium text-gray-700 mb-2">What will be updated:</h5>
              <ul className="space-y-1">
                {extractedData.name && extractedData.name !== currentData.name && (
                  <li>• Name: {currentData.name || 'Empty'} → {extractedData.name}</li>
                )}
                {extractedData.address && extractedData.address !== currentData.address && (
                  <li>• Address: {currentData.address || 'Empty'} → {extractedData.address}</li>
                )}
                {extractedData.city && extractedData.city.id !== currentData.city_id && (
                  <li>• City: {currentData.city_name || 'Empty'} → {extractedData.city.name}</li>
                )}
                {extractedData.neighborhood && extractedData.neighborhood.id !== currentData.neighborhood_id && (
                  <li>• Neighborhood: {currentData.neighborhood_name || 'Empty'} → {extractedData.neighborhood.name}</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button 
            variant="primary"
            onClick={handleApply}
            disabled={!extractedData || isLoading}
            className="flex items-center"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Apply Information
          </Button>
        </div>
      </div>
    </Modal>
  );
};

GooglePlacesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  restaurantId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentData: PropTypes.object,
  cities: PropTypes.array,
  neighborhoods: PropTypes.array
};

export default GooglePlacesModal; 