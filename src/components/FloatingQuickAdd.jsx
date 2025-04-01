// src/components/FloatingQuickAdd.jsx
import React from 'react';
import { Plus } from 'lucide-react';
import { useQuickAdd } from '../context/QuickAddContext';

const FloatingQuickAdd = () => {
  const { openQuickAdd } = useQuickAdd();
  
  const handleClick = () => {
    // Open the quick add popup without an item (to create a new list)
    openQuickAdd();
  };
  
  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-10"
      aria-label="Create new list"
    >
      <Plus size={24} />
    </button>
  );
};

export default FloatingQuickAdd;