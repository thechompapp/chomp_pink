// src/pages/Lists/ListDetail.jsx (Refactored for separate item fetching)
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Instagram, Share2, Eye, Trash2, Loader2, AlertTriangle } from 'lucide-react'; // Added Trash2, Loader2, AlertTriangle
import useAppStore from '../../hooks/useAppStore';
import ItemQuickLookModal from '../../components/ItemQuickLookModal';
import Button from '@/components/Button'; // Import Button
import { API_BASE_URL } from '@/config'; // Import API base URL

const ListDetail = () => {
  const { id: listId } = useParams(); // Rename id to listId for clarity

  // Zustand state and actions
  const { userLists, fetchUserLists, updateListVisibility, removeFromList, isLoadingUserLists } = useAppStore(state => ({
      userLists: state.userLists,
      fetchUserLists: state.fetchUserLists,
      updateListVisibility: state.updateListVisibility,
      removeFromList: state.removeFromList,
      isLoadingUserLists: state.isLoadingUserLists, // Loading state for lists themselves
  }));

  // Local state
  const [listDetails, setListDetails] = useState(null); // Holds details like name, is_public etc.
  const [listItems, setListItems] = useState([]); // Holds the actual items (dishes/restaurants)
  const [isLoadingDetails, setIsLoadingDetails] = useState(true); // Loading state for list details AND items
  const [error, setError] = useState(null); // Error state for fetching
  const [sortMethod, setSortMethod] = useState('default'); // 'default' (added_at DESC), 'a-z', 'z-a'
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [quickLookItem, setQuickLookItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null); // Track which item is being deleted

  // Fetch list details and items when component mounts or listId changes
  useEffect(() => {
    const fetchListAndItems = async () => {
      if (!listId) {
          setError("No List ID provided.");
          setIsLoadingDetails(false);
          return;
      }
      console.log(`[ListDetail] Fetching details & items for list ID: ${listId}`);
      setIsLoadingDetails(true);
      setError(null);
      setListDetails(null); // Clear previous details
      setListItems([]); // Clear previous items

      try {
          // Fetch list details and items from the updated API endpoint
          const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`);
          if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.error || `Failed to fetch list details (${response.status})`);
          }
          const data = await response.json();
          console.log("[ListDetail] Received data:", data);

          // Separate list details from items
          const { items, ...details } = data;
          setListDetails({ ...details, is_following: details.is_following ?? false });
          setListItems(Array.isArray(items) ? items : []); // Set the fetched items

      } catch (err) {
          console.error(`[ListDetail] Error fetching list ${listId}:`, err);
          setError(err.message || 'Could not load list.');
      } finally {
          setIsLoadingDetails(false);
      }
    };

    fetchListAndItems();
  }, [listId]); // Re-fetch when listId changes

  // Open Quick Look modal
   const openQuickLook = useCallback((item) => {
       // item here is an object from the listItems array fetched from the API
       // It should have item_id and item_type directly
       if (item && item.item_id && item.item_type && item.name) {
          setQuickLookItem({ id: item.item_id, type: item.item_type, name: item.name });
          setIsQuickLookOpen(true);
          console.log(`[ListDetail] Opening Quick Look for ${item.item_type} ID: ${item.item_id}`);
       } else {
           console.warn("[ListDetail] Quick Look cannot be opened: Invalid item data", item);
           alert("Cannot open Quick Look: Item data is incomplete.");
       }
   }, []); // No dependencies needed

   // Close Quick Look modal
  const closeQuickLook = useCallback(() => {
    setIsQuickLookOpen(false);
    setQuickLookItem(null);
    console.log("[ListDetail] Closing Quick Look");
  }, []);

  // Toggle list visibility (public/private)
  const handleToggleVisibility = useCallback(async () => {
    if (!listDetails) return;
    const currentVisibility = listDetails.is_public;
    const newVisibility = !currentVisibility;
    // Optimistic update in local state
    setListDetails(prevDetails => prevDetails ? { ...prevDetails, is_public: newVisibility } : null);
    try {
      await updateListVisibility(listDetails.id, newVisibility);
      console.log(`[ListDetail] Visibility updated for list ${listDetails.id}`);
    } catch (error) {
      console.error(`[ListDetail] Error toggling visibility:`, error);
      // Rollback local state on error
      setListDetails(prevDetails => prevDetails ? { ...prevDetails, is_public: currentVisibility } : null);
      alert(`Failed to update visibility: ${error.message}`);
    }
  }, [listDetails, updateListVisibility]);

  // Handle removing an item from the list
  const handleRemoveItem = useCallback(async (listItemId) => {
     if (!listId || !listItemId || isDeleting) return; // Prevent concurrent deletes

      // Ask for confirmation
     if (!confirm("Are you sure you want to remove this item from the list?")) {
         return;
     }

     console.log(`[ListDetail] Attempting remove listItemId ${listItemId} from listId ${listId}`);
     setIsDeleting(listItemId); // Set loading state for this specific item
     setError(null); // Clear previous errors

     try {
         await removeFromList(Number(listId), listItemId); // Call store action
         // Optimistic UI update (remove item from local state)
         setListItems(prevItems => prevItems.filter(item => item.list_item_id !== listItemId));
         // Update item count in listDetails (or rely on parent list potentially re-fetching)
          setListDetails(prev => prev ? {...prev, item_count: Math.max(0, (prev.item_count || 1) - 1)} : null);
         console.log(`[ListDetail] Successfully removed item ${listItemId}`);
     } catch (error) {
         console.error(`[ListDetail] Failed to remove item ${listItemId}:`, error);
         setError(`Failed to remove item: ${error.message}`);
         // Rollback handled within removeFromList action in store
     } finally {
         setIsDeleting(null); // Clear loading state
     }
  }, [listId, removeFromList, isDeleting]);


  // Sort items based on local state
  const getSortedItems = useCallback(() => {
    if (!Array.isArray(listItems)) return [];
    const itemsToSort = [...listItems];
    try {
      switch (sortMethod) {
        case 'a-z': return itemsToSort.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
        case 'z-a': return itemsToSort.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
        default: return itemsToSort; // Default is likely 'added_at DESC' from API
      }
    } catch (error) {
      console.error('[ListDetail] Error sorting items:', error);
      return itemsToSort; // Return unsorted on error
    }
  }, [listItems, sortMethod]);

  // --- Render Logic ---

  // Loading State
  if (isLoadingDetails) {
      return (
         <div className="flex justify-center items-center h-[calc(100vh-100px)]">
              <div className="text-center text-gray-500">
                 <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                 Loading list...
              </div>
         </div>
     );
  }

   // Error State
  if (error) {
       return (
         <div className="text-center py-10 max-w-lg mx-auto px-4">
              <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3"/>
              <p className="text-red-600 mb-4">{error}</p>
              <Link to="/lists" className="text-[#D1B399] hover:underline">Back to My Lists</Link>
          </div>
      );
  }

  // List Not Found (after loading and no error)
  if (!listDetails) {
       return (
         <div className="text-center py-10">
              <p className="text-gray-500">List not found.</p>
              <Link to="/lists" className="text-[#D1B399] hover:underline">Back to My Lists</Link>
          </div>
       );
  }

  // Main Render (with listDetails and sortedItems)
  const sortedItems = getSortedItems();
  const listIsPublic = listDetails.is_public;
  const canEdit = listDetails.created_by_user; // Determine if user owns the list (needed for delete button)

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      {/* Back Link */}
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors">
          <ChevronLeft size={20} className="mr-1" /> Back to lists
      </Link>

      {/* List Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{listDetails.name || "Unnamed List"}</h1>
        <p className="text-gray-600 mb-4">{sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}</p>

        {/* Sorting Controls */}
        {sortedItems.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={() => setSortMethod('default')} variant={sortMethod === 'default' ? 'primary' : 'tertiary'} size="sm" className="rounded-full">Default</Button>
            <Button onClick={() => setSortMethod('a-z')} variant={sortMethod === 'a-z' ? 'primary' : 'tertiary'} size="sm" className="rounded-full">A-Z</Button>
            <Button onClick={() => setSortMethod('z-a')} variant={sortMethod === 'z-a' ? 'primary' : 'tertiary'} size="sm" className="rounded-full">Z-A</Button>
          </div>
        )}

         {/* Visibility Toggle & Share (only if user created list) */}
        {canEdit && (
          <div className="pt-4 flex items-center flex-wrap gap-x-4 gap-y-2">
             {/* Visibility Toggle */}
             <div className="flex items-center">
               <label htmlFor="togglePublic" className="flex items-center cursor-pointer mr-2">
                 <div className="relative">
                   <input type="checkbox" id="togglePublic" checked={listIsPublic} onChange={handleToggleVisibility} className="sr-only peer" />
                   <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div>
                   <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div>
                 </div>
               </label>
               <span className="text-sm text-gray-700 select-none">{listIsPublic ? 'Public' : 'Private'}</span>
             </div>
             {/* Share Buttons (Placeholder actions) */}
             <div className='flex gap-2'>
                 <button title="Share List (Placeholder)" className="p-2 bg-[#D1B399] text-white rounded-full hover:bg-[#b89e89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!listIsPublic}><Share2 size={20} /></button>
                 <a href="https://instagram.com" title="Share on Instagram (Placeholder)" target="_blank" rel="noopener noreferrer" className={`p-2 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors ${!listIsPublic ? 'opacity-50 pointer-events-none' : ''}`}><Instagram size={20} /></a>
             </div>
          </div>
        )}
      </div>

      {/* List Items */}
      <div className="space-y-4">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => {
             // item object now comes from the API join, includes list_item_id
             if (!item || !item.list_item_id) {
                 console.warn("Skipping rendering invalid list item:", item);
                 return null; // Skip rendering invalid item
             }
             const isDeletingThis = isDeleting === item.list_item_id;

             return (
                <div
                  key={item.list_item_id} // Use unique ID from ListItems table
                  className={`relative bg-white rounded-xl border border-[#D1B399]/20 p-4 flex items-center justify-between transition-all duration-150 ${isDeletingThis ? 'opacity-50' : 'hover:border-[#D1B399] hover:bg-[#D1B399]/5'}`}
                  aria-busy={isDeletingThis}
                >
                  {/* Item Info & Quick Look Button */}
                  <button
                     onClick={() => openQuickLook(item)}
                     className="flex-grow text-left focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1 rounded-md mr-4" // Added margin right
                     aria-label={`View details for ${item.name || 'Unnamed Item'}`}
                     disabled={isDeletingThis}
                   >
                    <h3 className="text-lg font-medium text-gray-900">{item.name || "Unnamed Item"}</h3>
                    {item.item_type === 'dish' && item.restaurant_name && <p className="text-sm text-gray-600">at {item.restaurant_name}</p>}
                    {item.item_type === 'restaurant' && item.neighborhood && <p className="text-sm text-gray-600">{item.neighborhood}, {item.city}</p>}
                    <p className="text-xs text-gray-400 capitalize mt-1">({item.item_type})</p>
                   </button>

                  {/* Tags & Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Display Tags */}
                     {(item.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="hidden sm:inline-block px-2 py-0.5 border border-[#D1B399] rounded-full text-xs text-gray-600 whitespace-nowrap">#{tag}</span>
                     ))}
                     {/* Quick Look Icon */}
                     <button onClick={() => openQuickLook(item)} className="p-1 text-[#D1B399] hover:text-[#a88a72]" title="Quick Look" disabled={isDeletingThis}>
                        <Eye size={18} />
                     </button>
                     {/* Delete Button (only if user owns list) */}
                     {canEdit && (
                         <button
                            onClick={() => handleRemoveItem(item.list_item_id)}
                            className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Remove item"
                            disabled={isDeletingThis}
                         >
                            {isDeletingThis ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
                          </button>
                     )}
                  </div>
                </div>
             );
          })
        ) : (
            // Empty State Message
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
                 <p className="text-gray-500">This list is empty.</p>
                 {/* TODO: Add a button/link to discover/add items? */}
            </div>
        )}
      </div>

      {/* Quick Look Modal */}
      {isQuickLookOpen && quickLookItem && (
          <ItemQuickLookModal isOpen={isQuickLookOpen} onClose={closeQuickLook} item={quickLookItem} />
      )}
    </div>
  );
};
export default ListDetail;