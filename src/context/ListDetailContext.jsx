// src/context/ListDetailContext.jsx
import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import FixedListDetailModal from '@/components/FixedListDetailModal';
import { logDebug } from '@/utils/logger';

// Create context
const ListDetailContext = createContext(null);

// Create provider component
export function ListDetailProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [listId, setListId] = useState(null);

  const openListDetail = (id) => {
    if (!id) {
      console.error('[ListDetailContext] Cannot open list detail without an ID');
      return;
    }
    
    console.log(`[ListDetailContext] Opening list detail modal for list ID: ${id}`);
    setListId(id);
    setIsOpen(true);
  };

  const closeListDetail = () => {
    setIsOpen(false);
    // Don't clear listId immediately to prevent UI flashing during close animation
    setTimeout(() => {
      setListId(null);
    }, 300);
    logDebug('[ListDetailContext] Closing list detail');
  };

  return (
    <ListDetailContext.Provider value={{ openListDetail, closeListDetail }}>
      {children}
      <FixedListDetailModal
        listId={listId}
        isOpen={isOpen}
        onClose={closeListDetail}
      />
    </ListDetailContext.Provider>
  );
}

// Custom hook for using the context
export const useListDetail = () => {
  const context = useContext(ListDetailContext);
  if (!context) {
    throw new Error('useListDetail must be used within a ListDetailProvider');
  }
  return context;
};

ListDetailProvider.propTypes = {
  children: PropTypes.node.isRequired
};
