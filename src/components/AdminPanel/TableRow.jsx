/**
 * TableRow Component
 * 
 * Extracted from EnhancedAdminTable for better maintainability.
 * Handles individual row rendering with inline editing, actions, and selection.
 */

import React from 'react';
import { Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedEditableCell } from './EnhancedEditableCell';

export const TableRow = ({ 
  row, 
  columns, 
  resourceType,
  selectedRows, 
  onRowSelect, 
  onFieldEdit,
  onDelete,
  onOpenGooglePlaces,
  cities = [],
  neighborhoods = [],
  enableSelection = true,
  enableInlineEditing = true,
  isDeleting = false
}) => {
  const isSelected = selectedRows.has(row.id);
  
  return (
    <tr className={cn(
      "hover:bg-gray-50 transition-colors duration-150",
      isSelected && "bg-blue-50 border-l-4 border-l-blue-400"
    )}>
      {enableSelection && (
        <td className="w-12 px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onRowSelect(row.id)}
            className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-150"
            aria-label={`Select ${resourceType} ${row.name || row.id}`}
          />
        </td>
      )}
      {columns.map((column) => (
        <td key={column.accessor} className="px-4 py-3 text-sm">
          {enableInlineEditing && column.isEditable !== false ? (
            <EnhancedEditableCell
              resourceType={resourceType}
              rowId={row.id}
              fieldName={column.accessor}
              value={row[column.accessor]}
              columnConfig={column}
              cities={cities}
              neighborhoods={neighborhoods}
              onSave={onFieldEdit}
              disabled={!column.isEditable}
              row={row}
            />
          ) : (
            <div className="min-h-[32px] flex items-center">
              {column.render ? 
                column.render(row[column.accessor], row) : 
                (row[column.accessor] ?? <span className="text-gray-400 italic">N/A</span>)
              }
            </div>
          )}
        </td>
      ))}
      <td className="w-16 px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Google Places button for restaurants */}
          {resourceType === 'restaurants' && onOpenGooglePlaces && (
            <button
              onClick={() => onOpenGooglePlaces(row)}
              className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors duration-150"
              title="Search Google Places"
              aria-label={`Search Google Places for ${row.name}`}
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          
          {/* Delete button */}
          <button
            onClick={() => onDelete(row.id)}
            disabled={isDeleting}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors duration-150 disabled:opacity-50"
            title="Delete"
            aria-label={`Delete ${resourceType} ${row.name || row.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}; 