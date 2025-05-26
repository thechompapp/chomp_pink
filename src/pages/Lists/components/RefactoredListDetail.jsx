/**
 * RefactoredListDetail Component
 * 
 * Main container for the List Detail page.
 * Refactored version of ListDetail.jsx with improved separation of concerns.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
import useAuthStore from '@/stores/useAuthStore';
import PageContainer from '@/layouts/PageContainer';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog';
import ListHeader from './ListHeader';
import ListItemsContainer from './ListItemsContainer';
import useListData from '../hooks/useListData';
import useListItemOperations from '../hooks/useListItemOperations';

/**
 * RefactoredListDetail Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
const RefactoredListDetail = ({ listId: propListId, embedded = false }) => {
  // Get list ID from props or URL params
  const { listId: urlListId } = useParams();
  const listId = propListId || urlListId;
  
  // Auth state
  const { user, isAuthenticated } = useAuthStore();
  
  // Quick add functionality
  const { openQuickAdd } = useQuickAdd();
  
  // Fetch list data
  const {
    list,
    items,
    isLoading,
    isError,
    error,
    refetch
  } = useListData(listId);
  
  // List item operations
  const {
    showDeleteConfirm,
    itemToDelete,
    isProcessing,
    handleDeleteItemClick,
    handleDeleteItem,
    cancelDelete,
    handleEditItemNote
  } = useListItemOperations(listId, refetch);
  
  // Determine if user can edit
  const canEdit = isAuthenticated && user && list.user_id === user.id;
  
  // Handle adding item to user's list (QuickAdd)
  const handleQuickAdd = (item) => {
    if (!isAuthenticated) return;
    
    openQuickAdd({
      defaultListId: null, // Don't pre-select any list
      defaultItemData: {
        restaurant_id: item.restaurant_id,
        restaurant_name: item.restaurant_name,
        dish_id: item.dish_id,
        dish_name: item.dish_name,
        note: item.note,
      }
    });
  };
  
  // Handle edit list (placeholder)
  const handleEditList = () => {
    // Edit list implementation would go here
    console.log('Edit list clicked');
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-8 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading list...</p>
        </div>
      </PageContainer>
    );
  }

  // Enhanced error state with retry button and offline recovery
  if (isError) {
    return (
      <PageContainer>
        <div className="py-8 flex flex-col items-center">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Unable to load list
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error?.message || 'There was an issue connecting to the server.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
          <ErrorMessage
            title="Error Details"
            message={error?.message}
            details={error?.stack}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* List header */}
        <ListHeader
          list={list}
          canEdit={canEdit}
          isAuthenticated={isAuthenticated}
          onEdit={handleEditList}
        />
        
        {/* List items */}
        <ListItemsContainer
          items={items}
          canEdit={canEdit}
          onQuickAdd={handleQuickAdd}
          onEditNote={handleEditItemNote}
          onDeleteItem={handleDeleteItemClick}
        />
        
        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <ConfirmationDialog
            isOpen={showDeleteConfirm}
            title="Remove Item"
            message={`Are you sure you want to remove "${itemToDelete?.restaurant_name || itemToDelete?.dish_name}" from this list?`}
            confirmLabel="Remove"
            cancelLabel="Cancel"
            isProcessing={isProcessing}
            onConfirm={handleDeleteItem}
            onCancel={cancelDelete}
            danger
          />
        )}
      </div>
    </PageContainer>
  );
};

RefactoredListDetail.propTypes = {
  listId: PropTypes.string,
  embedded: PropTypes.bool
};

export default RefactoredListDetail;
