// src/components/UI/BaseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';

const BaseCard = ({
  linkTo,
  onQuickAdd,
  quickAddLabel,
  children,
  className = '',
  isHighlighted = false,
  isDisabled = false,
  showQuickAdd = true
}) => {
  const cardClasses = `
    relative group overflow-hidden rounded-lg border 
    ${isHighlighted ? 'border-[#A78B71]' : 'border-gray-200'} 
    bg-white p-3 transition-all duration-200 
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md'} 
    ${className}
  `;

  const CardContent = () => (
    <div className="flex flex-col h-full relative">
      {children}
      
      {showQuickAdd && onQuickAdd && !isDisabled && (
        <button
          onClick={onQuickAdd}
          aria-label={quickAddLabel || "Quick Add"}
          className="absolute top-0 right-0 p-1.5 bg-[#A78B71] text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <PlusIcon size={16} />
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