// src/pages/AdminPanel/AddRow.tsx
import React from 'react';
import Button from '@/components/UI/Button';
import { Save, XCircle as CancelIcon } from 'lucide-react';
import apiClient from '@/services/apiClient';
import EditableCell from './EditableCell';

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
  cities: City[];
  neighborhoods: Neighborhood[];
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
  const handleSaveNewRow = async () => {
    if (!isSaving) {
      setError(null);
      setIsSaving();
      const payload: Record<string, any> = {};
      let validationError: string | null = null;
      for (const col of columns) {
        if (col.editable) {
          let value = newRowData[col.key];
          if (col.inputType === 'boolean') {
            payload[col.key] = String(value) === 'true';
          } else if (col.key === 'tags' && typeof value === 'string') {
            payload[col.key] = value.split(',').map((t) => t.trim()).filter(Boolean);
          } else if (col.inputType === 'number' || col.inputType === 'city_select' || col.inputType === 'neighborhood_select') {
            if (value === '' || value === null || value === undefined) {
              payload[col.key] = null;
            } else {
              const num = parseInt(value, 10);
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
        if (!payload.city_id || payload.city_id <= 0) {
          if (lookupFailed) {
            setError('Neighborhood lookup failed. Please select a city manually.');
          } else {
            setError('Valid City ID is required for a new restaurant.');
          }
          setIsSaving();
          return;
        }
        // Set neighborhood_name in payload if neighborhood_id is provided
        if (payload.neighborhood_id && neighborhoods.length > 0) {
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
            </div>
          ) : (
            <EditableCell
              row={null}
              col={col}
              isEditing={true}
              rowData={newRowData}
              onDataChange={(rowId, changes) => {
                Object.entries(changes).forEach(([key, value]) => {
                  setNewRowData(key, value);
                });
                if (changes.city_id && cities.length > 0) {
                  const cityObj = cities.find((c) => Number(c.id) === Number(changes.city_id));
                  if (cityObj) {
                    setNewRowData('city_name', cityObj.name);
                    setNewRowData('lookupFailed', false);
                    setNewRowData('neighborhood_id', '');
                    setNewRowData('neighborhood_name', '');
                  }
                }
                if (changes.neighborhood_id && neighborhoods.length > 0) {
                  const neighborhoodObj = neighborhoods.find((n) => Number(n.id) === Number(changes.neighborhood_id));
                  if (neighborhoodObj) {
                    setNewRowData('neighborhood_name', neighborhoodObj.name);
                  }
                }
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