// src/components/UI/DishCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Utensils, Users, Plus } from "lucide-react";
import { useQuickAdd } from "@/context/QuickAddContext";
import Button from "@/components/Button";

const DishCard = React.memo(
  ({ id = 1, name, restaurant, restaurantId, tags, price = "$$ • ", adds = Math.floor(Math.random() * 700) + 50 }) => {
    const { openQuickAdd } = useQuickAdd();

    const handleQuickAdd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("DishCard: handleQuickAdd called: id=", id);
      openQuickAdd({ id, name, restaurant, tags, type: "dish" });
    };

    return (
      // Apply w-72 and h-full for consistency
      <div className="w-72 h-full bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md relative flex flex-col">
         <button
           onClick={handleQuickAdd}
           className="absolute top-3 right-3 z-10 w-8 h-8 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow hover:bg-[#b89e89] transition-colors duration-150"
           aria-label="Add to list"
         >
           <Plus size={20} />
         </button>

         <div className="flex flex-col flex-grow"> {/* Use flex-grow on inner container */}
           <div className="flex-grow mb-4"> {/* Content pushes button down */}
             <Link to={`/dish/${id}`} className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D1B399] rounded-md">
               <h3 className="text-lg font-bold text-gray-900 mb-1 pr-8 truncate hover:text-[#D1B399]">{name}</h3>
             </Link>
             <div className="flex items-start text-gray-500 text-sm mb-1">
               <Utensils size={14} className="mr-1.5 mt-0.5 flex-shrink-0" />
               <span className="truncate"> {price}at <Link to={`/restaurant/${restaurantId || '#'}`} className="hover:text-[#D1B399] hover:underline">{restaurant}</Link> </span>
             </div>
             <div className="flex items-center text-gray-500 text-sm mb-3">
               <Users size={14} className="mr-1.5" />
               <span>{adds.toLocaleString()} adds</span>
             </div>
             <div className="flex flex-wrap gap-1">
               {(tags || []).slice(0, 3).map((tag) => ( <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"> #{tag} </span> ))}
               {(tags || []).length > 3 && ( <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">...</span> )}
             </div>
           </div>
           <div className="mt-auto"> {/* Button aligned to bottom */}
             <Link to={`/dish/${id}`} className="block w-full">
                <Button variant="tertiary" size="sm" className="w-full border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399] hover:text-white" tabIndex={-1} > View </Button>
              </Link>
           </div>
         </div>
      </div>
    );
  }
);

export default DishCard;