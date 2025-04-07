// src/components/UI/BaseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const BaseCard = ({
  linkTo,
  onQuickAdd,
  quickAddLabel,
  children,
  className = '',
  isHighlighted = false,
  isDisabled = false,
  showQuickAdd = true,
  onClick, // <<< Added onClick prop
  ...rest // <<< Capture any other props like aria-label passed down
}) => {
  const cardClasses = `
    relative group block overflow-hidden rounded-lg border
    ${isHighlighted ? 'border-[#A78B71] ring-1 ring-[#A78B71]' : 'border-gray-200 hover:border-gray-300'}
    bg-white transition-all duration-200
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}
    w-full h-64 // Enforce consistent height here
    flex flex-col // Added flex-col to allow content spacing
    ${className}
  `;

  // Quick Add button handler
  const handleQuickAddClick = (e) => {
    // Stop propagation to prevent the card's main onClick (if any) from firing
    e.stopPropagation();
    e.preventDefault();
    if (onQuickAdd) onQuickAdd(e);
  };

  // Card Content: Renders children and the Quick Add button
  // It's separated for clarity and reuse between the Link and div versions
  const CardContent = ({ forwardedRef }) => ( // Accept ref if needed later
    // Removed focus-within styles here as they should be on the main clickable element (Link or div)
    <div ref={forwardedRef} className="flex flex-col h-full p-3 relative">
      {/* Make children container grow */}
      <div className="flex-grow">
        {children}
      </div>
      {showQuickAdd && onQuickAdd && !isDisabled && (
        <button
          onClick={handleQuickAddClick}
          aria-label={quickAddLabel || 'Quick Add'}
          // Adjusted positioning and visibility slightly
          className="absolute top-2 right-2 z-10 p-1 bg-[#A78B71]/70 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-[#A78B71]"
          tabIndex={-1} // Prevent Quick Add from being tab-focused initially when card is focusable
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );

  // Render as Link if linkTo is provided and not disabled
  if (!isDisabled && linkTo) {
    return (
      <Link
        to={linkTo}
        onClick={onClick} // <<< Pass onClick to the Link component
        className={`${cardClasses} focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1`} // Apply focus styles here
        {...rest} // Pass down other props like aria-label
      >
        <CardContent />
      </Link>
    );
  }

  // Otherwise, render as a div (useful for skeletons or non-interactive cards)
  // Pass onClick here too, in case the div itself needs to be clickable
  return (
    <div
        onClick={isDisabled ? undefined : onClick} // Only allow click if not disabled
        className={`${cardClasses} ${!isDisabled && onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1' : ''}`} // Add focus styles if clickable
        {...rest} // Pass down other props
    >
      <CardContent />
    </div>
  );
};

export default BaseCard;