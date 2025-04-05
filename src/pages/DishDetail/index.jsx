// src/pages/DishDetail/index.jsx
import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Share2, 
  DollarSign,
  Tag,
  Loader
} from 'lucide-react';
import apiClient from '@/utils/apiClient';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/Button';
import { useQuickAdd } from '@/context/QuickAddContext';

// Fetch dish details with proper error handling
const fetchDishDetails = async (dishId) => {
  if (!dishId) {
    return { notFound: true }; // Return a valid object instead of null
  }
  
  try {
    const response = await apiClient(`/api/dishes/${dishId}`, `Dish Details ${dishId}`);
    // Make sure we always return something (not undefined)
    return response || { notFound: true }; // Return an object with notFound flag if response is falsy
  } catch (error) {
    console.error(`Error fetching dish details for ID ${dishId}:`, error);
    // Return error object instead of throwing
    return { 
      error: true, 
      message: error.message || 'Failed to load dish details' 
    };
  }
};

const DishDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd(); // Using correct hook from context

  // Use React Query with fallbacks
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['dishDetails', id],
    queryFn: () => fetchDishDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Limit retries
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Handle different states
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-10">
        <Loader className="h-8 w-8 animate-spin text-[#A78B71] mb-4" />
        <p className="text-gray-500">Loading dish details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error?.message || 'Failed to load dish details'}</p>
          <Button onClick={() => refetch()} variant="secondary" size="sm">Try Again</Button>
        </div>
      </div>
    );
  }

  // Handle error from the data itself
  if (data && data.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{data.message}</p>
          <Button onClick={() => refetch()} variant="secondary" size="sm">Try Again</Button>
        </div>
      </div>
    );
  }

  // Handle not found or empty data
  if (!data || data.notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 text-center">
          <h2 className="text-xl font-semibold text-amber-700 mb-2">Dish Not Found</h2>
          <p className="text-amber-600 mb-4">The dish you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} variant="secondary" size="sm">Back to Home</Button>
        </div>
      </div>
    );
  }

  // Now we know we have valid dish data
  const dish = data;

  const handleAddToList = () => {
    openQuickAdd({ 
      type: 'dish', 
      id: dish.id, 
      name: dish.name, 
      restaurantId: dish.restaurant_id, 
      restaurantName: dish.restaurant_name 
    });
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} className="mr-1" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{dish.name}</h1>
        
        {/* Restaurant */}
        {dish.restaurant_id && (
          <Link 
            to={`/restaurant/${dish.restaurant_id}`} 
            className="inline-flex items-center text-[#A78B71] hover:text-[#806959] mb-4"
          >
            <span className="text-lg font-medium">at {dish.restaurant_name || 'Unknown Restaurant'}</span>
          </Link>
        )}

        {/* Location if available */}
        {dish.location && (
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin size={16} className="mr-1" />
            <span>{dish.location}</span>
          </div>
        )}

        {/* Rating */}
        {dish.avg_rating && (
          <div className="flex items-center mb-4">
            <div className="flex items-center bg-[#A78B71] text-white px-2 py-1 rounded mr-2">
              <Star size={14} className="mr-1" />
              <span className="font-medium">{Number(dish.avg_rating).toFixed(1)}</span>
            </div>
            <span className="text-gray-600 text-sm">
              {dish.review_count || 0} {dish.review_count === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}

        {/* Description */}
        {dish.description && (
          <p className="text-gray-700 mb-6">{dish.description}</p>
        )}

        {/* Price */}
        {dish.price && (
          <div className="flex items-center mb-4">
            <DollarSign size={16} className="text-gray-600 mr-1" />
            <span className="font-medium">${Number(dish.price).toFixed(2)}</span>
          </div>
        )}

        {/* Categories/Tags */}
        {dish.tags && dish.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {dish.tags.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <Tag size={12} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          <Button 
            onClick={handleAddToList} 
            variant="primary" 
            size="md"
            className="flex-1"
          >
            {isAuthenticated ? 'Add to List' : 'Log in to Save'}
          </Button>
          
          <Button variant="secondary" size="md" className="flex items-center justify-center">
            <Share2 size={16} className="mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Similar dishes section (if available) */}
      {dish.similar_dishes && dish.similar_dishes.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">Similar Dishes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dish.similar_dishes.map(similarDish => (
              <Link 
                key={similarDish.id}
                to={`/dish/${similarDish.id}`}
                className="block group"
              >
                <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 group-hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 group-hover:text-[#A78B71]">{similarDish.name}</h3>
                  <p className="text-sm text-gray-600">{similarDish.restaurant_name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DishDetail;