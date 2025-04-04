// src/pages/DishDetail/index.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useQuickAdd } from '@/context/QuickAddContext';
// import { API_BASE_URL } from '@/config';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Keep for specific states if needed
import ErrorMessage from '@/components/UI/ErrorMessage';
import apiClient from '@/utils/apiClient';
import SkeletonElement from '@/components/UI/SkeletonElement'; // Import skeleton

// Fetch function remains the same
const fetchDishDetails = async (dishId) => { /* ... */ };

// Dish Detail Skeleton Structure
const DishDetailSkeleton = () => (
    <div className="p-4 max-w-4xl mx-auto text-neutral-900 animate-pulse">
        {/* Back link skeleton */}
        <SkeletonElement type="text" className="w-24 h-5 mb-4" />
        {/* Header Skeleton */}
        <div className="flex items-start justify-between mb-4">
             <div className="space-y-2">
                <SkeletonElement type="title" className="w-64 h-8" />
                <SkeletonElement type="text" className="w-48 h-5" />
             </div>
             <SkeletonElement type="button" className="w-28 h-9" />
        </div>
        {/* Tags Skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
            <SkeletonElement type="text" className="w-16 h-6 rounded-full" />
            <SkeletonElement type="text" className="w-20 h-6 rounded-full" />
            <SkeletonElement type="text" className="w-14 h-6 rounded-full" />
        </div>
    </div>
);

const DishDetail = React.memo(() => { // Wrap component
  const { id: dishId } = useParams();
  const { openQuickAdd } = useQuickAdd();

  const {
      data: dish, isLoading, isError, error, refetch
  } = useQuery({
      queryKey: ['dishDetails', dishId],
      queryFn: () => fetchDishDetails(dishId),
      enabled: !!dishId,
  });

  // --- Updated Render States ---
  if (isLoading) {
      return <DishDetailSkeleton />; // Use skeleton
  }

  if (isError) {
    // ... Error handling remains the same ...
     const allowRetry = error?.message !== "Invalid Dish ID provided." && error?.message !== "Dish not found.";
      return ( <ErrorMessage message={error?.message || "..."} onRetry={allowRetry ? refetch : undefined}>...</ErrorMessage> );
  }

  if (!dish) {
     // ... Not found message remains the same ...
     return ( <div className="p-6 ...">...</div> );
  }

  // --- Main Render (remains the same structure) ---
  return (
    <div className="p-4 max-w-4xl mx-auto text-neutral-900">
      {/* ... Back Link ... */}
      {/* ... Header ... */}
      {/* ... Tags ... */}
    </div>
  );
}); // End memo wrap

export default DishDetail;