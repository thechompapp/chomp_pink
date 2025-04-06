// src/pages/DishDetail/index.jsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Share2, Tag } from 'lucide-react';
import { dishService } from '@/services/dishService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import ErrorMessage from '@/components/UI/ErrorMessage';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

// Fetcher function using the service
const fetchDishDetails = async (dishId) => {
  if (!dishId) throw new Error("Dish ID is required");
  try {
    const data = await dishService.getDishDetails(dishId);
    // dishService throws specific error if not found
    return data;
  } catch (error) {
    // Re-throw service errors for React Query to handle
    throw error;
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

  const handleAddToList = () => {
    if (!dish) return; // Should not happen if rendering, but safe check
    openQuickAdd({
      type: 'dish',
      id: dish.id,
      name: dish.name,
      // Ensure restaurant details are passed if available
      restaurantId: dish.restaurant_id,
      restaurantName: dish.restaurant_name,
      tags: dish.tags || [], // Pass tags
    });
  };

  // --- Render Logic ---

  if (isLoading) {
    return <LoadingSpinner message="Loading dish details..." />;
  }

  // Handle specific 404 or other errors from the query
  if (isError) {
    const isNotFound = queryError?.message?.includes('not found');
    const errorMessage = queryError?.message || 'Failed to load dish details.';
    const title = isNotFound ? 'Dish Not Found' : 'Error Loading Dish';
    const description = isNotFound
      ? "The dish you're looking for doesn't exist or has been removed."
      : errorMessage;
    const buttonText = isNotFound ? 'Back to Home' : 'Try Again';
    const onButtonClick = isNotFound ? () => navigate('/') : refetch;
    const containerClasses = isNotFound
      ? "bg-amber-50 border border-amber-200 text-amber-700"
      : "bg-red-50 border border-red-200 text-red-700";

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

  // If query succeeded but data is somehow invalid (should be caught by service/fetcher)
  if (isSuccess && !dish) {
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
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 group text-sm"
      >
        <ArrowLeft size={16} className="mr-1 transition-colors group-hover:text-[#A78B71]" />
        <span className="transition-colors group-hover:text-[#A78B71]">Back</span>
      </button>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words mb-2">{dish.name || 'Unnamed Dish'}</h1>

        {/* Restaurant Link */}
        {dish.restaurant_id && (
          <Link
            to={`/restaurant/${dish.restaurant_id}`}
            className="inline-flex items-center text-[#A78B71] hover:text-[#806959] mb-4 group"
          >
            <span className="text-lg font-medium group-hover:underline">at {dish.restaurant_name || 'Unknown Restaurant'}</span>
          </Link>
        )}

        {/* Location Info */}
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
                  key={tag}
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
          >
            {isAuthenticated ? 'Add to List' : 'Log in to Save'}
          </Button>
          {/* Share Button */}
          <Button variant="secondary" size="md" className="flex items-center justify-center min-w-[100px]" onClick={() => alert('Share function not implemented yet.')}>
            <Share2 size={16} className="mr-1" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DishDetail;