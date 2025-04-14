/* src/pages/Lists/ListDetail.jsx */
/* REMOVED: All TypeScript syntax */
import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/UI/Button'; // Corrected import path
import { Loader2, Trash2, SortAsc, SortDesc, Eye, Edit, MapPin, ArrowLeft } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';
import useAuthStore from '@/stores/useAuthStore';
import FollowButton from '@/components/FollowButton';
import { listService } from '@/services/listService';
import QueryResultDisplay from '@/components/QueryResultDisplay';
import ListDetailSkeleton from './ListDetailSkeleton'; // Import skeleton

const fetchListDetails = async (listId) => { // REMOVED: Type hints
    if (!listId) {
        throw new Error('List ID is required');
    }
    try {
        const listDetails = await listService.getListDetails(listId);
        // Basic validation
        if (!listDetails || typeof listDetails !== 'object' || typeof listDetails.id === 'undefined') {
            console.error(`[fetchListDetails] Invalid list data returned for ID ${listId}:`, listDetails);
            const error = new Error(`Failed to load list: List ID ${listId} not found or returned invalid data`);
            error.status = 404; // Mark as not found
            throw error;
        }
        return listDetails; // Return the object if valid
    } catch (error) {
        console.error(`[fetchListDetails] Error fetching list ${listId}:`, error);
        throw error; // Re-throw original error
    }
};

