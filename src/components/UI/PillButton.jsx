// src/components/UI/PillButton.jsx
import React from 'react';

// Enhanced PillButton for better active/inactive states & compactness
const PillButton = ({ label, isActive, onClick, className = "", prefix = '', ...props }) => {
  const baseStyles = "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1"; // Reduced padding, added focus ring offset
  const activeStyles = "bg-[#A78B71] text-white border-[#A78B71] focus:ring-[#A78B71]"; // Keep active style distinct
  const inactiveStyles = "bg-white text-gray-700 border-gray-300 hover:border-[#A78B71] hover:text-[#A78B71] focus:ring-[#A78B71]";

  const combinedStyles = `${baseStyles} ${isActive ? activeStyles : inactiveStyles} ${className}`;

  return (
    <button onClick={onClick} className={combinedStyles} aria-pressed={isActive} {...props}>
      {prefix}{label}
    </button>
  );
};

export default PillButton;