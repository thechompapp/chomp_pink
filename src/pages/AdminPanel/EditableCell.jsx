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
  displayChanges = {}, // Added: Display changes from data cleanup
  isDataCleanup = false, // Flag to indicate if this is part of data cleanup process
}) => {
  // --- Hooks ---
  const { isAvailable: placesApiAvailable } = usePlacesApi();
  const currentRowId = useMemo(() => row?.id ?? '__NEW_ROW__', [row]);
  const columnKey = useMemo(() => col?.key || col?.accessor, [col]); // Ensure we have a valid key
  const prevValueRef = useRef(null); // Store previous value for auto-save comparison

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

  // Check if we have display changes for this field
  const hasDisplayChange = useMemo(() => {
    return displayChanges && typeof displayChanges === 'object' && 
           displayChanges[resourceType] && 
           displayChanges[resourceType][currentRowId] && 
           displayChanges[resourceType][currentRowId][columnKey] !== undefined;
  }, [displayChanges, resourceType, currentRowId, columnKey]);

  // Get formatted display value from cleanup changes
  const formattedDisplayValue = useMemo(() => {
    if (hasDisplayChange && displayChanges[resourceType] && 
        displayChanges[resourceType][currentRowId] && 
        displayChanges[resourceType][currentRowId][columnKey]) {
      console.log(`[EditableCell] Using formatted value for ${columnKey}:`, displayChanges[resourceType][currentRowId][columnKey]);
      return displayChanges[resourceType][currentRowId][columnKey].displayValue;
    }
    return null; // No formatted value available
  }, [hasDisplayChange, resourceType, currentRowId, columnKey, displayChanges]);

  // --- FIXED: Simplified logic for displaying non-editable values ---
  const originalDisplayValue = useMemo(() => {
    if (!row || !columnKey) return <span className="text-gray-400 italic">N/A</span>;

    // Check for formatted values directly in row data (from GenericAdminTableTab)
    const formattedField = `${columnKey}_formatted`;
    const displayField = `${columnKey}_display`;
    const hiddenField = `${columnKey}_hidden`;
    
    if (row[hiddenField]) {
      return <span className="text-gray-400 italic">[Hidden]</span>;
    }
    
    if (row[formattedField] !== undefined) {
      return (
        <span className="flex items-center">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1">
            Clean
          </span>
          {row[formattedField] || <span className="text-gray-400 italic">N/A</span>}
        </span>
      );
    }
    
    if (row[displayField] !== undefined) {
      return (
        <span className="flex items-center">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-1">
            Formatted
          </span>
          {row[displayField] || <span className="text-gray-400 italic">N/A</span>}
        </span>
      );
    }
    
    // Also check displayChanges object if no formatted fields in row
    if (hasDisplayChange && displayChanges[resourceType] && 
        displayChanges[resourceType][currentRowId] && 
        displayChanges[resourceType][currentRowId][columnKey]) {
      const changeType = displayChanges[resourceType][currentRowId][columnKey].type;
      const changeValue = formattedDisplayValue;
      
      console.log(`[EditableCell] Rendering formatted value for ${columnKey}:`, {
        changeType,
        changeValue,
        displayChanges: displayChanges[resourceType][currentRowId][columnKey]
      });
      
      // Check if this field should be hidden
      if (changeType === 'hideColumn') {
        return <span className="text-gray-400 italic">[Hidden]</span>;
      }
      
      // Apply special formatting based on change type
      if (changeType === 'replaceIdWithName') {
        return (
          <span className="flex items-center">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mr-1">
              Formatted
            </span>
            {changeValue || <span className="text-gray-400 italic">N/A</span>}
          </span>
        );
      }
      
      // For any other change type, just show the formatted value with an indicator
      return (
        <span className="flex items-center">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1">
            Clean
          </span>
          {changeValue || <span className="text-gray-400 italic">N/A</span>}
        </span>
      );
    }

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

  }, [row, col, columnKey, resourceType, isDataCleanup, hasDisplayChange, displayChanges, formattedDisplayValue]); 

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

  const handleEditClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onStartEdit && row) {
      onStartEdit(row);
    } else {
        console.error("[EditableCell] onStartEdit handler is missing or row is undefined!");
    }
  };

  // --- Conditional Rendering ---
  if (isEditing) {
      // --- RENDERING FOR EDITING MODE ---

      // *** Enhanced Input Selection Logic - Add more input types as needed ***
      let inputElement;
      
      // Override cell format based on column key if needed
      switch (columnKey) {
          // Location fields with Google Places Autocomplete
          case 'address':
          case 'street_address':
              inputElement = (
                <PlacesAutocomplete
                  value={cellValue || ''}
                  onChange={(place) => {
                    handleDataUpdate({
                      [columnKey]: place.formatted_address || place.name || '',
                      // Store coordinates if available
                      latitude: place.geometry?.location?.lat ? String(place.geometry.location.lat()) : null,
                      longitude: place.geometry?.location?.lng ? String(place.geometry.location.lng()) : null,
                      // Also store place_id to avoid future lookups if needed
                      place_id: place.place_id || null
                    })
                  }}
                  onInputChange={(value) => handleDataUpdate({ [columnKey]: value })}
                  placeholder="Enter address..."
                  className="w-full bg-background"
                  disabled={!placesApiAvailable || isSaving}
                  onBlur={handleBlur}
                  required={col.required}
                />
              );
              break;
          
          // Neighborhood selection (with City context)
          case 'neighborhood_id':
              inputElement = (
                  <NeighborhoodAutocomplete
                    value={cellValue || ''}
                    onChange={(newId) => {
                      handleDataUpdate({ [columnKey]: newId });
                    }}
                    onInputChange={(value) => {
                      // Only update if the input is manually cleared
                      if (!value) handleDataUpdate({ [columnKey]: '' });
                    }}
                    neighborhoods={relevantNeighborhoods}
                    cityId={cityId}
                    placeholder="Select neighborhood..."
                    className="w-full max-w-md"
                    disabled={isSaving}
                    onBlur={handleBlur}
                  />
              );
              break;
          
          // City selection
          case 'city_id':
              inputElement = (
                <CityAutocomplete
                  value={cellValue || ''}
                  onChange={(newId) => {
                    handleDataUpdate({ [columnKey]: newId });
                    
                    // Reset neighborhood if changing city
                    if (neighborhoodId && rowData?.neighborhood_id) {
                      handleDataUpdate({ neighborhood_id: '' });
                    }
                  }}
                  onInputChange={(value) => {
                    // Only update if the input is manually cleared
                    if (!value) {
                      handleDataUpdate({ [columnKey]: '' });
                      if (neighborhoodId) handleDataUpdate({ neighborhood_id: '' });
                    }
                  }}
                  cities={cities || []}
                  placeholder="Select city..."
                  className="w-full max-w-md"
                  disabled={isSaving}
                  onBlur={handleBlur}
                />
              );
              break;
          
          // Restaurant selection for dishes
          case 'restaurant_id':
              if (resourceType === 'dishes') {
                inputElement = (
                  <RestaurantAutocomplete
                    value={cellValue || ''}
                    onChange={(newId) => {
                      handleDataUpdate({ [columnKey]: newId });
                    }}
                    onInputChange={(value) => {
                      // Only update if the input is manually cleared
                      if (!value) handleDataUpdate({ [columnKey]: '' });
                    }}
                    placeholder="Select restaurant..."
                    className="w-full max-w-md"
                    disabled={isSaving}
                    onBlur={handleBlur}
                  />
                );
              } else {
                // Other resource types can use default input
                inputElement = (
                  <Input
                    value={cellValue || ''}
                    onChange={(e) => handleDataUpdate({ [columnKey]: e.target.value })}
                    placeholder={`Enter ${col.header || columnKey}`}
                    className="w-full max-w-md"
                    disabled={isSaving}
                    onBlur={handleBlur}
                    type="number"
                  />
                );
              }
              break;
          
          case 'account_type':
              inputElement = (
                <Select
                  value={cellValue || ''}
                  onChange={(e) => handleDataUpdate({ [columnKey]: e.target.value })}
                  className="w-full max-w-md"
                  disabled={isSaving}
                  onBlur={handleBlur}
                >
                  <option value="">Select account type</option>
                  <option value="regular">Regular</option>
                  <option value="user">User</option>
                  <option value="administrator">Administrator</option>
                  <option value="superuser">Superuser</option>
                </Select>
              );
              break;
          
          case 'status':
              inputElement = (
                <Select
                  value={cellValue || ''}
                  onChange={(e) => handleDataUpdate({ [columnKey]: e.target.value })}
                  className="w-full max-w-md"
                  disabled={isSaving}
                  onBlur={handleBlur}
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </Select>
              );
              break;
  
          case 'is_active':
          case 'is_verified':
          case 'is_public':
              inputElement = (
                <Select
                  value={String(cellValue || 'false')}
                  onChange={(e) => {
                    const val = e.target.value === 'true';
                    handleDataUpdate({ [columnKey]: val })
                  }}
                  className="w-full max-w-md"
                  disabled={isSaving}
                  onBlur={handleBlur}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              );
              break;
          
          // Fallback to appropriate input type for other fields
          default:
              // Default input type
              let inputType = 'text';
              
              // Map column data type to appropriate input type
              if (columnKey.includes('_id') && columnKey !== 'place_id') {
                inputType = 'number';
              } else if (columnKey === 'website' || columnKey === 'url') {
                inputType = 'url';
              } else if (columnKey === 'email') {
                inputType = 'email';
              } else if (columnKey === 'price' || columnKey.includes('_price')) {
                inputType = 'number';
                // Add step for decimal values
                inputElement = (
                  <Input
                    value={cellValue || ''}
                    onChange={(e) => handleDataUpdate({ [columnKey]: e.target.value })}
                    placeholder={`Enter ${col.header || columnKey}`}
                    className="w-full max-w-md"
                    disabled={isSaving}
                    onBlur={handleBlur}
                    type={inputType}
                    step="0.01"
                  />
                );
                break;
              }
              
              if (!inputElement) {
                inputElement = (
                  <Input
                    value={cellValue || ''}
                    onChange={(e) => handleDataUpdate({ [columnKey]: e.target.value })}
                    placeholder={`Enter ${col.header || columnKey}`}
                    className="w-full max-w-md"
                    disabled={isSaving}
                    onBlur={handleBlur}
                    type={inputType}
                  />
                );
              }
              break;
      }
      
      return (
          <div className="relative">
              {inputElement}
              {isSaving && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
              )}
              {/* *** REMOVED: Validation - We should either handle this at the row level or via toast messages *** */}
          </div>
      );
  }

  // --- RENDERING FOR DISPLAY MODE ---
  return (
      <div 
          className={`group relative ${col.isEditable ? 'cursor-pointer hover:bg-muted/30 p-1 -m-1 rounded' : ''}`}
          onClick={col.isEditable ? handleEditClick : undefined}
          title={col.isEditable ? `Click to edit ${col.header || columnKey}` : null}
      >
          {originalDisplayValue}
          {col.isEditable && (
              <div className="absolute -right-1 -top-1 p-1 rounded-full bg-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="h-3 w-3 text-gray-600" />
              </div>
          )}
      </div>
  );
};

export default React.memo(EditableCell);