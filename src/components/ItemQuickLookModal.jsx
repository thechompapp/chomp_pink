// src/components/ItemQuickLookModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/UI/Modal';
import { Loader2, AlertTriangle, X, Utensils, Store } from 'lucide-react';
// Corrected import paths for services:
import { restaurantService } from '@/services/restaurantService';
import { dishService } from '@/services/dishService';
// Card component imports (assuming they are correct)
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';
// UI component imports (assuming they are correct)
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/Button';
import { Link } from 'react-router-dom';

// Fetcher function using specific services
const fetchItemDetails = async (itemId, itemType) => {
  // Removed console log
  if (!itemId || !itemType) {
      throw new Error('Item ID and Type are required for fetching details.');
  }
  try {
    if (itemType === 'restaurant') {
      const data = await restaurantService.getRestaurantDetails(itemId);
      // Assuming service throws 404 or returns null/empty object on not found
      if (!data || !data.id) throw new Error(`Restaurant with ID ${itemId} not found.`);
      return { ...data, type: itemType };
    } else if (itemType === 'dish') {
      const data = await dishService.getDishDetails(itemId);
      if (!data || !data.id) throw new Error(`Dish with ID ${itemId} not found.`);
      return { ...data, type: itemType };
    } else {
      throw new Error(`Unsupported item type: ${itemType}`);
    }
  } catch (error) {
    // Removed console log
    // Re-throw the error to be caught by the component's fetch effect
    throw new Error(error.message || `Failed to load ${itemType} details.`);
  }
};

const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
  // State: details, loading, error
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the fetch parameters derived from the item prop
  const fetchParams = useMemo(() => {
      if (!isOpen || !item || !item.id || !item.type) {
          return null; // Don't fetch if modal is closed or item is invalid
      }
      return { id: item.id, type: item.type };
  }, [isOpen, item]); // Dependencies: modal open state and the item object itself

  // Effect to trigger fetch when fetchParams change (i.e., modal opens with a valid item)
  useEffect(() => {
      if (!fetchParams) {
           setDetails(null); // Clear details if no valid item/modal closed
           setError(null);
           setIsLoading(false);
          return;
      }

      let isMounted = true; // Flag to prevent state updates on unmounted component
      const loadDetails = async () => {
          setIsLoading(true);
          setError(null);
          setDetails(null); // Clear previous details
          try {
              const data = await fetchItemDetails(fetchParams.id, fetchParams.type);
              if (isMounted) {
                  setDetails(data);
              }
          } catch (err) {
              if (isMounted) {
                  setError(err.message);
              }
          } finally {
              if (isMounted) {
                  setIsLoading(false);
              }
          }
      };

      loadDetails();

      // Cleanup function to set isMounted to false when the component unmounts or fetchParams change again
      return () => {
          isMounted = false;
      };
  }, [fetchParams]); // Dependency: only the memoized fetchParams object

  // Retry handler
  const handleRetry = useCallback(() => {
      if (fetchParams) { // Only retry if we have valid parameters
          // Trigger fetch effect again by temporarily clearing fetchParams? No, just call fetch directly.
          const loadDetails = async () => {
                setIsLoading(true);
                setError(null);
                setDetails(null);
                try {
                    const data = await fetchItemDetails(fetchParams.id, fetchParams.type);
                    setDetails(data); // Assuming component is still mounted here
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            loadDetails();
      }
  }, [fetchParams]); // Dependency: fetchParams

  // Render Content Logic
  const renderContent = useCallback(() => {
    if (isLoading) {
      return <LoadingSpinner message="Loading details..." />;
    }
    if (error) {
      return <ErrorMessage message={error} onRetry={handleRetry} isLoadingRetry={isLoading}>
                 <Button onClick={onClose} variant="tertiary" size="sm" className="mt-2">Close</Button>
             </ErrorMessage>;
    }
    if (!details) {
      // This state might occur briefly or if fetchParams were null initially
      return <div className="text-center text-gray-500 py-4">No details available.</div>;
    }

    // --- Render based on item type ---
    const commonCardProps = {
         id: details.id,
         name: details.name,
         tags: details.tags || [],
         adds: details.adds || 0,
         // QuickAdd is generally not needed inside a modal, but pass if required
         // onQuickAdd: () => { /* Potentially open ANOTHER modal or perform action */ }
    };

    return (
      <div className="space-y-4">
        {details.type === 'restaurant' && (
             <RestaurantCard
                {...commonCardProps}
                city={details.city_name} // Map fields
                neighborhood={details.neighborhood_name}
                onQuickAdd={null} // Disable quick add inside modal
            />
        )}
        {details.type === 'dish' && (
             <DishCard
                {...commonCardProps}
                restaurant={details.restaurant_name} // Map fields
                onQuickAdd={null} // Disable quick add inside modal
            />
        )}

        {/* Link to full detail page */}
        <div className="text-center border-t border-gray-100 pt-3">
            <Link
                to={`/${details.type}/${details.id}`}
                onClick={onClose} // Close modal when navigating
                className="text-sm font-medium text-[#A78B71] hover:text-[#D1B399] hover:underline"
            >
                View Full Details &rarr;
            </Link>
        </div>
      </div>
    );
  }, [isLoading, error, details, handleRetry, onClose]); // Dependencies for renderContent

  // Modal Title (adjust based on available data)
  const modalTitle = useMemo(() => {
      if (isLoading) return "Loading...";
      if (error) return "Error";
      return details?.name || item?.name || "Item Details"; // Use fetched name > prop name > default
  }, [isLoading, error, details, item]);

  return (
    // Ensure Modal component handles isOpen correctly internally
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {renderContent()}
    </Modal>
  );
};

export default ItemQuickLookModal;