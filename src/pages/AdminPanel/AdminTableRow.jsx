/* src/pages/AdminPanel/AdminTableRow.jsx */
import React from 'react';
import EditableCell from './EditableCell.jsx';
import ActionCell from './ActionCell.jsx';

const AdminTableRow = ({
  row,
  columns,
  isEditing,
  isSaving,
  editFormData,
  actionState,
  editError,
  selectedRows,
  onDataChange,
  handleStartEdit,
  handleCancelEdit,
  handleSaveEdit,
  handleDeleteClick,
  handleApprove,
  handleReject,
  type,
  canEdit,
  canMutate,
  cities,
  neighborhoods,
  setEditError,
  setError,
  setActionState,
  setEditingRowIds,
  setConfirmDeleteInfo,
  onDataMutated,
  isBulkEditing,
  isAdding,
}) => {

  // ** Add Check: Ensure row and columns are valid before rendering **
  if (!row || !Array.isArray(columns) || columns.length === 0) {
    console.error("[AdminTableRow] Invalid props received: row or columns missing/invalid.", { row, columns });
    // Render a placeholder or null to prevent further errors
    const colSpan = Array.isArray(columns) ? columns.length : 1;
    return (
      <tr className="bg-red-50">
        <td colSpan={colSpan} className="text-red-700 px-3 py-2 italic">
          Error: Invalid row data passed to AdminTableRow.
        </td>
      </tr>
    );
  }

  const currentRowFormData = isEditing ? (editFormData[row.id] || {}) : {};
  const isThisRowSaving = isEditing && isSaving;
  const isThisRowDeleting = actionState.deletingId === row.id;
  const isThisRowApproving = actionState.approvingId === row.id;
  const isThisRowRejecting = actionState.rejectingId === row.id;
  const isRowBusy = isThisRowSaving || isThisRowDeleting || isThisRowApproving || isThisRowRejecting;
  const disableRowInteractions = isAdding || isRowBusy || (isBulkEditing && !isEditing);

  return (
    <tr
      key={row.id} // Key is now guaranteed to be valid due to check in AdminTable
      className={` ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'} ${isRowBusy ? 'opacity-50' : ''} transition-colors duration-150 `}
      aria-busy={isRowBusy}
    >
      {columns.map((col) => {
          // ** Add Check: Ensure col and col.key are valid **
          if (!col || typeof col.key !== 'string') {
               console.warn("[AdminTableRow] Invalid column definition encountered:", col);
               return <td key={`invalid-col-${Math.random()}`} className="px-3 py-2 text-red-500 italic">Invalid Col</td>;
          }
          return (
            <td
              key={`${row.id}-${col.key}`}
              className={`px-3 py-2 align-top ${col?.className || ''} ${isEditing && col.editable ? 'py-1' : ''}`}
            >
              {col.key === 'actions' ? (
                <ActionCell
                  row={row} type={type} canEdit={canEdit} canMutate={canMutate}
                  isEditing={isEditing} isSaving={isThisRowSaving}
                  actionState={actionState} setActionState={setActionState}
                  editError={isEditing ? editError : null} setEditError={setEditError}
                  setEditingRowIds={setEditingRowIds} currentRowFormData={currentRowFormData}
                  setConfirmDeleteInfo={setConfirmDeleteInfo} onDataMutated={onDataMutated}
                  setError={setError} columns={columns} isAdding={isAdding}
                  disableActions={disableRowInteractions}
                  handleSaveEdit={handleSaveEdit} handleCancelEdit={handleCancelEdit}
                  handleDeleteClick={handleDeleteClick} handleApprove={handleApprove} handleReject={handleReject}
                  handleStartEdit={handleStartEdit} // Pass handleStartEdit if ActionCell needs it
                />
              ) : col.key === 'select' ? (
                col.Cell ? col.Cell({ row }) : null // Render select checkbox
              ) : (
                <EditableCell
                  row={row} col={col} isEditing={isEditing}
                  rowData={currentRowFormData} onDataChange={onDataChange}
                  isSaving={isThisRowSaving} cities={cities} neighborhoods={neighborhoods}
                />
              )}
            </td>
          );
        })}
    </tr>
  );
};

export default AdminTableRow; // No need for React.memo usually on table rows if data changes