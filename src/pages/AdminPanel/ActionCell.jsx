// src/pages/AdminPanel/ActionCell.jsx
import React from 'react';
import Button from '@/components/UI/Button.jsx';
import { Edit, Trash2, Check, Save, XCircle as CancelIcon, Loader2 } from 'lucide-react';
// Imports for apiClient, filterService are not needed directly in this component

// --- REMOVED: TypeScript interfaces ---

const ActionCell = ({ // Removed : React.FC<ActionCellProps>
  row,
  type,
  canEdit,
  canMutate,
  isEditing,
  isSaving,
  // setIsSaving, // Not directly used here, isSaving comes from parent
  actionState,
  setActionState, // Needed for approve/reject/delete state
  editError,
  setEditError, // Needed to clear error on cancel
  setEditingRowIds, // Needed for cancel edit
  // currentRowFormData, // Not directly used here
  // setEditFormData, // *** REMOVED from props destructuring ***
  setConfirmDeleteInfo, // Needed for delete click
  onDataMutated, // Needed for approve/reject/delete success
  setError, // Needed for approve/reject/delete error
  // columns, // Not directly used here
  isAdding, // Needed to disable actions
  disableActions, // Generic disable flag
  // Props passed down from parent hook for specific actions
  handleStartEdit, // *** ADDED: Function to initiate edit state in parent ***
  handleSaveEdit, // *** ADDED: Function to initiate save in parent ***
  handleCancelEdit, // *** ADDED: Function to initiate cancel in parent ***
  handleDeleteClick, // *** ADDED: Function to initiate delete confirmation in parent ***
  handleApprove, // *** ADDED: Function to initiate approve in parent ***
  handleReject, // *** ADDED: Function to initiate reject in parent ***
}) => {
  const isDeletingThisRow = actionState.deletingId === row.id;
  const isApprovingThisRow = actionState.approvingId === row.id;
  const isRejectingThisRow = actionState.rejectingId === row.id;
  // Determine if this row is busy (being saved globally, or specific action happening on it)
  const isRowBusy = isSaving || isDeletingThisRow || isApprovingThisRow || isRejectingThisRow;
  // Overall disabled state for buttons
  const isDisabled = disableActions || isRowBusy;

  // --- Internal Click Handlers ---
  // These now call the functions passed down via props from useAdminTableState

  const triggerStartEdit = () => {
    if (!isDisabled && handleStartEdit) {
      handleStartEdit(row); // Call parent hook's function
    } else if (!handleStartEdit) {
      console.error("[ActionCell] handleStartEdit prop missing!");
    }
  };

  const triggerSaveEdit = () => {
    if (!isDisabled && handleSaveEdit) {
      handleSaveEdit(row.id); // Call parent hook's function
    } else if (!handleSaveEdit) {
       console.error("[ActionCell] handleSaveEdit prop missing!");
    }
  };

  const triggerCancelEdit = () => {
    if (!isSaving && handleCancelEdit) { // Don't cancel if actively saving
      handleCancelEdit(row.id); // Call parent hook's function
    } else if (!handleCancelEdit) {
        console.error("[ActionCell] handleCancelEdit prop missing!");
    }
  };

  const triggerDeleteClick = () => {
    if (!isDisabled && handleDeleteClick) {
      handleDeleteClick(row.id, type); // Call parent hook's function
    } else if (!handleDeleteClick) {
        console.error("[ActionCell] handleDeleteClick prop missing!");
    }
  };

  const triggerApprove = () => {
    if (!isDisabled && handleApprove) {
      handleApprove(row.id); // Call parent hook's function
    } else if (!handleApprove) {
        console.error("[ActionCell] handleApprove prop missing!");
    }
  };

  const triggerReject = () => {
     if (!isDisabled && handleReject) {
      handleReject(row.id); // Call parent hook's function
    } else if (!handleReject) {
        console.error("[ActionCell] handleReject prop missing!");
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
        {canEdit &&
          (isEditing ? (
            <>
              {/* Calls triggerSaveEdit which calls handleSaveEdit(row.id) from hook */}
              <Button size="sm" variant="primary" onClick={triggerSaveEdit} isLoading={isSaving} disabled={isDisabled} className="!p-1.5" title="Save Changes"> <Save size={14} /> </Button>
              {/* Calls triggerCancelEdit which calls handleCancelEdit(row.id) from hook */}
              <Button size="sm" variant="tertiary" onClick={triggerCancelEdit} disabled={isSaving} className="!p-1.5 text-gray-600" title="Cancel Edit"> <CancelIcon size={14} /> </Button>
            </>
          ) : (
            // Calls triggerStartEdit which calls handleStartEdit(row) from hook
            <Button size="sm" variant="tertiary" onClick={triggerStartEdit} disabled={isDisabled} className="!p-1.5" title="Edit Row"> <Edit size={14} /> </Button>
          ))}
        {canMutate && type !== 'submissions' && !isEditing && (
          // Calls triggerDeleteClick which calls handleDeleteClick(row.id, type) from hook
          <Button size="sm" variant="tertiary" onClick={triggerDeleteClick} isLoading={isDeletingThisRow} disabled={isDisabled} className="!p-1.5 text-red-500 hover:text-red-700" title="Delete Row">
            {isDeletingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Trash2 size={14} />}
          </Button>
        )}
        {type === 'submissions' && row.status === 'pending' && !isEditing && (
          <>
            {/* Calls triggerApprove which calls handleApprove(row.id) from hook */}
            <Button size="sm" variant="tertiary" onClick={triggerApprove} isLoading={isApprovingThisRow} disabled={isDisabled} className="!p-1.5 text-green-600 hover:text-green-800" title="Approve Submission">
              {isApprovingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Check size={14} />}
            </Button>
            {/* Calls triggerReject which calls handleReject(row.id) from hook */}
            <Button size="sm" variant="tertiary" onClick={triggerReject} isLoading={isRejectingThisRow} disabled={isDisabled} className="!p-1.5 text-red-500 hover:text-red-700" title="Reject Submission">
              {isRejectingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <CancelIcon size={14} />}
            </Button>
          </>
        )}
      </div>
      {/* Display edit error only if this row is being edited */}
      {isEditing && editError && ( <p className="text-[11px] text-red-600 mt-1 whitespace-normal" role="alert"> {editError} </p> )}
    </>
  );
};

export default ActionCell;