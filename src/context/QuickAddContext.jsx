// src/context/QuickAddContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useUserListStore from '@/stores/useUserListStore';
import useAuthStore from '@/stores/useAuthStore';
import { listService } from '@/services/listService';

const QuickAddContext = createContext();

// Define a query function for fetching user lists
const fetchUserLists = async () => {
  try {
    return await listService.getLists({ createdByUser: true });
  } catch (error) {
    console.error('[QuickAddContext] Error fetching user lists:', error);
    return [];
  }
};

export const QuickAddProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Auth state as a primitive value
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Use React Query to fetch user lists instead of accessing the store
  const { 
    data: userLists = [], 
    refetch,
    isLoading: isLoadingUserLists
  } = useQuery({
    queryKey: ['userLists', 'created'],
    queryFn: fetchUserLists,
    enabled: false, // Don't fetch automatically - we'll manually trigger
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const openQuickAdd = useCallback(
    (item) => {
      setSelectedItem(item);
      setIsOpen(true);

      const isCreateMode = !!(item?.createNew && item?.type === 'list');
      // Fetch lists only if authenticated, not creating, and lists aren't loaded yet
      if (isAuthenticated && !isCreateMode && userLists.length === 0 && !isLoadingUserLists) {
        refetch().catch((err) => {
          console.error('[QuickAddContext openQuickAdd] Error fetching lists:', err.message || err);
        });
      }
    },
    [refetch, isAuthenticated, userLists.length, isLoadingUserLists]
  );

  const closeQuickAdd = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  // Memoize context value
  const contextValue = useMemo(
    () => ({
      isOpen,
      item: selectedItem,
      openQuickAdd,
      closeQuickAdd,
    }),
    [isOpen, selectedItem, openQuickAdd, closeQuickAdd]
  );

  return <QuickAddContext.Provider value={contextValue}>{children}</QuickAddContext.Provider>;
};

// Custom hook to use the context
export const useQuickAdd = () => {
  const context = useContext(QuickAddContext);
  if (context === undefined) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
};

// No default export to encourage named imports