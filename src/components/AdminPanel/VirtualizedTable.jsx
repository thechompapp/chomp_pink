/**
 * VirtualizedTable Component
 * 
 * High-performance table component with virtual scrolling for large datasets.
 * Only renders visible rows to maintain optimal performance.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';
import { TableRow } from './TableRow';

const ITEM_HEIGHT = 60; // Height of each row in pixels
const CONTAINER_HEIGHT = 600; // Height of the virtualized container

export const VirtualizedTable = ({
  data = [],
  columns = [],
  resourceType,
  selectedRows = new Set(),
  onRowSelect,
  onFieldEdit,
  onDelete,
  onOpenGooglePlaces,
  cities = [],
  neighborhoods = [],
  enableSelection = true,
  enableInlineEditing = true,
  isDeleting = false,
  className = ''
}) => {
  const listRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Memoize visible items calculation
  const visibleItems = useMemo(() => {
    const containerHeight = CONTAINER_HEIGHT;
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / ITEM_HEIGHT) + 1,
      data.length
    );
    
    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      visibleCount: endIndex - startIndex
    };
  }, [scrollTop, data.length]);

  // Handle scroll events
  const handleScroll = useCallback((scrollTop) => {
    setScrollTop(scrollTop);
  }, []);

  // Row renderer for virtual list
  const RowRenderer = useCallback(({ index, style }) => {
    const row = data[index];
    
    if (!row) return null;

    return (
      <div style={style} className="flex">
        <TableRow
          row={row}
          columns={columns}
          resourceType={resourceType}
          selectedRows={selectedRows}
          onRowSelect={onRowSelect}
          onFieldEdit={onFieldEdit}
          onDelete={onDelete}
          onOpenGooglePlaces={onOpenGooglePlaces}
          cities={cities}
          neighborhoods={neighborhoods}
          enableSelection={enableSelection}
          enableInlineEditing={enableInlineEditing}
          isDeleting={isDeleting}
        />
      </div>
    );
  }, [
    data,
    columns,
    resourceType,
    selectedRows,
    onRowSelect,
    onFieldEdit,
    onDelete,
    onOpenGooglePlaces,
    cities,
    neighborhoods,
    enableSelection,
    enableInlineEditing,
    isDeleting
  ]);

  // Calculate total height for scrollbar
  const totalHeight = data.length * ITEM_HEIGHT;

  // Scroll to specific item
  const scrollToItem = useCallback((index, align = 'auto') => {
    if (listRef.current) {
      listRef.current.scrollToItem(index, align);
    }
  }, []);

  // Get current scroll position info
  const getScrollInfo = useCallback(() => {
    return {
      scrollTop,
      totalHeight,
      visibleItems,
      itemHeight: ITEM_HEIGHT,
      containerHeight: CONTAINER_HEIGHT
    };
  }, [scrollTop, totalHeight, visibleItems]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!data.length) return;

    const { startIndex } = visibleItems;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        scrollToItem(Math.min(startIndex + 1, data.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        scrollToItem(Math.max(startIndex - 1, 0));
        break;
      case 'PageDown':
        event.preventDefault();
        scrollToItem(Math.min(startIndex + 10, data.length - 1));
        break;
      case 'PageUp':
        event.preventDefault();
        scrollToItem(Math.max(startIndex - 10, 0));
        break;
      case 'Home':
        event.preventDefault();
        scrollToItem(0);
        break;
      case 'End':
        event.preventDefault();
        scrollToItem(data.length - 1);
        break;
    }
  }, [data.length, visibleItems, scrollToItem]);

  // Effect to handle data changes
  useEffect(() => {
    // Reset scroll position when data changes significantly
    if (data.length === 0) {
      setScrollTop(0);
    }
  }, [data.length]);

  // Performance monitoring
  const performanceInfo = useMemo(() => {
    const visibleCount = visibleItems.visibleCount;
    const totalCount = data.length;
    const renderRatio = totalCount > 0 ? (visibleCount / totalCount) * 100 : 0;
    
    return {
      totalRows: totalCount,
      visibleRows: visibleCount,
      renderRatio: renderRatio.toFixed(1),
      memoryReduction: (100 - renderRatio).toFixed(1)
    };
  }, [data.length, visibleItems.visibleCount]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className={cn("virtualized-table-container", className)}>
      {/* Performance info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Virtualization: {performanceInfo.visibleRows}/{performanceInfo.totalRows} rows visible 
          ({performanceInfo.renderRatio}% rendered, {performanceInfo.memoryReduction}% memory saved)
        </div>
      )}

      {/* Table header (sticky) */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {enableSelection && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        data.forEach(row => onRowSelect?.(row.id, true));
                      } else {
                        selectedRows.forEach(id => onRowSelect?.(id, false));
                      }
                    }}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Virtualized table body */}
      <div 
        className="virtualized-table-body"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label={`${resourceType} table with ${data.length} rows`}
      >
        <List
          ref={listRef}
          height={CONTAINER_HEIGHT}
          itemCount={data.length}
          itemSize={ITEM_HEIGHT}
          onScroll={({ scrollTop }) => handleScroll(scrollTop)}
          overscanCount={5} // Render 5 extra items for smoother scrolling
          className="virtualized-list"
        >
          {RowRenderer}
        </List>
      </div>

      {/* Scroll indicators */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>
          Showing {visibleItems.startIndex + 1}-{Math.min(visibleItems.endIndex, data.length)} of {data.length}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => scrollToItem(0)}
            disabled={scrollTop === 0}
            className="px-2 py-1 text-xs border rounded disabled:opacity-50 hover:bg-gray-50"
            aria-label="Scroll to top"
          >
            Top
          </button>
          <button
            onClick={() => scrollToItem(data.length - 1)}
            disabled={visibleItems.endIndex >= data.length}
            className="px-2 py-1 text-xs border rounded disabled:opacity-50 hover:bg-gray-50"
            aria-label="Scroll to bottom"
          >
            Bottom
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for virtualized table utilities
export const useVirtualizedTable = () => {
  const [listRef, setListRef] = useState(null);

  const scrollToItem = useCallback((index, align = 'auto') => {
    if (listRef) {
      listRef.scrollToItem(index, align);
    }
  }, [listRef]);

  const scrollToTop = useCallback(() => {
    scrollToItem(0, 'start');
  }, [scrollToItem]);

  const scrollToBottom = useCallback(() => {
    if (listRef && listRef.props) {
      scrollToItem(listRef.props.itemCount - 1, 'end');
    }
  }, [scrollToItem, listRef]);

  return {
    setListRef,
    scrollToItem,
    scrollToTop,
    scrollToBottom
  };
};

// Higher-order component for adding virtualization to existing tables
export const withVirtualization = (TableComponent) => {
  return React.forwardRef((props, ref) => {
    const { data = [], threshold = 100 } = props;
    
    // Only use virtualization for large datasets
    if (data.length < threshold) {
      return <TableComponent {...props} ref={ref} />;
    }

    return <VirtualizedTable {...props} ref={ref} />;
  });
}; 