// src/pages/Lists/ListDetail.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Instagram, Share2, Eye, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore.js';
import ItemQuickLookModal from '@/components/ItemQuickLookModal'; // Ensure this path is correct
import Button from '@/components/Button';
import { API_BASE_URL } from '@/config';

const ListDetail = () => {
  const { id: listId } = useParams();

  // Select state and actions from useUserListStore
  const updateListVisibility = useUserListStore(state => state.updateListVisibility);
  const removeFromList = useUserListStore(state => state.removeFromList);

  // Local state
  const [listDetails, setListDetails] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [error, setError] = useState(null); // For fetch or action errors displayed in UI
  const [sortMethod, setSortMethod] = useState('default');
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [quickLookItem, setQuickLookItem] = useState(null); // Stores { id, type, name }
  const [isDeletingItemId, setIsDeletingItemId] = useState(null); // Track local delete loading state

  // --- Fetching Logic ---
  const fetchListAndItems = useCallback(async () => {
    const parsedListId = parseInt(listId);
    if (!listId || isNaN(parsedListId) || parsedListId <= 0) {
        setError("Invalid List ID provided.");
        setIsLoadingDetails(false);
        return;
    }

    console.log(`[ListDetail] Fetching details & items for list ID: ${parsedListId}`);
    setIsLoadingDetails(true);
    setError(null); // Clear previous errors before fetch

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(`${API_BASE_URL}/api/lists/${parsedListId}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorMsg = `Failed to fetch list details (${response.status})`;
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            console.error(`[ListDetail] API Error Status ${response.status}: ${errorMsg}`);
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (!data || typeof data !== 'object') throw new Error("Invalid list data received from API.");

        const { items, ...details } = data;

        setListDetails({
            id: details.id, name: details.name || "Unnamed List", description: details.description,
            is_public: details.is_public ?? true, created_by_user: details.created_by_user ?? false,
            item_count: details.item_count ?? (Array.isArray(items) ? items.length : 0),
            creator_handle: details.creator_handle || null, tags: Array.isArray(details.tags) ? details.tags : [],
            is_following: details.is_following ?? false,
        });

        setListItems(Array.isArray(items) ? items.map(item => ({
            list_item_id: item.list_item_id, item_id: item.item_id, item_type: item.item_type,
            name: item.name || "Unnamed Item", restaurant_name: item.restaurant_name || null,
            neighborhood: item.neighborhood || null, city: item.city || null,
            tags: Array.isArray(item.tags) ? item.tags : [], added_at: item.added_at,
        })).filter(item => typeof item.list_item_id !== 'undefined') : []);

        console.log(`[ListDetail] Successfully fetched list ${parsedListId}. Items found: ${Array.isArray(items) ? items.length : 0}`);

    } catch (err) {
        console.error(`[ListDetail] Error during fetch for list ${parsedListId}:`, err);
        const errorMsg = err.name === 'AbortError' ? 'Request timed out.' : (err.message || 'Could not load list details.');
        setError(errorMsg);
        setListDetails(null); setListItems([]); // Clear data on fetch error
    } finally {
        console.log(`[ListDetail] Fetch sequence finished for list ${listId}. Setting isLoadingDetails to false.`);
        setIsLoadingDetails(false);
    }
  }, [listId]); // Only depend on listId

  // Fetch data on mount or when listId changes
  useEffect(() => {
    console.log(`[ListDetail useEffect] Running effect for listId: ${listId}`);
    fetchListAndItems();
  }, [fetchListAndItems]);


  // --- Callbacks for UI Actions ---
  const openQuickLook = useCallback((item) => {
      if (item && item.item_id && item.item_type && item.name) {
          setQuickLookItem({ id: item.item_id, type: item.item_type, name: item.name });
          setIsQuickLookOpen(true);
      } else { console.warn("[ListDetail] Quick Look cannot be opened: Invalid item data", item); }
  }, []);

  const closeQuickLook = useCallback(() => {
      setIsQuickLookOpen(false);
      setQuickLookItem(null);
  }, []);

  const handleToggleVisibility = useCallback(async () => {
    if (!listDetails || isDeletingItemId) return;
    const currentVisibility = listDetails.is_public; const newVisibility = !currentVisibility;
    setListDetails(prev => prev ? { ...prev, is_public: newVisibility } : null); setError(null);
    try {
      await updateListVisibility(listDetails.id, newVisibility);
      console.log(`[ListDetail] Visibility toggled successfully for list ${listDetails.id}`);
    } catch (error) {
      console.error(`[ListDetail] Error toggling visibility for list ${listDetails.id}:`, error);
      setListDetails(prev => prev ? { ...prev, is_public: currentVisibility } : null); setError(`Failed to update visibility: ${error.message}`);
    }
  }, [listDetails, updateListVisibility, isDeletingItemId]);

  const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
    const parsedListId = parseInt(listId);
    if (!parsedListId || !listItemIdToRemove || isDeletingItemId) return;
    if (!confirm(`Are you sure you want to remove this item from "${listDetails?.name || 'this list'}"?`)) return;
    setIsDeletingItemId(listItemIdToRemove); setError(null);
    try {
      await removeFromList(parsedListId, listItemIdToRemove);
      console.log(`[ListDetail] Removed item ${listItemIdToRemove} from list ${parsedListId}`);
      setListItems(prev => prev.filter(item => item.list_item_id !== listItemIdToRemove));
      setListDetails(prev => prev ? { ...prev, item_count: Math.max(0, (prev.item_count || 1) - 1) } : null);
    } catch (error) {
      console.error(`[ListDetail] Failed to remove item ${listItemIdToRemove} from list ${parsedListId}:`, error);
      setError(`Failed to remove item: ${error.message}`);
    } finally { setIsDeletingItemId(null); }
  }, [listId, listDetails?.name, removeFromList, isDeletingItemId]);


  // --- Sorting Logic ---
  const getSortedItems = useCallback(() => {
      if (!Array.isArray(listItems)) return []; const itemsToSort = [...listItems];
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
  }, [listItems, sortMethod]);


  // --- Render Logic ---

  // Loading State
  if (isLoadingDetails) {
      return ( <div className="flex justify-center items-center h-[calc(100vh-100px)]"> <div className="text-center text-gray-500"> <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" /> Loading list details... </div> </div> );
  }

  // Error State (Fetch Error)
  if (error && !listDetails) { // Show fetch error only if details haven't loaded
      return ( <div className="text-center py-10 max-w-lg mx-auto px-4"> <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" /> <p className="text-red-600 mb-4">{error}</p> <div className="space-y-2"> {error !== "Invalid List ID provided." && (<Button onClick={fetchListAndItems} variant="primary" size="sm" disabled={isLoadingDetails}>Retry</Button>)} <div><Link to="/lists" className="text-sm text-[#D1B399] hover:underline">Back to My Lists</Link></div> </div> </div> );
  }

  // List Not Found or Failed to Load State
  if (!listDetails) {
      return ( <div className="text-center py-10"> <p className="text-gray-500">List details could not be loaded.</p> <Link to="/lists" className="text-sm text-[#D1B399] hover:underline">Back to My Lists</Link> </div> );
  }

  // --- Main Render ---
  const sortedItems = getSortedItems();
  const listIsPublic = listDetails.is_public;
  const canEdit = listDetails.created_by_user;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      {/* Back Link */}
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors text-sm">
          <ChevronLeft size={18} className="mr-0.5" /> Back to My Lists
      </Link>

       {/* Display Action Error (from remove/visibility toggle) */}
       {error && listDetails && ( // Show action error only if details ARE loaded
           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex justify-between items-center" role="alert">
             <span>{error}</span>
             <button onClick={() => setError(null)} className="font-bold text-sm hover:text-red-900 ml-4">✕</button>
           </div>
         )}

      {/* List Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{listDetails.name}</h1>
         {listDetails.description && <p className="text-sm text-gray-500 mb-2 max-w-prose">{listDetails.description}</p>}
        <p className="text-sm text-gray-600 mb-4">{listDetails.item_count ?? 0} {listDetails.item_count === 1 ? 'item' : 'items'}</p>

        {/* Sorting Controls (only if multiple items) */}
        {listItems.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4 border-t border-gray-100 pt-4">
              <span className="text-xs text-gray-500 self-center mr-1">Sort by:</span>
            <Button onClick={() => setSortMethod('default')} variant={sortMethod === 'default' ? 'primary' : 'tertiary'} size="sm" className="!rounded-full !text-xs !px-2.5 !py-0.5">Default</Button>
            <Button onClick={() => setSortMethod('a-z')} variant={sortMethod === 'a-z' ? 'primary' : 'tertiary'} size="sm" className="!rounded-full !text-xs !px-2.5 !py-0.5">A-Z</Button>
            <Button onClick={() => setSortMethod('z-a')} variant={sortMethod === 'z-a' ? 'primary' : 'tertiary'} size="sm" className="!rounded-full !text-xs !px-2.5 !py-0.5">Z-A</Button>
          </div>
        )}

        {/* Edit Controls (only if user created the list) */}
        {canEdit && (
          <div className="pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 border-t border-gray-100">
             {/* Visibility Toggle */}
            <div className="flex items-center">
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
                 <button title="Share List (Placeholder)" className="p-1.5 bg-[#D1B399] text-white rounded-full hover:bg-[#b89e89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!listIsPublic || !!isDeletingItemId} onClick={() => alert('Sharing functionality not yet implemented.')}> <Share2 size={18} /> </button>
                 <a href="https://instagram.com" title="Share on Instagram (Placeholder)" target="_blank" rel="noopener noreferrer" className={`p-1.5 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors ${!listIsPublic || !!isDeletingItemId ? 'opacity-50 pointer-events-none' : ''}`} onClick={(e) => { if (!listIsPublic || !!isDeletingItemId) e.preventDefault(); alert('Sharing functionality not yet implemented.'); }}> <Instagram size={18} /> </a>
            </div>
          </div>
        )}
      </div>

      {/* List Items Section */}
      <div className="space-y-3">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => {
            if (!item || typeof item.list_item_id === 'undefined' || item.list_item_id === null) { console.warn("[ListDetail] Skipping rendering invalid list item:", item); return null; } // Add null check
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

      {/* Quick Look Modal - *** FIX: Replace comment with actual component *** */}
      {isQuickLookOpen && quickLookItem && (
          <ItemQuickLookModal
              isOpen={isQuickLookOpen}
              onClose={closeQuickLook}
              item={quickLookItem} // Pass item { id, type, name }
          />
      )}
    </div> // End Page Container div
  ); // End return
}; // End Component Function

export default ListDetail;