/* src/components/UI/PillButton.jsx */
/* Use theme colors for modern look */
import React from 'react';
import { cn } from "@/lib/utils"; // Ensure this import is present

const PillButton = ({ label, isActive, onClick, prefix, className }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

  const themeClasses = isActive
    ? "bg-black text-white border-black" // Active state using black/white
    : "bg-white text-black border-black"; // Inactive state with black border

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