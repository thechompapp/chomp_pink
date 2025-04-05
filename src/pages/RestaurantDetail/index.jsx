// src/pages/RestaurantDetail/index.jsx
import React, { useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Share2, 
  Clock, 
  DollarSign,
  Tag,
  Phone,
  Globe,
  Loader
} from 'lucide-react';
import apiClient from '@/utils/apiClient';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/Button';
import { useQuickAdd } from '@/context/QuickAddContext';
import LoadingSpinner from '@/components/UI/LoadingSpinner'; 
import ErrorMessage from '@/components/UI/ErrorMessage';
import SkeletonElement from "@/components/UI/SkeletonElement"; 
import DishCardSkeleton from "@/components/UI/DishCardSkeleton";
import DishCard from '@/components/DishCard'; // Add this import for DishCard
import { adaptDishForCard } from '@/utils/adapters';

// Fetch restaurant details with proper error handling
const fetchRestaurantDetails = async (restaurantId) => {
  if (!restaurantId) {
    return { notFound: true };
  }
  
  try {
    const response = await apiClient(`/api/restaurants/${restaurantId}`, `Restaurant Details ${restaurantId}`);
    return response || { notFound: true };
  } catch (error) {
    console.error(`Error fetching restaurant details for ID ${restaurantId}:`, error);
    return { 
      error: true, 
      message: error.message || 'Failed to load restaurant details' 
    };
  }
};

// Restaurant Detail Skeleton Structure
const RestaurantDetailSkeleton = () => (
    <div className="p-4 md:p-6 max-w-4xl mx-auto text-gray-900 animate-pulse">
        {/* Back Link Skeleton */}
        <SkeletonElement type="text" className="w-24 h-5 mb-4" />
        {/* Header Skeleton */}
        <div className="mb-4 space-y-2">
            <SkeletonElement type="title" className="w-3/4 h-8" />
            <SkeletonElement type="text" className="w-full h-5" />
        </div>
        {/* Tags Skeleton */}
        <div className="flex gap-2 flex-wrap mb-4">
            <SkeletonElement type="text" className="w-16 h-6 rounded-full" />
            <SkeletonElement type="text" className="w-20 h-6 rounded-full" />
            <SkeletonElement type="text" className="w-14 h-6 rounded-full" />
        </div>
        {/* Action Links Skeleton */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm mb-6 border-b pb-6">
            <SkeletonElement type="text" className="w-24 h-5" />
            <SkeletonElement type="text" className="w-16 h-5" />
            <SkeletonElement type="text" className="w-28 h-5" />
        </div>
        {/* Dishes Section Skeleton */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                 <SkeletonElement type="title" className="w-1/3 h-6" />
                 <SkeletonElement type="button" className="w-40 h-8" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DishCardSkeleton />
                <DishCardSkeleton />
            </div>
        </div>
    </div>
);

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const { openQuickAdd } = useQuickAdd();

  // Use React Query with fallbacks
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['restaurantDetails', id],
    queryFn: () => fetchRestaurantDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Limit retries
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const renderDish = useCallback((dish) => (
    <DishCard 
      key={dish.id} 
      {...adaptDishForCard(dish)} 
    />
  ), []);

  // Handle different states
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-10">
        <Loader className="h-8 w-8 animate-spin text-[#A78B71] mb-4" />
        <p className="text-gray-500">Loading restaurant details...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error?.message || 'Failed to load restaurant details'}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data || data.notFound) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">Not Found</h2>
          <p className="text-yellow-600 mb-4">The restaurant you are looking for does not exist.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto text-gray-900">
      {/* Back Link */}
      <Link to="/" className="flex items-center text-[#D1B399] hover:underline mb-4">
        <ArrowLeft className="mr-2" />
        Back to Home
      </Link>
      
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="text-gray-600">{data.description}</p>
      </div>
      
      {/* Tags Display */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {data.tags.map(tag => (
            <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">{tag}</span>
          ))}
        </div>
      )}
      
      {/* Action Links */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm mb-6 border-b pb-6">
        {data.phone && (
          <a href={`tel:${data.phone}`} className="flex items-center text-[#D1B399] hover:underline">
            <Phone className="mr-2" />
            {data.phone}
          </a>
        )}
        
        {data.website && (
          <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#D1B399] hover:underline">
            <Globe className="mr-2" />
            Website
          </a>
        )}
        
        {data.address && (
          <a href={`https://maps.google.com/?q=${data.address}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#D1B399] hover:underline">
            <MapPin className="mr-2" />
            {data.address}
          </a>
        )}
      </div>
      
      {/* Dishes Section */}
      {data.dishes && data.dishes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Dishes</h2>
            {isAuthenticated && (
              <Button 
                onClick={() => openQuickAdd({ 
                  type: 'restaurant', 
                  id: data.id, 
                  name: data.name 
                })}
              >
                Quick Add
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.dishes.map(renderDish)}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;