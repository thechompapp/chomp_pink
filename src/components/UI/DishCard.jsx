// src/components/UI/DishCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Plus } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';

// **Accept 'restaurant' prop (which should contain the name)**
const DishCard = React.memo(({ id, name, restaurant, tags = [] }) => {
  const { openQuickAdd } = useQuickAdd();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    // **Pass the received 'restaurant' prop**
    console.log(`DishCard: handleQuickAdd called: id=${id}, restaurant=${restaurant}`);
    openQuickAdd({ id, name, restaurant: restaurant, tags, type: 'dish' });
  };

   const cleanName = name || "Unnamed Dish";
   // Use the passed restaurant name prop
   const cleanRestaurant = restaurant || "Unknown Restaurant";

  return (
     // Styling remains the same
     <div className="group relative flex flex-col w-full h-56 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
        <button onClick={handleQuickAdd} className="absolute top-2 right-2 z-10 w-8 h-8 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#b89e89] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#D1B399]" aria-label="Add dish to list">
          <Plus size={20} />
        </button>
       <Link to={`/dish/${id}`} className="flex flex-col flex-grow p-4 text-left">
         <div className="flex-grow mb-2">
           <h3 className="text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-[#A78B71] transition-colors">{cleanName}</h3>
           <div className="flex items-center text-gray-500 text-xs mb-1.5">
             <Utensils size={12} className="mr-1 flex-shrink-0" />
             {/* Display the restaurant name from props */}
             <span className="truncate">at {cleanRestaurant}</span>
           </div>
            <div className="h-4"></div>
         </div>
         <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-100">
           {tags.slice(0, 2).map((tag) => ( <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap">#{tag}</span> ))}
            {tags.length > 2 && ( <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">+{tags.length - 2} more</span> )}
         </div>
       </Link>
    </div>
  );
});

export default DishCard;