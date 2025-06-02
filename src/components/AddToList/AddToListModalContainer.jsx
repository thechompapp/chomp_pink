// src/components/AddToList/AddToListModalContainer.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug } from '@/utils/logger';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import LoginPromptDialog from '@/components/UI/LoginPromptDialog';
import ListSelector from './ListSelector';
import NewListForm from './NewListForm';
import ItemDetailsForm from './ItemDetailsForm';
import ConfirmationScreen from './ConfirmationScreen';

// Constants
const STEPS = {
  SELECT_LIST: 1,
  CONFIRMATION: 2
};

/**
 * AddToListModalContainer Component
 * 
 * Orchestrates the components for adding items to lists
 */
const AddToListModalContainer = ({ isOpen, onClose, itemToAdd, onItemAdded }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListId, setSelectedListId] = useState(null);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [step, setStep] = useState(STEPS.SELECT_LIST);
  const [error, setError] = useState(null);
  const [selectedList, setSelectedList] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all state variables to initial values
      setSearchTerm('');
      setSelectedListId(null);
      setSelectedList(null);
      setShowNewListForm(false);
      setStep(STEPS.SELECT_LIST);
      setError(null);
      logDebug("[AddToListModalContainer] Modal opened and state reset.");
    }
  }, [isOpen]);

  // Determine modal title based on current step and context
  const modalTitle = useMemo(() => {
    if (step === STEPS.SELECT_LIST) {
      if (itemToAdd) {
        const itemName = itemToAdd.name || '';
        return `Add "${itemName.substring(0,30)}${itemName.length > 30 ? '...' : ''}" to a List`;
      }
      return "Select or Create List";
    }
    return "Action Complete";
  }, [step, itemToAdd]);

  /**
   * Handle list selection
   */
  const handleListSelect = (listId, listData) => {
    setSelectedListId(listId);
    if (listData) {
      setSelectedList(listData);
    }
    setError(null);
  };

  /**
   * Handle new list creation button click
   */
  const handleCreateNewClick = () => {
    setShowNewListForm(true);
    setError(null);
  };

  /**
   * Handle cancel new list creation
   */
  const handleCancelNewList = () => {
    setShowNewListForm(false);
    setError(null);
  };

  /**
   * Handle list created callback
   */
  const handleListCreated = (newList, autoSelect = true) => {
    if (autoSelect) {
      setSelectedListId(newList.id);
      setSelectedList(newList);
    }
    setShowNewListForm(false);
    setError(null);
    
    // If there's an item to add and autoSelect is true, proceed to add the item
    if (itemToAdd && autoSelect) {
      // The ItemDetailsForm will handle the actual addition
      // We just need to make sure the list is selected
    } else if (!itemToAdd) {
      // If no item to add, go to confirmation step
      setStep(STEPS.CONFIRMATION);
    }
  };

  /**
   * Handle item added callback
   */
  const handleItemAdded = (listId, listItemId) => {
    setStep(STEPS.CONFIRMATION);
    
    // Call the callback if provided
    if (onItemAdded) {
      onItemAdded(listId, listItemId);
    }
  };

  // Early return if modal is not open
  if (!isOpen) return null; 

  // Show login prompt immediately if not authenticated and not loading
  if (!authLoading && !isAuthenticated) {
    return (
      <LoginPromptDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Login Required"
        message="You need to be logged in to add items to your lists or create new lists."
        actionContext="add items to lists"
      />
    );
  }

  // Show loading state only briefly while checking authentication
  if (authLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading...">
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle}
      size={step === STEPS.SELECT_LIST ? "lg" : "md"}
    >
      <div className="p-1 sm:p-2"> 
        {/* Step 1: List Selection/Creation */}
        {step === STEPS.SELECT_LIST && (
          <>
            {/* Error message display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm">
                <AlertCircle size={16} className="inline-block mr-2" aria-hidden="true" />
                {error}
              </div>
            )}
            
            {/* Show list selector or new list form */}
            {!showNewListForm ? (
              <ListSelector 
                userId={user?.id}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedListId={selectedListId}
                onListSelect={handleListSelect}
                onCreateNewClick={handleCreateNewClick}
                isAuthenticated={isAuthenticated}
              />
            ) : (
              <NewListForm 
                userId={user?.id}
                onListCreated={handleListCreated}
                onCancel={handleCancelNewList}
                itemType={itemToAdd?.type}
              />
            )}
            
            {/* Item details form when a list is selected */}
            {selectedListId && !showNewListForm && itemToAdd && (
              <ItemDetailsForm 
                listId={selectedListId}
                listName={selectedList?.name}
                item={itemToAdd}
                onItemAdded={handleItemAdded}
                userId={user?.id}
                error={error}
                setError={setError}
              />
            )}
            
            {/* Selected list confirmation (when no item to add) */}
            {!itemToAdd && selectedListId && !showNewListForm && (
              <div className="text-sm text-green-600 dark:text-green-400 mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-md flex items-center" role="status">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                List "{selectedList?.name}" selected.
              </div>
            )}
          </>
        )}
        
        {/* Step 2: Confirmation */}
        {step === STEPS.CONFIRMATION && (
          <ConfirmationScreen 
            item={itemToAdd}
            selectedList={selectedList}
            onClose={onClose}
            onViewList={(listId) => {
              onClose();
              // Navigation would be handled by the parent component
            }}
          />
        )}
      </div>
    </Modal>
  );
};

AddToListModalContainer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
  onItemAdded: PropTypes.func,
};

export default AddToListModalContainer;
