// src/components/UI/PillButton.jsx
import React from 'react';

// Enhanced PillButton for better active/inactive states
const PillButton = ({ label, isActive, onClick, className = "", prefix = '', ...props }) => {
  const baseStyles = "px-3 py-1 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1";
  const activeStyles = "bg-[#D1B399] text-white border-[#D1B399] focus:ring-[#A78B71]";
  const inactiveStyles = "bg-white text-gray-600 border-gray-300 hover:border-[#D1B399] hover:text-[#A78B71] focus:ring-[#D1B399]";

  const combinedStyles = `${baseStyles} ${isActive ? activeStyles : inactiveStyles} ${className}`;

  return (
    <button onClick={onClick} className={combinedStyles} aria-pressed={isActive} {...props}>
      {prefix}{label}
    </button>
  );
};

export default PillButton;