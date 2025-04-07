// src/pages/RestaurantDetail/index.jsx
import React, { useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2, Tag } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService'; // Use alias
import { engagementService } from '@/services/engagementService'; // <<< Import Engagement Service
import useAuthStore from '@/stores/useAuthStore'; // Use alias
import Button from '@/components/Button'; // Use alias
import { useQuickAdd } from '@/context/QuickAddContext'; // Use alias
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use alias
import DishCard from '@/components/UI/DishCard'; // Use alias
import { adaptDishForCard } from '@/utils/adapters'; // Use alias

const fetchRestaurantDetails = async (restaurantId) => {
  if (!restaurantId) return { error: true, message: 'Restaurant ID is required.', status: 400 };
  try {
    const response = await restaurantService.getRestaurantDetails(restaurantId);
    // Return an object indicating not found if service doesn't throw but returns falsy
    if (!response || typeof response.id === 'undefined') {
        return { notFound: true };
    }
    return response;
  } catch (error) {
    // If service throws an error (like 404 from apiClient), capture it
    return {
      error: true,
      message: error.message || 'Failed to load restaurant details',
      status: error.status || 500, // Pass status if available
    };
  }
};

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();

  // Fetch restaurant data
  const {
    data,
    isLoading,
    isError: isQueryError, // Keep track of React Query specific errors
    error: queryErrorObject, // Keep original error object
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ['restaurantDetails', id],
    queryFn: () => fetchRestaurantDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: true,
  });

  // Scroll to top on mount/id change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // <<< Log View Engagement >>>
  useEffect(() => {
    // Only log if we have a valid ID and the data has successfully loaded (or finished loading)
    if (id && !isLoading) {
      console.log(`[RestaurantDetail] Logging view for restaurant ID: ${id}`);
      engagementService.logEngagement({
        item_id: parseInt(id, 10), // Ensure ID is a number
        item_type: 'restaurant',
        engagement_type: 'view',
      });
    }
    // Run this effect when the restaurant ID changes or loading completes
  }, [id, isLoading]);
  // <<< End Log View Engagement >>>

  // Dish rendering callback (memoized)
  const renderDish = useCallback(
    (dish) => {
      if (!dish || typeof dish.id === 'undefined') return null;
      const cardProps = adaptDishForCard(dish); // Use adapter if necessary
      return (
        <DishCard
          key={dish.id}
          {...cardProps}
          onQuickAdd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Ensure data?.name is available when opening quick add
            openQuickAdd({ type: 'dish', id: dish.id, name: dish.name, restaurantName: data?.name || 'Restaurant', tags: dish.tags || [] });
          }}
        />
      );
    },
    [openQuickAdd, data?.name] // Depend on data.name for restaurantName context
  );

  // Google Maps URL calculation (memoized)
  const googleMapsUrl = useMemo(() => {
    const restaurant = data; // Use fetched data
    // Check if data is valid and not an error/notFound object before accessing properties
    if (restaurant && !restaurant.error && !restaurant.notFound) {
        if (restaurant.google_place_id) {
        return `https://www.google.com/maps/search/?api=1&query_place_id=${restaurant.google_place_id}`;
        } else if (restaurant.address) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
        } else if (restaurant.name && (restaurant.city_name || restaurant.neighborhood_name)) {
        const query = `${restaurant.name}, ${restaurant.neighborhood_name || ''} ${restaurant.city_name || ''}`;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim().replace(/,\s*$/, ''))}`;
        }
    }
    return null;
  }, [data]); // Depend only on data

  // Derived state for error handling and rendering logic
  const fetchError = data?.error ? data : null; // Check if data itself indicates an error
  const isError = isQueryError || !!fetchError;
  const errorMessage = fetchError?.message || queryErrorObject?.message || 'An unknown error occurred.';
  const errorStatus = fetchError?.status || (queryErrorObject?.response?.status) || 500;
  const isNotFound = data?.notFound || errorStatus === 404;
  // Ensure data is valid for rendering (not loading, no error, not explicitly 'notFound', and data exists)
  const hasValidData = !isLoading && !isError && !isNotFound && !!data;

  // --- Render Logic ---

  if (isLoading) {
    return <LoadingSpinner message="Loading restaurant details..." />;
  }

  if (isNotFound) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 text-center">
          <h2 className="text-xl font-semibold text-amber-700 mb-2">Restaurant Not Found</h2>
          <p className="text-amber-600 mb-4">The restaurant you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} variant="secondary" size="sm">Back to Home</Button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorMessage
          message={errorMessage}
          onRetry={refetch}
          isLoadingRetry={isLoading} // Pass loading state for retry button
          containerClassName="mt-6"
        >
          {/* Add a back button even for retryable errors */}
          <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="mt-2">Back</Button>
        </ErrorMessage>
      </div>
    );
  }

  // Should not happen if logic above is correct, but as a safeguard
  if (!hasValidData) {
    console.warn('[RestaurantDetail] Rendering fallback: Data is invalid after loading/error checks.', data);
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorMessage message="Could not load restaurant details.">
          <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">Back to Home</Button>
        </ErrorMessage>
      </div>
    );
  }

  // --- Successful Render ---
  const restaurant = data; // Now we know data is valid

  return (
    <div className="p-3 md:p-5 max-w-4xl mx-auto text-gray-900">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)} // Go back in history
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm"
      >
        <ArrowLeft size={16} className="mr-1 transition-colors group-hover:text-[#A78B71]" />
        <span className="transition-colors group-hover:text-[#A78B71]">Back</span>
      </button>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-1">{restaurant.name}</h1>
          {/* Location Info */}
          {(restaurant.neighborhood_name || restaurant.city_name) && (
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin size={14} className="mr-1.5 text-gray-400 flex-shrink-0" />
              <span>{`${restaurant.neighborhood_name ? restaurant.neighborhood_name + ', ' : ''}${restaurant.city_name || ''}`}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {Array.isArray(restaurant.tags) && restaurant.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-5">
            {restaurant.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Links */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-5 border-b border-gray-100 pb-5">
          {googleMapsUrl && (
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#A78B71] hover:underline group">
              <MapPin size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
              View Map
            </a>
          )}
          {/* Share Button (basic alert for now) */}
          <button
             onClick={() => alert('Share functionality not yet implemented.')}
             className="flex items-center text-[#A78B71] hover:underline group"
          >
            <Share2 size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
            Share
          </button>
          {/* Add more actions here if needed */}
        </div>

        {/* Dishes Section */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Dishes</h2>
          {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {restaurant.dishes.map(renderDish)}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 rounded-md bg-gray-50">
              No dishes listed for this restaurant yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;