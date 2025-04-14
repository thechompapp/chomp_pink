/* src/components/ItemQuickLookModal.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/UI/Modal'; // Use alias
import { Loader2, AlertTriangle, X, Utensils, Store } from 'lucide-react';
// Corrected import paths for services using alias:
import { restaurantService } from '@/services/restaurantService';
import { dishService } from '@/services/dishService';
// Card component imports using alias:
import RestaurantCard from '@/components/UI/RestaurantCard';
import DishCard from '@/components/UI/DishCard';
// UI component imports using alias:
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button'; // Corrected import path
import { Link } from 'react-router-dom';

// Fetcher function using specific services
const fetchItemDetails = async (itemId, itemType) => { // REMOVED: Type hints
  if (!itemId || !itemType) {
      throw new Error('Item ID and Type are required for fetching details.');
  }
  try {
    if (itemType === 'restaurant') {
      const data = await restaurantService.getRestaurantDetails(itemId);
      if (!data || !data.id) throw new Error(`Restaurant with ID ${itemId} not found.`);
      return { ...data, type: itemType }; // Add type for identification in modal
    } else if (itemType === 'dish') {
      const data = await dishService.getDishDetails(itemId);
      if (!data || !data.id) throw new Error(`Dish with ID ${itemId} not found.`);
      return { ...data, type: itemType }; // Add type for identification in modal
    } else {
      throw new Error(`Unsupported item type: ${itemType}`);
    }
  } catch (error) {
    // Ensure error message is propagated
    throw new Error(error.message || `Failed to load ${itemType} details.`);
  }
};

const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize fetch parameters to prevent unnecessary refetches if item prop is stable
  const fetchParams = useMemo(() => {
      if (!isOpen || !item || !item.id || !item.type) {
          return null;
      }
      return { id: item.id, type: item.type };
  }, [isOpen, item]); // Only recompute if isOpen or item reference changes

  useEffect(() => {
      if (!fetchParams) {
           setDetails(null); // Reset state when modal closes or item is invalid
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
              if (isMounted) { // Check if component is still mounted
                  setDetails(data);
              }
          } catch (err) {
              if (isMounted) { // Check if component is still mounted
                  setError(err.message);
              }
          } finally {
              if (isMounted) { // Check if component is still mounted
                  setIsLoading(false);
              }
          }
      };

      loadDetails();

      // Cleanup function to set isMounted to false when component unmounts
      return () => {
          isMounted = false;
      };
  }, [fetchParams]); // Effect runs only when fetchParams change

  // Retry fetching data
  const handleRetry = useCallback(() => {
      if (fetchParams) {
           // Re-run the loadDetails logic on retry
          const loadDetails = async () => {
                setIsLoading(true);
                setError(null);
                setDetails(null);
                try {
                    const data = await fetchItemDetails(fetchParams.id, fetchParams.type);
                    setDetails(data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            };
            loadDetails();
      }
  }, [fetchParams]); // Dependency on fetchParams

  // Render modal content based on state
  const renderContent = useCallback(() => {
    if (isLoading) {
      return <LoadingSpinner message="Loading details..." />;
    }
    if (error) {
      // Pass retry handler and loading state to ErrorMessage
      return <ErrorMessage message={error} onRetry={handleRetry} isLoadingRetry={isLoading}>
                 <Button onClick={onClose} variant="tertiary" size="sm" className="mt-2">Close</Button>
             </ErrorMessage>;
    }
    if (!details) {
      // Handles case where fetch finished but details are still null (shouldn't happen if fetchItemDetails throws)
      return <div className="text-center text-gray-500 py-4">No details available.</div>;
    }

    // Prepare props common to both card types
    const commonCardProps = {
         id: details.id,
         name: details.name,
         tags: details.tags || [], // Ensure tags is an array
         adds: details.adds || 0, // Ensure adds is a number
    };

    return (
      <div className="space-y-4">
        {/* Conditionally render the correct card based on details.type */}
        {details.type === 'restaurant' && (
             <RestaurantCard
                {...commonCardProps}
                city={details.city_name} // Use city_name if available
                neighborhood={details.neighborhood_name} // Use neighborhood_name if available
                onQuickAdd={null} // Disable quick add within the quick look
            />
        )}
        {details.type === 'dish' && (
             <DishCard
                {...commonCardProps}
                restaurant={details.restaurant_name} // Use restaurant_name if available
                onQuickAdd={null} // Disable quick add within the quick look
            />
        )}

        {/* Link to full detail page */}
        <div className="text-center border-t border-gray-100 pt-3">
            <Link
                to={`/${details.type}/${details.id}`} // Dynamic link based on type
                onClick={onClose} // Close modal on click
                className="text-sm font-medium text-[#A78B71] hover:text-[#D1B399] hover:underline"
            >
                View Full Details →
            </Link>
        </div>
      </div>
    );
  }, [isLoading, error, details, handleRetry, onClose]); // Dependencies for renderContent

  // Determine modal title based on state
  const modalTitle = useMemo(() => {
      if (isLoading) return "Loading...";
      if (error) return "Error";
      // Use details name if available, fallback to item name, then default
      return details?.name || item?.name || "Item Details";
  }, [isLoading, error, details, item]);

  return (
    // Use the Modal component
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {renderContent()}
    </Modal>
  );
};

export default React.memo(ItemQuickLookModal); // Memoize component