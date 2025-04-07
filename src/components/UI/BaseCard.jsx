// src/components/UI/BaseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const BaseCard = ({
  linkTo,
  onQuickAdd,
  quickAddLabel,
  children, // Children now represent the *entire* inner content structure provided by RestaurantCard, DishCard, ListCard
  className = '',
  isHighlighted = false,
  isDisabled = false,
  showQuickAdd = true, // Kept for consistency, though rendered inside children now if needed
  onClick,
  ...rest
}) => {
  const cardClasses = `
    relative group block overflow-hidden rounded-lg border
    ${isHighlighted ? 'border-[#A78B71] ring-1 ring-[#A78B71]' : 'border-gray-200 hover:border-gray-300'}
    bg-white transition-all duration-200
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}
    w-full h-64 // Fixed height enforced here
    flex // Use flex to make the link/div itself a flex container if needed by children
    ${className}
  `;

  // Quick Add button handler remains the same
  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onQuickAdd) onQuickAdd(e);
  };

  // CardContent simplified: BaseCard now primarily provides the sized, styled box.
  // The child component (RestaurantCard, DishCard, ListCard) is now fully responsible
  // for its internal layout (e.g., using flex-col, flex-grow, handling tags/buttons)
  // within the fixed h-64 boundary provided by this BaseCard.
  const CardContent = () => (
    <div className="p-3 w-full h-full relative"> {/* Add w-full and h-full, padding */}
        {children}
        {/* Quick Add Button is positioned relative to this inner div */}
         {showQuickAdd && onQuickAdd && !isDisabled && (
            <button
              onClick={handleQuickAddClick}
              aria-label={quickAddLabel || 'Quick Add'}
              className="absolute top-2 right-2 z-10 p-1 bg-[#A78B71]/70 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-[#A78B71]"
              tabIndex={-1}
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
        onClick={onClick}
        className={`${cardClasses} focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1`}
        {...rest}
      >
        <CardContent />
      </Link>
    );
  }

  return (
    <div
        onClick={isDisabled ? undefined : onClick}
        className={`${cardClasses} ${!isDisabled && onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1' : ''}`}
        {...rest}
    >
      <CardContent />
    </div>
  );
};

export default BaseCard;