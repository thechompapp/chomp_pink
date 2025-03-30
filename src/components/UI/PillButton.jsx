// src/components/UI/PillButton.jsx
import React from 'react';

const PillButton = ({ label, isActive, onClick, prefix = '' }) => {
  const pillButtonClass = `px-3 py-1 rounded-full text-sm font-medium ${
    isActive
      ? 'bg-[#D1B399] text-white border-[#D1B399]'
      : 'bg-gray-100 text-gray-700 border-gray-300'
  }`;

  return (
    <button onClick={onClick} className={pillButtonClass} aria-pressed={isActive}>
      {prefix}{label}
    </button>
  );
};

export default PillButton;