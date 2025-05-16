// src/pages/AdminPanel/TableHeader.jsx
/* FIXED: Add defensive check for undefined editingRowIds */
/* FIXED: Added key to conditional select-all th */
/* FIXED: Updated references from col.sortable to col.isSortable for consistency */
import React from 'react';
import { ArrowDown, ArrowUp, Settings2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/UI/DropdownMenu';

const TableHeader = ({
  columns,
  currentSortColumn,
  currentSortDirection,
  onSortChange,
  type, // Passed from AdminTable
  isAdding, // Passed from AdminTable
  editingRowIds, // Passed from AdminTable (should be a Set)
  isAllSelected, // Passed from AdminTable
  onSelectAll, // Passed from AdminTable
  showSelect, // Passed from AdminTable
  visibleColumns = [], // Add default value
  onToggleColumn,
  onColumnOrderChange,
}) => {
  const handleSortClick = (key, sortable) => {
    const safeEditingRowIds = editingRowIds instanceof Set ? editingRowIds : new Set();
    if (!onSortChange || !key || !type || !sortable || isAdding || safeEditingRowIds.size > 0) return;

    const newDirection = currentSortColumn === key && currentSortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(type, key, newDirection);
  };

  const safeEditingRowIds = editingRowIds instanceof Set ? editingRowIds : new Set();

  return (
    <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
      <tr>
        {/* Select All Checkbox */}
        {showSelect && (
          <th key="select-all-header" scope="col" className="px-3 py-3 text-left">
            <input
              type="checkbox"
              className="rounded border-input text-foreground focus:ring-ring disabled:opacity-50 bg-background"
              checked={isAllSelected ?? false}
              onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
              aria-label="Select all rows"
              disabled={isAdding || safeEditingRowIds.size > 0}
            />
          </th>
        )}
        {/* Column Headers */}
        {columns.map((col) => {
          const columnKey = col.accessor;
          const sortKey = columnKey;
          const canSortNow = !isAdding && safeEditingRowIds.size === 0;
          const ariaSort = currentSortColumn === sortKey ? currentSortDirection : undefined;
          const title = canSortNow ? `Sort by ${col.header}` : undefined;

          return (
            <th
              key={`header-${columnKey}`}
              scope="col"
              className={`px-3 py-3 text-left font-semibold text-sm text-foreground ${col.className || ''} ${
                canSortNow ? 'cursor-pointer hover:bg-muted transition-colors group' : 'cursor-default'
              }`}
              onClick={canSortNow ? () => handleSortClick(sortKey, true) : undefined}
              aria-sort={ariaSort}
              title={title}
            >
              <div className="flex items-center gap-1">
                <span className="font-medium">{col.header}</span>
                <span className={`transition-opacity ${canSortNow ? 'opacity-50 group-hover:opacity-100' : 'opacity-30'}`}>
                  {currentSortColumn === sortKey ? (
                    currentSortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                  ) : (
                    <ArrowDown size={14} className="opacity-40" />
                  )}
                </span>
              </div>
            </th>
          );
        })}
        {/* Actions Column */}
        <th scope="col" className="px-3 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-semibold text-foreground">Actions</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  aria-label="Column settings"
                >
                  <Settings2 size={16} className="text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {columns.map((col) => (
                  <DropdownMenuItem
                    key={col.accessor}
                    onSelect={() => onToggleColumn && onToggleColumn(col.accessor)}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.accessor)}
                      onChange={() => {}}
                      className="rounded border-input text-foreground focus:ring-ring"
                    />
                    <span>{col.header}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </th>
      </tr>
    </thead>
  );
};

export default TableHeader;