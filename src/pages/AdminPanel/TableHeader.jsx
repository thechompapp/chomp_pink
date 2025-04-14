// src/pages/AdminPanel/TableHeader.jsx
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

// --- REMOVED: TypeScript interfaces ---

const TableHeader = ({ // Removed : React.FC<TableHeaderProps>
  columns,
  currentSortColumn,
  currentSortDirection,
  onSortChange,
  type,
  isAdding,
  editingRowIds,
}) => {
  const handleSortClick = (key, sortable) => { // Removed type annotations
    // Prevent sorting when adding or editing
    if (!onSortChange || !key || !type || !sortable || isAdding || editingRowIds.size > 0) return;

    const newDirection = currentSortColumn === key && currentSortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(type, key, newDirection); // Pass type, column key, and direction
  };

  return (
    <thead className="sticky top-0 z-10 bg-gray-50">
      <tr>
        {columns.map((col) => {
            // Determine sort state for ARIA attributes
            const ariaSort = col.sortable
                ? currentSortColumn === (col.sortKey || col.key)
                  ? currentSortDirection === 'asc' ? 'ascending' : 'descending'
                  : 'none'
                : undefined;
            // Create title attribute for sortable columns
            const title = col.sortable ? `Sort by ${typeof col.header === 'string' ? col.header : 'column'}` : undefined;
            const canSortNow = col.sortable && !isAdding && editingRowIds.size === 0;

            return (
              <th
                key={col.key}
                scope="col"
                className={`px-3 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs ${
                  col.className || ''
                } ${canSortNow ? 'cursor-pointer hover:bg-gray-100 transition-colors group' : ''}`} // Only add hover effect if sortable now
                onClick={canSortNow ? () => handleSortClick(col.sortKey || col.key, col.sortable) : undefined} // Only add onClick if sortable now
                aria-sort={ariaSort}
                title={title}
              >
                <div className="flex items-center gap-1">
                  {typeof col.header === 'string' ? col.header : col.header}
                  {/* Show sort icon only if column is sortable */}
                  {col.sortable && (
                    <span className={`transition-opacity ${canSortNow ? 'opacity-40 group-hover:opacity-100' : 'opacity-20'}`}>
                      {currentSortColumn === (col.sortKey || col.key) ? (
                        currentSortDirection === 'asc' ? ( <ArrowUp size={12} /> ) : ( <ArrowDown size={12} /> )
                      ) : (
                        <ArrowDown size={12} className="opacity-50" /> // Default icon appearance
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