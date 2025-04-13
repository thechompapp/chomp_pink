import React from 'react';
import EditableCell from './EditableCell';
import ActionCell from './ActionCell';

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
  className?: string;
  Cell?: (props: { row: RowData }) => JSX.Element;
  render?: (value: any, row: RowData) => JSX.Element | string;
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

interface ActionState {
  deletingId: number | string | null;
  approvingId: number | string | null;
  rejectingId: number | string | null;
}

interface AdminTableRowProps {
  row: RowData;
  columns: ColumnConfig[];
  isEditing: boolean;
  isSaving: boolean;
  editFormData: Record<string | number, Record<string, any>>;
  actionState: ActionState;
  editError: string | null;
  selectedRows: Set<number | string>;
  onDataChange: (rowId: number | string, changes: Record<string, any>) => void;
  handleStartEdit: (row: RowData) => void;
  handleCancelEdit: (rowId: number | string) => void;
  handleSaveEdit: (rowId: number | string) => void;
  handleDeleteClick: (rowId: number | string, itemType: string) => void;
  handleApprove: (submissionId: number | string) => void;
  handleReject: (submissionId: number | string) => void;
  type: string;
  canEdit: boolean;
  canMutate: boolean;
  cities: City[] | undefined;
  neighborhoods: Neighborhood[] | undefined;
  setEditError: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setActionState: React.Dispatch<React.SetStateAction<ActionState>>;
  setEditingRowIds: React.Dispatch<React.SetStateAction<Set<number | string>>>;
  setConfirmDeleteInfo: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      id: number | string | null;
      itemType: string;
    }>
  >;
  onDataMutated?: () => void;
  isBulkEditing: boolean;
  isAdding: boolean;
}

const AdminTableRow: React.FC<AdminTableRowProps> = ({
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
  const rowData = editFormData[row.id] || {};
  const isRowBusy =
    isSaving || actionState.deletingId === row.id || actionState.approvingId === row.id || actionState.rejectingId === row.id;

  return (
    <tr
      key={row.id}
      className={`
        ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}
        ${isRowBusy ? 'opacity-50 transition-opacity duration-300 pointer-events-none' : ''}
        transition-colors duration-150
      `}
    >
      {columns.map((col) => (
        <td
          key={`${row.id}-${col.key}`}
          className={`px-3 py-2 align-top ${col?.className || ''} ${isEditing && col.editable ? 'py-1' : ''}`}
        >
          {col.key === 'actions' ? (
            <ActionCell
              row={row}
              type={type}
              canEdit={canEdit}
              canMutate={canMutate}
              isEditing={isEditing}
              isSaving={isSaving}
              setIsSaving={() => {}} // Dummy setter
              actionState={actionState}
              setActionState={setActionState}
              editError={editError}
              setEditError={setEditError}
              setEditingRowIds={setEditingRowIds}
              currentRowFormData={rowData}
              setEditFormData={() => {}} // Dummy setter
              setConfirmDeleteInfo={setConfirmDeleteInfo}
              onDataMutated={onDataMutated}
              setError={setError}
              columns={columns}
              isAdding={isAdding}
              disableActions={isAdding || (isBulkEditing && !isEditing)}
            />
          ) : col.key === 'select' ? (
            col.Cell ? col.Cell({ row }) : null
          ) : (
            <EditableCell
              row={row}
              col={col}
              isEditing={isEditing}
              rowData={rowData}
              onDataChange={onDataChange}
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

export default AdminTableRow;