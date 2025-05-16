/* src/pages/AdminPanel/EditableCell.jsx */
/* MODIFIED: Conditionally render RestaurantAutocomplete for dish restaurant names */
/* FIXED: Simplified and corrected originalDisplayValue rendering logic */
/* ADDED: Auto-save functionality when clicking away from cell */
import React, { useMemo, useCallback, useRef } from 'react';
import PlacesAutocomplete from '@/components/UI/PlacesAutocomplete.jsx';
import RestaurantAutocomplete from '@/components/UI/RestaurantAutocomplete.jsx'; // Ensure import
import NeighborhoodAutocomplete from '@/components/UI/NeighborhoodAutocomplete.jsx'; // Import our new component
import CityAutocomplete from '@/components/UI/CityAutocomplete.jsx'; // Import city autocomplete
import { usePlacesApi } from '@/context/PlacesApiContext.jsx';
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';
import { Edit, Loader2 } from 'lucide-react';

const validateField = (value, type, required = false) => {
  if (required && (!value || value.trim() === '')) {
    return 'This field is required';
  }

  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email address';
    case 'url':
      return /^https?:\/\/.+/.test(value) ? null : 'Invalid URL';
    case 'number':
      return !isNaN(value) ? null : 'Must be a number';
    case 'phone':
      return /^\+?[\d\s-()]+$/.test(value) ? null : 'Invalid phone number';
    case 'zipcode':
      return /^\d{5}(-\d{4})?$/.test(value) ? null : 'Invalid zipcode';
    default:
      return null;
  }
};

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
  onStartEdit, // Added onStartEdit prop
  onSaveEdit, // Added onSaveEdit prop to enable auto-save
}) => {
  // --- Hooks ---
  const { isAvailable: placesApiAvailable } = usePlacesApi();
  const currentRowId = useMemo(() => row?.id ?? '__NEW_ROW__', [row]);
  const columnKey = useMemo(() => col?.key || col?.accessor, [col]); // Ensure we have a valid key
  const prevValueRef = useRef(null); // Store previous value to prevent unnecessary auto-saves

  // --- Memos ---
  const cityId = useMemo(() => {
    // Skip computation if both rowData and row are undefined or null
    if ((!rowData || typeof rowData !== 'object') && (!row || typeof row !== 'object')) {
      return '';
    }
    const value = String(rowData?.city_id ?? row?.city_id ?? '');
    // Only log if we have a meaningful value or debug is needed
    if (value) {
      console.log(`[EditableCell] Computed cityId: ${value}, from rowData:`, 
        rowData?.city_id, 'or row:', row?.city_id);
    }
    return value;
  }, [rowData, row]);
  
  const neighborhoodId = useMemo(() => {
    // Skip computation if both rowData and row are undefined or null
    if ((!rowData || typeof rowData !== 'object') && (!row || typeof row !== 'object')) {
      return '';
    }
    const value = String(rowData?.neighborhood_id ?? row?.neighborhood_id ?? '');
    // Only log if we have a meaningful value or debug is needed
    if (value) {
      console.log(`[EditableCell] Computed neighborhoodId: ${value}, from rowData:`, 
        rowData?.neighborhood_id, 'or row:', row?.neighborhood_id);
    }
    return value;
  }, [rowData, row]);
  
  // Use value from form state (rowData) if editing, otherwise use original row data
  const cellValue = useMemo(() => {
    if (isEditing && rowData && columnKey && typeof rowData === 'object') {
        // If we have form data for this cell, use it
        if (rowData[columnKey] !== undefined) {
            return rowData[columnKey];
        }
        // If no form data yet but we have original row data, use that for initial value
        if (row && row[columnKey] !== undefined) {
            return row[columnKey];
        }
        // Fallback to empty string only if truly nothing is available
        return '';
    }
    // For display mode, use original row data (handled in originalDisplayValue)
    return ''; // Default for editing mode if rowData is missing
  }, [isEditing, rowData, columnKey, row]);


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
            return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:underline">{value || `ID: ${restaurantId}`}</a>;
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
        return <a href={value.startsWith('http') ? value : `//${value}`} target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:underline truncate block max-w-xs">{value}</a>;
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
        // Store current value for auto-save comparison
        prevValueRef.current = changes[columnKey];
        onDataChange(currentRowId, changes);
      } else {
          console.error("[EditableCell] onDataChange handler is missing!");
      }
   }, [currentRowId, onDataChange, columnKey]);

  // Add auto-save handler for blur events
  const handleBlur = useCallback(() => {
    // Only auto-save if there's a valid row id and we're in edit mode
    if (onSaveEdit && isEditing && !isSaving && row?.id) {
      // Check if the value has actually changed before saving
      const isValueChanged = prevValueRef.current !== undefined && 
                            JSON.stringify(prevValueRef.current) !== JSON.stringify(row[columnKey]);
      
      // Only log when we're actually saving
      console.log(`[EditableCell] Auto-saving on blur for row ${row.id}, column: ${columnKey}`);
      
      // Even if the value hasn't visibly changed, we still want to save in case
      // other properties were updated (like IDs for autocomplete fields)
      onSaveEdit(row.id);
    }
  }, [onSaveEdit, isEditing, isSaving, row, columnKey]);

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
  if (!isEditing || !col.isEditable) {
    // Render the calculated display value when not editing
    
    // Add onClick to toggle edit mode if the cell is editable
    const handleEditClick = (e) => {
      console.log('[EditableCell] Cell clicked!');
      
      // If this cell is editable and we have a valid onStartEdit function and row
      if (col.isEditable && onStartEdit && row && typeof onStartEdit === 'function') {
        console.log(`[EditableCell] Starting edit for row ${row.id}, column: ${columnKey}`);
        onStartEdit(row);
      }
    };
    
    // Prepare class names based on whether the cell is editable
    const editableCellClasses = col.isEditable 
      ? 'cursor-pointer relative group border-0 hover:bg-muted/50 transition-all duration-150 ease-in-out rounded-sm p-2 flex items-center justify-between' 
      : 'truncate';
    
    return (
      <div 
        className={editableCellClasses}
        onClick={col.isEditable ? handleEditClick : undefined}
        title={col.isEditable ? "Click to edit" : undefined}
        style={col.isEditable ? { minHeight: '36px' } : undefined}
        data-editable={col.isEditable}
        data-column={columnKey}
      >
        <span className="truncate block pr-5 text-foreground">{originalDisplayValue}</span>
        
        {col.isEditable && (
          <div className="absolute right-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit size={16} strokeWidth={1.5} />
          </div>
        )}
      </div>
    );
  }

  // --- Editing Render ---
  const inputProps = {
    value: cellValue,
    onChange: handleInputChange,
    onBlur: handleBlur,
    className: "block w-full p-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-border disabled:opacity-50 disabled:bg-muted bg-background text-foreground",
    disabled: isSaving,
    required: col.required,
    'aria-label': typeof col.header === 'string' ? col.header : columnKey,
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
              onBlur={handleBlur} // Added onBlur to auto-save
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
              onBlur={handleBlur} // Added onBlur to auto-save
          />
      );
  }

  // City Select with Autocomplete
  if (col.cellType === 'city_select') { // Use cellType from column definition
    // Add more detailed logging about cities data
    const cityName = rowData?.city_name || row?.city_name || '';
    const cityId = String(rowData?.city_id ?? row?.city_id ?? '');
    
    console.log('[EditableCell] Rendering CityAutocomplete, cities:', {
      length: cities?.length || 0,
      isArray: Array.isArray(cities),
      sample: cities?.slice(0, 3),
      rowData,
      row,
      cityId,
      cityName,
      // What we're going to send to CityAutocomplete
      cellValueToUse: cityId || cityName
    });
    
    return (
      <CityAutocomplete
        inputValue={cityId || cityName} // Use ID for lookup or name for display
        onCitySelected={(selectedCity) => {
          console.log('[EditableCell] City selected:', selectedCity);
          if (selectedCity?.id) {
            handleDataUpdate({
              city_id: selectedCity.id,
              city_name: selectedCity.name,
              // Reset neighborhood when city changes
              neighborhood_id: null,
              neighborhood_name: null
            });
            // Auto-save after selection
            setTimeout(() => handleBlur(), 100);
          } else {
            handleDataUpdate({ 
              city_id: null,
              city_name: null,
              neighborhood_id: null,
              neighborhood_name: null 
            });
          }
        }}
        onChange={(newName) => {
          // Just update the display name when typing; ID will be updated on selection
          handleDataUpdate({ city_name: newName });
        }}
        disabled={isSaving}
        cities={cities || []}
        placeholder="Search cities..."
        onBlur={handleBlur} // Added onBlur to auto-save
      />
    );
  }

  // Neighborhood Select with Autocomplete
  if (col.cellType === 'neighborhood_select') { // Use cellType from column definition
    const neighborhoodName = rowData?.neighborhood_name || row?.neighborhood_name || '';
    const neighborhoodId = String(rowData?.neighborhood_id ?? row?.neighborhood_id ?? '');
    // Use city_id from rowData first, then from row as fallback
    const effectiveCityId = String(rowData?.city_id ?? row?.city_id ?? '');
    
    console.log('[EditableCell] Rendering NeighborhoodAutocomplete:', {
      neighborhoods: neighborhoods?.length || 0, 
      effectiveCityId, // Log the city ID we're actually passing
      cityId, // Original cityId memo
      rowData_city_id: rowData?.city_id, // Log source of city_id
      row_city_id: row?.city_id, // Log source of city_id
      neighborhoodId,
      neighborhoodName,
      valueToUse: neighborhoodId || neighborhoodName
    });
    
    return (
      <NeighborhoodAutocomplete
        inputValue={neighborhoodId || neighborhoodName} // Use ID for lookup or name for display
        onNeighborhoodSelected={(selectedNeighborhood) => {
          console.log('[EditableCell] Neighborhood selected:', selectedNeighborhood);
          if (selectedNeighborhood?.id) {
            handleDataUpdate({
              neighborhood_id: selectedNeighborhood.id,
              neighborhood_name: selectedNeighborhood.name,
              // Optionally update city if the neighborhood has city information
              ...(selectedNeighborhood.city_id && {
                city_id: selectedNeighborhood.city_id,
                city_name: selectedNeighborhood.city_name
              })
            });
            // Auto-save after selection
            setTimeout(() => handleBlur(), 100);
          } else {
            handleDataUpdate({ 
              neighborhood_id: null,
              neighborhood_name: null
            });
          }
        }}
        onChange={(newName) => {
          // Just update the display name when typing; ID will be updated on selection
          handleDataUpdate({ neighborhood_name: newName });
        }}
        disabled={isSaving || !effectiveCityId} // Use effectiveCityId instead of cityId
        neighborhoods={neighborhoods || []}
        cityId={effectiveCityId} // Use effectiveCityId instead of cityId
        placeholder={effectiveCityId ? "Search neighborhoods..." : "Select a city first"}
        onBlur={handleBlur} // Added onBlur to auto-save
      />
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