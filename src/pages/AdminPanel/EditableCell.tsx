import React, { useMemo, useEffect, useState, useCallback } from 'react';
import PlacesInput from '@/components/UI/PlacesInput.tsx';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete.tsx';
import { usePlacesApi } from '@/context/PlacesApiContext';
import { filterService } from '@/services/filterService';

interface RowData {
  id?: number | string;
  [key: string]: any;
}

interface ColumnConfig {
  key: string;
  header: string | JSX.Element;
  sortable?: boolean;
  editable?: boolean;
  inputType?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  render?: (value: any, row: RowData) => JSX.Element | string;
}

interface City {
  id: number;
  name: string;
}

interface Neighborhood {
  id: number;
  name: string;
  city_id: number;
  zipcode?: string;
}

interface EditableCellProps {
  row: RowData | null;
  col: ColumnConfig;
  isEditing: boolean;
  rowData: Record<string, any>;
  onDataChange: (rowId: number | string | '__NEW_ROW__', changes: Record<string, any>) => void;
  isSaving: boolean;
  cities: City[] | undefined;
  neighborhoods: Neighborhood[] | undefined;
}

const EditableCell: React.FC<EditableCellProps> = ({
  row,
  col,
  isEditing,
  rowData,
  onDataChange,
  isSaving,
  cities,
  neighborhoods,
}) => {
  const { isAvailable } = usePlacesApi();
  const currentRowId = row?.id ?? '__NEW_ROW__';

  const cellValue = useMemo(() => rowData?.[col.key] ?? row?.[col.key] ?? '', [rowData, row, col.key]);
  const placeId = useMemo(() => rowData?.google_place_id ?? row?.google_place_id ?? null, [rowData, row]);
  const cityId = useMemo(() => 
    rowData?.city_id != null ? String(rowData.city_id) : 
    row?.city_id != null ? String(row.city_id) : '', 
    [rowData, row]
  );
  const neighborhoodId = useMemo(() => 
    rowData?.neighborhood_id != null ? String(rowData.neighborhood_id) : 
    row?.neighborhood_id != null ? String(row.neighborhood_id) : '', 
    [rowData, row]
  );

  // Log the current rowData, dropdown values, and props for debugging
  useEffect(() => {
    if (isEditing) {
      console.log(`[EditableCell] Row ${currentRowId} rowData:`, rowData);
      console.log(`[EditableCell] Row ${currentRowId} cityId: ${cityId}, neighborhoodId: ${neighborhoodId}`);
      console.log(`[EditableCell] Row ${currentRowId} cities:`, cities);
      console.log(`[EditableCell] Row ${currentRowId} neighborhoods:`, neighborhoods);
    }
  }, [isEditing, rowData, cityId, neighborhoodId, currentRowId, cities, neighborhoods]);

  const handleDataUpdate = useCallback((changes: Record<string, any>) => {
    const hasChanges = Object.entries(changes).some(([key, value]) => {
      const currentValue = rowData?.[key] ?? row?.[key];
      return String(currentValue ?? '') !== String(value ?? '');
    });

    if (!hasChanges) {
      return;
    }

    onDataChange(currentRowId, changes);
  }, [currentRowId, rowData, row, onDataChange]);

  const handlePlaceSelected = useCallback(async (placeData: Record<string, any>) => {
    const updates: Record<string, any> = {
      name: placeData.name,
      address: placeData.formatted_address,
      google_place_id: placeData.place_id,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      lookupFailed: false
    };

    if (placeData.zipcode) {
      try {
        const neighborhood = await filterService.findNeighborhoodByZipcode(placeData.zipcode);
        if (neighborhood && neighborhood.id) {
          updates.city_id = String(neighborhood.city_id);
          updates.city_name = neighborhood.city_name || cities?.find(c => c.id === neighborhood.city_id)?.name || '';
          updates.neighborhood_id = String(neighborhood.id);
          updates.neighborhood_name = neighborhood.name;
          updates.lookupFailed = false;
        } else {
          updates.city_id = '';
          updates.city_name = '';
          updates.neighborhood_id = '';
          updates.neighborhood_name = '';
          updates.lookupFailed = true;
        }
      } catch (error) {
        updates.city_id = '';
        updates.city_name = '';
        updates.neighborhood_id = '';
        updates.neighborhood_name = '';
        updates.lookupFailed = true;
      }
    } else {
      updates.city_id = '';
      updates.city_name = '';
      updates.neighborhood_id = '';
      updates.neighborhood_name = '';
      updates.lookupFailed = true;
    }

    handleDataUpdate(updates);
  }, [handleDataUpdate, cities]);

  const handleAddressChange = useCallback((newAddress: string, newPlaceId: string) => {
    handleDataUpdate({
      address: newAddress,
      google_place_id: newPlaceId,
      city_id: '',
      city_name: '',
      neighborhood_id: '',
      neighborhood_name: '',
      lookupFailed: true,
    });
  }, [handleDataUpdate]);

  const handleCityChange = useCallback((cityId: string) => {
    const city = cities?.find(c => String(c.id) === cityId);
    handleDataUpdate({
      city_id: cityId,
      city_name: city?.name ?? '',
      neighborhood_id: '',
      neighborhood_name: '',
    });
  }, [cities, handleDataUpdate]);

  const handleNeighborhoodChange = useCallback((neighborhoodId: string) => {
    const neighborhood = neighborhoods?.find(n => String(n.id) === neighborhoodId);
    handleDataUpdate({
      neighborhood_id: neighborhoodId,
      neighborhood_name: neighborhood?.name ?? '',
    });
  }, [neighborhoods, handleDataUpdate]);

  if (col.key === 'name' && col.inputType === 'google_places') {
    return (
      <div>
        {isEditing ? (
          <PlacesAutocomplete
            rowId={currentRowId}
            initialValue={cellValue}
            onPlaceSelected={handlePlaceSelected}
            disabled={isSaving}
            onAddressChange={handleAddressChange}
          />
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : cellValue || 'N/A'}</>
        )}
      </div>
    );
  }

  if (col.key === 'address' && col.inputType === 'google_places') {
    return (
      <div>
        {isEditing ? (
          <PlacesInput
            rowId={currentRowId}
            initialValue={cellValue}
            placeId={placeId}
            onUpdate={handleDataUpdate}
            disabled={isSaving}
          />
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : cellValue || 'N/A'}</>
        )}
      </div>
    );
  }

  if (col.inputType === 'city_select') {
    return (
      <div>
        {isEditing ? (
          !cities ? (
            <p className="text-xs text-gray-400">Loading cities...</p>
          ) : (
            <select
              value={cityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full p-1 border rounded text-sm"
              disabled={isSaving}
            >
              <option value="">Select a city</option>
              {Array.isArray(cities) && cities.length > 0 ? 
                cities.map((city) => (
                  <option key={city.id} value={String(city.id)}>
                    {city.name}
                  </option>
                ))
              : <option disabled>No cities available</option>}
            </select>
          )
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : row?.city_name || cellValue || 'N/A'}</>
        )}
      </div>
    );
  }

  if (col.inputType === 'neighborhood_select') {
    const cityIdNum = parseInt(cityId, 10);
    const filteredNeighborhoods = useMemo(() => {
      if (!cityId || isNaN(cityIdNum) || !Array.isArray(neighborhoods)) return [];
      const filtered = neighborhoods.filter((n) => Number(n.city_id) === cityIdNum);
      console.log(`[EditableCell] Row ${currentRowId} filteredNeighborhoods for cityId ${cityIdNum}:`, filtered);
      return filtered;
    }, [cityId, neighborhoods, currentRowId]);

    return (
      <div>
        {isEditing ? (
          !neighborhoods ? (
            <p className="text-xs text-gray-400">Loading neighborhoods...</p>
          ) : (
            <>
              <select
                value={neighborhoodId}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                className="w-full p-1 border rounded text-sm"
                disabled={isSaving || !cityId}
              >
                <option value="">Select a neighborhood</option>
                {filteredNeighborhoods.map((neighborhood) => (
                  <option key={neighborhood.id} value={String(neighborhood.id)}>
                    {neighborhood.name}
                  </option>
                ))}
              </select>
              {filteredNeighborhoods.length === 0 && cityId && (
                <p className="text-xs text-yellow-600 mt-1">No neighborhoods for this city.</p>
              )}
              {!cityId && <p className="text-xs text-gray-400 mt-1">Select a city first.</p>}
            </>
          )
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : row?.neighborhood_name || cellValue || 'N/A'}</>
        )}
      </div>
    );
  }

  if (col.inputType === 'select' && col.options) {
    return (
      <div>
        {isEditing ? (
          <select
            value={cellValue}
            onChange={(e) => handleDataUpdate({ [col.key]: e.target.value })}
            className="w-full p-1 border rounded text-sm"
            disabled={isSaving}
          >
            <option value="">Select an option</option>
            {col.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : cellValue || 'N/A'}</>
        )}
      </div>
    );
  }

  if (col.inputType === 'textarea') {
    return (
      <div>
        {isEditing ? (
          <textarea
            value={cellValue}
            onChange={(e) => handleDataUpdate({ [col.key]: e.target.value })}
            className="w-full p-1 border rounded text-sm"
            rows={3}
            disabled={isSaving}
          />
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : cellValue || 'N/A'}</>
        )}
      </div>
    );
  }

  if (col.inputType === 'boolean') {
    return (
      <div>
        {isEditing ? (
          <select
            value={String(cellValue)}
            onChange={(e) => handleDataUpdate({ [col.key]: e.target.value === 'true' })}
            className="w-full p-1 border rounded text-sm"
            disabled={isSaving}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : String(cellValue)}</>
        )}
      </div>
    );
  }

  return (
    <div>
      {isEditing ? (
        <input
          type={col.inputType || 'text'}
          value={cellValue}
          onChange={(e) => handleDataUpdate({ [col.key]: e.target.value })}
          className="w-full p-1 border rounded text-sm"
          disabled={isSaving}
        />
      ) : (
        <>{col.render ? col.render(cellValue, row ?? {}) : cellValue || 'N/A'}</>
      )}
    </div>
  );
};

export default React.memo(EditableCell);