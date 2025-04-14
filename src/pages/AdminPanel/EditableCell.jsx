/* src/pages/AdminPanel/EditableCell.jsx */
import React, { useMemo, useCallback } from 'react';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete.jsx';
import RestaurantAutocomplete from '@/components/UI/RestaurantAutocomplete.jsx';
import { usePlacesApi } from '@/context/PlacesApiContext.jsx';
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';

const EditableCell = ({
  row,
  col,
  isEditing,
  rowData,
  onDataChange,
  isSaving,
  cities,
  neighborhoods,
}) => {
  const { isAvailable: placesApiAvailable } = usePlacesApi();
  const currentRowId = row?.id ?? '__NEW_ROW__';

  // --- Memoized Values ---
  const cellValue = useMemo(() => {
    const key = col.key;
    const editValue = rowData?.[key];
    const originalValue = row?.[key];
    if (key === 'restaurant_name' && editValue !== undefined) {
        return editValue ?? '';
    }
    // Prioritize edit state, then original data, fallback to empty string
    return editValue !== undefined ? (editValue ?? '') : (originalValue ?? '');
  }, [rowData, row, col.key]);

  const cityId = useMemo(() => String(rowData?.city_id ?? row?.city_id ?? ''), [rowData, row]);
  const neighborhoodId = useMemo(() => String(rowData?.neighborhood_id ?? row?.neighborhood_id ?? ''), [rowData, row]);

  // --- Callback Handlers (Keep existing callbacks) ---
  const handleDataUpdate = useCallback((changes) => {
    const hasActualChange = Object.entries(changes).some(([key, value]) => {
        let currentValue;
        if (key === 'restaurant_name') { currentValue = row?.restaurant_name; }
        else { currentValue = rowData?.[key] ?? row?.[key]; }
        return String(currentValue ?? '') !== String(value ?? '');
    });
    if (hasActualChange) { onDataChange(currentRowId, changes); }
  }, [currentRowId, rowData, row, onDataChange]);

  const handlePlaceSelected = useCallback(async (placeData) => { handleDataUpdate(placeData); }, [handleDataUpdate]);
  const handleAddressChange = useCallback((newAddress, newPlaceId) => { handleDataUpdate({ address: newAddress, google_place_id: newPlaceId }); }, [handleDataUpdate]);
  const handleCityChange = useCallback((e) => { const selectedCityId = e.target.value; const selectedCity = cities?.find(c => String(c.id) === selectedCityId); handleDataUpdate({ city_id: selectedCityId || null, city_name: selectedCity?.name || null, neighborhood_id: null, neighborhood_name: null }); }, [cities, handleDataUpdate]);
  const handleNeighborhoodChange = useCallback((e) => { const selectedNbId = e.target.value; const selectedNb = neighborhoods?.find(n => String(n.id) === selectedNbId); handleDataUpdate({ neighborhood_id: selectedNbId || null, neighborhood_name: selectedNb?.name || null }); }, [neighborhoods, handleDataUpdate]);
  const handleBooleanChange = useCallback((e) => { handleDataUpdate({ [col.key]: e.target.value === 'true' }); }, [col.key, handleDataUpdate]);
  const handleInputChange = useCallback((e) => { handleDataUpdate({ [col.key]: e.target.value }) }, [col.key, handleDataUpdate]);
  const handleRestaurantSelected = useCallback((selectedRestaurant) => { if (selectedRestaurant?.id != null && selectedRestaurant?.name != null) { handleDataUpdate({ restaurant_name: selectedRestaurant.name, restaurant_id: selectedRestaurant.id }); } }, [handleDataUpdate]);
  const handleRestaurantNameInputChange = useCallback((newName) => { handleDataUpdate({ restaurant_name: newName }); }, [handleDataUpdate]);

  // --- Render Logic ---

  // Default Render (Non-editing or simple display)
  const defaultRender = () => {
    let value = row?.[col.key];
    if (col.key === 'restaurant_name') {
        value = row?.restaurant_name;
        return value || <span className="text-gray-400 italic">ID: {row?.restaurant_id ?? 'N/A'}</span>;
    }
    if (col.render) return col.render(value, row ?? {});
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : <span className="text-gray-400 italic">None</span>;
    }
    if (col.inputType === 'datetime' && value) {
        try { return new Date(value).toLocaleString(); } catch (e) { /* fallback below */ }
    }
    if (col.key === 'adds') { return String(value ?? 0); }

    // ** Fallback Check **: Only attempt String() if it's not an object/array
    if (value !== null && value !== undefined) {
        if (typeof value !== 'object') { // Allow string, number, boolean
             return String(value).trim() !== '' ? String(value) : <span className="text-gray-400 italic">N/A</span>;
        } else {
            // If it's an object or array unexpectedly, don't try to render it directly
             console.warn(`[EditableCell] Trying to render unexpected object/array for key "${col.key}":`, value);
             return <span className="text-red-500 italic">Error: Invalid Data</span>;
        }
    }
    // Default for null/undefined
    return <span className="text-gray-400 italic">N/A</span>;
  };

  if (!isEditing || !col.editable) {
    return defaultRender();
  }

  // --- Editing Render (Keep existing logic for different input types) ---
  const inputProps = {
    value: cellValue,
    onChange: handleInputChange,
    className: "w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399]",
    disabled: isSaving,
    required: col.required,
  };

  if (col.inputType === 'google_places' && col.key === 'name') {
     return ( <PlacesAutocomplete rowId={currentRowId} initialValue={cellValue} onPlaceSelected={handlePlaceSelected} onAddressChange={handleAddressChange} disabled={isSaving || !placesApiAvailable} enableManualEntry={true} required={col.required} /> );
   }
  if (col.inputType === 'restaurant_autocomplete') {
      return ( <RestaurantAutocomplete initialValue={cellValue} onRestaurantSelected={handleRestaurantSelected} onChange={handleRestaurantNameInputChange} disabled={isSaving} required={col.required} /> );
  }
  if (col.inputType === 'city_select') { /* ... existing city select ... */
      return ( <Select {...inputProps} value={cityId} onChange={handleCityChange} > <option value="">Select City...</option> {cities?.map(city => ( <option key={city.id} value={city.id}>{city.name}</option> ))} </Select> );
  }
  if (col.inputType === 'neighborhood_select') { /* ... existing neighborhood select ... */
      const relevantNeighborhoods = neighborhoods?.filter(n => String(n.city_id) === cityId);
      return ( <Select {...inputProps} value={neighborhoodId} onChange={handleNeighborhoodChange} disabled={isSaving || !cityId}> <option value="">{cityId ? 'Select Neighborhood...' : '(Select City First)'}</option> {relevantNeighborhoods?.map(nb => ( <option key={nb.id} value={nb.id}>{nb.name}</option> ))} </Select> );
  }
  if (col.inputType === 'select' && col.options) { /* ... existing generic select ... */
      return ( <Select {...inputProps}> {col.options.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))} </Select> );
  }
  if (col.inputType === 'textarea') { /* ... existing textarea ... */
      return <textarea {...inputProps} rows={2} />;
  }
  if (col.inputType === 'boolean') { /* ... existing boolean select ... */
      return ( <Select {...inputProps} onChange={handleBooleanChange}> <option value="true">Yes</option> <option value="false">No</option> </Select> );
   }
  // Default Text Input
  return <Input {...inputProps} type={col.inputType === 'number' ? 'number' : col.inputType === 'email' ? 'email' : 'text'} />;

};

export default React.memo(EditableCell);