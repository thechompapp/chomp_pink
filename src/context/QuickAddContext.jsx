// src/context/QuickAddContext.jsx
import React, { createContext, useContext, useState } from "react";

const QuickAddContext = createContext();

export const QuickAddProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openQuickAdd = (item) => {
    console.log("QuickAddContext: Opening QuickAddPopup with item:", item);
    console.log("QuickAddContext: item:", item); // Inspect the 'item'
    setSelectedItem(item);
    setIsOpen(true);
  };

  const closeQuickAdd = () => {
    console.log("QuickAddContext: Closing QuickAddPopup");
    setIsOpen(false);
    setSelectedItem(null);
  };

  return (
    <QuickAddContext.Provider value={{ isOpen, selectedItem, openQuickAdd, closeQuickAdd }}>
      {children}
    </QuickAddContext.Provider>
  );
};

export const useQuickAdd = () => {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error("useQuickAdd must be used within a QuickAddProvider");
  }
  return context;
};