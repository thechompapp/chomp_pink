import React from "react";
import { Plus } from "lucide-react";
import { useQuickAdd } from "@/context/QuickAddContext";

const FloatingQuickAdd = () => {
  const { openQuickAdd } = useQuickAdd();

  const handleClick = () => {
    console.log("FloatingQuickAdd: Button clicked, calling openQuickAdd");
    openQuickAdd({ type: "submission" });
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-dark"
      aria-label="Add new restaurant or dish"
    >
      <Plus size={24} />
    </button>
  );
};

export default FloatingQuickAdd;