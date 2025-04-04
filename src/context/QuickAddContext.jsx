// src/context/QuickAddContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from "react"; // Added useCallback, useMemo

const QuickAddContext = createContext();

export const QuickAddProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // *** ADDED LOG: Log when the Provider renders ***
  console.log(`[QuickAddProvider Render] Current state - isOpen: ${isOpen}, selectedItem:`, selectedItem);

  const openQuickAdd = useCallback((item) => {
    console.log("[QuickAddContext] openQuickAdd function entered. Item:", item);
    setSelectedItem(item);
    setIsOpen(true); // Set open *after* setting item
    console.log("[QuickAddContext] openQuickAdd function: Set isOpen=true, selectedItem=", item);
  }, []); // useCallback ensures stable function reference if needed

  const closeQuickAdd = useCallback(() => {
    // *** ADDED LOG: Log when closeQuickAdd is CALLED ***
    console.log("[QuickAddContext] closeQuickAdd function CALLED.");
    setIsOpen(false);
    setSelectedItem(null);
    console.log("[QuickAddContext] closeQuickAdd function: Set isOpen=false, selectedItem=null");
    // *** END LOG ***
  }, []); // useCallback ensures stable function reference

  // Use useMemo to stabilize the context value object if children re-render often
  const contextValue = useMemo(() => ({
    isOpen,
    item: selectedItem,
    openQuickAdd,
    closeQuickAdd
  }), [isOpen, selectedItem, openQuickAdd, closeQuickAdd]);

  return (
    // Pass the memoized value
    <QuickAddContext.Provider value={contextValue}>
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