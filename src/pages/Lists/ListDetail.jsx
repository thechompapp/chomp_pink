// src/pages/Lists/ListDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Instagram, MapPin, Share2, Globe, Eye } from 'lucide-react';
import useAppStore from '../../hooks/useAppStore';
// Import the modal component (ensure you create this file)
import ItemQuickLookModal from '../../components/ItemQuickLookModal';

const ListDetail = () => {
  const { id } = useParams();
  const { userLists, fetchUserLists, updateListVisibility } = useAppStore(); // Assuming updateListVisibility exists and works
  const [list, setList] = useState(null);
  const [sortMethod, setSortMethod] = useState('default');
  const [isQuickLookOpen, setIsQuickLookOpen] = useState(false);
  const [quickLookItem, setQuickLookItem] = useState(null);

  useEffect(() => {
    if (!userLists.find(l => String(l.id) === String(id))) {
        console.log(`[ListDetail] List ${id} not in store or store empty, fetching...`);
        fetchUserLists();
    }
  }, [id, fetchUserLists, userLists]);

  useEffect(() => {
    try {
      const foundList = userLists.find(l => String(l.id) === String(id));
      if (foundList) {
        console.log(`[ListDetail] Found list ${id} in store:`, foundList);
        setList({ ...foundList, items: Array.isArray(foundList.items) ? foundList.items : [] });
      } else {
        if (useAppStore.getState().isLoadingUserLists) {
             setList(null);
        } else {
            console.warn(`[ListDetail] List ${id} not found even after potential fetch.`);
            setList(null);
        }
      }
    } catch (error) {
      console.error(`[ListDetail] Error processing list ${id}:`, error);
      setList(null);
    }
  }, [id, userLists]);

  const openQuickLook = (item) => {
    const itemId = item?.id || item?.dishId || item?.restaurantId;
    let itemType = item?.type;
    if (!itemType) {
        if (item?.restaurant) itemType = 'dish';
        else if (item?.neighborhood) itemType = 'restaurant';
    }

    if (item && itemId && itemType) {
       setQuickLookItem({ id: itemId, type: itemType, name: item.name });
       setIsQuickLookOpen(true);
       console.log(`[ListDetail] Opening Quick Look for ${itemType} ID: ${itemId}`);
    } else {
        console.warn("[ListDetail] Quick Look cannot be opened: Invalid item data", item);
        alert("Cannot open Quick Look: Item data is incomplete.");
    }
  };

  const closeQuickLook = () => {
    setIsQuickLookOpen(false);
    setQuickLookItem(null);
    console.log("[ListDetail] Closing Quick Look");
  };

  const handleToggleVisibility = async () => {
    if (!list) return;
    const currentVisibility = list.is_public;
    const newVisibility = !currentVisibility;
    setList(prevList => prevList ? { ...prevList, is_public: newVisibility } : null);
    try {
      await updateListVisibility(list.id, newVisibility); // Assumes this function exists and works
      console.log(`[ListDetail] Visibility updated for list ${list.id}`);
    } catch (error) {
      console.error(`[ListDetail] Error toggling visibility:`, error);
      setList(prevList => prevList ? { ...prevList, is_public: currentVisibility } : null); // Rollback
      alert(`Failed to update visibility: ${error.message}`);
    }
  };

  const getSortedItems = () => {
    if (!list || !Array.isArray(list.items)) return [];
    const itemsToSort = [...list.items];
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
  };

  // Loading / Not Found States
  if (list === null && useAppStore.getState().isLoadingUserLists) {
      return <div className="flex justify-center items-center h-screen"><div className="animate-pulse text-[#D1B399]">Loading List...</div></div>;
  }
  if (list === null) {
      return <div className="text-center py-10"><p className="text-red-500">List not found.</p><Link to="/lists" className="text-[#D1B399] hover:underline">Back to My Lists</Link></div>;
  }

  const sortedItems = getSortedItems();
  const listIsPublic = list.is_public !== undefined ? list.is_public : true;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-12">
      <Link to="/lists" className="inline-flex items-center text-gray-600 hover:text-[#D1B399] my-4 transition-colors"> <ChevronLeft size={20} className="mr-1" /> Back to lists </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{list.name || "Unnamed List"}</h1>
        <p className="text-gray-600 mb-4">{sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}</p>
        {sortedItems.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setSortMethod('a-z')} className={`px-3 py-1 rounded-full text-sm font-medium ${sortMethod === 'a-z' ? 'bg-[#D1B399] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#D1B399]/10'}`}>A-Z</button>
            <button onClick={() => setSortMethod('z-a')} className={`px-3 py-1 rounded-full text-sm font-medium ${sortMethod === 'z-a' ? 'bg-[#D1B399] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#D1B399]/10'}`}>Z-A</button>
          </div>
        )}
        {list.created_by_user && (
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
            <button title="Share List (Placeholder)" className="p-2 bg-[#D1B399] text-white rounded-full hover:bg-[#b89e89] transition-colors disabled:opacity-50" disabled={!listIsPublic}><Share2 size={20} /></button>
            <a href="https://instagram.com" title="Share on Instagram (Placeholder)" target="_blank" rel="noopener noreferrer" className={`p-2 bg-[#D1B399]/10 text-[#D1B399] rounded-full hover:bg-[#D1B399]/20 transition-colors ${!listIsPublic ? 'opacity-50 pointer-events-none' : ''}`}><Instagram size={20} /></a>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {sortedItems.length > 0 ? (
          sortedItems.map((item, index) => {
             // **FIXED KEY:** Generate a unique key based on type and ID
             const itemType = item?.type || (item?.restaurant ? 'dish' : item?.neighborhood ? 'restaurant' : 'unknown');
             const itemId = item?.id || item?.dishId || item?.restaurantId || index;
             const uniqueKey = `${itemType}-${itemId}-${index}`; // Added index for ultimate uniqueness fallback

             return (
                <button
                  key={uniqueKey} // Use the generated unique key
                  onClick={() => openQuickLook(item)}
                  className="w-full text-left bg-white rounded-xl border border-[#D1B399]/20 p-4 flex items-center justify-between hover:border-[#D1B399] hover:bg-[#D1B399]/5 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#D1B399] focus:ring-offset-1"
                  aria-label={`View details for ${item.name || 'Unnamed Item'}`}
                >
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name || "Unnamed Item"}</h3>
                    {itemType === 'dish' && item.restaurant && <p className="text-sm text-gray-600">at {item.restaurant}</p>}
                    {itemType === 'restaurant' && item.neighborhood && <p className="text-sm text-gray-600">{item.neighborhood}, {item.city}</p>}
                    {itemType !== 'unknown' && <p className="text-xs text-gray-400 capitalize mt-1">({itemType})</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {(item.tags || []).slice(0, 2).map(tag => (
                      <span key={tag} className="px-2 py-0.5 border border-[#D1B399] rounded-full text-xs text-gray-600 whitespace-nowrap">#{tag}</span>
                    ))}
                     <Eye size={18} className="text-[#D1B399]" />
                  </div>
                </button>
             );
          })
        ) : ( <div className="text-center py-12 bg-white border border-gray-200 rounded-lg shadow-sm"> <p className="text-gray-500">This list is empty.</p> </div> )}
      </div>
      {isQuickLookOpen && quickLookItem && (
          <ItemQuickLookModal isOpen={isQuickLookOpen} onClose={closeQuickLook} item={quickLookItem} />
      )}
    </div>
  );
};
export default ListDetail;