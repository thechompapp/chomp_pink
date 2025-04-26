// src/components/UI/BaseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils'; // Assuming you use this for class merging

// Base card component with optional linking and quick add
const BaseCard = ({
  children,
  className,
  linkTo, // Make linkTo optional
  onClick,
  onQuickAdd,
  quickAddLabel = 'Quick Add',
  showHoverEffect = true, // Default to true, consume this prop
  ...props // Collect remaining props
}) => {
  const cardContent = (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 flex flex-col h-full overflow-hidden relative", // Ensure relative positioning for potential absolute children
        showHoverEffect && "transition-shadow duration-200 ease-in-out group-hover:shadow-md", // Apply hover effect conditionally
        className // Allow overriding classes
      )}
      // Do NOT spread ...props here if the root element might change (Link vs div)
      // Or, filter out non-DOM props before spreading if always rendering a div/a
    >
      {children}
      {/* Render QuickAdd button absolutely positioned if handler is provided */}
      {onQuickAdd && (
        <button
          onClick={(e) => {
            e.preventDefault(); // Prevent link navigation if card is linked
            e.stopPropagation(); // Prevent card onClick if defined
            onQuickAdd();
          }}
          aria-label={quickAddLabel}
          title={quickAddLabel} // Tooltip for accessibility
          className="absolute top-1 right-1 p-1 text-gray-400 hover:text-primary dark:hover:text-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out bg-white dark:bg-gray-800 rounded-full focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
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

export default BaseCard;