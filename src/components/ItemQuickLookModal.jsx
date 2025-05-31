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
import AddToListModal from '@/components/AddToListModal';
import { Link } from 'react-router-dom';

// Import enhanced modals
import EnhancedRestaurantModal from '@/components/modals/EnhancedRestaurantModal';
import EnhancedListModal from '@/components/modals/EnhancedListModal';
import EnhancedDishModal from '@/components/modals/EnhancedDishModal';

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

const ItemQuickLookModal = ({ 
  isOpen, 
  onClose, 
  item, 
  useEnhancedModals = false, // New prop to enable enhanced modals
  onSave,
  onShare
}) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // AddToList modal state
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

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

  // AddToList handlers
  const handleAddToList = useCallback((item) => {
    console.log('[ItemQuickLookModal] Opening AddToList modal for:', item);
    setItemToAdd({
      id: item.id,
      name: item.name,
      type: item.type
    });
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseAddToListModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`[ItemQuickLookModal] Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    // Optional: Show success notification
  }, []);

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

  // If enhanced modals are enabled and we have details, use the enhanced modals
  if (useEnhancedModals && details && !isLoading && !error) {
    if (details.type === 'restaurant') {
      return (
        <EnhancedRestaurantModal
          isOpen={isOpen}
          onClose={onClose}
          restaurant={details}
          onSave={onSave}
          onShare={onShare}
        />
      );
    } else if (details.type === 'dish') {
      return (
        <EnhancedDishModal
          isOpen={isOpen}
          onClose={onClose}
          dish={details}
          onSave={onSave}
          onShare={onShare}
        />
      );
    } else if (details.type === 'list') {
      return (
        <EnhancedListModal
          isOpen={isOpen}
          onClose={onClose}
          list={details}
          onShare={onShare}
        />
      );
    }
  }

  // Render modal content based on state (original implementation)
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
                city_name={details.city_name} // Use city_name if available
                neighborhood_name={details.neighborhood_name} // Use neighborhood_name if available
                onAddToList={() => handleAddToList({ ...details, type: 'restaurant' })}
            />
        )}
        {details.type === 'dish' && (
             <DishCard
                {...commonCardProps}
                restaurant={details.restaurant_name} // Use restaurant_name if available
                restaurant_id={details.restaurant_id}
                onAddToList={() => handleAddToList({ ...details, type: 'dish' })}
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
  }, [isLoading, error, details, handleRetry, onClose, handleAddToList]); // Dependencies for renderContent

  // Determine modal title based on state
  const modalTitle = useMemo(() => {
      if (isLoading) return "Loading...";
      if (error) return "Error";
      // Use details name if available, fallback to item name, then default
      return details?.name || item?.name || "Item Details";
  }, [isLoading, error, details, item]);

  return (
    <>
      {/* Use the Modal component */}
      <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
        {renderContent()}
      </Modal>

      {/* AddToList Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={handleCloseAddToListModal}
        itemToAdd={itemToAdd}
        onItemAdded={handleItemAdded}
      />
    </>
  );
};

export default React.memo(ItemQuickLookModal); // Memoize component