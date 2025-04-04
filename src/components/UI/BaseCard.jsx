// src/components/UI/BaseCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

/**
 * BaseCard component providing common structure for item cards.
 * Includes container styling, Quick Add button, and main link area.
 * Specific content is passed via children.
 */
const BaseCard = React.memo(({
  linkTo,         // URL for the main link
  onQuickAdd,     // Function to call for the Quick Add button
  quickAddLabel,  // Aria-label for the Quick Add button
  children        // Content specific to the card type (e.g., title, details, tags)
}) => {
  return (
    <div className="group relative flex flex-col w-full h-56 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Quick Add Button */}
      {onQuickAdd && ( // Only render if handler is provided
        <button
          onClick={onQuickAdd}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#b89e89] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399]"
          aria-label={quickAddLabel || "Add item to list"}
        >
          <Plus size={20} />
        </button>
      )}

      {/* Card Content Link Area */}
      <Link to={linkTo || '#'} className="flex flex-col flex-grow p-4 text-left">
        {children} {/* Specific card content goes here */}
      </Link>
    </div>
  );
});

export default BaseCard;