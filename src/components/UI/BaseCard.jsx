/* src/components/UI/BaseCard.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const BaseCard = ({
  linkTo,
  onQuickAdd,
  quickAddLabel,
  children, // Children are now the direct content (e.g., flex-grow div, flex-shrink-0 div)
  className = '',
  isHighlighted = false,
  isDisabled = false,
  showQuickAdd = true,
  onClick,
  ...rest
}) => {
  // BaseCard is now the flex container with fixed height and padding
  const cardClasses = `
    relative group block overflow-hidden rounded-lg border
    ${isHighlighted ? 'border-[#A78B71] ring-1 ring-[#A78B71]' : 'border-gray-200 hover:border-gray-300'}
    bg-white transition-all duration-200
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}
    w-full h-56 // Fixed height
    flex flex-col // Make the card itself the column flex container
    p-3 // Apply padding directly here
    ${className}
  `;

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onQuickAdd) onQuickAdd(e);
  };

  // Quick Add button remains positioned absolutely within the card
  const QuickAddButton = () => (
    showQuickAdd && onQuickAdd && !isDisabled && (
      <button
        onClick={handleQuickAddClick}
        aria-label={quickAddLabel || 'Quick Add'}
        className="absolute top-2 right-2 z-10 p-1 bg-[#A78B71]/70 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-[#A78B71]"
        tabIndex={-1}
      >
        <Plus size={14} />
      </button>
    )
  );

  // Render as Link or Div
  if (!isDisabled && linkTo) {
    return (
      <Link
        to={linkTo}
        onClick={onClick}
        className={`${cardClasses} focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1`}
        {...rest}
      >
        {children} {/* Render content directly */}
        <QuickAddButton />
      </Link>
    );
  }

  return (
    <div
      onClick={isDisabled ? undefined : onClick}
      className={`${cardClasses} ${!isDisabled && onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1' : ''}`}
      {...rest}
    >
      {children} {/* Render content directly */}
      <QuickAddButton />
    </div>
  );
};

export default BaseCard;