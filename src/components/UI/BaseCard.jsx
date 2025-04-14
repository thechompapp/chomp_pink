/* src/components/UI/BaseCard.jsx */
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
  onClick,
  ...rest
}) => {
  // FIX: Ensure consistent height using h-56 (adjust if needed based on final design)
  const cardClasses = `
    relative group block overflow-hidden rounded-lg border
    ${isHighlighted ? 'border-[#A78B71] ring-1 ring-[#A78B71]' : 'border-gray-200 hover:border-gray-300'}
    bg-white transition-all duration-200
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}
    w-full h-56 // Enforce fixed height
    flex // Make the card itself a flex container
    ${className}
  `;

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onQuickAdd) onQuickAdd(e);
  };

  // The inner div takes full height/width of the card and positions children
  const CardContent = () => (
    <div className="p-3 w-full h-full relative flex flex-col"> {/* Inner div takes full height/width */}
        {children} {/* Children should use flex-grow/shrink as needed */}
         {showQuickAdd && onQuickAdd && !isDisabled && (
            <button
              onClick={handleQuickAddClick}
              aria-label={quickAddLabel || 'Quick Add'}
              // Adjusted quick add button position/style if needed
              className="absolute top-2 right-2 z-10 p-1 bg-[#A78B71]/70 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-[#A78B71]"
              tabIndex={-1} // Keep -1 if focus management handled by card itself
            >
              <Plus size={14} />
            </button>
         )}
    </div>
  );


  if (!isDisabled && linkTo) {
    return (
      <Link
        to={linkTo}
        onClick={onClick} // Ensure onClick is passed if provided
        className={`${cardClasses} focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1`}
        {...rest}
      >
        <CardContent />
      </Link>
    );
  }

  // Render as div if no link or disabled
  return (
    <div
        onClick={isDisabled ? undefined : onClick} // Ensure onClick is passed if provided
        className={`${cardClasses} ${!isDisabled && onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1' : ''}`}
        {...rest}
    >
      <CardContent />
    </div>
  );
};

export default BaseCard;