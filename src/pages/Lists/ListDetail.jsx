// src/pages/Lists/ListDetail.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Instagram, Share2, Eye, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';
import ItemQuickLookModal from '../../components/ItemQuickLookModal';
import Button from '@/components/Button';
import { API_BASE_URL } from '@/config';

const ListDetail = () => {
  const { id: listId } = useParams();

  // Use individual selectors to avoid creating a new object
  const userLists = useAppStore(state => state.userLists);
  const fetchUserLists = useAppStore(state => state.fetchUserLists);
  const updateListVisibility = useAppStore(state => state.updateListVisibility);
  const removeFromList = useAppStore(state => state.removeFromList);
  const isLoadingUserLists = useAppStore(state => state.isLoadingUserLists);

  const [listDetails, setListDetails] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [error, setError] = useState(null);
  const [sortMethod, setSortMethod] = useState('default');
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [quickLookItem, setQuickLookItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const hasFetchedRef = useRef(false);

  const fetchListAndItems = useCallback(async () => {
    if (!listId || isNaN(parseInt(listId))) {
      console.log("[ListDetail] Invalid listId:", listId);
      setError("No valid List ID provided.");
      setIsLoadingDetails(false);
      return;
    }

    if (hasFetchedRef.current) {
      console.log("[ListDetail] Fetch already in progress or completed for listId:", listId);
      return;
    }

    hasFetchedRef.current = true;
    console.log(`[ListDetail] Fetching details & items for list ID: ${listId}`);
    setIsLoadingDetails(true);
    setError(null);
    setListDetails(null);
    setListItems([]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[ListDetail] Fetch response status:", response.status);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to fetch list details (${response.status})`);
      }
      const data = await response.json();
      console.log("[ListDetail] Received data:", data);

      if (!data || typeof data !== 'object') {
        throw new Error("Invalid list data received from server.");
      }
      const { items, ...details } = data;
      setListDetails({
        id: details.id,
        name: details.name || "Unnamed List",
        is_public: details.is_public ?? true,
        created_by_user: details.created_by_user ?? false,
        item_count: details.item_count ?? (Array.isArray(items) ? items.length : 0),
        creator_handle: details.creator_handle || "@user",
      });
      setListItems(Array.isArray(items) ? items.map(item => ({
        list_item_id: item.list_item_id,
        item_id: item.item_id,
        item_type: item.item_type,
        name: item.name || "Unnamed Item",
        restaurant_name: item.restaurant_name,
        neighborhood: item.neighborhood,
        city: item.city,
        tags: Array.isArray(item.tags) ? item.tags : [],
      })) : []);
    } catch (err) {
      console.error(`[ListDetail] Error fetching list ${listId}:`, err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again later.');
      } else {
        setError(err.message || 'Could not load list.');
      }
    } finally {
      setIsLoadingDetails(false);
      hasFetchedRef.current = false;
    }
  }, [listId]);

  useEffect(() => {
    fetchListAndItems();
  }, [fetchListAndItems]);

  const openQuickLook = useCallback((item) => {
    if (item && item.item_id && item.item_type && item.name) {
      setQuickLookItem({ id: item.item_id, type: item.item_type, name: item.name });
      setIsQuickLookOpen(true);
      console.log(`[ListDetail] Opening Quick Look for ${item.item_type} ID: ${item.item_id}`);
    } else {
      console.warn("[ListDetail] Quick Look cannot be opened: Invalid item data", item);
      alert("Cannot open Quick Look: Item data is incomplete.");
    }
  }, []);

  const closeQuickLook = useCallback(() => {
    setIsQuickLookOpen(false);
    setQuickLookItem(null);
    console.log("[ListDetail] Closing Quick Look");
  }, []);

  const handleToggleVisibility = useCallback(async () => {
    if (!listDetails) return;
    const currentVisibility = listDetails.is_public;
    const newVisibility = !currentVisibility;
    setListDetails(prev => prev ? { ...prev, is_public: newVisibility } : null);
    try {
      await updateListVisibility(listDetails.id, newVisibility);
      console.log(`[ListDetail] Visibility updated for list ${listDetails.id}`);
    } catch (error) {
      console.error(`[ListDetail] Error toggling visibility:`, error);
      setListDetails(prev => prev ? { ...prev, is_public: currentVisibility } : null);
      alert(`Failed to update visibility: ${error.message}`);
    }
  }, [listDetails, updateListVisibility]);

  const handleRemoveItem = useCallback(async (listItemId) => {
    if (!listId || !listItemId || isDeleting) return;
    if (!confirm("Are you sure you want to remove this item from the list?")) return;

    console.log(`[ListDetail] Attempting remove listItemId ${listItemId} from listId ${listId}`);
    setIsDeleting(listItemId);
    setError(null);

    try {
      await removeFromList(Number(listId), listItemId);
      setListItems(prev => prev.filter(item => item.list_item_id !== listItemId));
      setListDetails(prev => prev ? { ...prev, item_count: Math.max(0, (prev.item_count || 1) - 1) } : null);
      console.log(`[ListDetail] Successfully removed item ${listItemId}`);
    } catch (error) {
      console.error(`[ListDetail] Failed to remove item ${listItemId}:`, error);
      setError(`Failed to remove item: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  }, [listId, removeFromList, isDeleting]);

  const getSortedItems = useCallback(() => {
    if (!Array.isArray(listItems)) return [];
    const itemsToSort = [...listItems];
    try {
      switch (sortMethod) {
        case 'a-z': return itemsToSort.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
        case 'z-a': return itemsToSort.sort((a, b) => (b?.name || "").localeCompare(a?.name || ""));
        default: return itemsToSort;
      }
    } catch (error) {
      console.error('[ListDetail] Error sorting items:', error);
      return itemsToSort;
    }
  }, [listItems, sortMethod]);

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

  if (error) {
    return (
      <div className="text-center py-10 max-w-lg mx-auto px-4">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 mb-4">{error}</p>
        <div className="space-y-2">
          <Button onClick={fetchListAndItems} variant="primary" size="sm">Retry</Button>
          <div>
            <Link to="/lists" className="text-[#D1B399] hover:underline">Back to My Lists</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!listDetails) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">List not found.</p>
        <Link to="/lists" className="text-[#D1B399] hover:underline">Back to My Lists</Link>
      </div>
    );
  }

  const sortedItems = getSortedItems();
  const listIsPublic = listDetails.is_public;
  const canEdit = listDetails.created_by_user;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors">
        <ChevronLeft size={20} className="mr-1" /> Back to lists
      </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{listDetails.name}</h1>
        <p className="text-gray-600 mb-4">{sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}</p>
        {sortedItems.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={() => setSortMethod('default')} variant={sortMethod === 'default' ? 'primary' : 'tertiary'} size="sm" className="rounded-full">Default</Button>
            <Button onClick={() => setSortMethod('a-z')} variant={sortMethod === 'a-z' ? 'primary' : 'tertiary'} size="sm" className="rounded-full">A-Z</Button>
            <Button onClick={() => setSortMethod('z-a')} variant={sortMethod === 'z-a' ? 'primary' : 'tertiary'} size="sm" className="rounded-full">Z-A</Button>
          </div>
        )}
        {canEdit && (
          <div className="pt-4 flex items-center flex-wrap gap-x-4 gap-y-2">
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
            <div className='flex gap-2'>
              <button title="Share List (Placeholder)" className="p-2 bg-[#D1B399] text-white rounded-full hover:bg-[#b89e89] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!listIsPublic}><Share2 size={20} /></button>
              <a href="https://instagram.com" title="Share on Instagram (Placeholder)" target="_blank" rel="noopener noreferrer" className={`p-2 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors ${!listIsPublic ? 'opacity-50 pointer-events-none' : ''}`}><Instagram size={20} /></a>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => {
            if (!item || !item.list_item_id) {
              console.warn("Skipping rendering invalid list item:", item);
              return null;
            }
            const isDeletingThis = isDeleting === item.list_item_id;
            return (
              <div
                key={item.list_item_id}
                className={`relative bg-white rounded-xl border border-[#D1B399]/20 p-4 flex items-center justify-between transition-all duration-150 ${isDeletingThis ? 'opacity-50' : 'hover:border-[#D1B399] hover:bg-[#D1B399]/5'}`}
                aria-busy={isDeletingThis}
              >
                <button
                  onClick={() => openQuickLook(item)}
                  className="flex-grow text-left focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1 rounded-md mr-4"
                  aria-label={`View details for ${item.name}`}
                  disabled={isDeletingThis}
                >
                  <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                  {item.item_type === 'dish' && item.restaurant_name && <p className="text-sm text-gray-600">at {item.restaurant_name}</p>}
                  {item.item_type === 'restaurant' && item.neighborhood && <p className="text-sm text-gray-600">{item.neighborhood}, {item.city}</p>}
                  <p className="text-xs text-gray-400 capitalize mt-1">({item.item_type})</p>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(item.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="hidden sm:inline-block px-2 py-0.5 border border-[#D1B399] rounded-full text-xs text-gray-600 whitespace-nowrap">#{tag}</span>
                  ))}
                  <button onClick={() => openQuickLook(item)} className="p-1 text-[#D1B399] hover:text-[#a88a72]" title="Quick Look" disabled={isDeletingThis}>
                    <Eye size={18} />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveItem(item.list_item_id)}
                      className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50"
                      title="Remove item"
                      disabled={isDeletingThis}
                    >
                      {isDeletingThis ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm">
            <p className="text-gray-500">This list is empty.</p>
          </div>
        )}
      </div>
      {isQuickLookOpen && quickLookItem && (
        <ItemQuickLookModal isOpen={isQuickLookOpen} onClose={closeQuickLook} item={quickLookItem} />
      )}
    </div>
  );
};

export default ListDetail;