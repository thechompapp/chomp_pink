// src/pages/AdminPanel/AddRow.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Button from '@/components/UI/Button.jsx';
import { Save, XCircle as CancelIcon } from 'lucide-react';
import apiClient from '@/services/apiClient.js'; // Use .js
import EditableCell from './EditableCell.jsx'; // Use .jsx
// Updated import to use named export following API standardization pattern
import { filterService } from '@/services/filterService.js'; // Consistent with other service imports
import { usePlacesApi } from '@/context/PlacesApiContext'; // Use .jsx

// --- REMOVED: TypeScript interfaces ---

const AddRow = ({ // Removed : React.FC<AddRowProps>
  columns,
  newRowData,
  setNewRowData,
  isSaving,
  setIsSaving, // Likely comes from parent hook now
  setError, // General error state setter from parent hook
  onSave, // Callback from parent hook (useAdminTableState's handleSaveNewRow)
  type,
  cities,
  neighborhoods,
  setIsAdding, // Function from parent hook to cancel adding mode
}) => {
  const { isAvailable: placesApiAvailable } = usePlacesApi(); // Use context hook

  // Trigger save logic in the parent hook
  const handleTriggerSave = () => {
    if (onSave) {
        onSave(); // Call the handleSaveNewRow function passed from useAdminTableState
    } else {
        console.error("[AddRow] onSave prop is missing!");
    }
  };

  // Handle Google Places data selection
  const handlePlaceSelection = useCallback(async (placeData) => { // Removed type annotation
    if (!placeData || type !== 'restaurants') return;

    const updates = { // Removed type annotation
      name: placeData.name || '',
      address: placeData.formatted_address || '',
      google_place_id: placeData.place_id || null,
      latitude: placeData.location?.lat || null,
      longitude: placeData.location?.lng || null,
      lookupFailed: false,
      // Reset geo fields before lookup
      city_id: '',
      city_name: '',
      neighborhood_id: '',
      neighborhood_name: '',
    };

    const zipcode = placeData.zipcode || // Use zipcode if backend provides it
                    placeData.formatted_address?.match(/\b\d{5}\b/)?.[0]; // Fallback regex

    if (zipcode) {
      try {
        // Use the correctly imported filterService
        const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
        if (neighborhood && neighborhood.id) {
          updates.city_id = String(neighborhood.city_id);
          updates.city_name = neighborhood.city_name || cities?.find(c => c.id === neighborhood.city_id)?.name || '';
          updates.neighborhood_id = String(neighborhood.id);
          updates.neighborhood_name = neighborhood.name;
        } else {
          updates.lookupFailed = true;
        }
      } catch (error) {
        console.error('[AddRow handlePlaceSelection] Error looking up neighborhood by zipcode:', error); // Added error logging
        updates.lookupFailed = true;
      }
    } else {
      updates.lookupFailed = true;
    }

    // Apply all updates at once using the provided setter function
    Object.entries(updates).forEach(([key, value]) => {
      setNewRowData(key, value);
    });

  }, [type, cities, setNewRowData, filterService]); // Added filterService to dependency array

  // Enable manual entry mode
  const enableManualEntry = useCallback(() => {
    setNewRowData('lookupFailed', true);
    setNewRowData('place_id', null);
    setNewRowData('google_map_url', null); // Assuming this field might exist
  }, [setNewRowData]);

  return (
    <tr className="bg-blue-50 hover:bg-blue-100">
      {/* Skip Select Checkbox Column */}
      {columns.filter(col => col.key !== 'select').map((col) => (
        <td key={`add-${col.key}`} className={`px-3 py-1 align-top ${col?.className || ''}`}>
          {col.key === 'actions' ? (
            <div className="flex items-center gap-1.5 py-1">
              <Button size="sm" variant="primary" onClick={handleTriggerSave} isLoading={isSaving} disabled={isSaving} className="!p-1.5" title="Save New Row"> <Save size={14} /> </Button>
              <Button size="sm" variant="tertiary" onClick={setIsAdding} disabled={isSaving} className="!p-1.5 text-gray-600" title="Cancel Add"> <CancelIcon size={14} /> </Button>
              {/* Manual Entry Button for Restaurants */}
              {type === 'restaurants' && !placesApiAvailable && !newRowData.lookupFailed && (
                 <Button size="sm" variant="secondary" onClick={enableManualEntry} disabled={isSaving} className="!p-1.5 text-xs !text-amber-700 !border-amber-300 hover:!bg-amber-100" title="Manual Entry"> Manual </Button>
              )}
            </div>
          ) : (
            <EditableCell
              row={null} // Indicate it's an add row
              col={col}
              isEditing={true} // Always editing for AddRow
              rowData={{...newRowData, placesApiAvailable}} // Pass current form data and API status
              onDataChange={(rowId, changes) => { // rowId will be '__NEW_ROW__'
                 // Handle simple field updates
                 Object.entries(changes).forEach(([key, value]) => {
                    // Special handling for place selection result
                    if (key === 'placeData') {
                        handlePlaceSelection(value);
                    } else if (key === 'enableManualEntry' && value === true) {
                         enableManualEntry();
                    } else {
                         setNewRowData(key, value);
                    }
                 });
              }}
              isSaving={isSaving}
              cities={cities}
              neighborhoods={neighborhoods}
            />
          )}
        </td>
      ))}
    </tr>
  );
};

export default React.memo(AddRow);