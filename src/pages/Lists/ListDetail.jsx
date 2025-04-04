// src/pages/Lists/ListDetail.jsx
import React, { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Instagram, Share2, Eye, Trash2, Loader2 } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore.js';
import ItemQuickLookModal from '@/components/ItemQuickLookModal'; // Ensure this path is correct
import Button from '@/components/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import { API_BASE_URL } from '@/config';

// Keep existing fetch function
const fetchListDetailsAndItems = async (listId) => {
  const parsedListId = parseInt(listId);
  if (!listId || isNaN(parsedListId) || parsedListId <= 0) {
    throw new Error("Invalid List ID provided.");
  }
  console.log(`[fetchListDetailsAndItems] Fetching details & items for list ID: ${parsedListId}`);

  try {
    // Assuming this doesn't strictly require auth to view public lists,
    // but might need auth to get correct `is_following` status later.
    // If it *always* requires auth, use apiClient here.
    const response = await fetch(`${API_BASE_URL}/api/lists/${parsedListId}`);
    if (!response.ok) {
      let errorMsg = `Failed to fetch list details (${response.status})`;
       // Handle specific errors if needed
      if (response.status === 401) {
          throw new Error('Authentication required or session expired.');
      }
      if (response.status === 404) {
           throw new Error('List not found.');
      }
      try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
      console.error(`[fetchListDetailsAndItems] API Error Status ${response.status}: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error("Invalid list data received from API.");

    // Format the data
    const { items, ...details } = data;
    const formattedResponse = {
        ...details,
        city: details.city_name,
        is_following: details.is_following ?? false,
        is_public: details.is_public ?? true,
        created_by_user: details.created_by_user ?? false,
        tags: Array.isArray(details.tags) ? details.tags : [],
        items: (Array.isArray(items) ? items.map(item => ({
            ...item,
            id: item.item_id,
            list_item_id: item.list_item_id,
            tags: Array.isArray(item.tags) ? item.tags : []
        })).filter(item => typeof item.list_item_id !== 'undefined' && item.list_item_id !== null) : []),
        item_count: items?.length ?? 0,
    };
    console.log(`[fetchListDetailsAndItems] Successfully fetched and formatted list ${parsedListId}.`);
    return formattedResponse;

  } catch (err) {
    console.error(`[fetchListDetailsAndItems] Error during fetch for list ${parsedListId}:`, err);
    throw new Error(err.message || 'Could not load list details.');
  }
};


const ListDetail = () => {
  const { id: listId } = useParams();
  const queryClient = useQueryClient();

  // React Query fetch
  const {
      data: listData, isLoading: isLoadingDetails, isError: isFetchError,
      error: fetchError, refetch
  } = useQuery({
      queryKey: ['listDetails', listId],
      queryFn: () => fetchListDetailsAndItems(listId),
      enabled: !!listId,
      // Consider adding retry logic here if appropriate
      // retry: (failureCount, error) => {
      //   if (error.message === 'List not found.' || error.message === 'Invalid List ID provided.') return false; // Don't retry for these errors
      //   return failureCount < 3; // Retry up to 3 times for other errors
      // },
  });

  // Zustand actions and local state
  // Select only the actions needed
  const updateListVisibility = useUserListStore(state => state.updateListVisibility);
  const removeFromList = useUserListStore(state => state.removeFromList);
  const isUpdatingVisibility = useUserListStore(state => state.isUpdatingVisibility); // Get loading state if needed
  const isRemovingItem = useUserListStore(state => state.isRemovingItem); // Get loading state if needed

  const [sortMethod, setSortMethod] = useState('default');
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [quickLookItem, setQuickLookItem] = useState(null);
  // Use isRemovingItem from store instead of local isDeletingItemId if preferred,
  // but local state can be simpler if only one item can be deleted at a time.
  const [isDeletingItemId, setIsDeletingItemId] = useState(null);
  const [actionError, setActionError] = useState(null); // Local state for displaying action errors

  // --- Callbacks ---
  const openQuickLook = useCallback((item) => {
    setQuickLookItem(item);
    setIsQuickLookOpen(true);
  }, []);

  const closeQuickLook = useCallback(() => {
    setIsQuickLookOpen(false);
    setQuickLookItem(null);
  }, []);

  const handleToggleVisibility = useCallback(async () => {
     // Prevent action if already processing visibility or deleting item
     if (!listData || isUpdatingVisibility || isDeletingItemId) return;
     setActionError(null);
     try {
       // Call the store action - store manages loading/error for this action
       await updateListVisibility(listData.id, !listData.is_public);
       // Invalidate query to refetch data showing new visibility state
       queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
     } catch (error) {
       // Display error locally if store action throws
       setActionError(`Failed to update visibility: ${error.message}`);
     }
   }, [listData, updateListVisibility, isUpdatingVisibility, isDeletingItemId, queryClient, listId]); // Added loading state deps

  const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
     const parsedListId = parseInt(listId);
     // Prevent action if already processing visibility or deleting another item
     if (!parsedListId || !listItemIdToRemove || isUpdatingVisibility || isDeletingItemId || !listData) return;
     if (!confirm(`Are you sure you want to remove this item from "${listData?.name || 'this list'}"?`)) return;

     setIsDeletingItemId(listItemIdToRemove); // Set local deleting ID state
     setActionError(null);
     try {
       // Call store action - store manages its own loading/error if needed
       await removeFromList(parsedListId, listItemIdToRemove);
       // Invalidate query to refetch list items
       queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
     } catch (error) {
       setActionError(`Failed to remove item: ${error.message}`);
     } finally {
       setIsDeletingItemId(null); // Clear local deleting ID state
     }
   }, [listId, listData, removeFromList, isUpdatingVisibility, isDeletingItemId, queryClient]); // Added loading state deps

  const getSortedItems = useCallback(() => { /* ... sorting logic ... */ }, [listData?.items, sortMethod]);

  // --- Render Logic ---

  if (isLoadingDetails) {
      return <LoadingSpinner message="Loading list details..." />;
  }

  if (isFetchError) {
      const allowRetry = fetchError?.message !== "Invalid List ID provided." && fetchError?.message !== "List not found.";
      return (
          <ErrorMessage
              message={fetchError?.message || "Unknown error loading list."}
              onRetry={allowRetry ? refetch : undefined}
              isLoadingRetry={isLoadingDetails}
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
  const sortedItems = getSortedItems();
  const listIsPublic = listData.is_public;
  const canEdit = listData.created_by_user;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors text-sm">
          <ChevronLeft size={18} className="mr-0.5" /> Back to My Lists
      </Link>

       {/* Corrected Action Error Display */}
       {actionError && (
         <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
           <span>{actionError}</span>
           <button onClick={() => setActionError(null)} className="font-bold text-sm hover:text-red-900 ml-4">✕</button>
         </div>
       )}

      {/* List Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
         {/* ... header content ... */}
         <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{listData.name}</h1>
         {listData.description && <p className="text-sm text-gray-500 mb-2 max-w-prose">{listData.description}</p>}
         <p className="text-sm text-gray-600 mb-4">{listData.item_count ?? 0} {listData.item_count === 1 ? 'item' : 'items'}</p>
         {/* Sorting */}
         {(listData.items?.length || 0) > 1 && ( <div className="flex flex-wrap gap-2 mb-4 border-t border-gray-100 pt-4"> {/* ... sort buttons ... */} </div> )}
         {/* Edit Controls */}
         {canEdit && (
              <div className="pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 border-t border-gray-100">
                 {/* Visibility Toggle */}
                 <div className="flex items-center">
                     <label htmlFor="togglePublic" className={`flex items-center mr-2 ${isUpdatingVisibility || isDeletingItemId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                          <div className="relative">
                              <input type="checkbox" id="togglePublic" checked={listIsPublic} onChange={handleToggleVisibility} className="sr-only peer" disabled={isUpdatingVisibility || !!isDeletingItemId}/>
                              <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                              <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                          </div>
                      </label>
                      <span className={`text-sm text-gray-700 select-none ${isUpdatingVisibility || isDeletingItemId ? 'opacity-50' : ''}`}>{listIsPublic ? 'Public' : 'Private'}</span>
                 </div>
                 {/* Share Buttons */}
                 <div className='flex gap-2'>
                      <button title="Share List (Placeholder)" className="p-1.5 bg-[#D1B399] text-white rounded-full hover:bg-[#b89e89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!listIsPublic || isUpdatingVisibility || !!isDeletingItemId} onClick={() => alert('Sharing functionality not yet implemented.')}> <Share2 size={18} /> </button>
                      <a href="https://instagram.com" title="Share on Instagram (Placeholder)" target="_blank" rel="noopener noreferrer" className={`p-1.5 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors ${!listIsPublic || isUpdatingVisibility || !!isDeletingItemId ? 'opacity-50 pointer-events-none' : ''}`} onClick={(e) => { if (!listIsPublic || isUpdatingVisibility || !!isDeletingItemId) e.preventDefault(); alert('Sharing functionality not yet implemented.'); }}> <Instagram size={18} /> </a>
                 </div>
              </div>
         )}
      </div>

      {/* List Items Section */}
      <div className="space-y-3">
         {sortedItems.length > 0 ? (
           sortedItems.map((item) => {
             if (!item || typeof item.list_item_id === 'undefined' || item.list_item_id === null) { console.warn("[ListDetail] Skipping render invalid list item:", item); return null; }
             const isDeletingThis = isDeletingItemId === item.list_item_id;
             const isCurrentlyProcessing = isUpdatingVisibility || isDeletingItemId; // Combine loading states
             return (
               <div key={item.list_item_id} className={`relative bg-white rounded-lg border border-gray-100 p-3 sm:p-4 flex items-center justify-between transition-all duration-150 ${isCurrentlyProcessing ? 'opacity-50 pointer-events-none' : 'hover:border-[#D1B399]/50 hover:bg-gray-50/50'}`} aria-busy={isDeletingThis} >
                 <button onClick={() => openQuickLook(item)} className="flex-grow text-left focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:ring-offset-1 rounded-md mr-4 disabled:cursor-wait" aria-label={`View details for ${item.name}`} disabled={isCurrentlyProcessing} >
                    {/* ... item details ... */}
                 </button>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    {(item.tags || []).slice(0, 2).map(tag => ( <span key={tag} className="...">#{tag}</span> ))}
                    <button onClick={() => openQuickLook(item)} className="p-1 text-gray-400 hover:text-[#A78B71] disabled:opacity-50 disabled:cursor-wait" title="Quick Look" disabled={isCurrentlyProcessing}> <Eye size={16} /> </button>
                    {canEdit && ( <button onClick={() => handleRemoveItem(item.list_item_id)} className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-wait" title="Remove item from list" disabled={isCurrentlyProcessing}> {isDeletingThis ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} </button> )}
                 </div>
               </div>
             );
           })
         ) : ( <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm"> <p className="text-gray-500">This list is empty.</p> </div> )}
      </div>

      {/* Quick Look Modal */}
      {isQuickLookOpen && quickLookItem && (
          <ItemQuickLookModal isOpen={isQuickLookOpen} onClose={closeQuickLook} item={quickLookItem} />
      )}
    </div>
  );
};

export default ListDetail;