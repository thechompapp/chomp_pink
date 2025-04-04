// src/components/ItemQuickLookModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import { Loader2, AlertTriangle, X } from 'lucide-react'; // Added X for potential close button
import { API_BASE_URL } from '@/config'; // Keep config if needed elsewhere
import RestaurantCard from '@/components/UI/RestaurantCard'; // Keep Card components
import DishCard from '@/components/UI/DishCard'; // Keep Card components
import apiClient from '@/utils/apiClient'; // Import apiClient
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use common components
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use common components

// Updated fetch function using apiClient
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
    // Only fetch supported types
    console.warn(`[ItemQuickLookModal] Unsupported item type for details fetch: ${itemType}`);
    throw new Error(`Unsupported item type: ${itemType}`);
  }

  const errorContext = `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Quick Look Details`;

  try {
      // Use apiClient
      const data = await apiClient(endpoint, errorContext);
      // Add a check for received data structure if needed
      if (!data || typeof data !== 'object') {
           throw new Error(`Invalid data received for ${itemType} ${itemId}.`);
      }
      console.log(`[ItemQuickLookModal] Received details for ${itemType} ${itemId} via apiClient:`, data);
      // Format data if needed before returning (e.g., ensure tags array)
      return {
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : [],
          // Ensure dishes have tags array if type is restaurant
          dishes: itemType === 'restaurant' && Array.isArray(data.dishes)
              ? data.dishes.map(d => ({ ...d, tags: Array.isArray(d.tags) ? d.tags : [] }))
              : data.dishes, // Keep original if not restaurant or not array
      };
  } catch (error) {
       // apiClient handles basic error logging and throws formatted error
       console.error(`[ItemQuickLookModal] Fetch error for ${endpoint} via apiClient:`, error);
       throw error; // Re-throw the error from apiClient
  }
};


const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Store item details used for the fetch request to allow retry
  const [fetchParams, setFetchParams] = useState(null);

  useEffect(() => {
    // Reset state when modal opens or item changes
    if (isOpen) {
        setDetails(null); setIsLoading(false); setError(null); setFetchParams(null);
        if (item && item.id && item.type && (item.type === 'dish' || item.type === 'restaurant')) {
            console.log(`[ItemQuickLookModal useEffect] Modal open, setting fetch params for: type=${item.type}, id=${item.id}`);
            setFetchParams({ id: item.id, type: item.type });
        } else {
             console.warn("[ItemQuickLookModal useEffect] Modal opened with invalid/unsupported item prop:", item);
             setError("Invalid or unsupported item data for Quick Look.");
        }
    }
  }, [isOpen, item]); // Re-run setup when modal opens or item changes

  // Effect to fetch data when fetchParams is set
  useEffect(() => {
      if (!fetchParams) return; // Don't fetch if params aren't set

      const controller = new AbortController(); // For potential cleanup/cancellation
      const { id, type } = fetchParams;

      setIsLoading(true); setError(null); setDetails(null); // Reset state for new fetch
      console.log(`[ItemQuickLookModal fetchEffect] Fetch triggered for: type=${type}, id=${id}`);

      fetchItemDetails(id, type)
          .then(data => {
             console.log(`[ItemQuickLookModal fetchEffect] Fetch success for ${type} ${id}.`);
             setDetails(data); setError(null);
          })
          .catch(err => {
             console.error(`[ItemQuickLookModal fetchEffect] Error during fetch for ${type} ${id}:`, err);
             // Don't set error if it's an AbortError (component unmounted)
             if (err.name !== 'AbortError') {
                 setError(err.message || `Failed to load ${type} details.`);
             }
             setDetails(null);
          })
          .finally(() => { setIsLoading(false); });

      // Cleanup function to abort fetch if component unmounts or params change
      return () => {
          console.log(`[ItemQuickLookModal fetchEffect] Cleanup for ${type} ${id}`);
          // controller.abort(); // Abort fetch if needed - currently fetch doesn't support signal
      };
  }, [fetchParams]); // Effect dependency on fetchParams


  const handleRetry = () => {
      // Retrigger fetch by resetting fetchParams (which triggers the fetch effect)
      if (item && item.id && item.type) {
          console.log("[ItemQuickLookModal] Retrying fetch...");
          setFetchParams({ id: item.id, type: item.type });
      }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner message={`Loading ${item?.type || 'item'} details...`} />;
    }
    if (error) {
      // Allow retry only if fetch params were valid
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
        // This case might occur briefly or if fetchParams were invalid initially
        return <div className="text-center p-4 text-gray-500">No details available.</div>;
    }

    // Render details based on type
    if (details.type === 'restaurant' || item?.type === 'restaurant') {
      // Pass only relevant props to RestaurantCard based on its definition
      return (
          <div className="p-2"> {/* Add padding if needed */}
              <RestaurantCard
                  id={details.id}
                  name={details.name}
                  neighborhood={details.neighborhood_name || details.neighborhood} // Adjust based on API response fields
                  city={details.city_name || details.city}
                  tags={details.tags}
                  adds={details.adds}
              />
               {/* Optionally add more details here specific to the modal */}
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
    if (details.type === 'dish' || item?.type === 'dish') {
      // Pass only relevant props to DishCard
       return (
           <div className="p-2"> {/* Add padding if needed */}
              <DishCard
                  id={details.id}
                  name={details.name}
                  restaurant={details.restaurant_name || details.restaurant} // Adjust based on API response
                  tags={details.tags}
                  // adds={details.adds} // DishCard doesn't display adds currently
               />
               {/* Optionally add more details here specific to the modal */}
               {details.description && ( // If description comes back from API
                   <p className='mt-3 text-sm text-gray-600'>{details.description}</p>
               )}
           </div>
       );
    }

    return <div className="text-center p-4 text-gray-500">Could not display item details.</div>;
  };

  // Determine title safely
  const modalTitle = `Quick Look: ${item?.name || (fetchParams?.type ? fetchParams.type.charAt(0).toUpperCase() + fetchParams.type.slice(1) : 'Item')}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {renderContent()}
    </Modal>
  );
};

export default ItemQuickLookModal;