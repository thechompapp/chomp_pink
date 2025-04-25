/* src/pages/Lists/ListDetail.jsx */
/* REFACTORED: Integrate useApiErrorHandler for consistent error display */
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import listService from '@/services/listService.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler.js'; // Import the hook
import ListDetailSkeleton from './ListDetailSkeleton.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import Button from '@/components/UI/Button.jsx';
import { formatRelativeDate, formatDateTime } from '@/utils/formatting.js';
import { useAuthStore } from '@/stores/useAuthStore.js';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog.jsx';
import ItemQuickLookModal from '@/components/ItemQuickLookModal.jsx';

// ListItemCard component remains the same
const ListItemCard = ({ item, onRemove, onQuickLook }) => { /* ... */ const type = item.dish_id ? 'dish' : 'restaurant'; const id = item.dish_id || item.restaurant_id; const name = item.name || (item.item_type === 'dish' ? 'Unnamed Dish' : 'Unnamed Restaurant'); const description = item.restaurant_name ? `Restaurant in ${item.city_name || 'N/A'}` : `Dish at ${item.restaurant_name || 'N/A'}`; return ( <div className="bg-card border border-border rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition-shadow duration-150"> <div className="flex-grow mr-4 overflow-hidden"> <Link to={type === 'dish' ? `/dishes/${id}` : `/restaurants/${id}`} className="text-primary hover:text-primary/80 font-medium truncate block" title={name} > {name} </Link> <p className="text-sm text-muted-foreground truncate" title={description}>{description}</p> {item.notes && ( <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic line-clamp-2" title={item.notes}>Notes: {item.notes}</p> )} <p className="text-xs text-gray-400 mt-1">Added: {formatRelativeDate(item.added_at)}</p> </div> <div className="flex-shrink-0 space-x-2"> {id != null && ( <Button variant="outline" size="sm" onClick={() => onQuickLook(type, id)} title="Quick Look"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg> </Button> )} {onRemove && ( <Button variant="danger-outline" size="sm" onClick={() => onRemove(item.list_item_id)} title="Remove Item" > <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg> </Button> )} </div> </div> ); };


const ListDetail = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore(state => ({ user: state.user }));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [quickLookItem, setQuickLookItem] = useState(null);

  // Instantiate the error handler hook
  const { errorMessage, handleError, clearError } = useApiErrorHandler();

  // --- Fetch List Details ---
  const {
    data: queryData, // Renamed to avoid conflict with `list` variable later
    isLoading: isLoadingDetails,
    error: detailsQueryError, // Keep query error separate for retry logic if needed
    isError: isDetailsQueryError,
  } = useQuery({
    queryKey: ['listDetails', listId],
    // Use the service directly, React Query will catch errors
    queryFn: () => listService.getListDetails(listId),
    enabled: !!listId,
    staleTime: 1 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    // Let React Query handle retries by default, or configure as needed
  });

  // --- Mutations ---
  const { mutate: deleteListMutate, isPending: isDeletingList } = useMutation({
     mutationFn: () => listService.deleteList(listId),
     onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['userLists'] }); // Use object syntax
         navigate('/lists');
     },
     onError: (error) => {
         // Use the error handler hook
         handleError(error, 'Failed to delete list.');
     },
  });

  const { mutate: removeListItemMutate, isPending: isRemovingItem } = useMutation({
      mutationFn: (listItemId) => listService.removeListItem(listId, listItemId),
      onSuccess: (data, variables) => {
          queryClient.invalidateQueries({ queryKey: ['listDetails', listId] }); // Use object syntax
          queryClient.invalidateQueries({ queryKey: ['userLists'] });
      },
      onError: (error) => {
           // Use the error handler hook
           handleError(error, 'Failed to remove list item.');
       },
       onSettled: () => {
           setItemToRemove(null);
           // Optionally clear error message after action attempt? Or let it persist until next action/navigation
           // clearError();
       }
  });

 // --- Event Handlers ---
  const handleDeleteListClick = () => {
      clearError(); // Clear previous errors before showing confirm
      setShowDeleteConfirm(true);
  };

  const confirmDeleteList = () => {
      setShowDeleteConfirm(false);
      clearError(); // Clear previous errors before mutation
      deleteListMutate();
  };

  const handleRemoveItemClick = (listItemId) => {
       clearError(); // Clear previous errors before showing confirm
       setItemToRemove(listItemId);
  };

  const confirmRemoveItem = () => {
      if (itemToRemove) {
          clearError(); // Clear previous errors before mutation
          removeListItemMutate(itemToRemove);
      }
  };

   const handleQuickLook = (type, id) => {
       setQuickLookItem({ type, id });
   };

   const closeQuickLook = () => {
       setQuickLookItem(null);
   };

  // --- Render Logic ---
  if (isLoadingDetails) {
    return <ListDetailSkeleton />;
  }

  // Use the errorMessage from the hook for display, but check query status too
  // Prioritize mutation errors displayed by the hook, otherwise show query fetch error
  const displayError = errorMessage || detailsQueryError?.message || null;
  if (displayError && !isLoadingDetails) { // Avoid showing error during initial load
    return <ErrorMessage message={displayError} />;
  }

  // Extract data after loading and error checks
  // queryData structure might be { data: formattedList } or just formattedList depending on service return
  const list = queryData?.data || queryData; // Adapt based on service return structure
  const items = list?.items || [];

  if (!list && !isLoadingDetails && !displayError) {
      // Handle case where query succeeded but returned no list data
      return <ErrorMessage message={`List with ID ${listId} not found.`} />;
  }

  // Ensure list is defined before accessing properties
  if (!list) {
       // This case should be covered by loading/error states, but as a safeguard:
       return <ErrorMessage message="An unexpected error occurred loading list data." />;
  }


  const isOwner = user && list.user_id === user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* List Header */}
      <div className="mb-6 pb-4 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground mb-2">{list.name}</h1>
        <p className="text-muted-foreground mb-3">{list.description}</p>
        <div className="flex flex-wrap justify-between items-center text-sm text-muted-foreground gap-x-4 gap-y-1">
          <span>Created by: {list.creator_handle || 'Unknown User'}</span>
          <span title={formatDateTime(list.updated_at)}>
            Last Updated: {formatRelativeDate(list.updated_at)}
          </span>
          <span className="capitalize">{list.is_public ? 'Public' : 'Private'}</span>
        </div>
         {/* Action Buttons for Owner */}
         {isOwner && (
            <div className="mt-4 flex space-x-2">
                {/* TODO: Add Edit List functionality */}
                {/* <Link to={`/lists/${listId}/edit`}>
                  <Button variant="secondary" size="sm">Edit List</Button>
                </Link> */}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteListClick}
                  disabled={isDeletingList}
                  isLoading={isDeletingList}
                 >
                  Delete List
                </Button>
            </div>
         )}
      </div>


      {/* List Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Items ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-5">This list is empty.</p>
        ) : (
          <div className="space-y-3">
             {items.map((item) => (
                <ListItemCard
                  key={item.list_item_id}
                  item={item}
                  // Pass handleRemoveItemClick only if user is owner
                  onRemove={isOwner ? handleRemoveItemClick : undefined}
                  onQuickLook={handleQuickLook}
                />
             ))}
           </div>
        )}
      </div>

       {/* Confirmation Dialog for Deleting List */}
       <ConfirmationDialog
         isOpen={showDeleteConfirm}
         onClose={() => setShowDeleteConfirm(false)}
         onConfirm={confirmDeleteList}
         title="Delete List"
         message={`Are you sure you want to delete the list "${list.name}"? This action cannot be undone.`}
         confirmText="Delete"
         isConfirming={isDeletingList}
       />

       {/* Confirmation Dialog for Removing Item */}
       <ConfirmationDialog
         isOpen={!!itemToRemove}
         onClose={() => setItemToRemove(null)}
         onConfirm={confirmRemoveItem}
         title="Remove Item"
         message={`Are you sure you want to remove this item from the list?`}
         confirmText="Remove"
         isConfirming={isRemovingItem}
       />

        {/* Quick Look Modal */}
        {quickLookItem && (
            <ItemQuickLookModal
                isOpen={!!quickLookItem}
                onClose={closeQuickLook}
                itemType={quickLookItem.type}
                itemId={quickLookItem.id}
            />
        )}

    </div>
  );
};

export default ListDetail;