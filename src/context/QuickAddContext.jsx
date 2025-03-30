import React, { createContext, useContext, useState } from "react";

const QuickAddContext = createContext();

export const QuickAddProvider = ({ children }) => {
  const [quickAdd, setQuickAdd] = useState({ isOpen: false, selectedItem: null });

  const openQuickAdd = (item) => {
    console.log("QuickAddContext: openQuickAdd called: item=", item);
    setQuickAdd({ isOpen: true, selectedItem: item });
  };

  const closeQuickAdd = () => {
    console.log("QuickAddContext: closeQuickAdd called");
    setQuickAdd({ isOpen: false, selectedItem: null });
  };

  return (
    <QuickAddContext.Provider value={{ quickAdd, openQuickAdd, closeQuickAdd }}>
      {children}
    </QuickAddContext.Provider>
  );
};

export const useQuickAdd = () => useContext(QuickAddContext);