/**
 * Pagination Component
 * 
 * A component for navigating through paginated data.
 * Supports different styles and responsive design.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Pagination.styles.css';

/**
 * Pagination Component
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current page number (1-based)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Function called when page changes
 * @param {number} props.siblingCount - Number of siblings to show on each side of current page
 * @param {boolean} props.showFirstLast - Whether to show first/last page buttons
 * @param {boolean} props.showPrevNext - Whether to show previous/next buttons
 * @param {string} props.size - Size of pagination (sm, md, lg)
 * @param {string} props.className - Additional CSS class names
 * @param {Object} props.rest - Additional props for the pagination container
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  size = 'md',
  className = '',
  ...rest
}) => {
  // Generate page numbers to display
  const pageNumbers = useMemo(() => {
    // Ensure currentPage is within valid range
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
    
    // Calculate range of pages to show
    const range = [];
    
    // Always add first page
    range.push(1);
    
    // Calculate start and end of sibling range
    const startSibling = Math.max(2, validCurrentPage - siblingCount);
    const endSibling = Math.min(totalPages - 1, validCurrentPage + siblingCount);
    
    // Add ellipsis after first page if needed
    if (startSibling > 2) {
      range.push('...');
    }
    
    // Add sibling pages
    for (let i = startSibling; i <= endSibling; i++) {
      range.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endSibling < totalPages - 1) {
      range.push('...');
    }
    
    // Add last page if it's not already included
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range;
  }, [currentPage, totalPages, siblingCount]);
  
  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };
  
  // Combine class names based on props
  const paginationClasses = classNames(
    'pagination',
    `pagination-${size}`,
    className
  );
  
  return (
    <nav className={paginationClasses} aria-label="Pagination" {...rest}>
      <ul className="pagination-list">
        {/* First Page Button */}
        {showFirstLast && (
          <li className="pagination-item">
            <button
              className="pagination-button pagination-first"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <span aria-hidden="true">«</span>
            </button>
          </li>
        )}
        
        {/* Previous Page Button */}
        {showPrevNext && (
          <li className="pagination-item">
            <button
              className="pagination-button pagination-prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <span aria-hidden="true">‹</span>
            </button>
          </li>
        )}
        
        {/* Page Numbers */}
        {pageNumbers.map((page, index) => (
          <li key={`${page}-${index}`} className="pagination-item">
            {page === '...' ? (
              <span className="pagination-ellipsis">…</span>
            ) : (
              <button
                className={classNames('pagination-button', {
                  'pagination-button-active': page === currentPage
                })}
                onClick={() => handlePageChange(page)}
                disabled={page === currentPage}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )}
          </li>
        ))}
        
        {/* Next Page Button */}
        {showPrevNext && (
          <li className="pagination-item">
            <button
              className="pagination-button pagination-next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <span aria-hidden="true">›</span>
            </button>
          </li>
        )}
        
        {/* Last Page Button */}
        {showFirstLast && (
          <li className="pagination-item">
            <button
              className="pagination-button pagination-last"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <span aria-hidden="true">»</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  siblingCount: PropTypes.number,
  showFirstLast: PropTypes.bool,
  showPrevNext: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default Pagination;
