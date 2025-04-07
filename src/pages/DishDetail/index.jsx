// src/pages/DishDetail/index.jsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2, Tag } from 'lucide-react';
import { dishService } from '@/services/dishService'; // Use alias
import { engagementService } from '@/services/engagementService'; // <<< Import Engagement Service
import useAuthStore from '@/stores/useAuthStore'; // Use alias
import Button from '@/components/Button'; // Use alias
import { useQuickAdd } from '@/context/QuickAddContext'; // Use alias
import ErrorMessage from '@/components/UI/ErrorMessage'; // Use alias
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Use alias

// Fetcher function using the service
const fetchDishDetails = async (dishId) => {
  if (!dishId) throw new Error("Dish ID is required");
  try {
    const data = await dishService.getDishDetails(dishId);
    // dishService throws specific error if not found
    if (!data || typeof data.id === 'undefined') { // Double-check for invalid data
         throw new Error(`Dish not found or invalid data received.`);
     }
    return data;
  } catch (error) {
    // Re-throw service errors for React Query to handle
    console.error(`[fetchDishDetails] Error fetching dish ${dishId}:`, error);
    throw error; // Re-throw the original error
  }
};

const DishDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();

  const {
    data: dish, // Renamed data to dish for clarity
    isLoading,
    isError,
    error: queryError, // Renamed error to queryError
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: ['dishDetails', id],
    queryFn: () => fetchDishDetails(id),
    enabled: !!id, // Enable query only when id is present
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: true,
  });

  // Scroll to top on component mount or when ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // <<< Log View Engagement >>>
  useEffect(() => {
    // Only log if we have a valid ID and the data has successfully loaded (or finished loading)
    if (id && !isLoading) {
      console.log(`[DishDetail] Logging view for dish ID: ${id}`);
      engagementService.logEngagement({
        item_id: parseInt(id, 10), // Ensure ID is a number
        item_type: 'dish',
        engagement_type: 'view',
      });
    }
    // Run this effect when the dish ID changes or loading completes
  }, [id, isLoading]);
  // <<< End Log View Engagement >>>


  // Handler to open Quick Add popup
  const handleAddToList = () => {
    // Ensure dish data is available before opening
    if (!dish || !dish.id) return;
    openQuickAdd({
      type: 'dish',
      id: dish.id,
      name: dish.name,
      // Ensure restaurant details are passed if available
      restaurantId: dish.restaurant_id, // Pass restaurant ID if available
      restaurantName: dish.restaurant_name, // Pass restaurant name
      tags: dish.tags || [], // Pass tags
    });
  };

  // --- Render Logic ---

  if (isLoading) {
    return <LoadingSpinner message="Loading dish details..." />;
  }

  // Handle specific 404 or other errors from the query
  if (isError) {
    // Check if the error message indicates "not found" (case-insensitive)
    const isNotFound = queryError?.message?.toLowerCase().includes('not found');
    const errorMessage = queryError?.message || 'Failed to load dish details.';
    const title = isNotFound ? 'Dish Not Found' : 'Error Loading Dish';
    const description = isNotFound
      ? "The dish you're looking for doesn't exist or has been removed."
      : errorMessage;
    const buttonText = isNotFound ? 'Back to Home' : 'Try Again';
    // Determine action based on whether it's a "not found" error or a retryable one
    const onButtonClick = isNotFound ? () => navigate('/') : refetch;
    const containerClasses = isNotFound
      ? "bg-amber-50 border border-amber-200 text-amber-700" // Specific style for not found
      : "bg-red-50 border border-red-200 text-red-700"; // General error style

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className={`${containerClasses} p-6 rounded-lg text-center`}>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="mb-4">{description}</p>
          <Button onClick={onButtonClick} variant={isNotFound ? "secondary" : "primary"} size="sm">{buttonText}</Button>
          {/* Optionally add a back button even on retryable errors */}
          {!isNotFound && <Button onClick={() => navigate(-1)} variant="tertiary" size="sm" className="ml-2">Back</Button>}
        </div>
      </div>
    );
  }

  // If query succeeded but data is somehow invalid (should ideally be caught by fetcher/service)
  if (isSuccess && !dish) {
    console.warn('[DishDetail] Rendering fallback: Query succeeded but dish data is invalid.', dish);
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ErrorMessage message="Could not load dish data.">
          <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="mt-2">Back to Home</Button>
        </ErrorMessage>
      </div>
    );
  }

  // --- Successful Render ---
  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
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
        {/* Dish Name */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-2">{dish.name || 'Unnamed Dish'}</h1>

        {/* Restaurant Link */}
        {dish.restaurant_id && (
          <Link
            to={`/restaurant/${dish.restaurant_id}`}
            className="inline-flex items-center text-[#A78B71] hover:text-[#806959] mb-4 group"
          >
            {/* Display restaurant name, fallback if needed */}
            <span className="text-lg font-medium group-hover:underline">at {dish.restaurant_name || 'Unknown Restaurant'}</span>
          </Link>
        )}

        {/* Location Info (City/Neighborhood from Restaurant) */}
        {(dish.city || dish.neighborhood) && (
          <div className="flex items-center text-gray-600 text-sm mb-4">
            <MapPin size={14} className="mr-1.5 text-gray-400 flex-shrink-0" />
            <span>{dish.neighborhood ? `${dish.neighborhood}, ${dish.city}` : dish.city || 'Unknown Location'}</span>
          </div>
        )}

        {/* Tags */}
        {Array.isArray(dish.tags) && dish.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-1.5">
              {dish.tags.map(tag => (
                <span
                  key={tag} // Use tag as key if tags are unique strings
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                >
                  {/* Optional: Icon per tag category? */}
                  {/* <Tag size={12} className="mr-1" /> */}
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-4 border-t border-gray-100 pt-4">
          {/* Add to List Button - Text changes based on auth state */}
          <Button
            onClick={isAuthenticated ? handleAddToList : () => navigate('/login')}
            variant="primary"
            size="md"
            className="flex-1 min-w-[120px]" // Ensure button doesn't get too small
            aria-label={isAuthenticated ? `Add ${dish.name} to list` : "Log in to add to list"}
          >
            {isAuthenticated ? 'Add to List' : 'Log in to Save'}
          </Button>
          {/* Share Button */}
          <Button
            variant="secondary"
            size="md"
            className="flex items-center justify-center min-w-[100px]"
            onClick={() => alert('Share function not implemented yet.')} // Basic alert
            aria-label={`Share ${dish.name}`}
          >
            <Share2 size={16} className="mr-1" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DishDetail;