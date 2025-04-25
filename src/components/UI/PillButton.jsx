/* src/components/UI/PillButton.jsx */
/* Use theme colors for modern look */
import React from 'react';
import { cn } from "@/lib/utils"; // Ensure this import is present

const PillButton = ({ label, isActive, onClick, prefix, className }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const themeClasses = isActive
    ? "bg-primary text-primary-foreground border-transparent hover:bg-primary/80" // Active state using primary color
    : "bg-secondary text-secondary-foreground border-border hover:bg-muted hover:text-muted-foreground"; // Inactive state using secondary/muted

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