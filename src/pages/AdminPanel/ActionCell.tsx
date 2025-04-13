import React from 'react';
import Button from '@/components/UI/Button';
import { Edit, Trash2, Check, Save, XCircle as CancelIcon, Loader2 } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { filterService } from '@/services/filterService';

// --- Types ---
interface RowData {
  id: number | string;
  [key: string]: any;
}

interface ColumnConfig {
  key: string;
  header: string | JSX.Element;
  sortable?: boolean;
  editable?: boolean;
  inputType?: string;
  required?: boolean;
}

interface ActionState {
  deletingId: number | string | null;
  approvingId: number | string | null;
  rejectingId: number | string | null;
}

interface ActionCellProps {
  row: RowData;
  type: string;
  canEdit: boolean;
  canMutate: boolean;
  isEditing: boolean;
  isSaving: boolean;
  setIsSaving: () => void;
  actionState: ActionState;
  setActionState: React.Dispatch<React.SetStateAction<ActionState>>;
  editError: string | null;
  setEditError: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingRowIds: React.Dispatch<React.SetStateAction<Set<number | string>>>;
  currentRowFormData: Record<string, any>;
  setEditFormData: (data: any) => void;
  setConfirmDeleteInfo: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      id: number | string | null;
      itemType: string;
    }>
  >;
  onDataMutated?: () => void;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  columns: ColumnConfig[];
  isAdding: boolean;
  disableActions: boolean;
}

