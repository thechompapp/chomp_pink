// src/pages/AdminPanel/TableHeader.jsx
/* FIXED: Add defensive check for undefined editingRowIds */
/* FIXED: Added key to conditional select-all th */
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

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
}) => {
  const handleSortClick = (key, sortable) => {
    // Ensure editingRowIds is treated as a Set, even if undefined is passed
    const safeEditingRowIds = editingRowIds instanceof Set ? editingRowIds : new Set();
    if (!onSortChange || !key || !type || !sortable || isAdding || safeEditingRowIds.size > 0) return;

    const newDirection = currentSortColumn === key && currentSortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(type, key, newDirection); // Assuming AdminTable maps its onSort prop to this
  };

  // Ensure editingRowIds is treated as a Set, even if undefined is passed
  const safeEditingRowIds = editingRowIds instanceof Set ? editingRowIds : new Set();

  return (
    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
      <tr>
        {/* Select All Checkbox (Conditionally Rendered) */}
        {showSelect && (
           // *** FIXED: Added unique key ***
           <th key="select-all-header" scope="col" className="px-3 py-2.5 text-left">
               <input
                   type="checkbox"
                   className="rounded border-gray-300 dark:border-gray-600 text-primary dark:text-primary-dark focus:ring-primary-dark disabled:opacity-50 bg-white dark:bg-gray-700"
                   checked={isAllSelected ?? false} // Handle potential undefined
                   onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                   aria-label="Select all rows"
                   // Disable if adding or editing any row
                   disabled={isAdding || safeEditingRowIds.size > 0}
               />
           </th>
        )}
        {/* Column Headers */}
        {columns.map((col) => {
            // Use accessor or key for consistency
            const columnKey = col.key || col.accessor;
            if (!columnKey) {
                console.warn("[TableHeader] Column definition missing key/accessor:", col);
                return <th key={`header-invalid-${col.header || Math.random()}`} className="px-3 py-2.5 text-left font-semibold text-red-500 italic">Invalid Col</th>;
            }
            // Skip rendering if column key is explicitly 'actions' or handled elsewhere
            if (columnKey === 'actions') return null;

            const sortKey = col.sortKey || columnKey; // Use specific sortKey if provided
            const ariaSort = col.sortable ? (currentSortColumn === sortKey ? (currentSortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined;
            const title = col.sortable ? `Sort by ${typeof col.header === 'string' ? col.header : 'column'}` : undefined;
            // Use safeEditingRowIds for the check
            const canSortNow = col.sortable && !isAdding && safeEditingRowIds.size === 0;

            return (
              <th
                // *** Use columnKey for the React key ***
                key={`header-${columnKey}`}
                scope="col"
                className={`px-3 py-2.5 text-left font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-xs ${ col.className || '' } ${canSortNow ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group' : 'cursor-default'}`}
                onClick={canSortNow ? () => handleSortClick(sortKey, col.sortable) : undefined}
                aria-sort={ariaSort}
                title={title}
              >
                <div className="flex items-center gap-1">
                  {/* Render header content (string or JSX) */}
                  {col.header}
                  {col.sortable && (
                    <span className={`transition-opacity ${canSortNow ? 'opacity-40 group-hover:opacity-100' : 'opacity-20'}`}>
                      {currentSortColumn === sortKey ? (
                        currentSortDirection === 'asc' ? ( <ArrowUp size={12} /> ) : ( <ArrowDown size={12} /> )
                      ) : (
                        // Show dimmed down arrow as default sort indicator
                        <ArrowDown size={12} className="opacity-50" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            );
        })}
      </tr>
    </thead>
  );
};

export default TableHeader;