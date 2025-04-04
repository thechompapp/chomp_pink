// src/pages/RestaurantDetail/index.jsx
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, MapPin, Phone, Globe, ExternalLink } from "lucide-react";
import DishCard from "@/components/UI/DishCard";
import Button from "@/components/Button";
import { useQuickAdd } from "@/context/QuickAddContext";
// import { API_BASE_URL } from "@/config";
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Keep for specific states if needed
import ErrorMessage from '@/components/UI/ErrorMessage';
import apiClient from '@/utils/apiClient';
import SkeletonElement from "@/components/UI/SkeletonElement"; // Import skeletons
import DishCardSkeleton from "@/components/UI/DishCardSkeleton"; // Import skeletons

// Fetch function remains the same
const fetchRestaurantDetails = async (restaurantId) => { /* ... */ };

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


const RestaurantDetail = React.memo(() => { // Wrap component
  const { id: restaurantId } = useParams();
  const { openQuickAdd } = useQuickAdd();

  const {
      data: restaurant, isLoading, isError, error, refetch
  } = useQuery({
      queryKey: ['restaurantDetails', restaurantId],
      queryFn: () => fetchRestaurantDetails(restaurantId),
      enabled: !!restaurantId,
  });

  // --- Render States ---
  if (isLoading) {
     return <RestaurantDetailSkeleton />; // Use skeleton
   }

  if (isError) {
    const allowRetry = error?.message !== "Invalid Restaurant ID provided." && error?.message !== "Restaurant not found.";
    return (
        <ErrorMessage
            message={error?.message || "Restaurant details could not be loaded."}
            onRetry={allowRetry ? refetch : undefined}
            isLoadingRetry={isLoading}
            containerClassName="py-10 px-4 max-w-lg mx-auto"
        >
             <div className="mt-4"> <Link to="/" className="text-sm text-[#D1B399] hover:underline">Back to Home</Link> </div>
          </ErrorMessage>
     );
  }

  if (!restaurant) {
       return ( /* ... Not found message ... */ );
  }

  // --- Main Render (remains the same structure) ---
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto text-gray-900">
        {/* ... Back Link ... */}
        {/* ... Header ... */}
        {/* ... Tags Display ... */}
        {/* ... Action Links ... */}
        {/* ... Dishes Section ... */}
    </div>
  );
}); // End memo wrap

export default RestaurantDetail;