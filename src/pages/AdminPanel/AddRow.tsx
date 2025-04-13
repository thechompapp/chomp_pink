import React from 'react';
import Button from '@/components/UI/Button';
import { Save, XCircle as CancelIcon } from 'lucide-react';
import apiClient from '@/services/apiClient';
import EditableCell from './EditableCell';
import { filterService } from '@/services/filterService';

// --- Types ---
interface ColumnConfig {
  key: string;
  header: string | JSX.Element;
  sortable?: boolean;
  editable?: boolean;
  inputType?: string;
  required?: boolean;
}

interface City {
  id: number;
  name: string;
}

interface Neighborhood {
  id: number;
  name: string;
  city_id: number;
  zip_code?: string;
  zip_codes?: string[];
}

interface AddRowProps {
  columns: ColumnConfig[];
  newRowData: Record<string, any>;
  setNewRowData: (fieldKey: string, newValue: any) => void;
  isSaving: boolean;
  setIsSaving: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  onSave?: () => void;
  type: string;
  cities: City[] | undefined;
  neighborhoods: Neighborhood[] | undefined;
  setIsAdding: () => void;
}

const AddRow: React.FC<AddRowProps> = ({
  columns,
  newRowData,
  setNewRowData,
  isSaving,
  setIsSaving,
  setError,
  onSave,
  type,
  cities,
  neighborhoods,
  setIsAdding,
}) => {
  // Add flag to track API availability
  const [placesApiAvailable, setPlacesApiAvailable] = React.useState<boolean>(true);
  
  // Check Places API availability on component mount
  React.useEffect(() => {
    const checkApiAvailability = async () => {
      if (type !== 'restaurants') return;
      
      try {
        // Try a more reliable endpoint or implement a specific status endpoint
        // The autocomplete endpoint seems to be returning 404
        await apiClient('/api/places/details', 'Places API Status Check', {
          method: 'GET',
          params: { place_id: 'test' } // This will fail gracefully but tell us if the service is running
        });
      } catch (err: any) {
        // Consider 404 as API being unavailable specifically for the autocomplete feature
        // But if we get another error code like 400 (bad request), the API might be working
        const isNotFoundError = err?.status === 404 || err?.message?.includes('Not Found');
        
        if (isNotFoundError) {
          console.warn('[AddRow] Places API autocomplete appears to be unavailable:', err);
          setPlacesApiAvailable(false);
          setNewRowData('lookupFailed', true);
        }
      }
    };
    
    checkApiAvailability();
  }, [type, setNewRowData]);

  const handleSaveNewRow = async () => {
    if (!isSaving) {
      setError(null);
      setIsSaving();
      const payload: Record<string, any> = {};
      let validationError: string | null = null;
      
      // Check if we're processing a restaurant with autocomplete issues
      const isRestaurantWithLookupFailure = type === 'restaurants' && newRowData.lookupFailed;
      
      for (const col of columns) {
        if (col.editable) {
          let value = newRowData[col.key];
          
          // Special case for Google Places lookups that failed
          if (col.inputType === 'google_places' && isRestaurantWithLookupFailure) {
            // For failed lookups, we still need to capture manual text entry
            payload[col.key] = typeof value === 'string' ? value.trim() || null : value ?? null;
          } else if (col.inputType === 'boolean') {
            payload[col.key] = String(value) === 'true';
          } else if (col.key === 'tags' && typeof value === 'string') {
            payload[col.key] = value.split(',').map((t) => t.trim()).filter(Boolean);
          } else if (col.inputType === 'number' || col.inputType === 'city_select' || col.inputType === 'neighborhood_select') {
            if (value === '' || value === null || value === undefined) {
              payload[col.key] = null;
            } else {
              // For numeric fields, ensure we're working with proper number values
              const num = Number(value);
              if (isNaN(num)) {
                validationError = `Invalid number entered for ${col.header}.`;
                break;
              }
              payload[col.key] = num;
            }
          } else if (typeof value === 'string') {
            payload[col.key] = value.trim() || null;
          } else {
            payload[col.key] = value ?? null;
          }
          
          // Skip certain validations if we're in manual entry mode for restaurants
          if (isRestaurantWithLookupFailure && 
              (col.key === 'place_id' || col.key === 'google_map_url')) {
            continue;
          }
          
          // Check required fields after any conversions
          if (col.required && (payload[col.key] === null || payload[col.key] === '')) {
            validationError = `${col.header} is required.`;
            break;
          }
        }
      }
      
      if (validationError) {
        setError(validationError);
        setIsSaving();
        return;
      }
      
      if (type !== 'submissions' && (!payload.name || String(payload.name).trim() === '')) {
        setError(`Cannot save: Name is required for new ${type.slice(0, -1)}.`);
        setIsSaving();
        return;
      }
      
      if (type === 'dishes' && (!payload.restaurant_id || payload.restaurant_id <= 0)) {
        setError('Valid Restaurant ID is required for a new dish.');
        setIsSaving();
        return;
      }
      
      if (type === 'neighborhoods' && (!payload.city_id || payload.city_id <= 0)) {
        setError('Valid City ID is required for a new neighborhood.');
        setIsSaving();
        return;
      }
      
      if (type === 'users' && (!payload.username || !payload.email || !payload.password)) {
        setError('Username, Email, and Password are required for a new user.');
        setIsSaving();
        return;
      }
      
      if (type === 'restaurants') {
        const lookupFailed = newRowData.lookupFailed;
        
        // Special handling for Places API failures
        if (lookupFailed) {
          // Ensure we have the minimum required fields for manual entry
          if (!payload.name || String(payload.name).trim() === '') {
            setError('Restaurant name is required, even when lookup fails.');
            setIsSaving();
            return;
          }
          
          if (!payload.city_id || payload.city_id <= 0) {
            setError('City selection is required. Please select a city manually.');
            setIsSaving();
            return;
          }
          
          // Set default values for fields we couldn't get from Places API
          payload.place_id = payload.place_id || null;
          payload.google_map_url = payload.google_map_url || null;
          
          // Note in description that this was manually entered due to API failure
          const existingDesc = payload.description || '';
          if (!existingDesc.includes('[Manual entry]')) {
            payload.description = `[Manual entry] ${existingDesc}`.trim();
          }
        } else {
          // Normal validation for Places API success
          if (!payload.city_id || payload.city_id <= 0) {
            setError('Valid City ID is required for a new restaurant.');
            setIsSaving();
            return;
          }
        }
        
        // Set neighborhood_name in payload if neighborhood_id is provided
        if (payload.neighborhood_id && Array.isArray(neighborhoods) && neighborhoods.length > 0) {
          const neighborhood = neighborhoods.find((n) => Number(n.id) === Number(payload.neighborhood_id));
          if (neighborhood) {
            payload.neighborhood_name = neighborhood.name;
          }
        }
      }
      
      console.log(`Attempting to save new ${type}:`, payload);
      
      try {
        const response = await apiClient(`/api/admin/${type}`, `Admin Create ${type}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!response.success) throw new Error(response.error || `Failed to create new ${type}.`);
        onSave?.();
        setNewRowData({});
        setIsAdding();
      } catch (err) {
        setError((err as Error).message || 'Save failed.');
      } finally {
        setIsSaving();
      }
    }
  };

  // Handle Google Places data or manual fallback
  const handlePlaceSelection = async (placeData: any) => {
    if (!placeData || type !== 'restaurants') return;
    
    // Reset the lookup failed flag since we have data
    setNewRowData('lookupFailed', false);
    
    // Set the restaurant name from the selected place
    setNewRowData('name', placeData.name || '');
    
    // Set the place_id for future reference
    if (placeData.place_id) {
      setNewRowData('place_id', placeData.place_id);
    }
    
    // Format and set address
    let formattedAddress = '';
    if (placeData.formatted_address) {
      formattedAddress = placeData.formatted_address;
      setNewRowData('address', formattedAddress);
    }
    
    // Set Google Maps URL
    if (placeData.url) {
      setNewRowData('google_map_url', placeData.url);
    }
    
    // Perform zipcode lookup
    if (placeData.zipcode) {
      try {
        const neighborhood = await filterService.findNeighborhoodByZipcode(placeData.zipcode);
        console.log('[AddRow] Neighborhood lookup result:', neighborhood);
        if (neighborhood && neighborhood.id) {
          setNewRowData('city_id', String(neighborhood.city_id));
          setNewRowData('city_name', neighborhood.city_name || '');
          setNewRowData('neighborhood_id', String(neighborhood.id));
          setNewRowData('neighborhood_name', neighborhood.name);
          setNewRowData('lookupFailed', false);
        } else {
          console.warn('[AddRow] No neighborhood found for zipcode:', placeData.zipcode);
          setNewRowData('city_id', '');
          setNewRowData('city_name', '');
          setNewRowData('neighborhood_id', '');
          setNewRowData('neighborhood_name', '');
          setNewRowData('lookupFailed', true);
        }
      } catch (error) {
        console.error('[AddRow] Zipcode lookup failed:', error);
        setNewRowData('city_id', '');
        setNewRowData('city_name', '');
        setNewRowData('neighborhood_id', '');
        setNewRowData('neighborhood_name', '');
        setNewRowData('lookupFailed', true);
      }
    } else {
      setNewRowData('city_id', '');
      setNewRowData('city_name', '');
      setNewRowData('neighborhood_id', '');
      setNewRowData('neighborhood_name', '');
      setNewRowData('lookupFailed', true);
    }
  };

  // Enable manual entry mode for Google Places fields
  const enableManualEntry = () => {
    setNewRowData('lookupFailed', true);
    // Clear any existing place data to avoid confusion
    setNewRowData('place_id', null);
    setNewRowData('google_map_url', null);
  };

  return (
    <tr className="bg-blue-50 hover:bg-blue-100 animate-pulse-fast">
      {columns.map((col) => (
        <td key={`add-${col.key}`} className={`px-3 py-1 align-top ${col?.className || ''}`}>
          {col.key === 'actions' ? (
            <div className="flex items-center gap-1.5 py-1">
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveNewRow}
                isLoading={isSaving}
                disabled={isSaving}
                className="!p-1.5"
                title="Save New Row"
              >
                <Save size={14} />
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                onClick={() => {
                  setIsAdding();
                  setNewRowData({});
                  setError(null);
                }}
                disabled={isSaving}
                className="!p-1.5 text-gray-600"
                title="Cancel Add"
              >
                <CancelIcon size={14} />
              </Button>
              
              {/* Add manual entry button for restaurant type when Places API is unavailable */}
              {type === 'restaurants' && !placesApiAvailable && !newRowData.lookupFailed && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={enableManualEntry}
                  disabled={isSaving}
                  className="!p-1.5 text-amber-600"
                  title="Enable Manual Entry Mode"
                >
                  Manual Entry
                </Button>
              )}
            </div>
          ) : (
            <EditableCell
              row={null}
              col={col}
              isEditing={true}
              rowData={{
                ...newRowData,
                // Pass the API availability flag to EditableCell for Google Places fields
                placesApiAvailable: col.inputType === 'google_places' ? placesApiAvailable : undefined
              }}
              onDataChange={(rowId, changes) => {
                Object.entries(changes).forEach(([key, value]) => {
                  setNewRowData(key, value);
                });
                
                // City selection logic
                if (changes.city_id && Array.isArray(cities) && cities.length > 0) {
                  const cityObj = cities.find((c) => Number(c.id) === Number(changes.city_id));
                  if (cityObj) {
                    setNewRowData('city_name', cityObj.name);
                    
                    // Reset neighborhood when city changes
                    setNewRowData('neighborhood_id', '');
                    setNewRowData('neighborhood_name', '');
                  }
                }
                
                // Neighborhood selection logic
                if (changes.neighborhood_id && Array.isArray(neighborhoods) && neighborhoods.length > 0) {
                  const neighborhoodObj = neighborhoods.find((n) => Number(n.id) === Number(changes.neighborhood_id));
                  if (neighborhoodObj) {
                    setNewRowData('neighborhood_name', neighborhoodObj.name);
                  }
                }
                
                // Handle Google Places data (if this change is from place selection)
                if (changes.placeData) {
                  handlePlaceSelection(changes.placeData);
                }
                
                // Handle manual entry mode toggle
                if (changes.enableManualEntry === true) {
                  enableManualEntry();
                }
              }}
              cities={cities}
              neighborhoods={neighborhoods}
              isSaving={isSaving}
            />
          )}
        </td>
      ))}
    </tr>
  );
};

export default React.memo(AddRow);