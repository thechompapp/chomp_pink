// src/components/UI/CardRow.jsx
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CardRow = ({ title, items, isExpanded, setIsExpanded, renderCard }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 bg-gray-100 text-gray-700 rounded-full"
          aria-label={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      {items.length > 0 ? (
        <div className={`flex ${isExpanded ? 'flex-col md:grid md:grid-cols-3 md:gap-4' : 'flex-row overflow-x-auto scrollbar-hidden space-x-4 md:justify-start justify-center'}`}>
          {items.map((item) => (
            <div key={item.id} className={`${isExpanded ? 'w-full' : 'min-w-[280px]'}`}>
              {renderCard(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No {title.toLowerCase()} match your filters</p>
      )}
    </div>
  );
};

export default CardRow;