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
  // --- Hooks MUST be called at the top level ---
  const { isAvailable: placesApiAvailable } = usePlacesApi();
  const currentRowId = row?.id ?? '__NEW_ROW__';

  // Memoized values derived from props or state (rowData)
  const cityId = useMemo(() => String(rowData?.city_id ?? ''), [rowData]);
  const neighborhoodId = useMemo(() => String(rowData?.neighborhood_id ?? ''), [rowData]);
  const cellValue = useMemo(() => {
    const key = col.key;
    const editValue = rowData?.[key];
    return editValue ?? '';
  }, [rowData, col.key]);

  // Calculate relevant neighborhoods based on the current cityId (always calculated)
  const relevantNeighborhoods = useMemo(() => {
    if (!cityId || !Array.isArray(neighborhoods)) return [];
    return neighborhoods.filter(n => String(n.city_id) === cityId);
  }, [cityId, neighborhoods]);

  // Callback Handlers (Defined unconditionally)
  const handleDataUpdate = useCallback((changes) => { onDataChange(currentRowId, changes); }, [currentRowId, onDataChange]);
  const handlePlaceSelected = useCallback((placeData) => {
    if (!placeData) { return; }
    let zipcode;
    if (placeData.zipcode) { zipcode = placeData.zipcode; }
    else if (placeData.addressComponents) { const pc = placeData.addressComponents.find(c => c.types.includes('postal_code')); zipcode = pc?.short_name || pc?.long_name; }
    else if (placeData.formattedAddress) { const m = placeData.formattedAddress.match(/\b\d{5}\b/); zipcode = m?.[0]; }
    const updatePayload = { name: placeData.name || '', address: placeData.formattedAddress || '', google_place_id: placeData.placeId || null, latitude: placeData.location?.lat || null, longitude: placeData.location?.lng || null, zipcode: zipcode || null };
    handleDataUpdate(updatePayload);
  }, [handleDataUpdate]);
  const handleAddressChange = useCallback((newAddress, newPlaceId = null) => { handleDataUpdate({ address: newAddress, google_place_id: newPlaceId }); }, [handleDataUpdate]);
  const handleCityChange = useCallback((e) => { const selectedCityId = e.target.value; const selectedCity = cities?.find(c => String(c.id) === selectedCityId); handleDataUpdate({ city_id: selectedCityId || null, city_name: selectedCity?.name || null, neighborhood_id: null, neighborhood_name: null }); }, [cities, handleDataUpdate]);
  const handleNeighborhoodChange = useCallback((e) => { const selectedNbId = e.target.value; const selectedNb = neighborhoods?.find(n => String(n.id) === selectedNbId); handleDataUpdate({ neighborhood_id: selectedNbId || null, neighborhood_name: selectedNb?.name || null }); }, [neighborhoods, handleDataUpdate]);
  const handleBooleanChange = useCallback((e) => { handleDataUpdate({ [col.key]: e.target.value === 'true' }); }, [col.key, handleDataUpdate]);
  const handleInputChange = useCallback((e) => { handleDataUpdate({ [col.key]: e.target.value }) }, [col.key, handleDataUpdate]);
  const handleRestaurantSelected = useCallback((selectedRestaurant) => { if (selectedRestaurant?.id != null && selectedRestaurant?.name != null) { handleDataUpdate({ restaurant_name: selectedRestaurant.name, restaurant_id: selectedRestaurant.id }); } }, [handleDataUpdate]);
  const handleRestaurantNameInputChange = useCallback((newName) => { handleDataUpdate({ restaurant_name: newName }); }, [handleDataUpdate]);
  // --- End Hooks ---


  // --- Render Logic ---
  const defaultRender = () => { /* ... same as before ... */
    let value = row?.[col.key];
    if (col.key === 'restaurant_name') { return row?.restaurant_name || <span className="text-gray-400 italic">ID: {row?.restaurant_id ?? 'N/A'}</span>; }
    if (col.key === 'city_id') { return row?.city_name || <span className="text-gray-400 italic">ID: {value ?? 'N/A'}</span>; }
    if (col.key === 'neighborhood_id') { return row?.neighborhood_name || <span className="text-gray-400 italic">ID: {value ?? 'N/A'}</span>; }
    if (col.render) return col.render(value, row ?? {});
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(value)) { return value.length > 0 ? value.join(', ') : <span className="text-gray-400 italic">None</span>; }
    if (col.inputType === 'datetime' && value) { try { return new Date(value).toLocaleString(); } catch (e) { /* fallback */ } }
    if (col.key === 'adds') { return String(value ?? 0); }
    if (value !== null && value !== undefined && typeof value !== 'object') { return String(value).trim() !== '' ? String(value) : <span className="text-gray-400 italic">N/A</span>; }
    if (value !== null && value !== undefined) { console.warn(`[EditableCell Default Render] Trying to render unexpected object/array for key "${col.key}":`, value); return <span className="text-red-500 italic">Error: Invalid Data</span>; }
    return <span className="text-gray-400 italic">N/A</span>;
  };

  if (!isEditing || !col.editable) { return defaultRender(); }

  // Editing Render
  const inputProps = {
    value: cellValue,
    onChange: handleInputChange,
    className: "block w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:opacity-50 disabled:bg-gray-100",
    disabled: isSaving,
    required: col.required,
    'aria-label': col.header,
  };

  // Specific Input Types
  if (col.inputType === 'google_places' && col.key === 'name') { return ( <PlacesAutocomplete rowId={currentRowId} initialValue={cellValue} onPlaceSelected={handlePlaceSelected} disabled={isSaving || !placesApiAvailable} enableManualEntry={true} required={col.required} /> ); }
  if (col.inputType === 'text' && col.key === 'address') { return <Input {...inputProps} type="text" />; } // Use standard inputProps
  if (col.inputType === 'restaurant_autocomplete') { return ( <RestaurantAutocomplete initialValue={cellValue} onRestaurantSelected={handleRestaurantSelected} onChange={handleRestaurantNameInputChange} disabled={isSaving} required={col.required} /> ); }
  if (col.inputType === 'city_select') { return ( <Select {...inputProps} value={cityId} onChange={handleCityChange}> <option value="">Select City...</option> {Array.isArray(cities) && cities.map(city => ( <option key={`city-opt-${city.id}`} value={String(city.id)}>{city.name}</option> ))} </Select> ); }
  if (col.inputType === 'neighborhood_select') {
    return (
      <Select {...inputProps} value={neighborhoodId} onChange={handleNeighborhoodChange} disabled={isSaving || !cityId || relevantNeighborhoods.length === 0} >
        <option value=""> {!cityId ? '(Select City First)' : relevantNeighborhoods.length === 0 ? 'No Neighborhoods Found' : 'Select Neighborhood...'} </option>
        {relevantNeighborhoods.map(nb => ( <option key={`nb-opt-${nb.id}`} value={String(nb.id)}>{nb.name}</option> ))}
      </Select>
    );
  }
  if (col.inputType === 'select' && col.options) { return ( <Select {...inputProps}> {col.options.map(opt => ( <option key={opt.value} value={opt.value}>{opt.label}</option> ))} </Select> ); }
  if (col.inputType === 'textarea') { return <textarea {...inputProps} rows={2} />; }
  if (col.inputType === 'boolean') { return ( <Select {...inputProps} onChange={handleBooleanChange} value={String(cellValue === true || cellValue === 'true')}> <option value="true">Yes</option> <option value="false">No</option> </Select> ); }
  // Default text Input
  return <Input {...inputProps} type={col.inputType === 'number' ? 'number' : col.inputType === 'email' ? 'email' : 'text'} />;
};

export default React.memo(EditableCell);