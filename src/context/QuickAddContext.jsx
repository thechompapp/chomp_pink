// src/context/QuickAddContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import useUserListStore from '../stores/useUserListStore'; // Import user list store
import useAuthStore from '../stores/useAuthStore'; // Import auth store

const QuickAddContext = createContext();

export const QuickAddProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Get necessary functions/state from stores
  const fetchUserLists = useUserListStore((state) => state.fetchUserLists);
  const isLoadingUser = useUserListStore((state) => state.isLoadingUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userLists = useUserListStore((state) => state.userLists); // Get lists to check if fetch needed

  const openQuickAdd = useCallback((item) => {
    console.log("[QuickAddContext] openQuickAdd called. Item:", item);
    setSelectedItem(item);
    setIsOpen(true);

    // --- Trigger fetch from here ---
    const isCreateMode = !!(item?.createNew && item?.type === 'list');
    // Fetch only if: authenticated, not create mode, not already loading, and maybe lists are empty
    if (isAuthenticated && !isCreateMode && !isLoadingUser && userLists.length === 0) {
      console.log("[QuickAddContext openQuickAdd] Triggering fetchUserLists...");
      fetchUserLists().catch(err => {
          console.error("[QuickAddContext openQuickAdd] Error fetching lists:", err);
          // Error is handled in the store
      });
    } else {
        console.log(`[QuickAddContext openQuickAdd] Not triggering fetch. Auth=${isAuthenticated}, CreateMode=${isCreateMode}, Loading=${isLoadingUser}, ListsPresent=${userLists.length > 0}`);
    }
    // -----------------------------

  }, [fetchUserLists, isLoadingUser, isAuthenticated, userLists]); // Add dependencies

  const closeQuickAdd = useCallback(() => {
    console.log("[QuickAddContext] closeQuickAdd called.");
    setIsOpen(false);
    setSelectedItem(null);
  }, []);

  const contextValue = useMemo(() => ({
    isOpen,
    item: selectedItem,
    openQuickAdd,
    closeQuickAdd
  }), [isOpen, selectedItem, openQuickAdd, closeQuickAdd]);

  return (
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