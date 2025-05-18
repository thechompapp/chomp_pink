// src/pages/AdminPanel/ActionCell.jsx
/* ADDED: Logging for submission status check */
/* UPDATED: Removed save button, clicking away from cell auto-saves */
/* UPDATED: Added support for data cleanup approve/reject actions */
/* FIXED: Added null checks for row object and properties */
import React from 'react';
import { Pencil, Check, X, Trash2, Save, XCircle } from 'lucide-react';

const ActionCell = ({
  row = {}, // Default to empty object to prevent null issues
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
  onSaveEdit, // Still needed for some operations but not as a button
  onApprove,
  onReject,
  onDelete, // This is the handleDeleteClick handler
  // Confirmation Dialog state/handlers (passed through)
  confirmDeleteInfo,
  setConfirmDeleteInfo,
  handleDeleteConfirm,
  // Data cleanup specific props
  isDataCleanup,
}) => {
  const rowId = row?.id; // Safely access row ID
  const isDeleting = actionState?.deletingId === rowId;
  const isApproving = actionState?.approvingId === rowId;
  const isRejecting = actionState?.rejectingId === rowId;
  const isBusy = isSaving || isDeleting || isApproving || isRejecting;

  const buttonBaseClasses = "p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonVariants = {
    edit: "hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400",
    save: "hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400",
    cancel: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400",
    delete: "hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400",
    approve: "hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400",
    reject: "hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400",
  };

  // --- Internal Click Handlers ---
  const triggerStartEdit = () => !isBusy && onStartEdit && onStartEdit(row);
  const triggerCancelEdit = () => !isSaving && onCancelEdit && rowId && onCancelEdit(rowId);
  const triggerDeleteClick = () => !isBusy && onDelete && rowId && onDelete(rowId, resourceType); // Pass type
  const triggerApprove = () => !isBusy && onApprove && rowId && onApprove(rowId);
  const triggerReject = () => !isBusy && onReject && rowId && onReject(rowId);

  // Show approve/reject buttons for:
  // 1. Submissions with status 'pending'
  // 2. Data cleanup changes (which don't have a status field)
  const showSubmissionActions = resourceType === 'submissions' && row?.status === 'pending' && !isEditing;
  
  // Always show actions for cleanup items
  const showCleanupActions = (isDataCleanup === true || resourceType === 'cleanup') && !isEditing;
  
  const showApproveRejectButtons = showSubmissionActions || showCleanupActions;
  
  // Debugging logs
  if (resourceType === 'submissions' && !isEditing && rowId) {
    console.log(`[ActionCell] Submission Row ID: ${rowId}, Status: ${row?.status}, Should show Approve/Reject? ${row?.status === 'pending'}`);
  }
  
  if (isDataCleanup || resourceType === 'cleanup') {
    console.log(`[ActionCell] Data Cleanup Row ID: ${rowId}, isDataCleanup=${isDataCleanup}, resourceType=${resourceType}, showCleanupActions=${showCleanupActions}, showApproveRejectButtons=${showApproveRejectButtons}`);
  } else if (resourceType && rowId && !showApproveRejectButtons) {
    // Log when we might expect buttons but they're not showing
    console.log(`[ActionCell] NO ACTIONS: resourceType=${resourceType}, isDataCleanup=${isDataCleanup}, isEditing=${isEditing}, Row ID: ${rowId}`);
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {isEditing ? (
        <>
          {rowId && (
            <>
              <button
                onClick={() => onSaveEdit && onSaveEdit(rowId)}
                disabled={isBusy}
                className={`${buttonBaseClasses} ${buttonVariants.save}`}
                aria-label="Save changes"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => onCancelEdit && onCancelEdit(rowId)}
                disabled={isBusy}
                className={`${buttonBaseClasses} ${buttonVariants.cancel}`}
                aria-label="Cancel editing"
              >
                <XCircle size={16} />
              </button>
            </>
          )}
        </>
      ) : (
        <>
          {/* Only show edit button for regular items, not cleanup items */}
          {canEdit && !isDataCleanup && resourceType !== 'cleanup' && (
            <button
              onClick={() => onStartEdit && onStartEdit(row)}
              disabled={disableActions || isBusy}
              className={`${buttonBaseClasses} ${buttonVariants.edit}`}
              aria-label="Edit row"
            >
              <Pencil size={16} />
            </button>
          )}

          {/* Always show approve/reject for cleanup items */}
          {canMutate && showApproveRejectButtons && (
            <>
              <button
                onClick={triggerApprove}
                disabled={disableActions || isBusy || (!isDataCleanup && resourceType !== 'cleanup' && row?.status === 'approved')}
                className={`${buttonBaseClasses} ${buttonVariants.approve}`}
                aria-label={(isDataCleanup || resourceType === 'cleanup') ? "Apply change" : "Approve submission"}
              >
                <Check size={16} />
              </button>
              <button
                onClick={triggerReject}
                disabled={disableActions || isBusy || (!isDataCleanup && resourceType !== 'cleanup' && row?.status === 'rejected')}
                className={`${buttonBaseClasses} ${buttonVariants.reject}`}
                aria-label={(isDataCleanup || resourceType === 'cleanup') ? "Reject change" : "Reject submission"}
              >
                <X size={16} />
              </button>
            </>
          )}
          
          {/* Only show delete button for regular items, not cleanup items */}
          {canMutate && !isDataCleanup && resourceType !== 'cleanup' && (
            <button
              onClick={triggerDeleteClick}
              disabled={disableActions || isBusy}
              className={`${buttonBaseClasses} ${buttonVariants.delete}`}
              aria-label="Delete row"
            >
              <Trash2 size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ActionCell;