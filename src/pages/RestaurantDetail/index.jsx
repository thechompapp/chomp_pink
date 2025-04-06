/* src/pages/RestaurantDetail/index.jsx */
import React, { useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Share2, Tag, Phone, Globe,
} from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import DishCard from '@/components/UI/DishCard';
import { adaptDishForCard } from '@/utils/adapters';

// Fetcher function (no changes)
const fetchRestaurantDetails = async (restaurantId) => {
  if (!restaurantId) {
    return { error: true, message: 'Restaurant ID is required.', status: 400 };
  }
  try {
    const response = await restaurantService.getRestaurantDetails(restaurantId);
    return response || { notFound: true };
  } catch (error) {
    return {
      error: true,
      message: error.message || 'Failed to load restaurant details',
      status: error.status || 500
    };
  }
};

const RestaurantDetail = () => {
  // --- Hooks called unconditionally at the top ---
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated); // Keep this if needed elsewhere
  const { openQuickAdd } = useQuickAdd();

  // React Query setup
  const {
    data,
    isLoading,
    isError: isQueryError,
    error: queryErrorObject,
    isSuccess,
    refetch
  } = useQuery({
    queryKey: ['restaurantDetails', id],
    queryFn: () => fetchRestaurantDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: attemptIndex => Math.min(attemptIndex * 1000, 3000),
  });

  // Scroll to top effect
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Memoized Dish Card rendering
  const renderDish = useCallback((dish) => {
    if (!dish || typeof dish.id === 'undefined') return null;
    const cardProps = adaptDishForCard(dish);
    return (
      <DishCard
        key={dish.id}
        {...cardProps}
        // Pass Quick Add handler specifically for dishes
        onQuickAdd={(e) => {
           e.stopPropagation();
           e.preventDefault();
           // Make sure data?.name exists before trying to use it
           openQuickAdd({ type: 'dish', id: dish.id, name: dish.name, restaurantName: data?.name || 'Restaurant', tags: dish.tags || [] });
        }}
      />
    );
  }, [openQuickAdd, data?.name]); // Add data?.name as dependency

  // Memoized Google Maps URL generation
  const googleMapsUrl = useMemo(() => {
    const restaurant = data;
    if (restaurant?.google_place_id) {
        // Using updated URL format from previous review
        return `https://www.google.com/maps/search/?api=1&query=establishment&query_place_id=${restaurant.google_place_id}`;
    } else if (restaurant?.address) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
    } else if (restaurant?.name && (restaurant.city_name || restaurant.neighborhood_name)) {
        const query = `${restaurant.name}, ${restaurant.neighborhood_name || ''} ${restaurant.city_name || ''}`;
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim().replace(/,\s*$/, ''))}`;
    }
    return null;
  }, [data?.google_place_id, data?.address, data?.name, data?.city_name, data?.neighborhood_name]);

  // REMOVED handleQuickAddRestaurant callback as the button is removed

  // --- Determine Display State ---
  const fetchError = data?.error ? data : null;
  const isError = isQueryError || !!fetchError;
  const errorMessage = fetchError?.message || queryErrorObject?.message || 'An unknown error occurred.';
  const errorStatus = fetchError?.status || (queryErrorObject?.response?.status) || 500;
  const isNotFound = data?.notFound || errorStatus === 404;
  const hasValidData = !isLoading && !isError && !isNotFound && !!data;

  // --- Render Logic ---

  if (isLoading) {
    return <LoadingSpinner message="Loading restaurant details..." />;
  }

   if (isNotFound) {
     return (
       <div className="container mx-auto px-4 py-8">
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
      <div className="container mx-auto px-4 py-8">
         <ErrorMessage
            message={errorMessage}
            onRetry={refetch}
            isLoadingRetry={isLoading}
         >
             <Button onClick={() => navigate('/')} variant="tertiary" size="sm" className="mt-2">Back to Home</Button>
         </ErrorMessage>
      </div>
    );
  }

  if (!hasValidData) {
       return (
            <div className="container mx-auto px-4 py-8">
                 <ErrorMessage message="Could not load restaurant details.">
                     <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">Back to Home</Button>
                 </ErrorMessage>
            </div>
        );
  }

  // --- Valid Data Render ---
  const restaurant = data;

  return (
    <div className="p-3 md:p-5 max-w-4xl mx-auto text-gray-900">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm">
        <ArrowLeft size={16} className="mr-1 group-hover:text-[#A78B71]" />
        <span className="group-hover:text-[#A78B71]">Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-1">{restaurant.name}</h1>
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
              {restaurant.tags.map(tag => ( <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">#{tag}</span> ))}
            </div>
          )}

          {/* Action Links */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-5 border-b border-gray-100 pb-5">
            {restaurant.phone && ( <a href={`tel:${restaurant.phone}`} className="flex items-center text-[#A78B71] hover:underline group"> <Phone size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" /> {restaurant.phone} </a> )}
            {restaurant.website && ( <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#A78B71] hover:underline group"> <Globe size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" /> Website </a> )}
            {googleMapsUrl && ( <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#A78B71] hover:underline group"> <MapPin size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" /> View Map </a> )}
             <button onClick={() => alert('Share functionality not yet implemented.')} className="flex items-center text-[#A78B71] hover:underline group"> <Share2 size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" /> Share </button>
          </div>

          {/* Dishes Section */}
          <div className="mb-4">
              {/* MODIFIED: Removed the header div containing the button */}
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Dishes</h2>
              {/* END MODIFICATION */}

              {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {restaurant.dishes.map(renderDish)}
                  </div>
               ) : (
                   <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 rounded-md bg-gray-50"> No dishes listed for this restaurant yet. </div>
               )}
          </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;