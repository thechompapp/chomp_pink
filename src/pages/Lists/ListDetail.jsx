// src/pages/Lists/ListDetail.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';

// Correct: Use NAMED import for listService
import { listService } from '@/services/listService.js'; // Changed import syntax
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import PageContainer from '@/layouts/PageContainer';
import { formatRelativeDate } from '@/utils/formatting';
import { useQuickAdd } from '@/context/QuickAddContext';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import useAuthStore from '@/stores/useAuthStore'; // Keep default import for AuthStore
import { logDebug, logError, logInfo } from '@/utils/logger'; // Use named logger imports

function ListDetail({ listId: propListId, embedded = false }) {
  const params = useParams();
  const listId = propListId || params.listId;
  const { openQuickAdd } = useQuickAdd();
  const { user } = useAuthStore(state => ({ user: state.user }));
  const handleApiError = useApiErrorHandler();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const {
    data: listDataResponse, // Rename to avoid conflict with 'list' variable later
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['listDetail', listId],
    // Correct: listService is now the imported named object
    queryFn: () => listService.getListDetails(listId),
    enabled: !!listId,
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    onError: (err) => {
      logError(`[ListDetail] Error fetching list detail for ${listId}:`, err);
      handleApiError(err, "fetch list details");
    },
     onSuccess: (data) => {
        logDebug(`[ListDetail] Fetched details for list ${listId}`);
     }
  });

  // Extract list and items from the response data structure
  // Assuming getListDetails returns { success: true, data: { list details + items }, message: ... }
  const list = listDataResponse?.data?.list;
  const items = listDataResponse?.data?.items || [];


  const handleItemQuickAdd = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    logDebug(`[ListDetail] Triggering Quick Add for list item:`, item);
    openQuickAdd({
        defaultListId: listId,
        defaultListName: list?.name, // Use fetched list name
        // Optional context passing
    });
  };

    const handleEditItem = (item) => {
        logDebug('[ListDetail] Edit item clicked:', item);
        // TODO: Implement item editing logic
    };

    const promptDeleteItem = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteItem = async () => {
        if (!itemToDelete) return;
        logDebug(`[ListDetail] Attempting to delete item ${itemToDelete.list_item_id} from list ${listId}`);
        try {
            // Correct: listService is the imported named object
            await listService.removeItemFromList(listId, itemToDelete.list_item_id);
            logInfo(`[ListDetail] Successfully deleted item ${itemToDelete.list_item_id}`);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            refetch();
        } catch (err) {
            logError(`[ListDetail] Failed to delete item ${itemToDelete.list_item_id}:`, err);
            handleApiError(err, "delete list item");
            setShowDeleteConfirm(false);
        }
    };

  const Container = embedded ? 'div' : PageContainer;

  if (isLoading) {
    return <Container><LoadingSpinner /></Container>;
  }

  // Check error state from useQuery
  if (isError) {
    const message = error?.message || 'Could not load list details.'; // Use error object from useQuery
    return <Container><ErrorMessage message={message} /></Container>;
  }

  // Check if list data exists after fetch attempt
  if (!list) {
     // Use the error message from the fetch if available and success was false, otherwise generic message
     const message = (listDataResponse && !listDataResponse.success) ? listDataResponse.message : "List not found or failed to load.";
     return <Container><ErrorMessage message={message} /></Container>;
  }

  // Now 'list' and 'items' are defined safely
  const canEdit = user && list.user_id === user.id;

  return (
    // Render logic remains the same...
    <Container className={embedded ? 'p-0' : 'p-4'}>
      {!embedded && (
        <Link to="/lists" className="inline-flex items-center text-sm text-blue-600 hover:underline mb-4">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to My Lists
        </Link>
      )}

      <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${embedded ? 'border-0' : 'border border-gray-200 dark:border-gray-700 p-6'}`}>
        {/* List Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{list.name}</h1>
          {canEdit && !embedded && (
             <div className="flex space-x-2">
                <Button size="sm" variant="outline" /* onClick={handleEditList} */ >Edit List</Button>
                <Button size="sm" variant="danger" /* onClick={handleDeleteList} */ >Delete List</Button>
             </div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Created by: {list.user_username || list.creator_handle || 'Unknown'} · Last updated: {formatRelativeDate(list.updated_at)}
        </p>
        {list.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-6">{list.description}</p>
        )}

         {/* Add Item Button */}
         <div className="mb-6">
             <Button
                 onClick={(e) => handleItemQuickAdd(e, null)}
                 variant="primary"
                 size="sm"
                 className="inline-flex items-center"
             >
                 <PlusIcon className="h-5 w-5 mr-1" />
                 Add Item to List
             </Button>
         </div>


        {/* List Items */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Items ({items.length})</h2>
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.list_item_id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <Link
                      to={item.restaurant_id ? `/restaurants/${item.restaurant_id}` : (item.dish_id ? `/dishes/${item.dish_id}` : '#')}
                      className="text-base font-medium text-blue-700 hover:underline dark:text-blue-400 truncate block"
                      title={item.restaurant_name || item.dish_name}
                    >
                      {item.restaurant_name || item.dish_name || 'Unknown Item'}
                  </Link>
                   {item.restaurant_address && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.restaurant_address}</p>}
                   {item.note && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">Note: {item.note}</p>}
                </div>

                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleItemQuickAdd(e, item)}
                    className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:text-blue-400 dark:hover:bg-gray-600 transition-colors"
                    title="Quick Add / Edit Note"
                    aria-label="Quick Add / Edit Note"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>

                   {canEdit && (
                       <button
                            onClick={() => handleEditItem(item)}
                            className="p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-gray-200 dark:hover:text-green-400 dark:hover:bg-gray-600 transition-colors"
                            title="Edit Note"
                            aria-label="Edit Note"
                       >
                           <PencilIcon className="h-5 w-5" />
                       </button>
                   )}

                  {canEdit && (
                      <button
                        onClick={() => promptDeleteItem(item)}
                        className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:text-red-400 dark:hover:bg-gray-600 transition-colors"
                        title="Remove Item"
                        aria-label="Remove Item"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No items have been added to this list yet.</p>
        )}
      </div>

      <ConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDeleteItem}
          title="Confirm Delete"
          message={`Are you sure you want to remove "${itemToDelete?.restaurant_name || itemToDelete?.dish_name || 'this item'}" from the list?`}
          confirmButtonText="Delete"
          confirmButtonVariant="danger"
      />
    </Container>
  );
}

ListDetail.propTypes = {
  listId: PropTypes.string,
  embedded: PropTypes.bool,
};

export default ListDetail;