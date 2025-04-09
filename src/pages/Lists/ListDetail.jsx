/* src/pages/Lists/ListDetail.jsx */
import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/Button';
import { Loader2, Trash2, SortAsc, SortDesc, Eye, Edit, MapPin, ArrowLeft } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';
import useAuthStore from '@/stores/useAuthStore';
import FollowButton from '@/components/FollowButton';
import { listService } from '@/services/listService';
import QueryResultDisplay from '@/components/QueryResultDisplay';

const fetchListDetails = async (listId) => {
    if (!listId) {
        throw new Error('List ID is required');
    }
    
    try {
        const listDetails = await listService.getListDetails(listId);
        if (!listDetails || typeof listDetails !== 'object' || typeof listDetails.id === 'undefined') {
            console.error(`[fetchListDetails] Invalid list data returned for ID ${listId}:`, listDetails);
            throw new Error(`Failed to load list: List ID ${listId} not found or returned invalid data`);
        }
        return listDetails;
    } catch (error) {
        console.error(`[fetchListDetails] Error fetching list ${listId}:`, error);
        throw error;
    }
};

const ListDetail = memo(() => {
    const { id: listId } = useParams();
    const navigate = useNavigate();

    const removeFromList = useUserListStore((state) => state.removeFromList);
    const isRemovingItem = useUserListStore((state) => state.isRemovingItem);
    const listStoreError = useUserListStore((state) => state.error);
    const clearError = useUserListStore((state) => state.clearError);

    const currentUserId = useAuthStore((state) => state.user?.id);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        clearError?.();
        return () => clearError?.();
    }, [listId, clearError]);

    const queryResult = useQuery({
        queryKey: ['listDetails', listId],
        queryFn: () => fetchListDetails(listId),
        enabled: !!listId,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: true,
        retry: (failureCount, error) => error?.status !== 404 && failureCount < 1,
    });

    const handleRemoveItem = useCallback(async (listItemIdToRemove) => {
        if (!listId || !listItemIdToRemove) return;
        clearError?.();
        try {
            await removeFromList(listId, listItemIdToRemove);
        } catch (err) {
            console.error(`[ListDetail] Error removing item ${listItemIdToRemove}:`, err);
        }
    }, [listId, removeFromList, clearError]);

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mb-4 flex items-center">
                <ArrowLeft size={16} className="mr-1" /> Back
            </Button>

            <QueryResultDisplay
                queryResult={queryResult}
                loadingMessage="Loading list details..."
                errorMessagePrefix="Failed to load list"
                noDataMessage="List not found or you may not have access."
                isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
                ErrorChildren={
                    <Button onClick={() => navigate('/lists')} variant="secondary" size="sm" className="mt-2">
                        Back to My Lists
                    </Button>
                }
            >
                {(list) => {
                    const isOwner = list?.user_id === currentUserId;
                    const showFollow = isAuthenticated && !!list?.id && !isOwner;
                    const itemCount = list.item_count ?? list.items?.length ?? 0;

                    const sortedItems = useMemo(() => {
                        if (!list?.items || !Array.isArray(list.items)) return [];
                        const validItems = list.items.filter((item) => item && typeof item.list_item_id !== 'undefined');
                        return [...validItems].sort((a, b) => {
                            const nameA = (a.name || '').toLowerCase();
                            const nameB = (b.name || '').toLowerCase();
                            return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                        });
                    }, [list?.items, sortOrder]);

                    return (
                        <>
                            <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm border border-gray-100 mb-6">
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                                        {list.name || 'Unnamed List'} ({list.type || 'mixed'})
                                    </h1>
                                    <div className="flex-shrink-0">
                                        {isOwner && (
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                onClick={() => alert('Edit list not implemented.')}
                                            >
                                                <Edit size={16} className="mr-1" /> Edit
                                            </Button>
                                        )}
                                        {showFollow && list.id && (
                                            <FollowButton
                                                listId={list.id}
                                                isFollowing={list.is_following ?? false}
                                                savedCount={list.saved_count || 0}
                                                className="w-auto"
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
                                        {list.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {listStoreError && (
                                <div className="mb-4">
                                    <ErrorMessage message={listStoreError} onRetry={clearError} />
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Items</h2>
                                {sortedItems.length > 1 && (
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

                            {sortedItems.length > 0 ? (
                                <ul className="space-y-3">
                                    {sortedItems.map((item) => {
                                        const isRemovingThisItem = isRemovingItem === item.list_item_id;
                                        const itemLink = item.id && item.item_type ? `/${item.item_type}/${item.id}` : null;
                                        return (
                                            <li
                                                key={item.list_item_id}
                                                className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md gap-2"
                                            >
                                                {itemLink ? (
                                                    <Link
                                                        to={itemLink}
                                                        className="flex-grow min-w-0 hover:text-[#A78B71] transition-colors"
                                                    >
                                                        <div className="text-sm">
                                                            <span className="font-medium">
                                                                {item.name || 'Unnamed Item'}
                                                            </span>
                                                            {item.restaurant_name && (
                                                                <span className="ml-1 text-gray-600">
                                                                    at {item.restaurant_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {(item.city || item.neighborhood) && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <MapPin size={10} className="inline-block mr-1" />
                                                                {item.neighborhood ? `${item.neighborhood}, ${item.city}` : item.city}
                                                            </div>
                                                        )}
                                                    </Link>
                                                ) : (
                                                    <div className="flex-grow min-w-0">
                                                        <div className="text-sm">
                                                            <span className="font-medium">
                                                                {item.name || 'Unnamed Item'}
                                                            </span>
                                                            {item.restaurant_name && (
                                                                <span className="ml-1 text-gray-600">
                                                                    at {item.restaurant_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {(item.city || item.neighborhood) && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                <MapPin size={10} className="inline-block mr-1" />
                                                                {item.neighborhood ? `${item.neighborhood}, ${item.city}` : item.city}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                                                    {item.id && item.item_type && (
                                                        <Button
                                                            variant="tertiary"
                                                            size="sm"
                                                            onClick={() => setSelectedItem(item)}
                                                            aria-label={`Quick look at ${item.name || 'item'}`}
                                                        >
                                                            <Eye size={16} />
                                                        </Button>
                                                    )}
                                                    {isOwner && (
                                                        <Button
                                                            variant="tertiary"
                                                            size="sm"
                                                            onClick={() => handleRemoveItem(item.list_item_id)}
                                                            disabled={isRemovingItem !== null}
                                                            className={`text-red-500 hover:text-red-700 ${isRemovingItem !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            aria-label={`Remove ${item.name || 'item'} from list`}
                                                        >
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
                        </>
                    );
                }}
            </QueryResultDisplay>

            {/* Quick Look Modal */}
            {selectedItem && (
                <ItemQuickLookModal item={selectedItem} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
});

export default ListDetail;