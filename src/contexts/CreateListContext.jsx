import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import CreateListModal from '@/components/UI/CreateListModal';
import { logDebug } from '@/utils/logger';

const CreateListContext = createContext();

/**
 * CreateListProvider Component
 * 
 * Provides global state management for the Create List modal
 */
export const CreateListProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open the create list modal
  const openCreateListModal = useCallback(() => {
    logDebug('[CreateListContext] Opening create list modal');
    setIsModalOpen(true);
  }, []);

  // Close the create list modal
  const closeCreateListModal = useCallback(() => {
    logDebug('[CreateListContext] Closing create list modal');
    setIsModalOpen(false);
  }, []);

  // Handle successful list creation
  const handleListCreated = useCallback((newList) => {
    logDebug('[CreateListContext] List created successfully:', newList);
    // Modal will auto-close and navigate, context just tracks the success
  }, []);

  const contextValue = {
    isModalOpen,
    openCreateListModal,
    closeCreateListModal,
    handleListCreated
  };

  return (
    <CreateListContext.Provider value={contextValue}>
      {children}
      
      {/* Global Create List Modal */}
      <CreateListModal
        isOpen={isModalOpen}
        onClose={closeCreateListModal}
        onListCreated={handleListCreated}
      />
    </CreateListContext.Provider>
  );
};

CreateListProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to use Create List context
 */
export const useCreateList = () => {
  const context = useContext(CreateListContext);
  
  if (!context) {
    console.error('useCreateList must be used within a CreateListProvider');
    // Return a safe fallback object instead of throwing
    return {
      isModalOpen: false,
      openCreateListModal: () => console.warn('CreateList unavailable - provider missing'),
      closeCreateListModal: () => console.warn('CreateList unavailable - provider missing'),
      handleListCreated: () => console.warn('CreateList unavailable - provider missing'),
    };
  }
  
  return context;
}; 