/* src/pages/RestaurantDetail/index.jsx */
import React, { useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2 } from 'lucide-react'; // Removed Tag
import { restaurantService } from '@/services/restaurantService';
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import ErrorMessage from '@/components/UI/ErrorMessage'; // Keep for non-query errors
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Used by QueryResultDisplay
import QueryResultDisplay from '@/components/QueryResultDisplay'; // Import the new component
import DishCard from '@/components/UI/DishCard';
// Removed adaptDishForCard import as props seem directly compatible now

// Fetcher function (Refined to handle specific errors for QueryResultDisplay)
const fetchRestaurantDetails = async (restaurantId) => {
  if (!restaurantId) {
    const error = new Error('Restaurant ID is required.');
    error.status = 400; // Bad Request
    throw error;
  }
  try {
    const response = await restaurantService.getRestaurantDetails(restaurantId);
    // Check if service indicates not found (either via status or lack of data)
    if (!response || typeof response.id === 'undefined') {
         const error = new Error(`Restaurant not found.`);
         error.status = 404; // Not Found
         throw error;
    }
    return response;
  } catch (error) {
    // Re-throw error, ensuring status code is preserved if possible
    console.error(`[fetchRestaurantDetails] Error fetching restaurant ${restaurantId}:`, error);
    const fetchError = new Error(error.message || 'Failed to load restaurant details');
    fetchError.status = error.status || 500;
    throw fetchError;
  }
};

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated); // Use selector
  const { openQuickAdd } = useQuickAdd();

  // React Query setup
  const queryResult = useQuery({
    queryKey: ['restaurantDetails', id],
    queryFn: () => fetchRestaurantDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
        // Don't retry on 404 errors
        return error?.status !== 404 && failureCount < 1;
    },
    refetchOnWindowFocus: true,
  });

  // Scroll to top (Keep as is)
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  // Log View Engagement (Keep as is)
  useEffect(() => {
    if (id && !queryResult.isLoading) {
      console.log(`[RestaurantDetail] Logging view for restaurant ID: ${id}`);
      engagementService.logEngagement(/* ... */);
    }
  }, [id, queryResult.isLoading]);

  // Dish rendering callback (Keep as is)
  const renderDish = useCallback((dish, restaurantName) => {
      if (!dish || typeof dish.id === 'undefined') return null;
      return (
        <DishCard
          key={`dish-${dish.id}`}
          id={dish.id}
          name={dish.name}
          restaurant={restaurantName} // Pass restaurant name context
          tags={dish.tags || []}
          adds={dish.adds || 0}
          onQuickAdd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            openQuickAdd({ type: 'dish', id: dish.id, name: dish.name, restaurantName: restaurantName, tags: dish.tags || [] });
          }}
        />
      );
    }, [openQuickAdd]); // Dependency only on openQuickAdd

  // Google Maps URL calculation (Keep as is, depends on data from queryResult)
  const googleMapsUrl = useMemo(() => {
    const restaurant = queryResult.data; // Access data directly
    if (restaurant && queryResult.isSuccess) { // Check if data is valid
        // ... logic to construct URL ...
        if (restaurant.google_place_id) { /* ... */ }
        else if (restaurant.address) { /* ... */ }
        // ... etc ...
    }
    return null;
  }, [queryResult.data, queryResult.isSuccess]);

  // --- Render Logic ---

  return (
    <div className="p-3 md:p-5 max-w-4xl mx-auto text-gray-900">
      {/* Back Button (Keep outside) */}
      <button /* ... Back button ... */ >
        <ArrowLeft size={16} className="mr-1 ..." /> Back
      </button>

      <QueryResultDisplay
        queryResult={queryResult}
        loadingMessage="Loading restaurant details..."
        errorMessagePrefix="Error Loading Restaurant"
        // Custom isDataEmpty check
        isDataEmpty={(data) => !data || typeof data.id === 'undefined'}
        // Custom message for empty/not found (could check error status)
        noDataMessage={queryResult.error?.status === 404 ? "Restaurant not found." : "Restaurant details could not be loaded."}
        ErrorChildren={
             <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">
                Back to Home
             </Button>
         }
      >
        {(restaurant) => (
          // --- Successful Render Content ---
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-1">
                  {restaurant.name}
              </h1>
              {/* Location Info */}
              {(restaurant.neighborhood_name || restaurant.city_name) && (
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin size={14} className="mr-1.5 text-gray-400 flex-shrink-0" />
                  <span>
                      {`${restaurant.neighborhood_name ? restaurant.neighborhood_name + ', ' : ''}${restaurant.city_name || ''}`}
                  </span>
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
              <button onClick={() => alert('Share functionality not yet implemented.')} className="flex items-center text-[#A78B71] hover:underline group">
                <Share2 size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
                Share
              </button>
            </div>

            {/* Dishes Section */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Dishes</h2>
              {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {/* Pass restaurant name to renderDish */}
                   {restaurant.dishes.map(dish => renderDish(dish, restaurant.name))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 rounded-md bg-gray-50">
                  No dishes listed for this restaurant yet.
                </div>
              )}
            </div>
          </div>
        )}
      </QueryResultDisplay>
    </div>
  );
};

export default RestaurantDetail;