const ActionCell: React.FC<ActionCellProps> = ({
  row,
  type,
  canEdit,
  canMutate,
  isEditing,
  isSaving,
  setIsSaving,
  actionState,
  setActionState,
  editError,
  setEditError,
  setEditingRowIds,
  currentRowFormData,
  setEditFormData,
  setConfirmDeleteInfo,
  onDataMutated,
  setError,
  columns,
  isAdding,
  disableActions,
}) => {
  const isDeletingThisRow = actionState.deletingId === row.id;
  const isApprovingThisRow = actionState.approvingId === row.id;
  const isRejectingThisRow = actionState.rejectingId === row.id;
  const isRowBusy = isSaving || isAdding || isDeletingThisRow || isApprovingThisRow || isRejectingThisRow;
  const isDisabled = disableActions || isRowBusy;

  const logDebug = (action: string, data: any) => {
    console.log(`[ActionCell ${action} - Row ${row.id}]`, data);
  };

  const extractZipcode = (address: string | null): string | null => {
    if (!address || typeof address !== 'string') return null;
    const zipcodeMatch = address.match(/\b\d{5}\b/);
    return zipcodeMatch ? zipcodeMatch[0] : null;
  };

  const handleStartEdit = async () => {
    if (isDisabled) return;
    const initialData: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.editable && col.key !== 'select' && col.key !== 'actions') {
        let initialValue: any;
        if (col.inputType === 'boolean') {
          initialValue = String(row[col.key] ?? false);
        } else if (col.key === 'tags' && Array.isArray(row[col.key])) {
          initialValue = row[col.key].join(', ');
        } else if (col.key === 'zipcode_ranges' && Array.isArray(row[col.key])) {
          initialValue = row[col.key].join(', ');
        } else {
          initialValue = row[col.key] ?? '';
        }
        initialData[col.key] = initialValue;
      }
    });
    initialData.lookupFailed = false;
    logDebug('StartEdit', initialData);

    if (type === 'restaurants' && initialData.address) {
      const zipcode = extractZipcode(initialData.address);
      if (zipcode) {
        console.log(`[ActionCell] Extracted zipcode ${zipcode} from address on edit start for row ${row.id}`);
        try {
          const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
          console.log(`[ActionCell] Resolved neighborhood for zipcode ${zipcode} on edit start:`, neighborhood);
          if (neighborhood && neighborhood.id) {
            initialData.neighborhood_id = String(neighborhood.id);
            initialData.neighborhood_name = neighborhood.name;
            initialData.city_id = String(neighborhood.city_id);
            initialData.city_name = neighborhood.city_name;
            initialData.lookupFailed = false;
          } else {
            console.warn(`[ActionCell] No neighborhood found for zipcode ${zipcode} on edit start`);
            initialData.lookupFailed = true;
          }
        } catch (lookupError) {
          console.error(`[ActionCell] Zip lookup error for zipcode ${zipcode} on edit start:`, lookupError);
          initialData.lookupFailed = true;
        }
      }
    }

    setEditFormData((prev: any) => ({ ...prev, [row.id]: initialData }));
    setEditingRowIds((prev) => new Set(prev).add(row.id));
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!isEditing || isSaving || isDisabled || typeof currentRowFormData !== 'object' || currentRowFormData === null) {
      logDebug('Save cancelled', { isEditing, isSaving, isDisabled, currentRowFormData });
      if (typeof currentRowFormData !== 'object' || currentRowFormData === null) {
        setEditError('Internal error: Invalid form data provided to ActionCell.');
      }
      return;
    }

    setEditError(null);
    setIsSaving();
    const changes: Record<string, any> = {};
    let validationFailed = false;

    logDebug('Save comparing', { original: row, formData: currentRowFormData });

    columns
      .filter((col) => col.editable && col.key !== 'select' && col.key !== 'actions')
      .forEach((col) => {
        const key = col.key;
        let originalValue = row[key];
        let editedValue = currentRowFormData[key];

        let processedEditedValue: any = editedValue;
        let processedOriginalValue: any = originalValue;

        switch (col.inputType) {
          case 'boolean':
            processedEditedValue = String(editedValue) === 'true';
            processedOriginalValue = originalValue ?? false;
            break;
          case 'tags':
          case 'zipcode_ranges':
            const originalArray = Array.isArray(originalValue) ? [...originalValue].sort() : [];
            const editedArray =
              typeof editedValue === 'string' ? editedValue.split(',').map((t) => t.trim()).filter(Boolean).sort() : [];
            if (JSON.stringify(originalArray) !== JSON.stringify(editedArray)) {
              changes[key] = typeof editedValue === 'string' && editedValue.trim() ? editedValue.trim() : null;
            }
            return;
          case 'number':
          case 'city_select':
          case 'neighborhood_select':
            processedEditedValue =
              editedValue === '' || editedValue === null || editedValue === undefined ? null : parseInt(String(editedValue), 10);
            processedOriginalValue = originalValue === null || originalValue === undefined ? null : Number(originalValue);
            if (editedValue !== '' && editedValue !== null && editedValue !== undefined && isNaN(processedEditedValue)) {
              setEditError(`Invalid number for ${col.header}.`);
              validationFailed = true;
              processedEditedValue = null;
            }
            if (col.required && processedEditedValue === null) {
              setEditError(`${col.header} is required.`);
              validationFailed = true;
            }
            break;
          case 'google_places':
          case 'text':
          case 'textarea':
          case 'email':
          default:
            processedEditedValue = typeof editedValue === 'string' ? (editedValue.trim() || null) : editedValue ?? null;
            processedOriginalValue = originalValue || null;
            break;
        }

        const originalComp = processedOriginalValue === undefined ? null : processedOriginalValue;
        const editedComp = processedEditedValue === undefined ? null : processedEditedValue;

        if (String(originalComp ?? '') !== String(editedComp ?? '')) {
          logDebug(`Change DETECTED for ${key}`, { original: originalComp, edited: editedComp });
          changes[key] = processedEditedValue;
        }
      });

    if (validationFailed) {
      setIsSaving();
      return;
    }

    if (Object.keys(changes).length === 0) {
      logDebug('No changes detected', {});
      setEditingRowIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(row.id);
        return newSet;
      });
      setEditFormData((prev: any) => {
        const newData = { ...prev };
        delete newData[row.id];
        return newData;
      });
      setIsSaving();
      return;
    }

    if (type === 'restaurants') {
      const currentCityId = changes.city_id ?? row.city_id;
      const lookupFailed = currentRowFormData.lookupFailed;
      if (!currentCityId || currentCityId <= 0) {
        if (lookupFailed) {
          setEditError('Neighborhood lookup failed. Please select a city manually.');
        } else {
          setEditError('Valid City ID is required for a restaurant.');
        }
        setIsSaving();
        return;
      }
      if (changes.neighborhood_id) {
        const neighborhood = currentRowFormData.neighborhoods?.find((n: any) => Number(n.id) === Number(changes.neighborhood_id));
        if (neighborhood) {
          changes.neighborhood_name = neighborhood.name;
        }
      }
    }

    logDebug('Sending changes to API', changes);

    try {
      const response = await apiClient(`/api/admin/${type}/${row.id}`, `Admin Update ${type} ${row.id}`, {
        method: 'PUT',
        body: JSON.stringify(changes),
      });
      if (!response.success) {
        throw new Error(response.error || `Failed to save ${type}.`);
      }
      logDebug('Save successful', response);
      onDataMutated?.();
      setEditingRowIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(row.id);
        return newSet;
      });
      setEditFormData((prev: any) => {
        const newData = { ...prev };
        delete newData[row.id];
        return newData;
      });
    } catch (err) {
      logDebug('Save error', err);
      setEditError((err as Error).message || 'Save failed.');
    } finally {
      setIsSaving();
    }
  };

  const handleDeleteClick = () => {
    setConfirmDeleteInfo({
      isOpen: true,
      id: row.id,
      itemType: type,
    });
  };

  const handleApprove = async () => {
    if (isDisabled || isApprovingThisRow) return;
    setActionState((prev) => ({ ...prev, approvingId: row.id }));
    setError(null);
    try {
      const response = await apiClient(`/api/admin/submissions/${row.id}/approve`, `Admin Approve Submission ${row.id}`, {
        method: 'PUT',
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to approve submission.');
      }
      onDataMutated?.();
    } catch (err) {
      setError((err as Error).message || 'Approval failed.');
    } finally {
      setActionState((prev) => ({ ...prev, approvingId: null }));
    }
  };

  const handleReject = async () => {
    if (isDisabled || isRejectingThisRow) return;
    setActionState((prev) => ({ ...prev, rejectingId: row.id }));
    setError(null);
    try {
      const response = await apiClient(`/api/admin/submissions/${row.id}/reject`, `Admin Reject Submission ${row.id}`, {
        method: 'PUT',
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to reject submission.');
      }
      onDataMutated?.();
    } catch (err) {
      setError((err as Error).message || 'Rejection failed.');
    } finally {
      setActionState((prev) => ({ ...prev, rejectingId: null }));
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        {canEdit &&
          (isEditing ? (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveEdit}
                isLoading={isSaving}
                disabled={isSaving || isDisabled}
                className="!p-1.5"
                title="Save Changes"
              >
                <Save size={14} />
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                onClick={() => {
                  setEditingRowIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(row.id);
                    return newSet;
                  });
                  setEditFormData((prev: any) => {
                    const newData = { ...prev };
                    delete newData[row.id];
                    return newData;
                  });
                  setEditError(null);
                }}
                disabled={isSaving}
                className="!p-1.5 text-gray-600"
                title="Cancel Edit"
              >
                <CancelIcon size={14} />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="tertiary"
              onClick={handleStartEdit}
              disabled={isDisabled}
              className="!p-1.5"
              title="Edit Row"
            >
              <Edit size={14} />
            </Button>
          ))}
        {canMutate && type !== 'submissions' && !isEditing && (
          <Button
            size="sm"
            variant="tertiary"
            onClick={handleDeleteClick}
            isLoading={isDeletingThisRow}
            disabled={isDisabled}
            className="!p-1.5 text-red-500 hover:text-red-700"
            title="Delete Row"
          >
            {isDeletingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Trash2 size={14} />}
          </Button>
        )}
        {type === 'submissions' && row.status === 'pending' && !isEditing && (
          <>
            <Button
              size="sm"
              variant="tertiary"
              onClick={handleApprove}
              isLoading={isApprovingThisRow}
              disabled={isDisabled}
              className="!p-1.5 text-green-600 hover:text-green-800"
              title="Approve Submission"
            >
              {isApprovingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Check size={14} />}
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              onClick={handleReject}
              isLoading={isRejectingThisRow}
              disabled={isDisabled}
              className="!p-1.5 text-red-500 hover:text-red-700"
              title="Reject Submission"
            >
              {isRejectingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <CancelIcon size={14} />}
            </Button>
          </>
        )}
      </div>
      {isEditing && editError && (
        <p className="text-xs text-red-600 mt-1 whitespace-normal" role="alert">
          {editError}
        </p>
      )}
    </>
  );
};

export default ActionCell;