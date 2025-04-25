// src/pages/AdminPanel/ActionCell.jsx
/* ADDED: Logging for submission status check */
import React from 'react';
import Button from '@/components/UI/Button.jsx';
import { Edit, Trash2, Check, Save, XCircle as CancelIcon, Loader2 } from 'lucide-react';

const ActionCell = ({
  row,
  resourceType, // Renamed from 'type'
  canEdit,
  canMutate,
  isEditing,
  isSaving,
  actionState,
  editError,
  disableActions, // Combined disable flag from AdminTableRow
  // Callbacks from useAdminTableState hook (passed via AdminTableRow)
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onApprove,
  onReject,
  onDelete, // This is the handleDeleteClick handler
  // Confirmation Dialog state/handlers (passed through)
  confirmDeleteInfo,
  setConfirmDeleteInfo,
  handleDeleteConfirm,
}) => {
  const isDeletingThisRow = actionState?.deletingId === row.id;
  const isApprovingThisRow = actionState?.approvingId === row.id;
  const isRejectingThisRow = actionState?.rejectingId === row.id;
  // Determine if this row is busy (being saved globally, or specific action happening on it)
  const isRowBusy = isSaving || isDeletingThisRow || isApprovingThisRow || isRejectingThisRow;
  // Overall disabled state for buttons
  const isDisabled = disableActions || isRowBusy;

  // --- Internal Click Handlers ---
  const triggerStartEdit = () => !isDisabled && onStartEdit && onStartEdit(row);
  const triggerSaveEdit = () => !isDisabled && onSaveEdit && onSaveEdit(row.id);
  const triggerCancelEdit = () => !isSaving && onCancelEdit && onCancelEdit(row.id);
  const triggerDeleteClick = () => !isDisabled && onDelete && onDelete(row.id, resourceType); // Pass type
  const triggerApprove = () => !isDisabled && onApprove && onApprove(row.id);
  const triggerReject = () => !isDisabled && onReject && onReject(row.id);

  // *** ADDED: Logging for submission button logic ***
  const showSubmissionActions = resourceType === 'submissions' && row?.status === 'pending' && !isEditing;
  if (resourceType === 'submissions' && !isEditing) {
    console.log(`[ActionCell] Row ID: ${row.id}, Status: ${row?.status}, Should show Approve/Reject? ${row?.status === 'pending'}`);
  }
  // *** END LOGGING ***

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
        {/* Edit/Save/Cancel Buttons */}
        {canEdit &&
          (isEditing ? (
            <>
              <Button size="sm" variant="primary" onClick={triggerSaveEdit} isLoading={isSaving} disabled={isDisabled} className="!p-1.5" title="Save Changes"> <Save size={14} /> </Button>
              <Button size="sm" variant="tertiary" onClick={triggerCancelEdit} disabled={isSaving} className="!p-1.5 text-gray-600 dark:text-gray-400" title="Cancel Edit"> <CancelIcon size={14} /> </Button>
            </>
          ) : (
            <Button size="sm" variant="tertiary" onClick={triggerStartEdit} disabled={isDisabled} className="!p-1.5" title="Edit Row"> <Edit size={14} /> </Button>
          ))}

        {/* Delete Button (for non-submissions) */}
        {canMutate && resourceType !== 'submissions' && !isEditing && (
          <Button size="sm" variant="tertiary" onClick={triggerDeleteClick} isLoading={isDeletingThisRow} disabled={isDisabled} className="!p-1.5 text-red-500 hover:text-red-700" title="Delete Row">
            {isDeletingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Trash2 size={14} />}
          </Button>
        )}

        {/* Approve/Reject Buttons (for pending submissions) */}
        {showSubmissionActions && ( // Use the calculated flag
          <>
            <Button size="sm" variant="tertiary" onClick={triggerApprove} isLoading={isApprovingThisRow} disabled={isDisabled} className="!p-1.5 text-green-600 hover:text-green-800" title="Approve Submission">
              {isApprovingThisRow ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Check size={14} />}
            </Button>
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