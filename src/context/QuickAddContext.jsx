import React, { createContext, useContext, useState, useCallback } from "react";

const QuickAddContext = createContext();

export const QuickAddProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openQuickAdd = useCallback((item) => {
    console.log("QuickAddContext: openQuickAdd called with item:", item);
    setIsOpen(true);
    setSelectedItem(item);
    console.log("QuickAddContext: isOpen set to true, selectedItem:", item);
  }, []);

  const closeQuickAdd = useCallback(() => {
    console.log("QuickAddContext: closeQuickAdd called");
    setIsOpen(false);
    setSelectedItem(null);
    console.log("QuickAddContext: isOpen set to false, selectedItem cleared");
  }, []);

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