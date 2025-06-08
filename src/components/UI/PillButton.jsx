/* src/components/UI/PillButton.jsx */
/* Use theme colors for modern look */
import React from 'react';
import { cn } from "@/lib/utils"; // Ensure this import is present

const PillButton = ({ label, isActive, onClick, prefix, className }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium focus:outline-none disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors";

  const themeClasses = isActive
    ? "bg-white text-black border-gray-400 shadow-md" // Active state with darker border and shadow
    : "bg-white text-black border-gray-300 hover:bg-gray-50 hover:border-gray-400"; // Inactive state with standard styling

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(baseClasses, themeClasses, className)} // Use cn to merge classes
      aria-pressed={isActive}
    >
      {prefix && <span className="mr-1 opacity-80">{prefix}</span>}
      {label}
    </button>
  );
};

export default PillButton;