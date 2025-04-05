import React, { memo, useCallback, useState, useMemo } from 'react'; // Added useMemo
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/utils/apiClient';
import Button from '@/components/Button';
import { Loader2, Trash2, SortAsc, SortDesc, Eye } from 'lucide-react';
import useUserListStore from '@/stores/useUserListStore';
import ErrorMessage from '@/components/UI/ErrorMessage';
import ItemQuickLookModal from '@/components/ItemQuickLookModal';

const fetchListDetails = async (listId) => {
    if (!listId) throw new Error('List ID is required');
    const data = await apiClient(`/api/lists/${listId}`, 'ListDetail Fetch');
    return data || {};
};

const ListDetail = memo(() => {
    const { id } = useParams();
    const { removeFromList, isRemovingItem } = useUserListStore();
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedItem, setSelectedItem] = useState(null);

    console.log('[ListDetail] Rendering with ID:', id);

    const { data: list, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['listDetails', id],
        queryFn: () => fetchListDetails(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });

    const handleRemoveItem = useCallback(async (listItemId) => {
        try {
            await removeFromList(id, listItemId);
            refetch();
        } catch (err) {
            console.error(`[ListDetail] Error removing item ${listItemId}:`, err);
        }
    }, [id, removeFromList, refetch]);

    const sortedItems = useMemo(() => {
        if (!list?.items) return [];
        return [...list.items].sort((a, b) => {
            return sortOrder === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        });
    }, [list?.items, sortOrder]);

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
                    message={error?.message || 'Failed to load list details'}
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
                <p className="text-center text-gray-500 py-6">List not found.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">{list.name || 'Unnamed List'}</h1>
                <div className="flex gap-2">
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => setSortOrder('asc')}
                        className={`text-gray-600 ${sortOrder === 'asc' ? 'bg-gray-200' : ''}`}
                    >
                        <SortAsc size={16} />
                    </Button>
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => setSortOrder('desc')}
                        className={`text-gray-600 ${sortOrder === 'desc' ? 'bg-gray-200' : ''}`}
                    >
                        <SortDesc size={16} />
                    </Button>
                </div>
            </div>
            {list.description && (
                <p className="text-gray-600 text-sm mb-6">{list.description}</p>
            )}
            <div className="flex items-center text-gray-500 text-sm mb-6">
                <span>{list.item_count || 0} {list.item_count === 1 ? 'item' : 'items'}</span>
                <span className="mx-2">•</span>
                <span>{list.saved_count || 0} saves</span>
            </div>

            {sortedItems.length > 0 ? (
                <ul className="space-y-4">
                    {sortedItems.map((item, index) => (
                        <li
                            key={`${item.id}-${index}`}
                            className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-md"
                        >
                            <div>
                                <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                                {item.type === 'dish' && item.restaurant && (
                                    <p className="text-sm text-gray-500">{item.restaurant}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    onClick={() => setSelectedItem(item)}
                                    className="text-gray-600 hover:text-[#A78B71]"
                                    aria-label={`Quick look at ${item.name}`}
                                >
                                    <Eye size={16} />
                                </Button>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    onClick={() => handleRemoveItem(item.id)}
                                    disabled={isRemovingItem}
                                    className="text-red-500 hover:text-red-700"
                                    aria-label={`Remove ${item.name}`}
                                >
                                    {isRemovingItem ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-center py-6">No items in this list yet.</p>
            )}
            {selectedItem && (
                <ItemQuickLookModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </div>
    );
});

export default ListDetail;