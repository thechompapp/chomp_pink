/**
 * Add To List Modal Component
 * 
 * A modal for adding items to lists with a multi-step process:
 * 1. Select or create a list
 * 2. Add item details
 * 3. Show confirmation
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { listService } from '@/services/list';
import useAuthStore from '@/stores/useAuthStore';
import { logDebug, logError } from '@/utils/logger';
import { logEngagement } from '@/utils/logEngagement';
import Modal from '@/components/common/modals/Modal';

// Import subcomponents
import ListSelector from './ListSelector';
import NewListForm from './NewListForm';
import ItemDetailsForm from './ItemDetailsForm';
import ConfirmationScreen from './ConfirmationScreen';

// Constants
const QUERY_KEYS = {
  USER_LISTS: 'userLists',
  LIST_DETAILS: 'listDetails',
  LIST_ITEMS: 'listItems',
  LIST_PREVIEW_ITEMS: 'listPreviewItems',
  SEARCH_RESULTS: 'searchResults',
  HOME_FEED: 'homeFeed',
  RESULTS: 'results'
};

// Steps in the add to list flow
const STEPS = {
  SELECT_LIST: 1,
  ADD_DETAILS: 2,
  CONFIRMATION: 3
};

/**
 * Add To List Modal Component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function called when the modal is closed
 * @param {Object} props.itemToAdd - Item data being added to a list
 * @param {Function} props.onItemAdded - Function called when an item is successfully added
 * @returns {React.ReactNode}
 */
