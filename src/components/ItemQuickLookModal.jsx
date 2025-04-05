import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import apiClient from '@/utils/apiClient';
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

const fetchItemDetails = async (itemId, itemType) => {
    console.log(`[ItemQuickLookModal] Fetching details for ${itemType} ID: ${itemId} via apiClient`);
    if (!itemId || !itemType) {
        throw new Error("Item ID and type are required for fetching details.");
    }

    let endpoint = '';
    if (itemType === 'restaurant') {
        endpoint = `/api/restaurants/${itemId}`;
    } else if (itemType === 'dish') {
        endpoint = `/api/dishes/${itemId}`;
    } else {
        console.warn(`[ItemQuickLookModal] Unsupported item type for details fetch: ${itemType}`);
        throw new Error(`Unsupported item type: ${itemType}`);
    }

    const errorContext = `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Quick Look Details`;

    try {
        const data = await apiClient(endpoint, errorContext);
        if (!data || typeof data !== 'object') {
            throw new Error(`Invalid data received for ${itemType} ${itemId}.`);
        }
        console.log(`[ItemQuickLookModal] Received details for ${itemType} ${itemId} via apiClient:`, data);
        return {
            ...data,
            type: itemType,
            tags: Array.isArray(data.tags) ? data.tags : [],
            dishes: itemType === 'restaurant' && Array.isArray(data.dishes)
                ? data.dishes.map(d => ({ ...d, tags: Array.isArray(d.tags) ? d.tags : [] }))
                : data.dishes,
        };
    } catch (error) {
        console.error(`[ItemQuickLookModal] Fetch error for ${endpoint} via apiClient:`, error);
        throw error;
    }
};

const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
    const [details, setDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchParams, setFetchParams] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setDetails(null);
            setIsLoading(false);
            setError(null);
            setFetchParams(null);
            if (item && item.id && (item.item_type || item.type)) {
                const type = item.item_type || item.type; // Normalize item_type to type
                console.log(`[ItemQuickLookModal useEffect] Modal open, setting fetch params for: type=${type}, id=${item.id}`);
                setFetchParams({ id: item.id, type });
            } else {
                console.warn("[ItemQuickLookModal useEffect] Modal opened with invalid/unsupported item prop:", item);
                setError("Invalid or unsupported item data for Quick Look.");
            }
        }
    }, [isOpen, item]);

    useEffect(() => {
        if (!fetchParams) return;

        const controller = new AbortController();
        const { id, type } = fetchParams;

        setIsLoading(true);
        setError(null);
        setDetails(null);
        console.log(`[ItemQuickLookModal fetchEffect] Fetch triggered for: type=${type}, id=${id}`);

        fetchItemDetails(id, type)
            .then(data => {
                console.log(`[ItemQuickLookModal fetchEffect] Fetch success for ${type} ${id}.`);
                setDetails(data);
                setError(null);
            })
            .catch(err => {
                console.error(`[ItemQuickLookModal fetchEffect] Error during fetch for ${type} ${id}:`, err);
                if (err.name !== 'AbortError') {
                    setError(err.message || `Failed to load ${type} details.`);
                }
                setDetails(null);
            })
            .finally(() => setIsLoading(false));

        return () => {
            console.log(`[ItemQuickLookModal fetchEffect] Cleanup for ${type} ${id}`);
            // controller.abort(); // Uncomment if fetch supports signal in future
        };
    }, [fetchParams]);

    const handleRetry = () => {
        if (item && item.id && (item.item_type || item.type)) {
            console.log("[ItemQuickLookModal] Retrying fetch...");
            setFetchParams({ id: item.id, type: item.item_type || item.type });
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner message={`Loading ${item?.item_type || item?.type || 'item'} details...`} />;
        }
        if (error) {
            const allowRetry = !!fetchParams;
            return (
                <ErrorMessage
                    message={error}
                    onRetry={allowRetry ? handleRetry : undefined}
                    isLoadingRetry={isLoading}
                />
            );
        }
        if (!details) {
            return <div className="text-center p-4 text-gray-500">No details available.</div>;
        }

        if (details.type === 'restaurant') {
            return (
                <div className="p-2">
                    <RestaurantCard
                        id={details.id}
                        name={details.name}
                        neighborhood={details.neighborhood_name || details.neighborhood}
                        city={details.city_name || details.city}
                        tags={details.tags}
                        adds={details.adds}
                    />
                    {Array.isArray(details.dishes) && details.dishes.length > 0 && (
                        <div className='mt-4 pt-3 border-t'>
                            <h4 className='font-semibold text-sm mb-2'>Known Dishes:</h4>
                            <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
                                {details.dishes.slice(0, 5).map(d => <li key={d.id}>{d.name}</li>)}
                                {details.dishes.length > 5 && <li>...and more</li>}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }
        if (details.type === 'dish') {
            return (
                <div className="p-2">
                    <DishCard
                        id={details.id}
                        name={details.name}
                        restaurant={details.restaurant_name || details.restaurant}
                        tags={details.tags}
                    />
                    {details.description && (
                        <p className='mt-3 text-sm text-gray-600'>{details.description}</p>
                    )}
                </div>
            );
        }

        return <div className="text-center p-4 text-gray-500">Could not display item details.</div>;
    };

    const modalTitle = `Quick Look: ${item?.name || (fetchParams?.type ? fetchParams.type.charAt(0).toUpperCase() + fetchParams.type.slice(1) : 'Item')}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            {renderContent()}
        </Modal>
    );
};

export default ItemQuickLookModal;