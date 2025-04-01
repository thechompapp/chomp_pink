// src/context/QuickAddContext.jsx
import React, { createContext, useState, useContext } from 'react';

// Create Context
export const QuickAddContext = createContext();

// Custom hook for using the QuickAdd context
export const useQuickAdd = () => {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
};

// Provider Component
export const QuickAddProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [item, setItem] = useState(null);

  const openQuickAdd = (itemData = null) => {
    setItem(itemData);
    setIsOpen(true);
  };

  const closeQuickAdd = () => {
    setIsOpen(false);
    // Clear item after animation would complete
    setTimeout(() => {
      setItem(null);
    }, 300);
  };

  return (
    <QuickAddContext.Provider
      value={{
        isOpen,
        item,
        openQuickAdd,
        closeQuickAdd
      }}
    >
      {children}
    </QuickAddContext.Provider>
  );
};