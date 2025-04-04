// src/pages/Lists/ListDetail.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Instagram, Share2, Eye, Trash2, Loader2 } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore.js';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Keep for specific loading states
import ErrorMessage from '@/components/UI/ErrorMessage';
import { API_BASE_URL } from '@/config';
import apiClient from '@/utils/apiClient';
import SkeletonElement from '@/components/UI/SkeletonElement'; // Import base skeleton
import ListItemSkeleton from './ListItemSkeleton'; // Import list item skeleton

// Fetch function remains the same
const fetchListDetailsAndItems = async (listId) => { /* ... */ };

// List Detail Skeleton Structure
const ListDetailSkeleton = () => (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12 animate-pulse">
        {/* Back Link Skeleton */}
        <SkeletonElement type="text" className="w-24 h-5 my-4" />

        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6 space-y-3">
            <SkeletonElement type="title" className="w-1/2 h-8" />
            <SkeletonElement type="text" className="w-full" />
            <SkeletonElement type="text" className="w-1/4" />
            {/* Sort buttons placeholder */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <SkeletonElement type="button" className="w-16 h-6 rounded-full" />
                <SkeletonElement type="button" className="w-24 h-6 rounded-full" />
                <SkeletonElement type="button" className="w-24 h-6 rounded-full" />
                <SkeletonElement type="button" className="w-32 h-6 rounded-full" />
            </div>
            {/* Edit controls placeholder */}
            <div className="pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 border-t border-gray-100">
                <SkeletonElement type="rect" className="w-10 h-6 rounded-full" />
                <SkeletonElement type="text" className="w-12 h-5" />
                <SkeletonElement type="avatar" className="w-8 h-8" />
                <SkeletonElement type="avatar" className="w-8 h-8" />
            </div>
        </div>

        {/* List Items Skeleton */}
        <div className="space-y-3">
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
        </div>
    </div>
);


// Component Definition
const ListDetail = React.memo(() => {
  const { id: listId } = useParams();
  const queryClient = useQueryClient();

  const {
      data: listData, isLoading: isLoadingDetails, isError: isFetchError,
      error: fetchError, refetch
  } = useQuery({ /* ... query config ... */ });

  // Zustand actions and local state
  const updateListVisibility = useUserListStore(state => state.updateListVisibility);
  const removeFromList = useUserListStore(state => state.removeFromList);
  const isUpdatingVisibility = useUserListStore(state => state.isUpdatingVisibility);
  const isRemovingItem = useUserListStore(state => state.isRemovingItem);
  const error = useUserListStore(state => state.error); // Use unified error

  const [sortMethod, setSortMethod] = useState('default');
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [quickLookItem, setQuickLookItem] = useState(null);
  const [isDeletingItemId, setIsDeletingItemId] = useState(null);
  // Removed local actionError, will rely on unified store error state

  // Callbacks (openQuickLook, closeQuickLook, handleToggleVisibility, handleRemoveItem) remain mostly the same,
  // but error setting should rely on the store now. Example:
  const handleToggleVisibility = useCallback(async () => {
     if (!listData || isUpdatingVisibility || isDeletingItemId) return;
     // Use clearError from store if needed, or let next action clear it
     // get().clearError?.(); // Example if clearError was added and accessible
     try {
       await updateListVisibility(listData.id, !listData.is_public);
       queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
     } catch (error) {
       // Error is set within the store action, no need to set local state
       console.error("Error in handleToggleVisibility:", error);
     }
   }, [listData, updateListVisibility, isUpdatingVisibility, isDeletingItemId, queryClient, listId]);

   const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
      if (!listId || !listItemIdToRemove || isUpdatingVisibility || isDeletingItemId || !listData) return;
      if (!window.confirm(`Are you sure you want to remove this item from "${listData?.name || 'this list'}"?`)) return;
      setIsDeletingItemId(listItemIdToRemove);
      try {
        await removeFromList(parseInt(listId), listItemIdToRemove);
        queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
      } catch (error) {
        console.error("Error in handleRemoveItem:", error);
      } finally {
        setIsDeletingItemId(null);
      }
    }, [listId, listData, removeFromList, isUpdatingVisibility, isDeletingItemId, queryClient]);

   const openQuickLook = useCallback((item) => { /* ... */ }, []);
   const closeQuickLook = useCallback(() => { /* ... */ }, []);

  // Sorting Logic (getSortedItems useMemo) remains the same
  const getSortedItems = useMemo(() => { /* ... */ }, [listData?.items, sortMethod]);

  // --- Render Logic ---

  // Use Skeleton Component for initial loading
  if (isLoadingDetails) {
      return <ListDetailSkeleton />;
  }

  if (isFetchError) {
      const allowRetry = fetchError?.message !== "Invalid List ID provided." && fetchError?.message !== "List not found.";
      return (
          <ErrorMessage
              message={fetchError?.message || "Unknown error loading list."}
              onRetry={allowRetry ? refetch : undefined}
              isLoadingRetry={isLoadingDetails} // Still use isLoadingDetails for retry button state
              containerClassName="py-10 px-4 max-w-lg mx-auto"
          >
               <div className="mt-4"> <Link to="/lists" className="text-sm text-[#D1B399] hover:underline"> Back to My Lists </Link> </div>
           </ErrorMessage>
      );
  }

  if (!listData) {
      return ( <div className="text-center py-10"> <p className="text-gray-500">List not found.</p> <Link to="/lists" className="text-sm text-[#D1B399] hover:underline">Back to My Lists</Link> </div> );
  }

  // --- Main Render ---
  const sortedItems = getSortedItems;
  const listIsPublic = listData.is_public;
  const canEdit = listData.created_by_user;
  const isProcessingAnyAction = isUpdatingVisibility || !!isDeletingItemId;
  const displayError = error; // Use unified error from store

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors text-sm">
          <ChevronLeft size={18} className="mr-0.5" /> Back to My Lists
      </Link>

       {/* Display unified store error */}
       {displayError && (
         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
           <span>{typeof displayError === 'string' ? displayError : 'An error occurred'}</span>
           {/* Optionally add a clear button: <button onClick={useUserListStore(state => state.clearError)} className="...">✕</button> */}
         </div>
       )}

      {/* List Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
         {/* ... Header content remains the same ... */}
         {/* ... Sorting controls remain the same ... */}
         {/* ... Edit controls remain the same, using isProcessingAnyAction for disabling ... */}
      </div>

      {/* List Items Section */}
      <div className="space-y-3">
         {/* ... List item mapping remains the same, using isProcessingAnyAction for disabling ... */}
          {sortedItems.length > 0 ? (
              sortedItems.map((item) => {
                  // ... render item div ...
              })
          ) : ( <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm"> <p className="text-gray-500">This list is empty.</p> </div> )}
      </div>

      {/* Quick Look Modal */}
      {isQuickLookOpen && quickLookItem && (
          <ItemQuickLookModal isOpen={isQuickLookOpen} onClose={closeQuickLook} item={quickLookItem} />
      )}
    </div>
  );
});

export default ListDetail;