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
  aspectRatioClass = 'aspect-w-1 aspect-h-1',
}) => {
  const cardClasses = `
    relative group block overflow-hidden rounded-lg border
    ${isHighlighted ? 'border-[#A78B71] ring-1 ring-[#A78B71]' : 'border-gray-200 hover:border-gray-300'}
    bg-white transition-all duration-200
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'}
    w-full h-64
    ${aspectRatioClass}
    ${className}
  `;

  const handleQuickAddClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onQuickAdd) onQuickAdd(e);
  };

  const CardContent = () => (
    <div className="flex flex-col h-full p-3 focus-within:ring-2 focus-within:ring-[#D1B399] focus-within:ring-offset-1 rounded-lg">
      {children}
      {showQuickAdd && onQuickAdd && !isDisabled && (
        <button
          onClick={handleQuickAddClick}
          aria-label={quickAddLabel || 'Quick Add'}
          className="absolute top-1 right-1 z-10 p-1 bg-[#A78B71]/80 text-white rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity duration-150 hover:bg-[#A78B71]"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );

  if (isDisabled || !linkTo) {
    return <div className={cardClasses}><CardContent /></div>;
  }

  return (
    <Link to={linkTo} className={cardClasses}>
      <CardContent />
    </Link>
  );
};

export default BaseCard;