// Use memo for the main component if props are stable
const ListDetail = memo(() => {
    const { id: listId } = useParams();
    const navigate = useNavigate();

    const removeFromList = useUserListStore((state) => state.removeFromList);
    const isRemovingItem = useUserListStore((state) => state.isRemovingItem);
    const listStoreError = useUserListStore((state) => state.error);
    const clearError = useUserListStore((state) => state.clearError);

    const currentUserId = useAuthStore((state) => state.user?.id);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const [sortOrder, setSortOrder] = useState('asc'); // Default sort
    const [selectedItem, setSelectedItem] = useState(null); // For quick look modal

    // Clear store errors on mount/unmount or when listId changes
    useEffect(() => {
        clearError?.(); // Call if function exists
        return () => clearError?.();
    }, [listId, clearError]);

    const queryResult = useQuery({
        queryKey: ['listDetails', listId],
        queryFn: () => fetchListDetails(listId),
        enabled: !!listId, // Only run query if listId is present
        staleTime: 1 * 60 * 1000, // Example: 1 minute stale time
        refetchOnMount: true, // Refetch when component mounts
        retry: (failureCount, error) => {
             // Don't retry if it's a 404 Not Found error
            return error?.status !== 404 && failureCount < 1; // Retry only once otherwise
        },
    });

    // Handle item removal
    const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
        if (!listId || !listItemIdToRemove || isRemovingItem) return; // Prevent double clicks
        clearError?.();
        try {
            await removeFromList(listId, listItemIdToRemove);
            // No need to manually refetch, zustand update + RQ invalidation should handle it
        } catch (err) {
             // Error is likely set in the store, no need to set local error state
            console.error(`[ListDetail] Error removing item ${listItemIdToRemove}:`, err);
        }
    }, [listId, removeFromList, clearError, isRemovingItem]); // Added isRemovingItem dependency

    // Render the main component
    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4 flex items-center">
                <ArrowLeft size={16} className="mr-1" /> Back
            </Button>

            <QueryResultDisplay
                queryResult={queryResult}
                // Use the dedicated skeleton component
                LoadingComponent={<ListDetailSkeleton />}
                errorMessagePrefix="Failed to load list"
                noDataMessage="List not found or you may not have access."
                isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
                ErrorChildren={ // Content to show inside ErrorMessage component
                    <Button onClick={() => navigate('/lists')} variant="secondary" size="sm" className="mt-2">
                        Back to My Lists
                    </Button>
                }
            >
                {(list) => { // 'list' data is guaranteed to be valid here
                    const isOwner = list?.user_id === currentUserId;
                    const showFollow = isAuthenticated && !!list?.id && !isOwner;
                    // Calculate itemCount safely
                    const itemCount = list?.items?.length ?? list?.item_count ?? 0;

                    // Memoize sorted items
                    const sortedItems = useMemo(() => {
                        if (!list?.items || !Array.isArray(list.items)) return [];
                        // Filter out any potentially invalid items before sorting
                        const validItems = list.items.filter(item => item && typeof item.list_item_id !== 'undefined');
                        return [...validItems].sort((a, b) => {
                            const nameA = (a.name || '').toLowerCase();
                            const nameB = (b.name || '').toLowerCase();
                            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                        });
                    }, [list?.items, sortOrder]);

                    return (
                        <>
                            {/* List Header */}
                            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                                {/* Header content */}
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                                         {list.name || 'Unnamed List'} ({list.type || 'N/A'}) {/* Display type */}
                                    </h1>
                                     <div className="flex-shrink-0 flex gap-2"> {/* Action buttons */}
                                         {isOwner && <Button variant="tertiary" size="sm" onClick={() => alert('Edit list not implemented.')}><Edit size={16} className="mr-1" /> Edit</Button>}
                                         {showFollow && list.id && <FollowButton listId={list.id} isFollowing={list.is_following ?? false} savedCount={list.saved_count || 0} className="w-auto" />}
                                     </div>
                                </div>
                                 {/* Description, stats, tags */}
                                {list.description && <p className="text-gray-600 text-sm mb-3">{list.description}</p>}
                                <div className="flex items-center flex-wrap text-gray-500 text-xs gap-x-3 gap-y-1">
                                     <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span> <span className="hidden sm:inline">•</span>
                                     <span>{list.saved_count || 0} saves</span> <span className="hidden sm:inline">•</span>
                                     <span>{list.is_public ? 'Public' : 'Private'}</span>
                                     {list.creator_handle && <span>by @{list.creator_handle}</span>}
                                     {list.city && <><span className="hidden sm:inline">•</span><span className="flex items-center"><MapPin size={12} className="mr-0.5 text-gray-400" /> {list.city}</span></>}
                                </div>
                                 {Array.isArray(list.tags) && list.tags.length > 0 && (
                                     <div className="mt-2 flex flex-wrap gap-1">
                                         {list.tags.map((tag) => (<span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">#{tag}</span>))}
                                     </div>
                                 )}
                            </div>

                            {/* Display potential errors from remove action */}
                            {listStoreError && (
                                <div className="mb-4">
                                     {/* Use ErrorMessage, allowing user to clear it */}
                                    <ErrorMessage message={listStoreError} onRetry={clearError} />
                                </div>
                            )}

                            {/* Items Section Header + Sort */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Items</h2>
                                {sortedItems.length > 1 && (
                                    <div className="flex gap-1">
                                        <Button variant="tertiary" size="sm" onClick={() => setSortOrder('asc')} className={`... ${sortOrder === 'asc' ? 'bg-gray-200' : ''}`} aria-pressed={sortOrder === 'asc'} title="Sort A-Z"><SortAsc size={16} /></Button>
                                        <Button variant="tertiary" size="sm" onClick={() => setSortOrder('desc')} className={`... ${sortOrder === 'desc' ? 'bg-gray-200' : ''}`} aria-pressed={sortOrder === 'desc'} title="Sort Z-A"><SortDesc size={16} /></Button>
                                    </div>
                                )}
                            </div>

                            {/* Items List */}
                            {sortedItems.length > 0 ? (
                                <ul className="space-y-3">
                                    {sortedItems.map((item) => {
                                        const isRemovingThisItem = isRemovingItem === item.list_item_id;
                                        const itemLink = item.id && item.item_type ? `/${item.item_type}/${item.id}` : null;
                                        return (
                                            <li key={item.list_item_id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md gap-2">
                                                {/* Item Link/Info */}
                                                <div className="flex-grow min-w-0">
                                                     {itemLink ? (
                                                         <Link to={itemLink} className="hover:text-[#A78B71] transition-colors">
                                                            <span className="font-medium text-sm block">{item.name || 'Unnamed Item'}</span>
                                                            {item.restaurant_name && <span className="text-xs text-gray-600 block">at {item.restaurant_name}</span>}
                                                            {(item.city || item.neighborhood) && <span className="text-xs text-gray-500 mt-0.5 flex items-center"><MapPin size={10} className="inline-block mr-1" />{item.neighborhood ? `${item.neighborhood}, ${item.city}` : item.city}</span>}
                                                         </Link>
                                                     ) : (
                                                         <div> {/* Fallback if no link */}
                                                              <span className="font-medium text-sm block">{item.name || 'Unnamed Item'}</span>
                                                             {item.restaurant_name && <span className="text-xs text-gray-600 block">at {item.restaurant_name}</span>}
                                                             {(item.city || item.neighborhood) && <span className="text-xs text-gray-500 mt-0.5 flex items-center"><MapPin size={10} className="inline-block mr-1" />{item.neighborhood ? `${item.neighborhood}, ${item.city}` : item.city}</span>}
                                                         </div>
                                                     )}
                                                </div>
                                                {/* Action Buttons */}
                                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                                    {item.id && item.item_type && <Button variant="tertiary" size="sm" onClick={() => setSelectedItem(item)} aria-label={`Quick look`}><Eye size={16} /></Button>}
                                                    {isOwner && <Button variant="tertiary" size="sm" onClick={() => handleRemoveItem(item.list_item_id)} disabled={isRemovingItem !== null} className={`... ${isRemovingItem !== null ? 'opacity-50 cursor-not-allowed' : ''}`} aria-label={`Remove`}>{isRemovingThisItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}</Button>}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="text-gray-500 text-center py-6">No items in this list yet.</p>
                            )}
                        </>
                    );
                }}
            </QueryResultDisplay>

            {/* Quick Look Modal */}
            {selectedItem && (
                 <ItemQuickLookModal item={selectedItem} isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
});

ListDetail.displayName = 'ListDetail'; // Add display name for memo

export default ListDetail;