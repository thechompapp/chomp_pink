// src/components/UI/BaseCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils'; // Assuming you use this for class merging
import useAuthStore from '@/stores/useAuthStore';

// Base card component with optional linking and quick add
const BaseCard = ({
  children,
  className,
  linkTo, // Make linkTo optional
  onClick,
  onQuickAdd,
  quickAddLabel = 'Quick Add',
  showHoverEffect = true, // Default to true, consume this prop
  showQuickAdd, // Add this to the destructuring to consume it and prevent passing to DOM
  ...props // Collect remaining props
}) => {
  // Check if user is authenticated
  const { isAuthenticated } = useAuthStore();
  const cardContent = (
    <div
      className={cn(
        "bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative", // Clean design with thin black border
        className // Allow overriding classes
      )}
      // Do NOT spread ...props here if the root element might change (Link vs div)
      // Or, filter out non-DOM props before spreading if always rendering a div/a
    >
      {children}
      {/* Render QuickAdd button absolutely positioned if handler is provided AND user is logged in */}
      {onQuickAdd && showQuickAdd !== false && isAuthenticated && (
        <button
          onClick={(e) => {
            e.preventDefault(); // Prevent link navigation if card is linked
            e.stopPropagation(); // Prevent card onClick if defined
            onQuickAdd();
          }}
          aria-label={quickAddLabel}
          title={quickAddLabel} // Tooltip for accessibility
          className="absolute top-1 right-1 p-1 text-black bg-white rounded-full border border-black"
        >
          {/* Replace with appropriate Quick Add icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      )}
    </div>
  );

  // Conditionally wrap with Link only if linkTo is provided
  if (linkTo) {
    return (
      <Link to={linkTo} onClick={onClick} {...props} className="block group"> {/* Add group class here for hover effects */}
        {cardContent}
      </Link>
    );
  }

  // Render as a simple div if not linkable
  return (
    <div onClick={onClick} {...props} className="group"> {/* Add group class here */}
      {cardContent}
    </div>
  );
};

// Explicitly define prop types for documentation
BaseCard.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  linkTo: PropTypes.string,
  onClick: PropTypes.func,
  onQuickAdd: PropTypes.func,
  quickAddLabel: PropTypes.string,
  showHoverEffect: PropTypes.bool,
  showQuickAdd: PropTypes.bool
};

export default BaseCard;