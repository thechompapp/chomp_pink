import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: -1, label: 'All' }
];

export const PaginationControls = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 25,
  onPageChange,
  onPageSizeChange,
  className = '',
  showPageSizeSelector = true,
  showPageInfo = true,
  showNavigation = true
}) => {
  const totalPages = pageSize === -1 ? 1 : Math.ceil(totalItems / pageSize);
  const startItem = pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = pageSize === -1 ? totalItems : Math.min(currentPage * pageSize, totalItems);
  
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages && pageSize !== -1;
  
  const handlePageSizeChange = (newPageSize) => {
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
      // Reset to page 1 when changing page size
      if (onPageChange) {
        onPageChange(1);
      }
    }
  };
  
  const generatePageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages = [];
    
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  if (totalItems === 0) {
    return (
      <div className={cn("flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50", className)}>
        <div className="text-sm text-gray-500">No items to display</div>
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">items</span>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50", className)}>
      {/* Left side - Page info */}
      {showPageInfo && (
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
          
          {pageSize !== -1 && (
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
      )}
      
      {/* Right side - Controls */}
      <div className="flex items-center space-x-4">
        {/* Page size selector */}
        {showPageSizeSelector && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-700">items</span>
          </div>
        )}
        
        {/* Navigation */}
        {showNavigation && pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center space-x-1">
            {/* First page */}
            <button
              onClick={() => onPageChange && onPageChange(1)}
              disabled={!canGoPrevious}
              className={cn(
                "p-2 rounded-md transition-colors",
                canGoPrevious 
                  ? "hover:bg-gray-200 text-gray-700" 
                  : "text-gray-400 cursor-not-allowed"
              )}
              title="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            
            {/* Previous page */}
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={!canGoPrevious}
              className={cn(
                "p-2 rounded-md transition-colors",
                canGoPrevious 
                  ? "hover:bg-gray-200 text-gray-700" 
                  : "text-gray-400 cursor-not-allowed"
              )}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {generatePageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-2 py-1 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => onPageChange && onPageChange(page)}
                      className={cn(
                        "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-200 text-gray-700"
                      )}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Next page */}
            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className={cn(
                "p-2 rounded-md transition-colors",
                canGoNext 
                  ? "hover:bg-gray-200 text-gray-700" 
                  : "text-gray-400 cursor-not-allowed"
              )}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Last page */}
            <button
              onClick={() => onPageChange && onPageChange(totalPages)}
              disabled={!canGoNext}
              className={cn(
                "p-2 rounded-md transition-colors",
                canGoNext 
                  ? "hover:bg-gray-200 text-gray-700" 
                  : "text-gray-400 cursor-not-allowed"
              )}
              title="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaginationControls; 