// src/pages/RestaurantDetail/index.jsx
import React, { useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Share2, Tag, Phone, Globe,
  // Removed unused icons: Star, Clock, DollarSign, Loader
} from 'lucide-react';
// Corrected import path:
import { restaurantService } from '@/services/restaurantService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
// Removed skeleton import, using LoadingSpinner instead for simplicity
// import RestaurantDetailSkeleton from './RestaurantDetailSkeleton';
import DishCard from '@/components/UI/DishCard';
import { adaptDishForCard } from '@/utils/adapters';

// Fetch restaurant details using the service
const fetchRestaurantDetails = async (restaurantId) => {
  // Removed console log
  if (!restaurantId) {
    // Return an object indicating the error, matching downstream handling
    return { error: true, message: 'Restaurant ID is required.', status: 400 };
  }

  try {
    const response = await restaurantService.getRestaurantDetails(restaurantId);
    // Service handles not found by throwing or returning specific structure
    // Assuming service throws on not found now based on service code update
    return response || { notFound: true }; // Should not be needed if service throws
  } catch (error) {
    // Removed console log
    // Return error object matching downstream handling
    return {
      error: true,
      message: error.message || 'Failed to load restaurant details',
      status: error.status || 500 // Preserve status if service added it
    };
  }
};

// Removed Skeleton Component definition (use LoadingSpinner instead)

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();

  // React Query setup (uses updated fetchRestaurantDetails)
  const {
    data,
    isLoading,
    isError: isQueryError,
    error: queryErrorObject, // Contains the error object if useQuery fails
    isSuccess,
    refetch
  } = useQuery({
    queryKey: ['restaurantDetails', id],
    queryFn: () => fetchRestaurantDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on error
    retryDelay: attemptIndex => Math.min(attemptIndex * 1000, 3000), // Exponential backoff
    // Consider adding placeholderData for smoother loading if applicable
  });

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Memoized Dish Card rendering (no change needed)
  const renderDish = useCallback((dish) => { /* ... */ }, []);

  // --- Determine Display State ---
  // Check if the data object itself indicates an error (returned from fetcher)
  const fetchError = data?.error ? data : null;
  // An error state exists if useQuery failed OR the fetcher returned an error object
  const isError = isQueryError || !!fetchError;
  // Get the message: prioritize fetcher's message, then useQuery's error object
  const errorMessage = fetchError?.message || queryErrorObject?.message || 'An unknown error occurred.';
  // Determine status code similarly
  const errorStatus = fetchError?.status || (queryErrorObject?.response?.status) || 500;
  // Check for explicit notFound flag or 404 status
  const isNotFound = data?.notFound || errorStatus === 404;
  // Data is valid if query succeeded, there's no error state, it's not 'not found', and data exists
  const hasValidData = isSuccess && !isError && !isNotFound && !!data;

  // --- Render Logic ---
  if (isLoading) {
    // Use standardized LoadingSpinner
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

  // Handle generic errors (could be 500, 403, etc.)
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
         <ErrorMessage
            message={errorMessage}
            onRetry={refetch} // Allow retry for non-404 errors
            isLoadingRetry={isLoading}
         >
             {/* Add a back button as child */}
             <Button onClick={() => navigate('/')} variant="tertiary" size="sm" className="mt-2">Back to Home</Button>
         </ErrorMessage>
      </div>
    );
  }

  // Handle potential case where loading is false, no error, but data is still missing
  if (!hasValidData) {
       return (
            <div className="container mx-auto px-4 py-8">
                 <ErrorMessage message="Could not load restaurant details.">
                     <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">Back to Home</Button>
                 </ErrorMessage>
            </div>
        );
  }

  // --- Valid Data Exists ---
  const restaurant = data;

   const handleQuickAddRestaurant = useCallback(() => { // Wrapped in useCallback
       if (restaurant?.id && restaurant?.name) {
           openQuickAdd({
               type: 'restaurant',
               id: restaurant.id,
               name: restaurant.name,
               // Pass other relevant details if needed by QuickAddPopup
               tags: restaurant.tags || [],
           });
       } else {
            console.error("[RestaurantDetail] Cannot add to list: Missing restaurant ID or name.", restaurant);
            // Maybe show a user-facing error?
       }
   }, [restaurant, openQuickAdd]); // Dependencies: restaurant object, openQuickAdd function


  // Construct Google Maps URL safely
  // Updated URL structure for place ID vs address query
   const googleMapsUrl = useMemo(() => {
        if (restaurant.google_place_id) {
            return `https://www.google.com/maps/search/?api=1&query=establishment&query_place_id=${restaurant.google_place_id}`;
        } else if (restaurant.address) { // Assuming 'address' field might exist later
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
        } else if (restaurant.name && (restaurant.city_name || restaurant.neighborhood_name)) {
             // Fallback to searching by name and location if address/placeId missing
            const query = `${restaurant.name}, ${restaurant.neighborhood_name || ''} ${restaurant.city_name || ''}`;
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim().replace(/,\s*$/, ''))}`;
        }
        return null;
    }, [restaurant.google_place_id, restaurant.address, restaurant.name, restaurant.city_name, restaurant.neighborhood_name]);


  return (
    // Reduced padding slightly for potentially smaller screens
    <div className="p-3 md:p-5 max-w-4xl mx-auto text-gray-900">
      {/* Back Link */}
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm">
        <ArrowLeft size={16} className="mr-1 group-hover:text-[#A78B71]" />
        <span className="group-hover:text-[#A78B71]">Back</span>
      </button>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
          {/* Header Section */}
          <div className="mb-4">
            {/* Restaurant Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-1">{restaurant.name}</h1>

            {/* Location String */}
            {(restaurant.neighborhood_name || restaurant.city_name) && (
               <div className="flex items-center text-gray-600 text-sm">
                 <MapPin size={14} className="mr-1.5 text-gray-400 flex-shrink-0" />
                 <span>{`${restaurant.neighborhood_name ? restaurant.neighborhood_name + ', ' : ''}${restaurant.city_name || ''}`}</span>
               </div>
            )}

            {/* Optional: Description (Add if available in schema/data) */}
            {/* {restaurant.description && ( <p className="text-gray-700 mt-2 text-sm">{restaurant.description}</p> )} */}

            {/* Optional: Rating (Add if available in schema/data) */}
            {/* {typeof restaurant.avg_rating === 'number' && ( <div className="flex items-center mt-2"> ... rating display ... </div> )} */}
          </div>

          {/* Tags Display */}
          {Array.isArray(restaurant.tags) && restaurant.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-5">
              {restaurant.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {/* <Tag size={12} className="mr-1 text-gray-500"/> */}
                    #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Links (Phone, Website, Map, Share) */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-5 border-b border-gray-100 pb-5">
            {restaurant.phone && ( // Add phone if available in schema/data
              <a href={`tel:${restaurant.phone}`} className="flex items-center text-[#A78B71] hover:underline group">
                <Phone size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
                {restaurant.phone}
              </a>
            )}
            {restaurant.website && ( // Add website if available in schema/data
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#A78B71] hover:underline group">
                <Globe size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
                Website
              </a>
            )}
            {googleMapsUrl && (
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#A78B71] hover:underline group">
                <MapPin size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
                 View Map
              </a>
            )}
             {/* Share Button (Placeholder) */}
             <button onClick={() => alert('Share functionality not yet implemented.')} className="flex items-center text-[#A78B71] hover:underline group">
                <Share2 size={14} className="mr-1.5 text-gray-400 group-hover:text-[#A78B71]" />
                Share
             </button>
          </div>

          {/* Dishes Section */}
          <div className="mb-4"> {/* Reduced bottom margin */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-800">Dishes</h2>
                {/* Quick Add Button for the Restaurant itself */}
                {isAuthenticated && (
                  <Button
                    onClick={handleQuickAddRestaurant}
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap" // Prevent wrapping on small screens
                  >
                    Add Restaurant
                  </Button>
                )}
              </div>

              {/* Check if dishes array exists and has items */}
              {Array.isArray(restaurant.dishes) && restaurant.dishes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Map through dishes and render using the memoized function */}
                    {restaurant.dishes.map(renderDish)}
                  </div>
               ) : (
                   /* Show message if no dishes */
                   <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 rounded-md bg-gray-50">
                       No dishes listed for this restaurant yet.
                   </div>
               )}
          </div>

      </div> {/* End Card */}
    </div> // End Page Container
  );
};

export default RestaurantDetail;