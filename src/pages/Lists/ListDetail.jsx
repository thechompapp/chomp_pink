// src/pages/Lists/ListDetail.jsx
import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added Link
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient.js';
import Button from '@/components/Button';
import { Loader2, Trash2, SortAsc, SortDesc, Eye, Edit, MapPin } from 'lucide-react'; // Added MapPin
import useUserListStore from '@/stores/useUserListStore';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';
import useAuthStore from '@/stores/useAuthStore';
import FollowButton from '@/components/FollowButton'; // Import FollowButton

// Fetcher function for React Query
const fetchListDetails = async (listId, userId) => { // Pass userId to check ownership/follow status if needed by API
    console.log(`[fetchListDetails] Fetching list details for ID: ${listId}, UserID: ${userId}`);
    if (!listId) throw new Error('List ID is required');
    // The API endpoint might need the userId if it enforces permissions server-side
    const data = await apiClient(`/api/lists/${listId}`, `ListDetail Fetch ${listId}`);
    console.log(`[fetchListDetails] Received data for list ${listId}:`, data);
    // Ensure items array exists and is an array
    return { ...data, items: Array.isArray(data?.items) ? data.items : [] } || {};
};


const ListDetail = memo(() => {
    const { id: listId } = useParams(); // Rename id to listId for clarity
    const navigate = useNavigate(); // Hook for navigation
    const queryClient = useQueryClient(); // Hook for interacting with the cache

    // Zustand store state and actions
    const { removeFromList, isRemovingItem, error: listStoreError, clearError } = useUserListStore(state => ({
         removeFromList: state.removeFromList,
         isRemovingItem: state.isRemovingItem, // ID of item being removed, or null
         error: state.error,
         clearError: state.clearError, // Get clearError action
    }));
    const currentUser = useAuthStore(state => state.user); // Get current user info

    // Local UI state
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc' by name
    const [selectedItem, setSelectedItem] = useState(null); // For QuickLookModal
    const [localError, setLocalError] = useState(''); // Local error for specific actions

     // --- Effects ---
     // Clear local errors when component unmounts or listId changes
     useEffect(() => {
         return () => {
             setLocalError('');
             clearError?.(); // Clear store error as well on unmount
         };
     }, [listId, clearError]);

    // Fetch list details using React Query
    const { data: list, isLoading, isError, error: queryError, refetch } = useQuery({
        queryKey: ['listDetails', listId], // Query key includes listId
        queryFn: () => fetchListDetails(listId, currentUser?.id), // Pass userId for context
        enabled: !!listId && !!currentUser?.id, // Only run if listId and user are available
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Determine if the current user owns this list
    const isOwner = useMemo(() => list?.user_id === currentUser?.id, [list, currentUser]);
    // Determine if follow button should show (not owner, but logged in)
    const showFollow = currentUser?.id && !isOwner;

    // Handler to remove an item from the list
    const handleRemoveItem = useCallback(async (listItemIdToRemove) => { // Rename param for clarity
        if (!isOwner) return;
        setLocalError('');
        clearError?.();
        try {
            // Pass the correct listItemId to the store action
            await removeFromList(listId, listItemIdToRemove);
            // Invalidation handled by store action
            console.log(`[ListDetail] Item removal triggered for list_item_id: ${listItemIdToRemove}`);
        } catch (err) {
            console.error(`[ListDetail] Error removing item ${listItemIdToRemove}:`, err);
            // Error should be set in the Zustand store action, no need to set localError here
        }
    }, [listId, isOwner, removeFromList, queryClient, clearError]); // Dependencies

    // Memoized sorting of list items
    const sortedItems = useMemo(() => {
        if (!list?.items) return [];
        const validItems = list.items.filter(item => item && typeof item.name === 'string');
        return [...validItems].sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
    }, [list?.items, sortOrder]);

    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-6">
                <ErrorMessage
                    message={queryError?.message || 'Failed to load list details'}
                    onRetry={refetch}
                    isLoadingRetry={isLoading}
                    containerClassName="mt-6"
                />
            </div>
        );
    }

    if (!list || !list.id) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-6">
                <p className="text-center text-gray-500 py-6">List not found or you do not have access.</p>
                 <div className="text-center">
                     <Button onClick={() => navigate('/lists')} variant="secondary" size="sm">
                         Back to My Lists
                     </Button>
                 </div>
            </div>
        );
    }

    // Combine local and store errors for display
    const displayError = localError || listStoreError;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
             <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4">
                 &larr; Back
             </Button>

            {/* List Header */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                        {list.name || 'Unnamed List'}
                    </h1>
                     {/* Actions: Edit (owner), Follow (non-owner) */}
                     <div className='flex-shrink-0'>
                        {isOwner && (
                            <Button variant="tertiary" size="sm" onClick={() => alert('Edit list functionality not yet implemented.')}>
                                <Edit size={16} className="mr-1" /> Edit
                            </Button>
                        )}
                        {showFollow && list.id && ( // Only show if not owner and logged in
                            <FollowButton
                                listId={list.id}
                                isFollowing={list.is_following}
                                className="w-auto" // Adjust width if needed
                            />
                        )}
                    </div>
                </div>
                {list.description && (
                    <p className="text-gray-600 text-sm mb-3">{list.description}</p>
                )}
                <div className="flex items-center flex-wrap text-gray-500 text-xs gap-x-3 gap-y-1">
                    <span>{list.item_count ?? sortedItems.length} {list.item_count === 1 ? 'item' : 'items'}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{list.saved_count || 0} saves</span>
                     <span className="hidden sm:inline">•</span>
                    <span>{list.is_public ? 'Public' : 'Private'}</span>
                     {list.creator_handle && <span>by @{list.creator_handle}</span>}
                     {list.city_name && <span className="hidden sm:inline">•</span>}
                     {list.city_name && (
                        <span className="flex items-center">
                            <MapPin size={12} className="mr-0.5 text-gray-400" /> {list.city_name}
                        </span>
                      )}
                </div>
                 {Array.isArray(list.tags) && list.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {list.tags.map(tag => (
                             <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">#{tag}</span>
                        ))}
                    </div>
                 )}
            </div>

             {/* Action/Error Display Area */}
            {displayError && (
                 <div className="mb-4">
                    <ErrorMessage message={displayError} />
                 </div>
            )}

            {/* Items Section Header */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Items</h2>
                {sortedItems.length > 1 && (
                     <div className="flex gap-1">
                        <Button
                            variant="tertiary" size="sm" onClick={() => setSortOrder('asc')}
                            className={`text-gray-600 ${sortOrder === 'asc' ? 'bg-gray-200' : ''}`}
                            aria-pressed={sortOrder === 'asc'} title="Sort A-Z" >
                            <SortAsc size={16} />
                        </Button>
                        <Button
                            variant="tertiary" size="sm" onClick={() => setSortOrder('desc')}
                            className={`text-gray-600 ${sortOrder === 'desc' ? 'bg-gray-200' : ''}`}
                            aria-pressed={sortOrder === 'desc'} title="Sort Z-A" >
                            <SortDesc size={16} />
                        </Button>
                    </div>
                )}
            </div>

            {/* Items List */}
            {sortedItems.length > 0 ? (
                <ul className="space-y-3">
                    {sortedItems.map((item) => {
                         if (!item || !item.list_item_id) { // Use list_item_id for key and removal logic
                              console.warn("[ListDetail] Skipping rendering invalid list item:", item);
                              return null;
                         }
                         // Check if *this* specific item is being removed (using list_item_id)
                         const isRemovingThisItem = isRemovingItem === item.list_item_id;
                         // Create link destination based on item type
                         const itemLink = `/${item.item_type}/${item.id}`;

                        return (
                            <li
                                key={item.list_item_id} // Use unique list_item_id for the key
                                className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md gap-2"
                            >
                                {/* Wrap content in a Link if item type/id exist */}
                                <Link to={itemLink} className='flex-grow min-w-0 hover:text-[#A78B71] transition-colors'>
                                    <h3 className="text-base font-medium truncate">{item.name || `Item ${item.id}`}</h3>
                                    {item.item_type === 'dish' && item.restaurant_name && (
                                        <p className="text-sm text-gray-500 truncate">at {item.restaurant_name}</p>
                                    )}
                                    {/* Optionally add city/neighborhood */}
                                    {(item.city || item.neighborhood) && (
                                        <p className="text-xs text-gray-400 truncate">{item.neighborhood || item.city}</p>
                                    )}
                                </Link>
                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                    {/* Quick Look Button */}
                                    <Button
                                        variant="tertiary" size="sm"
                                        onClick={() => setSelectedItem(item)}
                                        className="text-gray-600 hover:text-[#A78B71]"
                                        aria-label={`Quick look at ${item.name}`} title="Quick Look" >
                                        <Eye size={16} />
                                    </Button>
                                    {/* Remove Button (Only for list owner) */}
                                    {isOwner && (
                                        <Button
                                            variant="tertiary" size="sm"
                                            onClick={() => handleRemoveItem(item.list_item_id)} // Use list_item_id
                                            disabled={isRemovingItem !== null} // Disable if *any* item is being removed
                                            className={`text-red-500 hover:text-red-700 ${isRemovingItem !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            aria-label={`Remove ${item.name}`} title="Remove Item"
                                        >
                                            {/* Show spinner only for the item being removed */}
                                            {isRemovingThisItem ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
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
            {selectedItem && (
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