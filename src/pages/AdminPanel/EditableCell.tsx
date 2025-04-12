// src/pages/AdminPanel/EditableCell.tsx
import React, { useMemo, useEffect, useState } from 'react';
import PlacesInput from '@/components/UI/PlacesInput';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete';

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
}

interface EditableCellProps {
  row: RowData | null;
  col: ColumnConfig;
  isEditing: boolean;
  rowData: Record<string, any>;
  onDataChange: (rowId: number | string | '__NEW_ROW__', changes: Record<string, any>) => void;
  isSaving: boolean;
  cities: City[];
  neighborhoods: Neighborhood[];
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
  const [localNeighborhoodId, setLocalNeighborhoodId] = useState(
    rowData?.neighborhood_id != null ? String(rowData.neighborhood_id) : row?.neighborhood_id != null ? String(row.neighborhood_id) : ''
  );

  const cellValue = rowData?.[col.key] ?? row?.[col.key] ?? '';
  const placeId = rowData?.google_place_id ?? row?.google_place_id ?? null;

  console.log('[EditableCell] Initial rowData for row', row?.id, ':', rowData);
  console.log('[EditableCell] Column:', col.key, 'isEditing:', isEditing, 'inputType:', col.inputType);

  // Sync local state with rowData.neighborhood_id
  useEffect(() => {
    const newNeighborhoodId = rowData?.neighborhood_id != null ? String(rowData.neighborhood_id) : row?.neighborhood_id != null ? String(row.neighborhood_id) : '';
    console.log('[EditableCell] rowData updated for row', row?.id, ':', rowData, 'newNeighborhoodId:', newNeighborhoodId);
    setLocalNeighborhoodId(newNeighborhoodId);
  }, [rowData, row?.id, row?.neighborhood_id]);

  const handleDataUpdate = (fieldKey: string | Record<string, any>, newValue?: any) => {
    const currentRowId = row?.id ?? '__NEW_ROW__';
    if (typeof fieldKey === 'object') {
      console.log('[EditableCell] Updating rowData for row', currentRowId, 'with changes:', fieldKey);
      onDataChange(currentRowId, fieldKey);
      // Update local state if neighborhood_id is in the changes
      if (fieldKey.neighborhood_id != null) {
        setLocalNeighborhoodId(String(fieldKey.neighborhood_id));
      }
    } else {
      console.log('[EditableCell] Updating rowData for row', currentRowId, 'with field:', fieldKey, 'value:', newValue);
      onDataChange(currentRowId, { [fieldKey]: newValue });
      if (fieldKey === 'neighborhood_id' && newValue != null) {
        setLocalNeighborhoodId(String(newValue));
      }
    }
    console.log('[EditableCell] rowData after update for row', currentRowId, ':', rowData);
  };

  const handleAddressChange = (newAddress: string, newPlaceId: string) => {
    handleDataUpdate({
      address: newAddress,
      google_place_id: newPlaceId,
      city_id: '',
      city_name: '',
      neighborhood_id: '',
      neighborhood_name: '',
      lookupFailed: true,
    });
  };

  if (col.key === 'name' && col.inputType === 'google_places') {
    return (
      <div>
        {isEditing ? (
          <PlacesAutocomplete
            rowId={row?.id}
            initialValue={cellValue}
            onPlaceSelected={handleDataUpdate}
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
            rowId={row?.id}
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
          <select
            value={cellValue}
            onChange={(e) => {
              handleDataUpdate(col.key, e.target.value);
              if (e.target.value) {
                handleDataUpdate('neighborhood_id', '');
                handleDataUpdate('neighborhood_name', '');
              }
            }}
            className="w-full p-1 border rounded text-sm"
            disabled={isSaving}
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        ) : (
          <>{col.render ? col.render(cellValue, row ?? {}) : row?.city_name || cellValue || 'N/A'}</>
        )}
      </div>
    );
  }

  if (col.inputType === 'neighborhood_select') {
    const cityId = rowData?.city_id ?? row?.city_id;
    const filteredNeighborhoods = useMemo(() => {
      if (!cityId || !Array.isArray(neighborhoods)) return [];
      return neighborhoods.filter((n) => Number(n.city_id) === Number(cityId));
    }, [cityId, neighborhoods]);

    // Log the first few neighborhoods to verify data
    console.log(
      '[EditableCell] Rendering neighborhood_select for row',
      row?.id,
      'cityId:',
      cityId,
      'cellValue:',
      cellValue,
      'localNeighborhoodId:',
      localNeighborhoodId,
      'filteredNeighborhoods (first 3):',
      filteredNeighborhoods.slice(0, 3),
      'isSaving:',
      isSaving,
      'disabled:',
      isSaving || !cityId
    );

    return (
      <div>
        {isEditing ? (
          <>
            <select
              key={localNeighborhoodId}
              value={localNeighborhoodId}
              onChange={(e) => handleDataUpdate(col.key, e.target.value)}
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
            onChange={(e) => handleDataUpdate(col.key, e.target.value)}
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
            onChange={(e) => handleDataUpdate(col.key, e.target.value)}
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
            onChange={(e) => handleDataUpdate(col.key, e.target.value)}
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
          onChange={(e) => handleDataUpdate(col.key, e.target.value)}
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