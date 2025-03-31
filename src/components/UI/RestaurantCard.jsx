import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Plus } from "lucide-react";
import { useQuickAdd } from "@/context/QuickAddContext";
import Button from "@/components/Button";

const RestaurantCard = React.memo(
  ({ id = 1, name, neighborhood, city, tags, adds = Math.floor(Math.random() * 900) + 100 }) => {
    const { openQuickAdd } = useQuickAdd();

    const handleQuickAdd = () => {
      console.log("RestaurantCard: handleQuickAdd called: id=", id);
      openQuickAdd({ id, name, neighborhood, city, tags, type: "restaurant" });
    };

    // Remove street address from name if present (e.g., "Rosa Mexicano, East 18th" -> "Rosa Mexicano")
    const cleanName = name.split(',')[0].trim();

    return (
      <div className="w-72 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md relative">
        <button
          onClick={handleQuickAdd}
          className="absolute top-3 right-3 w-10 h-10 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow hover:bg-[#b89e89]"
          aria-label="Add to list"
        >
          <Plus size={24} />
        </button>

        <div className="flex flex-col h-full">
          <div className="flex-1">
            <Link to={`/restaurant/${id}`} className="block">
              <h3 className="text-lg font-bold text-gray-900 mb-2 truncate hover:text-[#D1B399]">{cleanName}</h3>
            </Link>

            <div className="flex items-start text-gray-500 text-sm mb-2">
              <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
              <span className="truncate">
                {neighborhood ? `${neighborhood}, ${city}` : city}
              </span>
            </div>

            <div className="flex items-center text-gray-500 text-sm mb-3">
              <Users size={14} className="mr-1" />
              <span>{adds.toLocaleString()} adds</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {(tags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="tertiary"
              className="w-full border-[#D1B399] text-[#D1B399] hover:bg-[#D1B399] hover:text-white"
            >
              <Link to={`/restaurant/${id}`}>View</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

export default RestaurantCard;