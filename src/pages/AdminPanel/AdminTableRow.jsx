/* src/pages/AdminPanel/AdminTableRow.jsx */
/* FIXED: Use col.key OR col.accessor for validation and React key */
/* ADDED: Safety check for isEditing prop type */
/* UPDATED: Pass onSaveEdit to EditableCell for auto-save functionality */
import React, { useCallback, useRef, useEffect } from 'react';
import EditableCell from './EditableCell.jsx';
import ActionCell from './ActionCell.jsx';

const AdminTableRow = ({
  row,
  columns,
  isEditing, // Expecting function: (rowId) => boolean
  editFormData, // Object containing form data for rows being edited { rowId: { colKey: value } }
  onDataChange, // Handler for cell changes: (rowId, changes) => void
  onStartEdit, // Handler to start editing: (row) => void
  onCancelEdit, // Handler to cancel edit: (rowId) => void
  onSaveEdit, // Handler to save edit: (rowId) => Promise<void> or void
  editError, // Potential error string for the row being edited (Needs logic in parent/hook to be row-specific)
  isSaving, // General saving state (for save button loading)
  actionState, // { deletingId, approvingId, rejectingId }
  onApprove, // (id) => Promise<void> or void
  onReject, // (id) => Promise<void> or void
  onDelete, // This is likely handleDeleteClick: (id, type) => void
  selectedRows, // Set containing selected row IDs
  onRowSelect, // Handler for row selection: (id, isSelected) => void
  resourceType, // Renamed from 'type' for clarity
  // Context/Lookup Data
  cities,
  neighborhoods,
  // Confirmation Dialog State/Handlers (Passed through from hook)
  confirmDeleteInfo,
  setConfirmDeleteInfo,
  handleDeleteConfirm,
  // --- Redundant props if ActionCell uses callbacks ---
  // setActionState,
  // setEditError,
  // setEditingRowIds,
  // setError, // General error setter from hook
  // onDataMutated, // To trigger refetch after actions in ActionCell
  // --- End Redundant Props ---
  isBulkEditing, // Flag from hook
  isAdding, // Flag from hook
  isDataCleanup = false, // Flag to indicate if this is part of data cleanup process
  // editingRowIds // Can likely be derived from isEditing prop if needed locally
}) => {

  // ** Add Check: Ensure row and columns are valid before rendering **
  if (!row || typeof row.id === 'undefined' || !Array.isArray(columns) || columns.length === 0) {
    console.error("[AdminTableRow] Invalid props received: row/row.id or columns missing/invalid.", { row, columns });
    const colSpan = Array.isArray(columns) ? columns.length + (resourceType !== 'submissions' ? 1 : 0) + 1 : 1; // +1 for select, +1 for actions
    return (
      <tr className="bg-red-50 dark:bg-red-900">
        <td colSpan={colSpan} className="text-red-700 dark:text-red-300 px-3 py-2 italic text-xs">
          Error: Invalid row data or column definition passed to AdminTableRow. Check console.
        </td>
      </tr>
    );
  }

  // Determine row state locally for clarity
  const currentRowId = row.id; // Use consistent variable

  // *** ADDED: Safety check for isEditing prop type ***
  const isCurrentlyEditing = typeof isEditing === 'function' ? isEditing(currentRowId) : false;
  if (typeof isEditing !== 'function') {
      console.warn(`[AdminTableRow] Received non-function 'isEditing' prop for row ID ${currentRowId}. Defaulting to false. Check parent component (AdminTable).`);
  }
  // *** END Safety check ***

  // Get current row's edit data from the main editFormData object
  const currentRowEditData = editFormData && typeof editFormData === 'object' && editFormData[currentRowId] ? editFormData[currentRowId] : {};

  const isThisRowSaving = isCurrentlyEditing && isSaving; // Saving applies only if editing THIS row
  const isThisRowDeleting = actionState?.deletingId === currentRowId;
  const isThisRowApproving = actionState?.approvingId === currentRowId;
  const isThisRowRejecting = actionState?.rejectingId === currentRowId;
  const isRowBusy = isThisRowSaving || isThisRowDeleting || isThisRowApproving || isThisRowRejecting;
  // Disable interactions if adding globally, this row is busy, or bulk editing is active AND this row isn't the one being edited
  const disableRowInteractions = isAdding || isRowBusy || (isBulkEditing && !isCurrentlyEditing);

  // Function to handle saving edits for this specific row
  const handleSaveEditForRow = () => {
    if (onSaveEdit && typeof onSaveEdit === 'function' && !isThisRowSaving) {
      console.log(`[AdminTableRow] Saving edits for row ${currentRowId}`);
      onSaveEdit(currentRowId);
    }
  };

  // Add keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (isCurrentlyEditing) {
      switch (e.key) {
        case 'Enter':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleSaveEditForRow();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancelEdit(currentRowId);
          break;
      }
    }
  }, [isCurrentlyEditing, handleSaveEditForRow, onCancelEdit, currentRowId]);

  // Add focus management
  const rowRef = useRef(null);
  useEffect(() => {
    if (isCurrentlyEditing && rowRef.current) {
      const firstInput = rowRef.current.querySelector('input, select, textarea');
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [isCurrentlyEditing]);

  return (
    <tr
      ref={rowRef}
      key={currentRowId}
      className={`${
        isCurrentlyEditing 
          ? 'bg-muted/50' 
          : 'hover:bg-muted/20'
      } ${
        isRowBusy ? 'opacity-50 pointer-events-none' : ''
      } transition-colors duration-150`}
      aria-busy={isRowBusy}
      onKeyDown={handleKeyDown}
      role="row"
      aria-selected={selectedRows?.has(currentRowId)}
    >
      {/* Select Checkbox Column */}
      {resourceType !== 'submissions' && (
        <td className="px-3 py-2 align-top" role="cell">
          <input
            type="checkbox"
            className="rounded border-input text-foreground focus:ring-ring disabled:opacity-50 bg-background"
            checked={selectedRows?.has(currentRowId) ?? false}
            onChange={(e) => onRowSelect && onRowSelect(currentRowId, e.target.checked)}
            aria-label={`Select row ${currentRowId}`}
            disabled={disableRowInteractions}
          />
        </td>
      )}
      {/* Data Columns */}
      {columns.map((col) => {
        const columnKey = col.accessor;
        return (
          <td
            key={`${currentRowId}-${columnKey}`}
            className={`px-3 py-2 align-top text-sm text-foreground ${col?.className || ''}`}
            role="cell"
          >
            <EditableCell
              row={row}
              col={col}
              isEditing={isCurrentlyEditing}
              rowData={currentRowEditData}
              onDataChange={(changes) => onDataChange && onDataChange(currentRowId, changes)}
              isSaving={isThisRowSaving}
              cities={cities}
              neighborhoods={neighborhoods}
              resourceType={resourceType}
              onStartEdit={onStartEdit}
              onSaveEdit={handleSaveEditForRow}
            />
          </td>
        );
      })}
      {/* Actions Column */}
      <td key={`${currentRowId}-actions-cell`} className="px-3 py-2 align-top text-right" role="cell">
        <ActionCell
          row={row}
          resourceType={resourceType}
          canEdit={columns.some(c => c.isEditable)}
          canMutate={true}
          isEditing={isCurrentlyEditing}
          isSaving={isThisRowSaving}
          actionState={actionState}
          editError={isCurrentlyEditing ? editError : null}
          disableActions={disableRowInteractions}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSaveEdit={handleSaveEditForRow}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
          confirmDeleteInfo={confirmDeleteInfo}
          setConfirmDeleteInfo={setConfirmDeleteInfo}
          handleDeleteConfirm={handleDeleteConfirm}
          isDataCleanup={isDataCleanup}
        />
      </td>
    </tr>
  );
};

export default AdminTableRow;