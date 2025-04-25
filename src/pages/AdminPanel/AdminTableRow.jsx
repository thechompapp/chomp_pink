/* src/pages/AdminPanel/AdminTableRow.jsx */
/* FIXED: Use col.key OR col.accessor for validation and React key */
/* ADDED: Safety check for isEditing prop type */
import React from 'react';
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


  return (
    <tr
      key={currentRowId} // Use guaranteed row.id
      className={` ${isCurrentlyEditing ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'} ${isRowBusy ? 'opacity-50 pointer-events-none' : ''} transition-colors duration-150 `}
      aria-busy={isRowBusy}
    >
      {/* Select Checkbox Column */}
       {resourceType !== 'submissions' && ( // Conditionally render select checkbox
            <td className="px-3 py-2 align-top">
                <input
                    type="checkbox"
                    className="rounded border-gray-300 dark:border-gray-600 text-primary dark:text-primary-dark focus:ring-primary-dark disabled:opacity-50 bg-white dark:bg-gray-700"
                    checked={selectedRows?.has(currentRowId) ?? false} // Safe check for Set
                    onChange={(e) => onRowSelect && onRowSelect(currentRowId, e.target.checked)}
                    aria-label={`Select row ${currentRowId}`}
                    disabled={disableRowInteractions}
                />
            </td>
        )}
      {/* Data Columns */}
      {columns.map((col) => {
          // *** Use accessor as fallback key for validation and mapping ***
          const columnKey = col.key || col.accessor;
          if (!col || typeof columnKey !== 'string') {
               console.warn("[AdminTableRow] Invalid column definition encountered (missing key/accessor):", col);
               // Render placeholder but use a more stable key
               return <td key={`invalid-col-${col?.header || Math.random()}`} className="px-3 py-2 text-red-500 italic">Invalid Col Def</td>;
          }

          // Skip rendering the dedicated actions column if defined in columns array
          if (columnKey === 'actions') return null;

          return (
            <td
              key={`${currentRowId}-${columnKey}`} // Use columnKey here
              className={`px-3 py-2 align-top text-sm text-gray-700 dark:text-gray-300 ${col?.className || ''} ${isCurrentlyEditing && col.editable ? 'py-1' : ''}`} // Adjust padding for editable cells
            >
              <EditableCell // Handles display or input based on isCurrentlyEditing
                row={row}
                col={col} // Pass full column definition
                isEditing={isCurrentlyEditing}
                // Pass the specific data FOR THIS ROW from the main edit form state
                rowData={currentRowEditData}
                // Ensure onDataChange passes rowId correctly
                onDataChange={(changes) => onDataChange && onDataChange(currentRowId, changes)}
                isSaving={isThisRowSaving} // Pass saving state specific to this row
                cities={cities} // Pass lookup data
                neighborhoods={neighborhoods}
                resourceType={resourceType}
              />
            </td>
          );
        })}
       {/* Actions Column (Always render last) */}
       <td key={`${currentRowId}-actions-cell`} className="px-3 py-2 align-top text-right">
           <ActionCell
              row={row}
              resourceType={resourceType} // Pass resourceType instead of 'type'
              canEdit={columns.some(c => c.editable)} // Derive canEdit from column definitions
              canMutate={true} // TODO: Determine based on user permissions?
              isEditing={isCurrentlyEditing}
              isSaving={isThisRowSaving} // Pass saving state specific to this row
              actionState={actionState}
              // Pass row-specific error (Hook/parent needs logic to determine this)
              editError={isCurrentlyEditing ? editError : null}
              disableActions={disableRowInteractions} // Pass combined disable flag
              // Pass handlers down
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onApprove={onApprove}
              onReject={onReject}
              onDelete={onDelete} // Pass the click handler
              // Pass confirmation dialog state/handlers
              confirmDeleteInfo={confirmDeleteInfo}
              setConfirmDeleteInfo={setConfirmDeleteInfo}
              handleDeleteConfirm={handleDeleteConfirm}
            />
        </td>
    </tr>
  );
};

export default AdminTableRow;