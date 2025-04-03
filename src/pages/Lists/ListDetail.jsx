// src/pages/Lists/ListDetail.jsx
import React, { useState, useCallback } from 'react'; // Removed useEffect, useRef
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // *** IMPORT React Query hooks ***
import { ChevronLeft, Instagram, Share2, Eye, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore.js';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';
import Button from '@/components/Button';
import { API_BASE_URL } from '@/config';

// *** Define the fetch function outside the component ***
const fetchListDetailsAndItems = async (listId) => {
  const parsedListId = parseInt(listId);
  if (!listId || isNaN(parsedListId) || parsedListId <= 0) {
    throw new Error("Invalid List ID provided.");
  }
  console.log(`[fetchListDetailsAndItems] Fetching details & items for list ID: ${parsedListId}`);

  try {
     // Use AbortController with fetch for timeouts (optional with React Query, but good practice)
     // const controller = new AbortController();
     // const timeoutId = setTimeout(() => controller.abort(), 15000);
     // signal: controller.signal

    const response = await fetch(`<span class="math-inline">\{API\_BASE\_URL\}/api/lists/</span>{parsedListId}`);
    // clearTimeout(timeoutId); // Clear timeout if using controller

    if (!response.ok) {
      let errorMsg = `Failed to fetch list details (${response.status})`;
      try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
      console.error(`[fetchListDetailsAndItems] API Error Status ${response.status}: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error("Invalid list data received from API.");

    // Format the data for consistency right after fetching
    const { items, ...details } = data;
    const formattedResponse = {
        ...details,
        city: details.city_name, // Map db column
        is_following: details.is_following ?? false,
        is_public: details.is_public ?? true,
        created_by_user: details.created_by_user ?? false,
        tags: Array.isArray(details.tags) ? details.tags : [],
        items: (Array.isArray(items) ? items.map(item => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : []
        })).filter(item => typeof item.list_item_id !== 'undefined' && item.list_item_id !== null) : []),
        item_count: items?.length ?? 0, // Calculate or use from details if available
    };
    console.log(`[fetchListDetailsAndItems] Successfully fetched and formatted list ${parsedListId}.`);
    return formattedResponse;

  } catch (err) {
    console.error(`[fetchListDetailsAndItems] Error during fetch for list ${parsedListId}:`, err);
    const errorMsg = err.name === 'AbortError' ? 'Request timed out.' : (err.message || 'Could not load list details.');
    throw new Error(errorMsg); // Re-throw the formatted error message
  }
};


const ListDetail = () => {
  const { id: listId } = useParams();
  const queryClient = useQueryClient(); // Get query client instance

  // --- Use React Query to fetch data ---
  const {
      data: listData, // Renamed from listDetails for clarity
      isLoading: isLoadingDetails, // Use isLoading from useQuery
      isError: isFetchError, // Use isError from useQuery
      error: fetchError, // Use error from useQuery
      refetch // Function to manually refetch
  } = useQuery({
      queryKey: ['listDetails', listId], // Unique key for this query
      queryFn: () => fetchListDetailsAndItems(listId), // The function to call
      enabled: !!listId, // Only run the query if listId is truthy
      // Optional: configure staleTime, cacheTime etc. here or globally
      // staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
  });
  // --- End React Query ---


  // Select Zustand actions (keep these for mutations for now)
  const updateListVisibility = useUserListStore(state => state.updateListVisibility);
  const removeFromList = useUserListStore(state => state.removeFromList);

  // Local state for UI interactions (keep these)
  const [sortMethod, setSortMethod] = useState('default');
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [quickLookItem, setQuickLookItem] = useState(null);
  const [isDeletingItemId, setIsDeletingItemId] = useState(null); // Local delete loading state
  const [actionError, setActionError] = useState(null); // Separate state for mutation errors

  // --- Callbacks for UI Actions (Mutations) ---
  // (Keep openQuickLook, closeQuickLook as they are)
   const openQuickLook = useCallback((item) => { /* ... keep existing ... */ });
   const closeQuickLook = useCallback(() => { /* ... keep existing ... */ });

  const handleToggleVisibility = useCallback(async () => {
    if (!listData || isDeletingItemId) return;
    const currentVisibility = listData.is_public;
    const newVisibility = !currentVisibility;
    // Optimistic update could be done here with React Query, but for now just call store action
    setActionError(null);
    try {
      await updateListVisibility(listData.id, newVisibility);
      console.log(`[ListDetail] Visibility toggled successfully for list ${listData.id}`);
      // *** Invalidate the query cache to refetch fresh data after mutation ***
      queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
      // Or optimistically update the cache: queryClient.setQueryData(['listDetails', listId], oldData => ({...oldData, is_public: newVisibility}))
    } catch (error) {
      console.error(`[ListDetail] Error toggling visibility for list ${listData.id}:`, error);
      setActionError(`Failed to update visibility: ${error.message}`);
      // Optionally trigger refetch on error too: queryClient.invalidateQueries(['listDetails', listId]);
    }
  }, [listData, updateListVisibility, isDeletingItemId, queryClient, listId]); // Add queryClient, listId

  const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
    const parsedListId = parseInt(listId);
    if (!parsedListId || !listItemIdToRemove || isDeletingItemId || !listData) return;
    if (!confirm(`Are you sure you want to remove this item from "${listData?.name || 'this list'}"?`)) return;

    setIsDeletingItemId(listItemIdToRemove); setActionError(null);
    try {
      await removeFromList(parsedListId, listItemIdToRemove);
      console.log(`[ListDetail] Removed item ${listItemIdToRemove} from list ${parsedListId}`);
      // *** Invalidate the query cache to refetch fresh data (including items) ***
      queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
    } catch (error) {
      console.error(`[ListDetail] Failed to remove item ${listItemIdToRemove} from list ${parsedListId}:`, error);
      setActionError(`Failed to remove item: ${error.message}`);
    } finally { setIsDeletingItemId(null); }
  }, [listId, listData, removeFromList, isDeletingItemId, queryClient]); // Add listData, queryClient

  // --- Sorting Logic (Uses listData.items) ---
  const getSortedItems = useCallback(() => {
    const itemsToSort = [...(listData?.items || [])]; // Use items from query data
    // ... (keep existing sorting logic) ...
     try {
         switch (sortMethod) {
             case 'a-z': return itemsToSort.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
             case 'z-a': return itemsToSort.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
             case 'default': default:
                 return itemsToSort.sort((a, b) => {
                     const dateA = a.added_at ? new Date(a.added_at).getTime() : 0;
                     const dateB = b.added_at ? new Date(b.added_at).getTime() : 0;
                     return dateB - dateA; // Newest first
                 });
         }
     } catch (error) { console.error('[ListDetail] Error sorting items:', error); return itemsToSort; }
  }, [listData?.items, sortMethod]); // Depends on items from query data


  // --- Render Logic ---

  // Loading State (Uses isLoadingDetails from useQuery)
  if (isLoadingDetails) {
      return ( <div className="flex justify-center items-center h-[calc(100vh-100px)]"> <div className="text-center text-gray-500"> <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" /> Loading list details... </div> </div> );
  }

  // Error State (Uses isFetchError and fetchError from useQuery)
  if (isFetchError) {
      return ( <div className="text-center py-10 max-w-lg mx-auto px-4"> <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" /> <p className="text-red-600 mb-4">{fetchError?.message || "Unknown error loading list."}</p> <div className="space-y-2"> {fetchError?.message !== "Invalid List ID provided." && (<Button onClick={() => refetch()} variant="primary" size="sm" disabled={isLoadingDetails}>Retry</Button>)} <div><Link to="/lists" className="text-sm text-[#D1B399] hover:underline">Back to My Lists</Link></div> </div> </div> );
  }

  // List Not Found or Empty Data State (Check listData from useQuery)
  if (!listData) {
      return ( <div className="text-center py-10"> <p className="text-gray-500">List details could not be loaded or list not found.</p> <Link to="/lists" className="text-sm text-[#D1B399] hover:underline">Back to My Lists</Link> </div> );
  }

  // --- Main Render (Uses listData) ---
  const sortedItems = getSortedItems();
  const listIsPublic = listData.is_public;
  const canEdit = listData.created_by_user;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      {/* Back Link */}
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors text-sm">
          <ChevronLeft size={18} className="mr-0.5" /> Back to My Lists
      </Link>

       {/* Display Action Error (from remove/visibility toggle) */}
       {actionError && ( // Use local actionError state
           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
             <span>{actionError}</span>
             <button onClick={() => setActionError(null)} className="font-bold text-sm hover:text-red-900 ml-4">✕</button>
           </div>
         )}

      {/* List Header Section (Uses listData) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{listData.name}</h1>
         {listData.description && <p className="text-sm text-gray-500 mb-2 max-w-prose">{listData.description}</p>}
        <p className="text-sm text-gray-600 mb-4">{listData.item_count ?? 0} {listData.item_count === 1 ? 'item' : 'items'}</p>

        {/* Sorting Controls (Check listData.items.length) */}
        {(listData.items?.length || 0) > 1 && (
          <div className="flex flex-wrap gap-2 mb-4 border-t border-gray-100 pt-4">
              <span className="text-xs text-gray-500 self-center mr-1">Sort by:</span>
            <Button onClick={() => setSortMethod('default')} variant={sortMethod === 'default' ? 'primary' : 'tertiary'} size="sm" className="!rounded-full !text-xs !px-2.5 !py-0.5">Default</Button>
            <Button onClick={() => setSortMethod('a-z')} variant={sortMethod === 'a-z' ? 'primary' : 'tertiary'} size="sm" className="!rounded-full !text-xs !px-2.5 !py-0.5">A-Z</Button>
            <Button onClick={() => setSortMethod('z-a')} variant={sortMethod === 'z-a' ? 'primary' : 'tertiary'} size="sm" className="!rounded-full !text-xs !px-2.5 !py-0.5">Z-A</Button>
          </div>
        )}

        {/* Edit Controls (Uses canEdit flag derived from listData) */}
        {canEdit && (
          <div className="pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 border-t border-gray-100">
             {/* Visibility Toggle (Uses listIsPublic derived from listData) */}
            <div className="flex items-center">
                 {/* ... input and divs using listIsPublic and handleToggleVisibility ... */}
                 <label htmlFor="togglePublic" className={`flex items-center mr-2 ${isDeletingItemId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <div className="relative">
                          <input type="checkbox" id="togglePublic" checked={listIsPublic} onChange={handleToggleVisibility} className="sr-only peer" disabled={!!isDeletingItemId}/>
                          <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                          <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                      </div>
                  </label>
                  <span className={`text-sm text-gray-700 select-none ${isDeletingItemId ? 'opacity-50' : ''}`}>{listIsPublic ? 'Public' : 'Private'}</span>
            </div>
             {/* Share Buttons */}
            <div className='flex gap-2'>
                {/* ... share buttons using listIsPublic ... */}
                 <button title="Share List (Placeholder)" className="p-1.5 bg-[#D1B399] text-white rounded-full hover:bg-[#b89e89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!listIsPublic || !!isDeletingItemId} onClick={() => alert('Sharing functionality not yet implemented.')}> <Share2 size={18} /> </button>
                 <a href="https://instagram.com" title="Share on Instagram (Placeholder)" target="_blank" rel="noopener noreferrer" className={`p-1.5 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors ${!listIsPublic || !!isDeletingItemId ? 'opacity-50 pointer-events-none' : ''}`} onClick={(e) => { if (!listIsPublic || !!isDeletingItemId) e.preventDefault(); alert('Sharing functionality not yet implemented.'); }}> <Instagram size={18} /> </a>
            </div>
          </div>
        )}
      </div>

      {/* List Items Section (Uses sortedItems derived from listData) */}
      <div className="space-y-3">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => {
            if (!item || typeof item.list_item_id === 'undefined' || item.list_item_id === null) { console.warn("[ListDetail] Skipping rendering invalid list item:", item); return null; }
            const isDeletingThis = isDeletingItemId === item.list_item_id;
            return (
              <div key={item.list_item_id} className={`relative bg-white rounded-lg border border-gray-100 p-3 sm:p-4 flex items-center justify-between transition-all duration-150 ${isDeletingThis ? 'opacity-50' : 'hover:border-[#D1B399]/50 hover:bg-gray-50/50'}`} aria-busy={isDeletingThis} >
                 {/* Clickable Area */}
                <button onClick={() => openQuickLook(item)} className="flex-grow text-left focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:ring-offset-1 rounded-md mr-4 disabled:cursor-wait" aria-label={`View details for ${item.name}`} disabled={isDeletingThis} >
                  <h3 className="text-base font-medium text-gray-900">{item.name || 'Unnamed Item'}</h3>
                  {item.item_type === 'dish' && item.restaurant_name && ( <p className="text-xs text-gray-500">at {item.restaurant_name}</p> )}
                  {item.item_type === 'restaurant' && item.neighborhood && item.city && ( <p className="text-xs text-gray-500">{item.neighborhood}, {item.city}</p> )}
                   <p className="text-[10px] text-gray-400 capitalize mt-0.5">({item.item_type})</p>
                </button>
                 {/* Tags & Action Icons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                   {(item.tags || []).slice(0, 2).map(tag => ( <span key={tag} className="hidden sm:inline-block px-1.5 py-0.5 border border-gray-200 rounded-full text-[10px] text-gray-600 whitespace-nowrap"> #{tag} </span> ))}
                   <button onClick={() => openQuickLook(item)} className="p-1 text-gray-400 hover:text-[#A78B71] disabled:opacity-50 disabled:cursor-wait" title="Quick Look" disabled={isDeletingThis}> <Eye size={16} /> </button>
                   {canEdit && (
                       <button onClick={() => handleRemoveItem(item.list_item_id)} className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-wait" title="Remove item from list" disabled={isDeletingThis}> {isDeletingThis ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} </button>
                   )}
                </div>
              </div>
            );
          })
        // Empty List Message
        ) : ( <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm"> <p className="text-gray-500">This list is empty.</p> </div> )}
      </div>

      {/* Quick Look Modal */}
      {isQuickLookOpen && quickLookItem && (
          <ItemQuickLookModal
              isOpen={isQuickLookOpen}
              onClose={closeQuickLook}
              item={quickLookItem}
          />
      )}
    </div>
  );
};

export default ListDetail;