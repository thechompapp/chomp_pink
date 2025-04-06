/* src/components/ItemQuickLookModal.jsx */
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
import Button from '@/components/Button'; // Use alias
import { Link } from 'react-router-dom';

// Fetcher function using specific services
const fetchItemDetails = async (itemId, itemType) => {
  if (!itemId || !itemType) {
      throw new Error('Item ID and Type are required for fetching details.');
  }
  try {
    if (itemType === 'restaurant') {
      // Use the correctly imported service
      const data = await restaurantService.getRestaurantDetails(itemId);
      if (!data || !data.id) throw new Error(`Restaurant with ID ${itemId} not found.`);
      return { ...data, type: itemType };
    } else if (itemType === 'dish') {
      // Use the correctly imported service
      const data = await dishService.getDishDetails(itemId);
      if (!data || !data.id) throw new Error(`Dish with ID ${itemId} not found.`);
      return { ...data, type: itemType };
    } else {
      throw new Error(`Unsupported item type: ${itemType}`);
    }
  } catch (error) {
    throw new Error(error.message || `Failed to load ${itemType} details.`);
  }
};

const ItemQuickLookModal = ({ isOpen, onClose, item }) => {
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchParams = useMemo(() => {
      if (!isOpen || !item || !item.id || !item.type) {
          return null;
      }
      return { id: item.id, type: item.type };
  }, [isOpen, item]);

  useEffect(() => {
      if (!fetchParams) {
           setDetails(null);
           setError(null);
           setIsLoading(false);
          return;
      }

      let isMounted = true;
      const loadDetails = async () => {
          setIsLoading(true);
          setError(null);
          setDetails(null);
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

      return () => {
          isMounted = false;
      };
  }, [fetchParams]);

  const handleRetry = useCallback(() => {
      if (fetchParams) {
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
  }, [fetchParams]);

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
      return <div className="text-center text-gray-500 py-4">No details available.</div>;
    }

    const commonCardProps = {
         id: details.id,
         name: details.name,
         tags: details.tags || [],
         adds: details.adds || 0,
    };

    return (
      <div className="space-y-4">
        {details.type === 'restaurant' && (
             <RestaurantCard
                {...commonCardProps}
                city={details.city_name}
                neighborhood={details.neighborhood_name}
                onQuickAdd={null}
            />
        )}
        {details.type === 'dish' && (
             <DishCard
                {...commonCardProps}
                restaurant={details.restaurant_name}
                onQuickAdd={null}
            />
        )}

        <div className="text-center border-t border-gray-100 pt-3">
            <Link
                to={`/${details.type}/${details.id}`}
                onClick={onClose}
                className="text-sm font-medium text-[#A78B71] hover:text-[#D1B399] hover:underline"
            >
                View Full Details →
            </Link>
        </div>
      </div>
    );
  }, [isLoading, error, details, handleRetry, onClose]);

  const modalTitle = useMemo(() => {
      if (isLoading) return "Loading...";
      if (error) return "Error";
      return details?.name || item?.name || "Item Details";
  }, [isLoading, error, details, item]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {renderContent()}
    </Modal>
  );
};

export default ItemQuickLookModal;