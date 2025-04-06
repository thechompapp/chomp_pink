// src/pages/Lists/ListDetail.jsx
import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/services/apiClient.js'; // FIXED: Corrected import path
import Button from '@/components/Button';
import { Loader2, Trash2, SortAsc, SortDesc, Eye, Edit } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';
import useAuthStore from '@/stores/useAuthStore'; // Import auth store to check ownership

// Fetcher function for React Query
const fetchListDetails = async (listId, userId) => { // Pass userId to check ownership/access if needed by API
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
         isRemovingItem: state.isRemovingItem,
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
        queryFn: () => fetchListDetails(listId, currentUser?.id), // Pass userId if needed by API
        enabled: !!listId && !!currentUser?.id, // Only run if listId and user are available
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Consider adding placeholderData or initialData if feasible
    });

    // Determine if the current user owns this list
    const isOwner = useMemo(() => list?.user_id === currentUser?.id, [list, currentUser]);

    // Handler to remove an item from the list
    const handleRemoveItem = useCallback(async (listItemId) => {
        if (!isOwner) return; // Should not be possible if button disabled, but good check
        setLocalError(''); // Clear previous local errors
        clearError?.(); // Clear previous store errors
        try {
            await removeFromList(listId, listItemId);
            // Optimistic update handled by Zustand store potentially
            // Invalidation ensures data consistency if store update fails or is delayed
            // No need to call refetch() here if invalidateQueries works
             queryClient.invalidateQueries({ queryKey: ['listDetails', listId] });
             // Also invalidate the main lists query if item count changes
             queryClient.invalidateQueries({ queryKey: ['userLists'] });

            console.log(`[ListDetail] Item ${listItemId} removed triggered.`);
        } catch (err) {
            console.error(`[ListDetail] Error removing item ${listItemId}:`, err);
            // Error should be set in the Zustand store action, display that
            // setLocalError(err.message || 'Failed to remove item.');
        }
    }, [listId, isOwner, removeFromList, queryClient, clearError]); // Add queryClient and clearError

    // Memoized sorting of list items
    const sortedItems = useMemo(() => {
        if (!list?.items) return [];
        // Ensure items are valid before sorting
        const validItems = list.items.filter(item => item && typeof item.name === 'string');
        return [...validItems].sort((a, b) => {
             // Basic alphabetical sort
            return sortOrder === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
            // TODO: Add more sort options (date added, type, etc.) later if needed
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

    // Handle query error state
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

    // Handle case where list data is fetched but is empty/invalid (e.g., not found, access denied by API)
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
            {/* Back Button */}
             <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4">
                 &larr; Back
             </Button>

            {/* List Header */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                        {list.name || 'Unnamed List'}
                    </h1>
                    {/* Edit button for owner */}
                    {isOwner && (
                        <Button variant="tertiary" size="sm" onClick={() => alert('Edit list functionality not yet implemented.')}>
                            <Edit size={16} className="mr-1" /> Edit
                        </Button>
                    )}
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
                </div>
                {/* Optional: Display tags if they exist on the list object */}
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
                {/* Sorting Controls */}
                {sortedItems.length > 1 && ( // Only show sort if multiple items
                     <div className="flex gap-1">
                        <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => setSortOrder('asc')}
                            className={`text-gray-600 ${sortOrder === 'asc' ? 'bg-gray-200' : ''}`}
                            aria-pressed={sortOrder === 'asc'}
                            title="Sort A-Z"
                        >
                            <SortAsc size={16} />
                        </Button>
                        <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => setSortOrder('desc')}
                            className={`text-gray-600 ${sortOrder === 'desc' ? 'bg-gray-200' : ''}`}
                             aria-pressed={sortOrder === 'desc'}
                             title="Sort Z-A"
                        >
                            <SortDesc size={16} />
                        </Button>
                    </div>
                )}
            </div>

            {/* Items List */}
            {sortedItems.length > 0 ? (
                <ul className="space-y-3">
                    {sortedItems.map((item) => {
                         // Ensure item structure is valid before rendering
                         if (!item || !item.id || !item.list_item_id || !item.name || !item.item_type) {
                              console.warn("[ListDetail] Skipping rendering invalid list item:", item);
                              return null;
                         }
                         const isRemovingThisItem = isRemovingItem && isRemovingItem === item.list_item_id; // Check if *this* item is being removed
                        return (
                            <li
                                key={item.list_item_id} // Use unique list_item_id for the key
                                className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md gap-2"
                            >
                                <div className='flex-grow min-w-0'> {/* Allow text to wrap/truncate */}
                                    <h3 className="text-base font-medium text-gray-900 truncate">{item.name}</h3>
                                    {/* Display restaurant name only for dishes */}
                                    {item.item_type === 'dish' && item.restaurant_name && (
                                        <p className="text-sm text-gray-500 truncate">at {item.restaurant_name}</p>
                                    )}
                                </div>
                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                    {/* Quick Look Button */}
                                    <Button
                                        variant="tertiary"
                                        size="sm"
                                        onClick={() => setSelectedItem(item)} // Pass the whole item for context
                                        className="text-gray-600 hover:text-[#A78B71]"
                                        aria-label={`Quick look at ${item.name}`}
                                        title="Quick Look"
                                    >
                                        <Eye size={16} />
                                    </Button>
                                    {/* Remove Button (Only for list owner) */}
                                    {isOwner && (
                                        <Button
                                            variant="tertiary"
                                            size="sm"
                                            onClick={() => handleRemoveItem(item.list_item_id)} // Use list_item_id
                                            disabled={isRemovingItem} // Disable while *any* item is being removed
                                            className={`text-red-500 hover:text-red-700 ${isRemovingItem ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            aria-label={`Remove ${item.name}`}
                                            title="Remove Item"
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
                    // Pass necessary identifying info, let modal fetch details
                    item={{ id: selectedItem.id, type: selectedItem.item_type, name: selectedItem.name }}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
});

export default ListDetail;