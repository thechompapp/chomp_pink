// src/pages/AdminPanel/TableHeader.tsx
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface ColumnConfig {
  key: string;
  header: string | JSX.Element;
  sortable?: boolean;
  sortKey?: string;
  className?: string;
}

interface TableHeaderProps {
  columns: ColumnConfig[];
  currentSortColumn: string;
  currentSortDirection: string;
  onSortChange: (type: string, column: string, direction: string) => void;
  type: string;
  isAdding: boolean;
  editingRowIds: Set<number | string>;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  columns,
  currentSortColumn,
  currentSortDirection,
  onSortChange,
  type,
  isAdding,
  editingRowIds,
}) => {
  const handleSortClick = (key: string, sortable?: boolean) => {
    if (!onSortChange || !key || !type || !sortable || isAdding || editingRowIds.size > 0) return;
    const newDirection = currentSortColumn === key && currentSortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(type, key, newDirection);
  };

  return (
    <thead className="sticky top-0 z-10 bg-gray-50">
      <tr>
        {columns.map((col) => (
          <th
            key={col.key}
            scope="col"
            className={`px-3 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs ${
              col.className || ''
            } ${col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors group' : ''}`}
            onClick={col.sortable ? () => handleSortClick(col.sortKey || col.key, col.sortable) : undefined}
            aria-sort={
              col.sortable
                ? currentSortColumn === (col.sortKey || col.key)
                  ? currentSortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                : undefined
            }
            title={col.sortable ? `Sort by ${typeof col.header === 'string' ? col.header : 'column'}` : undefined}
          >
            <div className="flex items-center gap-1">
              {typeof col.header === 'string' ? col.header : col.header}
              {col.sortable && (
                <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                  {currentSortColumn === (col.sortKey || col.key) ? (
                    currentSortDirection === 'asc' ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )
                  ) : (
                    <ArrowDown size={12} className="opacity-50" />
                  )}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default TableHeader;