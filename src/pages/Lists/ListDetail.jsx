/* src/pages/Lists/ListDetail.jsx */
import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/Button';
import { Loader2, Trash2, SortAsc, SortDesc, Eye, Edit, MapPin } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';
import useAuthStore from '@/stores/useAuthStore';
import FollowButton from '@/components/FollowButton';
import { listService } from '@/services/listService';
// Removed shallow import as we will use individual selectors

// Fetcher function for React Query - USE SERVICE
const fetchListDetails = async (listId) => {
    // console.log(`[fetchListDetails] Fetching list details for ID: ${listId} via service`);
    if (!listId) throw new Error('List ID is required');
    const data = await listService.getListDetails(listId);
    // console.log(`[fetchListDetails] Received data for list ${listId}:`, data);
    return data || {};
};

const ListDetail = memo(() => {
    const { id: listId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // --- Zustand Store State ---
    // Select individual state pieces to prevent unnecessary re-renders
    const removeFromList = useUserListStore(state => state.removeFromList);
    const isRemovingItem = useUserListStore(state => state.isRemovingItem); // ID of item being removed, or null
    const listStoreError = useUserListStore(state => state.error);
    const clearError = useUserListStore(state => state.clearError); // Stable function reference

    // Select individual state pieces from AuthStore
    const currentUserId = useAuthStore(state => state.user?.id); // Select only the ID
    const isAuthenticated = useAuthStore(state => state.isAuthenticated); // Primitive, safe
    // --- End Zustand Store State ---


    // Local UI state
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedItem, setSelectedItem] = useState(null);
    const [localError, setLocalError] = useState(''); // For errors specific to this component's actions (if any)

    // --- Effects ---
     useEffect(() => {
         // Cleanup function: Clear local error and potentially store error on unmount/list change
         return () => {
             setLocalError('');
             clearError?.(); // Call clearError if it exists
         };
     }, [listId, clearError]); // Depend on listId and the clearError function reference

    // Fetch list details using React Query
    const { data: list, isLoading, isError, error: queryError, refetch } = useQuery({
        queryKey: ['listDetails', listId],
        queryFn: () => fetchListDetails(listId),
        // Enable only if listId exists and user is authenticated (needed for owner/follow checks)
        enabled: !!listId && isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Determine ownership and follow button visibility using selected state
    const isOwner = useMemo(() => list?.user_id === currentUserId, [list?.user_id, currentUserId]); // Depend on primitive IDs
    const showFollow = isAuthenticated && !!list?.id && !isOwner; // Depend on primitive/boolean values

    // Handler to remove an item
    const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
        // Make sure isOwner check uses the memoized value
        if (!isOwner || !listId) return;
        setLocalError(''); // Clear local error first
        clearError?.(); // Clear store error
        try {
            // Pass listId and listItemIdToRemove to the store action
            await removeFromList(listId, listItemIdToRemove);
            // Invalidation is handled by the store action
            // console.log(`[ListDetail] Item removal triggered for list_item_id: ${listItemIdToRemove}`);
        } catch (err) {
            console.error(`[ListDetail] Error removing item ${listItemIdToRemove}:`, err);
            // Error state is set in the Zustand store action, no need to set localError here
            // setLocalError(err.message || 'Failed to remove item.'); // Avoid setting local error if store handles it
        }
    }, [listId, isOwner, removeFromList, clearError]); // Dependencies: stable functions and primitives/memoized values

    // Memoized sorting of list items
    const sortedItems = useMemo(() => {
        if (!list?.items) return [];
        // Filter items that have a valid name for sorting
        const validItems = list.items.filter(item => item && typeof item.name === 'string');
        // Create a new sorted array
        return [...validItems].sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
    }, [list?.items, sortOrder]); // Dependencies: items array reference and sortOrder state

    // --- Render Logic ---
    if (isLoading) {
        return ( <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div> );
    }

    if (isError) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-6">
                <ErrorMessage
                    message={queryError?.message || 'Failed to load list details.'}
                    onRetry={refetch}
                    isLoadingRetry={isLoading}
                    containerClassName="mt-6"
                >
                     <Button onClick={() => navigate('/lists')} variant="secondary" size="sm" className="mt-2">Back to My Lists</Button>
                 </ErrorMessage>
            </div>
        );
    }

    if (!list || !list.id) {
        // This case handles not found or potential access issues not caught by fetcher
        return (
            <div className="max-w-4xl mx-auto px-4 py-6">
                <p className="text-center text-gray-500 py-6">List not found or you may not have access.</p>
                 <div className="text-center">
                     <Button onClick={() => navigate('/lists')} variant="secondary" size="sm">Back to My Lists</Button>
                 </div>
            </div>
        );
    }

    // Display store error OR local error
    const displayError = localError || listStoreError;
    const itemCount = list.item_count ?? sortedItems.length; // Use item_count from data if available

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
             <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4">
                 ← Back
             </Button>

            {/* List Header */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                        {list.name || 'Unnamed List'}
                    </h1>
                     <div className='flex-shrink-0'>
                        {isOwner && ( <Button variant="tertiary" size="sm" onClick={() => alert('Edit list not implemented.')}> <Edit size={16} className="mr-1" /> Edit </Button> )}
                        {/* Pass memoized showFollow value */}
                        {showFollow && ( <FollowButton listId={list.id} isFollowing={list.is_following ?? false} className="w-auto" /> )}
                    </div>
                </div>
                {list.description && ( <p className="text-gray-600 text-sm mb-3">{list.description}</p> )}
                <div className="flex items-center flex-wrap text-gray-500 text-xs gap-x-3 gap-y-1">
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{list.saved_count || 0} saves</span>
                     <span className="hidden sm:inline">•</span>
                    <span>{list.is_public ? 'Public' : 'Private'}</span>
                     {list.creator_handle && <span>by @{list.creator_handle}</span>}
                     {list.city && <span className="hidden sm:inline">•</span>}
                     {list.city && ( <span className="flex items-center"> <MapPin size={12} className="mr-0.5 text-gray-400" /> {list.city} </span> )}
                </div>
                 {Array.isArray(list.tags) && list.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {list.tags.map(tag => ( <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">#{tag}</span> ))}
                    </div>
                 )}
            </div>

             {displayError && ( <div className="mb-4"> <ErrorMessage message={displayError} /> </div> )}

            {/* Items Section Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Items</h2>
                {sortedItems.length > 1 && (
                     <div className="flex gap-1">
                        <Button variant="tertiary" size="sm" onClick={() => setSortOrder('asc')} className={`text-gray-600 ${sortOrder === 'asc' ? 'bg-gray-200' : ''}`} aria-pressed={sortOrder === 'asc'} title="Sort A-Z" > <SortAsc size={16} /> </Button>
                        <Button variant="tertiary" size="sm" onClick={() => setSortOrder('desc')} className={`text-gray-600 ${sortOrder === 'desc' ? 'bg-gray-200' : ''}`} aria-pressed={sortOrder === 'desc'} title="Sort Z-A" > <SortDesc size={16} /> </Button>
                    </div>
                )}
            </div>

            {/* Items List */}
            {sortedItems.length > 0 ? (
                <ul className="space-y-3">
                    {sortedItems.map((item) => {
                         if (!item || !item.list_item_id) { console.warn("[ListDetail] Skipping invalid item:", item); return null; }
                         // Use the store state 'isRemovingItem' to check if THIS item is being processed
                         const isRemovingThisItem = isRemovingItem === item.list_item_id;
                         const itemLink = item.id && item.item_type ? `/${item.item_type}/${item.id}` : null;

                        return (
                            <li key={item.list_item_id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md gap-2" >
                                {itemLink ? (
                                    <Link to={itemLink} className='flex-grow min-w-0 hover:text-[#A78B71] transition-colors'>
                                        <h3 className="text-base font-medium truncate">{item.name || `Item ${item.id}`}</h3>
                                        {item.item_type === 'dish' && item.restaurant_name && ( <p className="text-sm text-gray-500 truncate">at {item.restaurant_name}</p> )}
                                        {(item.city || item.neighborhood) && ( <p className="text-xs text-gray-400 truncate">{item.neighborhood || item.city}</p> )}
                                    </Link>
                                ) : (
                                    <div className='flex-grow min-w-0'>
                                        <h3 className="text-base font-medium truncate">{item.name || `Item ${item.id}`}</h3>
                                        {item.item_type === 'dish' && item.restaurant_name && ( <p className="text-sm text-gray-500 truncate">at {item.restaurant_name}</p> )}
                                        {(item.city || item.neighborhood) && ( <p className="text-xs text-gray-400 truncate">{item.neighborhood || item.city}</p> )}
                                    </div>
                                )}
                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                    {item.id && item.item_type && (
                                        <Button variant="tertiary" size="sm" onClick={() => setSelectedItem(item)} className="text-gray-600 hover:text-[#A78B71]" aria-label={`Quick look at ${item.name}`} title="Quick Look" > <Eye size={16} /> </Button>
                                    )}
                                    {/* Use memoized isOwner value */}
                                    {isOwner && (
                                        <Button variant="tertiary" size="sm" onClick={() => handleRemoveItem(item.list_item_id)}
                                            // Disable if *any* item is currently being removed (using isRemovingItem state)
                                            disabled={isRemovingItem !== null}
                                            className={`text-red-500 hover:text-red-700 ${isRemovingItem !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            aria-label={`Remove ${item.name}`} title="Remove Item"
                                        >
                                            {/* Show spinner only if *this* item is being removed */}
                                            {isRemovingThisItem ? ( <Loader2 className="h-4 w-4 animate-spin" /> ) : ( <Trash2 size={16} /> )}
                                        </Button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-gray-500 text-center py-6">No items in this list yet.</p>
            )}

            {/* Item Quick Look Modal */}
            {selectedItem && selectedItem.id && selectedItem.item_type && (
                <ItemQuickLookModal
                    item={{ id: selectedItem.id, type: selectedItem.item_type, name: selectedItem.name }}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
});

export default ListDetail;