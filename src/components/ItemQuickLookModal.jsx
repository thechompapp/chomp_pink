// src/components/ItemQuickLookModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/UI/Modal';
import { Loader2, AlertTriangle, X, Utensils, Store } from 'lucide-react'; // Added item type icons
import apiClient from '@/utils/apiClient';
import RestaurantCard from '@/components/UI/RestaurantCard'; // Keep for display
import DishCard from '@/components/UI/DishCard'; // Keep for display
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button'; // Import button for potential actions
import { Link } from 'react-router-dom'; // Import Link

// Fetcher function remains specific to this modal
const fetchItemDetails = async (itemId, itemType) => {
    console.log(`[ItemQuickLookModal] Fetching details for ${itemType} ID: ${itemId}`);
    if (!itemId || !itemType) {
        throw new Error("Item ID and type are required for fetching details.");
    }
    let endpoint = '';
    if (itemType === 'restaurant') endpoint = `/api/restaurants/${itemId}`;
    else if (itemType === 'dish') endpoint = `/api/dishes/${itemId}`;
    else throw new Error(`Unsupported item type: ${itemType}`);

    const errorContext = `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Quick Look Details`;
    try {
        const data = await apiClient(endpoint, errorContext);
        if (!data || typeof data !== 'object' || typeof data.id === 'undefined') {
             // Handle cases where API returns empty response or invalid data for valid ID
             if (data === null || (typeof data === 'object' && Object.keys(data).length === 0)) {
                 console.warn(`[ItemQuickLookModal] Received null or empty object for ${itemType} ${itemId}. Assuming not found.`);
                  throw new Error(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found.`); // More specific error
             }
            throw new Error(`Invalid data structure received for ${itemType} ${itemId}.`);
        }
        console.log(`[ItemQuickLookModal] Received details for ${itemType} ${itemId}:`, data);
        // Standardize structure slightly for rendering
        return {
            ...data,
            type: itemType, // Ensure type is present
            tags: Array.isArray(data.tags) ? data.tags : [], // Ensure tags is array
             // For restaurants, ensure dishes array exists if present
             dishes: itemType === 'restaurant' && Array.isArray(data.dishes)
                 ? data.dishes.map(d => ({ ...d, tags: Array.isArray(d.tags) ? d.tags : [] }))
                 : (itemType === 'restaurant' ? [] : undefined), // Default to empty array for restaurant if no dishes property
        };
    } catch (error) {
        console.error(`[ItemQuickLookModal] Fetch error for ${endpoint}:`, error);
         // Propagate specific error messages if possible
         throw new Error(error.message || `Failed to load ${itemType} details.`);
    }
};

const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
    // State for fetched details, loading, error, and parameters to trigger fetch
    const [details, setDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Store params {id, type} to trigger fetch effect
    const [fetchParams, setFetchParams] = useState(null);

    // Effect to reset state and set fetch params when modal opens or item changes
    useEffect(() => {
        if (isOpen) {
            // Reset state whenever modal opens or item prop changes
            setDetails(null);
            setIsLoading(false); // Ensure loading is false initially
            setError(null);
            setFetchParams(null); // Clear old params first

            // Validate item prop and set fetch parameters
            if (item && item.id && (item.item_type || item.type)) {
                const type = item.item_type || item.type; // Normalize type field
                console.log(`[ItemQuickLookModal setupEffect] Modal open/item changed. Setting fetch params for: type=${type}, id=${item.id}`);
                setFetchParams({ id: item.id, type });
            } else {
                console.warn("[ItemQuickLookModal setupEffect] Modal opened with invalid item prop:", item);
                setError("Cannot load details: Invalid item data provided.");
            }
        } else {
            // Clear fetch params when modal closes to prevent accidental fetches
            setFetchParams(null);
        }
    }, [isOpen, item]); // Rerun when modal opens/closes or item prop changes


    // Effect to fetch data when fetchParams are set
    useEffect(() => {
        // Only run if fetchParams are valid
        if (!fetchParams || !fetchParams.id || !fetchParams.type) {
            console.log("[ItemQuickLookModal fetchEffect] Skipping fetch: No valid fetchParams.");
            return;
        }

        const { id, type } = fetchParams;
        let isCancelled = false; // Flag to prevent state updates after unmount/param change

        const loadDetails = async () => {
            setIsLoading(true);
            setError(null); // Clear previous errors
            setDetails(null); // Clear previous details
            console.log(`[ItemQuickLookModal fetchEffect] Fetch triggered for: type=${type}, id=${id}`);

            try {
                const data = await fetchItemDetails(id, type);
                 if (!isCancelled) {
                    console.log(`[ItemQuickLookModal fetchEffect] Fetch success for ${type} ${id}.`);
                    setDetails(data);
                    setError(null);
                 }
            } catch (err) {
                console.error(`[ItemQuickLookModal fetchEffect] Error during fetch for ${type} ${id}:`, err);
                 if (!isCancelled) {
                     setError(err.message || `Failed to load ${type} details.`);
                     setDetails(null);
                 }
            } finally {
                 if (!isCancelled) {
                    setIsLoading(false);
                 }
            }
        };

        loadDetails();

        // Cleanup function
        return () => {
            console.log(`[ItemQuickLookModal fetchEffect] Cleanup for ${type} ${id}`);
            isCancelled = true; // Set flag on cleanup
            // Optional: Abort ongoing fetch if using AbortController
        };
    }, [fetchParams]); // Rerun only when fetchParams change


    // Stable callback for retrying fetch
    const handleRetry = useCallback(() => {
        // Re-trigger fetch by setting fetchParams again (if item is valid)
        if (item && item.id && (item.item_type || item.type)) {
            console.log("[ItemQuickLookModal] Retrying fetch...");
            setError(null); // Clear error before retry
            setFetchParams({ id: item.id, type: item.item_type || item.type });
        } else {
             console.warn("[ItemQuickLookModal] Cannot retry: Invalid item prop.");
        }
    }, [item]); // Dependency on item prop

    // --- Render Content Logic ---
    const renderContent = useCallback(() => {
        if (isLoading) {
            return <LoadingSpinner message={`Loading details...`} />;
        }
        if (error) {
            const allowRetry = !!fetchParams; // Allow retry if params were set
            return (
                <ErrorMessage
                    message={error}
                    onRetry={allowRetry ? handleRetry : undefined}
                    isLoadingRetry={isLoading} // Pass loading state for retry button UI
                />
            );
        }
        // Handle case where fetch finished but details are still null (shouldn't happen if error handling is correct)
        if (!details) {
            return <div className="text-center p-4 text-gray-500">No details available.</div>;
        }

        // Render based on fetched item type
        const detailLink = details.type === 'restaurant' ? `/restaurant/${details.id}` : `/dish/${details.id}`;

        return (
            <div className="p-1 space-y-3">
                 {/* Display Card */}
                 {details.type === 'restaurant' && (
                     <RestaurantCard
                         id={details.id} name={details.name} isHighlighted={false} isDisabled={true} // Non-interactive card view
                         neighborhood={details.neighborhood_name || details.neighborhood}
                         city={details.city_name || details.city}
                         tags={details.tags} adds={details.adds}
                         showQuickAdd={false} // Hide the '+' button inside the card
                     />
                 )}
                  {details.type === 'dish' && (
                     <DishCard
                         id={details.id} name={details.name} isHighlighted={false} isDisabled={true}
                         restaurant={details.restaurant_name || details.restaurant}
                         tags={details.tags} adds={details.adds}
                         showQuickAdd={false}
                     />
                 )}

                 {/* Additional Details (Optional) */}
                 {details.type === 'restaurant' && Array.isArray(details.dishes) && details.dishes.length > 0 && (
                      <div className='pt-2 border-t border-gray-100'>
                          <h4 className='font-semibold text-xs text-gray-600 mb-1'>Known Dishes:</h4>
                          <ul className='list-disc list-inside text-sm text-gray-700 space-y-0.5 pl-2'>
                              {details.dishes.slice(0, 3).map(d => <li key={d.id} className='truncate'>{d.name}</li>)}
                              {details.dishes.length > 3 && <li className='text-xs text-gray-500'>...and {details.dishes.length - 3} more</li>}
                          </ul>
                      </div>
                 )}
                  {details.type === 'dish' && details.description && (
                      <p className='pt-2 border-t border-gray-100 text-sm text-gray-600'>{details.description}</p>
                  )}

                 {/* View Full Details Link */}
                  <div className="text-center pt-2">
                      <Link to={detailLink} onClick={onClose} className="text-sm text-[#A78B71] hover:underline font-medium">
                          View Full Details &rarr;
                      </Link>
                  </div>
            </div>
        );
    // Dependencies for memoizing the render function
    }, [isLoading, error, details, fetchParams, handleRetry, onClose]);

    // Determine modal title dynamically
    const modalTitle = useMemo(() => {
         const typeName = fetchParams?.type ? fetchParams.type.charAt(0).toUpperCase() + fetchParams.type.slice(1) : 'Item';
         const itemName = details?.name || item?.name || '';
         return `Quick Look: ${itemName || typeName}`;
    }, [fetchParams, details, item]);


    return (
        // Use the standard Modal component
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            {renderContent()}
        </Modal>
    );
};

export default ItemQuickLookModal;