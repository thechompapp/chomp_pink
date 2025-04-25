/* src/pages/AdminPanel/EditableCell.jsx */
/* MODIFIED: Conditionally render RestaurantAutocomplete for dish restaurant names */
/* FIXED: Simplified and corrected originalDisplayValue rendering logic */
import React, { useMemo, useCallback } from 'react';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete.jsx';
import RestaurantAutocomplete from '@/components/UI/RestaurantAutocomplete.jsx'; // Ensure import
import { usePlacesApi } from '@/context/PlacesApiContext.jsx';
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';

const EditableCell = ({
  row, // The original data for the row
  col, // The column definition
  isEditing, // Boolean indicating if this cell's row is being edited
  rowData, // The current form data for the row being edited (managed by useAdminTableState)
  onDataChange, // Callback from useAdminTableState to update form data: (rowId, changes) => void
  isSaving, // Boolean indicating if a save operation is in progress
  cities, // Lookup data
  neighborhoods, // Lookup data
  resourceType, // *** ADDED: Pass the resource type (e.g., 'dishes', 'restaurants') ***
}) => {
  // --- Hooks ---
  const { isAvailable: placesApiAvailable } = usePlacesApi();
  const currentRowId = useMemo(() => row?.id ?? '__NEW_ROW__', [row]);
  const columnKey = useMemo(() => col?.key || col?.accessor, [col]); // Ensure we have a valid key

  // --- Memos ---
  const cityId = useMemo(() => String(rowData?.city_id ?? row?.city_id ?? ''), [rowData, row]);
  const neighborhoodId = useMemo(() => String(rowData?.neighborhood_id ?? row?.neighborhood_id ?? ''), [rowData, row]);
  // Use value from form state (rowData) if editing, otherwise use original row data
  const cellValue = useMemo(() => {
      if (isEditing && rowData && columnKey && typeof rowData === 'object') {
          // Use optional chaining for safety, default to empty string if undefined/null
          return rowData[columnKey] ?? '';
      }
      // For display mode, use original row data (handled in originalDisplayValue)
      return ''; // Default for editing mode if rowData is missing
  }, [isEditing, rowData, columnKey]);


  // --- FIXED: Simplified logic for displaying non-editable values ---
  const originalDisplayValue = useMemo(() => {
    if (!row || !columnKey) return <span className="text-gray-400 italic">N/A</span>;

    let value = row[columnKey]; // Access data using the column key/accessor

    // 1. Handle specific column rendering logic first
    if (col.render) {
        // Use the custom render function if provided
        try {
            return col.render(value, row);
        } catch (e) {
            console.error(`[EditableCell] Error in custom render for key "${columnKey}":`, e);
            return <span className="text-red-500 italic">Render Error</span>;
        }
    }
     // Specific key-based rendering (Examples - adapt as needed)
     if (columnKey === 'restaurant_name' && resourceType === 'dishes') {
        const restaurantId = Number(row?.restaurant_id);
        if (!isNaN(restaurantId) && restaurantId > 0) {
            return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{value || `ID: ${restaurantId}`}</a>;
        }
        return value || (row?.restaurant_id ? `ID: ${row.restaurant_id}` : <span className="text-gray-400 italic">N/A</span>);
     }
     if (columnKey === 'city_name') { // Assuming API returns city_name directly now
         return value || <span className="text-gray-400 italic">N/A</span>;
     }
     if (columnKey === 'neighborhood_name') { // Assuming API returns neighborhood_name directly
         return value || <span className="text-gray-400 italic">N/A</span>;
     }
     if (columnKey === 'website' && value) {
        return <a href={value.startsWith('http') ? value : `//${value}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-xs">{value}</a>;
     }

    // 2. Handle general data types
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (col.cellType === 'datetime' && value) { // Use cellType from column definition
      try {
        return new Date(value).toLocaleString();
      } catch (e) {
        return <span className="text-gray-400 italic">Invalid Date</span>;
      }
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : <span className="text-gray-400 italic">None</span>;
    }

    // 3. Handle null/undefined/empty strings
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">N/A</span>;
    }

    // 4. Convert remaining types (numbers, strings) to string and check if empty after trimming
    const stringValue = String(value);
    if (stringValue.trim() === '') {
      return <span className="text-gray-400 italic">N/A</span>;
    }

    // 5. Return the valid string value
    return stringValue;

  }, [row, col, columnKey, resourceType]); // Added resourceType to dependencies


  const relevantNeighborhoods = useMemo(() => {
    if (!cityId || !Array.isArray(neighborhoods)) return [];
    return neighborhoods.filter(n => String(n.city_id) === cityId);
  }, [cityId, neighborhoods]);

  // --- Callbacks ---
  const handleDataUpdate = useCallback((changes) => {
      if (onDataChange) {
        onDataChange(currentRowId, changes);
      } else {
          console.error("[EditableCell] onDataChange handler is missing!");
      }
   }, [currentRowId, onDataChange]);

  const handlePlaceSelected = useCallback((placeData) => {
    if (!placeData) return;
    let zipcode;
    if (placeData.zipcode) { zipcode = placeData.zipcode; }
    else if (placeData.addressComponents) { const pc = placeData.addressComponents.find(c => c.types.includes('postal_code')); zipcode = pc?.short_name || pc?.long_name; }
    else if (placeData.formattedAddress) { const m = placeData.formattedAddress.match(/\b\d{5}\b/); zipcode = m?.[0]; }

    // Trigger update for multiple fields based on place selection
    handleDataUpdate({
        name: placeData.name || '', // Assuming 'name' is the key for restaurant name
        address: placeData.formattedAddress || '',
        google_place_id: placeData.placeId || null,
        latitude: placeData.location?.lat || null,
        longitude: placeData.location?.lng || null,
        zipcode: zipcode || null // Pass zipcode to potentially trigger lookup in parent/hook
    });
  }, [handleDataUpdate]);

  const handleRestaurantSelected = useCallback((selectedRestaurant) => {
    if (selectedRestaurant?.id != null && selectedRestaurant?.name != null) {
        handleDataUpdate({
            restaurant_name: selectedRestaurant.name,
            restaurant_id: selectedRestaurant.id
        });
    } else {
         handleDataUpdate({ restaurant_name: '', restaurant_id: null });
    }
  }, [handleDataUpdate]);

  const handleRestaurantNameInputChange = useCallback((newName) => {
    handleDataUpdate({ restaurant_name: newName, restaurant_id: null });
  }, [handleDataUpdate]);

  const handleCityChange = useCallback((e) => {
    const selectedCityId = e.target.value;
    const selectedCity = cities?.find(c => String(c.id) === selectedCityId);
    handleDataUpdate({
        city_id: selectedCityId || null,
        city_name: selectedCity?.name || null, // Update name too if possible
        neighborhood_id: null, // Reset neighborhood when city changes
        neighborhood_name: null
    });
  }, [cities, handleDataUpdate]);

  const handleNeighborhoodChange = useCallback((e) => {
    const selectedNbId = e.target.value;
    const selectedNb = neighborhoods?.find(n => String(n.id) === selectedNbId);
    handleDataUpdate({
        neighborhood_id: selectedNbId || null,
        neighborhood_name: selectedNb?.name || null // Update name too if possible
    });
  }, [neighborhoods, handleDataUpdate]);

  const handleBooleanChange = useCallback((e) => { handleDataUpdate({ [columnKey]: e.target.value === 'true' }); }, [columnKey, handleDataUpdate]);
  const handleInputChange = useCallback((e) => { handleDataUpdate({ [columnKey]: e.target.value }) }, [columnKey, handleDataUpdate]);
  // --- End Callbacks ---


  // --- Render Logic ---
  if (!isEditing || !col.editable) {
    // Render the calculated display value when not editing
    return <div className="truncate">{originalDisplayValue}</div>;
  }

  // --- Editing Render ---
  const inputProps = {
    value: cellValue, // Use value derived from form state
    onChange: handleInputChange,
    className: "block w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:opacity-50 disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200",
    disabled: isSaving,
    required: col.required,
    'aria-label': typeof col.header === 'string' ? col.header : columnKey, // Use header or key for aria-label
  };

  // --- Specific Input Types ---

  // Restaurant Name (Only for Dishes - Uses Autocomplete)
  if (resourceType === 'dishes' && columnKey === 'restaurant_name') {
      return (
          <RestaurantAutocomplete
              inputValue={cellValue} // Use value from form state
              onRestaurantSelected={handleRestaurantSelected}
              onChange={handleRestaurantNameInputChange} // Handles typing without selecting
              disabled={isSaving}
              required={col.required}
              useLocalSearch={true} // Assuming backend search
              placeholder="Search Restaurant..."
          />
      );
  }

  // Google Places Autocomplete (Only for Restaurant Name when resourceType is 'restaurants')
  if (resourceType === 'restaurants' && col.cellType === 'google_places' && columnKey === 'name') {
      return (
          <PlacesAutocomplete
              rowId={currentRowId}
              initialValue={cellValue}
              onPlaceSelected={handlePlaceSelected}
              disabled={isSaving || !placesApiAvailable}
              enableManualEntry={true} // Allows typing if needed
              required={col.required}
          />
      );
  }

  // City Select
  if (col.cellType === 'city_select') { // Use cellType from column definition
      return (
          <Select {...inputProps} value={cityId} onChange={handleCityChange}>
              <option value="">Select City...</option>
              {Array.isArray(cities) && cities.map(city => (
                  <option key={`city-opt-${city.id}`} value={String(city.id)}>{city.name}</option>
              ))}
          </Select>
      );
  }

  // Neighborhood Select
  if (col.cellType === 'neighborhood_select') { // Use cellType from column definition
    return (
      <Select {...inputProps} value={neighborhoodId} onChange={handleNeighborhoodChange} disabled={isSaving || !cityId || relevantNeighborhoods.length === 0} >
        <option value=""> {!cityId ? '(Select City First)' : relevantNeighborhoods.length === 0 ? 'No Neighborhoods Found' : 'Select Neighborhood...'} </option>
        {relevantNeighborhoods.map(nb => ( <option key={`nb-opt-${nb.id}`} value={String(nb.id)}>{nb.name}</option> ))}
      </Select>
    );
  }

  // Generic Select based on col.options
  if (col.cellType === 'select' && Array.isArray(col.options)) { // Use cellType and check options
      return (
          <Select {...inputProps}>
               {/* Add a default empty option if not required */}
               {!col.required && <option value="">Select...</option>}
              {col.options.map(opt => {
                  // Handle simple string options or object options { value, label }
                  const value = typeof opt === 'object' ? opt.value : opt;
                  const label = typeof opt === 'object' ? opt.label : opt;
                  return <option key={value} value={value}>{label}</option>;
              })}
          </Select>
      );
  }

  // Textarea
  if (col.cellType === 'textarea') { // Use cellType from column definition
      return <textarea {...inputProps} rows={2} />;
  }

  // Boolean Select
  if (col.cellType === 'boolean') { // Use cellType from column definition
      return (
          <Select {...inputProps} onChange={handleBooleanChange} value={String(cellValue === true || cellValue === 'true')}>
              {/* Optional: Add a default/empty option if the field is not required */}
              {/* {!col.required && <option value="">Select...</option>} */}
              <option value="true">Yes</option>
              <option value="false">No</option>
          </Select>
      );
  }

  // Tags/Zipcodes (handled as comma-separated string input)
  if (columnKey === 'tags' || columnKey === 'zipcode_ranges') {
      // Convert array to string for editing, handle string input
      const editValue = Array.isArray(cellValue) ? cellValue.join(', ') : cellValue;
      return <Input {...inputProps} value={editValue} type="text" placeholder="Comma-separated values"/>;
  }


  // Default Text Input (handles text, number, email based on col.cellType)
  const inputType = col.cellType === 'number' ? 'number' : col.cellType === 'email' ? 'email' : 'text';
  return <Input {...inputProps} type={inputType} />;
};

export default React.memo(EditableCell);