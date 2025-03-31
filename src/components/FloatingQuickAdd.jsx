import React, { useState } from "react";
import { Plus, Utensils, List, Store } from "lucide-react";
import { useQuickAdd } from "@/context/QuickAddContext";

const FloatingQuickAdd = () => {
  const { openQuickAdd } = useQuickAdd();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    console.log("Toggling FloatingQuickAdd menu");
    setIsMenuOpen((prev) => !prev);
  };

  const handleSubmitRestaurant = () => {
    openQuickAdd({ type: "submission", subtype: "restaurant" });
    setIsMenuOpen(false);
  };

  const handleSubmitDish = () => {
    openQuickAdd({ type: "submission", subtype: "dish" });
    setIsMenuOpen(false);
  };

  const handleCreateList = () => {
    openQuickAdd({ type: "createNewList" });
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleToggleMenu}
        className="w-14 h-14 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] focus:outline-none"
        aria-label="Add new item or list"
      >
        <Plus size={24} />
      </button>

      {isMenuOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col items-end space-y-2 z-50">
          <button
            onClick={handleSubmitRestaurant}
            className="w-12 h-12 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] focus:outline-none"
            aria-label="Submit a restaurant"
          >
            <Store size={20} />
          </button>
          <button
            onClick={handleSubmitDish}
            className="w-12 h-12 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] focus:outline-none"
            aria-label="Submit a dish"
          >
            <Utensils size={20} />
          </button>
          <button
            onClick={handleCreateList}
            className="w-12 h-12 bg-[#D1B399] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b89e89] focus:outline-none"
            aria-label="Create a list"
          >
            <List size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FloatingQuickAdd;