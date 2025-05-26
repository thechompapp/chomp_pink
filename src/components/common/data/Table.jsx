/**
 * Table Component
 * 
 * A standardized table component for displaying data with support for
 * sorting, filtering, pagination, and custom cell rendering.
 */
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Pagination } from '@/components/common/pagination/Pagination';
import { Spinner } from '@/components/common/loaders/Spinner';

/**
 * Table component for displaying data
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of data objects
 * @param {Array} props.columns - Array of column definitions
 * @param {boolean} props.loading - Whether data is loading
 * @param {boolean} props.sortable - Whether columns are sortable
 * @param {boolean} props.paginated - Whether to paginate the data
 * @param {number} props.pageSize - Number of items per page
 * @param {function} props.onRowClick - Function called when a row is clicked
 * @param {string} props.emptyMessage - Message to display when there is no data
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactNode}
 */
export const Table = ({
  data = [],
  columns = [],
  loading = false,
  sortable = true,
  paginated = false,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  
  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);
  
  // Handle column sort
  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-30" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" />
          <path d="M6 6a1 1 0 100 2h8a1 1 0 100-2H6zM6 14a1 1 0 100 2h8a1 1 0 100-2H6z" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  };
  
  // Filter and sort data
  const processedData = useMemo(() => {
    // Filter data
    let filteredData = data;
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filteredData = data.filter(item => {
        return columns.some(column => {
          const value = column.accessor ? item[column.accessor] : column.cell?.(item);
          return value && String(value).toLowerCase().includes(lowerFilter);
        });
      });
    }
    
    // Sort data
    if (sortConfig.key) {
      filteredData = [...filteredData].sort((a, b) => {
        const column = columns.find(col => col.accessor === sortConfig.key);
        
        // Get values to compare
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Use sortValue function if provided
        if (column && column.sortValue) {
          aValue = column.sortValue(a);
          bValue = column.sortValue(b);
        }
        
        // Handle undefined or null values
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // Compare values
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredData;
  }, [data, columns, sortConfig, filter]);
  
  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize, paginated]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(processedData.length / pageSize);
  }, [processedData, pageSize]);
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };
  
  // Render cell content
  const renderCell = (row, column) => {
    if (column.cell) {
      return column.cell(row);
    }
    
    return row[column.accessor];
  };
  
  return (
    <div className="w-full">
      {/* Filter input */}
      <div className="mb-4">
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Filter..."
          value={filter}
          onChange={handleFilterChange}
        />
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor || column.id}
                  scope="col"
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${sortable && column.sortable !== false ? 'cursor-pointer select-none' : ''}
                  `}
                  onClick={() => column.sortable !== false && handleSort(column.accessor)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <span>{getSortIndicator(column.accessor)}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <Spinner size="medium" />
                  </div>
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.accessor || column.id}`}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

Table.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired,
      accessor: PropTypes.string,
      id: PropTypes.string,
      cell: PropTypes.func,
      sortable: PropTypes.bool,
      sortValue: PropTypes.func
    })
  ).isRequired,
  loading: PropTypes.bool,
  sortable: PropTypes.bool,
  paginated: PropTypes.bool,
  pageSize: PropTypes.number,
  onRowClick: PropTypes.func,
  emptyMessage: PropTypes.string,
  className: PropTypes.string
};

export default Table;
