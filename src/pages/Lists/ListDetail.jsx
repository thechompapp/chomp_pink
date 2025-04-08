/* src/pages/Lists/ListDetail.jsx */
import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/Button'; // Use global import alias
import { Loader2, Trash2, SortAsc, SortDesc, Eye, Edit, MapPin, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import useUserListStore from '@/stores/useUserListStore'; // Use global import alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Keep for store errors
import ItemQuickLookModal from '@/components/ItemQuickLookModal'; // Use global import alias
import useAuthStore from '@/stores/useAuthStore'; // Use global import alias
import FollowButton from '@/components/FollowButton'; // Use global import alias
import { listService } from '@/services/listService'; // Use global import alias
import QueryResultDisplay from '@/components/QueryResultDisplay'; // Import the new component

// Fetcher Function (remains the same)
const fetchListDetails = async (listId) => { /* ... */ };

const ListDetail = memo(() => {
    const { id: listId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Store state/actions (remain the same)
    const removeFromList = useUserListStore(state => state.removeFromList);
    const isRemovingItem = useUserListStore(state => state.isRemovingItem); // Track specific item being removed
    const listStoreError = useUserListStore(state => state.error); // Store error for remove action
    const clearError = useUserListStore(state => state.clearError); // Clear store error

    const currentUserId = useAuthStore(state => state.user?.id);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    // Local state (remains the same)
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedItem, setSelectedItem] = useState(null);
    // Note: localError for item removal is handled by listStoreError now

    useEffect(() => {
        // Clear store error when component mounts or listId changes
        clearError?.();
        return () => {
            clearError?.(); // Clear on unmount too
        };
    }, [listId, clearError]);

    // React Query setup - Result object passed to QueryResultDisplay
    const queryResult = useQuery({
        queryKey: ['listDetails', listId],
        queryFn: () => fetchListDetails(listId),
        enabled: !!listId, // Fetch if listId is present (auth checked inside component)
        staleTime: 5 * 60 * 1000,
        refetchOnMount: true,
    });

    // --- Callbacks (remain the same) ---
    const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
        // No need to check ownership here if button is only shown to owner
        if (!listId || !listItemIdToRemove) return;
        clearError?.(); // Clear previous store error before trying again
        try {
            await removeFromList(listId, listItemIdToRemove);
            // No need to invalidate here, store action might do it, or rely on query refetch
        } catch (err) {
            console.error(`[ListDetail] Error removing item ${listItemIdToRemove}:`, err);
            // Error state is set in the store
        }
    }, [listId, removeFromList, clearError]);

    // --- Render Logic ---

    // Use QueryResultDisplay to handle main data fetching states
    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Back Button outside QueryResultDisplay */}
            <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4 flex items-center">
                <ArrowLeft size={16} className='mr-1'/> Back
            </Button>

            <QueryResultDisplay
                queryResult={queryResult}
                loadingMessage="Loading list details..."
                errorMessagePrefix="Failed to load list"
                noDataMessage="List not found or you may not have access."
                 // Custom check for potentially empty but valid list object
                isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
                ErrorChildren={
                     <Button onClick={() => navigate('/lists')} variant="secondary" size="sm" className="mt-2">Back to My Lists</Button>
                 }
            >
                {(list) => {
                    // Derived state specific to successful data load
                    const isOwner = list?.user_id === currentUserId;
                    const showFollow = isAuthenticated && !!list?.id && !isOwner;
                    const itemCount = list.item_count ?? list.items?.length ?? 0; // Calculate item count safely

                    // Memoized sorted items based on fetched list data
                    const sortedItems = useMemo(() => {
                        if (!list?.items || !Array.isArray(list.items)) return [];
                        const validItems = list.items.filter(item => item && typeof item.list_item_id !== 'undefined');
                        return [...validItems].sort((a, b) => {
                            const nameA = (a.name || '').toLowerCase();
                            const nameB = (b.name || '').toLowerCase();
                            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                        });
                    }, [list?.items, sortOrder]);

                    return (
                        <>
                            {/* List Header Section */}
                            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                                        {list.name || 'Unnamed List'} ({list.type || 'mixed'})
                                    </h1>
                                    <div className='flex-shrink-0'>
                                        {isOwner && (
                                            <Button variant="tertiary" size="sm" onClick={() => alert('Edit list not implemented.')}>
                                                <Edit size={16} className="mr-1" /> Edit
                                            </Button>
                                        )}
                                        {showFollow && list.id && ( // Ensure list.id exists before rendering FollowButton
                                            <FollowButton
                                            listId={list.id}
                                            isFollowing={list.is_following ?? false}
                                            savedCount={list.saved_count || 0}
                                            className="w-auto" // Ensure class applies
                                            />
                                        )}
                                    </div>
                                </div>
                                {list.description && <p className="text-gray-600 text-sm mb-3">{list.description}</p>}
                                <div className="flex items-center flex-wrap text-gray-500 text-xs gap-x-3 gap-y-1">
                                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{list.saved_count || 0} saves</span>
                                    <span className="hidden sm:inline">•</span>
                                    <span>{list.is_public ? 'Public' : 'Private'}</span>
                                    {list.creator_handle && <span>by @{list.creator_handle}</span>}
                                    {list.city && <span className="hidden sm:inline">•</span>}
                                    {list.city && (
                                        <span className="flex items-center">
                                            <MapPin size={12} className="mr-0.5 text-gray-400" /> {list.city}
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

                             {/* Display error from item removal action */}
                             {listStoreError && (
                                 <div className="mb-4">
                                     <ErrorMessage message={listStoreError} onRetry={clearError} />
                                 </div>
                             )}

                            {/* Items Section Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Items</h2>
                                {sortedItems.length > 1 && (
                                    <div className="flex gap-1">
                                        {/* Sort buttons remain the same */}
                                        <Button variant="tertiary" size="sm" onClick={() => setSortOrder('asc')} className={`text-gray-600 ${sortOrder === 'asc' ? 'bg-gray-200' : ''}`} aria-pressed={sortOrder === 'asc'} title="Sort A-Z"><SortAsc size={16} /></Button>
                                        <Button variant="tertiary" size="sm" onClick={() => setSortOrder('desc')} className={`text-gray-600 ${sortOrder === 'desc' ? 'bg-gray-200' : ''}`} aria-pressed={sortOrder === 'desc'} title="Sort Z-A"><SortDesc size={16} /></Button>
                                    </div>
                                )}
                            </div>

                             {/* Items List */}
                             {sortedItems.length > 0 ? (
                                <ul className="space-y-3">
                                    {sortedItems.map((item) => {
                                        // Item rendering logic remains largely the same
                                        const isRemovingThisItem = isRemovingItem === item.list_item_id;
                                        const itemLink = item.id && item.item_type ? `/${item.item_type}/${item.id}` : null;
                                        return (
                                             <li key={item.list_item_id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md gap-2">
                                                 {/* Link or Div */}
                                                 {itemLink ? ( <Link to={itemLink} className='flex-grow min-w-0 hover:text-[#A78B71] transition-colors'>...</Link> ) : ( <div className='flex-grow min-w-0'>...</div> )}
                                                 {/* Action Buttons */}
                                                 <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                                     {/* Quick Look Button */}
                                                     {item.id && item.item_type && ( <Button variant="tertiary" size="sm" onClick={() => setSelectedItem(item)}><Eye size={16}/></Button> )}
                                                     {/* Remove Button */}
                                                      {isOwner && (
                                                          <Button variant="tertiary" size="sm" onClick={() => handleRemoveItem(item.list_item_id)} disabled={isRemovingItem !== null} className={`text-red-500 hover:text-red-700 ${isRemovingItem !== null ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                              {isRemovingThisItem ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Trash2 size={16} />)}
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
                        </>
                    );
                }}
            </QueryResultDisplay>
        </div>
    );
});

export default ListDetail;