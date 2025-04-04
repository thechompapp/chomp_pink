// src/pages/DishDetail/index.jsx
import React from 'react'; // Removed useState, useEffect
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ThumbsUp, ThumbsDown, Minus, User } from 'lucide-react'; // Removed Loader2, AlertTriangle
import { useQuickAdd } from '@/context/QuickAddContext';
import { API_BASE_URL } from '@/config';
import Button from '@/components/Button';
// Import common UI components
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

// Keep existing fetch function
const fetchDishDetails = async (dishId) => {
    const parsedDishId = parseInt(dishId);
    if (!dishId || isNaN(parsedDishId) || parsedDishId <= 0) {
        throw new Error("Invalid Dish ID provided.");
    }
    console.log(`[fetchDishDetails] Fetching details for Dish ID: ${parsedDishId}`);
    const url = `${API_BASE_URL}/api/dishes/${parsedDishId}`;

    try {
        // Use apiClient if available and if this needs auth/401 handling
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `Failed to fetch dish details (${response.status})`;
            // Handle specific errors
             if (response.status === 404) {
                  throw new Error("Dish not found.");
             }
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            console.error(`[fetchDishDetails] API Error Status ${response.status}: ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!data || typeof data !== 'object') throw new Error("Invalid dish data received from API.");
        console.log(`[fetchDishDetails] Successfully fetched dish ${parsedDishId}.`);
        // Format data if needed
        return {
             ...data,
             tags: Array.isArray(data.tags) ? data.tags : [],
        };
    } catch (err) {
        console.error(`[fetchDishDetails] Error during fetch for dish ${parsedDishId}:`, err);
        throw new Error(err.message || `Could not load dish details.`);
    }
};


const DishDetail = () => {
  const { id: dishId } = useParams();
  const { openQuickAdd } = useQuickAdd();

  // Keep existing React Query fetch
  const {
      data: dish, isLoading, isError, error, refetch
  } = useQuery({
      queryKey: ['dishDetails', dishId],
      queryFn: () => fetchDishDetails(dishId),
      enabled: !!dishId,
  });

  // --- Updated Render States ---
  if (isLoading) {
      // Use LoadingSpinner
      return <LoadingSpinner message="Loading dish..." />;
  }

  if (isError) {
    // Use ErrorMessage
    const allowRetry = error?.message !== "Invalid Dish ID provided." && error?.message !== "Dish not found.";
    return (
        <ErrorMessage
            message={error?.message || "Dish details could not be loaded."}
            onRetry={allowRetry ? refetch : undefined}
            isLoadingRetry={isLoading}
            containerClassName="py-10 px-4 max-w-lg mx-auto" // Added padding
        >
            {/* Keep Back link */}
             <div className="mt-4">
                <Link to="/" className="text-sm text-[#D1B399] hover:underline">
                    Back to Home
                </Link>
             </div>
         </ErrorMessage>
     );
  }

  // Check if data exists after loading & no error (Keep existing)
   if (!dish) {
     return (
         <div className="p-6 max-w-3xl mx-auto text-center">
              <p className="text-gray-500 mb-4">Dish not found or data is unavailable.</p>
              <Link to="/" className="text-sm text-[#D1B399] hover:underline"> Back to Home </Link>
          </div>
      );
   }


  // --- Main Render (Keep existing structure) ---
  return (
    <div className="p-4 max-w-4xl mx-auto text-neutral-900">
      <Link to="/" className="flex items-center text-sm text-neutral-500 hover:text-neutral-800 mb-4">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Home
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 leading-tight mb-1">{dish.name}</h1>
          {/* Link to restaurant */}
          {dish.restaurant_id && dish.restaurant_name && ( <Link to={`/restaurant/${dish.restaurant_id}`} className="text-sm text-neutral-600 hover:underline"> at {dish.restaurant_name} </Link> )}
          {!dish.restaurant_id && dish.restaurant_name && ( <span className="text-sm text-neutral-600">at {dish.restaurant_name}</span> )}
        </div>
        {/* Quick Add Button */}
        <Button size="sm" onClick={() => openQuickAdd({ id: dish.id, name: dish.name, restaurant: dish.restaurant_name, tags: dish.tags, type: "dish" })}>
          + Add to List
        </Button>
      </div>

      {/* Description */}
      {dish.description && <p className="text-sm text-neutral-600 mb-4 max-w-prose">{dish.description}</p>}

      {/* Tags */}
      {Array.isArray(dish.tags) && dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {dish.tags.map((tag, i) => ( <span key={i} className="text-xs px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full border border-neutral-300"> #{tag} </span> ))}
          </div>
      )}

      {/* Mock Sections Remain */}
      {/* <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-6 shadow-sm"> The Take </div> */}
      {/* <div className="mb-6"> Featured Lists </div> */}
      {/* <div> Similar Dishes </div> */}
    </div>
  );
};

export default DishDetail;