const AddToListModal = ({
  isOpen,
  onClose,
  itemToAdd,
  onItemAdded
}) => {
  // Get authentication state
  const { user, isAuthenticated } = useAuthStore();
  
  // React Query client
  const queryClient = useQueryClient();
  
  // State management
  const [step, setStep] = useState(STEPS.SELECT_LIST);
  const [selectedList, setSelectedList] = useState(null);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [error, setError] = useState(null);
  const [itemDetails, setItemDetails] = useState({
    notes: '',
    rating: null
  });
  
  // Reset state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setStep(STEPS.SELECT_LIST);
      setSelectedList(null);
      setShowNewListForm(false);
      setError(null);
      setItemDetails({
        notes: '',
        rating: null
      });
    }
  }, [isOpen]);
  
  // Determine item type
  const getItemType = () => {
    if (!itemToAdd) return 'custom';
    
    if (itemToAdd.type === 'restaurant' || itemToAdd.restaurant_id) {
      return 'restaurant';
    }
    
    if (itemToAdd.type === 'dish' || itemToAdd.dish_id) {
      return 'dish';
    }
    
    return 'custom';
  };
  
  // Add item to list mutation
  const addItemMutation = useMutation(
    (data) => {
      const { listId, itemData } = data;
      
      // Determine which service method to call based on item type
      const itemType = getItemType();
      
      if (itemType === 'restaurant') {
        return listService.addItemToList(listId, {
          ...itemData,
          type: 'restaurant',
          restaurant_id: itemToAdd.id || itemToAdd.restaurant_id
        });
      }
      
      if (itemType === 'dish') {
        return listService.addItemToList(listId, {
          ...itemData,
          type: 'dish',
          dish_id: itemToAdd.id || itemToAdd.dish_id
        });
      }
      
      // Custom item
      return listService.addItemToList(listId, {
        ...itemData,
        type: 'custom',
        name: itemToAdd.name,
        description: itemToAdd.description
      });
    },
    {
      onSuccess: (data) => {
        logDebug('[AddToListModal] Item added successfully:', data);
        
        // Invalidate relevant queries
        queryClient.invalidateQueries([QUERY_KEYS.LIST_ITEMS, selectedList.id]);
        queryClient.invalidateQueries([QUERY_KEYS.LIST_DETAILS, selectedList.id]);
        queryClient.invalidateQueries([QUERY_KEYS.USER_LISTS]);
        
        // Log engagement
        logEngagement('add_to_list', {
          listId: selectedList.id,
          itemType: getItemType(),
          itemId: itemToAdd.id
        });
        
        // Move to confirmation step
        setStep(STEPS.CONFIRMATION);
        
        // Call the onItemAdded callback if provided
        if (onItemAdded) {
          onItemAdded(itemToAdd, selectedList);
        }
      },
      onError: (error) => {
        logError('[AddToListModal] Error adding item to list:', error);
        setError('Failed to add item to list. Please try again.');
      }
    }
  );
  
  // Handle list selection
  const handleListSelect = (list) => {
    setSelectedList(list);
    setStep(STEPS.ADD_DETAILS);
  };
  
  // Handle new list creation
  const handleCreateNewList = () => {
    setShowNewListForm(true);
  };
  
  // Handle new list created
  const handleListCreated = (newList) => {
    setSelectedList(newList);
    setShowNewListForm(false);
    setStep(STEPS.ADD_DETAILS);
  };
  
  // Handle cancel new list
  const handleCancelNewList = () => {
    setShowNewListForm(false);
  };
  
  // Handle item details submission
  const handleItemDetailsSubmit = (details) => {
    setItemDetails(details);
    
    // Add item to list
    addItemMutation.mutate({
      listId: selectedList.id,
      itemData: {
        ...details,
        name: itemToAdd.name,
        description: itemToAdd.description
      }
    });
  };
  
  // Handle back button from details step
  const handleBackFromDetails = () => {
    setStep(STEPS.SELECT_LIST);
    setSelectedList(null);
  };
  
  // Handle view list button
  const handleViewList = () => {
    // Close the modal
    onClose();
    
    // Navigate to the list (this would typically be handled by the parent component)
    // You could also emit an event here that the parent component can listen for
    window.location.href = `/lists/${selectedList.id}`;
  };
  
  // Render modal content based on current step
  const renderModalContent = () => {
    // Check authentication
    if (!isAuthenticated) {
      return (
        <div className="p-6 text-center">
          <p className="mb-4">You need to be logged in to add items to lists.</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Log In
          </a>
        </div>
      );
    }
    
    // Show error if present
    if (error) {
      return (
        <div className="p-6">
          <div className="flex items-center p-4 text-red-700 bg-red-100 rounded-md">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    // Step 1: Select or create a list
    if (step === STEPS.SELECT_LIST) {
      if (showNewListForm) {
        return (
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Create New List</h2>
            <NewListForm
              onCancel={handleCancelNewList}
              onListCreated={handleListCreated}
              itemType={getItemType()}
            />
          </div>
        );
      }
      
      return (
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Add to List</h2>
          <ListSelector
            userId={user?.id}
            onListSelect={handleListSelect}
            onCreateNewList={handleCreateNewList}
            itemType={getItemType()}
            itemToAdd={itemToAdd}
          />
        </div>
      );
    }
    
    // Step 2: Add item details
    if (step === STEPS.ADD_DETAILS) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Add Details</h2>
          <ItemDetailsForm
            itemToAdd={itemToAdd}
            selectedList={selectedList}
            onSubmit={handleItemDetailsSubmit}
            onCancel={handleBackFromDetails}
            isSubmitting={addItemMutation.isLoading}
          />
        </div>
      );
    }
    
    // Step 3: Confirmation
    if (step === STEPS.CONFIRMATION) {
      return (
        <div className="p-6">
          <ConfirmationScreen
            itemAdded={itemToAdd}
            listAdded={selectedList}
            onClose={onClose}
            onViewList={handleViewList}
          />
        </div>
      );
    }
    
    return null;
  };
  
  // Determine modal title based on current step
  const getModalTitle = () => {
    if (!isAuthenticated) return 'Authentication Required';
    if (error) return 'Error';
    
    switch (step) {
      case STEPS.SELECT_LIST:
        return showNewListForm ? 'Create New List' : 'Add to List';
      case STEPS.ADD_DETAILS:
        return 'Add Details';
      case STEPS.CONFIRMATION:
        return 'Success';
      default:
        return 'Add to List';
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      size="md"
    >
      {renderModalContent()}
    </Modal>
  );
};

AddToListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    restaurant_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dish_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  onItemAdded: PropTypes.func
};

export default AddToListModal;
